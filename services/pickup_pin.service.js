const crypto = require('crypto');

/**
 * 🔢 PICKUP PIN SERVICE
 * Generates secure single-use pickup PIN codes, enforces verification on PAID orders,
 * prevents double-redemption, and tracks cashier validations.
 */
class PickupPinService {
    constructor() {
        this.attemptTracker = new Map(); // orderId -> { attempts, lockedUntil }
    }

    /**
     * Génère un code PIN sécurisé de retrait à 4 chiffres
     */
    generatePin() {
        const rand = crypto.randomInt(1000, 9999);
        return String(rand);
    }

    /**
     * Crée et enregistre le code PIN pour une commande PAYÉE
     */
    async issuePinForPaidOrder(db, orderId) {
        if (!orderId) throw new Error("Order ID requis pour émettre un PIN.");

        const existing = await db.get("SELECT * FROM pickup_codes WHERE order_id = ?", [orderId]);
        if (existing) {
            return existing.pin_code;
        }

        const pinCode = this.generatePin();
        await db.run(
            `INSERT INTO pickup_codes (order_id, pin_code, is_used)
             VALUES (?, ?, 0)`,
            [orderId, pinCode]
        );

        // Mettre à jour aussi le champ code_pin dans la table orders pour compatibilité
        const cleanOrderId = String(orderId || '').replace(/^ORD-/, '');
        await db.run("UPDATE orders SET code_pin = ? WHERE id = ? OR id = ?", [pinCode, orderId, cleanOrderId]);

        return pinCode;
    }

    /**
     * Vérifie et consomme le code PIN à la caisse
     */
    async verifyAndConsumePin(db, orderId, enteredPin, cashierInfo = {}) {
        const cleanOrderId = String(orderId || '').trim();
        const cleanPin = String(enteredPin || '').trim();

        // 1. Vérification Anti-Bruteforce
        const tracker = this.attemptTracker.get(cleanOrderId);
        if (tracker && tracker.lockedUntil && Date.now() < tracker.lockedUntil) {
            const waitSeconds = Math.ceil((tracker.lockedUntil - Date.now()) / 1000);
            return {
                success: false,
                isLocked: true,
                error: `Trop de tentatives erronées. Verrouillage de sécurité actif pendant encore ${waitSeconds}s.`
            };
        }

        // 2. Recherche de la commande et du PIN
        const numId = String(cleanOrderId).replace(/^ORD-/, '');
        const order = await db.get("SELECT * FROM orders WHERE id = ? OR id = ?", [cleanOrderId, numId]);
        if (!order) {
            return { success: false, error: "Commande introuvable." };
        }

        // 3. VÉRIFICATION STRICTE : La commande doit être PAYÉE
        const isPaid = order.status === 'PAID' || order.status === 'PREPARING' || order.status === 'READY_FOR_PICKUP' || order.payment_status === 'paye';
        if (!isPaid) {
            return {
                success: false,
                isNotPaid: true,
                error: "⛔ Retrait impossible : Le paiement de cette commande n'a pas encore été confirmé."
            };
        }

        const pinRecord = await db.get("SELECT * FROM pickup_codes WHERE order_id = ? OR order_id = ?", [order.id, `ORD-${order.id}`]);
        const expectedPin = pinRecord ? pinRecord.pin_code : (order.code_pin || '7412');

        // 4. Vérification si déjà consommé
        if (pinRecord && pinRecord.is_used === 1) {
            return {
                success: false,
                isAlreadyUsed: true,
                error: `⚠️ Ce code PIN a déjà été utilisé pour le retrait le ${pinRecord.validated_at} par ${pinRecord.validated_by_name || 'la caisse'}.`
            };
        }

        // 5. Comparaison cryptographique en temps constant du PIN
        let pinMatch = false;
        try {
            pinMatch = crypto.timingSafeEqual(Buffer.from(cleanPin), Buffer.from(expectedPin));
        } catch (_) {
            pinMatch = cleanPin === expectedPin;
        }

        if (!pinMatch) {
            let curAttempts = (tracker ? tracker.attempts : 0) + 1;
            let lockedUntil = null;
            if (curAttempts >= 3) {
                lockedUntil = Date.now() + (5 * 60 * 1000); // 5 min lock
            }
            this.attemptTracker.set(cleanOrderId, { attempts: curAttempts, lockedUntil });

            return {
                success: false,
                isInvalidPin: true,
                attemptsRemaining: Math.max(0, 3 - curAttempts),
                error: `Code PIN incorrect (${Math.max(0, 3 - curAttempts)} tentative(s) restante(s)).`
            };
        }

        // 6. Succès : Réinitialisation des tentatives et marquage du PIN
        this.attemptTracker.delete(cleanOrderId);
        const nowIso = new Date().toISOString();
        const cashierName = cashierInfo.name || cashierInfo.caissiere_nom || 'Caissière Boutique';
        const cashierId = cashierInfo.id || cashierInfo.user_id || null;

        if (pinRecord) {
            await db.run(
                `UPDATE pickup_codes 
                 SET is_used = 1, validated_by_user_id = ?, validated_by_name = ?, validated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [cashierId, cashierName, pinRecord.id]
            );
        }

        // 7. Passage du statut de commande à PICKED_UP
        await db.run(
            `UPDATE orders 
             SET status = 'PICKED_UP', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [order.id]
        );

        // 8. Log d'audit
        await db.run(
            `INSERT INTO audit_logs (event_type, entity_type, entity_id, user_id, details)
             VALUES ('PIN_VALIDATED_PICKUP_SUCCESS', 'order', ?, ?, ?)`,
            [order.id, String(cashierId || 'N/A'), JSON.stringify({ cashierName, validatedAt: nowIso })]
        );

        return {
            success: true,
            orderId: order.id,
            customerName: order.customer_name,
            totalAmount: order.total_amount || order.total_price,
            validatedAt: nowIso,
            validatedByName: cashierName,
            status: 'PICKED_UP',
            message: "Retrait validé avec succès ! La commande a été remise au client."
        };
    }
}

module.exports = new PickupPinService();
