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
    "nom": "Baguette 150F",
    "prix": 150,
    "categorie": "pain",
    "stock": 120,
    "seuil_alerte": 25,
    "description": "Baguette artisanale croustillante et légère cuite au fournil.",
    "image": "assets/baguette 150.png",
    "is_active": 1
  },
  {
    "id": 2,
    "nom": "Baguette Tradition 200F",
    "prix": 200,
    "categorie": "pain",
    "stock": 150,
    "seuil_alerte": 30,
    "description": "Baguette tradition au levain naturel, mie alvéolée et croûte dorée.",
    "image": "assets/baguette 200.png",
    "is_active": 1
  },
  {
    "id": 3,
    "nom": "Ficelle Croquante",
    "prix": 500,
    "categorie": "pain",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Ficelle fine extra croustillante idéale pour l'apéritif et les toasts.",
    "image": "assets/baguette 150.png",
    "is_active": 1
  },
  {
    "id": 4,
    "nom": "Pain Complet (Grand Format)",
    "prix": 1000,
    "categorie": "pain",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Pain complet grand format riche en fibres et farine intégrale de blé.",
    "image": "assets/Pain Complet (Grand).png",
    "is_active": 1
  },
  {
    "id": 5,
    "nom": "Pain Complet (Format Moyen)",
    "prix": 500,
    "categorie": "pain",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Pain complet format moyen pour tartines saines du petit-déjeuner.",
    "image": "assets/pain complet 2.png",
    "is_active": 1
  },
  {
    "id": 6,
    "nom": "Pain Sans Sel Diététique",
    "prix": 150,
    "categorie": "pain",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Pain sans sel recommandé pour les régimes hyposodés et l'équilibre cardiovasculaire.",
    "image": "assets/pain sans sel.png",
    "is_active": 1
  },
  {
    "id": 7,
    "nom": "Pain Panini Moelleux",
    "prix": 100,
    "categorie": "pain",
    "stock": 80,
    "seuil_alerte": 20,
    "description": "Pain panini blanc moelleux à griller pour sandwiches chauds.",
    "image": "assets/Panini.png",
    "is_active": 1
  },
  {
    "id": 8,
    "nom": "Petit Pain Rond 50F",
    "prix": 50,
    "categorie": "pain",
    "stock": 200,
    "seuil_alerte": 40,
    "description": "Petit pain individuel de table à 50 FCFA pour repas et collations.",
    "image": "assets/pain individuel.png",
    "is_active": 1
  },
  {
    "id": 9,
    "nom": "Petit Pain Rond 100F",
    "prix": 100,
    "categorie": "pain",
    "stock": 180,
    "seuil_alerte": 35,
    "description": "Petit pain individuel de table à 100 FCFA, mie aérée et savoureuse.",
    "image": "assets/pain individuel.png",
    "is_active": 1
  },
  {
    "id": 10,
    "nom": "Pain Parisien Croustillant",
    "prix": 300,
    "categorie": "pain",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Pain parisien traditionnel long et généreux, mie tendre et croûte fine.",
    "image": "assets/baguette 200.png",
    "is_active": 1
  },
  {
    "id": 11,
    "nom": "Pain Câbre Artisanal",
    "prix": 700,
    "categorie": "pains_speciaux",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Pain spécial câbre recette traditionnelle d'antan au goût rustique.",
    "image": "assets/cabre.png",
    "is_active": 1
  },
  {
    "id": 12,
    "nom": "Pain Breton Tradition",
    "prix": 700,
    "categorie": "pains_speciaux",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Pain breton rustique à la croûte dorée et arômes de céréales cuites.",
    "image": "assets/product_campagne.png",
    "is_active": 1
  },
  {
    "id": 13,
    "nom": "Pain Délice aux Céréales",
    "prix": 700,
    "categorie": "pains_speciaux",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Pain délice parsemé de graines sélectionnées (lin, tournesol, sésame).",
    "image": "assets/product_cereal.png",
    "is_active": 1
  },
  {
    "id": 14,
    "nom": "Pain Marbré Moelleux",
    "prix": 500,
    "categorie": "pains_speciaux",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Pain marbré artisanal bicolore à la mie douce et fondante.",
    "image": "assets/marbre.png",
    "is_active": 1
  },
  {
    "id": 15,
    "nom": "Pain Amour Brioché",
    "prix": 1000,
    "categorie": "pains_speciaux",
    "stock": 30,
    "seuil_alerte": 8,
    "description": "Pain spécial amour enrichi d'une touche briochée gourmande.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 16,
    "nom": "Pain Canadien aux Graines",
    "prix": 700,
    "categorie": "pains_speciaux",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Pain canadien aux farines nobles et graines croquantes.",
    "image": "assets/product_cereal.png",
    "is_active": 1
  },
  {
    "id": 17,
    "nom": "Grand Pain de Mie Tranché",
    "prix": 2000,
    "categorie": "pains_speciaux",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Grand pain de mie familial extra moelleux pour toasts et sandwiches.",
    "image": "assets/pain de mie.png",
    "is_active": 1
  },
  {
    "id": 18,
    "nom": "Pain Viennois Moelleux (Moyen)",
    "prix": 500,
    "categorie": "pains_speciaux",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Pain viennois format moyen à la texture fine et légèrement sucrée.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 19,
    "nom": "Pain Viennois Grand Format",
    "prix": 700,
    "categorie": "pains_speciaux",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Grand pain viennois doré idéal pour goûters et sandwiches doux.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 20,
    "nom": "Suzette Spéciale",
    "prix": 300,
    "categorie": "pains_speciaux",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Spécialité boulangère suzette sucrée parfumée.",
    "image": "assets/Crêpe Suzette.png",
    "is_active": 1
  },
  {
    "id": 21,
    "nom": "Croissant Pur Beurre",
    "prix": 500,
    "categorie": "viennoiserie",
    "stock": 80,
    "seuil_alerte": 20,
    "description": "Croissant artisanal feuilleté croustillant pur beurre de baratte.",
    "image": "assets/Croissant.png",
    "is_active": 1
  },
  {
    "id": 22,
    "nom": "Pain au Chocolat Feuilleté",
    "prix": 500,
    "categorie": "viennoiserie",
    "stock": 85,
    "seuil_alerte": 20,
    "description": "Pain au chocolat pur beurre garni de deux barres de chocolat noir.",
    "image": "assets/pain au chocolat.png",
    "is_active": 1
  },
  {
    "id": 23,
    "nom": "Chausson aux Pommes Doré",
    "prix": 1000,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Feuilletage doré croustillant garni d'une compote de pommes fondante.",
    "image": "assets/chausson aux pommes.png",
    "is_active": 1
  },
  {
    "id": 24,
    "nom": "Choco Suisse Crème Pâtissière",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Brioche feuilletée garnie de crème pâtissière et pépites de chocolat.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 25,
    "nom": "Pain Suisse Pépites & Crème",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Viennoiserie suisse traditionnelle riche en crème et chocolat.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 26,
    "nom": "Pain Helvétique Moelleux",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Spécialité helvétique savoureuse au cœur fondant.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 27,
    "nom": "Star Suisse Gourmand",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Forme étoilée gourmande pur beurre et chocolat.",
    "image": "assets/choco suisse.png",
    "is_active": 1
  },
  {
    "id": 28,
    "nom": "Charaphe aux Raisins",
    "prix": 700,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Viennoiserie charaphe dorée au four parsemée de raisins secs moelleux.",
    "image": "assets/charaphe au raisin.png",
    "is_active": 1
  },
  {
    "id": 29,
    "nom": "Pain aux Raisins Doré",
    "prix": 700,
    "categorie": "viennoiserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Spirale feuilletée à la crème pâtissière et raisins blonds macérés.",
    "image": "assets/pain au raisin.png",
    "is_active": 1
  },
  {
    "id": 30,
    "nom": "Escargot Gourmand Cannelle/Raisin",
    "prix": 700,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Roulé viennois croustillant aux épices douces et raisins.",
    "image": "assets/pain au raisin.png",
    "is_active": 1
  },
  {
    "id": 31,
    "nom": "Torsade aux Pépites de Chocolat",
    "prix": 800,
    "categorie": "viennoiserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Torsade feuilletée croustillante garnie de crème et pépites.",
    "image": "assets/torsade.png",
    "is_active": 1
  },
  {
    "id": 32,
    "nom": "Pain au Lait Moelleux",
    "prix": 200,
    "categorie": "viennoiserie",
    "stock": 70,
    "seuil_alerte": 15,
    "description": "Pain au lait brioché doux idéal pour le goûter des enfants.",
    "image": "assets/product_brioche.png",
    "is_active": 1
  },
  {
    "id": 33,
    "nom": "Palmier Feuilleté Sucré",
    "prix": 200,
    "categorie": "viennoiserie",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Cœur feuilleté caramélisé croustillant au sucre de canne.",
    "image": "assets/palmier.png",
    "is_active": 1
  },
  {
    "id": 34,
    "nom": "Cookie Pépites de Chocolat (Unité)",
    "prix": 200,
    "categorie": "viennoiserie",
    "stock": 75,
    "seuil_alerte": 15,
    "description": "Grand cookie américain croustillant aux pépites de chocolat fondant.",
    "image": "assets/cookies_unite.png",
    "is_active": 1
  },
  {
    "id": 35,
    "nom": "Lot de Cookies Artisanaux (Sachet)",
    "prix": 1000,
    "categorie": "viennoiserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Sachet de cookies croustillants faits maison pour toute la famille.",
    "image": "assets/cookies.png",
    "is_active": 1
  },
  {
    "id": 36,
    "nom": "Paquet de Biscottes Artisanales",
    "prix": 1000,
    "categorie": "viennoiserie",
    "stock": 35,
    "seuil_alerte": 10,
    "description": "Biscottes dorées au four ultra croquantes pour le petit-déjeuner.",
    "image": "assets/biscottes.png",
    "is_active": 1
  },
  {
    "id": 37,
    "nom": "Madeleine Moelleuse (Unité)",
    "prix": 100,
    "categorie": "viennoiserie",
    "stock": 120,
    "seuil_alerte": 25,
    "description": "Madeleine artisanale au pur beurre et zeste de citron.",
    "image": "assets/madeleine unite.png",
    "is_active": 1
  },
  {
    "id": 38,
    "nom": "Gâteau Événementiel (Format Standard)",
    "prix": 10000,
    "categorie": "patisserie",
    "stock": 10,
    "seuil_alerte": 2,
    "description": "Gâteau pâtissier décoré pour anniversaires et petites réceptions (6-8 parts).",
    "image": "assets/Gateau1.png",
    "is_active": 1
  },
  {
    "id": 39,
    "nom": "Gâteau Événementiel (Moyen Format)",
    "prix": 15000,
    "categorie": "patisserie",
    "stock": 10,
    "seuil_alerte": 2,
    "description": "Gâteau de fête personnalisé (10-12 parts) aux saveurs vanille, choco ou fruits.",
    "image": "assets/gateau2.png",
    "is_active": 1
  },
  {
    "id": 40,
    "nom": "Gâteau Événementiel Prestige (Grand Format)",
    "prix": 20000,
    "categorie": "patisserie",
    "stock": 8,
    "seuil_alerte": 2,
    "description": "Grand gâteau de cérémonie haut de gamme (15-20 parts) garniture gourmande.",
    "image": "assets/gateau evenement.png",
    "is_active": 1
  },
  {
    "id": 41,
    "nom": "Gâteau Prestige Royal (XXL Cérémonie)",
    "prix": 25000,
    "categorie": "patisserie",
    "stock": 6,
    "seuil_alerte": 1,
    "description": "Pièce maîtresse pâtissière majestueuse pour mariages et grands galas.",
    "image": "assets/gateau mariage.png",
    "is_active": 1
  },
  {
    "id": 42,
    "nom": "Grande Bûche de Noël Gourmande",
    "prix": 7000,
    "categorie": "patisserie",
    "stock": 15,
    "seuil_alerte": 3,
    "description": "Grande bûche pâtissière festive roulée au chocolat noir et praliné.",
    "image": "assets/buche de noel.png",
    "is_active": 1
  },
  {
    "id": 43,
    "nom": "Bûche de Noël Traditionnelle",
    "prix": 5000,
    "categorie": "patisserie",
    "stock": 20,
    "seuil_alerte": 5,
    "description": "Bûche de Noël classique crème au beurre vanille ou café.",
    "image": "assets/buche de noel.png",
    "is_active": 1
  },
  {
    "id": 44,
    "nom": "Moka Pâtissier au Café",
    "prix": 1500,
    "categorie": "patisserie",
    "stock": 25,
    "seuil_alerte": 5,
    "description": "Entremets moka génoise légère imbibée et crème onctueuse au café d'Abidjan.",
    "image": "assets/moka1.png",
    "is_active": 1
  },
  {
    "id": 45,
    "nom": "Flan Pâtissier Traditionnel",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 30,
    "seuil_alerte": 8,
    "description": "Part généreuse de flan crémeux vanillé sur pâte brisée dorée.",
    "image": "assets/Flan.png",
    "is_active": 1
  },
  {
    "id": 46,
    "nom": "Lot de Madeleines Moelleuses (Sachet)",
    "prix": 500,
    "categorie": "patisserie",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Sachet gourmand de madeleines artisanales moelleuses.",
    "image": "assets/lots de madeleine.png",
    "is_active": 1
  },
  {
    "id": 47,
    "nom": "Madeleine Pâtissière Vanillée",
    "prix": 100,
    "categorie": "patisserie",
    "stock": 100,
    "seuil_alerte": 20,
    "description": "Madeleine individuelle parfumée à la vanille Bourbon.",
    "image": "assets/madeleine unite.png",
    "is_active": 1
  },
  {
    "id": 48,
    "nom": "Cupcake Glaçage Onctueux",
    "prix": 500,
    "categorie": "patisserie",
    "stock": 35,
    "seuil_alerte": 8,
    "description": "Petit gâteau individuel avec dôme de glaçage crémeux et décors sucrés.",
    "image": "assets/Gateau1.1.png",
    "is_active": 1
  },
  {
    "id": 49,
    "nom": "Tranche de Cake Moelleux",
    "prix": 300,
    "categorie": "patisserie",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Tranche individuelle de cake marbré ou vanille fait maison.",
    "image": "assets/cake.png",
    "is_active": 1
  },
  {
    "id": 50,
    "nom": "Cake Entier Artisanal",
    "prix": 700,
    "categorie": "patisserie",
    "stock": 30,
    "seuil_alerte": 8,
    "description": "Cake entier familial aux fruits confits, chocolat ou citron.",
    "image": "assets/cake1.png",
    "is_active": 1
  },
  {
    "id": 51,
    "nom": "Crêpe Gourmande au Nutella",
    "prix": 2000,
    "categorie": "patisserie",
    "stock": 30,
    "seuil_alerte": 5,
    "description": "Crêpe chaude préparée minute généreusement nappée de Nutella fondant.",
    "image": "assets/crepe au nutella.png",
    "is_active": 1
  },
  {
    "id": 52,
    "nom": "Crêpe Moelleuse à la Vanille",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 35,
    "seuil_alerte": 8,
    "description": "Crêpe légère et dorée parfumée au sucre vanillé.",
    "image": "assets/crepe a la vanille.png",
    "is_active": 1
  },
  {
    "id": 53,
    "nom": "Crêpe Suzette Parfumée",
    "prix": 1500,
    "categorie": "patisserie",
    "stock": 25,
    "seuil_alerte": 5,
    "description": "Crêpe traditionnelle parfumée aux zestes d'orange et caramel doux.",
    "image": "assets/Crêpe Suzette.png",
    "is_active": 1
  },
  {
    "id": 54,
    "nom": "Fondant Cœur Coulant Chocolat",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Gâteau individuel pur chocolat avec cœur chaud intensément coulant.",
    "image": "assets/Fondant au Chocolat.png",
    "is_active": 1
  },
  {
    "id": 55,
    "nom": "Glace Artisanale Pot VIP",
    "prix": 1000,
    "categorie": "patisserie",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Crème glacée artisanale onctueuse en pot individuel (Vanille, Chocolat, Fraise).",
    "image": "assets/glace.png",
    "is_active": 1
  },
  {
    "id": 56,
    "nom": "Chill 700F",
    "prix": 700,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Boisson rafraîchissante gazeuse Chill servie bien glacée.",
    "image": "assets/chill.png",
    "is_active": 1
  },
  {
    "id": 57,
    "nom": "Youzou Fruité",
    "prix": 500,
    "categorie": "boisson",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Boisson fruitée Youzou locale et désaltérante idéale avec vos viennoiseries.",
    "image": "assets/youzou.png",
    "is_active": 1
  },
  {
    "id": 58,
    "nom": "World Cola Frais",
    "prix": 500,
    "categorie": "boisson",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Soda cola très pétillant servi bien frais en canette.",
    "image": "assets/world cola.png",
    "is_active": 1
  },
  {
    "id": 59,
    "nom": "Youki Orange",
    "prix": 500,
    "categorie": "boisson",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Soda pétillant à l'orange très fruité et tonifiant.",
    "image": "assets/youki moka cafe.png",
    "is_active": 1
  },
  {
    "id": 60,
    "nom": "Youki Pomme",
    "prix": 500,
    "categorie": "boisson",
    "stock": 55,
    "seuil_alerte": 15,
    "description": "Soda pétillant parfum pomme verte désaltérant.",
    "image": "assets/youki pomme.png",
    "is_active": 1
  },
  {
    "id": 61,
    "nom": "Jus Naturel (Petit Format)",
    "prix": 300,
    "categorie": "boisson",
    "stock": 60,
    "seuil_alerte": 15,
    "description": "Petit gobelet de jus 100% naturel pressé chaque matin.",
    "image": "assets/Jus Naturel (Petit).png",
    "is_active": 1
  },
  {
    "id": 62,
    "nom": "Jus Naturel (Format Moyen)",
    "prix": 500,
    "categorie": "boisson",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Verre moyen de jus frais pressé riche en vitamines.",
    "image": "assets/Jus Naturel (Moyen).png",
    "is_active": 1
  },
  {
    "id": 63,
    "nom": "Jus Naturel (Grand Format)",
    "prix": 2000,
    "categorie": "boisson",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Grande bouteille de jus naturel artisanal 1L pour toute la table.",
    "image": "assets/Jus Naturel (Grand).png",
    "is_active": 1
  },
  {
    "id": 64,
    "nom": "Orangina 500F",
    "prix": 500,
    "categorie": "boisson",
    "stock": 65,
    "seuil_alerte": 15,
    "description": "Boisson gazeuse à la pulpe d'orange naturelle à secouer avant dégustation.",
    "image": "assets/Orangina.png",
    "is_active": 1
  },
  {
    "id": 65,
    "nom": "Sprite Citron-Lime",
    "prix": 500,
    "categorie": "boisson",
    "stock": 70,
    "seuil_alerte": 20,
    "description": "Boisson gazeuse rafraîchissante aux arômes naturels de citron et lime.",
    "image": "assets/sprite.png",
    "is_active": 1
  },
  {
    "id": 66,
    "nom": "Énergie Malt",
    "prix": 700,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Boisson maltée sans alcool énergisante et riche en goût.",
    "image": "assets/energie malt .png",
    "is_active": 1
  },
  {
    "id": 67,
    "nom": "Eau Minérale (Petite Bouteille)",
    "prix": 200,
    "categorie": "boisson",
    "stock": 150,
    "seuil_alerte": 40,
    "description": "Bouteille d'eau minérale naturelle Céleste 0.5L bien fraîche.",
    "image": "assets/bouteille celeste.png",
    "is_active": 1
  },
  {
    "id": 68,
    "nom": "Eau Minérale (Grande Bouteille 1.5L)",
    "prix": 1000,
    "categorie": "boisson",
    "stock": 90,
    "seuil_alerte": 25,
    "description": "Grande bouteille d'eau minérale 1.5L pour hydratation quotidienne.",
    "image": "assets/bouteille celeste.png",
    "is_active": 1
  },
  {
    "id": 69,
    "nom": "Déguê Artisanal",
    "prix": 500,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Délicieux yaourt onctueux aux grains de mil perlé fait maison.",
    "image": "assets/baobab(petit).png",
    "is_active": 1
  },
  {
    "id": 70,
    "nom": "Lait Frais",
    "prix": 500,
    "categorie": "boisson",
    "stock": 45,
    "seuil_alerte": 10,
    "description": "Bouteille de lait frais pasteurisé doux et nutritif.",
    "image": "assets/bouteille celeste.png",
    "is_active": 1
  },
  {
    "id": 71,
    "nom": "Jus de Passion (Bouteille 1.5L)",
    "prix": 3000,
    "categorie": "boisson",
    "stock": 30,
    "seuil_alerte": 8,
    "description": "Grand flacon 1.5L de pur jus de fruits de la passion parfumés de Côte d'Ivoire.",
    "image": "assets/jus de passion.png",
    "is_active": 1
  },
  {
    "id": 72,
    "nom": "Jus de Passion (Petite Bouteille)",
    "prix": 700,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Petite bouteille nomade de jus de passion acidulé et vitaminé.",
    "image": "assets/jus de passion.png",
    "is_active": 1
  },
  {
    "id": 73,
    "nom": "Jus de Baobab (Petite Bouteille)",
    "prix": 500,
    "categorie": "boisson",
    "stock": 50,
    "seuil_alerte": 15,
    "description": "Jus onctueux au pain de singe (baobab) riche en calcium et vitamine C.",
    "image": "assets/baobab(petit).png",
    "is_active": 1
  },
  {
    "id": 74,
    "nom": "Jus de Bissap (Bouteille)",
    "prix": 2000,
    "categorie": "boisson",
    "stock": 40,
    "seuil_alerte": 10,
    "description": "Infusion naturelle de fleurs d'hibiscus karkadé et menthe fraîche.",
    "image": "assets/jus de bissap.png",
    "is_active": 1
  },
  {
    "id": 75,
    "nom": "Jus de Gingembre (Bouteille 1.5L)",
    "prix": 3000,
    "categorie": "boisson",
    "stock": 35,
    "seuil_alerte": 8,
    "description": "Pur jus de gingembre épicé et tonique avec une pointe d'ananas.",
    "image": "assets/jus de gingembre.png",
    "is_active": 1
  },
  {
    "id": 76,
    "nom": "Jus de Tamarin (Bouteille)",
    "prix": 2000,
    "categorie": "boisson",
    "stock": 35,
    "seuil_alerte": 8,
    "description": "Jus doux et acidulé de tamarin traditionnel bien frais.",
    "image": "assets/jus de tamari.png",
    "is_active": 1
  },
  {
    "id": 77,
    "nom": "Cocktail Pur Jus (Bouteille 1.5L)",
    "prix": 3000,
    "categorie": "boisson",
    "stock": 30,
    "seuil_alerte": 8,
    "description": "Mélange tonique de fruits tropicaux (Ananas, Passion, Orange, Goyave).",
    "image": "assets/cocktail.png",
    "is_active": 1
  },
  {
    "id": 78,
    "nom": "Jus de Citron Pur (Bouteille)",
    "prix": 2000,
    "categorie": "boisson",
    "stock": 35,
    "seuil_alerte": 8,
    "description": "Jus de citron pressé désaltérant et riche en antioxydants.",
    "image": "assets/jus de citron.png",
    "is_active": 1
  },
  {
    "id": 79,
    "nom": "Chocolat Chaud Gourmand (Grande Bouteille)",
    "prix": 3000,
    "categorie": "boisson",
    "stock": 25,
    "seuil_alerte": 5,
    "description": "Grand format de pur chocolat ivoirien onctueux et velouté.",
    "image": "assets/Chocolat Chaud.png",
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
