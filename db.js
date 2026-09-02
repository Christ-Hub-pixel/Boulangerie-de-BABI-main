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

CREATE TABLE IF NOT EXISTS deleted_products (
    id TEXT PRIMARY KEY,
    nom TEXT,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    icone TEXT DEFAULT '🥖',
    description TEXT DEFAULT '',
    ordre INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // ⚡ Fast Schema Check
    try {
        await db.run("CREATE TABLE IF NOT EXISTS deleted_products (id TEXT PRIMARY KEY, nom TEXT, deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        await db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            nom TEXT NOT NULL,
            icone TEXT DEFAULT '🥖',
            description TEXT DEFAULT '',
            ordre INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        const migrationCheck = await db.get("SELECT version FROM _schema_migrations WHERE version = 5");
        if (migrationCheck) {
            cachedDbInstance = db;
            isDbSchemaReady = true;
            return db;
        }
    } catch (_) {
        // Proceed with creation
    }

    // 🚀 Création globale rapide de toutes les tables en un seul batch
    try {
        await db.exec(FULL_SCHEMA_SQL);
        await db.run("INSERT OR REPLACE INTO _schema_migrations (version) VALUES (5)");
    } catch (batchErr) {
        console.warn("[DB] Batch schema notice:", batchErr.message);
    }

    // Initialisation / Vérification des Comptes Clés (Admin, Gérante, Caissières)
    try {
        const secureAuth = require('./services/secure_auth.service.js');
        
        // 1. Super Administrateur
        const adminEmail = 'admin@boulangeriedebabi.com';
        const existingAdmin = await db.get("SELECT id FROM users WHERE email = ? OR role = 'admin'", [adminEmail]);
        if (!existingAdmin) {
            const hashedPassword = secureAuth.hashPassword('Admin@Babi2026!');
            await db.run(
                "INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, caisse_assignee) VALUES (?, ?, ?, ?, ?, 'admin', 'assets/avatar_admin.png', 'Direction Centrale')",
                ['BABI', 'Administrateur', adminEmail, '+225 07 00 00 00 00', hashedPassword]
            );
        }

        // 2. Gérante
        const geranteEmail = 'gerante@boulangeriedebabi.com';
        const existingGerante = await db.get("SELECT id FROM users WHERE email = ? OR role = 'gerante'", [geranteEmail]);
        if (!existingGerante) {
            const hashedPassword = secureAuth.hashPassword('Gerante@Babi2026!');
            await db.run(
                "INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, caisse_assignee) VALUES (?, ?, ?, ?, ?, 'gerante', 'assets/aicha.png', 'Supervision Riviera')",
                ['Kouamé', 'Marie-Claire', geranteEmail, '+225 07 00 00 00 01', hashedPassword]
            );
        }

        // 3. Caissière 1
        const caisse1Email = 'caisse1@boulangeriedebabi.com';
        const existingCaisse1 = await db.get("SELECT id FROM users WHERE email = ? OR (role = 'caissiere' AND caisse_assignee LIKE '%Caisse 1%')", [caisse1Email]);
        if (!existingCaisse1) {
            const hashedPassword = secureAuth.hashPassword('Caisse@Babi2026!');
            await db.run(
                "INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, statut, caisse_assignee, code_pin) VALUES (?, ?, ?, ?, ?, 'caissiere', 'assets/caissiere.png', 'actif', 'Caisse 1 - Riviera', '1234')",
                ['Traoré', 'Awa', caisse1Email, '+225 05 55 12 34 56', hashedPassword]
            );
        }

        // 4. Caissière 2
        const caisse2Email = 'caisse2@boulangeriedebabi.com';
        const existingCaisse2 = await db.get("SELECT id FROM users WHERE email = ? OR (role = 'caissiere' AND caisse_assignee LIKE '%Caisse 2%')", [caisse2Email]);
        if (!existingCaisse2) {
            const hashedPassword = secureAuth.hashPassword('Caisse@Babi2026!');
            await db.run(
                "INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, statut, caisse_assignee, code_pin) VALUES (?, ?, ?, ?, ?, 'caissiere', 'assets/caissiere1.png', 'actif', 'Caisse 2 - Fournil Express', '5678')",
                ['Bamba', 'Fatou', caisse2Email, '+225 05 55 78 90 12', hashedPassword]
            );
        }
    } catch (usersErr) {
        console.warn("[DB] Users seed notice:", usersErr.message);
    }

    // Auto-seed de l'équipe (Employés) si la table est vide
    try {
        const empCount = await db.get("SELECT COUNT(*) as count FROM employees");
        if (!empCount || empCount.count === 0) {
            const defaultEmployees = [
                { nom: 'Kouassi', prenom: 'Mamadou', poste: 'Maître Boulanger', telephone: '+225 07 01 22 33 44', email: 'mamadou.boulanger@babi.ci', statut: 'present', avatar: 'assets/baker_profile.png' },
                { nom: 'Diabaté', prenom: 'Sékou', poste: 'Chef Pâtissier', telephone: '+225 07 02 33 44 55', email: 'sekou.patissier@babi.ci', statut: 'present', avatar: 'assets/chef_profile.png' },
                { nom: 'Traoré', prenom: 'Awa', poste: 'Caissière Principale', telephone: '+225 05 55 12 34 56', email: 'caisse1@boulangeriedebabi.com', statut: 'present', avatar: 'assets/caissiere.png' },
                { nom: 'Bamba', prenom: 'Fatou', poste: 'Caissière Retrait Express', telephone: '+225 05 55 78 90 12', email: 'caisse2@boulangeriedebabi.com', statut: 'present', avatar: 'assets/caissiere1.png' },
                { nom: 'Yao', prenom: 'Konan Yves', poste: 'Aide Fournil & Cuisson', telephone: '+225 07 09 88 77 66', email: 'yves.fournil@babi.ci', statut: 'present', avatar: 'assets/kouassi.png' },
                { nom: 'Koné', prenom: 'Adjoua Salimata', poste: 'Vendeuse & Accueil', telephone: '+225 01 02 03 04 05', email: 'salimata.accueil@babi.ci', statut: 'present', avatar: 'assets/aicha.png' }
            ];

            for (const emp of defaultEmployees) {
                await db.run(
                    "INSERT INTO employees (nom, prenom, poste, telephone, email, statut_presence, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [emp.nom, emp.prenom, emp.poste, emp.telephone, emp.email, emp.statut, emp.avatar]
                );
            }
            console.log("[DB] 6 Employés par défaut initialisés avec succès.");
        }
    } catch (empErr) {
        console.warn("[DB] Employees seed notice:", empErr.message);
    }

    // Auto-seed des produits si la table est vide (avec protection anti-résurrection)
    try {
        const prodCount = await db.get("SELECT COUNT(*) as count FROM products");
        if (!prodCount || prodCount.count === 0) {
            const jsonPath = path.resolve(__dirname, 'data', 'products.json');
            if (fs.existsSync(jsonPath)) {
                const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                if (Array.isArray(list) && list.length > 0) {
                    let deletedRows = [];
                    try {
                        deletedRows = await db.all("SELECT id FROM deleted_products");
                    } catch (_) {}
                    const deletedSet = new Set((deletedRows || []).map(r => String(r.id)));

                    let batchSql = [];
                    list.forEach((p, idx) => {
                        const id = p.id || (idx + 1);
                        if (deletedSet.has(String(id))) return; // Ne jamais réinsérer un produit supprimé

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
                    if (batchSql.length > 0) {
                        await db.exec(batchSql.join('\n'));
                        console.log(`[DB] Auto-seed : ${batchSql.length / 2} produits initialisés avec succès.`);
                    }
                }
            }
        }
    } catch (seedErr) {
        console.warn("[DB] Product auto-seed notice:", seedErr.message);
    }

    // Auto-seed Categories if empty
    try {
        const catCount = await db.get("SELECT COUNT(*) as count FROM categories");
        if (!catCount || catCount.count === 0) {
            const defaultCats = [
                { slug: 'pain', nom: 'Pains', icone: '🥖', ordre: 1 },
                { slug: 'pains_speciaux', nom: 'Pains Spéciaux', icone: '🌾', ordre: 2 },
                { slug: 'viennoiserie', nom: 'Viennoiseries', icone: '🥐', ordre: 3 },
                { slug: 'patisserie', nom: 'Pâtisseries', icone: '🍰', ordre: 4 },
                { slug: 'boisson', nom: 'Boissons', icone: '🧃', ordre: 5 },
                { slug: 'sale', nom: 'Salés & Traiteur', icone: '🥪', ordre: 6 },
                { slug: 'snack', nom: 'Biscuits & Snacks', icone: '🍪', ordre: 7 },
                { slug: 'autre', nom: 'Autres Gourmandises', icone: '✨', ordre: 8 }
            ];
            for (const c of defaultCats) {
                await db.run(
                    "INSERT OR IGNORE INTO categories (slug, nom, icone, ordre, is_active) VALUES (?, ?, ?, ?, 1)",
                    [c.slug, c.nom, c.icone, c.ordre]
                );
            }
            console.log("[DB] Catégories par défaut initialisées avec succès.");
        }
    } catch (cErr) {
        console.warn("[DB] Categories auto-seed notice:", cErr.message);
    }

    cachedDbInstance = db;
    isDbSchemaReady = true;
    return db;
}

module.exports = { initDB };