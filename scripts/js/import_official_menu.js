const { initDB } = require('./db.js');

const menuItems = [
    // === BOISSONS ===
    { nom: "Chill", prix: 700, categorie: "boisson", image: "assets/chill.png" },
    { nom: "Youyou", prix: 500, categorie: "boisson", image: "assets/youzou.png" },
    { nom: "Word Cola", prix: 500, categorie: "boisson", image: "assets/world cola.png" },
    { nom: "Youki Orange", prix: 500, categorie: "boisson", image: "assets/youki moka cafe.png" },
    { nom: "Youki Pomme", prix: 500, categorie: "boisson", image: "assets/youki pomme.png" },
    { nom: "Jus Naturel (Petit)", prix: 300, categorie: "jus", image: "assets/jus de baobab petit.png" },
    { nom: "Jus Naturel (Moyen)", prix: 500, categorie: "jus", image: "assets/jus de baobab.png" },
    { nom: "Jus Naturel (Grand)", prix: 2000, categorie: "jus", image: "assets/jus de passion.png" },
    { nom: "Orangina", prix: 500, categorie: "boisson" },
    { nom: "Sprite", prix: 500, categorie: "boisson" },
    { nom: "Énergie Malt", prix: 700, categorie: "boisson" },
    { nom: "Eau Minérale (Petite)", prix: 200, categorie: "boisson", image: "assets/bouteille celeste.png" },
    { nom: "Eau Minérale (Grande)", prix: 1000, categorie: "boisson", image: "assets/bouteille celeste.png" },
    { nom: "Dégué", prix: 500, categorie: "boisson", image: "assets/jus de bissap.png" },
    { nom: "Lait", prix: 500, categorie: "boisson" },
    { nom: "Passion (Grand Format)", prix: 3000, categorie: "jus", image: "assets/jus de passion.png" },
    { nom: "Passion (Petite Bouteille)", prix: 700, categorie: "jus", image: "assets/jus de passion.png" },
    { nom: "Baobab", prix: 500, categorie: "jus", image: "assets/jus de baobab.png" },
    { nom: "Bissap", prix: 2000, categorie: "jus", image: "assets/jus de bissap.png" },
    { nom: "Gingembre", prix: 3000, categorie: "jus", image: "assets/jus de gingembre.png" },
    { nom: "Tamarin", prix: 2000, categorie: "jus", image: "assets/jus de tamari.png" },
    { nom: "Cocktail", prix: 3000, categorie: "jus", image: "assets/cocktail.png" },
    { nom: "Citron", prix: 2000, categorie: "jus", image: "assets/jus de citron.png" },
    { nom: "Chocolat Chaud", prix: 3000, categorie: "cafe", image: "assets/Chocolat Chaud.png" },

    // === BOULANGERIE ===
    { nom: "Baguette 150", prix: 150, categorie: "pain", image: "assets/baguette 150.png" },
    { nom: "Baguette 200", prix: 200, categorie: "pain", image: "assets/baguette 200.png" },
    { nom: "Ficelle", prix: 500, categorie: "pain", image: "assets/baguette 150.png" },
    { nom: "Pain Complet (Grand)", prix: 1000, categorie: "pain", image: "assets/Pain Complet (Grand).png" },
    { nom: "Pain Complet (Petit)", prix: 500, categorie: "pain", image: "assets/pain complet 2.png" },
    { nom: "Pain Sans Sel", prix: 150, categorie: "pain", image: "assets/pain sans sel.png" },
    { nom: "Petit Pain (50F)", prix: 50, categorie: "pain", image: "assets/pain individuel.png" },
    { nom: "Petit Pain (100F)", prix: 100, categorie: "pain", image: "assets/pain individuel.png" },

    // === VIENNOISERIES ===
    { nom: "Biscotte", prix: 1000, categorie: "viennoiserie", image: "assets/biscottes.png" },
    { nom: "Charaphe au Raisin", prix: 700, categorie: "viennoiserie", image: "assets/charaphe au raisin.png" },
    { nom: "Chausson aux Pommes", prix: 1000, categorie: "viennoiserie", image: "assets/chausson aux pommes.png" },
    { nom: "Choco Suisse", prix: 800, categorie: "viennoiserie", image: "assets/choco suisse.png" },
    { nom: "Cookies (l'unité)", prix: 200, categorie: "viennoiserie", image: "assets/cookies.png" },
    { nom: "Croissant", prix: 500, categorie: "viennoiserie", image: "assets/Croissant.png" },
    { nom: "Escargots", prix: 700, categorie: "viennoiserie" },
    { nom: "Flan", prix: 1000, categorie: "patisserie", image: "assets/Flan.png" },
    { nom: "Lot de Cookies", prix: 1000, categorie: "viennoiserie", image: "assets/cookies.png" },
    { nom: "Pain au Chocolat", prix: 500, categorie: "viennoiserie", image: "assets/pain au chocolat.png" },
    { nom: "Pain au Lait", prix: 200, categorie: "viennoiserie" },
    { nom: "Pain aux Raisins", prix: 700, categorie: "viennoiserie", image: "assets/pain au raisin.png" },
    { nom: "Pain Évêque", prix: 800, categorie: "viennoiserie" },
    { nom: "Pain Suisse", prix: 800, categorie: "viennoiserie" },
    { nom: "Palmiers", prix: 200, categorie: "viennoiserie", image: "assets/palmier.png" },
    { nom: "Star Suisse", prix: 800, categorie: "viennoiserie" },
    { nom: "Torsade", prix: 800, categorie: "viennoiserie", image: "assets/torsade.png" },
    { nom: "Madeleines (l'unité)", prix: 100, categorie: "viennoiserie", image: "assets/madeleine unite.png" },

    // === GATEAU & CAKE ===
    { nom: "Gâteau (10 000F)", prix: 10000, categorie: "patisserie", image: "assets/Gateau1.png" },
    { nom: "Gâteau (15 000F)", prix: 15000, categorie: "patisserie", image: "assets/Gateau1.1.png" },
    { nom: "Gâteau (20 000F)", prix: 20000, categorie: "patisserie", image: "assets/Gateau1.2.png" },
    { nom: "Gâteau (25 000F)", prix: 25000, categorie: "patisserie", image: "assets/gateau2.png" },
    { nom: "Gâteau de Mariage", prix: 35000, categorie: "patisserie", image: "assets/gateau de mariiage.png" },
    { nom: "Bûche de Noël (7000F)", prix: 7000, categorie: "patisserie", image: "assets/buche de noel.png" },
    { nom: "Bûche de Noël (5000F)", prix: 5000, categorie: "patisserie", image: "assets/buche de noel.png" },
    { nom: "Moka", prix: 1500, categorie: "patisserie", image: "assets/moka1.png" },
    { nom: "Lot de Madeleines", prix: 500, categorie: "viennoiserie", image: "assets/lots de madeleine.png" },
    { nom: "Madeleine", prix: 100, categorie: "viennoiserie", image: "assets/madeleine unite.png" },
    { nom: "Cup Cake", prix: 500, categorie: "patisserie", image: "assets/moka1.1.png" },
    { nom: "Cake (300F)", prix: 300, categorie: "patisserie", image: "assets/cake.png" },
    { nom: "Cake (700F)", prix: 700, categorie: "patisserie", image: "assets/cake1.png" },

    // === DESSERT ===
    { nom: "Crêpe au Nutella", prix: 2000, categorie: "patisserie", image: "assets/crepe au nutella.png" },
    { nom: "Crêpe à la Vanille", prix: 1500, categorie: "patisserie", image: "assets/crepe a la vanille.png" },
    { nom: "Crêpe Suzette", prix: 1500, categorie: "patisserie", image: "assets/Crêpe Suzette.png" },
    { nom: "Fondant au Chocolat", prix: 1000, categorie: "patisserie", image: "assets/Fondant au Chocolat.png" },
    { nom: "Glace", prix: 1000, categorie: "glace", image: "assets/glace.png" },

    // === PAINS SPECIAUX ===
    { nom: "Pain Cabré", prix: 700, categorie: "pain", image: "assets/cabre.png" },
    { nom: "Pain Breton", prix: 700, categorie: "pain" },
    { nom: "Pain Délice", prix: 700, categorie: "pain" },
    { nom: "Pain Marbré", prix: 500, categorie: "pain", image: "assets/marbre.png" },
    { nom: "Pain Amour", prix: 1000, categorie: "pain", image: "assets/pain complet.png" },
    { nom: "Pain Canadien", prix: 700, categorie: "pain", image: "assets/pain complet 3.png" },
    { nom: "Pain de Mie", prix: 2000, categorie: "pain", image: "assets/pain de mie.png" },
    { nom: "Pain Parisien", prix: 300, categorie: "pain", image: "assets/baguette 150.png" },
    { nom: "Pain Viennois (500F)", prix: 500, categorie: "pain" },
    { nom: "Pain Viennois (700F)", prix: 700, categorie: "pain" },
    { nom: "Suzette", prix: 300, categorie: "pain", image: "assets/pain individuel.png" }
];

async function updateDatabase() {
    try {
        const db = await initDB();
        await db.run("DELETE FROM products");

        for (let p of menuItems) {
            const img = p.image || null;
            await db.run(
                "INSERT INTO products (nom, prix, categorie, image) VALUES (?, ?, ?, ?)",
                [p.nom, p.prix, p.categorie, img]
            );
        }
        console.log(`${menuItems.length} produits mis à jour dans SQLite (sans catégorie snack/pizza) !`);
    } catch (err) {
        console.error("Erreur :", err);
    }
}

updateDatabase();
