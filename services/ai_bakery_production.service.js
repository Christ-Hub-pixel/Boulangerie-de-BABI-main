/**
 * 🍞 AI BAKERY PRODUCTION & BATCH FORECASTER (BBE v3.0)
 * Moteur de Prédiction des Fournées, Pain Chaud en Direct & Anti-Gaspillage
 */

class AiBakeryProductionService {
    constructor() {
        // Horaires types des fournées quotidiennes de la Riviera (Heure locale Abidjan GMT)
        this.bakingSlots = [
            { id: 'baking_1', time: '06:00', label: 'Première Fournée de l\'Aube', boostMultiplier: 1.4 },
            { id: 'baking_2', time: '07:30', label: 'Fournée Spéciale Petit-Déjeuner', boostMultiplier: 1.8 },
            { id: 'baking_3', time: '11:30', label: 'Fournée Déjeuner & Sandwiches', boostMultiplier: 1.2 },
            { id: 'baking_4', time: '16:30', label: 'Fournée Goûter & Viennoiseries', boostMultiplier: 1.5 },
            { id: 'baking_5', time: '18:15', label: 'Fournée du Soir & Baguettes Fraîches', boostMultiplier: 1.6 }
        ];

        // Base de calibrage de production standard (pièces par fournée)
        this.standardBatches = {
            'Baguette Tradition Française': { baseQty: 120, bakingDurationMin: 22, optimalSellingWindowMin: 90 },
            'Croissant Pur Beurre AOP': { baseQty: 60, bakingDurationMin: 18, optimalSellingWindowMin: 120 },
            'Pain au Chocolat': { baseQty: 50, bakingDurationMin: 18, optimalSellingWindowMin: 120 },
            'Pain Complet aux Graines': { baseQty: 30, bakingDurationMin: 28, optimalSellingWindowMin: 180 },
            'Brioche Nanterre Sucre': { baseQty: 25, bakingDurationMin: 25, optimalSellingWindowMin: 240 }
        };
    }

    /**
     * Récupère l'heure courante d'Abidjan (UTC/GMT)
     */
    getAbidjanCurrentTime() {
        const now = new Date();
        const hours = now.getUTCHours();
        const minutes = now.getUTCMinutes();
        const day = now.getUTCDay(); // 0 = Dimanche, 6 = Samedi
        return { now, hours, minutes, totalMinutes: hours * 60 + minutes, day };
    }

    /**
     * Calcule le statut en temps réel du Pain Chaud en Direct
     */
    getLiveHotBreadStatus() {
        const { hours, minutes, totalMinutes } = this.getAbidjanCurrentTime();
        const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Trouver la fournée passée la plus récente et la prochaine fournée
        let lastSlot = null;
        let nextSlot = null;

        for (const slot of this.bakingSlots) {
            const [sH, sM] = slot.time.split(':').map(Number);
            const slotTotalMin = sH * 60 + sM;

            if (slotTotalMin <= totalMinutes) {
                lastSlot = { ...slot, totalMin: slotTotalMin };
            } else if (!nextSlot && slotTotalMin > totalMinutes) {
                nextSlot = { ...slot, totalMin: slotTotalMin };
            }
        }

        let isFreshlyBaked = false;
        let minutesSinceLast = 999;
        let minutesUntilNext = nextSlot ? (nextSlot.totalMin - totalMinutes) : null;
        let bannerMessage = '';
        let badgeColor = '#16a34a'; // vert

        if (lastSlot) {
            minutesSinceLast = totalMinutes - lastSlot.totalMin;
            if (minutesSinceLast <= 45) {
                isFreshlyBaked = true;
                bannerMessage = `🔥 PAIN CHAUD EN DIRECT : Fournée sortie il y a ${minutesSinceLast} min !`;
                badgeColor = '#ea580c'; // orange vif
            }
        }

        if (!isFreshlyBaked) {
            if (nextSlot) {
                bannerMessage = `⏰ Prochaine Fournée Chaude dans ${minutesUntilNext} min (${nextSlot.time}) — ${nextSlot.label}`;
                badgeColor = '#f59e0b'; // ambre
            } else {
                bannerMessage = `🌙 Dernières fournées de la journée disponibles au comptoir.`;
                badgeColor = '#64748b';
            }
        }

        return {
            currentTimeAbidjan: timeFormatted,
            isFreshlyBaked,
            minutesSinceLastBatch: minutesSinceLast < 999 ? minutesSinceLast : null,
            minutesUntilNextBatch: minutesUntilNext,
            currentSlotLabel: lastSlot ? lastSlot.label : 'Ouverture Matinale',
            nextSlotLabel: nextSlot ? nextSlot.label : 'Fin de journée',
            nextSlotTime: nextSlot ? nextSlot.time : '06:00 (Demain)',
            bannerMessage,
            badgeColor
        };
    }

