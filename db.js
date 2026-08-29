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
            lastID: (res && res.lastInsertRowid !== undefined) ? Number(res.lastInsertRowid) : Date.now(),
            changes: (res && res.changes !== undefined) ? res.changes : 0
        };
    }

    async get(sql, params = []) {
        const stmt = this._db.prepare(sql);
        return stmt.get(...params) || null;
    }

    async all(sql, params = []) {
        const stmt = this._db.prepare(sql);
        return stmt.all(...params) || [];
    }
}

class LibSqlDbWrapper {
    constructor(client) {
        this._client = client;
    }

    async exec(sql) {
        return this._client.executeMultiple(sql);
    }

    async run(sql, params = []) {
        const res = await this._client.execute({ sql, args: params });
        return {
            lastID: (res && res.lastInsertRowid !== undefined && res.lastInsertRowid !== null) ? Number(res.lastInsertRowid) : Date.now(),
            changes: (res && res.rowsAffected !== undefined) ? res.rowsAffected : 0
        };
    }

    async get(sql, params = []) {
        const res = await this._client.execute({ sql, args: params });
        return (res && res.rows && res.rows.length > 0) ? res.rows[0] : null;
    }

    async all(sql, params = []) {
        const res = await this._client.execute({ sql, args: params });
        return (res && res.rows) ? res.rows : [];
    }
}

const DEFAULT_TURSO_URL = 'libsql://babi-db-christ-hub-pixel.aws-eu-west-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4MTczNDAsImlkIjoiMDFhMDQyMzMtZDEwMS03ZGY0LWJmYzctOGFjZGRlMzEzNjE2Iiwia2lkIjoiRFJBeGs0UHdSb2tqcmZyckY4MEFwN3hOUHpYXy10RVRrSjZnVFBlWDBKYyIsInJpZCI6ImE0NWJiNDhmLTc5MGItNDdhYS1hYmYxLTRiYjAxM2EzMGYyNCJ9.HQxQU_w_ESoZKGbwKhE0WLabn-hzb5Amvraz_my_zNMLqZw6y14u7B_IcDz_rhpw20ewkiAIpnh01VL_hTjPCQ';

let cachedDbInstance = null;
let isDbSchemaReady = false;

