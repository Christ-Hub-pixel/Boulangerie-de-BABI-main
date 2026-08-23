const wavePayoutService = require('../services/wave_payout.service.js');

async function testWavePayoutSuite() {
    console.log("🧪 Démarrage des Tests Unitaires Wave Payout API v1...");

    // Test 1: Phone Formatting
    const p1 = wavePayoutService.formatE164Phone("0704389201");
    const p2 = wavePayoutService.formatE164Phone("+2250704389201");
    const p3 = wavePayoutService.formatE164Phone("2250704389201");
    console.assert(p1 === "+2250704389201", `Phone 1 mismatch: ${p1}`);
    console.assert(p2 === "+2250704389201", `Phone 2 mismatch: ${p2}`);
    console.assert(p3 === "+2250704389201", `Phone 3 mismatch: ${p3}`);
    console.log("✅ 1. Formatage E.164 : Succès");

    // Test 2: Signature HMAC-SHA256
    wavePayoutService.signingSecret = "wave_sn_AKS_TEST_SECRET_KEY_123456789";
    const testBody = JSON.stringify({ amount: "1000", currency: "XOF" });
    const timestamp = Math.floor(Date.now() / 1000);
    const sigHeader = wavePayoutService.buildWaveSignatureHeader(testBody, timestamp);
    console.assert(sigHeader.startsWith(`t=${timestamp},v1=`), "Format de signature incorrect");
    const isSigValid = wavePayoutService.verifyIncomingSignature(sigHeader, testBody);
    console.assert(isSigValid === true, "La vérification de signature a échoué");
    console.log("✅ 2. Signature Cryptographique & Anti-Rejeu : Succès");

    // Test 3: Create Payout
    const payoutRes = await wavePayoutService.createPayout({
        mobile: "0704389201",
        receive_amount: 5000,
        name: "Client Test Wave",
        client_reference: "REF-TEST-001",
        payment_reason: "Remboursement commande BABI"
    });
    console.assert(payoutRes.success === true, "createPayout failed");
    console.assert(payoutRes.data.currency === "XOF", "Currency must be XOF");
    console.assert(payoutRes.data.receive_amount === "5000", "Amount mismatch");
    console.log("✅ 3. POST /v1/payout (Création paiement) : Succès ->", payoutRes.data.id);

    // Test 4: Get Payout
    const getRes = await wavePayoutService.getPayout(payoutRes.data.id);
    console.assert(getRes.success === true, "getPayout failed");
    console.log("✅ 4. GET /v1/payout/:id : Succès");

    // Test 5: Search Payouts
    const searchRes = await wavePayoutService.searchPayoutsByClientReference("REF-TEST-001");
    console.assert(searchRes.success === true, "searchPayouts failed");
    console.log("✅ 5. GET /v1/payouts/search : Succès");

    // Test 6: Create Batch Payout
    const batchRes = await wavePayoutService.createPayoutBatch([
        { mobile: "0704389201", receive_amount: 1000, name: "Destinataire Test 1" },
        { mobile: "0501020304", receive_amount: 2500, name: "Destinataire Test 2" }
    ]);
    console.assert(batchRes.success === true, "createPayoutBatch failed");
    console.log("✅ 6. POST /v1/payout-batch : Succès ->", batchRes.data.id);

    // Test 7: Get Batch
    const getBatchRes = await wavePayoutService.getPayoutBatch(batchRes.data.id);
    console.assert(getBatchRes.success === true, "getPayoutBatch failed");
    console.log("✅ 7. GET /v1/payout-batch/:id : Succès");

    // Test 8: Reverse Payout
    const revRes = await wavePayoutService.reversePayout(payoutRes.data.id);
    console.assert(revRes.success === true, "reversePayout failed");
    console.log("✅ 8. POST /v1/payout/:id/reverse (Annulation sous 3j) : Succès");

    // Test 9: Verify Recipient
    const verifyRes = await wavePayoutService.verifyRecipient({ mobile: "0704389201", name: "Client Test Wave", amount: 5000 });
    console.assert(verifyRes.success === true, "verifyRecipient failed");
    console.log("✅ 9. POST /v1/verify_recipient/ : Succès");

    console.log("🎉 TOUS LES TESTS WAVE PAYOUT SONT VALIDÉS À 100% !");
}

testWavePayoutSuite().catch(console.error);
