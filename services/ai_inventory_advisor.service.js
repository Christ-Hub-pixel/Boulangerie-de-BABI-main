/**
 * 📦 AI INVENTORY & RESTOCK ADVISOR (BBE v3.0)
 * Conseiller Prédictif de Stocks & Détection des Risques de Rupture
 */

class AiInventoryAdvisorService {
    constructor() {
        this.defaultSafetyThreshold = 15;
    }

    /**
     * Analyse en profondeur les niveaux de stocks et calcule les risques
     */
    async analyzeStockHealth(db) {
        if (!db) {
            return {
                status: 'UNAVAILABLE',
                message: 'Base de données non initialisée.'
            };
        }

        try {
            const stocks = await db.all(`
                SELECT s.*, 
                    COALESCE((SELECT SUM(quantity) FROM order_items oi WHERE oi.product_id = s.product_id), 0) as total_sold
                FROM stocks s
                ORDER BY s.quantite_disponible ASC
            `);

            const criticalItems = [];
            const lowItems = [];
            const healthyItems = [];
            const surplusItems = [];
            const restockSuggestions = [];

            let totalValuation = 0;
            let totalUnits = 0;

            for (const item of stocks) {
                const qty = item.quantite_disponible || 0;
                const threshold = item.seuil_alerte || this.defaultSafetyThreshold;
                const unitPrice = item.prix_unitaire || 500;

                totalUnits += qty;
                totalValuation += (qty * unitPrice);

                const itemData = {
                    id: item.id,
                    productId: item.product_id,
                    name: item.nom_produit,
                    category: item.categorie,
                    quantity: qty,
                    alertThreshold: threshold,
                    unitPrice: unitPrice,
                    unit: item.unite || 'pièce'
                };

                if (qty === 0) {
                    criticalItems.push({
                        ...itemData,
                        urgency: 'CRITIQUE',
                        message: `🚨 RUPTURE IMMÉDIATE : ${item.nom_produit} est épuisé !`
                    });
                    restockSuggestions.push({
                        productName: item.nom_produit,
                        recommendedRestockQty: threshold * 3,
                        estimatedCost: (threshold * 3) * unitPrice,
                        priority: 'HAUTE'
                    });
                } else if (qty <= threshold) {
                    lowItems.push({
                        ...itemData,
                        urgency: 'ATTENTION',
                        message: `⚠️ Stock faible : ${qty} restant(s) (Seuil d'alerte : ${threshold})`
                    });
                    restockSuggestions.push({
                        productName: item.nom_produit,
                        recommendedRestockQty: threshold * 2,
                        estimatedCost: (threshold * 2) * unitPrice,
                        priority: 'MOYENNE'
                    });
                } else if (qty > threshold * 4) {
                    surplusItems.push({
                        ...itemData,
                        message: `📦 Stock abondant : ${qty} unités disponibles`
                    });
                } else {
                    healthyItems.push(itemData);
                }
            }

            const overallStatus = criticalItems.length > 0 ? 'ATTENTION_RUPTURE' : (lowItems.length > 0 ? 'VIGILANCE' : 'OPTIMAL');

            return {
                timestamp: new Date().toISOString(),
                overallStatus,
                summary: {
                    totalSKUs: stocks.length,
                    totalUnitsInStock: totalUnits,
                    estimatedStockValuationFCFA: totalValuation,
                    criticalCount: criticalItems.length,
                    lowCount: lowItems.length,
                    healthyCount: healthyItems.length,
                    surplusCount: surplusItems.length
                },
                criticalAlerts: criticalItems,
                lowStockWarnings: lowItems,
                restockSuggestions,
                operationalAdvice: criticalItems.length > 0
                    ? `Action requise : ${criticalItems.length} produit(s) en rupture de stock immédiate. Lancer une fournée prioritaire ou passer commande fournisseur.`
                    : (lowItems.length > 0
                        ? `Alerte : ${lowItems.length} produit(s) approchent de leur seuil critique. Anticiper le réassort de l'après-midi.`
                        : `Tous les stocks sont à des niveaux sains et optimaux.`)
            };
        } catch (error) {
            console.error('[AiInventoryAdvisor] Erreur analyse stocks:', error);
            return {
                status: 'ERROR',
                message: error.message
            };
        }
    }
}

module.exports = new AiInventoryAdvisorService();
