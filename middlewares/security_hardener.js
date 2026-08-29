/**
 * 🛡️ SECURITY HARDENER MIDDLEWARE (WAF & Blindage Réseau Souverain)
 */

function securityHardener(req, res, next) {
    // 1. En-têtes HTTP de Grade Défense
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');
    
    // Obfuscation de la stack technologique
    res.removeHeader('X-Powered-By');

    // 2. Détection et blocage immédiat des Scanners de vulnérabilité & Bad Bots
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const forbiddenTools = ['sqlmap', 'nikto', 'burpcollaborator', 'wpscan', 'acunetix', 'nessus', 'openvas'];
    
    for (const tool of forbiddenTools) {
        if (userAgent.includes(tool)) {
            return res.status(403).json({
                error: "⛔ Requête bloquée par le pare-feu défensif IA (Scanner de vulnérabilité détecté).",
                threat_code: "SECURITY_SCANNER_REJECTED"
            });
        }
    }

    // 3. Assainissement récursif des entrées
    if (req.body) req.body = deepSanitize(req.body);
    if (req.query) req.query = deepSanitize(req.query);

    next();
}

function deepSanitize(data) {
    if (typeof data === 'string') {
        if (data.startsWith('data:image/') || data.startsWith('blob:') || data.startsWith('assets/')) {
            return data;
        }
        return data
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/onload=/gi, '')
            .replace(/onerror=/gi, '')
            .replace(/[<>]/g, c => ({ '<': '&lt;', '>': '&gt;' }[c] || c))
            .trim();
    } else if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                delete data[key]; // Neutralisation Prototype Pollution
                continue;
            }
            data[key] = deepSanitize(data[key]);
        }
    }
    return data;
}

module.exports = securityHardener;
