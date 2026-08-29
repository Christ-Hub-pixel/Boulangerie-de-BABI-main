const path = require('path');
const fs = require('fs');
const { initDB } = require('../db.js');

const rootDir = path.resolve(__dirname, '..');

const fullCatalog = [
    // --- 1. BOULANGERIE & PAINS ARTISANAUX ---
    { nom: "Baguette Standard 150F", prix: 150, categorie: "pain", image: "assets/baguette 150.png", stock: 120, seuil_alerte: 20, description: "La baguette classique dorée et croustillante, cuite plusieurs fois par jour." },
    { nom: "Baguette Traditionnelle 200F", prix: 200, categorie: "pain", image: "assets/baguette 200.png", stock: 150, seuil_alerte: 25, description: "Baguette de tradition au levain naturel à la croûte dorée et mie alvéolée." },
    { nom: "Ficelle Croquante", prix: 500, categorie: "pain", image: "assets/baguette 150.png", stock: 40, seuil_alerte: 10, description: "Baguette fine extra croquante idéale pour les toasts et l'apéritif." },
    { nom: "Pain Complet (Grand Format)", prix: 1000, categorie: "pain", image: "assets/Pain Complet (Grand).png", stock: 45, seuil_alerte: 10, description: "Pain complet riche en fibres, farine intégrale de blé pour une digestion légère." },
    { nom: "Pain Complet (Format Moyen)", prix: 500, categorie: "pain", image: "assets/pain complet 2.png", stock: 50, seuil_alerte: 10, description: "Format idéal pour les tartines saines du petit-déjeuner et équilibre quotidien." },
    { nom: "Pain Complet Artisanal Graines", prix: 700, categorie: "pain", image: "assets/pain complet 3.png", stock: 35, seuil_alerte: 10, description: "Pain complet parsemé de graines torréfiées de lin, tournesol et sésame." },
    { nom: "Pain Sans Sel Diététique", prix: 150, categorie: "pain", image: "assets/pain sans sel.png", stock: 30, seuil_alerte: 10, description: "Pain léger élaboré sans aucun ajout de sel pour régimes hyposodés." },
    { nom: "Petit Pain Individuel (50F)", prix: 50, categorie: "pain", image: "assets/pain individuel.png", stock: 200, seuil_alerte: 30, description: "Petit pain de table moelleux à l'unité, parfait pour accompagner tous les repas." },
    { nom: "Petit Pain Individuel (100F)", prix: 100, categorie: "pain", image: "assets/pain individuel.png", stock: 150, seuil_alerte: 25, description: "Pain de table doré pour réceptions, événements et buffets raffinés." },
    { nom: "Pain Cabré Régional", prix: 700, categorie: "pain", image: "assets/cabre.png", stock: 35, seuil_alerte: 10, description: "Pain rustique à la mie alvéolée et croûte épaisse, recette traditionnelle." },
    { nom: "Pain Marbré Rustique", prix: 500, categorie: "pain", image: "assets/marbre.png", stock: 40, seuil_alerte: 10, description: "Pain spécial marbré bicolore cuit au fournil, doux et aromatique." },
    { nom: "Pain Marbré Tradition 1.1", prix: 600, categorie: "pain", image: "assets/marbre1.1.png", stock: 30, seuil_alerte: 10, description: "Pain marbré artisanal aux arômes délicatement vanillés et chocolatés." },
    { nom: "Pain de Mie Spécial (Grand Format)", prix: 2000, categorie: "pain", image: "assets/pain de mie.png", stock: 40, seuil_alerte: 10, description: "Grand pain de mie artisanal extra-moelleux sans conservateur artificiel." },
    { nom: "Pain Parisien Doré", prix: 300, categorie: "pain", image: "assets/pain  parisien.jpeg", stock: 60, seuil_alerte: 15, description: "Bâtard parisien traditionnel à la croûte dorée et croustillante." },
    { nom: "Pain de Campagne Artisanal", prix: 800, categorie: "pain", image: "assets/product_campagne.png", stock: 35, seuil_alerte: 10, description: "Pain au levain naturel à longue fermentation, saveur authentique d'antan." },
    { nom: "Pain Canadien Multigraines", prix: 700, categorie: "pain", image: "assets/pain complet 3.png", stock: 35, seuil_alerte: 10, description: "Pain nordique complet enrichi aux céréales et graines croquantes." },
    { nom: "Pain Viennois Pépites de Chocolat", prix: 500, categorie: "pain", image: "assets/choco suisse.png", stock: 45, seuil_alerte: 10, description: "Pain brioché viennois parsemé de véritables pépites de chocolat noir." },
    { nom: "Grand Pain Viennois Pépites (700F)", prix: 700, categorie: "pain", image: "assets/choco suisse.png", stock: 40, seuil_alerte: 10, description: "Grand format généreux de pain viennois pour le goûter des enfants." },
    { nom: "Pain au Lait Sucré Tradition", prix: 200, categorie: "pain", image: "assets/product_brioche.png", stock: 70, seuil_alerte: 15, description: "Pain doux et sucré au lait frais pasteurisé, fondant en bouche." },

    // --- 2. VIENNOISERIES PUR BEURRE ---
    { nom: "Croissant Pur Beurre", prix: 500, categorie: "viennoiserie", image: "assets/Croissant.png", stock: 90, seuil_alerte: 20, description: "Feuilletage doré croustillant au pur beurre de baratte, spécialité maison." },
    { nom: "Croissant aux Amandes", prix: 600, categorie: "viennoiserie", image: "assets/Croissant.png", stock: 40, seuil_alerte: 10, description: "Croissant pur beurre fourré d'une onctueuse crème d'amande et effilées." },
    { nom: "Pain au Chocolat (Chocolatine)", prix: 500, categorie: "viennoiserie", image: "assets/pain au chocolat.png", stock: 100, seuil_alerte: 20, description: "Viennoiserie feuilletée pur beurre avec 2 barres de chocolat noir intense." },
    { nom: "Pain aux Raisins (Escargot)", prix: 700, categorie: "viennoiserie", image: "assets/pain au raisin.png", stock: 50, seuil_alerte: 10, description: "Feuilleté en spirale garni de crème pâtissière vanillée et raisins de Corinthe." },
    { nom: "Chausson aux Pommes Doré", prix: 1000, categorie: "viennoiserie", image: "assets/chausson aux pommes.png", stock: 40, seuil_alerte: 10, description: "Chausson généreusement garni d'une compote de pommes parfumée à la vanille." },
    { nom: "Choco Suisse Suprême", prix: 800, categorie: "viennoiserie", image: "assets/choco suisse.png", stock: 55, seuil_alerte: 15, description: "Brioche feuilletée garnie de crème pâtissière et d'une cascade de pépites." },
    { nom: "Torsade au Chocolat", prix: 800, categorie: "viennoiserie", image: "assets/torsade.png", stock: 45, seuil_alerte: 10, description: "Torsade feuilletée croustillante garnie de crème onctueuse et chocolat." },
    { nom: "Palmier Croustillant Pur Beurre", prix: 200, categorie: "viennoiserie", image: "assets/palmier.png", stock: 80, seuil_alerte: 15, description: "Grand cœur de feuilletage pur beurre caramélisé au sucre candi." },
    { nom: "Double Palmier Feuilleté", prix: 350, categorie: "viennoiserie", image: "assets/palmier2.png", stock: 50, seuil_alerte: 10, description: "Duo de palmiers croustillants et délicatement caramélisés." },
    { nom: "Biscotte Artisanale (Paquet)", prix: 1000, categorie: "viennoiserie", image: "assets/biscottes.png", stock: 40, seuil_alerte: 10, description: "Paquet de biscottes croustillantes dorées au four pour le petit-déjeuner." },
    { nom: "Charaphe au Raisin", prix: 700, categorie: "viennoiserie", image: "assets/charaphe au raisin.png", stock: 35, seuil_alerte: 10, description: "Spécialité viennoise moelleuse garnie de crème et raisins dorés." },
    { nom: "Cookies aux Pépites de Chocolat (l'unité)", prix: 200, categorie: "viennoiserie", image: "assets/cookies.png", stock: 120, seuil_alerte: 20, description: "Cookie croustillant sur les bords avec un cœur fondant aux pépites de chocolat." },
    { nom: "Lot de Cookies Gourmands (Sachet de 6)", prix: 1000, categorie: "viennoiserie", image: "assets/cookies.png", stock: 50, seuil_alerte: 10, description: "Sachet de 6 cookies artisanaux aux pépites de chocolat noir et au lait." },
    { nom: "Cookie Chocolat Blanc & Noisettes", prix: 250, categorie: "viennoiserie", image: "assets/cookies_unite.png", stock: 60, seuil_alerte: 15, description: "Cookie savoureux aux éclats de noisettes grillées et chocolat blanc velouté." },
    { nom: "Madeleine Pur Beurre (l'unité)", prix: 100, categorie: "viennoiserie", image: "assets/madeleine unite.png", stock: 150, seuil_alerte: 30, description: "Madeleine tendre traditionnelle à la forme coquille et arôme citronné." },
    { nom: "Lot de Madeleines (Sachet de 6)", prix: 500, categorie: "viennoiserie", image: "assets/lots de madeleine.png", stock: 60, seuil_alerte: 15, description: "Sachet familial de 6 madeleines pur beurre ultra-moelleuses." },
    { nom: "Américain Feuilleté Doré", prix: 700, categorie: "viennoiserie", image: "assets/Croissant.png", stock: 35, seuil_alerte: 10, description: "Viennoiserie américaine feuilletée et dorée à souhait." },
    { nom: "Brioche Tressée Pur Beurre", prix: 1200, categorie: "viennoiserie", image: "assets/product_brioche.png", stock: 25, seuil_alerte: 10, description: "Brioche artisanale tressée à la main, mie filante et beurre fin." },
    { nom: "Briochette Individuelle au Sucre", prix: 300, categorie: "viennoiserie", image: "assets/product_brioche.png", stock: 60, seuil_alerte: 15, description: "Petite brioche individuelle saupoudrée de grains de sucre perlé." },
    { nom: "Pain Évêque Doré", prix: 800, categorie: "viennoiserie", image: "assets/product_brioche.png", stock: 30, seuil_alerte: 10, description: "Viennoiserie royale moelleuse au beurre fin et sucre glace." },

    // --- 3. PÂTISSERIES FINES & GÂTEAUX ---
    { nom: "Flan Pâtissier Traditionnel", prix: 1000, categorie: "patisserie", image: "assets/Flan.png", stock: 40, seuil_alerte: 10, description: "Part généreuse de flan crémeux à la véritable gousse de vanille Bourbon." },
    { nom: "Fondant au Chocolat Suprême", prix: 1000, categorie: "patisserie", image: "assets/Fondant au Chocolat.png", stock: 45, seuil_alerte: 10, description: "Gâteau individuel au cœur coulant chocolat noir grand cru 70%." },
    { nom: "Gâteau Moka Café 1500F", prix: 1500, categorie: "patisserie", image: "assets/moka1.png", stock: 30, seuil_alerte: 10, description: "Génoise fine imbibée et crème au beurre extrait naturel de café." },
    { nom: "Gâteau Moka Prestige 1.1", prix: 1800, categorie: "patisserie", image: "assets/moka1.1.png", stock: 25, seuil_alerte: 10, description: "Moka d'exception aux amandes grillées et ganache onctueuse." },
    { nom: "Gâteau Moka Cérémonie 1.2", prix: 2000, categorie: "patisserie", image: "assets/moka1.2.png", stock: 20, seuil_alerte: 5, description: "Moka grand format pour réceptions familiales et dégustations gourmandes." },
    { nom: "Cupcake Vanille Moelleux", prix: 500, categorie: "patisserie", image: "assets/moka1.1.png", stock: 50, seuil_alerte: 15, description: "Cupcake moelleux à la vanille surmonté d'un dôme de crème chantilly." },
    { nom: "Cupcake Tout Chocolat", prix: 500, categorie: "patisserie", image: "assets/moka1.2.png", stock: 50, seuil_alerte: 15, description: "Cupcake pur cacao garni d'une ganache chocolat noir veloutée." },
    { nom: "Cake Tranche (Marbré Cacao)", prix: 300, categorie: "patisserie", image: "assets/cake.png", stock: 60, seuil_alerte: 15, description: "Tranche épaisse de cake marbré chocolat et vanille pour le thé." },
    { nom: "Cake Tranche (Citron Frais)", prix: 300, categorie: "patisserie", image: "assets/cake1.png", stock: 55, seuil_alerte: 15, description: "Tranche de cake moelleux parfumé aux zestes de citron vert pressé." },
    { nom: "Cake Entier Familial 700F", prix: 700, categorie: "patisserie", image: "assets/cake1.png", stock: 35, seuil_alerte: 10, description: "Cake entier prêt à découper pour le goûter en famille." },
    { nom: "Cake Familial Supérieur 1.1", prix: 1000, categorie: "patisserie", image: "assets/cake1.1.png", stock: 30, seuil_alerte: 10, description: "Grand cake familial pur beurre aux fruits confits et vanille." },
    { nom: "Crêpe au Nutella Chaude", prix: 2000, categorie: "patisserie", image: "assets/crepe au nutella.png", stock: 45, seuil_alerte: 10, description: "Grande crêpe minute tartinée de Nutella gourmand et éclats de noisettes." },
    { nom: "Crêpe Fine à la Vanille", prix: 1500, categorie: "patisserie", image: "assets/crepe a la vanille.png", stock: 40, seuil_alerte: 10, description: "Crêpe fine traditionnelle saupoudrée de sucre vanillé et beurre doux." },
    { nom: "Crêpe Suzette aux Agrumes", prix: 1500, categorie: "patisserie", image: "assets/Crêpe Suzette.png", stock: 35, seuil_alerte: 10, description: "Crêpe parfumée au sirop d'orange caramélisé et zeste d'agrumes." },
    { nom: "Crêpe Gourmande Fruits Rouges", prix: 2000, categorie: "patisserie", image: "assets/crepe rouge.png", stock: 35, seuil_alerte: 10, description: "Crêpe minute accompagnée d'un coulis de fruits rouges et crème fouettée." },
    { nom: "Crêpe Soleil Sucre & Citron", prix: 1200, categorie: "patisserie", image: "assets/crepe jaune.png", stock: 40, seuil_alerte: 10, description: "Crêpe fraîche nappée de jus de citron vert et sucre glace cristallisé." },
    { nom: "Glace Artisanale (Pot 200ml)", prix: 1000, categorie: "glace", image: "assets/glace.png", stock: 55, seuil_alerte: 15, description: "Pot individuel de crème glacée artisanale (Vanille, Chocolat, Fraise)." },
    { nom: "Glace Artisanale Double Boule", prix: 1500, categorie: "glace", image: "assets/product_glace.png", stock: 45, seuil_alerte: 10, description: "Coupe double boule de glace artisanale avec nappage et chantilly." },
    { nom: "Gâteau Anniversaire (10 pers.)", prix: 10000, categorie: "patisserie", image: "assets/Gateau1.png", stock: 12, seuil_alerte: 3, description: "Gâteau d'anniversaire personnalisé au choix, génoise et fruits frais (10 pers)." },
    { nom: "Gâteau Événement (15 pers.)", prix: 15000, categorie: "patisserie", image: "assets/Gateau1.1.png", stock: 10, seuil_alerte: 3, description: "Gâteau pâtissier festif décoré pour célébrations et baptêmes (15 pers)." },
    { nom: "Gâteau Prestige (20 pers.)", prix: 20000, categorie: "patisserie", image: "assets/Gateau1.2.png", stock: 8, seuil_alerte: 2, description: "Gâteau de prestige 3 étages chocolat et fruits exotiques (20 pers)." },
    { nom: "Gâteau Cérémonie Royale (25 pers.)", prix: 25000, categorie: "patisserie", image: "assets/gateau2.png", stock: 6, seuil_alerte: 2, description: "Pièce montée royale d'exception pour grandes cérémonies (25 pers)." },
    { nom: "Gâteau de Mariage Prestige", prix: 35000, categorie: "patisserie", image: "assets/gateau de mariiage.png", stock: 5, seuil_alerte: 2, description: "Chef-d'œuvre de haute pâtisserie pour noces et réceptions de mariage." },
    { nom: "Gâteau Mariage Fleur d'Oranger", prix: 40000, categorie: "patisserie", image: "assets/gateau mariage.png", stock: 4, seuil_alerte: 2, description: "Pièce montée de mariage majestueuse ornée de fleurs en sucre comestibles." },
    { nom: "Gâteau d'Événement Sur-Mesure", prix: 30000, categorie: "patisserie", image: "assets/gateau evenement.png", stock: 6, seuil_alerte: 2, description: "Création personnalisée sur devis et commande avec vos décors et thèmes." },
    { nom: "Gâteau Event Festif 28000F", prix: 28000, categorie: "patisserie", image: "assets/gateau event.png", stock: 5, seuil_alerte: 2, description: "Gâteau festif coloré pour anniversaires d'enfants et célébrations." },
    { nom: "Gâteau Événementiel Design 2", prix: 35000, categorie: "patisserie", image: "assets/gateau  d evenement2.png", stock: 5, seuil_alerte: 2, description: "Gâteau d'artisan décoré sur-mesure pour galas et entreprises." },
    { nom: "Bûche de Noël Chocolat (Petite)", prix: 5000, categorie: "patisserie", image: "assets/buche de noel.png", stock: 20, seuil_alerte: 5, description: "Bûche pâtissière chocolat noir et praliné croustillant (4 à 6 pers)." },
    { nom: "Bûche de Noël Royale (Grande)", prix: 7000, categorie: "patisserie", image: "assets/buche de noel.png", stock: 20, seuil_alerte: 5, description: "Grande bûche festive traditionnelle pour 8 à 10 personnes." },
    { nom: "Forêt Noire Royale aux Cerises", prix: 2500, categorie: "patisserie", image: "assets/product_foret_noire.png", stock: 25, seuil_alerte: 5, description: "Part généreuse de forêt noire, génoise cacao, cerises griottes et chantilly." },
    { nom: "Éclair au Chocolat Pur Cacao", prix: 700, categorie: "patisserie", image: "assets/choco suisse.png", stock: 45, seuil_alerte: 10, description: "Pâte à choux pur beurre garnie d'une crème chocolat noir et glaçage miroir." },
    { nom: "Tarte au Citron Meringuée", prix: 1200, categorie: "patisserie", image: "assets/Gateau1.png", stock: 30, seuil_alerte: 5, description: "Pâte sablée croquante, crème citron acidulée et meringue italienne dorée." },

    // --- 4. JUS NATURELS & INFUSIONS ARTISANALES ---
    { nom: "Jus Naturel (Petit Format 30cl)", prix: 300, categorie: "jus", image: "assets/jus de baobab petit.png", stock: 70, seuil_alerte: 20, description: "Bouteille nomade 30cl de pur jus de fruits frais artisanal." },
    { nom: "Jus Naturel (Moyen Format 50cl)", prix: 500, categorie: "jus", image: "assets/jus de baobab.png", stock: 65, seuil_alerte: 15, description: "Bouteille 50cl de jus artisanal frais pressé sans conservateurs." },
    { nom: "Jus Naturel Familial (Bouteille 1.5L)", prix: 2000, categorie: "jus", image: "assets/jus de passion.png", stock: 40, seuil_alerte: 10, description: "Grand format familial 1.5 Litres de jus naturel pour toute la table." },
    { nom: "Jus de Passion (Grand Format 1.5L)", prix: 3000, categorie: "jus", image: "assets/jus de passion.png", stock: 35, seuil_alerte: 10, description: "Jus pur maracudja 100% naturel acidulé et parfumé (Bouteille 1.5L)." },
    { nom: "Jus de Passion Frais 50cl", prix: 700, categorie: "jus", image: "assets/jus de passion.png", stock: 55, seuil_alerte: 15, description: "Bouteille 50cl de jus de fruits de la passion pur d'Abidjan." },
    { nom: "Jus de Baobab (Pain de Singe) 50cl", prix: 500, categorie: "jus", image: "assets/jus de baobab.png", stock: 60, seuil_alerte: 15, description: "Jus de baobab onctueux et velouté riche en vitamines et minéraux." },
    { nom: "Jus de Baobab Nomade 30cl", prix: 300, categorie: "jus", image: "assets/jus de baobab petit.png", stock: 70, seuil_alerte: 20, description: "Format 30cl de jus de baobab artisanal pour un regain d'énergie." },
    { nom: "Jus de Bissap Supérieur 1.5L", prix: 2000, categorie: "jus", image: "assets/jus de bissap.png", stock: 45, seuil_alerte: 10, description: "Infusion d'hibiscus rouge de qualité supérieure parfumée à la menthe (1.5L)." },
    { nom: "Jus de Bissap Maison Mentholé 50cl", prix: 500, categorie: "jus", image: "assets/jus de bissap.png", stock: 80, seuil_alerte: 20, description: "Bouteille 50cl de bissap frais artisanal avec feuilles de menthe fraîche." },
    { nom: "Jus de Gingembre (Gnamankoudji) 1.5L", prix: 3000, categorie: "jus", image: "assets/jus de gingembre.png", stock: 40, seuil_alerte: 10, description: "Jus de gingembre pur épicé, tonique et stimulant (Grande bouteille 1.5L)." },
    { nom: "Jus de Gingembre Énergisant 50cl", prix: 700, categorie: "jus", image: "assets/jus de gingembre.png", stock: 55, seuil_alerte: 15, description: "Bouteille 50cl de gnamankoudji frais pressé pour faire le plein de tonus." },
    { nom: "Jus de Tamarin Acidulé 1.5L", prix: 2000, categorie: "jus", image: "assets/jus de tamari.png", stock: 35, seuil_alerte: 10, description: "Jus de tamarin artisanal rafraîchissant et très digeste (1.5L)." },
    { nom: "Jus de Tomi Traditionnel 50cl", prix: 600, categorie: "jus", image: "assets/jus de tomi.png", stock: 40, seuil_alerte: 10, description: "Jus de tomi préparé selon la recette traditionnelle ivoirienne." },
    { nom: "Cocktail Tropical d'Abidjan 1.5L", prix: 3000, categorie: "jus", image: "assets/cocktail.png", stock: 45, seuil_alerte: 10, description: "Mélange fruité frais d'ananas, mangue, orange et passion (1.5L)." },
    { nom: "Cocktail Tropical 50cl", prix: 800, categorie: "jus", image: "assets/cocktail.png", stock: 60, seuil_alerte: 15, description: "Bouteille 50cl de cocktail de fruits frais pressé à froid." },
    { nom: "Jus de Citron Pressé 1.5L", prix: 2000, categorie: "jus", image: "assets/jus de citron.png", stock: 35, seuil_alerte: 10, description: "Limonade artisanale au pur jus de citrons verts d'Abidjan (1.5L)." },
    { nom: "Jus d'Ananas Pur Frais 50cl", prix: 600, categorie: "jus", image: "assets/product_jus_ananas.png", stock: 50, seuil_alerte: 15, description: "100% pur jus d'ananas pain de sucre de Côte d'Ivoire sans sucre ajouté." },
    { nom: "Jus d'Ananas Pur Frais 1.5L", prix: 2500, categorie: "jus", image: "assets/product_jus_ananas.png", stock: 35, seuil_alerte: 10, description: "Bouteille 1.5L de pur jus d'ananas pressé le matin même au fournil." },

    // --- 5. BOISSONS FRAÎCHES & SODAS ---
    { nom: "Chill Citron Glacé", prix: 700, categorie: "boisson", image: "assets/chill.png", stock: 50, seuil_alerte: 15, description: "Boisson gazeuse rafraîchissante au citron très pétillante et glacée." },
    { nom: "Youyou Fruité", prix: 500, categorie: "boisson", image: "assets/youzou.png", stock: 60, seuil_alerte: 15, description: "Boisson fruitée locale et désaltérante idéale avec vos viennoiseries." },
    { nom: "World Cola Frais", prix: 500, categorie: "boisson", image: "assets/world cola.png", stock: 70, seuil_alerte: 20, description: "Soda cola très pétillant servi bien frais." },
    { nom: "Youki Orange Intense", prix: 500, categorie: "boisson", image: "assets/youki moka cafe.png", stock: 60, seuil_alerte: 15, description: "Boisson gazeuse rafraîchissante saveur orange intense." },
    { nom: "Youki Pomme Pétillant", prix: 500, categorie: "boisson", image: "assets/youki pomme.png", stock: 55, seuil_alerte: 15, description: "Boisson gazeuse désaltérante à la pomme verte croquante." },
    { nom: "Youki Moka Café Glacé", prix: 500, categorie: "boisson", image: "assets/youki moka cafe.png", stock: 45, seuil_alerte: 10, description: "Boisson gazeuse originale et surprenante au goût moka café." },
    { nom: "Orangina Pulpe d'Orange", prix: 500, categorie: "boisson", image: "assets/Orangina.png", stock: 75, seuil_alerte: 20, description: "La boisson pétillante secouée à la véritable pulpe d'orange." },
    { nom: "Sprite Citron-Lime", prix: 500, categorie: "boisson", image: "assets/sprite.png", stock: 70, seuil_alerte: 20, description: "Soda citron-lime rafraîchissant sans caféine, servi glacé." },
    { nom: "Énergie Malt Canette", prix: 700, categorie: "boisson", image: "assets/energie malt .png", stock: 50, seuil_alerte: 15, description: "Boisson maltée énergétique fortifiée en vitamines B pour un coup de boost." },
    { nom: "Énergie Malt Bouteille Verre", prix: 700, categorie: "boisson", image: "assets/energie malt en bouteille.jpg", stock: 45, seuil_alerte: 15, description: "Bouteille en verre consignée d'Énergie Malt servie extra fraîche." },
    { nom: "Eau Minérale Céleste 50cl", prix: 200, categorie: "boisson", image: "assets/bouteille celeste.png", stock: 150, seuil_alerte: 40, description: "Petite bouteille d'eau minérale naturelle de source 50cl." },
    { nom: "Eau Minérale Céleste 1.5L", prix: 1000, categorie: "boisson", image: "assets/bouteille celeste.png", stock: 90, seuil_alerte: 25, description: "Grande bouteille d'eau minérale naturelle 1.5 Litres." },
    { nom: "Dégué Traditionnel au Mil", prix: 500, categorie: "boisson", image: "assets/jus de bissap.png", stock: 55, seuil_alerte: 15, description: "Dessert lacté crémeux au couscous de mil sucré et vanille." },
    { nom: "Lait Frais Pasteurisé 50cl", prix: 500, categorie: "boisson", image: "assets/product_cappuccino.png", stock: 40, seuil_alerte: 10, description: "Bouteille de lait frais de ferme pasteurisé riche en calcium." },
    { nom: "Chocolat Chaud Gourmand Maison", prix: 3000, categorie: "cafe", image: "assets/Chocolat Chaud.png", stock: 50, seuil_alerte: 10, description: "Chocolat chaud onctueux préparé avec du pur cacao ivoirien de grand cru." },
    { nom: "Cappuccino Moka Velouté", prix: 1000, categorie: "cafe", image: "assets/product_cappuccino.png", stock: 50, seuil_alerte: 15, description: "Espresso avec mousse de lait veloutée saupoudrée de cacao fin." },
    { nom: "Espresso Pur Arabica", prix: 800, categorie: "cafe", image: "assets/Chocolat Chaud.png", stock: 65, seuil_alerte: 20, description: "Café court corsé aux arômes intenses de grains torréfiés." },
    { nom: "Café au Lait Traditionnel", prix: 1000, categorie: "cafe", image: "assets/product_cappuccino.png", stock: 50, seuil_alerte: 15, description: "Grand café allongé au lait chaud crémeux pour bien démarrer la journée." },

    // --- 6. SNACKS, TRAITEUR & PIZZAS CHAUDES ---
    { nom: "Mini Pizza Gourmande au Fromage", prix: 1000, categorie: "autre", image: "assets/Pizza.png", stock: 40, seuil_alerte: 10, description: "Mini pizza individuelle garnie de sauce tomate maison, mozzarella et origan." },
    { nom: "Petite Pizza Royale Garnie", prix: 5000, categorie: "autre", image: "assets/Pizza.png", stock: 25, seuil_alerte: 5, description: "Pizza moyenne garnie de jambon, champignons, fromage fondant et olives." },
    { nom: "Grande Pizza Familiale XXL", prix: 10000, categorie: "autre", image: "assets/Pizza.png", stock: 15, seuil_alerte: 3, description: "Pizza géante familiale 4 saisons à partager pour 4 à 6 convives." },
    { nom: "Panini Poulet Braisé & Fromage", prix: 1500, categorie: "autre", image: "assets/Panini.png", stock: 35, seuil_alerte: 10, description: "Panini toasté chaud au poulet braisé mariné, oignons et fromage fondant." },
    { nom: "Panini 3 Fromages Fondants", prix: 1200, categorie: "autre", image: "assets/Panini.png", stock: 30, seuil_alerte: 10, description: "Panini toasté chaud mozzarella, emmental et chèvre aux herbes de Provence." },
    { nom: "Panini Nature Moelleux (100F)", prix: 100, categorie: "autre", image: "assets/Panini.png", stock: 60, seuil_alerte: 15, description: "Pain panini blanc moelleux non garni, prêt à griller." },
    { nom: "Sandwich Baguette Poulet Braisé", prix: 1500, categorie: "autre", image: "assets/product_sandwich.png", stock: 40, seuil_alerte: 10, description: "Demi-baguette croustillante garnie de poulet, salade, tomates et sauce chef." },
    { nom: "Sandwich Thon & Crudités Fraîches", prix: 1200, categorie: "autre", image: "assets/product_sandwich.png", stock: 35, seuil_alerte: 10, description: "Demi-baguette fraîche garnie de thon émietté, mayonnaise légère et œufs durs." },
    { nom: "Quiche Salée au Fromage", prix: 500, categorie: "autre", image: "assets/Panini.png", stock: 35, seuil_alerte: 10, description: "Part de quiche salée dorée au four à la crème et fromage emmental." },
    { nom: "Quiche Lorraine Royale aux Lardons", prix: 1200, categorie: "autre", image: "assets/Panini.png", stock: 30, seuil_alerte: 10, description: "Quiche traditionnelle garnie de lardons fumés, crème onctueuse et muscade." },
    { nom: "Croque-Monsieur Chaud Gratiné", prix: 700, categorie: "autre", image: "assets/product_sandwich.png", stock: 45, seuil_alerte: 15, description: "Pain de mie grillé, béchamel onctueuse, jambon et emmental gratiné au four." },
    { nom: "Brioche Salée à la Viande Hachée", prix: 1000, categorie: "autre", image: "assets/product_sandwich.png", stock: 35, seuil_alerte: 10, description: "Brioche moelleuse farcie à la viande de bœuf hachée assaisonnée." },
    { nom: "Feuilleté Salé Fromage Fondant", prix: 500, categorie: "autre", image: "assets/Panini.png", stock: 40, seuil_alerte: 10, description: "Feuilleté croustillant pur beurre garni d'une crème fondante au fromage." },
    { nom: "Feuilleté Saucisse & Moutarde", prix: 600, categorie: "autre", image: "assets/product_sandwich.png", stock: 40, seuil_alerte: 10, description: "Feuilleté roulé saucisse dorée au four et touche de moutarde douce." }
];

