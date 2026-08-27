/**
 * ============================================================================
 * BOULANGERIE DE BABI — CONFIGURATION GLOBALE & ACCÉLÉRATEUR 0ms
 * ============================================================================
 * Fournit :
 * 1. Résolution dynamique et résiliente de window.API_BASE_URL / window.API_ROOT
 * 2. babiFetch() avec AbortController (timeout 2s max anti-blocage)
 * 3. Catalogue complet embarqué (window.BABI_EMBEDDED_CATALOG) pour affichage instantané 0ms
 * 4. Gestionnaire de cache ultra-rapide (babiGetCachedProducts / babiSetCachedProducts)
 */

(function() {
    // ------------------------------------------------------------------------
    // 1. DÉTECTION DYNAMIQUE DE L'URL API
    // ------------------------------------------------------------------------
    const isBrowser = typeof window !== 'undefined';
    let base = 'http://localhost:5000';

    if (isBrowser) {
        const host = window.location.hostname;
        const proto = window.location.protocol;

        if (host.includes('boulangeriedebabi.com')) {
            base = 'https://api.boulangeriedebabi.com';
        } else if (proto.startsWith('http')) {
            base = window.location.origin;
        } else {
            base = 'http://localhost:5000';
        }

        window.API_BASE_URL = base;
        window.API_ROOT = base;
    }

    // ------------------------------------------------------------------------
    // 2. UTILITAIRE RÉSEAU ULTRA-RAPIDE AVEC TIMEOUT (babiFetch)
    // ------------------------------------------------------------------------
    window.babiFetch = async function(url, options = {}, timeoutMs = 2500) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const finalOptions = {
                ...options,
                signal: controller.signal
            };
            const response = await fetch(url, finalOptions);
            clearTimeout(timer);
            return response;
        } catch (err) {
            clearTimeout(timer);
            throw err;
        }
    };

    // ------------------------------------------------------------------------
    // 3. CATALOGUE EMBARQUÉ 0ms (48+ Produits Officiels avec Images et Prix)
    // ------------------------------------------------------------------------
    const RAW_EMBEDDED_CATALOG = [
        // --- BOULANGERIE & PAINS ---
        { id: 1, nom: "Baguette 150", prix: 150, categorie: "pain", image: "assets/baguette 150.png", stock: 120, seuil_alerte: 20 },
        { id: 2, nom: "Baguette 200", prix: 200, categorie: "pain", image: "assets/baguette 200.png", stock: 150, seuil_alerte: 25 },
        { id: 3, nom: "Ficelle", prix: 500, categorie: "pain", image: "assets/baguette 150.png", stock: 40, seuil_alerte: 10 },
        { id: 4, nom: "Pain Complet (Grand)", prix: 1000, categorie: "pain", image: "assets/Pain Complet (Grand).png", stock: 35, seuil_alerte: 10 },
        { id: 5, nom: "Pain Complet (Petit)", prix: 500, categorie: "pain", image: "assets/pain complet 2.png", stock: 45, seuil_alerte: 10 },
        { id: 6, nom: "Pain Sans Sel", prix: 150, categorie: "pain", image: "assets/pain sans sel.png", stock: 40, seuil_alerte: 10 },
        { id: 7, nom: "Petit Pain (50F)", prix: 50, categorie: "pain", image: "assets/pain individuel.png", stock: 80, seuil_alerte: 15 },
        { id: 8, nom: "Petit Pain (100F)", prix: 100, categorie: "pain", image: "assets/pain individuel.png", stock: 70, seuil_alerte: 15 },
        { id: 9, nom: "Biscotte", prix: 500, categorie: "pain", image: "assets/biscottes.png", stock: 50, seuil_alerte: 10 },
        { id: 10, nom: "Pain Panini", prix: 100, categorie: "pain", image: "assets/Panini.png", stock: 60, seuil_alerte: 15 },
        { id: 11, nom: "Pain Parisien", prix: 300, categorie: "pain", image: "assets/baguette 200.png", stock: 40, seuil_alerte: 10 },
        { id: 12, nom: "Pain Viennois (500F)", prix: 500, categorie: "pain", image: "assets/baguette 150.png", stock: 30, seuil_alerte: 10 },
        { id: 13, nom: "Pain Viennois (700F)", prix: 700, categorie: "pain", image: "assets/baguette 200.png", stock: 25, seuil_alerte: 8 },
        { id: 14, nom: "Suzette", prix: 300, categorie: "pain", image: "assets/baguette 150.png", stock: 30, seuil_alerte: 10 },

        // --- VIENNOISERIES & SNACKS ---
        { id: 15, nom: "Croissant", prix: 300, categorie: "viennoiserie", image: "assets/Croissant.png", stock: 60, seuil_alerte: 15 },
        { id: 16, nom: "Pain au Chocolat", prix: 300, categorie: "viennoiserie", image: "assets/pain au chocolat.png", stock: 60, seuil_alerte: 15 },
        { id: 17, nom: "Pain aux Raisins", prix: 300, categorie: "viennoiserie", image: "assets/pain aux raisins.png", stock: 45, seuil_alerte: 10 },
        { id: 18, nom: "Chausson aux Pommes", prix: 400, categorie: "viennoiserie", image: "assets/chausson aux pommes.png", stock: 40, seuil_alerte: 10 },
        { id: 19, nom: "Choco Suisse", prix: 400, categorie: "viennoiserie", image: "assets/choco suisse.png", stock: 40, seuil_alerte: 10 },
        { id: 20, nom: "Torsade", prix: 350, categorie: "viennoiserie", image: "assets/torsade.png", stock: 35, seuil_alerte: 10 },
        { id: 21, nom: "Palmiers", prix: 300, categorie: "viennoiserie", image: "assets/palmier.png", stock: 50, seuil_alerte: 12 },
        { id: 22, nom: "Madeleines (l'unité)", prix: 150, categorie: "viennoiserie", image: "assets/madeleine unite.png", stock: 80, seuil_alerte: 20 },
        { id: 23, nom: "Sachet de Madeleines", prix: 1000, categorie: "viennoiserie", image: "assets/sachet madeleine.png", stock: 40, seuil_alerte: 10 },
        { id: 24, nom: "Charaphe au Raisin", prix: 400, categorie: "viennoiserie", image: "assets/charaphe au raisin.png", stock: 30, seuil_alerte: 8 },
        { id: 25, nom: "Cookies (l'unité)", prix: 300, categorie: "viennoiserie", image: "assets/cookies.png", stock: 60, seuil_alerte: 15 },
        { id: 26, nom: "Lot de Cookies", prix: 1500, categorie: "viennoiserie", image: "assets/cookies.png", stock: 25, seuil_alerte: 8 },

        // --- PÂTISSERIES & GÂTEAUX ---
        { id: 27, nom: "Gâteau Pâtissier 10 000F", prix: 10000, categorie: "patisserie", image: "assets/Gateau1.png", stock: 10, seuil_alerte: 2 },
        { id: 28, nom: "Gâteau Pâtissier 15 000F", prix: 15000, categorie: "patisserie", image: "assets/Gateau1.1.png", stock: 8, seuil_alerte: 2 },
        { id: 29, nom: "Gâteau Pâtissier 20 000F", prix: 20000, categorie: "patisserie", image: "assets/Gateau1.2.png", stock: 6, seuil_alerte: 2 },
        { id: 30, nom: "Gâteau Pâtissier Prestige 25 000F", prix: 25000, categorie: "patisserie", image: "assets/gateau2.png", stock: 5, seuil_alerte: 2 },
        { id: 31, nom: "Flan", prix: 500, categorie: "patisserie", image: "assets/Flan.png", stock: 35, seuil_alerte: 10 },

        // --- BOISSONS & JUS NATURELS ---
        { id: 32, nom: "Baobab", prix: 500, categorie: "boisson", image: "assets/jus de baobab petit.png", stock: 50, seuil_alerte: 15 },
        { id: 33, nom: "Bissap", prix: 2000, categorie: "boisson", image: "assets/jus de bissap.png", stock: 40, seuil_alerte: 10 },
        { id: 34, nom: "Gingembre", prix: 3000, categorie: "boisson", image: "assets/jus de gingembre.png", stock: 30, seuil_alerte: 8 },
        { id: 35, nom: "Passion (Petite Bouteille)", prix: 700, categorie: "boisson", image: "assets/jus de passion.png", stock: 45, seuil_alerte: 10 },
        { id: 36, nom: "Passion (Grand Format)", prix: 3000, categorie: "boisson", image: "assets/jus de passion.png", stock: 25, seuil_alerte: 6 },
        { id: 37, nom: "Tamarin", prix: 2000, categorie: "boisson", image: "assets/jus de tamari.png", stock: 30, seuil_alerte: 8 },
        { id: 38, nom: "Cocktail", prix: 3000, categorie: "boisson", image: "assets/cocktail.png", stock: 25, seuil_alerte: 6 },
        { id: 39, nom: "Citron", prix: 2000, categorie: "boisson", image: "assets/jus de citron.png", stock: 30, seuil_alerte: 8 },
        { id: 40, nom: "Chocolat Chaud", prix: 3000, categorie: "boisson", image: "assets/Chocolat Chaud.png", stock: 25, seuil_alerte: 6 },
        { id: 41, nom: "Eau Minérale (Petite)", prix: 200, categorie: "boisson", image: "assets/bouteille celeste.png", stock: 100, seuil_alerte: 25 },
        { id: 42, nom: "Eau Minérale (Grande)", prix: 1000, categorie: "boisson", image: "assets/bouteille celeste.png", stock: 60, seuil_alerte: 15 },
        { id: 43, nom: "Orangina", prix: 500, categorie: "boisson", image: "assets/Orangina.png", stock: 60, seuil_alerte: 15 },
        { id: 44, nom: "Sprite", prix: 500, categorie: "boisson", image: "assets/sprite.png", stock: 55, seuil_alerte: 12 },
        { id: 45, nom: "Chill", prix: 500, categorie: "boisson", image: "assets/chill.png", stock: 50, seuil_alerte: 12 },
        { id: 46, nom: "Youyou", prix: 500, categorie: "boisson", image: "assets/youzou.png", stock: 50, seuil_alerte: 12 },
        { id: 47, nom: "Word Cola", prix: 500, categorie: "boisson", image: "assets/world cola.png", stock: 60, seuil_alerte: 15 },
        { id: 48, nom: "Énergie Malt", prix: 700, categorie: "boisson", image: "assets/energie malt .png", stock: 45, seuil_alerte: 10 }
    ].map(p => ({
        ...p,
        name: p.nom,
        price: p.prix,
        category: p.categorie,
        is_active: 1,
        active: 1
    }));

    window.BABI_EMBEDDED_CATALOG = RAW_EMBEDDED_CATALOG;

    // ------------------------------------------------------------------------
    // 4. CACHE MANAGER SYNCHRONE
    // ------------------------------------------------------------------------
    window.babiGetCachedProducts = function() {
        try {
            const cached = localStorage.getItem('babi_cached_products');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (_) {}
        return RAW_EMBEDDED_CATALOG;
    };

    window.babiSetCachedProducts = function(products) {
        try {
            if (Array.isArray(products) && products.length > 0) {
                localStorage.setItem('babi_cached_products', JSON.stringify(products));
            }
        } catch (_) {}
    };

    // Auto-initialisation immédiate du cache si vide
    if (!localStorage.getItem('babi_cached_products')) {
        window.babiSetCachedProducts(RAW_EMBEDDED_CATALOG);
    }
})();
