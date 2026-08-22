/**
 * 💳 PAYMENT PROVIDER ABSTRACT INTERFACE
 * Standard contract for all payment providers (Wave, Orange Money, MTN MoMo, Moov, Card, Cash).
 * Allows hot-plugging new payment gateways without modifying business core.
 */
class PaymentProviderInterface {
    constructor(providerName) {
        if (new.target === PaymentProviderInterface) {
            throw new TypeError("Cannot instantiate abstract class PaymentProviderInterface directly.");
        }
        this.providerName = providerName;
    }

    /**
     * Creates a checkout session with the payment provider
     * @param {Object} paymentContext - { paymentId, orderId, amount, currency, customerPhone, customerName, idempotencyKey }
     * @returns {Promise<Object>} - { success, providerTransactionId, launchUrl, qrCodeUrl, rawResponse }
     */
    async createPayment(paymentContext) {
        throw new Error("Method 'createPayment()' must be implemented.");
    }

    /**
     * Verifies the live payment status with the provider's server
     * @param {string} providerTransactionId
     * @param {string} paymentId
     * @returns {Promise<Object>} - { success, isPaid, isFailed, isCancelled, amount, currency, rawResponse }
     */
    async verifyPayment(providerTransactionId, paymentId) {
        throw new Error("Method 'verifyPayment()' must be implemented.");
    }

    /**
     * Validates and parses incoming webhook payload from provider
     * @param {Object} req - Express request object (headers, body, rawBody)
     * @returns {Promise<Object>} - { isValid, providerTransactionId, orderId, paymentId, eventType, amount, currency, rawPayload }
     */
    async handleWebhook(req) {
        throw new Error("Method 'handleWebhook()' must be implemented.");
    }

    /**
     * Refunds an existing payment
     * @param {string} providerTransactionId
     * @param {number} amount
     * @param {string} reason
     * @returns {Promise<Object>} - { success, refundId, rawResponse }
     */
    async refundPayment(providerTransactionId, amount, reason) {
        throw new Error("Method 'refundPayment()' must be implemented.");
    }
}

module.exports = PaymentProviderInterface;
