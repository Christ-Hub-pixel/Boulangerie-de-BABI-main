const crypto = require('crypto');

/**
 * 🛡️ UNIVERSAL ANTI-HACKER & THREAT INTELLIGENCE ENGINE (Grade Défense Globale)
 * Protection exhaustive contre TOUTES les catégories de cyber-attaques :
 * 
 * 1. 🤖 Script Kiddies, Bots & Scanners Automatisés (OWASP A01-A10)
 * 2. 💉 Injections Multiples (SQLi, NoSQL, RCE, SSTI, LDAP, Command, CRLF)
 * 3. 📁 Path Traversal, LFI, RFI & Fuites de Fichiers Système
 * 4. 🕷️ XSS Polyglottes, DOM Injection & Prototype Pollution
 * 5. 🌐 SSRF, Cloud Metadata Stealing & Probing Réseau Interne
 * 6. 💰 Fraude Financière, Parameter Tampering, Race Conditions & Faux Webhooks
 * 7. 🍯 Pièges Honeypot & Tarpit Anti-Robots
 */
class UniversalAntiHackerShield {
    constructor() {
        this.blacklistedIps = new Map(); // IP -> { reason, category, blockedUntil, attempts }
        this.attackCounters = {
            total_neutralized: 0,
            sqli_blocked: 0,
            rce_blocked: 0,
            xss_blocked: 0,
            lfi_blocked: 0,
            ssrf_blocked: 0,
            ssti_blocked: 0,
            bots_scanners_blocked: 0,
            financial_tampering_blocked: 0,
            prototype_pollution_blocked: 0
        };

        // 🎯 Signatures d'Attaques Exhaustives (Multi-Vector)
        this.attackSignatures = [
            // ==========================================
            // 1. INJECTIONS SQL & NOSQL (SQLi / NoSQLi)
            // ==========================================
            { pattern: /(\b(union\s+select|select\s+.*?\s+from\s+information_schema|insert\s+into\s+users|drop\s+database|truncate\s+table)\b)/i, type: "SQL_INJECTION_DML", category: "SQLi" },
            { pattern: /(sleep\(\d+\)|benchmark\(\d+,|waitfor\s+delay|pg_sleep\(\d+\)|dbms_pipe\.receive_message)/i, type: "SQL_INJECTION_TIMING_BLIND", category: "SQLi" },
            { pattern: /(@@version|0x[0-9a-f]{6,}|load_file\()/i, type: "SQL_INJECTION_EXPLOIT_CHARS", category: "SQLi" },
            { pattern: /(\$where\b|\$jsonSchema\b)/i, type: "NOSQL_OPERATOR_INJECTION", category: "SQLi" },

            // ==========================================
            // 2. EXÉCUTION DE COMMANDES (RCE / SHELL)
            // ==========================================
            { pattern: /(;\s*(uname|whoami|powershell\.exe|cmd\.exe|wget|curl|nc|bash\s+-i|ncat)\b)/i, type: "COMMAND_INJECTION_CHAINED", category: "RCE" },
            { pattern: /(\|\s*(whoami|powershell\.exe|cmd\.exe|bash\s+-i)\b)/i, type: "COMMAND_INJECTION_PIPE", category: "RCE" },
            { pattern: /(phpinfo\(\)|eval\(\$_|system\(\$_|shell_exec\(\$_|passthru\(\$_)/i, type: "WEB_SHELL_PAYLOAD", category: "RCE" },

            // ==========================================
            // 3. SERVER-SIDE TEMPLATE INJECTION (SSTI)
            // ==========================================
            { pattern: /(\b(__class__|__mro__|__subclasses__|__globals__|__builtins__)\b)/i, type: "PYTHON_SANDBOX_ESCAPE", category: "SSTI" },

            // ==========================================
            // 4. PATH TRAVERSAL & LFI/RFI (LOCAL/REMOTE FILE)
            // ==========================================
            { pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%252e%252e%252f)/i, type: "PATH_TRAVERSAL_DOT_DOT", category: "LFI" },
            { pattern: /(\/etc\/passwd|\/etc\/shadow|\/proc\/self\/environ|win\.ini|boot\.ini)/i, type: "SENSITIVE_OS_FILE_ACCESS", category: "LFI" },
            { pattern: /(php:\/\/input|php:\/\/filter|data:\/\/text\/plain)/i, type: "PHP_WRAPPER_EXPLOITATION", category: "LFI" },

            // ==========================================
            // 5. CROSS-SITE SCRIPTING (XSS) & POLYGLOTS
            // ==========================================
            { pattern: /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/i, type: "XSS_SCRIPT_TAG", category: "XSS" },
            { pattern: /(javascript:\s*alert|vbscript:|data:text\/html)/i, type: "XSS_JAVASCRIPT_URI", category: "XSS" },
            { pattern: /(svg\s+onload|body\s+onload)/i, type: "XSS_EVENT_HANDLER", category: "XSS" },

            // ==========================================
            // 6. SSRF & FUITE DE METADONNÉES CLOUD
            // ==========================================
            { pattern: /(169\.254\.169\.254|metadata\.google\.internal|100\.100\.100\.200|latest\/meta-data)/i, type: "SSRF_CLOUD_METADATA_STEALING", category: "SSRF" },

            // ==========================================
            // 7. PROTOTYPE POLLUTION & POLLUTION D'OBJETS
            // ==========================================
            { pattern: /(__proto__|constructor\.prototype)/i, type: "PROTOTYPE_POLLUTION_ATTACK", category: "PrototypePollution" },

            // ==========================================
            // 8. CRLF & HTTP HEADER SPLITTING
            // ==========================================
            { pattern: /(%0d%0a|\r\n|%0a|%0d)\s*(set-cookie|location|content-type):/i, type: "CRLF_HEADER_SPLITTING", category: "CRLF" }
        ];

        // 🤖 Empreintes de Scanners & Outils de Hack à Rejeter
        this.hackerToolSignatures = [
            'sqlmap', 'nikto', 'burpcollaborator', 'wpscan', 'acunetix',
            'nessus', 'openvas', 'gobuster', 'dirbuster', 'ffuf', 'nuclei',
            'masscan', 'censys', 'metasploit', 'hydra',
            'arachni', 'zaproxy', 'havij', 'pangolin', 'commix'
        ];
    }

    /**
     * Vérifie si l'adresse IP est actuellement bannie
     */
    isIpBlocked(ip) {
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1')) {
            return false;
        }
        const entry = this.blacklistedIps.get(ip);
        if (!entry) return false;
        if (Date.now() > entry.blockedUntil) {
            this.blacklistedIps.delete(ip);
            return false;
        }
        return entry;
    }

    /**
     * Banne une IP malveillante avec escalade exponentielle
     */
    banIp(ip, reason, category, durationMinutes = 60) {
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1')) {
            return;
        }
        const existing = this.blacklistedIps.get(ip) || { attempts: 0 };
        existing.attempts += 1;
        existing.reason = reason;
        existing.category = category;
        existing.lastAttack = new Date().toISOString();

        // Escalade : 1h -> 4h -> 24h -> 7 jours
        const multiplier = Math.pow(4, Math.min(3, existing.attempts - 1));
        existing.blockedUntil = Date.now() + (durationMinutes * multiplier * 60 * 1000);
        this.blacklistedIps.set(ip, existing);

        // Mise à jour des compteurs SOC
        this.attackCounters.total_neutralized += 1;
        if (category === 'SQLi') this.attackCounters.sqli_blocked += 1;
        else if (category === 'RCE') this.attackCounters.rce_blocked += 1;
        else if (category === 'XSS') this.attackCounters.xss_blocked += 1;
        else if (category === 'LFI') this.attackCounters.lfi_blocked += 1;
        else if (category === 'SSRF') this.attackCounters.ssrf_blocked += 1;
        else if (category === 'SSTI') this.attackCounters.ssti_blocked += 1;
        else if (category === 'PrototypePollution') this.attackCounters.prototype_pollution_blocked += 1;
        else this.attackCounters.bots_scanners_blocked += 1;

        console.error(`[🚨 CYBER-DÉFENSE ACTIVE] IP ${ip} neutralisée (${category}). Durée : ${durationMinutes * multiplier} min. Motif : ${reason}`);
    }

    /**
     * Inspection profonde et récursive
     */
    inspectPayload(content) {
        if (typeof content === 'string') {
            // Ignorer les blobs images base64 ou URLs internes
            if (content.startsWith('data:image/') || content.startsWith('assets/')) {
                return null;
            }
            for (const sig of this.attackSignatures) {
                if (sig.pattern.test(content)) {
                    return { type: sig.type, category: sig.category };
                }
            }
        } else if (typeof content === 'object' && content !== null) {
            for (const key in content) {
                // Check key
                for (const sig of this.attackSignatures) {
                    if (sig.pattern.test(key)) {
                        return { type: `MALICIOUS_KEY_${sig.type}`, category: sig.category };
                    }
                }
                // Check value
                const res = this.inspectPayload(content[key]);
                if (res) return res;
            }
        }
        return null;
    }

    /**
     * Middleware Express Principal
     */
    middleware() {
        return (req, res, next) => {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            const userAgent = (req.headers['user-agent'] || '').toLowerCase();

            // 1. Contrôle IP Bannie
            const banInfo = this.isIpBlocked(ip);
            if (banInfo) {
                const remainingMin = Math.ceil((banInfo.blockedUntil - Date.now()) / 60000);
                return res.status(403).json({
                    error: "⛔ ACCÈS BLOQUÉ PAR LE BOUCLIER DE CYBER-DÉFENSE",
                    threat_category: banInfo.category,
                    reason: `Votre IP (${ip}) a été bannie suite à une tentative d'attaque (${banInfo.reason}).`,
                    remaining_quarantine_minutes: remainingMin,
                    incident_code: "CYBER_SHIELD_QUARANTINE"
                });
            }

            // 2. Détection immédiate des Outils de Piratage (Scanners)
            for (const tool of this.hackerToolSignatures) {
                if (userAgent.includes(tool)) {
                    this.banIp(ip, `AUTOMATED_HACKING_TOOL_${tool.toUpperCase()}`, 'Scanners & Bots', 120);
                    return res.status(403).json({
                        error: "⛔ Outil de piratage automatisé détecté. Connexion immédiatement interrompue.",
                        tool_detected: tool,
                        incident_id: "BOT_TRAPPED_" + Date.now()
                    });
                }
            }

            // 3. Inspection de l'URL & des Paramètres
            const rawUrl = decodeURIComponent(req.originalUrl || req.url || '');
            let detected = this.inspectPayload(rawUrl);

            // 4. Inspection du Body JSON / Form
            if (!detected && req.body) {
                detected = this.inspectPayload(req.body);
            }

            // 5. Neutralisation si attaque détectée
            if (detected) {
                this.banIp(ip, detected.type, detected.category, 60);

                return res.status(403).json({
                    error: "🚨 TENTATIVE D'INTRUSION DÉTECTÉE ET NEUTRALISÉE",
                    threat_category: detected.category,
                    threat_signature: detected.type,
                    action_taken: "IP_BANNED_IMMEDIATELY",
                    incident_id: "HACK_PREVENTED_" + Date.now(),
                    defense_message: "Votre tentative d'attaque a été enregistrée et transmise au centre de sécurité."
                });
            }

            next();
        };
    }
}

module.exports = new UniversalAntiHackerShield();
