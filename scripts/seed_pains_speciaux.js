const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://babi-db-christ-hub-pixel.aws-eu-west-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4MTczNDAsImlkIjoiMDFhMDQyMzMtZDEwMS03ZGY0LWJmYzctOGFjZGRlMzEzNjE2Iiwia2lkIjoiRFJBeGs0UHdSb2tqcmZyckY4MEFwN3hOUHpYXy10RVRrSjZnVFBlWDBKYyIsInJpZCI6ImE0NWJiNDhmLTc5MGItNDdhYS1hYmYxLTRiYjAxM2EzMGYyNCJ9.HQxQU_w_ESoZKGbwKhE0WLabn-hzb5Amvraz_my_zNMLqZw6y14u7B_IcDz_rhpw20ewkiAIpnh01VL_hTjPCQ'
});

const painsSpeciaux = [
    { nom: 'Pain Cabre', prix: 700, categorie: 'pain', image: 'assets/cabre.png', description: 'Pain spécial traditionnel croustillant et aéré.', stock: 40, seuil_alerte: 10 },
    { nom: 'Pain Breton', prix: 700, categorie: 'pain', image: 'assets/product_campagne.png', description: 'Pain rustique breton à la farine sélectionnée et mie alvéolée.', stock: 35, seuil_alerte: 10 },
    { nom: 'Pain Délice', prix: 700, categorie: 'pain', image: 'assets/product_campagne.png', description: 'Pain brioché tendre et savoureux de tradition artisanale.', stock: 40, seuil_alerte: 10 },
    { nom: 'Pain Marbré', prix: 500, categorie: 'pain', image: 'assets/marbre.png', description: 'Pain spécial marbré savoureux et moelleux.', stock: 30, seuil_alerte: 8 },
    { nom: 'Pain Amour', prix: 1000, categorie: 'pain', image: 'assets/product_campagne.png', description: 'Pain spécial généreux en forme de cœur, idéal pour partager.', stock: 25, seuil_alerte: 5 },
    { nom: 'Pain Canadien', prix: 700, categorie: 'pain', image: 'assets/product_cereal.png', description: 'Pain de mie multigrains canadien riche en graines et fibres.', stock: 35, seuil_alerte: 10 },
    { nom: 'Pain de Mie Spécial', prix: 2000, categorie: 'pain', image: 'assets/pain de mie.png', description: 'Grand pain de mie artisanal tranché ultra moelleux.', stock: 30, seuil_alerte: 8 },
    { nom: 'Pain Parisien', prix: 300, categorie: 'pain', image: 'assets/pain  parisien.jpeg', description: 'Grosse baguette parisienne artisanale à croûte bien dorée.', stock: 50, seuil_alerte: 15 },
    { nom: 'Pain Viennois', prix: 500, categorie: 'pain', image: 'assets/product_brioche.png', description: 'Pain viennois pur beurre doux et fondant.', stock: 45, seuil_alerte: 10 },
    { nom: 'Pain Suzette', prix: 300, categorie: 'pain', image: 'assets/product_campagne.png', description: 'Pain doux délicatement sucré aux arômes naturels.', stock: 40, seuil_alerte: 10 },
    { nom: 'Pain Complet (Grand)', prix: 1000, categorie: 'pain', image: 'assets/Pain Complet (Grand).png', description: 'Grand pain complet riche en son et fibres naturelles.', stock: 40, seuil_alerte: 10 },
    { nom: 'Pain Complet (Petit)', prix: 500, categorie: 'pain', image: 'assets/pain complet 2.png', description: 'Petit pain complet 100% farine complète.', stock: 50, seuil_alerte: 12 },
    { nom: 'Pain Sans Sel', prix: 150, categorie: 'pain', image: 'assets/pain sans sel.png', description: 'Baguette diététique élaborée sans sel ajouté.', stock: 40, seuil_alerte: 10 },
    { nom: 'Baguette 200', prix: 200, categorie: 'pain', image: 'assets/baguette 200.png', description: 'Baguette classique croustillante dorée au four à sole.', stock: 120, seuil_alerte: 25 },
    { nom: 'Baguette 150', prix: 150, categorie: 'pain', image: 'assets/baguette 150.png', description: 'Baguette traditionnelle croustillante de table.', stock: 100, seuil_alerte: 20 },
    { nom: 'Ficelle', prix: 500, categorie: 'pain', image: 'assets/product_baguette.png', description: 'Ficelle fine et très croustillante.', stock: 40, seuil_alerte: 10 }
];

async function addPains() {
    console.log('🚀 Insertion des pains spéciaux dans Turso Cloud...');
    for (const p of painsSpeciaux) {
        const existing = await client.execute({
            sql: 'SELECT id FROM products WHERE nom = ?',
            args: [p.nom]
        });
        if (existing.rows.length === 0) {
            const res = await client.execute({
                sql: 'INSERT INTO products (nom, prix, categorie, image, description, stock, seuil_alerte, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                args: [p.nom, p.prix, p.categorie, p.image, p.description, p.stock, p.seuil_alerte]
            });
            const prodId = Number(res.lastInsertRowid);
            await client.execute({
                sql: "INSERT INTO stocks (product_id, nom_produit, categorie, quantite_disponible, seuil_alerte, unite, prix_unitaire) VALUES (?, ?, ?, ?, ?, 'pièce', ?)",
                args: [prodId, p.nom, p.categorie, p.stock, p.seuil_alerte, p.prix]
            });
            console.log(`✅ Ajouté : ${p.nom} (ID ${prodId})`);
        } else {
            console.log(`ℹ️ Déjà présent : ${p.nom}`);
        }
    }

    // Récupérer tout le catalogue et mettre à jour data/products.json
    const all = await client.execute('SELECT * FROM products ORDER BY id ASC');
    const jsonPath = path.resolve(__dirname, '..', 'data', 'products.json');
    fs.writeFileSync(jsonPath, JSON.stringify(all.rows, null, 2), 'utf8');
    console.log(`📦 Fichier data/products.json mis à jour avec ${all.rows.length} produits !`);
}

addPains().catch(console.error);
