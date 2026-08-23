const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');

class SqliteDbWrapper {
    constructor(dbSync) {
        this._db = dbSync;
    }

    async exec(sql) {
        return this._db.exec(sql);
    }

    async run(sql, params = []) {
        const stmt = this._db.prepare(sql);
        const res = stmt.run(...params);
        return {
            lastID: Number(res.lastInsertRowid),
            changes: res.changes
        };
    }

    async get(sql, params = []) {
        const stmt = this._db.prepare(sql);
        return stmt.get(...params);
    }

    async all(sql, params = []) {
        const stmt = this._db.prepare(sql);
        return stmt.all(...params);
    }
}

async function initDB() {
    let db;
    try {
        const { DatabaseSync } = require('node:sqlite');
        const dbSync = new DatabaseSync(dbPath);
        db = new SqliteDbWrapper(dbSync);
    } catch (e) {
        const sqlite3 = require('sqlite3').verbose();
        const { open } = require('sqlite');
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
    }

    // Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            prenom TEXT,
            email TEXT UNIQUE,
            telephone TEXT,
            mot_de_passe TEXT,
            role TEXT DEFAULT 'client', -- 'client', 'caissiere', 'gerante', 'admin'
            avatar TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            type_retrait TEXT DEFAULT 'livraison', -- 'livraison', 'click_collect'
            code_pin TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            prix INTEGER,
            categorie TEXT,
            image TEXT,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS stocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            nom_produit TEXT,
            categorie TEXT,
            quantite_disponible INTEGER DEFAULT 50,
            seuil_alerte INTEGER DEFAULT 10,
            unite TEXT DEFAULT 'pièce',
            prix_unitaire INTEGER DEFAULT 500,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            nom_produit TEXT,
            type TEXT, -- 'entree' (fournée/arrivage), 'sortie' (vente/perte), 'ajustement'
            quantite INTEGER,
            motif TEXT,
            auteur TEXT DEFAULT 'Gérante',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            prenom TEXT,
            poste TEXT, -- 'Caissière', 'Gérante', 'Maître Boulanger', 'Pâtissier', 'Livreur'
            telephone TEXT,
            email TEXT,
            statut_presence TEXT DEFAULT 'present', -- 'present', 'en_pause', 'absent'
            date_embauche TEXT DEFAULT '2024-01-15',
            avatar TEXT
        );

        CREATE TABLE IF NOT EXISTS cash_registers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caissiere_nom TEXT,
            fond_de_caisse INTEGER DEFAULT 50000,
            total_ventes INTEGER DEFAULT 0,
            total_especes INTEGER DEFAULT 0,
            total_wave INTEGER DEFAULT 0,
            total_orange INTEGER DEFAULT 0,
            total_mtn INTEGER DEFAULT 0,
            statut TEXT DEFAULT 'ouvert', -- 'ouvert', 'ferme'
            date_ouverture DATETIME DEFAULT CURRENT_TIMESTAMP,
            date_cloture DATETIME
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

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            unit_price INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            total_price INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            user_id INTEGER,
            amount INTEGER NOT NULL,
            currency TEXT DEFAULT 'XOF',
            provider TEXT NOT NULL,
            provider_transaction_id TEXT,
            status TEXT DEFAULT 'PENDING',
            idempotency_key TEXT UNIQUE,
            error_message TEXT,
            raw_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payment_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id TEXT NOT NULL,
            order_id TEXT NOT NULL,
            previous_status TEXT,
            new_status TEXT NOT NULL,
            event_source TEXT NOT NULL,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pickup_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            pin_code TEXT NOT NULL,
            is_used INTEGER DEFAULT 0,
            validated_by_user_id INTEGER,
            validated_by_name TEXT,
            validated_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS refunds (
            id TEXT PRIMARY KEY,
            payment_id TEXT NOT NULL,
            order_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'PENDING',
            provider_refund_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_id TEXT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            channel TEXT DEFAULT 'in_app',
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            user_id TEXT,
            ip_address TEXT,
            details TEXT,
            hash_signature TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS security_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            order_id TEXT,
            risk_score INTEGER DEFAULT 0,
            risk_level TEXT DEFAULT 'FAIBLE',
            ip_address TEXT,
            user_agent TEXT,
            details TEXT,
            hash_signature TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Ensure columns exist if tables were already created in an earlier version
    const migrations = [
        "ALTER TABLE users ADD COLUMN prenom TEXT",
        "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'",
        "ALTER TABLE users ADD COLUMN avatar TEXT",
        "ALTER TABLE orders ADD COLUMN user_id INTEGER",
        "ALTER TABLE orders ADD COLUMN customer_email TEXT",
        "ALTER TABLE orders ADD COLUMN customer_phone TEXT",
        "ALTER TABLE orders ADD COLUMN type_retrait TEXT DEFAULT 'click_collect'",
        "ALTER TABLE orders ADD COLUMN delivery_type TEXT DEFAULT 'click_collect'",
        "ALTER TABLE orders ADD COLUMN pickup_slot TEXT",
        "ALTER TABLE orders ADD COLUMN pickup_point TEXT DEFAULT 'Riviera'",
        "ALTER TABLE orders ADD COLUMN delivery_address TEXT",
        "ALTER TABLE orders ADD COLUMN notes TEXT",
        "ALTER TABLE orders ADD COLUMN subtotal_amount INTEGER DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN delivery_fee INTEGER DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN total_amount INTEGER DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT 'XOF'",
        "ALTER TABLE orders ADD COLUMN code_pin TEXT",
        "ALTER TABLE orders ADD COLUMN security_risk_score INTEGER DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN security_risk_level TEXT DEFAULT 'FAIBLE'",
        "ALTER TABLE orders ADD COLUMN security_flags TEXT",
        "ALTER TABLE orders ADD COLUMN updated_at DATETIME"
    ];

    for (const sql of migrations) {
        try { await db.run(sql); } catch (_) {}
    }

    // Ensure columns exist if table was already created in an earlier version
    try {
        await db.run("ALTER TABLE users ADD COLUMN prenom TEXT");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN avatar TEXT");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE orders ADD COLUMN type_retrait TEXT DEFAULT 'livraison'");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE orders ADD COLUMN code_pin TEXT");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE orders ADD COLUMN security_risk_score INTEGER DEFAULT 0");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE orders ADD COLUMN security_risk_level TEXT DEFAULT 'FAIBLE'");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE orders ADD COLUMN security_flags TEXT");
    } catch (e) {}

    // Cashier Session and Control Migrations
    try {
        await db.run("ALTER TABLE users ADD COLUMN statut TEXT DEFAULT 'actif'");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN caisse_assignee TEXT DEFAULT 'Caisse 1 - Riviera'");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN code_pin TEXT DEFAULT '1234'");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN is_online INTEGER DEFAULT 0");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN session_token TEXT");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE users ADD COLUMN derniere_connexion DATETIME");
    } catch (e) {}

    // Product Status and Stock Migrations
    try {
        await db.run("ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 50");
    } catch (e) {}
    try {
        await db.run("ALTER TABLE products ADD COLUMN seuil_alerte INTEGER DEFAULT 10");
    } catch (e) {}

    // Initial clean state: No hardcoded dummy users or employees. 
    // Accounts are created exclusively by the Administrator or registered legitimately.

    // Seed default products & stocks from data/products.json if products table is empty
    const prodCount = await db.get("SELECT COUNT(*) as count FROM products");
    if (prodCount.count === 0) {
        const jsonPath = path.resolve(__dirname, 'data', 'products.json');
        if (fs.existsSync(jsonPath)) {
            try {
                const raw = fs.readFileSync(jsonPath, 'utf8');
                const productsData = JSON.parse(raw);
                for (const p of productsData) {
                    const res = await db.run(
                        "INSERT INTO products (nom, prix, categorie, image, description) VALUES (?, ?, ?, ?, ?)",
                        [p.name, p.price, p.category, p.image || 'assets/product_baguette.png', p.description || 'Produit artisanal de la Boulangerie de BABI.']
                    );
                    const prodId = res.lastID;
                    // Stock initial
                    const initialStock = Math.floor(Math.random() * 40) + 15; // 15 to 55 units
                    await db.run(
                        "INSERT INTO stocks (product_id, nom_produit, categorie, quantite_disponible, seuil_alerte, unite, prix_unitaire) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [prodId, p.name, p.category, initialStock, 10, 'pièce', p.price]
                    );
                }
                console.log(`Initialisation de ${productsData.length} produits et stocks effectuée avec succès.`);
            } catch (err) {
                console.error("Erreur chargement data/products.json:", err.message);
            }
        }
    } else {
        // Sync & update existing products with real images from data/products.json
        const jsonPath = path.resolve(__dirname, 'data', 'products.json');
        if (fs.existsSync(jsonPath)) {
            try {
                const raw = fs.readFileSync(jsonPath, 'utf8');
                const productsData = JSON.parse(raw);
                for (const p of productsData) {
                    if (p.image && p.image !== 'null') {
                        await db.run("UPDATE products SET image = ? WHERE nom = ? OR nom = ?", [p.image, p.name, p.nom || p.name]);
                    }
                }
            } catch (err) {
                console.error("Erreur synchronisation images:", err.message);
            }
        }

        // Sync stocks table if empty
        const stockCount = await db.get("SELECT COUNT(*) as count FROM stocks");
        if (stockCount.count === 0) {
            const allP = await db.all("SELECT * FROM products");
            for (const p of allP) {
                await db.run(
                    "INSERT INTO stocks (product_id, nom_produit, categorie, quantite_disponible, seuil_alerte, unite, prix_unitaire) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [p.id, p.nom, p.categorie, 35, 10, 'pièce', p.prix]
                );
            }
        }
    }

    console.log("Database initialized & seeded at " + dbPath);
    return db;
}

module.exports = { initDB };