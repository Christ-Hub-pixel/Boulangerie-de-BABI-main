
const { initDB } = require('./db.js');

async function seed() {
    const db = await initDB();
    const existing = await db.get("SELECT COUNT(*) as count FROM products");
    if (existing.count === 0) {
        const products = [
            { nom: "Baguette Classique", prix: 300, categorie: "Pain", image: "https://images.unsplash.com/photo-1597079910443-60c43fc4f729?auto=format&fit=crop&w=400&q=80" },
            { nom: "Pain de Campagne", prix: 800, categorie: "Pain", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80" },
            { nom: "Croissant au Beurre", prix: 500, categorie: "Croissant", image: "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?auto=format&fit=crop&w=400&q=80" },
            { nom: "Pain au Chocolat", prix: 600, categorie: "Croissant", image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=400&q=80" },
            { nom: "Gâteau Forêt Noire", prix: 15000, categorie: "Gâteau", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80" },
            { nom: "Jus d'Orange Frais", prix: 1500, categorie: "Jus", image: "https://images.unsplash.com/photo-1622597467836-f38240662f53?auto=format&fit=crop&w=400&q=80" }
        ];
        
        for(let p of products) {
            await db.run("INSERT INTO products (nom, prix, categorie, image) VALUES (?, ?, ?, ?)", [p.nom, p.prix, p.categorie, p.image]);
        }
        console.log("Products seeded successfully.");
    } else {
        console.log("Products already exist, skipping seed.");
    }
}
seed();