    /**
     * Prédit les besoins de production pour la gérante et l'équipe fournil
     */
    async predictProductionNeeds(db) {
        const { hours, day } = this.getAbidjanCurrentTime();
        const isWeekend = day === 0 || day === 6;
        const weekendFactor = isWeekend ? 1.35 : 1.0;

        // Récupérer le volume des ventes des 24 dernières heures si DB disponible
        let recentOrdersCount = 0;
        let topSoldProducts = {};
        if (db) {
            try {
                const orders = await db.all(`
                    SELECT items FROM orders 
                    WHERE created_at >= datetime('now', '-24 hours')
                `);
                recentOrdersCount = orders.length;
                orders.forEach(o => {
                    try {
                        const items = JSON.parse(o.items || '[]');
                        items.forEach(it => {
                            const name = it.name || it.title || 'Inconnu';
                            topSoldProducts[name] = (topSoldProducts[name] || 0) + (it.quantity || it.qty || 1);
                        });
                    } catch (_) {}
                });
            } catch (err) {
                console.warn("[AiBakeryProduction] Lecture DB partielle:", err.message);
            }
        }

        // Calculer les prévisions pour chaque produit clé
        const predictions = [];
        for (const [prodName, config] of Object.entries(this.standardBatches)) {
            const soldCount = topSoldProducts[prodName] || 0;
            const dynamicMultiplier = (1 + (soldCount > 20 ? 0.25 : 0)) * weekendFactor;
            const recommendedQty = Math.round(config.baseQty * dynamicMultiplier);

            predictions.push({
                productName: prodName,
                recommendedBatchSize: recommendedQty,
                bakingDurationMin: config.bakingDurationMin,
                optimalWindowMin: config.optimalSellingWindowMin,
                hourlyAffluenceRisk: hours >= 6 && hours <= 9 ? 'TRÈS ÉLEVÉ (Matin)' : (hours >= 17 && hours <= 19 ? 'ÉLEVÉ (Soirée)' : 'NORMAL'),
                suggestedOvenTime: config.bakingDurationMin + ' minutes à 240°C'
            });
        }

        return {
            timestamp: new Date().toISOString(),
            isWeekend,
            affluenceFactor: weekendFactor,
            recentOrders24h: recentOrdersCount,
            predictions,
            liveStatus: this.getLiveHotBreadStatus()
        };
    }

    /**
     * Analyse anti-gaspillage de fin de journée
     */
    async getAntiWasteInsights(db) {
        const { hours } = this.getAbidjanCurrentTime();
        let lowStockOrSurplus = [];

        if (db) {
            try {
                const stocks = await db.all(`SELECT * FROM stocks WHERE quantite_disponible > 0`);
                lowStockOrSurplus = stocks.map(s => {
                    const surplusRisk = (hours >= 17 && s.quantite_disponible > 20);
                    return {
                        nom_produit: s.nom_produit,
                        quantite: s.quantite_disponible,
                        surplusRisk,
                        discountSuggestion: surplusRisk ? 'Appliquer -25% Happy Hour dès 18h30' : 'Vente à prix régulier'
                    };
                });
            } catch (_) {}
        }

        return {
            isLateAfternoon: hours >= 16,
            recommendation: hours >= 17 
                ? "🌱 Activez le mode Anti-Gaspillage : réductions automatiques suggérées sur les viennoiseries restantes."
                : "✅ Flux de production équilibré. Aucun surplus critique détecté.",
            items: lowStockOrSurplus
        };
    }
}

module.exports = new AiBakeryProductionService();
