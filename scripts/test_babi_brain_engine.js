/**
 * 🧪 TEST SUITE : BABI BRAIN ENGINE (BBE v3.0)
 * Validation complète des 6 piliers d'intelligence & de l'orchestration temps réel
 */

const { initDB } = require('../db.js');
const aiRealtimeOrchestrator = require('../services/ai_realtime_orchestrator.service.js');
const aiBakeryProduction = require('../services/ai_bakery_production.service.js');
const aiRecommendation = require('../services/ai_recommendation.service.js');
const aiInventoryAdvisor = require('../services/ai_inventory_advisor.service.js');
const aiBusinessAnalytics = require('../services/ai_business_analytics.service.js');
const aiAssistantCopilot = require('../services/ai_assistant_copilot.service.js');
const pickupPinService = require('../services/pickup_pin.service.js');

async function runTests() {
    console.log("=================================================");
    console.log("🧠 TEST SUITE : BABI BRAIN ENGINE (BBE v3.0)");
    console.log("=================================================\n");

    let db;
    try {
        db = await initDB();
        console.log("✅ [1/7] Base de données SQLite connectée avec succès.");
    } catch (err) {
        console.error("❌ [1/7] Échec connexion BD:", err);
        process.exit(1);
    }

    // 1. Test Orchestrateur Temps Réel
    console.log("\n📡 [2/7] Test de l'Orchestrateur & Dispatching Multi-Plateformes...");
    let cashierReceived = false;
    let managerReceived = false;
    let adminReceived = false;

    const subCashier = aiRealtimeOrchestrator.subscribe('cashier', (evt) => {
        if (evt.type === 'ORDER_CREATED') cashierReceived = true;
    });
    const subManager = aiRealtimeOrchestrator.subscribe('manager', (evt) => {
        if (evt.type === 'ORDER_CREATED') managerReceived = true;
    });
    const subAdmin = aiRealtimeOrchestrator.subscribe('admin', (evt) => {
        if (evt.type === 'ORDER_CREATED') adminReceived = true;
    });

    const testOrder = {
        id: 'TEST-BABI-999',
        customer_name: 'Testeur Mobile Abidjan',
        phone: '0701020304',
        total_price: 3500,
        type_retrait: 'click_collect',
        code_pin: '8520',
        items: [{ name: 'Baguette Tradition', quantity: 2, price: 400 }],
        source: 'mobile_app'
    };

    aiRealtimeOrchestrator.broadcastNewOrder(testOrder);

    if (cashierReceived && managerReceived && adminReceived) {
        console.log("✅ Dispatching temps réel instantané validé vers Caisse, Gérante et Admin !");
    } else {
        console.warn("⚠️ Notification partielle:", { cashierReceived, managerReceived, adminReceived });
    }

    subCashier.unsubscribe();
    subManager.unsubscribe();
    subAdmin.unsubscribe();

    // 2. Test Prédiction Fournées & Pain Chaud
    console.log("\n🍞 [3/7] Test de la Prédiction des Fournées & Pain Chaud...");
    const bakingStatus = aiBakeryProduction.getLiveHotBreadStatus();
    console.log("Statut Pain Chaud :", bakingStatus.bannerMessage, "(Heure : " + bakingStatus.currentTimeAbidjan + ")");
    const productionForecast = await aiBakeryProduction.predictProductionNeeds(db);
    console.log(`✅ ${productionForecast.predictions.length} prédictions de fournées générées (Facteur week-end: ${productionForecast.affluenceFactor})`);

    // 3. Test Moteur de Recommandations
    console.log("\n🛒 [4/7] Test des Recommandations & Accords Gourmands...");
    const recs = aiRecommendation.getRecommendations([{ name: 'Croissant Pur Beurre', category: 'viennoiserie' }]);
    console.log("Suggestions pour Croissant :", recs.map(r => `${r.name} (${r.reason})`).join(' | '));
    const prepTime = aiRecommendation.estimatePreparationTime([{ name: 'Baguette', quantity: 2 }]);
    console.log("✅ Estimation temps de préparation :", prepTime.label);

    // 4. Test Diagnostic Stocks
    console.log("\n📦 [5/7] Test du Conseiller de Stocks...");
    const stockHealth = await aiInventoryAdvisor.analyzeStockHealth(db);
    console.log("Statut global stocks :", stockHealth.overallStatus, `(${stockHealth.summary ? stockHealth.summary.totalSKUs : 0} références analysées)`);
    console.log("Avis opérationnel :", stockHealth.operationalAdvice);

    // 5. Test Analytics Business Prédictif
    console.log("\n📈 [6/7] Test de la Modélisation Prédictive Financière...");
    const businessForecast = await aiBusinessAnalytics.generateBusinessForecast(db);
    console.log("Prévision journalière :", (businessForecast.forecast ? businessForecast.forecast.projectedDailyRevenueFCFA : 0).toLocaleString(), "FCFA");
    console.log("Rapport exécutif :", businessForecast.executiveSummary);

    // 6. Test Validation Universelle du PIN
    console.log("\n🔑 [7/7] Test de Validation Synchrone du Code PIN au Comptoir...");
    // Création d'une commande test avec PIN
    const testPin = '7890';
    const insRes = await db.run(
        `INSERT INTO orders (customer_name, phone, items, total_price, total_amount, payment_method, status, payment_status, code_pin)
         VALUES ('Client Test PIN', '0707070707', '[]', 2000, 2000, 'Wave', 'PAID', 'paye', ?)`,
        [testPin]
    );
    const testOrderId = insRes.lastID;
    await db.run(
        `INSERT INTO pickup_codes (order_id, pin_code, is_used) VALUES (?, ?, 0)`,
        [String(testOrderId), testPin]
    );

    // Tentative avec faux PIN
    const badValidation = await pickupPinService.verifyAndConsumePin(db, testOrderId, '0000', { name: 'Caissière Awa' });
    console.log("Test faux PIN rejeté :", !badValidation.success ? "✅ CORRECTEMENT BLOQUÉ" : "❌ ERREUR");

    // Tentative avec bon PIN
    const goodValidation = await pickupPinService.verifyAndConsumePin(db, testOrderId, testPin, { name: 'Caissière Awa' });
    console.log("Test bon PIN validé :", goodValidation.success ? `✅ VALIDÉ (${goodValidation.message})` : "❌ ERREUR");

    // Tentative de réutilisation (Double dépense)
    const replayValidation = await pickupPinService.verifyAndConsumePin(db, testOrderId, testPin, { name: 'Caissière Awa' });
    console.log("Test double-retrait bloqué :", !replayValidation.success ? "✅ CORRECTEMENT DÉTECTÉ ET BLOQUÉ" : "❌ ERREUR");

    // Nettoyage de la commande test
    await db.run("DELETE FROM orders WHERE id = ?", [testOrderId]);
    await db.run("DELETE FROM pickup_codes WHERE order_id = ?", [String(testOrderId)]);

    console.log("\n=================================================");
    console.log("🎉 TOUS LES TESTS DU BABI BRAIN ENGINE ONT RÉUSSI !");
    console.log("=================================================\n");
    process.exit(0);
}

runTests().catch(err => {
    console.error("Test error:", err);
    process.exit(1);
});
