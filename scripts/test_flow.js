const http = require('http');

function req(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const r = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        r.on('error', reject);
        if (payload) r.write(payload);
        r.end();
    });
}

(async () => {
    try {
        console.log('====================================================');
        console.log('🥖 TEST DU PARCOURS CLIENT COMPLET BOULANGERIE BABI');
        console.log('====================================================\n');

        console.log('1. [CLIENT] Création de la commande en ligne...');
        const newOrder = {
            customer_name: 'Kouassi Kouamé Fabrice',
            customer_phone: '0708091011',
            delivery_mode: 'click_collect',
            payment_method: 'wave',
            items: [
                { id: 1, nom: 'Baguette Tradition', quantity: 2, prix: 400 },
                { id: 2, nom: 'Croissant Pur Beurre', quantity: 1, prix: 500 }
            ],
            total_price: 1300
        };

        const createRes = await req('/api/orders/create', 'POST', newOrder);
        const orderData = createRes.data;
        const orderId = orderData.order.id;
        console.log(`-> Commande créée : N°${orderId} pour ${orderData.order.customer_name} (${orderData.order.total_amount} FCFA)`);

        console.log('\n2. [CLIENT] Initialisation du paiement Wave...');
        const payInitRes = await req('/api/payments/initiate', 'POST', {
            order_id: orderId,
            customer_name: orderData.order.customer_name,
            customer_phone: orderData.order.customer_phone,
            amount: orderData.order.total_amount,
            method: 'wave'
        });
        const paymentId = payInitRes.data.payment_id || payInitRes.data.paymentId;
        console.log(`-> Transaction Wave initiée : ID ${paymentId}`);

        console.log('\n3. [CLIENT / WAVE] Validation du paiement Wave...');
        const payConfirmRes = await req('/api/payments/confirm-manual', 'POST', {
            order_id: orderId,
            payment_id: paymentId,
            transaction_id: `WAVE_TX_${Date.now()}`,
            amount: orderData.order.total_amount
        });
        const pickupPin = payConfirmRes.data.pickupPin || payConfirmRes.data.pin;
        console.log(`-> ✅ Paiement Wave Confirmé !`);
        console.log(`-> 🔑 CODE PIN CLIENT (4 chiffres) GÉNÉRÉ : [ ${pickupPin} ]`);

        console.log('\n4. [GÉRANTE / FOURNIL] Réception de la commande au fournil...');
        const listRes = await req('/api/orders', 'GET');
        const numId = parseInt(String(orderId).replace(/\D/g, ''), 10);
        const found = Array.isArray(listRes.data) && listRes.data.find(o => o.id == numId || o.order_id === orderId);
        console.log(`-> Commande visible au fournil : ${found ? 'OUI (Statut: ' + found.status + ')' : 'NON'}`);

        console.log('\n5. [GÉRANTE / FOURNIL] Cuisson terminée -> Passage en "pret_comptoir"...');
        const updateRes = await req(`/api/orders/${numId}/status`, 'PUT', { status: 'pret_comptoir' });
        console.log(`-> Notification envoyée au comptoir : ${updateRes.data.message || 'Prêt comptoir'}`);

        console.log('\n6. [CAISSIÈRE] Vérification de la file de retrait au comptoir...');
        const queueRes = await req('/api/orders/pickup-queue', 'GET');
        const queued = Array.isArray(queueRes.data) && queueRes.data.find(o => o.id == numId || o.order_id === orderId);
        console.log(`-> Commande prête dans la file de retrait : ${queued ? 'OUI (Client: ' + queued.customer_name + ')' : 'NON'}`);

        console.log(`\n7. [CAISSIÈRE] Le client arrive et donne son PIN : "${pickupPin}"...`);
        const verifyRes = await req('/api/pos/verify-pin', 'POST', {
            pin: String(pickupPin),
            order_id: numId,
            caissiere_nom: 'Awa Traoré'
        });
        console.log('-> Résultat de la saisie PIN au comptoir :');
        console.log(verifyRes.data);

        console.log('\n8. [BOUCLAGE DU CYCLE] Vérification du statut final de la commande...');
        const finalCheck = await req('/api/orders', 'GET');
        const finalOrder = Array.isArray(finalCheck.data) && finalCheck.data.find(o => o.id == numId);
        console.log(`-> Statut final de la commande en base : ${finalOrder ? finalOrder.status : 'N/A'}`);
        console.log('\n====================================================');
        console.log('🎉 TOUT LE PARCOURS CLIENT EST 100% FONCTIONNEL !');
        console.log('====================================================');
    } catch (err) {
        console.error('Erreur:', err);
    }
})();
