-- ============================================================================
-- 🥖 BOULANGERIE DE BABI - JEU DE DONNÉES INITIAL (SEED SQL)
-- ============================================================================

-- 1. INSERTION DU COMPTOIR PRINCIPAL
INSERT INTO bakery_counters (id, name, location, phone, opening_hours, is_open)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'Comptoir Principal Cocody Danga', 'Cocody Danga, près du carrefour de la Cité des Arts, Abidjan', '+225 07 00 00 00 01', '06:00 - 22:00', true);

-- 2. INSERTION DES UTILISATEURS DU SYSTÈME (4 RÔLES)
INSERT INTO users (id, full_name, email, phone_number, role, password_hash, loyalty_points, vip_tier)
VALUES 
-- Administrateur Système
('u0000000-0000-0000-0000-000000000001', 'Administrateur BABI', 'admin@boulangeriedebabi.ci', '+225 01 02 03 04 05', 'administrateur', crypt('Admin@2026', gen_salt('bf')), 500, 'Gold'),

-- Gérante de Boutique
('u0000000-0000-0000-0000-000000000002', 'Awa Coulibaly (Gérante)', 'gerante@boulangeriedebabi.ci', '+225 07 11 22 33 44', 'gerante', crypt('Gerante@2026', gen_salt('bf')), 300, 'Silver'),

-- Caissière Principale
('u0000000-0000-0000-0000-000000000003', 'Aminata Traoré (Caisse 1)', 'caissiere@boulangeriedebabi.ci', '+225 05 55 66 77 88', 'caissiere', crypt('Caisse@2026', gen_salt('bf')), 100, 'Standard'),

-- Client Exemple
('u0000000-0000-0000-0000-000000000004', 'Koffi Kouamé', 'client@boulangeriedebabi.ci', '+225 07 88 99 00 11', 'client', crypt('Client@2026', gen_salt('bf')), 140, 'Gold');

-- 3. INSERTION DES CATÉGORIES
INSERT INTO categories (id, name, slug, description, icon_name, display_order)
VALUES 
('cat00000-0000-0000-0000-000000000001', 'Boulangerie', 'boulangerie', 'Pains traditionnels, baguettes croustillantes et pains spéciaux au levain', 'bakery_dining', 1),
('cat00000-0000-0000-0000-000000000002', 'Viennoiseries', 'viennoiseries', 'Croissants pur beurre, pains au chocolat fondants et douceurs feuilletées', 'croissant', 2),
('cat00000-0000-0000-0000-000000000003', 'Gâteaux & Cakes', 'gateaux-cakes', 'Gâteaux de fête, mokas, pièces montées et cakes moelleux faits maison', 'cake', 3),
('cat00000-0000-0000-0000-000000000004', 'Desserts', 'desserts', 'Crêpes fraîches au Nutella, glaces artisanales et fondants chocolat', 'icecream', 4),
('cat00000-0000-0000-0000-000000000005', 'Boissons', 'boissons', 'Jus naturels locaux de Côte d Ivoire, cafés serrés et rafraîchissements', 'local_drink', 5);

