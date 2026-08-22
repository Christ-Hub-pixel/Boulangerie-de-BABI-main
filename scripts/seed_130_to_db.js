const fs = require('fs');
const path = require('path');
const { initDB } = require('../db.js');

const rootDir = path.join(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/products.json'), 'utf8'));

async function seedAll() {
    try {
        const db = await initDB();
        await db.run("DELETE FROM products");

        for (let p of products) {
            await db.run(
                "INSERT INTO products (nom, prix, categorie, image) VALUES (?, ?, ?, ?)",
                [p.name, p.price, p.category.toLowerCase(), p.image]
            );
        }
        console.log(`Successfully seeded ${products.length} products into SQLite database!`);
    } catch (err) {
        console.error('Error seeding DB:', err);
    }
}

seedAll();
