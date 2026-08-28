const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://babi-db-christ-hub-pixel.aws-eu-west-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4MTczNDAsImlkIjoiMDFhMDQyMzMtZDEwMS03ZGY0LWJmYzctOGFjZGRlMzEzNjE2Iiwia2lkIjoiRFJBeGs0UHdSb2tqcmZyckY4MEFwN3hOUHpYXy10RVRrSjZnVFBlWDBKYyIsInJpZCI6ImE0NWJiNDhmLTc5MGItNDdhYS1hYmYxLTRiYjAxM2EzMGYyNCJ9.HQxQU_w_ESoZKGbwKhE0WLabn-hzb5Amvraz_my_zNMLqZw6y14u7B_IcDz_rhpw20ewkiAIpnh01VL_hTjPCQ'
});

const specialBreadNames = [
    'Pain Cabre', 'Pain Breton', 'Pain Délice', 'Pain Marbré', 'Pain Amour',
    'Pain Canadien', 'Pain de Mie Spécial', 'Pain Parisien', 'Pain Viennois',
    'Pain Suzette', 'Pain Complet (Grand)', 'Pain Complet (Petit)', 'Pain Sans Sel'
];

async function run() {
    console.log('🔄 Mise à jour de la catégorie pains_speciaux...');
    
    // Batch statements
    const stmts = [];
    for (const name of specialBreadNames) {
        stmts.push({
            sql: "UPDATE products SET categorie = 'pains_speciaux' WHERE nom = ?",
            args: [name]
        });
        stmts.push({
            sql: "UPDATE stocks SET categorie = 'pains_speciaux' WHERE nom_produit = ?",
            args: [name]
        });
    }

    await client.batch(stmts, 'write');
    console.log('✅ Base de données mise à jour avec la catégorie pains_speciaux !');

    const all = await client.execute('SELECT * FROM products ORDER BY id ASC');
    const jsonPath = path.resolve(__dirname, '..', 'data', 'products.json');
    fs.writeFileSync(jsonPath, JSON.stringify(all.rows, null, 2), 'utf8');
    console.log(`📦 data/products.json mis à jour (${all.rows.length} produits enregistrés) !`);
}

run().catch(console.error);
