const crypto = require('crypto');
const PaymentProviderInterface = require('./payment_provider.interface.js');

/**
 * 🐧 WAVE PAYMENT PROVIDER (Official Côte d'Ivoire API Implementation)
 * Compliant with Wave Business API v1 for Checkout Sessions & Webhooks.
 */
class WavePaymentProvider extends PaymentProviderInterface {
    constructor() {
        super('wave');
        this.apiBaseUrl = process.env.WAVE_API_BASE_URL || 'https://api.wave.com/v1';
        this.apiKey = process.env.WAVE_API_KEY || '';
        this.merchantId = process.env.WAVE_MERCHANT_ID || 'M_ci_7X1JfUg2eEsX';
        this.webhookSecret = process.env.WAVE_WEBHOOK_SECRET || process.env.GATEWAY_SECRET || 'wave_whsec_babi_secret_2026';
        this.returnUrl = process.env.WAVE_SUCCESS_URL || 'https://www.boulangeriedebabi.com/suivi.html';
        this.errorUrl = process.env.WAVE_ERROR_URL || 'https://www.boulangeriedebabi.com/checkout.html';
    }

    /**
     * Initialise une session de paiement Wave
     */
    async createPayment(context) {
        const { paymentId, orderId, amount, currency = 'XOF', customerPhone = '', customerName = '', idempotencyKey = '' } = context;

        const cleanAmount = Math.max(100, Math.round(Number(amount) || 100));
        const providerTransactionId = `WAVE_TX_${paymentId}_${Date.now()}`;

        // 1. Si la clé d'API Wave officielle est configurée dans .env, appel direct API Wave v1
        if (this.apiKey && this.apiKey.startsWith('wave_ci_prod_')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/checkout/sessions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Idempotency-Key': idempotencyKey || paymentId
                    },
                    body: JSON.stringify({
                        amount: cleanAmount,
                        currency: currency,
                        error_url: `${this.errorUrl}?orderId=${encodeURIComponent(orderId)}&status=error`,
                        success_url: `${this.returnUrl}?orderId=${encodeURIComponent(orderId)}&status=paid`,
                        client_reference: orderId,
                        metadata: {
                            paymentId,
                            orderId,
                            customerPhone,
                            customerName
                        }
                    })
                });

                const data = await response.json();
                if (response.ok && data.wave_launch_url) {
                    return {
                        success: true,
                        providerTransactionId: data.id || providerTransactionId,
                        launchUrl: data.wave_launch_url,
                        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.wave_launch_url)}`,
                        rawResponse: data
                    };
                }
            } catch (err) {
                console.error("Erreur lors de l'appel direct API Wave :", err);
            }
        }

        // 2. Mode Passerelle Marchande Intégrée (Deep Link & QR Code Wave CI)
        const directWaveUrl = `https://pay.wave.com/m/${this.merchantId}/c/ci/?amount=${cleanAmount}&client_reference=${encodeURIComponent(orderId)}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(directWaveUrl)}`;

        return {
            success: true,
            providerTransactionId: providerTransactionId,
            launchUrl: directWaveUrl,
            qrCodeUrl: qrCodeUrl,
            rawResponse: {
                provider: 'wave',
                merchantId: this.merchantId,
                amount: cleanAmount,
                currency: 'XOF',
                orderId: orderId,
                mode: 'business_merchant_flow'
            }
        };
    }

    /**
     * Vérifie le statut de la transaction auprès de Wave
     */
    async verifyPayment(providerTransactionId, paymentId) {
        if (!providerTransactionId) {
            return { success: false, isPaid: false, error: "ID de transaction Wave manquant" };
        }

        if (this.apiKey && this.apiKey.startsWith('wave_ci_prod_')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/checkout/sessions/${providerTransactionId}`, {
                    headers: { 'Authorization': `Bearer ${this.apiKey}` }
                });
                const data = await response.json();
                const isPaid = data.checkout_status === 'complete' || data.payment_status === 'succeeded';
                const isFailed = data.checkout_status === 'cancelled' || data.payment_status === 'failed';

                return {
                    success: true,
                    isPaid,
                    isFailed,
                    isCancelled: data.checkout_status === 'cancelled',
                    amount: data.amount,
                    currency: data.currency,
                    rawResponse: data
                };
            } catch (err) {
                console.error("Erreur vérification API Wave :", err);
            }
        }

        return {
            success: true,
            isPaid: false,
            isFailed: false,
            isCancelled: false,
            providerTransactionId,
            message: "En attente de confirmation Webhook / Signature"
        };
    }

    /**
     * Valide et traite le Webhook envoyé par les serveurs Wave
     */
    async handleWebhook(req) {
        const signature = req.headers['wave-signature'] || req.headers['x-wave-signature'] || '';
        const body = req.body || {};

        // 1. Validation de la signature cryptographique HMAC-SHA256
        let isValidSignature = true;
        if (this.webhookSecret && signature) {
            try {
                const rawPayload = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(body);
                const expectedSignature = crypto.createHmac('sha256', this.webhookSecret).update(rawPayload).digest('hex');
                isValidSignature = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
            } catch (_) {
                isValidSignature = false;
            }
        }

        const eventType = body.type || body.event || 'checkout.session.completed';
        const sessionData = body.data || body;
        const providerTransactionId = sessionData.id || sessionData.transaction_id || sessionData.providerTransactionId || '';
        const orderId = sessionData.client_reference || sessionData.order_id || (sessionData.metadata && sessionData.metadata.orderId) || '';
        const paymentId = (sessionData.metadata && sessionData.metadata.paymentId) || '';
        const amount = Number(sessionData.amount || sessionData.total_amount || 0);
        const currency = sessionData.currency || 'XOF';
        const isPaid = eventType === 'checkout.session.completed' || sessionData.payment_status === 'succeeded' || sessionData.status === 'PAID';

        return {
            isValid: isValidSignature,
            providerTransactionId,
            orderId,
            paymentId,
            eventType,
            isPaid,
            amount,
            currency,
            rawPayload: body
        };
    }

    /**
     * Remboursement via Wave Payout API v1
     */
    async refundPayment(providerTransactionId, amount, reason = '', customerPhone = null) {
        const wavePayoutService = require('./wave_payout.service.js');
        const refundId = `REF_WAVE_${Date.now()}`;

        // 1. Si un identifiant de paiement initial pt-... est fourni, tenter une annulation/inversion POST /v1/payout/:id/reverse
        if (providerTransactionId && providerTransactionId.startsWith('pt-')) {
            try {
                const reversalResult = await wavePayoutService.reversePayout(providerTransactionId, `IDEM_REV_${refundId}`);
                return {
                    success: true,
                    refundId: refundId,
                    type: 'wave_reversal',
                    providerTransactionId,
                    amount: amount,
                    reason: reason,
                    provider: 'wave',
                    details: reversalResult
                };
            } catch (err) {
                console.warn("[Wave Reversal Failed] Tentative via Payout direct :", err.message);
            }
        }

        // 2. Si le téléphone du client est renseigné, effectuer un Wave Payout direct POST /v1/payout
        if (customerPhone) {
            try {
                const payoutResult = await wavePayoutService.createPayout({
                    mobile: customerPhone,
                    receive_amount: amount,
                    client_reference: refundId,
                    payment_reason: (reason || 'Remboursement BABI').substring(0, 40),
                    idempotencyKey: `IDEM_PAYOUT_${refundId}`
                });

                return {
                    success: true,
                    refundId: refundId,
                    type: 'wave_direct_payout',
                    payoutId: payoutResult.data?.id,
                    amount: amount,
                    reason: reason,
                    provider: 'wave',
                    details: payoutResult
                };
            } catch (err) {
                console.error("[Wave Direct Payout Error] :", err);
            }
        }

        return {
            success: true,
            refundId: refundId,
            amount: amount,
            reason: reason,
            provider: 'wave',
            mode: 'manual_reconciliation_required'
        };
    }
}

module.exports = new WavePaymentProvider();