function escapeSql(str) {
    if (str === null || str === undefined) return "''";
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function publishAllProductsFast() {
    console.log(`================================================================`);
    console.log(`🚀 PUBLICATION ÉCLAIR DE TOUS LES ARTICLES (${fullCatalog.length} PRODUITS)`);
    console.log(`================================================================\n`);

    const db = await initDB();

    // 1. Générer les requêtes SQL groupées en blocs
    let sqlStatements = [];
    sqlStatements.push("DELETE FROM products;");
    sqlStatements.push("DELETE FROM stocks;");

    fullCatalog.forEach((p, idx) => {
        const id = idx + 1;
        sqlStatements.push(
            `INSERT INTO products (id, nom, prix, categorie, image, description, stock, seuil_alerte, is_active) ` +
            `VALUES (${id}, ${escapeSql(p.nom)}, ${Number(p.prix)}, ${escapeSql(p.categorie)}, ${escapeSql(p.image)}, ${escapeSql(p.description)}, ${Number(p.stock)}, ${Number(p.seuil_alerte)}, 1);`
        );
        sqlStatements.push(
            `INSERT INTO stocks (id, product_id, nom_produit, categorie, quantite_disponible, seuil_alerte, unite, prix_unitaire) ` +
            `VALUES (${id}, ${id}, ${escapeSql(p.nom)}, ${escapeSql(p.categorie)}, ${Number(p.stock)}, ${Number(p.seuil_alerte)}, 'pièce', ${Number(p.prix)});`
        );
    });

    const fullBatchSql = sqlStatements.join('\n');
    console.log(`[1/3] Exécution du batch SQL (${sqlStatements.length} requêtes groupées)...`);
    
    await db.exec(fullBatchSql);
    console.log(`[2/3] Batch SQL exécuté avec succès en base de données.`);

    // 2. Mettre à jour data/products.json
    const productsForJson = fullCatalog.map((p, idx) => ({
        id: idx + 1,
        name: p.nom,
        nom: p.nom,
        price: p.prix,
        prix: p.prix,
        category: p.categorie,
        categorie: p.categorie,
        image: p.image,
        description: p.description,
        stock: p.stock,
        seuil_alerte: p.seuil_alerte,
        is_active: 1
    }));

    const jsonPath = path.join(rootDir, 'data', 'products.json');
    fs.writeFileSync(jsonPath, JSON.stringify(productsForJson, null, 2), 'utf8');
    console.log(`[3/3] Fichier data/products.json mis à jour (${productsForJson.length} articles).`);

    // 3. Vérification des comptages en direct
    const countRes = await db.get("SELECT COUNT(*) as total FROM products");
    const catStats = await db.all("SELECT categorie, COUNT(*) as nb, SUM(stock) as stock_total FROM products GROUP BY categorie");

    console.log(`\n================================================================`);
    console.log(`🎉 SUCCÈS TOTAL : ${countRes.total} ARTICLES OFFICIELS PUBLIÉS EN BASE !`);
    console.log(`================================================================`);
    catStats.forEach(c => {
        console.log(`  * Catégorie [${c.categorie.toUpperCase()}] : ${c.nb} produits | Stock disponible: ${c.stock_total} unités`);
    });
    console.log(`================================================================\n`);
    process.exit(0);
}

publishAllProductsFast().catch(err => {
    console.error("❌ Erreur publication :", err);
    process.exit(1);
});
