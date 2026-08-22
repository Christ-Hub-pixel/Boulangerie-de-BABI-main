const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/user/Downloads/Boualangerie de babi/Boulangerie-de-BABI-main';
const productsPath = path.join(rootDir, 'data/products.json');
const assetsDir = path.join(rootDir, 'assets');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const assetFiles = fs.readdirSync(assetsDir);

// Mapping by product name / keyword to exact asset file
const imageMap = {
    // Boissons & Jus
    "chill": "assets/chill.png",
    "youyou": "assets/youzou.png",
    "youzou": "assets/youzou.png",
    "word cola": "assets/world cola.png",
    "world cola": "assets/world cola.png",
    "youki orange": "assets/youki moka cafe.png",
    "youki pomme": "assets/youki pomme.png",
    "youki moka": "assets/youki moka cafe.png",
    "jus naturel (petit format)": "assets/jus de baobab petit.png",
    "jus naturel (petit)": "assets/jus de baobab petit.png",
    "jus naturel (moyen format)": "assets/jus de baobab.png",
    "jus naturel (moyen)": "assets/jus de baobab.png",
    "jus naturel (bouteille 1.5l)": "assets/jus de passion.png",
    "jus naturel (grand)": "assets/jus de passion.png",
    "orangina": "assets/Orangina.png",
    "sprite": "assets/sprite.png",
    "énergie malt": "assets/energie malt .png",
    "energie malt": "assets/energie malt .png",
    "eau minérale": "assets/bouteille celeste.png",
    "eau minerale": "assets/bouteille celeste.png",
    "dégué": "assets/jus de bissap.png",
    "degue": "assets/jus de bissap.png",
    "passion": "assets/jus de passion.png",
    "baobab": "assets/jus de baobab.png",
    "bissap": "assets/jus de bissap.png",
    "gingembre": "assets/jus de gingembre.png",
    "tamarin": "assets/jus de tamari.png",
    "cocktail": "assets/cocktail.png",
    "citron": "assets/jus de citron.png",
    "chocolat chaud": "assets/Chocolat Chaud.png",
    "cappuccino": "assets/product_cappuccino.png",
    "espresso": "assets/Chocolat Chaud.png",

    // Pains & Boulangerie
    "baguette tradition": "assets/baguette 200.png",
    "baguette 200": "assets/baguette 200.png",
    "baguette 150": "assets/baguette 150.png",
    "ficelle": "assets/baguette 150.png",
    "pain complet (grand)": "assets/Pain Complet (Grand).png",
    "pain complet (petit)": "assets/pain complet 2.png",
    "pain complet": "assets/pain complet.png",
    "pain sans sel": "assets/pain sans sel.png",
    "petit pain": "assets/pain individuel.png",
    "pain cabré": "assets/cabre.png",
    "pain marbré": "assets/marbre.png",
    "pain marbre": "assets/marbre.png",
    "pain de mie": "assets/pain de mie.png",
    "pain parisien": "assets/baguette 150.png",
    "pain canadien": "assets/pain complet 3.png",
    "pain amour": "assets/pain complet.png",
    "suzette": "assets/pain individuel.png",

    // Viennoiseries
    "croissant pur beurre": "assets/Croissant.png",
    "croissant": "assets/Croissant.png",
    "croissant aux amandes": "assets/Croissant.png",
    "pain au chocolat": "assets/pain au chocolat.png",
    "pain aux raisins": "assets/pain au raisin.png",
    "chausson aux pommes": "assets/chausson aux pommes.png",
    "biscotte": "assets/biscottes.png",
    "biscottes": "assets/biscottes.png",
    "charaphe au raisin": "assets/charaphe au raisin.png",
    "choco suisse": "assets/choco suisse.png",
    "cookies": "assets/cookies.png",
    "palmier": "assets/palmier.png",
    "palmiers": "assets/palmier.png",
    "torsade": "assets/torsade.png",
    "madeleine": "assets/madeleine unite.png",
    "madeleines": "assets/lots de madeleine.png",

    // Pâtisseries & Desserts
    "forêt noire": "assets/product_foret_noire.png",
    "foret noire": "assets/product_foret_noire.png",
    "fondant au chocolat": "assets/Fondant au Chocolat.png",
    "fondant": "assets/Fondant au Chocolat.png",
    "flan": "assets/Flan.png",
    "moka": "assets/moka1.png",
    "cup cake": "assets/moka1.1.png",
    "cake": "assets/cake.png",
    "crêpe au nutella": "assets/crepe au nutella.png",
    "crepe au nutella": "assets/crepe au nutella.png",
    "crêpe à la vanille": "assets/crepe a la vanille.png",
    "crepe a la vanille": "assets/crepe a la vanille.png",
    "crêpe suzette": "assets/Crêpe Suzette.png",
    "crepe suzette": "assets/Crêpe Suzette.png",
    "crêpe": "assets/crepe rouge.png",
    "crepe": "assets/crepe rouge.png",
    "glace": "assets/glace.png",
    "gâteau de mariage": "assets/gateau de mariiage.png",
    "gateau de mariage": "assets/gateau de mariiage.png",
    "bûche de noël": "assets/buche de noel.png",
    "buche de noel": "assets/buche de noel.png",
    "gâteau": "assets/Gateau1.png",
    "gateau": "assets/Gateau1.png",
    "tarte au citron": "assets/Gateau1.png",
    "mille-feuille": "assets/cake.png",
    "mille feuille": "assets/cake.png",
    "éclair au chocolat": "assets/choco suisse.png",
    "eclair au chocolat": "assets/choco suisse.png",

    // Traiteur & Snacks
    "sandwich": "assets/product_sandwich.png",
    "pizza": "assets/Pizza.png",
    "panini": "assets/Panini.png",
    "quiche lorraine": "assets/Panini.png",
    "quiche": "assets/Panini.png"
};

let updatedCount = 0;

products.forEach(p => {
    const nameLower = (p.name || p.nom || '').toLowerCase();
    let matchedImage = null;

    // 1. Direct key match
    for (const [key, val] of Object.entries(imageMap)) {
        if (nameLower.includes(key)) {
            matchedImage = val;
            break;
        }
    }

    // 2. Category fallback
    if (!matchedImage) {
        const cat = (p.category || p.categorie || '').toLowerCase();
        if (cat.includes('boisson') || cat.includes('jus')) matchedImage = 'assets/jus de baobab.png';
        else if (cat.includes('viennois')) matchedImage = 'assets/Croissant.png';
        else if (cat.includes('patiss') || cat.includes('pâtiss')) matchedImage = 'assets/Gateau1.png';
        else if (cat.includes('traiteur') || cat.includes('snack')) matchedImage = 'assets/Pizza.png';
        else matchedImage = 'assets/baguette 200.png';
    }

    if (matchedImage) {
        p.image = matchedImage;
        updatedCount++;
    }
});

fs.writeFileSync(productsPath, JSON.stringify(products, null, 4), 'utf8');
console.log(`Successfully updated ${updatedCount} product images in ${productsPath}`);
