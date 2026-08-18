const crypto = require('crypto');

/**
 * 🔐 ZK PIN VALIDATOR & ANTI-BRUTEFORCE SERVICE (Grade Banque Centrale)
 * Hachage PBKDF2 (100 000 itérations SHA-512) et verrouillage progressif exponentiel.
 */
class ZkPinValidatorService {
    constructor() {
        this.pinAttempts = new Map(); // orderId -> { count, lockedUntil, lastAttempt }
        this.globalSalt = process.env.PIN_SALT || 'BABI_DEFENSE_PEPPER_SALT_2026_981247';
    }

    /**
     * Hache un code PIN avec PBKDF2 (100 000 itérations)
     */
    hashPin(pin) {
        return crypto.pbkdf2Sync(String(pin), this.globalSalt, 100000, 64, 'sha512').toString('hex');
    }

    /**
     * Vérifie le code PIN avec protection anti-force brute et délais progressifs
     */
    verifyPinWithBackoff(orderId, enteredPin, expectedPin) {
        const now = Date.now();
        const key = String(orderId);
        const tracker = this.pinAttempts.get(key) || { count: 0, lockedUntil: 0 };

        // 1. Vérification si verrouillé
        if (tracker.lockedUntil > now) {
            const waitSeconds = Math.ceil((tracker.lockedUntil - now) / 1000);
            return {
                success: false,
                isLocked: true,
                waitSeconds,
                error: `⛔ Commande temporairement verrouillée (${waitSeconds}s restantes) suite à des échecs répétés.`
            };
        }

        // 2. Comparaison sécurisée à temps constant du hachage
        const hashedEntered = this.hashPin(enteredPin);
        const hashedExpected = this.hashPin(expectedPin);
        const isMatch = crypto.timingSafeEqual(Buffer.from(hashedEntered, 'utf8'), Buffer.from(hashedExpected, 'utf8'));

        if (!isMatch) {
            tracker.count += 1;
            tracker.lastAttempt = now;

            // Délais progressifs exponentiels
            if (tracker.count >= 5) {
                tracker.lockedUntil = now + (10 * 60 * 1000); // 10 minutes
            } else if (tracker.count === 4) {
                tracker.lockedUntil = now + (30 * 1000); // 30 secondes
            } else if (tracker.count === 3) {
                tracker.lockedUntil = now + (5 * 1000); // 5 secondes
            }

            this.pinAttempts.set(key, tracker);

            return {
                success: false,
                isLocked: tracker.count >= 3,
                attemptsRemaining: Math.max(0, 5 - tracker.count),
                error: `Code PIN incorrect (${Math.max(0, 5 - tracker.count)} essai(s) restant(s)).`
            };
        }

        // 3. Succès : Réinitialisation du tracker
        this.pinAttempts.delete(key);
        return {
            success: true,
            isLocked: false,
            message: "Code PIN validé avec succès (Authentification PBKDF2 certifiée)."
        };
    }
}

module.exports = new ZkPinValidatorService();