-- 4. INSERTION DES PRODUITS DU CATALOGUE
INSERT INTO products (id, category_name, name, unit_price, image_url, is_popular, description)
VALUES 
-- VIENNOISERIES
('v1', 'Viennoiseries', 'Croissant Pur Beurre', 500.00, 'assets/Croissant.webp', true, 'Feuilletage croustillant et fondant au pur beurre de baratte, préparé chaque matin.'),
('v2', 'Viennoiseries', 'Pain au Chocolat', 500.00, 'assets/pain au chocolat.webp', true, 'Délicieuse viennoiserie garnie de deux barres de chocolat noir intense.'),
('v3', 'Viennoiseries', 'Pain au Raisin', 700.00, 'assets/pain au raisin.webp', false, 'Pâte feuilletée briochée roulée avec crème pâtissière onctueuse et raisins secs moelleux.'),
('v4', 'Viennoiseries', 'Chausson aux Pommes', 1000.00, 'assets/chausson aux pommes.webp', true, 'Feuilletage doré garni d une compotée de pommes fraîches caramélisées.'),
('v5', 'Viennoiseries', 'Choco Suisse', 800.00, 'assets/choco suisse.webp', false, 'Pâte briochée généreusement fourrée de crème pâtissière et pépites de chocolat.'),
('v6', 'Viennoiseries', 'Charaphe au Raisin', 700.00, 'assets/charaphe au raisin.webp', false, 'Spécialité viennoise torsadée avec raisins blonds parfumés.'),
('v7', 'Viennoiseries', 'Pain au Lait Sucré', 200.00, 'assets/pain au lait sucre.webp', false, 'Petit pain moelleux au lait entier et perles de sucre croquantes.'),
('v8', 'Viennoiseries', 'Palmier Croustillant', 200.00, 'assets/palmier.webp', false, 'Feuilletage caramélisé au sucre roux, croustillant à souhait.'),
('v9', 'Viennoiseries', 'Palmier Doré Feuilleté', 250.00, 'assets/palmier2.webp', false, 'Grand palmier généreusement beurré et croustillant.'),
('v10', 'Viennoiseries', 'Torsade au Chocolat', 800.00, 'assets/pain torsade au chocolat .webp', false, 'Torsade croustillante et fondante garnie de crème et pépites de chocolat.'),
('v11', 'Viennoiseries', 'Torsade Sucrée', 600.00, 'assets/torsade.webp', false, 'Torsade croustillante dorée au four.'),
('v12', 'Viennoiseries', 'Flan Pâtissier', 1000.00, 'assets/Flan.webp', false, 'Flan traditionnel onctueux à la vanille de Madagascar sur pâte brisée.'),
('v13', 'Viennoiseries', 'Biscottes Artisanales', 1000.00, 'assets/biscottes.webp', false, 'Sachet de biscottes croustillantes faites maison pour le petit-déjeuner.'),
('v14', 'Viennoiseries', 'Madeleine à l unité', 100.00, 'assets/madeleine unite.webp', false, 'Madeleine moelleuse au beurre frais et zeste de citron.'),
('v15', 'Viennoiseries', 'Lot de Madeleines (x6)', 500.00, 'assets/lots de madeleine.webp', false, 'Pack de 6 madeleines traditionnelles moelleuses.'),
('v16', 'Viennoiseries', 'Cookies Pépites Chocolat', 200.00, 'assets/Cookies (l unité).webp', false, 'Cookie américain croquant à l extérieur et fondant à l intérieur.'),
('v17', 'Viennoiseries', 'Lot de Cookies Gourmands', 1000.00, 'assets/cookies.webp', false, 'Assortiment de 6 cookies artisanaux aux éclats de chocolat.'),
('v18', 'Viennoiseries', 'Brioche Pur Beurre', 800.00, 'assets/product_brioche.webp', false, 'Brioche dorée moelleuse à la mie aérée et filante.'),
('v19', 'Viennoiseries', 'Sandwich Américain', 700.00, 'assets/product_sandwich.webp', false, 'Pain baguette frais garni de crudités, œuf, jambon et sauce maison.'),
('v20', 'Viennoiseries', 'Croque-Monsieur Chaud', 1000.00, 'assets/product_sandwich.webp', false, 'Pain de mie toasté avec jambon, béchamel et fromage gratiné.'),

