/**
 * 🍯 HONEYTOKEN & ACTIVE DECEPTION SERVICE (Grade Défense)
 * Déploiement de faux endpoints et pièges leurres pour capturer
 * et bannir instantanément tout attaquant ou scanner automatisé.
 */
class HoneytokenService {
    constructor() {
        this.trappedAttackers = new Map(); // IP -> { attempts, lastTrapped, userAgent, path }
        this.honeyPaths = [
            '/.env',
            '/wp-login.php',
            '/admin-dump',
            '/debug-keys',
            '/api/v1/secrets',
            '/config.json.bak',
            '/phpmyadmin'
        ];
    }

    /**
     * Vérifie si l'URL demandée est un leurre / honeytoken
     */
    isHoneyPath(path) {
        if (!path) return false;
        const normalized = path.toLowerCase().trim();
        return this.honeyPaths.some(hp => normalized.startsWith(hp) || normalized.includes(hp));
    }

    /**
     * Piège et enregistre l'attaquant
     */
    trapAttacker(req, path) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown Attacker';

        const existing = this.trappedAttackers.get(ip) || { attempts: 0, firstTrapped: new Date().toISOString() };
        existing.attempts += 1;
        existing.lastTrapped = new Date().toISOString();
        existing.userAgent = userAgent;
        existing.lastPath = path;

        this.trappedAttackers.set(ip, existing);

        console.warn(`[🚨 HONEYTOKEN TRAP TRIGGERED] IP Attaquant piégée : ${ip} (Chemin : ${path})`);
        return existing;
    }

    /**
     * Liste des attaquants capturés pour le SOC
     */
    getTrappedList() {
        const list = [];
        this.trappedAttackers.forEach((val, ip) => {
            list.push({ ip, ...val });
        });
        return list;
    }
}

module.exports = new HoneytokenService();
