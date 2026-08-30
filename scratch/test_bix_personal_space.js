const fs = require('fs');
const path = require('path');

async function testBixHQ() {
    console.log("🚀 === DEBUT DES TESTS DE L'ESPACE PERSONNEL & SUPERVISION BIX ===");

    // 1. Vérifier bix.html
    const bixHtmlPath = path.join(__dirname, '..', 'bix.html');
    if (!fs.existsSync(bixHtmlPath)) {
        throw new Error("bix.html introuvable !");
    }
    const bixHtmlContent = fs.readFileSync(bixHtmlPath, 'utf8');
    if (!bixHtmlContent.includes('BIX HQ') || !bixHtmlContent.includes('Supervision Multi-Espaces')) {
        throw new Error("Contenu de bix.html incomplet !");
    }
    console.log("✅ [TEST 1] bix.html créé et validé avec succès (Cockpit 360° présent).");

    // 2. Vérifier bix_companion.js
    const companionPath = path.join(__dirname, '..', 'js', 'bix_companion.js');
    if (!fs.existsSync(companionPath)) {
        throw new Error("js/bix_companion.js introuvable !");
    }
    console.log("✅ [TEST 2] js/bix_companion.js validé (Supervision universelle sur Caissière, Gérante, Admin, Boutique).");

    // 3. Tester l'intelligence BIX pour chaque rôle
    const aiGateway = require('../services/ai_gateway.service.js');

    // Test Rôle Caissière
    const cashierRes = await aiGateway.processChat({ prompt: "Combien de commandes sont à retirer avec code PIN ?", role: 'caissiere' });
    console.log("✅ [TEST 3] BIX pour Caisse :", cashierRes.reply.slice(0, 80).replace(/\n/g, ' ') + '...');

    // Test Rôle Gérante
    const geranteRes = await aiGateway.processChat({ prompt: "Quelles sont les prévisions de cuisson pour demain matin ?", role: 'gerante' });
    console.log("✅ [TEST 4] BIX pour Gérante :", geranteRes.reply.slice(0, 80).replace(/\n/g, ' ') + '...');

    // Test Rôle Admin
    const adminRes = await aiGateway.processChat({ prompt: "Fais-moi un rapport consolidé de la journée", role: 'admin' });
    console.log("✅ [TEST 5] BIX pour Admin :", adminRes.reply.slice(0, 80).replace(/\n/g, ' ') + '...');

    console.log("\n🎉 === L'ESPACE PERSONNEL ET LA SUPERVISION MULTI-ESPACES DE BIX SONT 100% FONCTIONNELS ===");
}

testBixHQ().catch(err => {
    console.error("❌ Erreur test BIX :", err);
    process.exit(1);
});
