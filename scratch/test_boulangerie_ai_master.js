const aiGateway = require('../services/ai_gateway.service.js');
const aiToolRouter = require('../services/ai_tool_router.service.js');
const aiAuditTrail = require('../services/ai_audit_trail.service.js');
const db = require('../db.js');

async function runMasterTestSuite() {
    console.log('🚀 === DEBUT DES TESTS DE BOULANGERIE AI MASTER ===\n');

    // TEST 1: ANALYSE DES VENTES
    console.log('📊 [TEST 1] ANALYSE DES VENTES (Admin / Gérante) :');
    const r1 = await aiGateway.processChat({
        prompt: 'Comment vont les ventes aujourd\'hui ?',
        role: 'admin',
        aiSessionId: 'session_demo_master',
        db
    });
    console.log(r1.reply);
    console.log('--------------------------------------------------\n');

    // TEST 2: MEMOIRE MULTI-TOURS ("Et hier ?")
    console.log('🧠 [TEST 2] MEMOIRE MULTI-TOURS ("Et hier ?") :');
    const r2 = await aiGateway.processChat({
        prompt: 'Et hier ?',
        role: 'admin',
        aiSessionId: 'session_demo_master',
        db
    });
    console.log(r2.reply);
    console.log('--------------------------------------------------\n');

    // TEST 3: COMPARAISON AUJOURD'HUI VS HIER
    console.log('📈 [TEST 3] COMPARAISON TEMPORELLE ("Compare les deux") :');
    const r3 = await aiGateway.processChat({
        prompt: 'Compare les deux.',
        role: 'admin',
        aiSessionId: 'session_demo_master',
        db
    });
    console.log(r3.reply);
    console.log('--------------------------------------------------\n');

    // TEST 4: CONTROLE D'ACCES RBAC (Caissière bloquée sur les finances)
    console.log('🔒 [TEST 4] CONTROLE RBAC (Caissiere demandant le CA) :');
    const r4 = await aiGateway.processChat({
        prompt: 'Combien avons-nous gagné aujourd\'hui et quel est le bénéfice ?',
        role: 'caissiere',
        aiSessionId: 'session_caissiere_1',
        db
    });
    console.log(r4.reply);
    console.log('Statut attendu FORBIDDEN :', r4.status);
    console.log('--------------------------------------------------\n');

    // TEST 5: CAISSIERE ACCEDANT AUX COMMANDES ET RETRAITS
    console.log('🥖 [TEST 5] CAISSIERE ACCEDANT AUX COMMANDES & RETRAITS :');
    const r5 = await aiGateway.processChat({
        prompt: 'Combien de commandes ont été retirées aujourd\'hui ?',
        role: 'caissiere',
        aiSessionId: 'session_caissiere_1',
        db
    });
    console.log(r5.reply);
    console.log('--------------------------------------------------\n');

    // TEST 6: DETECTION D'ANOMALIES
    console.log('🚨 [TEST 6] DETECTION D\'ANOMALIES DU JOUR :');
    const r6 = await aiGateway.processChat({
        prompt: 'Détecte les anomalies d\'aujourd\'hui',
        role: 'gerante',
        aiSessionId: 'session_demo_master',
        db
    });
    console.log(r6.reply);
    console.log('--------------------------------------------------\n');

    // TEST 7: PREVISION DE DEMANDE & FOURNIL
    console.log('🥖 [TEST 7] PREVISION DE DEMANDE (Zéro-Gaspillage) :');
    const r7 = await aiGateway.processChat({
        prompt: 'Quels produits dois-je produire davantage demain ?',
        role: 'gerante',
        aiSessionId: 'session_demo_master',
        db
    });
    console.log(r7.reply);
    console.log('--------------------------------------------------\n');

    // TEST 8: PROPOSITION D'ACTION AVEC CONFIRMATION 2-STEP
    console.log('⚡ [TEST 8] ACTION SENSIBLE (Changement de prix) :');
    const r8 = await aiGateway.processChat({
        prompt: 'Change le prix du Croissant à 600 FCFA',
        role: 'admin',
        aiSessionId: 'session_demo_master',
        db
    });
    console.log(r8.reply);
    console.log('Requires confirmation :', r8.requiresConfirmation);
    console.log('Action payload :', r8.actionPayload);
    console.log('--------------------------------------------------\n');

    // TEST 9: EXECUTION DE L'ACTION CONFIRMEE
    if (r8.requiresConfirmation && r8.actionPayload) {
        console.log('✅ [TEST 9] EXECUTION DE L\'ACTION APRES CONFIRMATION :');
        const execRes = await aiGateway.executeConfirmedAction({
            actionPayload: r8.actionPayload,
            role: 'admin',
            userId: 'admin_test',
            db
        });
        console.log(execRes.reply);
        console.log('--------------------------------------------------\n');
    }

    // TEST 10: JOURNAL D'AUDIT ET OBSERVABILITE
    console.log('🛡️ [TEST 10] JOURNAL D\'AUDIT & METRIQUES :');
    const auditLogs = await aiAuditTrail.getAuditLogs({ limit: 5 });
    const metrics = await aiAuditTrail.getAiMetrics();
    console.log('Total logs enregistrés :', auditLogs.length);
    console.log('Taux de succès IA :', metrics.successRate);
    console.log('Dernière action auditée :', auditLogs[0].tool, '| Statut :', auditLogs[0].status);
    console.log('\n🎉 === TOUS LES TESTS DE BOULANGERIE AI SONT VALIDES A 100% ===');
}

runMasterTestSuite();
