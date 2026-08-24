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

    /**
     * 🔮 IA de Prédiction des Fournées du Lendemain (Zéro Gaspillage)
     */
    async predictTomorrowProduction(db) {
        const { day } = this.getAbidjanCurrentTime();
        const tomorrowDay = (day + 1) % 7;
        const isTomorrowWeekend = tomorrowDay === 0 || tomorrowDay === 6;
        const multiplier = isTomorrowWeekend ? 1.45 : 1.15;

        const forecast = [
            { category: 'Pains & Baguettes', product: 'Baguette Tradition', recommendedUnits: Math.round(350 * multiplier), flourKg: Math.round(55 * multiplier), butterKg: 0, yeastKg: 1.2 },
            { category: 'Viennoiseries', product: 'Croissant & Pain Chocolat', recommendedUnits: Math.round(220 * multiplier), flourKg: Math.round(25 * multiplier), butterKg: Math.round(18 * multiplier), yeastKg: 0.8 },
            { category: 'Pâtisseries', product: 'Fondant, Tartes & Éclairs', recommendedUnits: Math.round(85 * multiplier), flourKg: 12, butterKg: 10, chocolateKg: 15 },
            { category: 'Snacking', product: 'Sandwiches & Paninis', recommendedUnits: Math.round(70 * multiplier), breadUnits: Math.round(70 * multiplier) }
        ];

        return {
            targetDate: 'Demain',
            isWeekend: isTomorrowWeekend,
            weatherNote: "Abidjan Riviera : Ciel dégagé, affluence matinale estimée forte dès 06h30.",
            forecast,
            totalEstimatedFlourKg: forecast.reduce((s, f) => s + (f.flourKg || 0), 0),
            totalEstimatedButterKg: forecast.reduce((s, f) => s + (f.butterKg || 0), 0),
            advice: isTomorrowWeekend 
                ? "🚀 Forte affluence week-end prévue : prévoyez 2 pétrins supplémentaires de bonne heure." 
                : "✅ Production en rythme de croisière régulier avec lissage des fournées de 07h00 et 16h30."
        };
    }

    /**
     * 📦 Générateur de Bon de Commande Fournisseur Automatisé
     */
    async generateSupplierPurchaseOrder(db, customItems) {
        const orderRef = 'BC-FOUR-' + Math.floor(1000 + Math.random() * 9000);
        const today = new Date().toLocaleDateString('fr-FR');
        
        const rawMaterials = [
            { item: 'Farine de Blé T55 (Sacs 50kg)', supplier: 'Grands Moulins d\'Abidjan (GMA)', quantity: '10 sacs (500 kg)', estimatedCost: 225000 },
            { item: 'Beurre de Tourage Extra-Fin 82% (Cartons 10kg)', supplier: 'Distributeur Laitier Riviera', quantity: '5 cartons (50 kg)', estimatedCost: 175000 },
            { item: 'Levure Fraîche de Boulangerie (Boîtes 500g)', supplier: 'Lesaffre CI', quantity: '12 boîtes (6 kg)', estimatedCost: 24000 },
            { item: 'Chocolat Noir de Couverture 64% (Seaux 5kg)', supplier: 'Cacao Prestige Côte d\'Ivoire', quantity: '4 seaux (20 kg)', estimatedCost: 90000 },
            { item: 'Sucre Cristallisé Extra-Blanc (Sacs 50kg)', supplier: 'Sucrivoire', quantity: '3 sacs (150 kg)', estimatedCost: 105000 }
        ];

        const totalCost = rawMaterials.reduce((sum, it) => sum + it.estimatedCost, 0);

        const whatsappText = `*BON DE COMMANDE FOURNISSEUR — BOULANGERIE DE BABI*\n` +
            `Réf : #${orderRef} du ${today}\n` +
            `Destination : Riviera 3, Abidjan\n` +
            `----------------------------------\n` +
            rawMaterials.map(m => `• ${m.item} : ${m.quantity}`).join('\n') +
            `\n----------------------------------\n` +
            `Montant Total Estimé : ${totalCost.toLocaleString('fr-FR')} FCFA\n` +
            `Merci de confirmer la livraison sous 24h.`;

        return {
            orderRef,
            date: today,
            materials: rawMaterials,
            totalEstimatedCost: totalCost,
            whatsappText
        };
    }
}

module.exports = new AiBakeryProductionService();

