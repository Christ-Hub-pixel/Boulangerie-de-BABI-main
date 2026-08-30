/**
 * 🧠 BOULANGERIE AI — CONTEXT & MULTI-TURN MEMORY MANAGER
 * Maintien du contexte de session et résolution des requêtes conversationnelles liées
 */

class AiContextManagerService {
    constructor() {
        this.sessions = new Map();
        this.sessionTTL = 1000 * 60 * 60; // 1 heure d'inactivité
    }

    /**
     * Récupère ou initialise une session de conversation
     */
    getSession(sessionId = 'default') {
        let session = this.sessions.get(sessionId);
        const now = Date.now();

        if (!session || (now - session.lastActivity > this.sessionTTL)) {
            session = {
                id: sessionId,
                createdAt: now,
                lastActivity: now,
                history: [],
                activeTopic: null,        // 'SALES', 'STOCKS', 'ORDERS', 'PRODUCTS', 'REPORTS'
                lastTargetPeriod: 'today', // 'today', 'yesterday', 'this_week', 'this_month'
                lastTargetProduct: null,
                lastEntities: {}
            };
            this.sessions.set(sessionId, session);
        } else {
            session.lastActivity = now;
        }

        return session;
    }

    /**
     * Enregistre un tour de dialogue dans l'historique de session
     */
    recordTurn(sessionId = 'default', userPrompt = '', aiReply = '', topic = null, entities = {}) {
        const session = this.getSession(sessionId);
        session.history.push({
            userPrompt,
            aiReply,
            topic,
            timestamp: new Date().toISOString()
        });

        if (session.history.length > 20) {
            session.history.shift(); // Garder les 20 derniers tours
        }

        if (topic) session.activeTopic = topic;
        if (entities) {
            session.lastEntities = { ...session.lastEntities, ...entities };
            if (entities.period) session.lastTargetPeriod = entities.period;
            if (entities.product) session.lastTargetProduct = entities.product;
        }

        session.lastActivity = Date.now();
    }

    /**
     * Résout les références anaphoriques / questions courtes ("Et hier ?", "Compare les deux", "Pourquoi ?")
     */
    resolveFollowUpContext(sessionId = 'default', prompt = '') {
        const session = this.getSession(sessionId);
        const q = (prompt || '').toLowerCase().trim();

        // 1. "Et hier ?" ou "Et ce mois ?"
        if (q.startsWith('et hier') || q === 'hier' || q === 'et hier ?' || q.includes('pour hier')) {
            return {
                isFollowUp: true,
                resolvedTopic: session.activeTopic || 'SALES',
                resolvedPeriod: 'yesterday',
                resolvedAction: 'COMPARE_OR_SHOW_YESTERDAY',
                contextualPrompt: `Donne-moi les ${session.activeTopic === 'STOCKS' ? 'stocks' : 'ventes'} d'hier.`
            };
        }

        // 2. "Compare les deux" ou "Fais la comparaison"
        if (q.includes('compare les deux') || q.includes('compare les') || q.includes('fais la comparaison') || q === 'compare') {
            return {
                isFollowUp: true,
                resolvedTopic: session.activeTopic || 'SALES',
                resolvedPeriod: 'compare_today_vs_yesterday',
                resolvedAction: 'COMPARE_SALES',
                contextualPrompt: 'Compare les ventes d\'aujourd\'hui par rapport à hier.'
            };
        }

        // 3. "Pourquoi ?" ou "Pourquoi cela ?"
        if (q === 'pourquoi ?' || q === 'pourquoi' || q.startsWith('pourquoi ?') || q.startsWith('explique pourquoi')) {
            return {
                isFollowUp: true,
                resolvedTopic: session.activeTopic || 'SALES',
                resolvedAction: 'EXPLAIN_CAUSES',
                contextualPrompt: 'Explique en détail les causes et facteurs observés dans les données.'
            };
        }

        return {
            isFollowUp: false,
            resolvedTopic: session.activeTopic,
            resolvedPeriod: session.lastTargetPeriod,
            contextualPrompt: prompt
        };
    }

    /**
     * Réinitialise une session de conversation
     */
    clearSession(sessionId = 'default') {
        this.sessions.delete(sessionId);
    }
}

module.exports = new AiContextManagerService();