-- GÂTEAUX & CAKES
('g1', 'Gâteaux & Cakes', 'Gâteau Anniversaire (Petit 4-6 pers)', 10000.00, 'assets/Gateau1.webp', false, 'Gâteau festif personnalisé génoise vanille et crème légère aux fruits.'),
('g2', 'Gâteaux & Cakes', 'Gâteau Festif (Moyen 8-10 pers)', 15000.00, 'assets/Gateau1.1.webp', false, 'Création pâtissière élégante au chocolat ou vanille pour célébrations.'),
('g3', 'Gâteaux & Cakes', 'Gâteau d Événement (Grand 12-15 pers)', 20000.00, 'assets/Gateau1.2.webp', false, 'Grand gâteau prestige avec finition soignée et décor raffiné.'),
('g4', 'Gâteaux & Cakes', 'Gâteau Géant Prestige (20+ pers)', 25000.00, 'assets/gateau evenement.webp', false, 'Gâteau monumental pour grands événements d entreprise et cérémonies.'),
('g5', 'Gâteaux & Cakes', 'Pièce Montée & Mariage', 45000.00, 'assets/gateau de mariiage.webp', false, 'Gâteau de mariage à étages avec fleurs et finitions haute pâtisserie.'),
('g6', 'Gâteaux & Cakes', 'Forêt Noire Pâtissière', 2500.00, 'assets/product_foret_noire.webp', true, 'Génoise cacao imbibée, chantilly gourmande et cerises griottes.'),
('g7', 'Gâteaux & Cakes', 'Entremet Royal Chocolat', 2500.00, 'assets/product_entremet.webp', false, 'Mousse chocolat noir pure origine sur biscuit croustillant praliné.'),
('g8', 'Gâteaux & Cakes', 'Tarte aux Fraises Fraîches', 2000.00, 'assets/product_tarte_fraises.webp', true, 'Pâte sablée pur beurre, crème pâtissière vanillée et fraises fraîches.'),
('g9', 'Gâteaux & Cakes', 'Mille-Feuille Croustillant', 1500.00, 'assets/product_mille_feuille.webp', false, 'Trois couches de pâte feuilletée caramélisée et crème diplomate vanille.'),
('g10', 'Gâteaux & Cakes', 'Éclair au Chocolat Pur Cacao', 1000.00, 'assets/product_eclair_chocolat.webp', false, 'Pâte à choux fraîche garnie d une crème chocolat et glaçage brillant.'),
('g11', 'Gâteaux & Cakes', 'Gâteau Moka Traditionnel', 1500.00, 'assets/moka1.webp', false, 'Biscuit génoise moelleux et crème au beurre café Arabica.'),
('g12', 'Gâteaux & Cakes', 'Moka Pâtissier Amandes', 2000.00, 'assets/moka1.1.webp', false, 'Moka généreux garni d amandes effilées torréfiées.'),
('g13', 'Gâteaux & Cakes', 'Bûche Gourmande (Petite)', 5000.00, 'assets/buche de noel.webp', false, 'Bûche roulée au chocolat et crème onctueuse.'),
('g14', 'Gâteaux & Cakes', 'Bûche Festive (Grande)', 7000.00, 'assets/buche de noel.webp', false, 'Bûche de fête grand format pour toute la famille.'),
('g15', 'Gâteaux & Cakes', 'Cake Maison (Portion)', 300.00, 'assets/cake.webp', false, 'Tranche de cake moelleux aux pépites de chocolat.'),
('g16', 'Gâteaux & Cakes', 'Cake Entier Gourmand', 1500.00, 'assets/cake1.webp', false, 'Cake familial fondant aux fruits confits et vanille.'),
('g17', 'Gâteaux & Cakes', 'Cup Cake Décoré', 500.00, 'assets/gateau2.webp', false, 'Petit gâteau individuel avec topping crème onctueuse et confiserie.'),

-- DESSERTS
('d1', 'Desserts', 'Crêpe au Nutella', 2000.00, 'assets/crepe au nutella.webp', false, 'Grande crêpe fine préparée à la minute, généreusement nappée de Nutella.'),
('d2', 'Desserts', 'Crêpe à la Vanille & Sucre', 2000.00, 'assets/crepe a la vanille.webp', false, 'Crêpe dorée parfumée à la vanille bourbon et beurre doux.'),
('d3', 'Desserts', 'Crêpe Suzette aux Agrumes', 2000.00, 'assets/Crêpe Suzette.webp', false, 'Crêpe classique au caramel d oranges et zeste frais.'),
('d4', 'Desserts', 'Fondant au Chocolat Coeur Coulant', 1000.00, 'assets/Fondant au Chocolat.webp', false, 'Gâteau au chocolat noir avec son cœur fondant chaud.'),
('d5', 'Desserts', 'Glace Artisanale (Pot)', 1000.00, 'assets/glace.webp', false, 'Glace maison aux saveurs vanille, chocolat ou fraise.'),
('d6', 'Desserts', 'Coupe Glacée Gourmande', 1500.00, 'assets/product_glace.webp', false, 'Glace onctueuse servie avec coulis de fruits et chantilly.'),

