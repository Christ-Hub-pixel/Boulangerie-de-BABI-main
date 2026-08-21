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

        CREATE TABLE IF NOT EXISTS security_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT, -- 'PAYMENT_EVALUATION', 'WEBHOOK_RECEIVED', 'SUSPICIOUS_VELOCITY', 'PIN_VERIFICATION'
            order_id TEXT,
            risk_score INTEGER DEFAULT 0,
            risk_level TEXT DEFAULT 'FAIBLE', -- 'FAIBLE', 'MODÉRÉ', 'ÉLEVÉ'
            ip_address TEXT,
            user_agent TEXT,
            details TEXT,
            hash_signature TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

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

    // Seed default users for the 4 roles if not already present
    const defaultUsers = [
        { nom: 'Diallo', prenom: 'Amadou', email: 'client@babi.ci', telephone: '0701020304', mot_de_passe: 'client123', role: 'client', avatar: 'assets/avatar_client.png' },
        { nom: 'Kouassi', prenom: 'Awa', email: 'caisse@babi.ci', telephone: '0705060708', mot_de_passe: 'caisse123', role: 'caissiere', avatar: 'assets/avatar_caissiere.png' },
        { nom: 'Traoré', prenom: 'Mariam', email: 'gerante@babi.ci', telephone: '0709101112', mot_de_passe: 'gerante123', role: 'gerante', avatar: 'assets/avatar_gerante.png' },
        { nom: 'Bakayoko', prenom: 'Ibrahim', email: 'admin@babi.ci', telephone: '0704389201', mot_de_passe: 'admin123', role: 'admin', avatar: 'assets/avatar_admin.png' }
    ];

    for (const u of defaultUsers) {
        const existing = await db.get("SELECT id FROM users WHERE email = ?", [u.email]);
        if (!existing) {
            await db.run(
                "INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [u.nom, u.prenom, u.email, u.telephone, u.mot_de_passe, u.role, u.avatar]
            );
        } else {
            // Update role if exists
            await db.run("UPDATE users SET role = ?, prenom = ? WHERE email = ?", [u.role, u.prenom, u.email]);
        }
    }

    // Seed default employees if empty
    const empCount = await db.get("SELECT COUNT(*) as count FROM employees");
    if (empCount.count === 0) {
        const defaultEmployees = [
            { nom: 'Traoré', prenom: 'Mariam', poste: 'Gérante & Direction Fournil', telephone: '0709101112', email: 'gerante@babi.ci', statut_presence: 'present', date_embauche: '2023-03-01' },
            { nom: 'Kouassi', prenom: 'Awa', poste: 'Caissière Principale (Caisse 1)', telephone: '0705060708', email: 'caisse@babi.ci', statut_presence: 'present', date_embauche: '2023-06-15' },
            { nom: 'Yao', prenom: 'Michel', poste: 'Maître Boulanger Chef Fournil', telephone: '0708899001', email: 'michel.yao@babi.ci', statut_presence: 'present', date_embauche: '2022-11-10' },
            { nom: 'Soro', prenom: 'Fatou', poste: 'Pâtissière & Traiteur', telephone: '0702233445', email: 'fatou.soro@babi.ci', statut_presence: 'present', date_embauche: '2023-09-01' },
            { nom: 'Koffi', prenom: 'Jean', poste: 'Vendeur & Accueil Comptoir', telephone: '0706817977', email: 'jean.koffi@babi.ci', statut_presence: 'present', date_embauche: '2024-01-08' }
        ];

        for (const emp of defaultEmployees) {
            await db.run(
                "INSERT INTO employees (nom, prenom, poste, telephone, email, statut_presence, date_embauche) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [emp.nom, emp.prenom, emp.poste, emp.telephone, emp.email, emp.statut_presence, emp.date_embauche]
            );
        }
    }

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