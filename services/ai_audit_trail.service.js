/**
 * 🛡️ BOULANGERIE AI — AUDIT TRAIL & METRICS LOGGER
 * Enregistrement immuable de toutes les actions, outils et requêtes IA
 */

const fs = require('fs');
const path = require('path');

class AiAuditTrailService {
    constructor() {
        this.memoryLogs = [];
        this.maxMemoryLogs = 2000;
        this.auditFilePath = path.join(__dirname, '../data/ai_audit_logs.json');
        this._initStorage();
    }

    _initStorage() {
        try {
            const dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            if (fs.existsSync(this.auditFilePath)) {
                const raw = fs.readFileSync(this.auditFilePath, 'utf8');
                this.memoryLogs = JSON.parse(raw) || [];
            }
        } catch (err) {
            console.warn('[AiAuditTrail] Initialisation stockage mémoire fallback :', err.message);
            this.memoryLogs = [];
        }
    }

    _persist() {
        try {
            if (this.memoryLogs.length > this.maxMemoryLogs) {
                this.memoryLogs = this.memoryLogs.slice(-this.maxMemoryLogs);
            }
            fs.writeFileSync(this.auditFilePath, JSON.stringify(this.memoryLogs, null, 2), 'utf8');
        } catch (err) {
            console.warn('[AiAuditTrail] Erreur persistance disque :', err.message);
        }
    }

    /**
     * Enregistre une interaction ou action de l'agent IA
     */
    async logAction({
        userId = 'anonymous',
        role = 'guest',
        aiSessionId = 'default',
        userQuery = '',
        intent = 'UNKNOWN',
        tool = 'none',
        parameters = {},
        result = null,
        status = 'SUCCESS',
        executionTimeMs = 0,
        errorMessage = null
    }) {
        const logEntry = {
            id: `ai_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId,
            role,
            aiSessionId,
            userQuery: typeof userQuery === 'string' ? userQuery.substring(0, 300) : '',
            intent,
            tool,
            parameters: typeof parameters === 'object' ? parameters : {},
            resultPreview: typeof result === 'object' && result ? (result.summary || result.action || 'Result OK') : String(result).substring(0, 200),
            status,
            executionTimeMs,
            errorMessage,
            timestamp: new Date().toISOString()
        };

        this.memoryLogs.unshift(logEntry);
        this._persist();
        return logEntry;
    }

    /**
     * Récupère les logs d'audit filtrés pour l'administration
     */
    async getAuditLogs({ limit = 50, role = null, status = null } = {}) {
        let logs = [...this.memoryLogs];
        if (role) logs = logs.filter(l => l.role === role);
        if (status) logs = logs.filter(l => l.status === status);
        return logs.slice(0, Number(limit) || 50);
    }

    /**
     * Calcule les métriques d'observabilité de l'IA
     */
    async getAiMetrics() {
        const total = this.memoryLogs.length;
        if (total === 0) {
            return {
                totalRequests: 0,
                successRate: '100%',
                averageResponseTimeMs: 0,
                topIntents: [],
                topToolsUsed: [],
                recentErrors: 0
            };
        }

        const successes = this.memoryLogs.filter(l => l.status === 'SUCCESS').length;
        const totalTime = this.memoryLogs.reduce((acc, l) => acc + (l.executionTimeMs || 0), 0);
        const errors = total - successes;

        // Top intentions
        const intentCounts = {};
        const toolCounts = {};
        this.memoryLogs.forEach(l => {
            if (l.intent) intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
            if (l.tool && l.tool !== 'none') toolCounts[l.tool] = (toolCounts[l.tool] || 0) + 1;
        });

        const topIntents = Object.entries(intentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([intent, count]) => ({ intent, count }));

        const topToolsUsed = Object.entries(toolCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tool, count]) => ({ tool, count }));

        return {
            totalRequests: total,
            successRate: `${((successes / total) * 100).toFixed(1)}%`,
            averageResponseTimeMs: Math.round(totalTime / total),
            topIntents,
            topToolsUsed,
            recentErrors: errors
        };
    }
}

module.exports = new AiAuditTrailService();
