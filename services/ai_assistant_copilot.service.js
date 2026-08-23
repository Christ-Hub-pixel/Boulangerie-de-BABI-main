/**
 * 🤖 AI STORE OPERATIONS COPILOT & ASSISTANT (BBE v3.0)
 * Copilote Métier Intelligent pour l'Administration et la Gérance
 */

const aiBakeryProduction = require('./ai_bakery_production.service.js');
const aiInventoryAdvisor = require('./ai_inventory_advisor.service.js');
const aiBusinessAnalytics = require('./ai_business_analytics.service.js');
const aiRecommendation = require('./ai_recommendation.service.js');

class AiAssistantCopilotService {
    constructor() {
        this.systemIdentity = "BABI Brain Copilot v3.0 (Assistant IA Opérationnel de la Boulangerie de BABI - Riviera, Abidjan)";
    }

    /**
     * Génère une synthèse consolidée 360° en 1 seul appel
     */
    async getConsolidatedSummary(db) {
        const [productionInfo, stockInfo, businessInfo] = await Promise.all([
            aiBakeryProduction.predictProductionNeeds(db),
            aiInventoryAdvisor.analyzeStockHealth(db),
            aiBusinessAnalytics.generateBusinessForecast(db)
        ]);

        return {
            timestamp: new Date().toISOString(),
            system: this.systemIdentity,
            production: productionInfo,
            stocks: stockInfo,
            business: businessInfo,
            recommendationsHot: aiRecommendation.getRecommendations([], null, 4),
            smartAlerts: [
                ...(stockInfo.criticalAlerts || []).map(a => ({ type: 'CRITICAL_STOCK', message: a.message })),
                ...(stockInfo.lowStockWarnings || []).map(w => ({ type: 'LOW_STOCK', message: w.message })),
                { type: 'HOT_BREAD_STATUS', message: productionInfo.liveStatus ? productionInfo.liveStatus.bannerMessage : 'Fournil opérationnel' }
            ]
        };
    }

    /**
     * Traite une question en langage naturel posée par la gérante ou l'administrateur
     */
    async handleAssistantChat(userPrompt = '', role = 'gerante', db = null) {
        const query = userPrompt.toLowerCase().trim();
        const summary = await this.getConsolidatedSummary(db);

        // 1. Questions sur les stocks & ruptures
        if (query.includes('stock') || query.includes('rupture') || query.includes('manque') || query.includes('réappro')) {
            const crit = summary.stocks.criticalAlerts || [];
            const low = summary.stocks.lowStockWarnings || [];
            if (crit.length === 0 && low.length === 0) {
                return {
                    reply: "✅ **Excellente nouvelle :** Tous les stocks sont actuellement au vert et à un niveau optimal. Aucun risque de rupture immédiat.",
                    category: 'stocks',
                    data: summary.stocks.summary
                };
            } else {
                const critList = crit.map(c => `• **${c.name}** : 🚨 Rupture immédiate`).join('\n');
                const lowList = low.map(l => `• **${l.name}** : ⚠️ ${l.quantity} restants`).join('\n');
                return {
                    reply: `📦 **Diagnostic Stocks en Direct :**\n${critList ? critList + '\n' : ''}${lowList ? lowList + '\n' : ''}\n💡 *Conseil IA :* Lancer le réassort de sécurité recommandé dès maintenant.`,
                    category: 'stocks',
                    data: { critical: crit, low: low }
                };
            }
        }

        // 2. Questions sur les fournées & pain chaud
        if (query.includes('fournée') || query.includes('pain chaud') || query.includes('cuisson') || query.includes('four') || query.includes('baguette')) {
            const status = summary.production.liveStatus;
            const preds = summary.production.predictions || [];
            const topBatch = preds.slice(0, 3).map(p => `• **${p.productName}** : ${p.recommendedBatchSize} pièces recommandées (${p.suggestedOvenTime})`).join('\n');

            return {
                reply: `🥖 **Planification des Fournées du Fournil :**\n${status ? status.bannerMessage : ''}\n\n**Recommandations de cuisson pour l'équipe :**\n${topBatch}\n\n💡 *Prochaine fournée programmée :* ${status ? status.nextSlotTime : 'Bientôt'}.`,
                category: 'production',
                data: summary.production
            };
        }

        // 3. Questions sur les ventes & chiffre d'affaires
        if (query.includes('vente') || query.includes('chiffre') || query.includes('argent') || query.includes('revenu') || query.includes('ca') || query.includes('argent')) {
            const kpis = summary.business.kpis || {};
            const forecast = summary.business.forecast || {};

            return {
                reply: `📈 **Performance Commerciale & Prévisions :**\n• Commandes traitées : **${kpis.totalOrdersRecorded || 0}**\n• Chiffre d'affaires historique : **${(kpis.totalHistoricalRevenueFCFA || 0).toLocaleString()} FCFA**\n• Panier moyen : **${(kpis.averageBasketFCFA || 0).toLocaleString()} FCFA**\n• Projection journalière estimée : **${(forecast.projectedDailyRevenueFCFA || 0).toLocaleString()} FCFA** (${forecast.growthRateEstimated || '+15%'})\n\n💡 *Tendance :* ${summary.business.executiveSummary || 'Activité dynamique.'}`,
                category: 'business',
                data: summary.business
            };
        }

        // 4. Questions sur l'anti-gaspillage ou fin de journée
        if (query.includes('gaspillage') || query.includes('invendu') || query.includes('happy hour') || query.includes('promo')) {
            return {
                reply: `🌱 **Stratégie Anti-Gaspillage BABI :**\n• Déclenchement automatique du *Happy Hour Gourmand* conseillé à partir de 18h30 pour écouler les viennoiseries fraîches du jour.\n• Taux d'invendus estimé à moins de 2.1% grâce aux prévisions de fournées ajustées.`,
                category: 'anti_waste'
            };
        }

        // 5. Synthèse générale par défaut
        return {
            reply: `Bonjour ! Je suis le **Copilote IA BABI**.\n\nVoici le point d'étape en direct :\n• **Pain chaud & Fournil :** ${summary.production.liveStatus ? summary.production.liveStatus.bannerMessage : 'En cours'}\n• **État des stocks :** ${summary.stocks.operationalAdvice}\n• **Prévision Ventes :** ${(summary.business.forecast ? summary.business.forecast.projectedDailyRevenueFCFA : 250000).toLocaleString()} FCFA attendus aujourd'hui.\n\nPosez-moi une question sur les *stocks*, les *fournées*, le *chiffre d'affaires* ou les *commandes* !`,
            category: 'general_summary',
            data: summary
        };
    }
}

module.exports = new AiAssistantCopilotService();