-- BOULANGERIE
('bl1', 'Boulangerie', 'Baguette Tradition 150g', 150.00, 'assets/baguette 150.webp', false, 'Baguette ivoirienne croustillante à la croûte dorée et mie légère.'),
('bl2', 'Boulangerie', 'Baguette Dorée 200g', 200.00, 'assets/baguette 200.webp', true, 'Baguette de maître boulanger 200g, longue fermentation.'),
('bl3', 'Boulangerie', 'Pain Complet Artisanal (Petit)', 500.00, 'assets/pain complet.webp', false, 'Pain riche en fibres à la farine complète de meule.'),
('bl4', 'Boulangerie', 'Pain Complet (Grand Format)', 1000.00, 'assets/Pain Complet (Grand).webp', false, 'Grand pain complet tranché ou entier, parfait pour une digestion saine.'),
('bl5', 'Boulangerie', 'Pain Complet Multi-Céréales', 800.00, 'assets/pain complet 2.webp', false, 'Pain complet garni de graines de lin, sésame, tournesol et pavot.'),
('bl6', 'Boulangerie', 'Pain Sans Sel Diététique', 150.00, 'assets/pain sans sel.webp', false, 'Pain léger sans ajout de sel, idéal pour régimes spécifiques.'),
('bl7', 'Boulangerie', 'Pain de Mie Frais Tranché', 2000.00, 'assets/pain de mie.webp', false, 'Grand pain de mie extra moelleux pour toasts et sandwiches.'),
('bl8', 'Boulangerie', 'Pain Parisien Moelleux', 300.00, 'assets/pain  parisien.webp', false, 'Pain moelleux parisien à la croûte souple et dorée.'),
('bl9', 'Boulangerie', 'Pain Marbré Tradition', 500.00, 'assets/marbre1.webp', false, 'Pain spécial marbré au feuilletage beurré et savoureux.'),
('bl10', 'Boulangerie', 'Pain Marbré Chocolaté', 700.00, 'assets/marbre1.1.webp', false, 'Pain marbré avec tourbillon de chocolat fondant.'),
('bl11', 'Viennoiseries', 'Pain au Lait Sucré', 700.00, 'assets/cabre.webp', false, 'Délicieux pain au lait moelleux et doré, délicatement sucré.'),
('bl12', 'Boulangerie', 'Pain de Campagne Levain', 1000.00, 'assets/product_campagne.webp', false, 'Pain de campagne authentique au levain naturel cuit sur sole.'),
('bl13', 'Boulangerie', 'Pain Bâtard Tradition', 500.00, 'assets/product_batard.webp', false, 'Pain bâtard rustique à la forme généreuse et mie aérée.'),
('bl14', 'Boulangerie', 'Pain aux Graines & Céréales', 700.00, 'assets/product_cereal.webp', false, 'Mélange harmonieux de 6 céréales et graines torréfiées.'),
('bl15', 'Boulangerie', 'Ficelle Apéritive Croustillante', 500.00, 'assets/product_baguette.webp', false, 'Fine baguette très croustillante, parfaite pour l apéritif.'),
('bl16', 'Boulangerie', 'Pain Individuel de Table', 100.00, 'assets/pain individuel.webp', false, 'Petit pain rond individuel pour accompagner vos repas.'),
('bl17', 'Boulangerie', 'Petit Pain 50F', 50.00, 'assets/pain individuel.webp', false, 'Petit pain chaud économique idéal pour le goûter des enfants.'),

