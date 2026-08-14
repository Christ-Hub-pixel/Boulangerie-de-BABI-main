const fs = require('fs');
const path = require('path');
const { initDB } = require('./db.js');

async function addProducts() {
    try {
        const db = await initDB();
        
        const processedDir = path.join(__dirname, 'assets', 'processed_products');
        const files = fs.readdirSync(processedDir).filter(f => f.endsWith('.jpg'));
        
        if(files.length < 4) {
            console.log("Pas assez de photos trouvées.");
            return;
        }

        const newProducts = [
            { nom: "Café Expresso", prix: 1000, categorie: "cafe", image: `assets/processed_products/${files[0]}` },
            { nom: "Jus Naturel", prix: 1500, categorie: "jus", image: `assets/processed_products/${files[1]}` },
            { nom: "Glace Maison", prix: 2000, categorie: "glace", image: `assets/processed_products/${files[2]}` },
            { nom: "Boisson Fraîche", prix: 1200, categorie: "boisson", image: `assets/processed_products/${files[3]}` }
        ];
        
        for (let p of newProducts) {
            await db.run("INSERT INTO products (nom, prix, categorie, image) VALUES (?, ?, ?, ?)", [p.nom, p.prix, p.categorie, p.image]);
            console.log(`Ajouté : ${p.nom} avec l'image ${p.image}`);
        }
        
        console.log("Nouveaux produits ajoutés avec succès !");
    } catch (err) {
        console.error("Erreur lors de l'ajout des produits :", err);
    }
}

addProducts();
