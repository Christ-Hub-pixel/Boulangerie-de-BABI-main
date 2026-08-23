/**
 * 🛒 AI RECOMMENDATION & SMART UPSELL ENGINE (BBE v3.0)
 * Recommandations Contextuelles, Accords Gourmands & Estimation du Temps de Retrait
 */

class AiRecommendationService {
    constructor() {
        // Matrice d'accords gourmands (Pairing Rules)
        this.pairingRules = [
            {
                triggerCategory: 'boulangerie',
                triggerKeywords: ['baguette', 'pain', 'brioche'],
                recommendations: [
                    { name: 'Beurre Doux Artisanal 100g', category: 'epicerie', reason: 'Idéal sur votre baguette croustillante', boostScore: 92 },
                    { name: 'Confiture Mangue & Passion de Côte d\'Ivoire', category: 'epicerie', reason: 'Parfait pour un petit-déjeuner gourmand', boostScore: 88 },
                    { name: 'Café Cappuccino Mousseux', category: 'boissons', reason: 'Pour accompagner votre pain frais', boostScore: 85 }
                ]
            },
            {
                triggerCategory: 'viennoiserie',
                triggerKeywords: ['croissant', 'chocolat', 'pain au chocolat', 'chausson'],
                recommendations: [
                    { name: 'Jus d\'Orange Pressé Pur Frais 33cl', category: 'boissons', reason: 'Le classique tonique du matin', boostScore: 95 },
                    { name: 'Café Espresso Grand Cru', category: 'boissons', reason: 'L\'accord parfait avec votre viennoiserie', boostScore: 91 },
                    { name: 'Jus de Bissap Maison Mentholé', category: 'boissons', reason: 'Fraîcheur ivoirienne artisanale', boostScore: 84 }
                ]
            },
            {
                triggerCategory: 'patisserie',
                triggerKeywords: ['eclair', 'tarte', 'gateau', 'foret noire', 'millefeuille'],
                recommendations: [
                    { name: 'Thé Vert Infusion Menthe Poivrée', category: 'boissons', reason: 'Équilibre subtil avec la douceur pâtissière', boostScore: 89 },
                    { name: 'Bougies Festives Dorées (Lot de 6)', category: 'accessoires', reason: 'Pour célébrer vos moments spéciaux', boostScore: 82 }
                ]
            },
            {
                triggerCategory: 'evenements',
                triggerKeywords: ['mariage', 'anniversaire', 'bapteme', 'piece montee'],
                recommendations: [
                    { name: 'Pack Coupe-Gâteau Inox & Serviettes Deluxe', category: 'accessoires', reason: 'Service élégant pour votre réception', boostScore: 96 },
                    { name: 'Mini-Viennoiseries Assorties (Plateau 24 pcs)', category: 'traiteur', reason: 'Idéal pour l\'accueil de vos convives', boostScore: 93 }
                ]
            }
        ];
    }

    /**
     * Génère des recommandations personnalisées pour un panier ou un produit
     * @param {Array} cartItems - Liste des articles dans le panier
     * @param {string} categoryFilter - Optionnel : filtrer par catégorie
     * @param {number} limit - Nombre maximum de suggestions
     */
    getRecommendations(cartItems = [], categoryFilter = null, limit = 4) {
        if (!cartItems || cartItems.length === 0) {
            // Recommandations par défaut (best-sellers incontournables)
            return [
                { name: 'Croissant Pur Beurre AOP', category: 'viennoiserie', price: 600, reason: 'Cuit ce matin au fournil' },
                { name: 'Baguette Tradition Française', category: 'boulangerie', price: 400, reason: 'Croustillante et dorée' },
                { name: 'Jus de Bissap Maison', category: 'boissons', price: 1000, reason: '100% Naturel et glacé' },
                { name: 'Éclair Gourmand Chocolat Noir', category: 'patisserie', price: 1200, reason: 'Pâtisserie signature BABI' }
            ].slice(0, limit);
        }

        const scoredRecommendations = new Map();
        const cartItemNames = cartItems.map(i => (i.name || i.title || '').toLowerCase());

        for (const item of cartItems) {
            const name = (item.name || item.title || '').toLowerCase();
            const category = (item.category || item.categorie || '').toLowerCase();

            for (const rule of this.pairingRules) {
                const matchCategory = category.includes(rule.triggerCategory);
                const matchKeyword = rule.triggerKeywords.some(kw => name.includes(kw));

                if (matchCategory || matchKeyword) {
                    for (const rec of rule.recommendations) {
                        // Éviter de recommander un produit déjà présent dans le panier
                        if (cartItemNames.includes(rec.name.toLowerCase())) continue;

                        if (categoryFilter && rec.category !== categoryFilter) continue;

                        const existing = scoredRecommendations.get(rec.name);
                        const newScore = (existing ? existing.score : 0) + rec.boostScore;
                        scoredRecommendations.set(rec.name, {
                            ...rec,
                            score: newScore
                        });
                    }
                }
            }
        }

        const sorted = Array.from(scoredRecommendations.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        // Si aucune correspondance stricte, compléter avec les classiques
        if (sorted.length === 0) {
            return this.getRecommendations([], categoryFilter, limit);
        }

        return sorted;
    }

    /**
     * Estime intelligemment le temps de préparation et de mise à disposition (Minutes)
     */
    estimatePreparationTime(cartItems = []) {
        let baseMin = 10; // Temps de base pour emballage & vérification
        let hasCustomCake = false;
        let totalItems = 0;

        for (const item of cartItems) {
            const name = (item.name || item.title || '').toLowerCase();
            const qty = Number(item.quantity || item.qty || 1);
            totalItems += qty;

            if (name.includes('mariage') || name.includes('anniversaire') || name.includes('bapteme') || name.includes('étages')) {
                hasCustomCake = true;
            }
        }

        if (hasCustomCake) {
            return {
                estimatedMinutes: 180, // Réservation / commande spéciale
                label: 'Commande Traiteur / Événement : Préparation sur créneau planifié',
                isSpecialEvent: true
            };
        }

        if (totalItems > 15) {
            baseMin = 25;
        } else if (totalItems > 6) {
            baseMin = 18;
        } else {
            baseMin = 12;
        }

        return {
            estimatedMinutes: baseMin,
            label: `Prêt au comptoir en environ ${baseMin} minutes`,
            isSpecialEvent: false
        };
    }
}

module.exports = new AiRecommendationService();