-- BOISSONS
('b1', 'Boissons', 'Jus de Bissap Artisanal', 2000.00, 'assets/jus de bissap.webp', true, 'Pur jus de fleurs d hibiscus avec une touche de menthe fraîche et vanille.'),
('b2', 'Boissons', 'Jus de Baobab Onctueux', 2000.00, 'assets/jus de baobab.webp', true, 'Jus naturel de pain de singe riche en vitamine C et calcium.'),
('b3', 'Boissons', 'Jus de Baobab (Petit Format)', 500.00, 'assets/jus de baobab petit.webp', false, 'Bouteille individuelle de jus de baobab bien frais.'),
('b4', 'Boissons', 'Jus de Fruit de la Passion (Grand)', 3000.00, 'assets/jus de passion.webp', false, 'Jus pur de fruits de la passion de Côte d Ivoire, acidulé et rafraîchissant.'),
('b5', 'Boissons', 'Jus de Passion (Petit Format)', 700.00, 'assets/jus de passion.webp', false, 'Petit format pratique de pur jus de passion.'),
('b6', 'Boissons', 'Jus de Gingembre Tonique (Gnamakoudji)', 3000.00, 'assets/jus de gingembre.webp', false, 'Jus de gingembre frais pressé relevé d ananas et citron.'),
('b7', 'Boissons', 'Jus de Citron Vert Pressé', 2000.00, 'assets/jus de citron.webp', false, 'Citronnade maison désaltérante 100% naturelle.'),
('b8', 'Boissons', 'Jus de Tomi (Tamarin Doux)', 2000.00, 'assets/jus de tomi.webp', false, 'Jus de tamarin naturel sucré au miel et arôme cannelle.'),
('b9', 'Boissons', 'Jus de Tamarin Tonus', 2000.00, 'assets/jus de tamari.webp', false, 'Tamarin pressé avec pulpe naturelle bien fraîche.'),
('b10', 'Boissons', 'Cocktail de Fruits Exotiques', 3000.00, 'assets/cocktail.webp', false, 'Mélange équilibré de bissap, ananas, passion et mangue.'),
('b11', 'Boissons', 'Jus d Ananas Pressé', 1000.00, 'assets/product_jus_ananas.webp', false, 'Pur jus d ananas de Bonoua, sans sucre ajouté.'),
('b12', 'Boissons', 'Jus d Orange Frais Pressé', 1500.00, 'assets/product_jus_orange.webp', false, 'Oranges fraîches pressées à la commande.'),
('b13', 'Boissons', 'Jus Naturel Maison (Petit)', 300.00, 'assets/Jus Naturel (Petit).webp', false, 'Petit format économique de jus local.'),
('b14', 'Boissons', 'Jus Naturel Maison (Moyen)', 500.00, 'assets/Jus Naturel (Moyen).webp', false, 'Format 50cl de jus naturel de fruits locaux.'),
('b15', 'Boissons', 'Jus Naturel Maison (Grand 1.5L)', 2000.00, 'assets/Jus Naturel (Grand).webp', false, 'Grande bouteille familiale 1.5 litre de jus naturel.'),
('b16', 'Boissons', 'Chocolat Chaud Gourmand', 3000.00, 'assets/Chocolat Chaud.webp', false, 'Véritable chocolat ivoirien cuisiné au lait entier et crème.'),
('b17', 'Boissons', 'Café Expresso Pur Arabica', 700.00, 'assets/product_cafe_expresso.webp', false, 'Café serré italien aux arômes intenses et crème onctueuse.'),
('b18', 'Boissons', 'Cappuccino Mousseux', 1000.00, 'assets/product_cappuccino.webp', false, 'Espresso surmonté d une généreuse mousse de lait saupoudrée de cacao.'),
('b19', 'Boissons', 'Orangina Bouteille 33cl', 500.00, 'assets/Orangina.webp', false, 'Boisson gazeuse rafraîchissante à la pulpe d orange.'),
('b20', 'Boissons', 'Sprite Frais 33cl', 500.00, 'assets/sprite.webp', false, 'Soda gazeux citron-lime bien frais.'),
('b21', 'Boissons', 'World Cola Frais', 500.00, 'assets/world cola.webp', false, 'Cola pétillant servi bien glacé.'),
('b22', 'Boissons', 'Youki Pomme Pétillant', 500.00, 'assets/youki pomme.webp', false, 'Boisson gazeuse ivoirienne aromatisée à la pomme.'),
('b23', 'Boissons', 'Youki Moka Café', 500.00, 'assets/youki moka cafe.webp', false, 'Boisson gazeuse pétillante au goût café moka.'),
('b24', 'Boissons', 'Youzou Limonade', 500.00, 'assets/youzou.webp', false, 'Limonade locale rafraîchissante au citron vert.'),
('b25', 'Boissons', 'Énergie Malt', 700.00, 'assets/energie malt .webp', false, 'Boisson maltée fortifiante et nutritive sans alcool.'),
('b26', 'Boissons', 'Énergie Malt en Bouteille', 700.00, 'assets/energie malt en bouteille.webp', false, 'Bouteille en verre d Énergie Malt bien fraîche.'),
('b27', 'Boissons', 'Eau Minérale Céleste (Petite 0.5L)', 200.00, 'assets/bouteille celeste.webp', false, 'Eau minérale naturelle pure et fraîche.'),
('b28', 'Boissons', 'Eau Minérale Céleste (Grande 1.5L)', 500.00, 'assets/bouteille celeste.webp', false, 'Grande bouteille d eau minérale 1.5 litre.'),
('b29', 'Boissons', 'Boisson Chill Glacée', 700.00, 'assets/chill.webp', false, 'Boisson rafraîchissante fruitée servie glacée.');