const FULL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS _schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    email TEXT UNIQUE,
    telephone TEXT,
    mot_de_passe TEXT,
    role TEXT DEFAULT 'client',
    avatar TEXT,
    statut TEXT DEFAULT 'actif',
    caisse_assignee TEXT DEFAULT 'Caisse 1 - Riviera',
    code_pin TEXT DEFAULT '1234',
    is_online INTEGER DEFAULT 0,
    session_token TEXT,
    derniere_connexion DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    phone TEXT,
    address TEXT,
    delivery_address TEXT,
    items TEXT,
    subtotal_amount INTEGER DEFAULT 0,
    delivery_fee INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    total_price INTEGER,
    currency TEXT DEFAULT 'XOF',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'en_attente',
    refund_status TEXT DEFAULT 'aucun',
    support_message TEXT,
    delivery_notes TEXT,
    notes TEXT,
    status TEXT DEFAULT 'nouveau',
    type_retrait TEXT DEFAULT 'livraison',
    delivery_type TEXT DEFAULT 'livraison',
    pickup_slot TEXT,
    pickup_point TEXT DEFAULT 'Riviera',
    code_pin TEXT,
    security_risk_score INTEGER DEFAULT 0,
    security_risk_level TEXT DEFAULT 'FAIBLE',
    security_flags TEXT,
    updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prix INTEGER,
    categorie TEXT,
    image TEXT,
    description TEXT,
    stock INTEGER DEFAULT 50,
    seuil_alerte INTEGER DEFAULT 10,
    is_active INTEGER DEFAULT 1
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
    type TEXT,
    quantite INTEGER,
    motif TEXT,
    auteur TEXT DEFAULT 'Gérante',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    poste TEXT,
    telephone TEXT,
    email TEXT,
    statut_presence TEXT DEFAULT 'present',
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
    especes_reelles INTEGER DEFAULT 0,
    ecart INTEGER DEFAULT 0,
    detail_comptage TEXT,
    notes TEXT,
    numero_z TEXT,
    total_tickets INTEGER DEFAULT 0,
    statut TEXT DEFAULT 'ouvert',
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
`;

async function initDB() {
    if (cachedDbInstance && isDbSchemaReady) {
        return cachedDbInstance;
    }

    let db;
    let tursoUrl = process.env.TURSO_DATABASE_URL;
    if (!tursoUrl || (!tursoUrl.startsWith('libsql://') && !tursoUrl.startsWith('https://') && !tursoUrl.startsWith('http://'))) {
        tursoUrl = DEFAULT_TURSO_URL;
    }
    let tursoAuthToken = process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;

    if (tursoUrl) {
        try {
            let createClient;
            try {
                createClient = require('@libsql/client/web').createClient;
            } catch (_) {
                createClient = require('@libsql/client').createClient;
            }
            const client = createClient({
                url: tursoUrl,
                authToken: tursoAuthToken
            });
            db = new LibSqlDbWrapper(client);
        } catch (tursoErr) {
            console.warn("⚠️ Connexion Turso Cloud échouée, bascule locale :", tursoErr.message);
        }
    }

    if (!db) {
        const effectiveDbPath = process.env.VERCEL ? path.join('/tmp', 'database.sqlite') : dbPath;
        try {
            const { DatabaseSync } = require('node:sqlite');
            const dbSync = new DatabaseSync(effectiveDbPath);
            db = new SqliteDbWrapper(dbSync);
        } catch (e) {
            try {
                const sqlite3 = require('sqlite3').verbose();
                const { open } = require('sqlite');
                db = await open({
                    filename: effectiveDbPath,
                    driver: sqlite3.Database
                });
            } catch (err2) {
                console.error("Erreur critique SQLite :", err2.message);
            }
        }
    }

    if (!db) {
        throw new Error("Impossible d'initialiser le pilote de base de données.");
    }

    // ⚡ Fast Schema Check (Sub-100ms on warm/re-invocation)
    try {
        const migrationCheck = await db.get("SELECT version FROM _schema_migrations WHERE version = 2");
        if (migrationCheck) {
            cachedDbInstance = db;
            isDbSchemaReady = true;
            return db;
        }
    } catch (_) {
        // Table doesn't exist yet, proceed with creation
    }

    // 🚀 Création globale rapide de toutes les tables en un seul batch
    try {
        await db.exec(FULL_SCHEMA_SQL);
        await db.run("INSERT OR REPLACE INTO _schema_migrations (version) VALUES (2)");
    } catch (batchErr) {
        console.warn("[DB] Batch schema notice:", batchErr.message);
    }

    // Initialisation / Vérification du Compte Administrateur Principal (1 requête ultra-rapide)
    try {
        const secureAuth = require('./services/secure_auth.service.js');
        const adminEmail = 'admin@boulangeriedebabi.com';
        const existingAdmin = await db.get("SELECT id FROM users WHERE email = ? OR role = 'admin'", [adminEmail]);
        if (!existingAdmin) {
            const hashedPassword = secureAuth.hashPassword('Admin@Babi2026!');
            await db.run(
                "INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar) VALUES (?, ?, ?, ?, ?, 'admin', 'assets/avatar_admin.png')",
                ['BABI', 'Administrateur', adminEmail, '+225 07 04 38 92 01', hashedPassword]
            );
        }
    } catch (adminErr) {
        console.warn("[DB] Admin seed notice:", adminErr.message);
    }

    // Auto-seed des produits si la table est vide
    try {
        const prodCount = await db.get("SELECT COUNT(*) as count FROM products");
        if (!prodCount || prodCount.count === 0) {
            const jsonPath = path.resolve(__dirname, 'data', 'products.json');
            if (fs.existsSync(jsonPath)) {
                const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                if (Array.isArray(list) && list.length > 0) {
                    let batchSql = [];
                    list.forEach((p, idx) => {
                        const id = p.id || (idx + 1);
                        const nom = (p.nom || p.name || '').replace(/'/g, "''");
                        const cat = (p.categorie || p.category || 'pain').replace(/'/g, "''");
                        const img = (p.image || 'assets/product_baguette.png').replace(/'/g, "''");
                        const desc = (p.description || '').replace(/'/g, "''");
                        const prix = Number(p.prix || p.price || 500);
                        const stock = Number(p.stock || 50);
                        const seuil = Number(p.seuil_alerte || 10);

                        batchSql.push(`INSERT INTO products (id, nom, prix, categorie, image, description, stock, seuil_alerte, is_active) VALUES (${id}, '${nom}', ${prix}, '${cat}', '${img}', '${desc}', ${stock}, ${seuil}, 1);`);
                        batchSql.push(`INSERT INTO stocks (id, product_id, nom_produit, categorie, quantite_disponible, seuil_alerte, unite, prix_unitaire) VALUES (${id}, ${id}, '${nom}', '${cat}', ${stock}, ${seuil}, 'pièce', ${prix});`);
                    });
                    await db.exec(batchSql.join('\n'));
                    console.log(`[DB] Auto-seed : ${list.length} produits initialisés avec succès.`);
                }
            }
        }
    } catch (seedErr) {
        console.warn("[DB] Product auto-seed notice:", seedErr.message);
    }

    cachedDbInstance = db;
    isDbSchemaReady = true;
    return db;
}

module.exports = { initDB };