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
        const proto = window.location.protocol;

        if (proto.startsWith('http')) {
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
    window.babiFetch = async function(url, options = {}, timeoutMs = 8000) {
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
    // 3. CATALOGUE EMBARQUÉ & CACHE SYNCHRONE DIRECT (AVEC PROTECTION ANTI-RÉSURRECTION)
    // ------------------------------------------------------------------------
    window.BABI_EMBEDDED_CATALOG = [
  {
    "id": 1,
    "nom": "Baguette Super Croustillante",
    "prix": 400,
    "categorie": "pain",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Baguette cuite au feu de bois.",
    "image": "assets/product_baguette.png",
    "is_active": 1
  },
  {
    "id": 2,
    "nom": "Baguette Traditionnelle 200F",
    "prix": 200,
    "categorie": "pain",
    "stock": 150,
    "seuil_alerte": 25,
    "description": "Baguette de tradition au levain naturel à la croûte dorée et mie alvéolée.",
    "image": "assets/baguette 200.png",
    "is_active": 1
  },
  {
    "id": 3,
    "nom": "Ficelle Croquante",
    "prix": 500,
    "categorie": "pain",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Baguette fine extra croquante idéale pour les toasts et l'apéritif.",
    "image": "assets/baguette 150.png",
    "is_active": 1
  },
  {
    "id": 4,
    "nom": "Pain Complet (Grand Format)",
    "prix": 1000,
    "categorie": "pain",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Pain complet riche en fibres, farine intégrale de blé pour une digestion légère.",
    "image": "assets/Pain Complet (Grand).png",
    "is_active": 1
  },
  {
    "id": 5,
    "nom": "Pain Complet (Format Moyen)",
    "prix": 500,
    "categorie": "pain",
    "stock": 50,
    "seuil_alerte": 10,
    "description": "Format idéal pour les tartines saines du petit-déjeuner et équilibre quotidien.",
    "image": "assets/pain complet 2.png",
    "is_active": 1
  },
  {
    "id": 6,
    "nom": "Pain Complet Artisanal Graines",
    "prix": 700,
    "categorie": "pain",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Pain complet parsemé de graines torréfiées de lin, tournesol et sésame.",
    "image": "assets/pain complet 3.png",
    "is_active": 1
  },
  {
    "id": 7,
    "nom": "Pain Sans Sel Diététique",
    "prix": 150,
    "categorie": "pain",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Pain léger élaboré sans aucun ajout de sel pour régimes hyposodés.",
    "image": "assets/pain sans sel.png",
    "is_active": 1
  },
  {
    "id": 8,
    "nom": "Petit Pain Individuel (50F)",
    "prix": 50,
    "categorie": "pain",
    "stock": 200,
    "seuil_alerte": 30,
    "description": "Petit pain de table moelleux à l'unité, parfait pour accompagner tous les repas.",
    "image": "assets/pain individuel.png",
    "is_active": 1
  },
  {
    "id": 9,
    "nom": "Petit Pain Individuel (100F)",
    "prix": 100,
    "categorie": "pain",
    "stock": 150,
    "seuil_alerte": 25,
    "description": "Pain de table doré pour réceptions, événements et buffets raffinés.",
    "image": "assets/pain individuel.png",
    "is_active": 1
  },
  {
    "id": 10,
    "nom": "Pain Cabré Régional",
    "prix": 700,
    "categorie": "pain",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Pain rustique à la mie alvéolée et croûte épaisse, recette traditionnelle.",
    "image": "assets/cabre.png",
    "is_active": 1
  },
  {
    "id": 11,
    "nom": "Pain Marbré Rustique",
    "prix": 500,
    "categorie": "pain",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Pain spécial marbré bicolore cuit au fournil, doux et aromatique.",
    "image": "assets/marbre.png",
    "is_active": 1
  },
  {
    "id": 12,
    "nom": "Pain Marbré Tradition 1.1",
    "prix": 600,
    "categorie": "pain",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Pain marbré artisanal aux arômes délicatement vanillés et chocolatés.",
    "image": "assets/marbre1.1.png",
    "is_active": 1
  },
  {
    "id": 13,
    "nom": "Pain de Mie Spécial (Grand Format)",
    "prix": 2000,
    "categorie": "pain",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Grand pain de mie artisanal extra-moelleux sans conservateur artificiel.",
    "image": "assets/pain de mie.png",
    "is_active": 1
  },
  {
    "id": 14,
    "nom": "Pain Parisien Doré",
    "prix": 300,
    "categorie": "pain",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Bâtard parisien traditionnel à la croûte dorée et croustillante.",
    "image": "assets/pain  parisien.jpeg",
    "is_active": 1
  },
  {
    "id": 15,
    "nom": "Pain de Campagne Artisanal",
    "prix": 800,
    "categorie": "pain",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Pain au levain naturel à longue fermentation, saveur authentique d'antan.",
    "image": "assets/product_campagne.png",
    "is_active": 1
  },
  {
    "id": 16,
    "nom": "Pain Canadien Multigraines",
    "prix": 700,
    "categorie": "pain",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Pain nordique complet enrichi aux céréales et graines croquantes.",
    "image": "assets/pain complet 3.png",
    "is_active": 1
  },
  {
    "id": 17,
    "nom": "Pain Viennois Pépites de Chocolat",
    "prix": 500,
    "categorie": "pain",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Pain brioché viennois parsemé de véritables pépites de chocolat noir.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 18,
    "nom": "Grand Pain Viennois Pépites (700F)",
    "prix": 700,
    "categorie": "pain",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Grand format généreux de pain viennois pour le goûter des enfants.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 19,
    "nom": "Pain au Lait Sucré Tradition",
    "prix": 200,
    "categorie": "pain",
    "stock": 70,
    "seuil_alerte": 15,
    "description": "Pain doux et sucré au lait frais pasteurisé, fondant en bouche.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 20,
    "nom": "Croissant Pur Beurre",
    "prix": 500,
    "categorie": "viennoiserie",
    "stock": 90,
    "seuil_alerte": 20,
    "description": "Feuilletage doré croustillant au pur beurre de baratte, spécialité maison.",
    "image": "assets/Croissant.png",
    "is_active": 1
  },
  {
    "id": 21,
    "nom": "Croissant aux Amandes",
    "prix": 600,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Croissant pur beurre fourré d'une onctueuse crème d'amande et effilées.",
    "image": "assets/Croissant.png",
    "is_active": 1
  },
  {
    "id": 22,
    "nom": "Pain au Chocolat (Chocolatine)",
    "prix": 500,
    "categorie": "viennoiserie",
    "stock": 100,
    "seuil_alerte": 20,
    "description": "Viennoiserie feuilletée pur beurre avec 2 barres de chocolat noir intense.",
    "image": "assets/pain au chocolat.png",
    "is_active": 1
  },
  {
    "id": 23,
    "nom": "Pain aux Raisins (Escargot)",
    "prix": 700,
    "categorie": "viennoiserie",
    "stock": 50,
    "seuil_alerte": 10,
    "description": "Feuilleté en spirale garni de crème pâtissière vanillée et raisins de Corinthe.",
    "image": "assets/pain au raisin.png",
    "is_active": 1
  },
  {
    "id": 24,
    "nom": "Chausson aux Pommes Doré",
    "prix": 1000,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Chausson généreusement garni d'une compote de pommes parfumée à la vanille.",
    "image": "assets/chausson aux pommes.png",
    "is_active": 1
  },
  {
    "id": 25,
    "nom": "Choco Suisse Suprême",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Brioche feuilletée garnie de crème pâtissière et d'une cascade de pépites.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 26,
    "nom": "Torsade au Chocolat",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Torsade feuilletée croustillante garnie de crème onctueuse et chocolat.",
    "image": "assets/torsade.png",
    "is_active": 1
  },
  {
    "id": 27,
    "nom": "Palmier Croustillant Pur Beurre",
    "prix": 200,
    "categorie": "viennoiserie",
    "stock": 80,
    "seuil_alerte": 15,
    "description": "Grand cœur de feuilletage pur beurre caramélisé au sucre candi.",
    "image": "assets/palmier.png",
    "is_active": 1
  },
  {
    "id": 28,
    "nom": "Double Palmier Feuilleté",
    "prix": 350,
    "categorie": "viennoiserie",
    "stock": 50,
    "seuil_alerte": 10,
    "description": "Duo de palmiers croustillants et délicatement caramélisés.",
    "image": "assets/palmier2.png",
    "is_active": 1
  },
  {
    "id": 29,
    "nom": "Biscotte Artisanale (Paquet)",
    "prix": 1000,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Paquet de biscottes croustillantes dorées au four pour le petit-déjeuner.",
    "image": "assets/biscottes.png",
    "is_active": 1
  },
  {
    "id": 30,
    "nom": "Charaphe au Raisin",
    "prix": 700,
    "categorie": "viennoiserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Spécialité viennoise moelleuse garnie de crème et raisins dorés.",
    "image": "assets/charaphe au raisin.png",
    "is_active": 1
  },
  {
    "id": 31,
    "nom": "Cookies aux Pépites de Chocolat (l'unité)",
    "prix": 200,
    "categorie": "viennoiserie",
    "stock": 120,
    "seuil_alerte": 20,
    "description": "Cookie croustillant sur les bords avec un cœur fondant aux pépites de chocolat.",
    "image": "assets/cookies.png",
    "is_active": 1
  },
  {
    "id": 32,
    "nom": "Lot de Cookies Gourmands (Sachet de 6)",
    "prix": 1000,
    "categorie": "viennoiserie",
    "stock": 50,
    "seuil_alerte": 10,
    "description": "Sachet de 6 cookies artisanaux aux pépites de chocolat noir et au lait.",
    "image": "assets/cookies.png",
    "is_active": 1
  },
  {
    "id": 33,
    "nom": "Cookie Chocolat Blanc & Noisettes",
    "prix": 250,
    "categorie": "viennoiserie",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Cookie savoureux aux éclats de noisettes grillées et chocolat blanc velouté.",
    "image": "assets/cookies_unite.png",
    "is_active": 1
  },
  {
    "id": 34,
    "nom": "Madeleine Pur Beurre (l'unité)",
    "prix": 100,
    "categorie": "viennoiserie",
    "stock": 150,
    "seuil_alerte": 30,
    "description": "Madeleine tendre traditionnelle à la forme coquille et arôme citronné.",
    "image": "assets/madeleine unite.png",
    "is_active": 1
  },
  {
    "id": 35,
    "nom": "Lot de Madeleines (Sachet de 6)",
    "prix": 500,
    "categorie": "viennoiserie",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Sachet familial de 6 madeleines pur beurre ultra-moelleuses.",
    "image": "assets/lots de madeleine.png",
    "is_active": 1
  },
  {
    "id": 36,
    "nom": "Américain Feuilleté Doré",
    "prix": 700,
    "categorie": "viennoiserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Viennoiserie américaine feuilletée et dorée à souhait.",
    "image": "assets/Croissant.png",
    "is_active": 1
  },
  {
    "id": 37,
    "nom": "Brioche Tressée Pur Beurre",
    "prix": 1200,
    "categorie": "viennoiserie",
    "stock": 25,
    "seuil_alerte": 10,
    "description": "Brioche artisanale tressée à la main, mie filante et beurre fin.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 38,
    "nom": "Briochette Individuelle au Sucre",
    "prix": 300,
    "categorie": "viennoiserie",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Petite brioche individuelle saupoudrée de grains de sucre perlé.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 39,
    "nom": "Pain Évêque Doré",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Viennoiserie royale moelleuse au beurre fin et sucre glace.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 40,
    "nom": "Flan Pâtissier Traditionnel",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Part généreuse de flan crémeux à la véritable gousse de vanille Bourbon.",
    "image": "assets/Flan.png",
    "is_active": 1
  },
  {
    "id": 41,
    "nom": "Fondant au Chocolat Suprême",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Gâteau individuel au cœur coulant chocolat noir grand cru 70%.",
    "image": "assets/Fondant au Chocolat.png",
    "is_active": 1
  },
  {
    "id": 42,
    "nom": "Gâteau Moka Café 1500F",
    "prix": 1500,
    "categorie": "patisserie",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Génoise fine imbibée et crème au beurre extrait naturel de café.",
    "image": "assets/moka1.png",
    "is_active": 1
  },
  {
    "id": 43,
    "nom": "Gâteau Moka Prestige 1.1",
    "prix": 1800,
    "categorie": "patisserie",
    "stock": 25,
    "seuil_alerte": 10,
    "description": "Moka d'exception aux amandes grillées et ganache onctueuse.",
    "image": "assets/moka1.1.png",
    "is_active": 1
  },
  {
    "id": 44,
    "nom": "Gâteau Moka Cérémonie 1.2",
    "prix": 2000,
    "categorie": "patisserie",
    "stock": 20,
    "seuil_alerte": 5,
    "description": "Moka grand format pour réceptions familiales et dégustations gourmandes.",
    "image": "assets/moka1.2.png",
    "is_active": 1
  },
  {
    "id": 45,
    "nom": "Cupcake Vanille Moelleux",
    "prix": 500,
    "categorie": "patisserie",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Cupcake moelleux à la vanille surmonté d'un dôme de crème chantilly.",
    "image": "assets/moka1.1.png",
    "is_active": 1
  },
  {
    "id": 46,
    "nom": "Cupcake Tout Chocolat",
    "prix": 500,
    "categorie": "patisserie",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Cupcake pur cacao garni d'une ganache chocolat noir veloutée.",
    "image": "assets/moka1.2.png",
    "is_active": 1
  },
  {
    "id": 47,
    "nom": "Cake Tranche (Marbré Cacao)",
    "prix": 300,
    "categorie": "patisserie",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Tranche épaisse de cake marbré chocolat et vanille pour le thé.",
    "image": "assets/cake.png",
    "is_active": 1
  },
  {
    "id": 48,
    "nom": "Cake Tranche (Citron Frais)",
    "prix": 300,
    "categorie": "patisserie",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Tranche de cake moelleux parfumé aux zestes de citron vert pressé.",
    "image": "assets/cake1.png",
    "is_active": 1
  },
  {
    "id": 49,
    "nom": "Cake Entier Familial 700F",
    "prix": 700,
    "categorie": "patisserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Cake entier prêt à découper pour le goûter en famille.",
    "image": "assets/cake1.png",
    "is_active": 1
  },
  {
    "id": 50,
    "nom": "Cake Familial Supérieur 1.1",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Grand cake familial pur beurre aux fruits confits et vanille.",
    "image": "assets/cake1.1.png",
    "is_active": 1
  },
  {
    "id": 51,
    "nom": "Crêpe au Nutella Chaude",
    "prix": 2000,
    "categorie": "patisserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Grande crêpe minute tartinée de Nutella gourmand et éclats de noisettes.",
    "image": "assets/crepe au nutella.png",
    "is_active": 1
  },
  {
    "id": 52,
    "nom": "Crêpe Fine à la Vanille",
    "prix": 1500,
    "categorie": "patisserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Crêpe fine traditionnelle saupoudrée de sucre vanillé et beurre doux.",
    "image": "assets/crepe a la vanille.png",
    "is_active": 1
  },
  {
    "id": 53,
    "nom": "Crêpe Suzette aux Agrumes",
    "prix": 1500,
    "categorie": "patisserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Crêpe parfumée au sirop d'orange caramélisé et zeste d'agrumes.",
    "image": "assets/Crêpe Suzette.png",
    "is_active": 1
  },
  {
    "id": 54,
    "nom": "Crêpe Gourmande Fruits Rouges",
    "prix": 2000,
    "categorie": "patisserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Crêpe minute accompagnée d'un coulis de fruits rouges et crème fouettée.",
    "image": "assets/crepe rouge.png",
    "is_active": 1
  },
  {
    "id": 55,
    "nom": "Crêpe Soleil Sucre & Citron",
    "prix": 1200,
    "categorie": "patisserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Crêpe fraîche nappée de jus de citron vert et sucre glace cristallisé.",
    "image": "assets/crepe jaune.png",
    "is_active": 1
  },
  {
    "id": 56,
    "nom": "Glace Artisanale (Pot 200ml)",
    "prix": 1000,
    "categorie": "glace",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Pot individuel de crème glacée artisanale (Vanille, Chocolat, Fraise).",
    "image": "assets/glace.png",
    "is_active": 1
  },
  {
    "id": 57,
    "nom": "Glace Artisanale Double Boule",
    "prix": 1500,
    "categorie": "glace",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Coupe double boule de glace artisanale avec nappage et chantilly.",
    "image": "assets/product_glace.png",
    "is_active": 1
  },
  {
    "id": 58,
    "nom": "Gâteau Anniversaire (10 pers.)",
    "prix": 10000,
    "categorie": "patisserie",
    "stock": 12,
    "seuil_alerte": 3,
    "description": "Gâteau d'anniversaire personnalisé au choix, génoise et fruits frais (10 pers).",
    "image": "assets/Gateau1.png",
    "is_active": 1
  },
  {
    "id": 59,
    "nom": "Gâteau Événement (15 pers.)",
    "prix": 15000,
    "categorie": "patisserie",
    "stock": 10,
    "seuil_alerte": 3,
    "description": "Gâteau pâtissier festif décoré pour célébrations et baptêmes (15 pers).",
    "image": "assets/Gateau1.1.png",
    "is_active": 1
  },
  {
    "id": 60,
    "nom": "Gâteau Prestige (20 pers.)",
    "prix": 20000,
    "categorie": "patisserie",
    "stock": 8,
    "seuil_alerte": 2,
    "description": "Gâteau de prestige 3 étages chocolat et fruits exotiques (20 pers).",
    "image": "assets/Gateau1.2.png",
    "is_active": 1
  },
  {
    "id": 61,
    "nom": "Gâteau Cérémonie Royale (25 pers.)",
    "prix": 25000,
    "categorie": "patisserie",
    "stock": 6,
    "seuil_alerte": 2,
    "description": "Pièce montée royale d'exception pour grandes cérémonies (25 pers).",
    "image": "assets/gateau2.png",
    "is_active": 1
  },
  {
    "id": 62,
    "nom": "Gâteau de Mariage Prestige",
    "prix": 35000,
    "categorie": "patisserie",
    "stock": 5,
    "seuil_alerte": 2,
    "description": "Chef-d'œuvre de haute pâtisserie pour noces et réceptions de mariage.",
    "image": "assets/gateau de mariiage.png",
    "is_active": 1
  },
  {
    "id": 63,
    "nom": "Gâteau Mariage Fleur d'Oranger",
    "prix": 40000,
    "categorie": "patisserie",
    "stock": 4,
    "seuil_alerte": 2,
    "description": "Pièce montée de mariage majestueuse ornée de fleurs en sucre comestibles.",
    "image": "assets/gateau mariage.png",
    "is_active": 1
  },
  {
    "id": 64,
    "nom": "Gâteau d'Événement Sur-Mesure",
    "prix": 30000,
    "categorie": "patisserie",
    "stock": 6,
    "seuil_alerte": 2,
    "description": "Création personnalisée sur devis et commande avec vos décors et thèmes.",
    "image": "assets/gateau evenement.png",
    "is_active": 1
  },
  {
    "id": 65,
    "nom": "Gâteau Event Festif 28000F",
    "prix": 28000,
    "categorie": "patisserie",
    "stock": 5,
    "seuil_alerte": 2,
    "description": "Gâteau festif coloré pour anniversaires d'enfants et célébrations.",
    "image": "assets/gateau event.png",
    "is_active": 1
  },
  {
    "id": 66,
    "nom": "Gâteau Événementiel Design 2",
    "prix": 35000,
    "categorie": "patisserie",
    "stock": 5,
    "seuil_alerte": 2,
    "description": "Gâteau d'artisan décoré sur-mesure pour galas et entreprises.",
    "image": "assets/gateau  d evenement2.png",
    "is_active": 1
  },
  {
    "id": 67,
    "nom": "Bûche de Noël Chocolat (Petite)",
    "prix": 5000,
    "categorie": "patisserie",
    "stock": 20,
    "seuil_alerte": 5,
    "description": "Bûche pâtissière chocolat noir et praliné croustillant (4 à 6 pers).",
    "image": "assets/buche de noel.png",
    "is_active": 1
  },
  {
    "id": 68,
    "nom": "Bûche de Noël Royale (Grande)",
    "prix": 7000,
    "categorie": "patisserie",
    "stock": 20,
    "seuil_alerte": 5,
    "description": "Grande bûche festive traditionnelle pour 8 à 10 personnes.",
    "image": "assets/buche de noel.png",
    "is_active": 1
  },
  {
    "id": 69,
    "nom": "Forêt Noire Royale aux Cerises",
    "prix": 2500,
    "categorie": "patisserie",
    "stock": 25,
    "seuil_alerte": 5,
    "description": "Part généreuse de forêt noire, génoise cacao, cerises griottes et chantilly.",
    "image": "assets/product_foret_noire.png",
    "is_active": 1
  },
  {
    "id": 70,
    "nom": "Éclair au Chocolat Pur Cacao",
    "prix": 700,
    "categorie": "patisserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Pâte à choux pur beurre garnie d'une crème chocolat noir et glaçage miroir.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 71,
    "nom": "Tarte au Citron Meringuée",
    "prix": 1200,
    "categorie": "patisserie",
    "stock": 30,
    "seuil_alerte": 5,
    "description": "Pâte sablée croquante, crème citron acidulée et meringue italienne dorée.",
    "image": "assets/Gateau1.png",
    "is_active": 1
  },
  {
    "id": 72,
    "nom": "Jus Naturel (Petit Format 30cl)",
    "prix": 300,
    "categorie": "jus",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Bouteille nomade 30cl de pur jus de fruits frais artisanal.",
    "image": "assets/jus de baobab petit.png",
    "is_active": 1
  },
  {
    "id": 73,
    "nom": "Jus Naturel (Moyen Format 50cl)",
    "prix": 500,
    "categorie": "jus",
    "stock": 65,
    "seuil_alerte": 15,
    "description": "Bouteille 50cl de jus artisanal frais pressé sans conservateurs.",
    "image": "assets/jus de baobab.png",
    "is_active": 1
  },
  {
    "id": 74,
    "nom": "Jus Naturel Familial (Bouteille 1.5L)",
    "prix": 2000,
    "categorie": "jus",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Grand format familial 1.5 Litres de jus naturel pour toute la table.",
    "image": "assets/jus de passion.png",
    "is_active": 1
  },
  {
    "id": 75,
    "nom": "Jus de Passion (Grand Format 1.5L)",
    "prix": 3000,
    "categorie": "jus",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Jus pur maracudja 100% naturel acidulé et parfumé (Bouteille 1.5L).",
    "image": "assets/jus de passion.png",
    "is_active": 1
  },
  {
    "id": 76,
    "nom": "Jus de Passion Frais 50cl",
    "prix": 700,
    "categorie": "jus",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Bouteille 50cl de jus de fruits de la passion pur d'Abidjan.",
    "image": "assets/jus de passion.png",
    "is_active": 1
  },
  {
    "id": 77,
    "nom": "Jus de Baobab (Pain de Singe) 50cl",
    "prix": 500,
    "categorie": "jus",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Jus de baobab onctueux et velouté riche en vitamines et minéraux.",
    "image": "assets/jus de baobab.png",
    "is_active": 1
  },
  {
    "id": 78,
    "nom": "Jus de Baobab Nomade 30cl",
    "prix": 300,
    "categorie": "jus",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Format 30cl de jus de baobab artisanal pour un regain d'énergie.",
    "image": "assets/jus de baobab petit.png",
    "is_active": 1
  },
  {
    "id": 79,
    "nom": "Jus de Bissap Supérieur 1.5L",
    "prix": 2000,
    "categorie": "jus",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Infusion d'hibiscus rouge de qualité supérieure parfumée à la menthe (1.5L).",
    "image": "assets/jus de bissap.png",
    "is_active": 1
  },
  {
    "id": 80,
    "nom": "Jus de Bissap Maison Mentholé 50cl",
    "prix": 500,
    "categorie": "jus",
    "stock": 80,
    "seuil_alerte": 20,
    "description": "Bouteille 50cl de bissap frais artisanal avec feuilles de menthe fraîche.",
    "image": "assets/jus de bissap.png",
    "is_active": 1
  },
  {
    "id": 81,
    "nom": "Jus de Gingembre (Gnamankoudji) 1.5L",
    "prix": 3000,
    "categorie": "jus",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Jus de gingembre pur épicé, tonique et stimulant (Grande bouteille 1.5L).",
    "image": "assets/jus de gingembre.png",
    "is_active": 1
  },
  {
    "id": 82,
    "nom": "Jus de Gingembre Énergisant 50cl",
    "prix": 700,
    "categorie": "jus",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Bouteille 50cl de gnamankoudji frais pressé pour faire le plein de tonus.",
    "image": "assets/jus de gingembre.png",
    "is_active": 1
  },
  {
    "id": 83,
    "nom": "Jus de Tamarin Acidulé 1.5L",
    "prix": 2000,
    "categorie": "jus",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Jus de tamarin artisanal rafraîchissant et très digeste (1.5L).",
    "image": "assets/jus de tamari.png",
    "is_active": 1
  },
  {
    "id": 84,
    "nom": "Jus de Tomi Traditionnel 50cl",
    "prix": 600,
    "categorie": "jus",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Jus de tomi préparé selon la recette traditionnelle ivoirienne.",
    "image": "assets/jus de tomi.png",
    "is_active": 1
  },
  {
    "id": 85,
    "nom": "Cocktail Tropical d'Abidjan 1.5L",
    "prix": 3000,
    "categorie": "jus",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Mélange fruité frais d'ananas, mangue, orange et passion (1.5L).",
    "image": "assets/cocktail.png",
    "is_active": 1
  },
  {
    "id": 86,
    "nom": "Cocktail Tropical 50cl",
    "prix": 800,
    "categorie": "jus",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Bouteille 50cl de cocktail de fruits frais pressé à froid.",
    "image": "assets/cocktail.png",
    "is_active": 1
  },
  {
    "id": 87,
    "nom": "Jus de Citron Pressé 1.5L",
    "prix": 2000,
    "categorie": "jus",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Limonade artisanale au pur jus de citrons verts d'Abidjan (1.5L).",
    "image": "assets/jus de citron.png",
    "is_active": 1
  },
  {
    "id": 88,
    "nom": "Jus d'Ananas Pur Frais 50cl",
    "prix": 600,
    "categorie": "jus",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "100% pur jus d'ananas pain de sucre de Côte d'Ivoire sans sucre ajouté.",
    "image": "assets/product_jus_ananas.png",
    "is_active": 1
  },
  {
    "id": 89,
    "nom": "Jus d'Ananas Pur Frais 1.5L",
    "prix": 2500,
    "categorie": "jus",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Bouteille 1.5L de pur jus d'ananas pressé le matin même au fournil.",
    "image": "assets/product_jus_ananas.png",
    "is_active": 1
  },
  {
    "id": 90,
    "nom": "Chill Citron Glacé",
    "prix": 700,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Boisson gazeuse rafraîchissante au citron très pétillante et glacée.",
    "image": "assets/chill.png",
    "is_active": 1
  },
  {
    "id": 91,
    "nom": "Youyou Fruité",
    "prix": 500,
    "categorie": "boisson",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Boisson fruitée locale et désaltérante idéale avec vos viennoiseries.",
    "image": "assets/youzou.png",
    "is_active": 1
  },
  {
    "id": 92,
    "nom": "World Cola Frais",
    "prix": 500,
    "categorie": "boisson",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Soda cola très pétillant servi bien frais.",
    "image": "assets/world cola.png",
    "is_active": 1
  },
  {
    "id": 93,
    "nom": "Youki Orange Intense",
    "prix": 500,
    "categorie": "boisson",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Boisson gazeuse rafraîchissante saveur orange intense.",
    "image": "assets/youki moka cafe.png",
    "is_active": 1
  },
  {
    "id": 94,
    "nom": "Youki Pomme Pétillant",
    "prix": 500,
    "categorie": "boisson",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Boisson gazeuse désaltérante à la pomme verte croquante.",
    "image": "assets/youki pomme.png",
    "is_active": 1
  },
  {
    "id": 95,
    "nom": "Youki Moka Café Glacé",
    "prix": 500,
    "categorie": "boisson",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Boisson gazeuse originale et surprenante au goût moka café.",
    "image": "assets/youki moka cafe.png",
    "is_active": 1
  },
  {
    "id": 96,
    "nom": "Orangina Pulpe d'Orange",
    "prix": 500,
    "categorie": "boisson",
    "stock": 75,
    "seuil_alerte": 20,
    "description": "La boisson pétillante secouée à la véritable pulpe d'orange.",
    "image": "assets/Orangina.png",
    "is_active": 1
  },
  {
    "id": 97,
    "nom": "Sprite Citron-Lime",
    "prix": 500,
    "categorie": "boisson",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Soda citron-lime rafraîchissant sans caféine, servi glacé.",
    "image": "assets/sprite.png",
    "is_active": 1
  },
  {
    "id": 98,
    "nom": "Énergie Malt Canette",
    "prix": 700,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Boisson maltée énergétique fortifiée en vitamines B pour un coup de boost.",
    "image": "assets/energie malt .png",
    "is_active": 1
  },
  {
    "id": 99,
    "nom": "Énergie Malt Bouteille Verre",
    "prix": 700,
    "categorie": "boisson",
    "stock": 45,
    "seuil_alerte": 15,
    "description": "Bouteille en verre consignée d'Énergie Malt servie extra fraîche.",
    "image": "assets/energie malt en bouteille.jpg",
    "is_active": 1
  },
  {
    "id": 100,
    "nom": "Eau Minérale Céleste 50cl",
    "prix": 200,
    "categorie": "boisson",
    "stock": 150,
    "seuil_alerte": 40,
    "description": "Petite bouteille d'eau minérale naturelle de source 50cl.",
    "image": "assets/bouteille celeste.png",
    "is_active": 1
  },
  {
    "id": 101,
    "nom": "Eau Minérale Céleste 1.5L",
    "prix": 1000,
    "categorie": "boisson",
    "stock": 90,
    "seuil_alerte": 25,
    "description": "Grande bouteille d'eau minérale naturelle 1.5 Litres.",
    "image": "assets/bouteille celeste.png",
    "is_active": 1
  },
  {
    "id": 102,
    "nom": "Dégué Traditionnel au Mil",
    "prix": 500,
    "categorie": "boisson",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Dessert lacté crémeux au couscous de mil sucré et vanille.",
    "image": "assets/jus de bissap.png",
    "is_active": 1
  },
  {
    "id": 103,
    "nom": "Lait Frais Pasteurisé 50cl",
    "prix": 500,
    "categorie": "boisson",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Bouteille de lait frais de ferme pasteurisé riche en calcium.",
    "image": "assets/product_cappuccino.png",
    "is_active": 1
  },
  {
    "id": 104,
    "nom": "Chocolat Chaud Gourmand Maison",
    "prix": 3000,
    "categorie": "cafe",
    "stock": 50,
    "seuil_alerte": 10,
    "description": "Chocolat chaud onctueux préparé avec du pur cacao ivoirien de grand cru.",
    "image": "assets/Chocolat Chaud.png",
    "is_active": 1
  },
  {
    "id": 105,
    "nom": "Cappuccino Moka Velouté",
    "prix": 1000,
    "categorie": "cafe",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Espresso avec mousse de lait veloutée saupoudrée de cacao fin.",
    "image": "assets/product_cappuccino.png",
    "is_active": 1
  },
  {
    "id": 106,
    "nom": "Espresso Pur Arabica",
    "prix": 800,
    "categorie": "cafe",
    "stock": 65,
    "seuil_alerte": 20,
    "description": "Café court corsé aux arômes intenses de grains torréfiés.",
    "image": "assets/Chocolat Chaud.png",
    "is_active": 1
  },
  {
    "id": 107,
    "nom": "Mini Pizza Gourmande au Fromage",
    "prix": 1000,
    "categorie": "sale",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Mini pizza individuelle garnie de sauce tomate maison, mozzarella et origan.",
    "image": "assets/Pizza.png",
    "is_active": 1
  },
  {
    "id": 108,
    "nom": "Petite Pizza Royale Garnie",
    "prix": 5000,
    "categorie": "sale",
    "stock": 25,
    "seuil_alerte": 5,
    "description": "Pizza moyenne garnie de jambon, champignons, fromage fondant et olives.",
    "image": "assets/Pizza.png",
    "is_active": 1
  },
  {
    "id": 109,
    "nom": "Grande Pizza Familiale XXL",
    "prix": 10000,
    "categorie": "sale",
    "stock": 15,
    "seuil_alerte": 3,
    "description": "Pizza géante familiale 4 saisons à partager pour 4 à 6 convives.",
    "image": "assets/Pizza.png",
    "is_active": 1
  },
  {
    "id": 110,
    "nom": "Panini Poulet Braisé & Fromage",
    "prix": 1500,
    "categorie": "sale",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Panini toasté chaud au poulet braisé mariné, oignons et fromage fondant.",
    "image": "assets/Panini.png",
    "is_active": 1
  },
  {
    "id": 111,
    "nom": "Panini 3 Fromages Fondants",
    "prix": 1200,
    "categorie": "sale",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Panini toasté chaud mozzarella, emmental et chèvre aux herbes de Provence.",
    "image": "assets/Panini.png",
    "is_active": 1
  },
  {
    "id": 112,
    "nom": "Panini Nature Moelleux (100F)",
    "prix": 100,
    "categorie": "sale",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Pain panini blanc moelleux non garni, prêt à griller.",
    "image": "assets/Panini.png",
    "is_active": 1
  },
  {
    "id": 113,
    "nom": "Sandwich Baguette Poulet Braisé",
    "prix": 1500,
    "categorie": "sale",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Demi-baguette croustillante garnie de poulet, salade, tomates et sauce chef.",
    "image": "assets/product_sandwich.png",
    "is_active": 1
  },
  {
    "id": 114,
    "nom": "Sandwich Thon & Crudités Fraîches",
    "prix": 1200,
    "categorie": "sale",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Demi-baguette fraîche garnie de thon émietté, mayonnaise légère et œufs durs.",
    "image": "assets/product_sandwich.png",
    "is_active": 1
  },
  {
    "id": 115,
    "nom": "Quiche Salée au Fromage",
    "prix": 500,
    "categorie": "sale",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Part de quiche salée dorée au four à la crème et fromage emmental.",
    "image": "assets/Panini.png",
    "is_active": 1
  },
  {
    "id": 116,
    "nom": "Quiche Lorraine Royale aux Lardons",
    "prix": 1200,
    "categorie": "sale",
    "stock": 30,
    "seuil_alerte": 10,
    "description": "Quiche traditionnelle garnie de lardons fumés, crème onctueuse et muscade.",
    "image": "assets/Panini.png",
    "is_active": 1
  },
  {
    "id": 117,
    "nom": "Croque-Monsieur Chaud Gratiné",
    "prix": 700,
    "categorie": "sale",
    "stock": 45,
    "seuil_alerte": 15,
    "description": "Pain de mie grillé, béchamel onctueuse, jambon et emmental gratiné au four.",
    "image": "assets/product_sandwich.png",
    "is_active": 1
  },
  {
    "id": 118,
    "nom": "Brioche Salée à la Viande Hachée",
    "prix": 1000,
    "categorie": "sale",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Brioche moelleuse farcie à la viande de bœuf hachée assaisonnée.",
    "image": "assets/product_sandwich.png",
    "is_active": 1
  },
  {
    "id": 119,
    "nom": "Feuilleté Salé Fromage Fondant",
    "prix": 500,
    "categorie": "sale",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Feuilleté croustillant pur beurre garni d'une crème fondante au fromage.",
    "image": "assets/baguette 200.png",
    "is_active": 1
  }
];

    // Gestionnaire de liste noire persistante des produits supprimés (par ID et par Nom)
    window.babiGetDeletedProductIds = function() {
        try {
            const item = localStorage.getItem('babi_deleted_product_ids');
            return item ? JSON.parse(item) : [];
        } catch (_) {
            return [];
        }
    };

    window.babiAddDeletedProductId = function(identifier) {
        if (!identifier) return;
        try {
            const set = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
            set.add(String(identifier).toLowerCase().trim());
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify([...set]));
        } catch (_) {}
    };

    window.babiRemoveDeletedProductId = function(identifier) {
        if (!identifier) return;
        try {
            const norm = String(identifier).toLowerCase().trim();
            const set = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
            set.delete(norm);
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify([...set]));
        } catch (_) {}
    };

    let inMemoryProductsCache = [];

    window.babiGetCachedProducts = function() {
        const deletedSet = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
        let raw = [];
        if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
            raw = inMemoryProductsCache;
        } else {
            try {
                const cached = localStorage.getItem('babi_cached_products');
                if (cached !== null) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        raw = parsed;
                    }
                }
            } catch (_) {}
        }

        // Si le cache local est vide ou contient moins de produits que le catalogue complet embarqué (119 produits)
        const embedded = window.BABI_EMBEDDED_CATALOG || [];
        if (!raw || raw.length < embedded.length) {
            const map = new Map();
            embedded.forEach(p => {
                if (p && p.id != null) map.set(String(p.id), p);
            });
            (raw || []).forEach(p => {
                if (p && p.id != null) {
                    map.set(String(p.id), { ...(map.get(String(p.id)) || {}), ...p });
                }
            });
            raw = Array.from(map.values());
        }

        const filtered = raw.filter(p => {
            if (!p) return false;
            const idKey = String(p.id != null ? p.id : '').toLowerCase().trim();
            const nameKey = String(p.nom || p.name || '').toLowerCase().trim();
            return !deletedSet.has(idKey) && !deletedSet.has(nameKey);
        });
        inMemoryProductsCache = filtered;
        return filtered;
    };

    window.babiSetCachedProducts = function(products) {
        if (!Array.isArray(products)) return;
        const deletedSet = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
        const filtered = products.filter(p => {
            if (!p) return false;
            const idKey = String(p.id).toLowerCase().trim();
            const nameKey = String(p.nom || p.name || '').toLowerCase().trim();
            return !deletedSet.has(idKey) && !deletedSet.has(nameKey);
        });
        inMemoryProductsCache = filtered;
        
        // Sauvegarde persistante dans localStorage sans écraser les photos personnalisées
        try {
            const safeList = filtered.map(p => ({
                id: p.id,
                nom: p.nom || p.name,
                prix: Number(p.prix || p.price || 0),
                categorie: p.categorie || p.category || 'pain',
                image: p.image || p.image_url || 'assets/product_baguette.png',
                stock: p.stock != null ? Number(p.stock) : 50,
                seuil_alerte: p.seuil_alerte != null ? Number(p.seuil_alerte) : 10,
                is_active: (p.is_active === 0 || p.is_active === '0' || p.is_active === false) ? 0 : 1,
                description: p.description || ''
            }));
            localStorage.setItem('babi_cached_products', JSON.stringify(safeList));
        } catch (_) {
            try {
                localStorage.removeItem('babi_pos_sales_history');
                localStorage.removeItem('babi_pos_shift_sales');
                localStorage.removeItem('babi_admin_cached_orders');
                const minimalList = filtered.map(p => ({
                    id: p.id,
                    nom: p.nom || p.name,
                    prix: Number(p.prix || 0),
                    categorie: p.categorie || 'pain',
                    image: p.image || 'assets/product_baguette.png',
                    stock: p.stock != null ? Number(p.stock) : 50,
                    is_active: p.is_active != null ? p.is_active : 1
                }));
                localStorage.setItem('babi_cached_products', JSON.stringify(minimalList));
            } catch (_) {}
        }
    };

    window.babiAddCustomProduct = function(product) {
        try {
            if (product.id) window.babiRemoveDeletedProductId(product.id);
            if (product.nom || product.name) window.babiRemoveDeletedProductId(product.nom || product.name);
            const list = window.babiGetCachedProducts();
            const existingIdx = list.findIndex(p => String(p.id) === String(product.id) || (p.nom && product.nom && p.nom.trim().toLowerCase() === product.nom.trim().toLowerCase()));
            if (existingIdx >= 0) {
                list[existingIdx] = product;
            } else {
                list.unshift(product);
            }
            window.babiSetCachedProducts(list);
            return list;
        } catch (_) {
            return [];
        }
    };

    window.babiRemoveCustomProduct = function(productId, productName) {
        try {
            if (productId) window.babiAddDeletedProductId(productId);
            if (productName) window.babiAddDeletedProductId(productName);
            const list = window.babiGetCachedProducts();
            const filtered = list.filter(p => {
                if (String(p.id) === String(productId) || p.id === productId) return false;
                if (productName && (p.nom || p.name) && String(p.nom || p.name).toLowerCase().trim() === String(productName).toLowerCase().trim()) return false;
                return true;
            });
            inMemoryProductsCache = filtered;
            window.babiSetCachedProducts(filtered);
            return filtered;
        } catch (_) {
            return [];
        }
    };

    // ==========================================
    // 🏷️ Dynamic Categories Cache & Helpers
    // ==========================================
    const DEFAULT_CATEGORIES = [
        { id: 1, slug: 'pain', nom: 'Pains', icone: '🥖', ordre: 1, is_active: 1 },
        { id: 2, slug: 'pains_speciaux', nom: 'Pains Spéciaux', icone: '🌾', ordre: 2, is_active: 1 },
        { id: 3, slug: 'viennoiserie', nom: 'Viennoiseries', icone: '🥐', ordre: 3, is_active: 1 },
        { id: 4, slug: 'patisserie', nom: 'Pâtisseries', icone: '🍰', ordre: 4, is_active: 1 },
        { id: 5, slug: 'boisson', nom: 'Boissons', icone: '🧃', ordre: 5, is_active: 1 },
        { id: 6, slug: 'sale', nom: 'Salés & Traiteur', icone: '🥪', ordre: 6, is_active: 1 },
        { id: 7, slug: 'snack', nom: 'Biscuits & Snacks', icone: '🍪', ordre: 7, is_active: 1 },
        { id: 8, slug: 'autre', nom: 'Autres Gourmandises', icone: '✨', ordre: 8, is_active: 1 }
    ];

    window.babiGetCachedCategories = function() {
        try {
            const raw = localStorage.getItem('babi_cached_categories');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) {}
        return DEFAULT_CATEGORIES;
    };

    window.babiSetCachedCategories = function(categories) {
        try {
            if (Array.isArray(categories) && categories.length > 0) {
                localStorage.setItem('babi_cached_categories', JSON.stringify(categories));
            }
        } catch (_) {}
    };
})();
