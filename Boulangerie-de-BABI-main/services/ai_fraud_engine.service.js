/**
 * 🤖 AI FRAUD SENTINEL SERVICE (Moteur IA Anti-Fraude en Temps Réel)
 * Détection comportementale, vélocité IP/téléphone, détection bots et auto-quarantaine.
 */
class AiFraudEngineService {
    constructor() {
        this.ipVelocityMap = new Map(); // IP -> [timestamps]
        this.phoneVelocityMap = new Map(); // Phone -> [timestamps]
        this.quarantineIpSet = new Map(); // IP -> expirationTimestamp
        this.averageBasketAmount = 4500; // FCFA
    }

    /**
     * Vérifie si une IP est actuellement en quarantaine
     */
    isIpQuarantined(ip) {
        const expiresAt = this.quarantineIpSet.get(ip);
        if (!expiresAt) return false;
        if (Date.now() > expiresAt) {
            this.quarantineIpSet.delete(ip);
            return false;
        }
        return true;
    }

    /**
     * Met une IP suspecte en quarantaine automatique (ex: 30 minutes)
     */
    quarantineIp(ip, durationMinutes = 30) {
        const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
        this.quarantineIpSet.set(ip, expiresAt);
    }

    /**
     * Analyse en temps réel et calcul du score de risque IA (0 à 100)
     */
    evaluateRisk(transactionData, req) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const now = Date.now();

        if (this.isIpQuarantined(ip)) {
            return {
                riskScore: 100,
                riskLevel: 'CRITIQUE',
                decision: 'BLOCKED',
                flags: ['IP_CURRENTLY_IN_QUARANTINE'],
                message: "Accès refusé : adresse IP en quarantaine de sécurité."
            };
        }

        let riskScore = 4; // Base score pour client légitime
        const flags = [];

        // 1. Analyse de Vélocité IP (Anti-Spam / DDoS)
        const ipHistory = (this.ipVelocityMap.get(ip) || []).filter(t => now - t < 120000);
        ipHistory.push(now);
        this.ipVelocityMap.set(ip, ipHistory);
        if (ipHistory.length > 5) {
            riskScore += 55;
            flags.push('AGGRESSIVE_IP_VELOCITY');
            this.quarantineIp(ip, 15); // Auto-quarantine 15 mins
        } else if (ipHistory.length > 3) {
            riskScore += 25;
            flags.push('MODERATE_IP_BURST');
        }

        // 2. Analyse de Vélocité Téléphone
        if (transactionData && transactionData.phone) {
            const cleanPhone = transactionData.phone.replace(/\D/g, '');
            const phoneHistory = (this.phoneVelocityMap.get(cleanPhone) || []).filter(t => now - t < 300000);
            phoneHistory.push(now);
            this.phoneVelocityMap.set(cleanPhone, phoneHistory);
            if (phoneHistory.length > 3) {
                riskScore += 30;
                flags.push('REPEATED_PHONE_PAYMENT_ATTEMPTS');
            }
        }

        // 3. Détection Bad Bots & Scanners automatisés
        const botSignatures = ['sqlmap', 'nikto', 'burp', 'headless', 'python-requests', 'curl', 'wget', 'postman', 'puppeteer', 'selenium', 'gobuster'];
        for (const sig of botSignatures) {
            if (userAgent.includes(sig)) {
                riskScore += 70;
                flags.push(`AUTOMATED_SECURITY_SCANNER_DETECTED_${sig.toUpperCase()}`);
                this.quarantineIp(ip, 60);
                break;
            }
        }

        // 4. Détection d'Anomalie de Montant par rapport au panier moyen
        const amount = Number(transactionData.amount || transactionData.total_price || 0);
        if (amount > this.averageBasketAmount * 30 && transactionData.type_retrait !== 'evenement') {
            riskScore += 20;
            flags.push('ABNORMAL_AMOUNT_SPIKE');
        }

        // Normalisation
        riskScore = Math.min(100, Math.max(0, riskScore));
        let riskLevel = 'FAIBLE';
        let decision = 'ALLOW';

        if (riskScore >= 70) {
            riskLevel = 'ÉLEVÉ';
            decision = 'MANUAL_REVIEW_REQUIRED';
        } else if (riskScore >= 25) {
            riskLevel = 'MODÉRÉ';
            decision = 'CHALLENGE_PIN_CONFIRMATION';
        }

        return {
            riskScore,
            riskLevel,
            decision,
            flags,
            timestamp: new Date().toISOString(),
            ipAddress: ip
        };
    }
}

module.exports = new AiFraudEngineService();
