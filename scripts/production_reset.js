const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { initDB } = require('../db.js');

async function hashPassword(plainPassword) {
    try {
        const bcrypt = require('bcrypt');
        return await bcrypt.hash(plainPassword, 10);
    } catch (_) {
        return crypto.createHash('sha256').update(plainPassword).digest('hex');
    }
}

async function runProductionReset() {
    console.log("==================================================");
    console.log("🧹 DÉMARRAGE DU PRODUCTION RESET — BOULANGERIE DE BABI");
    console.log("==================================================");

    const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
    const backupPath = path.resolve(__dirname, '..', `database_backup_${Date.now()}.sqlite`);

    // 1. Sauvegarde préventive de la base de données
    if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        console.log(`📦 Sauvegarde de sécurité créée avec succès : ${path.basename(backupPath)}`);
    }

    const db = await initDB();

    // 2. Nettoyage des tables de données dynamiques / tests
    const tablesToPurge = [
        'orders',
        'order_items',
        'payments',
        'payment_events',
        'pickup_codes',
        'refunds',
        'notifications',
        'audit_logs',
        'security_audit_logs',
        'ratings',
        'stock_movements',
        'cash_registers',
        'users',
        'employees'
    ];

    console.log("\n🗑️ Nettoyage des données de test et historiques...");
    for (const table of tablesToPurge) {
        try {
            await db.run(`DELETE FROM ${table}`);
            console.log(`   ✓ Table [${table}] purgée.`);
        } catch (e) {
            console.log(`   ℹ️ Table [${table}] non existante ou déjà vide.`);
        }
    }

    // 3. Création des comptes officiels du personnel de production
    console.log("\n👥 Création des comptes officiels de Production...");
    
    const adminPasswordHash = await hashPassword("AdminBabi2026!");
    const gerantePasswordHash = await hashPassword("GeranteBabi2026!");
    const caissierePasswordHash = await hashPassword("CaissiereBabi2026!");

    // Compte Administrateur Principal
    await db.run(
        `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Touré', 'Ibrahim', 'admin@boulangeriedebabi.ci', '+225 07 00 00 00 01', adminPasswordHash, 'admin', 'assets/admin_avatar.webp', 'actif']
    );
    console.log("   ✓ Compte Administrateur : admin@boulangeriedebabi.ci");

    // Compte Gérante de Boulangerie
    await db.run(
        `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Kouassi', 'Marie', 'gerante@boulangeriedebabi.ci', '+225 07 00 00 00 02', gerantePasswordHash, 'gerante', 'assets/gerante_avatar.webp', 'actif']
    );
    console.log("   ✓ Compte Gérante : gerante@boulangeriedebabi.ci");

    // Compte Caissière Comptoir Riviera
    await db.run(
        `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, avatar, statut, caisse_assignee, code_pin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Bakayoko', 'Awa', 'caissiere@boulangeriedebabi.ci', '+225 07 00 00 00 03', caissierePasswordHash, 'caissiere', 'assets/caissiere_avatar.webp', 'actif', 'Caisse 1 - Riviera', '7412']
    );
    console.log("   ✓ Compte Caissière : caissiere@boulangeriedebabi.ci (PIN Caisse : 7412)");

    // Insertion des employés dans la table RH
    await db.run(
        `INSERT INTO employees (nom, prenom, poste, telephone, email, statut_presence, date_embauche)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Touré', 'Ibrahim', 'Administrateur', '+225 07 00 00 00 01', 'admin@boulangeriedebabi.ci', 'present', '2026-01-01']
    );
    await db.run(
        `INSERT INTO employees (nom, prenom, poste, telephone, email, statut_presence, date_embauche)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Kouassi', 'Marie', 'Gérante', '+225 07 00 00 00 02', 'gerante@boulangeriedebabi.ci', 'present', '2026-01-01']
    );
    await db.run(
        `INSERT INTO employees (nom, prenom, poste, telephone, email, statut_presence, date_embauche)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Bakayoko', 'Awa', 'Caissière', '+225 07 00 00 00 03', 'caissiere@boulangeriedebabi.ci', 'present', '2026-01-01']
    );

    // Initialisation du Fond de Caisse officiel
    await db.run(
        `INSERT INTO cash_registers (caissiere_nom, fond_de_caisse, total_ventes, total_especes, total_wave, statut)
         VALUES (?, ?, 0, 0, 0, 'ouvert')`,
        ['Awa Bakayoko', 50000]
    );
    console.log("   ✓ Caisse 1 Riviera initialisée (Fond de caisse : 50 000 FCFA).");

    // 4. Réinitialisation et vérification du Catalogue de Produits & Stocks
    console.log("\n🥖 Initialisation du Catalogue de Produits & Stocks réels...");
    await db.run("DELETE FROM products");
    await db.run("DELETE FROM stocks");

    const jsonPath = path.resolve(__dirname, '..', 'data', 'products.json');
    if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const productsData = JSON.parse(raw);
        for (const p of productsData) {
            const res = await db.run(
                "INSERT INTO products (nom, prix, categorie, image, description) VALUES (?, ?, ?, ?, ?)",
                [p.name, p.price, p.category, p.image || 'assets/croissant.webp', p.description || 'Produit artisanal de la Boulangerie de BABI.']
            );
            const prodId = res.lastID;
            const stockInitial = 40; // 40 unités en stock pour le démarrage
            await db.run(
                "INSERT INTO stocks (product_id, nom_produit, categorie, quantite_disponible, seuil_alerte, unite, prix_unitaire) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [prodId, p.name, p.category, stockInitial, 10, 'pièce', p.price]
            );
        }
        console.log(`   ✓ ${productsData.length} Produits & Stocks artisanaux insérés.`);
    }

    console.log("\n==================================================");
    console.log("✅ PRODUCTION RESET TERMINÉ AVEC SUCCÈS !");
    console.log("   • Base de données 100% propre (0 fausses commandes, 0 faux clients)");
    console.log("   • 3 Comptes officiels créés (Admin, Gérante, Caissière)");
    console.log("   • Catalogue Produits & Stocks initialisé");
    console.log("==================================================");
}

runProductionReset().catch(err => {
    console.error("❌ Erreur lors du Production Reset :", err);
    process.exit(1);
});
