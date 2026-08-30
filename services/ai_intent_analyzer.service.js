/**
 * 🎯 BOULANGERIE AI — INTENT ANALYZER
 * Détermination intelligente et sémantique de l'intention de la requête
 */

class AiIntentAnalyzerService {
    analyzeIntent(prompt = '') {
        const q = (prompt || '').toLowerCase().trim();

        // 1. Salutations et identité
        if (/^(bonjour|bonsoir|salut|coucou|hello|hi|hey|yo)\b/i.test(q)) {
            return { intent: 'GREETING', confidence: 0.98, entities: {} };
        }
        if (q.includes('qui es-tu') || q.includes('qui es tu') || q.includes('tu sers à quoi') || q.includes('ton rôle')) {
            return { intent: 'IDENTITY', confidence: 0.99, entities: {} };
        }

        // 2. Actions sensibles / Propositions d'actions (Prix, Stock, Produit)
        if ((q.includes('change le prix') || q.includes('mets le prix') || q.includes('modifie le tarif') || q.includes('nouveau prix')) && /\d+/.test(q)) {
            const priceMatch = q.match(/(\d+)/);
            return {
                intent: 'ACTION_PROPOSAL',
                actionType: 'UPDATE_PRICE',
                confidence: 0.95,
                entities: { targetPrice: priceMatch ? Number(priceMatch[1]) : null }
            };
        }
        if ((q.includes('ajoute') || q.includes('augmente le stock') || q.includes('stock de')) && /\d+/.test(q) && (q.includes('stock') || q.includes('baguette') || q.includes('croissant') || q.includes('jus'))) {
            const qtyMatch = q.match(/(\d+)/);
            return {
                intent: 'ACTION_PROPOSAL',
                actionType: 'UPDATE_STOCK',
                confidence: 0.95,
                entities: { quantity: qtyMatch ? Number(qtyMatch[1]) : null }
            };
        }
        if (q.startsWith('crée') || q.startsWith('cree') || q.startsWith('nouveau produit') || q.includes('nouveau produit')) {
            return {
                intent: 'ACTION_PROPOSAL',
                actionType: 'CREATE_PRODUCT',
                confidence: 0.92,
                entities: {}
            };
        }

        // 3. Détection d'anomalies & Pourquoi les ventes baissent
        if (q.includes('anomalie') || q.includes('pourquoi les ventes') || q.includes('baisse des ventes') || q.includes('problème') || q.includes('alerte')) {
            return { intent: 'ANOMALY_DETECTION', confidence: 0.94, entities: {} };
        }

        // 4. Rapports (Journalier, Hebdo, Mensuel)
        if (q.includes('rapport') || q.includes('bilan du jour') || q.includes('synthèse') || q.includes('synthese') || q.includes('recap')) {
            const isWeekly = q.includes('semaine') || q.includes('hebdo');
            const isMonthly = q.includes('mois') || q.includes('mensuel');
            return {
                intent: 'REPORT_GENERATION',
                reportPeriod: isMonthly ? 'MONTHLY' : (isWeekly ? 'WEEKLY' : 'DAILY'),
                confidence: 0.96,
                entities: {}
            };
        }

        // 5. Prévisions de production & Cuisson
        if (q.includes('prévision') || q.includes('prevision') || q.includes('demain') || q.includes('cuisson') || q.includes('fournée') || q.includes('four') || q.includes('produire')) {
            return { intent: 'FORECAST', confidence: 0.93, entities: { horizon: 'tomorrow' } };
        }

        // 6. Comparaisons temporelles
        if (q.includes('compare') || q.includes('comparaison') || q.includes('par rapport à hier') || q.includes('semaine dernière')) {
            return { intent: 'VENTE_ANALYSIS', subIntent: 'COMPARISON', confidence: 0.95, entities: {} };
        }

        // 7. Analyse des Ventes & CA & Panier Moyen
        if (q.includes('vente') || q.includes('chiffre') || q.includes('combien avons-nous gagné') || q.includes('gagné') || q.includes('argent') || q.includes('revenu') || q.includes('ca') || q.includes('panier moyen') || q.includes('recette')) {
            return { intent: 'VENTE_ANALYSIS', confidence: 0.96, entities: {} };
        }

        // 8. Analyse des Stocks & Ruptures
        if (q.includes('stock') || q.includes('rupture') || q.includes('manque') || q.includes('réappro') || q.includes('inventaire') || q.includes('combien reste')) {
            return { intent: 'STOCK_ANALYSIS', confidence: 0.95, entities: {} };
        }

        // 9. Analyse des Produits (Top / Flop / Rentabilité)
        if (q.includes('produit le plus vendu') || q.includes('top produit') || q.includes('produits rentables') || q.includes('rentabilité') || q.includes('marge') || q.includes('produit')) {
            return { intent: 'PRODUCT_ANALYSIS', confidence: 0.92, entities: {} };
        }

        // 10. Analyse des Commandes, Retraits & Caissières
        if (q.includes('retrait') || q.includes('commande') || q.includes('annul') || q.includes('caissière') || q.includes('pin') || q.includes('code')) {
            return { intent: 'ORDER_ANALYSIS', confidence: 0.92, entities: {} };
        }

        // 11. Recommandations stratégiques & Anti-Gaspillage
        if (q.includes('recommand') || q.includes('conseil') || q.includes('strategie') || q.includes('stratégie') || q.includes('gaspillage') || q.includes('happy hour')) {
            return { intent: 'RECOMMENDATION', confidence: 0.90, entities: {} };
        }

        // 12. Paiements & Wave
        if (q.includes('paiement') || q.includes('wave') || q.includes('espece') || q.includes('trésorerie') || q.includes('tresorerie')) {
            return { intent: 'PAYMENT_ANALYSIS', confidence: 0.93, entities: {} };
        }

        // 13. Savoir-faire technique boulangerie
        if (q.includes('farine') || q.includes('levain') || q.includes('croustillant') || q.includes('feuilletage') || q.includes('beurre') || q.includes('recette')) {
            return { intent: 'BAKERY_EXPERTISE', confidence: 0.91, entities: {} };
        }

        return { intent: 'GENERAL_INFORMATION', confidence: 0.70, entities: {} };
    }
}

module.exports = new AiIntentAnalyzerService();