-- 5. INSERTION DES CODES PROMOS
INSERT INTO promo_codes (code, discount_percent, discount_amount, min_order_amount, is_active, usage_limit)
VALUES 
('BABI10', 10.00, 0.00, 0.00, true, 5000),
('VIP20', 20.00, 0.00, 3000.00, true, 1000),
('BIENVENUE', 0.00, 500.00, 1500.00, true, 2000);

-- 6. INSERTION D'UNE COMMANDE EXEMPLE AVEC SNAPSHOT DES PRIX & PIN DE RETRAIT
INSERT INTO orders (
    id,
    order_number,
    pickup_pin,
    customer_id,
    counter_id,
    status,
    subtotal,
    discount_amount,
    total_amount,
    payment_method,
    payment_status,
    wave_txn_reference,
    created_at,
    paid_at
) VALUES (
    'o0000000-0000-0000-0000-000000000001',
    'BAB-9842',
    '4829',
    'u0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'en_preparation',
    8500.00,
    0.00,
    8500.00,
    'wave',
    'paye',
    'T_7G8H9J2K3L4M5N6P',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    CURRENT_TIMESTAMP - INTERVAL '14 minutes'
);

-- Lignes de la commande exemple avec snapshots des prix unitaires
INSERT INTO order_items (order_id, product_id, product_name, unit_price_snapshot, quantity, subtotal_snapshot)
VALUES 
('o0000000-0000-0000-0000-000000000001', 'v1', 'Croissant Pur Beurre', 500.00, 2, 1000.00),
('o0000000-0000-0000-0000-000000000001', 'bl2', 'Baguette Dorée 200g', 200.00, 1, 200.00),
('o0000000-0000-0000-0000-000000000001', 'g6', 'Forêt Noire Pâtissière', 2500.00, 1, 2500.00),
('o0000000-0000-0000-0000-000000000001', 'b1', 'Jus de Bissap Artisanal', 2000.00, 1, 2000.00);

-- Transaction de paiement liée
INSERT INTO payments (order_id, method, amount, status, txn_reference, verified_at)
VALUES 
('o0000000-0000-0000-0000-000000000001', 'wave', 8500.00, 'paye', 'T_7G8H9J2K3L4M5N6P', CURRENT_TIMESTAMP - INTERVAL '14 minutes');

-- 7. INITIALISATION DES STOCKS POUR TOUS LES PRODUITS DU CATALOGUE
INSERT INTO stocks (product_id, current_quantity, min_alert_threshold)
SELECT id, 45, 10 FROM products;

-- 8. INITIALISATION DES EMPLOYÉS
INSERT INTO employees (user_id, employee_code, job_title, counter_id, hire_date, is_on_duty)
VALUES 
('u0000000-0000-0000-0000-000000000002', 'EMP-CAI-001', 'Caissière Principale', 'c0000000-0000-0000-0000-000000000001', '2024-01-15', true),
('u0000000-0000-0000-0000-000000000003', 'EMP-GER-001', 'Gérante de Boutique & Stocks', 'c0000000-0000-0000-0000-000000000001', '2023-06-01', true);

