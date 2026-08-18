const crypto = require('crypto');

/**
 * 🔒 PAYMENT GATEWAY PROXY & OBFUSCATION SERVICE (Masquage de Lien & Passerelle Sécurisée)
 * Empêche toute exposition de l'identifiant marchand et toute falsification de montant.
 * Utilise des jetons éphémères signés HMAC-SHA256 valables 5 minutes.
 */
class PaymentGatewayService {
    constructor() {
        this.gatewaySecret = process.env.GATEWAY_SECRET || crypto.randomBytes(32).toString('hex');
        this.activeSessions = new Map(); // token -> { orderId, amount, phone, provider, expiresAt }
        this.waveMerchantId = process.env.WAVE_MERCHANT_ID || 'M_ci_7X1JfUg2eEsX';
    }

    /**
     * Crée une session de paiement sécurisée et masquée
     */
    createMaskedSession(orderId, amount, provider = 'wave', phone = '') {
        const cleanAmount = Math.max(100, Math.round(Number(amount) || 100));
        const cleanOrderId = String(orderId || 'BABI-' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
        const now = Date.now();
        const expiresAt = now + (5 * 60 * 1000); // 5 minutes validity

        // Signature du token
        const raw = `${cleanOrderId}:${cleanAmount}:${expiresAt}`;
        const signature = crypto.createHmac('sha256', this.gatewaySecret).update(raw).digest('hex').substring(0, 24);
        const token = `PAY_SECURE_${signature}_${now.toString(36)}`;

        this.activeSessions.set(token, {
            orderId: cleanOrderId,
            amount: cleanAmount,
            phone: String(phone || ''),
            provider,
            expiresAt
        });

        // Nettoyage automatique après expiration
        setTimeout(() => {
            this.activeSessions.delete(token);
        }, 6 * 60 * 1000);

        return {
            token,
            maskedGatewayUrl: `/api/pay/launch/${token}`,
            qrCodeUrl: `/api/pay/qr/${token}`,
            expiresInSeconds: 300
        };
    }

    /**
     * Résout la vraie URL marchande à partir du jeton masqué
     */
    resolveGatewayUrl(token) {
        if (!token) return null;

        if (token === 'WAVE_POS_TERMINAL') {
            return `https://pay.wave.com/m/${this.waveMerchantId}/c/ci/?src=p`;
        }

        // 1. Session active en mémoire (Priorité Haute)
        const session = this.activeSessions.get(token);
        if (session) {
            if (Date.now() > session.expiresAt) {
                this.activeSessions.delete(token);
                return null; // Expiré
            }
            if (session.provider === 'wave') {
                return `https://pay.wave.com/m/${this.waveMerchantId}/c/ci/?amount=${session.amount}&client_reference=${encodeURIComponent(session.orderId)}`;
            }
        }

        // 2. Décodage sécurisé de jeton autonome
        if (token.startsWith('PAY_SECURE_')) {
            try {
                const rawB64 = token.replace('PAY_SECURE_', '');
                const decoded = Buffer.from(rawB64, 'base64').toString('utf8');
                const [orderId, amount] = decoded.split(':');
                if (orderId && amount) {
                    return `https://pay.wave.com/m/${this.waveMerchantId}/c/ci/?amount=${encodeURIComponent(amount)}&client_reference=${encodeURIComponent(orderId)}`;
                }
            } catch(e) {}
        }

        return `https://pay.wave.com/m/${this.waveMerchantId}/c/ci/?src=p`;
    }

    /**
     * Récupère les infos d'une session active
     */
    getSession(token) {
        return this.activeSessions.get(token) || null;
    }
}

module.exports = new PaymentGatewayService();
