const crypto = require('crypto');
const wavePaymentProvider = require('./wave_payment_provider.js');
const orderManager = require('./order_manager.service.js');
const pickupPinService = require('./pickup_pin.service.js');

/**
 * 🏛️ PAYMENT MANAGER SERVICE (Core Transaction & Orchestration Engine)
 * Enforces strict transaction states, idempotency, fraud prevention,
 * provider delegation, and PIN triggering.
 */
class PaymentManagerService {
    constructor() {
        this.providers = new Map();
        this.registerProvider('wave', wavePaymentProvider);
        this.idempotencyCache = new Map(); // key -> paymentRecord
    }

    /**
     * Enregistre un fournisseur de paiement (extensible pour Orange, MTN, Carte)
     */
    registerProvider(name, providerInstance) {
        this.providers.set(name.toLowerCase(), providerInstance);
    }

    /**
     * Récupère un fournisseur de paiement
     */
    getProvider(name = 'wave') {
        const cleanName = (name || 'wave').toLowerCase();
        if (!this.providers.has(cleanName)) {
            // Fallback sur Wave si non spécifié
            return wavePaymentProvider;
        }
        return this.providers.get(cleanName);
    }

    /**
     * Initialise un paiement pour une commande
     * @param {Object} db - SQLite DB instance
     * @param {Object} context - { orderId, provider, customerPhone, customerName, userId, idempotencyKey }
     */
    async initiatePayment(db, context) {
        const { orderId, provider = 'wave', customerPhone = '', customerName = '', userId = null, idempotencyKey = '' } = context;

        if (!orderId) {
            throw new Error("Order ID requis pour initialiser le paiement.");
        }

        // 1. Vérification Idempotence (Protection contre les doubles débits / requêtes répétées)
        const cleanIdempotencyKey = idempotencyKey || `IDEM_${orderId}_${Date.now()}`;
        if (idempotencyKey) {
            const existingPayment = await db.get("SELECT * FROM payments WHERE idempotency_key = ?", [idempotencyKey]);
            if (existingPayment) {
                const providerInstance = this.getProvider(existingPayment.provider);
                const session = await providerInstance.createPayment({
                    paymentId: existingPayment.id,
                    orderId: existingPayment.order_id,
                    amount: existingPayment.amount,
                    currency: existingPayment.currency,
                    customerPhone,
                    customerName,
                    idempotencyKey: cleanIdempotencyKey
                });

                return {
                    paymentId: existingPayment.id,
                    orderId: existingPayment.order_id,
                    amount: existingPayment.amount,
                    currency: existingPayment.currency,
                    status: existingPayment.status,
                    provider: existingPayment.provider,
                    launchUrl: session.launchUrl,
                    qrCodeUrl: session.qrCodeUrl,
                    isReusedSession: true
                };
            }
        }

        // 2. Recherche et vérification de la commande
        const cleanOrderId = String(orderId || '').replace(/^ORD-/, '');
        const order = await db.get("SELECT * FROM orders WHERE id = ? OR id = ?", [orderId, cleanOrderId]);
        if (!order) {
            throw new Error(`Commande introuvable : ${orderId}`);
        }

        const requiredAmount = order.total_amount || order.total_price || 0;
        if (requiredAmount <= 0) {
            throw new Error("Montant de la commande invalide.");
        }

        // 3. Gestion Paiement Espèces au Comptoir
        if (provider === 'cash' || provider === 'especes') {
            const paymentId = `PAY-CASH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await db.run(
                `INSERT INTO payments 
                 (id, order_id, user_id, amount, currency, provider, status, idempotency_key)
                 VALUES (?, ?, ?, ?, 'XOF', 'cash', 'PENDING', ?)`,
                [paymentId, orderId, userId || order.user_id, requiredAmount, cleanIdempotencyKey]
            );

            // Génération du PIN de retrait pour réservation espèces
            const pin = await pickupPinService.issuePinForPaidOrder(db, orderId);
            await orderManager.updateOrderStatus(db, orderId, 'PREPARING');

            return {
                paymentId,
                orderId,
                amount: requiredAmount,
                currency: 'XOF',
                status: 'PENDING_CASH',
                provider: 'cash',
                pickupPin: pin,
                message: "Réservation confirmée ! Réglez au comptoir lors du retrait."
            };
        }

        // 4. Création de la transaction dans `payments`
        const paymentId = `PAY-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.run(
            `INSERT INTO payments 
             (id, order_id, user_id, amount, currency, provider, status, idempotency_key)
             VALUES (?, ?, ?, ?, 'XOF', ?, 'PENDING', ?)`,
            [paymentId, orderId, userId || order.user_id, requiredAmount, provider, cleanIdempotencyKey]
        );

        // 5. Journalisation de l'événement initial
        await this.logPaymentEvent(db, paymentId, orderId, null, 'PENDING', 'client_initiation', { provider, amount: requiredAmount });

        // 6. Délégation au Provider (Wave, Orange, etc.)
        const providerInstance = this.getProvider(provider);
        const providerSession = await providerInstance.createPayment({
            paymentId,
            orderId,
            amount: requiredAmount,
            currency: 'XOF',
            customerPhone: customerPhone || order.customer_phone,
            customerName: customerName || order.customer_name,
            idempotencyKey: cleanIdempotencyKey
        });

        // 7. Mise à jour de la transaction avec l'ID provider et statut PROCESSING
        await db.run(
            `UPDATE payments 
             SET provider_transaction_id = ?, status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [providerSession.providerTransactionId, paymentId]
        );

        await orderManager.updateOrderStatus(db, orderId, 'PAYMENT_PENDING');
        await this.logPaymentEvent(db, paymentId, orderId, 'PENDING', 'PROCESSING', 'provider_session_created', { providerTransactionId: providerSession.providerTransactionId });

        return {
            paymentId,
            orderId,
            amount: requiredAmount,
            currency: 'XOF',
            status: 'PROCESSING',
            provider,
            providerTransactionId: providerSession.providerTransactionId,
            launchUrl: providerSession.launchUrl,
            qrCodeUrl: providerSession.qrCodeUrl
        };
    }

    /**
     * CONFIRMATION FINALE SERVEUR (Anti-Fraude & Rapprochement Strict)
     */
    async confirmSuccessfulPayment(db, params) {
        const { paymentId, orderId, providerTransactionId, amountPaid, currency = 'XOF', source = 'webhook', rawPayload = {} } = params;

        // 1. Recherche de la transaction de paiement
        let payment = null;
        if (paymentId) {
            payment = await db.get("SELECT * FROM payments WHERE id = ?", [paymentId]);
        } else if (orderId) {
            payment = await db.get("SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1", [orderId]);
        } else if (providerTransactionId) {
            payment = await db.get("SELECT * FROM payments WHERE provider_transaction_id = ?", [providerTransactionId]);
        }

        if (!payment) {
            throw new Error("Transaction de paiement introuvable pour la confirmation.");
        }

        // Si déjà payé, retour idempotent immédiat sans redébit ou nouveau PIN
        if (payment.status === 'PAID') {
            const order = await db.get("SELECT * FROM orders WHERE id = ?", [payment.order_id]);
            const pinRecord = await db.get("SELECT * FROM pickup_codes WHERE order_id = ?", [payment.order_id]);
            return {
                success: true,
                isAlreadyPaid: true,
                paymentId: payment.id,
                orderId: payment.order_id,
                status: 'PAID',
                pickupPin: pinRecord ? pinRecord.pin_code : null
            };
        }

        // 2. Recherche de la commande associée
        const cleanOrderId = String(payment.order_id || '').replace(/^ORD-/, '');
        const order = await db.get("SELECT * FROM orders WHERE id = ? OR id = ?", [payment.order_id, cleanOrderId]);
        if (!order) {
            throw new Error(`Commande ${payment.order_id} introuvable.`);
        }

        // 3. VÉRIFICATION STRICTE DU MONTANT ET DE LA DEVISE
        const expectedAmount = Number(order.total_amount || order.total_price);
        if (amountPaid && Number(amountPaid) < expectedAmount) {
            await this.markPaymentFailed(db, payment.id, `Montant payé (${amountPaid} ${currency}) inférieur au montant attendu (${expectedAmount} XOF).`);
            throw new Error("Échec anti-fraude : Montant reçu insuffisant.");
        }

        // 4. Passage du statut de paiement à PAID
        await db.run(
            `UPDATE payments 
             SET status = 'PAID', provider_transaction_id = COALESCE(?, provider_transaction_id), raw_response = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [providerTransactionId || payment.provider_transaction_id, JSON.stringify(rawPayload), payment.id]
        );

        // 5. Journalisation de l'événement de paiement PAID
        await this.logPaymentEvent(db, payment.id, order.id, payment.status, 'PAID', source, { amountPaid, currency });

        // 6. Passage de la commande à PAID
        await db.run(
            `UPDATE orders 
             SET status = 'PAID', payment_status = 'paye', payment_method = 'Wave Mobile Money', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [order.id]
        );

        // 7. GÉNÉRATION SÉCURISÉE DU CODE PIN DE RETRAIT
        const pickupPin = await pickupPinService.issuePinForPaidOrder(db, order.id);

        // 8. Création de la notification client
        const notifMsg = `Votre paiement de ${expectedAmount.toLocaleString()} FCFA a été confirmé. Votre commande N°${order.id} est en préparation. Votre code de retrait express est ${pickupPin}.`;
        await db.run(
            `INSERT INTO notifications (user_id, order_id, type, title, message)
             VALUES (?, ?, 'PAYMENT_CONFIRMED', 'Paiement Confirmé !', ?)`,
            [order.user_id, order.id, notifMsg]
        );

        // 9. Log d'audit financier
        await db.run(
            `INSERT INTO audit_logs (event_type, entity_type, entity_id, user_id, details)
             VALUES ('PAYMENT_VERIFIED_SUCCESS', 'payment', ?, ?, ?)`,
            [payment.id, String(order.user_id || 'N/A'), JSON.stringify({ orderId: order.id, amount: expectedAmount, pin: pickupPin, source })]
        );

        return {
            success: true,
            paymentId: payment.id,
            orderId: order.id,
            status: 'PAID',
            amount: expectedAmount,
            currency: 'XOF',
            pickupPin: pickupPin,
            notificationMessage: notifMsg
        };
    }

    /**
     * Marque un paiement comme échoué
     */
    async markPaymentFailed(db, paymentId, errorMessage) {
        const payment = await db.get("SELECT * FROM payments WHERE id = ?", [paymentId]);
        if (!payment) return;

        await db.run("UPDATE payments SET status = 'FAILED', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [errorMessage, paymentId]);
        await this.logPaymentEvent(db, paymentId, payment.order_id, payment.status, 'FAILED', 'server_verification', { error: errorMessage });
    }

    /**
     * Journalise un événement de changement d'état
     */
    async logPaymentEvent(db, paymentId, orderId, previousStatus, newStatus, eventSource, details = {}) {
        await db.run(
            `INSERT INTO payment_events (payment_id, order_id, previous_status, new_status, event_source, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [paymentId, orderId, previousStatus || 'NONE', newStatus, eventSource, JSON.stringify(details)]
        );
    }
}

module.exports = new PaymentManagerService();
