const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

async function initDB() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            email TEXT UNIQUE,
            telephone TEXT,
            mot_de_passe TEXT
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT,
            phone TEXT,
            address TEXT,
            items TEXT,
            total_price INTEGER,
            payment_method TEXT,
            payment_status TEXT DEFAULT 'en_attente',
            refund_status TEXT DEFAULT 'aucun',
            support_message TEXT,
            delivery_notes TEXT,
            status TEXT DEFAULT 'nouveau',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            prix INTEGER,
            categorie TEXT,
            image TEXT
        );

        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            client_rating INTEGER,
            client_tags TEXT,
            client_comment TEXT,
            driver_rating INTEGER,
            driver_tags TEXT,
            driver_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Database initialized at " + dbPath);
    return db;
}

module.exports = { initDB };