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
        
        // Banque d'images Studio HD d'Abidjan & Boulangerie Française Haute Qualité
        this.aiPhotoBank = {
            'baguette': [
                'assets/product_baguette.png',
                'assets/baguette 200.png',
                'assets/baguette 150.png',
                'assets/pain complet 2.png'
            ],
            'pain': [
                'assets/product_baguette.png',
                'assets/Pain Complet (Grand).png',
                'assets/pain sans sel.png',
                'assets/pain individuel.png',
                'assets/pain de mie.png',
                'assets/marbre.png',
                'assets/cabre.png'
            ],
            'croissant': [
                'assets/Croissant.png',
                'assets/choco suisse.png',
                'assets/torsade.png'
            ],
            'chocolat': [
                'assets/pain au chocolat.png',
                'assets/choco suisse.png',
                'assets/Fondant au Chocolat.png',
                'assets/Chocolat Chaud.png'
            ],
            'viennoiserie': [
                'assets/Croissant.png',
                'assets/pain au chocolat.png',
                'assets/pain au raisin.png',
                'assets/chausson aux pommes.png',
                'assets/palmier.png',
                'assets/madeleine unite.png',
                'assets/cookies.png'
            ],
            'gateau': [
                'assets/Gateau1.png',
                'assets/Gateau1.1.png',
                'assets/Gateau1.2.png',
                'assets/gateau2.png',
                'assets/gateau de mariiage.png',
                'assets/buche de noel.png',
                'assets/moka1.png',
                'assets/cake.png'
            ],
            'patisserie': [
                'assets/Gateau1.png',
                'assets/Flan.png',
                'assets/moka1.png',
                'assets/crepe au nutella.png',
                'assets/crepe a la vanille.png',
                'assets/Fondant au Chocolat.png'
            ],
            'jus': [
                'assets/jus de bissap.png',
                'assets/jus de passion.png',
                'assets/jus de gingembre.png',
                'assets/jus de baobab.png',
                'assets/jus de tamari.png',
                'assets/cocktail.png',
                'assets/jus de citron.png'
            ],
            'boisson': [
                'assets/jus de bissap.png',
                'assets/jus de passion.png',
                'assets/chill.png',
                'assets/youzou.png',
                'assets/world cola.png',
                'assets/Orangina.png',
                'assets/sprite.png',
                'assets/bouteille celeste.png'
            ],
            'sale': [
                'assets/Pizza.png',
                'assets/Panini.png',
                'assets/burger.png',
                'assets/sandwich.png'
            ],
            'snack': [
                'assets/cookies.png',
                'assets/madeleine unite.png',
                'assets/biscottes.png',
                'assets/glace.png'
            ]
        };
    }

    /**
     * Suggère automatiquement les détails complets d'un produit à partir d'un simple nom/idée
     */
    suggestProductDetails(query = '') {
        const q = (query || '').toLowerCase().trim();
        let cat = 'pain';
        let suggestedPrice = 500;
        let desc = "Fabrication artisanale quotidienne avec des ingrédients de premier choix, cuit sur sole de pierre au fournil de la Riviera.";
        let img = 'assets/product_baguette.png';
        let stock = 40;
        let alert = 10;

        if (q.includes('croissant') || q.includes('pain au chocolat') || q.includes('raisin') || q.includes('chausson') || q.includes('suisse') || q.includes('brioche') || q.includes('viennois')) {
            cat = 'viennoiserie';
            suggestedPrice = q.includes('croissant') ? 500 : (q.includes('raisin') || q.includes('chausson') ? 700 : 600);
            desc = "Pur beurre d'excellence, feuilletage croustillant à l'extérieur et fondant à l'intérieur.";
            img = q.includes('croissant') ? 'assets/Croissant.png' : (q.includes('chocolat') ? 'assets/pain au chocolat.png' : 'assets/pain au raisin.png');
            stock = 35;
        } else if (q.includes('gâteau') || q.includes('gateau') || q.includes('patiss') || q.includes('tarte') || q.includes('moka') || q.includes('flan') || q.includes('fondant') || q.includes('bûche')) {
            cat = 'patisserie';
            suggestedPrice = q.includes('anniversaire') || q.includes('mariage') ? 15000 : 1500;
            desc = "Création pâtissière raffinée confectionnée par notre chef pâtissier avec une crème onctueuse et des saveurs équilibrées.";
            img = 'assets/Gateau1.png';
            stock = 15;
            alert = 5;
        } else if (q.includes('jus') || q.includes('bissap') || q.includes('gingembre') || q.includes('passion') || q.includes('baobab') || q.includes('tamarin') || q.includes('cocktail') || q.includes('boisson') || q.includes('soda') || q.includes('eau')) {
            cat = q.includes('jus') || q.includes('bissap') || q.includes('passion') ? 'jus' : 'boisson';
            suggestedPrice = q.includes('grand') ? 2000 : 700;
            desc = "Boisson 100% naturelle et rafraîchissante, pressée artisanalement à Abidjan sans conservateurs artificiels.";
            img = q.includes('bissap') ? 'assets/jus de bissap.png' : (q.includes('passion') ? 'assets/jus de passion.png' : (q.includes('gingembre') ? 'assets/jus de gingembre.png' : 'assets/cocktail.png'));
            stock = 50;
        } else if (q.includes('pizza') || q.includes('panini') || q.includes('sandwich') || q.includes('burger') || q.includes('salé') || q.includes('sale') || q.includes('quiche')) {
            cat = 'sale';
            suggestedPrice = q.includes('pizza') ? 2500 : (q.includes('panini') ? 2000 : 1500);
            desc = "Préparé minute avec des ingrédients frais, fromage fondant et viandes assaisonnées à la perfection.";
            img = 'assets/Pizza.png';
            stock = 25;
        } else if (q.includes('cookie') || q.includes('biscuit') || q.includes('madeleine') || q.includes('glace') || q.includes('snack')) {
            cat = 'snack';
            suggestedPrice = q.includes('cookie') ? 300 : 500;
            desc = "Pause gourmande idéale pour les petites faims, texture croustillante et pépites savoureuses.";
            img = 'assets/cookies.png';
            stock = 45;
        } else {
            // Pains
            cat = 'pain';
            suggestedPrice = q.includes('complet') ? 500 : (q.includes('150') ? 150 : 250);
            desc = "Pain croustillant au levain traditionnel, mie aérée et dorée selon la pure tradition boulangère.";
            img = q.includes('complet') ? 'assets/Pain Complet (Grand).png' : 'assets/product_baguette.png';
            stock = 60;
        }

        // Suggestions de visuels alternatifs
        const suggestions = this.getPhotoSuggestions(query, cat);

        return {
            nom: query.charAt(0).toUpperCase() + query.slice(1),
            categorie: cat,
            prix: suggestedPrice,
            stock: stock,
            seuil_alerte: alert,
            description: desc,
            image: img,
            photoSuggestions: suggestions
        };
    }

    /**
     * Fournit une sélection intelligente de photos pour un prompt / mot-clé
     */
    getPhotoSuggestions(prompt = '', category = 'pain') {
        const p = (prompt || '').toLowerCase();
        const results = [];

        // Recherche par mot-clé précis
        for (const [key, photos] of Object.entries(this.aiPhotoBank)) {
            if (p.includes(key)) {
                photos.forEach(img => { if (!results.includes(img)) results.push(img); });
            }
        }

        // Fallback par catégorie
        if (results.length < 4 && this.aiPhotoBank[category]) {
            this.aiPhotoBank[category].forEach(img => {
                if (!results.includes(img)) results.push(img);
            });
        }

        // Compléter avec les indispensables
        const general = ['assets/product_baguette.png', 'assets/Croissant.png', 'assets/Gateau1.png', 'assets/jus de bissap.png', 'assets/Pizza.png', 'assets/cookies.png'];
        general.forEach(img => {
            if (results.length < 6 && !results.includes(img)) results.push(img);
        });

        return results.slice(0, 8);
    }

    /**
     * Traite les commandes d'automatisation IA envoyées par l'administrateur
     */
    async executeAdminAiCommand(command = '', db = null) {
        const cmd = command.toLowerCase().trim();

        // 1. Détection de création de produit par commande vocale/texte
        // Ex: "Ajoute Baguette Tradition à 250F avec 50 en stock" ou "Crée un croissant à 500 FCFA"
        if (cmd.startsWith('ajoute') || cmd.startsWith('crée') || cmd.startsWith('cree') || cmd.startsWith('créer') || cmd.startsWith('nouveau produit')) {
            const clean = command.replace(/^(ajoute|crée|cree|créer|nouveau produit|ajoute un produit|crée un produit)\s+/i, '');
            const details = this.suggestProductDetails(clean);

            // Extraction des prix mentionnés (ex: 250F, 500 FCFA)
            const priceMatch = command.match(/(\d+)\s*(f|fcfa|cfa)/i);
            if (priceMatch) {
                details.prix = Number(priceMatch[1]);
            }

            // Extraction du stock mentionné (ex: 50 en stock, stock 30)
            const stockMatch = command.match(/(\d+)\s*(en stock|pièces|unités|stock)/i);
            if (stockMatch) {
                details.stock = Number(stockMatch[1]);
            }

            return {
                action: 'SUGGEST_NEW_PRODUCT',
                product: details,
                reply: `✨ **IA BABI :** J'ai préparé la fiche complète pour **"${details.nom}"** avec la catégorie *${details.categorie.toUpperCase()}*, le prix de **${details.prix} FCFA** et une description soignée. Cliquez sur Valider pour l'ajouter au catalogue.`
            };
        }

        // 2. Demande de visuel / photo
        if (cmd.includes('photo') || cmd.includes('image') || cmd.includes('visuel')) {
            const query = cmd.replace(/.*(pour|de|du|d'un|d')\s+/i, '').trim();
            const suggestions = this.getPhotoSuggestions(query);
            return {
                action: 'PHOTO_SUGGESTIONS',
                photos: suggestions,
                reply: `📸 **Studio Photo IA :** Voici les visuels HD recommandés pour **"${query || 'votre produit'}"**. Vous pouvez en sélectionner un en un clic.`
            };
        }

        // 3. Fallback vers le chat classique
        return this.handleAssistantChat(command, 'admin', db);
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
        if (query.includes('vente') || query.includes('chiffre') || query.includes('argent') || query.includes('revenu') || query.includes('ca')) {
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

    /**
     * 🥐 CONSEILLER GOURMAND CLIENT IA (Pour la Boutique & le Site Web)
     */
    async handleClientAdvisorChat(userPrompt = '', cartItems = [], db = null) {
        const q = (userPrompt || '').toLowerCase().trim();
        const hour = new Date().getHours();

        // 1. Recommandations par moment de la journée
        if (q.includes('matin') || q.includes('déjeuner') || q.includes('petit-déjeuner') || (hour >= 6 && hour < 11 && (q.includes('conseil') || q.includes('faim') || q.includes('recommande')))) {
            return {
                reply: "🌅 **Formule Réveil BABI :** Pour un petit-déjeuner parfait, nous vous recommandons notre **Croissant Pur Beurre** croustillant, accompagné d'une **Baguette Tradition** chaude et d'un **Jus de Passion** pressé du matin !",
                suggestedProducts: [
                    { nom: "Croissant", prix: 500, cat: "viennoiserie", img: "assets/Croissant.png" },
                    { nom: "Baguette Tradition", prix: 200, cat: "pain", img: "assets/baguette 200.png" },
                    { nom: "Jus de Passion", prix: 700, cat: "jus", img: "assets/jus de passion.png" }
                ]
            };
        }

        // 2. Pause midi / Déjeuner
        if (q.includes('midi') || q.includes('salé') || q.includes('manger') || q.includes('pizza') || q.includes('sandwich') || q.includes('panini') || (hour >= 11 && hour < 15 && (q.includes('faim') || q.includes('recommande')))) {
            return {
                reply: "🥪 **Pause Gourmande du Midi :** Notre **Panini Poulet Toasté** ou notre **Pizza Royale** sortent tout juste du four ! À accompagner avec un délicieux **Jus de Bissap** glacé.",
                suggestedProducts: [
                    { nom: "Panini Poulet", prix: 2000, cat: "sale", img: "assets/Panini.png" },
                    { nom: "Pizza Royale", prix: 2500, cat: "sale", img: "assets/Pizza.png" },
                    { nom: "Jus de Bissap", prix: 700, cat: "jus", img: "assets/jus de bissap.png" }
                ]
            };
        }

        // 3. Goûter & Douceurs
        if (q.includes('goûter') || q.includes('gouter') || q.includes('sucré') || q.includes('sucre') || q.includes('chocolat') || q.includes('cookie') || q.includes('crêpe') || (hour >= 15 && hour < 19 && (q.includes('faim') || q.includes('recommande')))) {
            return {
                reply: "🍪 **L'Heure du Goûter :** Laissez-vous tenter par nos **Cookies aux Pépites de Chocolat**, un **Pain au Chocolat** doré ou notre **Fondant au Chocolat** fondant à souhait !",
                suggestedProducts: [
                    { nom: "Cookies Chocolat", prix: 300, cat: "snack", img: "assets/cookies.png" },
                    { nom: "Pain au Chocolat", prix: 600, cat: "viennoiserie", img: "assets/pain au chocolat.png" },
                    { nom: "Fondant au Chocolat", prix: 1500, cat: "patisserie", img: "assets/Fondant au Chocolat.png" }
                ]
            };
        }

        // 4. Gâteaux & Événements
        if (q.includes('gâteau') || q.includes('gateau') || q.includes('anniversaire') || q.includes('fête') || q.includes('mariage') || q.includes('sur mesure')) {
            return {
                reply: "🎂 **Créations Festives sur-mesure :** Nos chefs pâtissiers confectionnent des gâteaux d'anniversaire et pièces montées personnalisés. Vous pouvez utiliser notre **Simulateur de Gâteau 3D** en ligne pour personnaliser la crème, la génoise et le message !",
                actionLink: "simulateur_gateau.html",
                actionText: "🎨 Ouvrir le Simulateur de Gâteau",
                suggestedProducts: [
                    { nom: "Gâteau Anniversaire Fraise", prix: 15000, cat: "patisserie", img: "assets/Gateau1.png" },
                    { nom: "Gâteau Chocolat Suprême", prix: 18000, cat: "patisserie", img: "assets/gateau2.png" }
                ]
            };
        }

        // 5. Livraison à Abidjan
        if (q.includes('livraison') || q.includes('livrer') || q.includes('abidjan') || q.includes('cocody') || q.includes('plateau') || q.includes('riviera') || q.includes('zone')) {
            return {
                reply: "🛵 **Livraison Express à Abidjan :** Nous livrons partout à Abidjan (Riviera, Cocody, Deux-Plateaux, Marcory, Plateau, Angré, Bingerville). Votre commande est préparée minute et livrée encore tiède !",
                suggestedProducts: []
            };
        }

        // 6. Pain Chaud & Cuisson
        if (q.includes('chaud') || q.includes('pain') || q.includes('fournée') || q.includes('four')) {
            return {
                reply: "🥖 **Le Pain Chaud de BABI :** Nos baguettes et pains complets sortent du four toutes les 45 minutes ! Cuisson sur sole de pierre au levain naturel.",
                suggestedProducts: [
                    { nom: "Baguette Tradition", prix: 200, cat: "pain", img: "assets/baguette 200.png" },
                    { nom: "Pain Complet", prix: 500, cat: "pain", img: "assets/Pain Complet (Grand).png" }
                ]
            };
        }

        // 7. Réponse générale & Bienvenue
        return {
            reply: "✨ **Bienvenue chez la Boulangerie de BABI !** Je suis votre Conseiller Gourmand IA. Que désirez-vous aujourd'hui ? Un pain croustillant, des viennoiseries dorées, un jus naturel ou un gâteau de fête ?",
            suggestedProducts: [
                { nom: "Baguette Tradition", prix: 200, cat: "pain", img: "assets/baguette 200.png" },
                { nom: "Croissant Beurre", prix: 500, cat: "viennoiserie", img: "assets/Croissant.png" },
                { nom: "Jus de Bissap", prix: 700, cat: "jus", img: "assets/jus de bissap.png" }
            ]
        };
    }

    /**
     * 🎂 CONSEILLER IA DU SIMULATEUR DE GÂTEAU
     */
    handleCakeAdvisor(occasion = 'anniversaire', flavor = 'chocolat', nbPersons = 10) {
        const occasionsMap = {
            'anniversaire': {
                message: "Joyeux Anniversaire & Plein de Bonheur !",
                deco: "Plaque personnalisée en chocolat doré, perles croustillantes et bougies étincelantes.",
                idealFlavor: "Chocolat Suprême & Cœur Fondant Praliné"
            },
            'mariage': {
                message: "Félicitations aux Mariés !",
                deco: "Finition cascade de roses en sucre, ruban satiné et perles nacrées.",
                idealFlavor: "Vanille de Madagascar & Coulis Fruits Rouges"
            },
            'bapteme': {
                message: "Bénédiction & Douceur pour ce Baptême",
                deco: "Tons pastels délicats, angelots en chocolat blanc.",
                idealFlavor: "Mousseline Vanille & Framboise fraîche"
            },
            'remerciement': {
                message: "Mille Mercis pour tout !",
                deco: "Élégant pochage crème chantilly et copeaux de chocolat noir.",
                idealFlavor: "Moka Café & Noisettes caramélisées"
            }
        };

        const occ = occasionsMap[occasion.toLowerCase()] || occasionsMap['anniversaire'];
        const estimatedPrice = Math.max(10000, Number(nbPersons || 10) * 1500);

        return {
            suggestedTitle: `Création Prestige ${occasion.charAt(0).toUpperCase() + occasion.slice(1)} (${nbPersons} parts)`,
            suggestedFlavor: occ.idealFlavor,
            suggestedMessage: occ.message,
            suggestedDecoration: occ.deco,
            estimatedPriceFCFA: estimatedPrice,
            advice: `Pour ${nbPersons} personnes, nous recommandons une base de ${Math.ceil(nbPersons / 6)} étages avec un équilibre génoise aérée et crème légère.`
        };
    }

    /**
     * 💳 VENTES ADDITIONNELLES IA POUR LA CAISSIÈRE POS
     */
    handleCashierUpsell(items = []) {
        const itemNames = items.map(i => (i.nom || i.name || '').toLowerCase()).join(' ');

        if (itemNames.includes('pain') || itemNames.includes('baguette')) {
            return {
                upsellMessage: "💡 Proposer une Viennoiserie ou une Boisson fraîche",
                suggestedProduct: { nom: "Croissant Pur Beurre", prix: 500, img: "assets/Croissant.png" }
            };
        }

        if (itemNames.includes('croissant') || itemNames.includes('chocolat')) {
            return {
                upsellMessage: "💡 Proposer un Jus Naturel ou un Café chaud",
                suggestedProduct: { nom: "Jus de Bissap Glacé", prix: 700, img: "assets/jus de bissap.png" }
            };
        }

        if (itemNames.includes('pizza') || itemNames.includes('panini') || itemNames.includes('burger')) {
            return {
                upsellMessage: "💡 Formule Midi : Proposer une boisson + dessert",
                suggestedProduct: { nom: "Jus de Passion d'Abidjan", prix: 700, img: "assets/jus de passion.png" }
            };
        }

        return {
            upsellMessage: "💡 Coup de cœur du jour : Baguette Tradition cuite sur sole",
            suggestedProduct: { nom: "Baguette Tradition", prix: 200, img: "assets/baguette 200.png" }
        };
    }
}

module.exports = new AiAssistantCopilotService();


