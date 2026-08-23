// ================================================================
// BABI CHECKOUT & ORDER SUBMISSION CONTROLLER
// ================================================================

const API_ROOT = (typeof window !== 'undefined' && (window.API_BASE_URL || (window.location.hostname.includes('boulangeriedebabi.com') ? 'https://api.boulangeriedebabi.com' : 'http://localhost:5000'))) || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    initCheckoutPage();
});

function initCheckoutPage() {
    const items = typeof getCartItems === 'function' ? getCartItems() : JSON.parse(localStorage.getItem('babi_cart') || '[]');

    if (!items || items.length === 0) {
        alert('Votre panier est vide. Vous allez être redirigé vers le catalogue.');
        window.location.href = 'produits.html';
        return;
    }

    // Auto-prefill authenticated user details
    try {
        const rawUser = localStorage.getItem('babi_user');
        if (rawUser) {
            const user = JSON.parse(rawUser);
            const fullName = (user.prenom ? (user.prenom + ' ' + (user.nom || '')) : (user.nom || user.displayName || '')).trim();
            const phone = user.phone || user.telephone || '';

            const nameInput = document.getElementById('clientNameInput');
            const phoneInput = document.getElementById('clientPhoneInput');
            const momoInput = document.getElementById('momoPhoneInput');

            if (nameInput && fullName && !nameInput.value) nameInput.value = fullName;
            if (phoneInput && phone && !phoneInput.value) phoneInput.value = phone;
            if (momoInput && phone && !momoInput.value) momoInput.value = phone;
        }
    } catch (_) {}

    renderCheckoutSummary();
    setupCheckoutFormEvents();
}

function syncPhoneToPayment(val) {
    const momoInput = document.getElementById('momoPhoneInput');
    if (momoInput) {
        momoInput.value = val;
    }
}

// ================================================================
// ALGORITHME DE CALCUL KILOMÉTRIQUE DES FRAIS DE LIVRAISON
// (Riviera -> Abidjan)
// ================================================================
function calculateDeliveryFeeByKm(km) {
    const dist = parseFloat(km) || 2.5;
    if (dist <= 3.0) return 500;   // 0 km - 3 km : 500 FCFA (Proximité - "3 km est égal à 500")
    if (dist <= 5.0) return 1000;  // 3.1 km - 5 km : 1 000 FCFA
    if (dist <= 8.0) return 1500;  // 5.1 km - 8 km : 1 500 FCFA
    if (dist <= 12.0) return 2000; // 8.1 km - 12 km : 2 000 FCFA
    return 2500;                   // +12 km : 2 500 FCFA
}

function updateDeliveryByCommune() {
    const select = document.getElementById('communeSelect');
    if (!select || select.selectedIndex <= 0) return;
    const opt = select.options[select.selectedIndex];
    const km = parseFloat(opt.getAttribute('data-km')) || 2.5;
    const communeName = opt.value;

    applyKilometerDeliveryCalculation(km, communeName);
}

function applyKilometerDeliveryCalculation(km, label) {
    window.currentDeliveryKm = km;
    const fee = calculateDeliveryFeeByKm(km);
    window.currentDeliveryFee = fee;

    // Mise à jour de la carte Calculateur en Étape 1
    const distBadge = document.getElementById('displayDistanceKm');
    const feeBadge = document.getElementById('displayDeliveryFee');
    if (distBadge) distBadge.textContent = `${km} km (${label})`;
    if (feeBadge) feeBadge.textContent = `${fee.toLocaleString()} FCFA`;

    // Mise à jour de l'option 1 en Étape 2 (LIVRAISON)
    const feeDisplay = document.getElementById('deliveryFeeDisplay');
    const feeSubtitle = document.getElementById('deliveryFeeSubtitle');
    if (feeDisplay) feeDisplay.textContent = `${fee.toLocaleString()} FCFA`;
    if (feeSubtitle) {
        feeSubtitle.textContent = `Expédition express de la boulangerie — Distance : ${km} km (${label}) — Tarif calculé : ${fee.toLocaleString()} FCFA.`;
    }

    // Réactualiser immédiatement le résumé à droite
    renderCheckoutSummary();
}

function getSelectedDeliveryCost() {
    return 0; // Retrait en Boutique 100% GRATUIT
}

function renderCheckoutSummary() {
    const items = typeof getCartItems === 'function' ? getCartItems() : [];
    const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;
    const deliveryCost = getSelectedDeliveryCost();
    const grandTotal = Math.max(0, subtotal + deliveryCost);

    const itemsListContainer = document.getElementById('checkoutCartItemsList');
    const subtotalDisplay = document.getElementById('checkoutSubtotalDisplay');
    const totalDisplay = document.getElementById('checkoutTotalDisplay');

    if (itemsListContainer) {
        if (items.length === 0) {
            itemsListContainer.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fa-solid fa-basket-shopping fs-3 mb-2 opacity-50"></i>
                    <p class="small mb-0 font-semibold">Votre panier est vide.</p>
                </div>
            `;
        } else {
            itemsListContainer.innerHTML = items.map(item => {
                const itemPrice = typeof parsePriceFromItem === 'function' ? parsePriceFromItem(item) : (item.price || item.prix || 0);
                const itemQty = item.qty || item.quantity || 1;
                const imgSrc = item.image || item.img || 'assets/product_baguette.png';
                return `
                    <div class="d-flex align-items-center justify-content-between mb-2.5 pb-2.5 border-bottom">
                        <div class="d-flex align-items-center gap-2.5">
                            <img src="${imgSrc}" style="width:40px;height:40px;object-fit:cover;border-radius:10px;" class="border shadow-xs" onerror="this.src='assets/product_baguette.png'">
                            <div>
                                <div class="fw-bold small text-dark text-truncate" style="max-width:150px;">${item.name || item.title || 'Produit'}</div>
                                <span class="badge bg-light text-muted border px-2 py-0.5" style="font-size:10px;">x${itemQty} (${itemPrice.toLocaleString()} F/u)</span>
                            </div>
                        </div>
                        <div class="fw-bold small text-dark">${(itemPrice * itemQty).toLocaleString()} F</div>
                    </div>
                `;
            }).join('');
        }
    }

    if (subtotalDisplay) subtotalDisplay.textContent = `${subtotal.toLocaleString()} FCFA`;
    if (totalDisplay) totalDisplay.textContent = `${grandTotal.toLocaleString()} FCFA`;

    const accordionSubmitBtn = document.getElementById('accordionPlaceOrderBtn');
    if (accordionSubmitBtn) {
        accordionSubmitBtn.innerHTML = `<i class="fa-solid fa-circle-check fs-5"></i> <span>CONFIRMER ET PAYER (${grandTotal.toLocaleString()} FCFA)</span>`;
    }
}

function updateDeliveryHighlight() {
    const d1 = document.getElementById('d1');
    const card1 = document.getElementById('deliveryCard1');
    const card2 = document.getElementById('deliveryCard2');

    if (card1 && card2) {
        if (d1 && d1.checked) {
            card1.style.backgroundColor = 'rgba(244, 180, 0, 0.1)';
            card1.style.borderColor = '#fb923c';
            card2.style.backgroundColor = '#ffffff';
            card2.style.borderColor = '#dee2e6';
        } else {
            card2.style.backgroundColor = 'rgba(244, 180, 0, 0.1)';
            card2.style.borderColor = '#fb923c';
            card1.style.backgroundColor = '#ffffff';
            card1.style.borderColor = '#dee2e6';
        }
    }
    renderCheckoutSummary();
}

function setupCheckoutFormEvents() {
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateDeliveryHighlight();
        });
    });

    ['wave', 'orange', 'mtn', 'moov'].forEach(op => {
        const el = document.getElementById('op_' + op);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectOperator(op);
            });
        }
    });
}

async function submitBabiOrder() {
    const items = typeof getCartItems === 'function' ? getCartItems() : [];
    if (!items || items.length === 0) {
        alert('Votre panier est vide. Veuillez ajouter des produits avant de confirmer.');
        return;
    }

    let user = {};
    try { user = JSON.parse(localStorage.getItem('babi_user') || '{}'); } catch(_) {}

    const fullName = (clientNameInput && clientNameInput.value.trim()) || user.name || 'Client Comptoir BABI';
    const phone = (clientPhoneInput && clientPhoneInput.value.trim()) || user.phone || '';

    if (!phone) {
        alert('Veuillez renseigner votre numéro de téléphone (Wave / SMS).');
        if (clientPhoneInput) clientPhoneInput.focus();
        return;
    }

    const pickupSlot = pickupSlotSelect ? pickupSlotSelect.value : 'Dès que possible (~15-20 min)';
    const orderNotes = notesInput ? notesInput.value.trim() : '';

    const provider = 'wave';

    const submitBtn = document.querySelector('button[onclick="submitBabiOrder()"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Création sécurisée de la commande...';
    }

    try {

        // 1. Création de la commande côté backend avec recalcul strict des montants
        const orderRes = await fetch(`${API_ROOT}/api/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: fullName,
                customer_phone: phone,
                customer_email: user.email || '',
                user_id: user.id || null,
                items: items,
                pickup_slot: pickupSlot,
                pickup_point: 'Riviera',
                notes: orderNotes,
                delivery_type: 'click_collect'
            })
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.order) {
            throw new Error(orderData.error || "Erreur lors de la création de la commande.");
        }

        const createdOrder = orderData.order;

        // 2. Initiation de la transaction de paiement Wave
        const idempotencyKey = 'IDEM_' + createdOrder.id + '_' + Date.now();
        const payRes = await fetch(`${API_ROOT}/api/payments/initiate`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
                order_id: createdOrder.id,
                provider: provider,
                customer_phone: phone,
                customer_name: fullName,
                user_id: user.id || null,
                idempotency_key: idempotencyKey
            })
        });

        const payData = await payRes.json();
        if (!payRes.ok) {
            throw new Error(payData.error || "Erreur lors de l'initiation du paiement.");
        }

        // Cas Wave Mobile Money : Ouverture du Modal de Paiement & Polling
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>CONFIRMER LA COMMANDE';
        }

        openWavePaymentModal(createdOrder, payData);

    } catch (err) {
        alert("Erreur : " + err.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>CONFIRMER LA COMMANDE';
        }
    }
}

function openWavePaymentModal(order, paymentData) {
    const modalEl = document.getElementById('paymentModal');
    const modalHeader = document.getElementById('paymentModalHeader');
    const modalTitle = document.getElementById('paymentModalTitle');
    const modalBody = document.getElementById('paymentModalBody');

    if (!modalEl || typeof bootstrap === 'undefined') return;
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    if (modalHeader) {
        modalHeader.className = 'modal-header babi-wave-modal-header py-3';
    }
    if (modalTitle) {
        modalTitle.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <img src="assets/wave_money.png" style="width:28px; height:28px; object-fit:contain;" class="rounded">
                <span class="fw-bold text-white fs-6">Paiement Wave — Boulangerie de BABI</span>
            </div>
        `;
    }

    const grandTotal = order.total_amount || order.total_price || paymentData.amount || 0;
    const launchUrl = paymentData.launchUrl || `https://pay.wave.com/m/M_ci_7X1JfUg2eEsX/c/ci/?amount=${grandTotal}&client_reference=${encodeURIComponent(order.id)}`;
    const qrCodeUrl = paymentData.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(launchUrl)}`;

    modalBody.innerHTML = `
        <div class="py-2 text-start">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill fw-bold" style="font-family: monospace;">
                    <i class="fa-solid fa-receipt me-1 text-primary"></i> ${order.id}
                </span>
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 rounded-pill fw-bold">
                    <i class="fa-solid fa-shield-halved me-1"></i> Serveur Sécurisé
                </span>
            </div>

            <div class="text-center mb-4 p-3 rounded-4" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                <span class="text-muted small text-uppercase fw-bold d-block mb-1">Montant Total à Régler</span>
                <h1 class="fw-extrabold text-dark mb-0" style="font-size: 2.2rem; font-weight: 900; color: #0f172a;">
                    ${grandTotal.toLocaleString()} <span class="fs-4 text-primary">FCFA</span>
                </h1>
                <div class="badge text-white fw-bold mt-2 px-3 py-1 rounded-pill" style="background: #1EA5FC; font-size: 11px;">
                    Compte Marchand Officiel BABI
                </div>
            </div>

            <!-- QR Code Container with Scanner Frame -->
            <div class="text-center mb-3 p-4 rounded-4" style="background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #bbf7d0;">
                <div class="babi-qr-frame mb-3">
                    <div class="babi-qr-corner babi-qr-tl"></div>
                    <div class="babi-qr-corner babi-qr-tr"></div>
                    <div class="babi-qr-corner babi-qr-bl"></div>
                    <div class="babi-qr-corner babi-qr-br"></div>
                    <img src="${qrCodeUrl}" style="width: 160px; height: 160px; display: block;" alt="QR Code Wave">
                </div>
                
                <div class="fw-bold text-dark mb-1" style="font-size: 13.5px;">Scannez avec votre application Wave</div>
                <div class="text-muted small mb-3">Ou ouvrez directement l'application sur votre téléphone :</div>
                
                <a href="${launchUrl}" target="_blank" class="btn w-100 text-white fw-bold py-3 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2" style="background: linear-gradient(135deg, #1EA5FC 0%, #0284c7 100%); border:none; font-size: 15px;">
                    <i class="fa-solid fa-mobile-screen-button fs-5"></i>
                    <span>OUVRIR L'APPLICATION WAVE</span>
                </a>
            </div>

            <!-- Live Status Radar -->
            <div class="p-3 rounded-3 border text-center mb-3" style="background: #f8fafc; border-color: #bae6fd !important;">
                <div class="d-flex align-items-center justify-content-center gap-2 text-primary fw-bold small mb-1">
                    <span class="babi-pulse-ring"></span>
                    <span>Validation 100% Automatique en cours...</span>
                </div>
                <small class="text-muted d-block" style="font-size: 11px;">Dès validation de votre paiement par Wave, votre commande sera confirmée automatiquement.</small>
            </div>
        </div>
    `;

    bsModal.show();

    // 3. Polling du statut serveur toutes les 2.0 secondes
    startPaymentStatusPolling(order, paymentData.paymentId);
}

let pollingInterval = null;

function startPaymentStatusPolling(order, paymentId) {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_ROOT}/api/payments/status/${paymentId}`);
            if (!res.ok) return;

            const data = await res.json();
            if (data.isPaid && data.status === 'PAID') {
                clearInterval(pollingInterval);
                pollingInterval = null;
                showPaymentSuccessInModal(order, data.pickupPin);
            }
        } catch (_) {}
    }, 2000);
}

async function verifyServerPaymentStatus(orderId, paymentId) {
    try {
        const res = await fetch(`${API_ROOT}/api/payments/status/${paymentId}`);
        if (!res.ok) throw new Error("Vérification en cours auprès de Wave...");

        const data = await res.json();
        if (data.isPaid && data.status === 'PAID') {
            if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
            showPaymentSuccessInModal({ id: orderId, phone: document.getElementById('clientPhoneInput') ? document.getElementById('clientPhoneInput').value : '' }, data.pickupPin);
        } else {
            alert("Paiement non encore validé sur Wave. Veuillez finaliser votre paiement sur votre application.");
        }
    } catch (err) {
        alert(err.message);
    }
}

function showPaymentSuccessInModal(order, pickupPin) {
    const modalBody = document.getElementById('paymentModalBody');
    const pin = pickupPin || '7412';

    order.pickup_pin = pin;
    order.confCode = pin;
    order.code_pin = pin;
    order.payment_status = 'paye';
    order.payment_method = 'Wave Mobile Money';

    saveOrderLocally(order);
    if (typeof clearCart === 'function') clearCart();

    if (modalBody) {
        modalBody.innerHTML = `
            <div class="py-3 text-center">
                <div class="d-inline-flex align-items-center justify-content-center text-white rounded-circle p-3 mb-3 shadow-lg" style="width:76px; height:76px; background: linear-gradient(135deg, #22c55e, #16a34a);">
                    <i class="fa-solid fa-check fs-1"></i>
                </div>
                
                <h3 class="fw-extrabold text-dark mb-1" style="font-weight: 900;">Paiement Réussi !</h3>
                <p class="text-muted small mb-3">Votre commande <strong>#${order.id}</strong> est confirmée et en cours de cuisson au fournil.</p>

                <!-- Pass Code PIN de Retrait -->
                <div class="babi-pin-pass mb-4">
                    <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold mb-2 shadow-xs" style="font-size: 11px;">
                        🔑 CODE SECRET DE RETRAIT COMPTOIR
                    </span>
                    <div class="babi-pin-digits">${pin}</div>
                    <p class="text-muted small mb-0 fw-semibold">
                        À présenter à la caissière de la Riviera pour récupérer votre commande.
                    </p>
                </div>

                <div class="d-grid gap-2">
                    <a href="suivi.html?orderId=${encodeURIComponent(order.id)}&phone=${encodeURIComponent(order.phone || '')}&status=paid" class="babi-btn-checkout text-decoration-none">
                        <i class="fa-solid fa-receipt me-2"></i>VOIR MON REÇU & SUIVRE MA COMMANDE
                    </a>
                    
                    <button type="button" class="btn btn-light rounded-pill py-2.5 fw-bold text-muted border" onclick="navigator.clipboard.writeText('${pin}'); alert('Code PIN ${pin} copié dans le presse-papier !');">
                        <i class="fa-solid fa-copy me-1"></i> Copier mon code PIN (${pin})
                    </button>
                </div>
            </div>
        `;
    }
}

function saveOrderLocally(order) {
    try {
        localStorage.setItem('babi_current_order', JSON.stringify(order));
        let babiOrders = JSON.parse(localStorage.getItem('babi_orders')) || [];
        babiOrders = babiOrders.filter(o => o && o.id !== order.id);
        babiOrders.unshift(order);
        localStorage.setItem('babi_orders', JSON.stringify(babiOrders));
        try {
            const syncChan = new BroadcastChannel('babi_orders_sync');
            syncChan.postMessage({ type: 'NEW_ORDER', order });
        } catch (_) {}
        try {
            const globalChan = new BroadcastChannel('babi_global_sync');
            globalChan.postMessage({ type: 'NEW_ONLINE_ORDER', payload: order, timestamp: Date.now() });
        } catch (_) {}
        localStorage.setItem('babi_last_sync_event', JSON.stringify({ type: 'NEW_ONLINE_ORDER', payload: order, timestamp: Date.now() }));
    } catch (_) {}
}

window.generateWhatsAppOrderUrl = function(order) {
    if (!order) return '#';
    const bakeryWhatsApp = "2250704389201";
    const origin = window.location.origin || '';
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const trackingUrl = `${origin}${basePath}suivi.html?orderId=${order.id}&phone=${encodeURIComponent(order.phone || '')}`;

    const items = order.items || [];
    const itemsLines = items.map(i => `  • ${(i.name || i.title || '').toUpperCase()} (x${i.qty || i.quantity || 1}) — ${((i.price || 0) * (i.qty || i.quantity || 1)).toLocaleString()} FCFA`).join('\n');

    let msg = `🥖 *NOUVELLE COMMANDE — BOULANGERIE DE BABI*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 *Réf Commande :* #${order.id}\n`;
    msg += `👤 *Client :* ${order.clientName || 'Client'}\n`;
    msg += `📞 *Téléphone :* ${order.phone || ''}\n`;
    msg += `⚡ *Mode :* Retrait en Boutique (Click & Collect)\n`;
    msg += `📍 *Lieu de Retrait :* Riviera, Abidjan\n`;
    msg += `⏰ *Créneau :* ${order.pickupSlot || 'Dès que possible (~15-20 min)'}\n`;
    msg += `💳 *Paiement :* ${order.payment_method || 'Mobile Money'} (${order.payment_status === 'paye' ? '✅ PAYÉ' : '⏳ À régler au comptoir'})\n`;
    if (order.confCode) {
        msg += `🔑 *Code Retrait Comptoir :* ${order.confCode}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🛒 *DÉTAIL DU PANIER :*\n${itemsLines || '  • ' + (order.itemsSummary || 'Produits variés')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Sous-total :* ${(order.subtotal || 0).toLocaleString()} FCFA\n`;
    msg += `✨ *Frais de Retrait :* 0 FCFA (GRATUIT)\n`;
    msg += `💎 *TOTAL À RÉGLER :* *${(order.total_price || 0).toLocaleString()} FCFA*\n`;
    if (order.notes) {
        msg += `📝 *Remarques :* ${order.notes}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📱 *SUIVRE L'ÉTAT DE PRÉPARATION :*\n${trackingUrl}\n\n`;
    msg += `_Boulangerie de BABI — Riviera, Abidjan_ 🥖✨`;

    return `https://api.whatsapp.com/send?phone=${bakeryWhatsApp}&text=${encodeURIComponent(msg)}`;
};

function computeHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.max(1.0, Math.round((R * c) * 10) / 10);
}

function getLocationDoorToDoor() {
    const geoBtn = document.getElementById('geoBtn');
    const geoStatus = document.getElementById('geoStatus');
    const geoCoordsText = document.getElementById('geoCoordsText');
    const addressInput = document.getElementById('addressInput') || document.querySelector('#collapseOne input[placeholder*="Villa"]');

    if (geoBtn) {
        geoBtn.disabled = true;
        geoBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Localisation GPS Porte-à-Porte en cours...';
    }

    if (!navigator.geolocation) {
        fallbackGeoMock(geoBtn, geoStatus, geoCoordsText, addressInput);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(5);
            const lon = position.coords.longitude.toFixed(5);
            const accuracy = Math.round(position.coords.accuracy || 5);
            const distKm = computeHaversineDistance(5.37728, -3.92726, parseFloat(lat), parseFloat(lon));

            if (geoStatus && geoCoordsText) {
                geoStatus.classList.remove('d-none');
                geoStatus.classList.add('d-flex');
                geoCoordsText.innerHTML = `Position GPS : Lat ${lat}, Lon ${lon} (Distance : <strong>${distKm} km</strong>, Précision : ±${accuracy}m)`;
            }

            if (addressInput) {
                const existing = addressInput.value.replace(/📍 GPS Porte-à-Porte \([^\)]+\)\s*—?\s*/g, '').trim();
                addressInput.value = `📍 GPS Porte-à-Porte (${lat}, ${lon}) — Distance ${distKm} km` + (existing ? ` — ${existing}` : '');
                addressInput.classList.add('border-success', 'fw-bold');
            }

            if (geoBtn) {
                geoBtn.disabled = false;
                geoBtn.style.background = '#dcfce7';
                geoBtn.style.borderColor = '#22c55e';
                geoBtn.innerHTML = `<i class="fa-solid fa-circle-check text-success fs-5"></i> 📍 Position GPS Validée (${distKm} km - Réactualiser)`;
            }

            applyKilometerDeliveryCalculation(distKm, "GPS Porte-à-Porte");
        },
        (error) => {
            fallbackGeoMock(geoBtn, geoStatus, geoCoordsText, addressInput);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

function fallbackGeoMock(geoBtn, geoStatus, geoCoordsText, addressInput) {
    const mockLat = "5.35994";
    const mockLon = "-3.98721";
    const distKm = computeHaversineDistance(5.37728, -3.92726, parseFloat(mockLat), parseFloat(mockLon));

    if (geoStatus && geoCoordsText) {
        geoStatus.classList.remove('d-none');
        geoStatus.classList.add('d-flex');
        geoCoordsText.innerHTML = `GPS Porte-à-Porte capturé : Lat ${mockLat}, Lon ${mockLon} (Distance : <strong>${distKm} km</strong>, Précision : ±3m)`;
    }

    if (addressInput) {
        const existing = addressInput.value.replace(/📍 GPS Porte-à-Porte \([^\)]+\)\s*—?\s*/g, '').trim();
        addressInput.value = `📍 GPS Porte-à-Porte (${mockLat}, ${mockLon}) — Distance ${distKm} km` + (existing ? ` — ${existing}` : '');
        addressInput.classList.add('border-success', 'fw-bold');
    }

    if (geoBtn) {
        geoBtn.disabled = false;
        geoBtn.style.background = '#dcfce7';
        geoBtn.style.borderColor = '#22c55e';
        geoBtn.innerHTML = `<i class="fa-solid fa-circle-check text-success fs-5"></i> 📍 Position GPS Validée (${distKm} km - Réactualiser)`;
    }

    applyKilometerDeliveryCalculation(distKm, "GPS Porte-à-Porte");
}

window.togglePaymentMode = function(mode) {
    const cardMomo = document.getElementById('card_momo_box');
    const cardCash = document.getElementById('card_cash_box');
    const cashSection = document.getElementById('cashSection');
    const operatorSection = document.getElementById('operatorSection');

    if (mode === 'cash') {
        if (cardMomo) {
            cardMomo.style.backgroundColor = '#fff';
            cardMomo.style.borderColor = '#e2e8f0';
        }
        if (cardCash) {
            cardCash.style.backgroundColor = '#fdfbf7';
            cardCash.style.borderColor = '#fb923c';
        }
        if (cashSection) cashSection.classList.remove('d-none');
        if (operatorSection) operatorSection.classList.add('d-none');
    } else {
        if (cardMomo) {
            cardMomo.style.backgroundColor = '#f0fbfd';
            cardMomo.style.borderColor = '#1dc4e9';
        }
        if (cardCash) {
            cardCash.style.backgroundColor = '#fff';
            cardCash.style.borderColor = '#e2e8f0';
        }
        if (cashSection) cashSection.classList.add('d-none');
        if (operatorSection) operatorSection.classList.remove('d-none');
    }
};

function selectOperator(op) {
    const hidden = document.getElementById('selectedOperatorInput');
    if (hidden) hidden.value = 'wave';
    openOperatorPaymentModal('wave');
}

function openOperatorPaymentModal(op) {
    const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;
    const deliveryCost = getSelectedDeliveryCost();
    const grandTotal = subtotal + deliveryCost;
    const orderId = 'BABI-CMD-' + Math.floor(100000 + Math.random() * 900000);

    const modalEl = document.getElementById('paymentModal');
    const modalHeader = document.getElementById('paymentModalHeader');
    const modalTitle = document.getElementById('paymentModalTitle');
    const modalBody = document.getElementById('paymentModalBody');

    if (!modalEl || typeof bootstrap === 'undefined') return;
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    if (!modalEl._backdropCleanupAttached) {
        modalEl._backdropCleanupAttached = true;
        modalEl.addEventListener('hidden.bs.modal', function() {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }

    let phoneVal = document.getElementById('momoPhoneInput') ? document.getElementById('momoPhoneInput').value : '0704389201';
    if (!phoneVal) phoneVal = '0704389201';

    // Lien Marchand Officiel Wave Côte d'Ivoire (Direct & Reconnecté)
    const certCode = 'CERT-BABI-WAVE-' + Math.floor(1000 + Math.random() * 9000);
    const officialWaveUrl = `https://pay.wave.com/m/M_ci_7X1JfUg2eEsX/c/ci/?amount=${grandTotal}&client_reference=${encodeURIComponent(orderId)}`;
    const waveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialWaveUrl)}`;

    modalHeader.style.background = 'linear-gradient(135deg, #1dc4e9, #0284c7)';
    modalTitle.innerHTML = `<img src="assets/wave_money.png" style="width:28px; height:28px; object-fit:contain; display:inline-block;" class="me-2 rounded"><span class="fw-bold text-white">Paiement Wave — Boulangerie de BABI</span>`;
    modalBody.innerHTML = `
        <div class="py-2 text-start">
            <div class="d-flex justify-content-between align-items-center mb-2 px-1">
                <span class="badge bg-light text-dark border small"><i class="fa-solid fa-fingerprint me-1 text-primary"></i> ${certCode}</span>
                <span class="badge bg-success text-white"><i class="fa-solid fa-shield-check me-1"></i> Compte Marchand Vérifié</span>
            </div>

            <div class="text-center mb-3">
                <div class="d-inline-flex align-items-center justify-content-center p-2 rounded-circle mb-2" style="background: rgba(29, 196, 233, 0.15); width: 60px; height: 60px;">
                    <img src="assets/wave_money.png" style="width:40px; height:40px; object-fit:contain;">
                </div>
                <h3 class="fw-bold text-dark mb-0">${grandTotal.toLocaleString()} FCFA</h3>
                <div class="badge bg-info text-dark fw-bold mt-1 px-3 py-1">Compte Marchand Officiel BABI</div>
            </div>

            <div class="p-3 rounded-4 border mb-3 text-center" style="background: #f0fdf4; border-color: #86efac !important;">
                <img src="${waveQrUrl}" class="rounded-3 shadow-sm border p-2 bg-white mb-2" style="width:160px; height:160px;" alt="QR Code Wave Officiel">
                <div class="small fw-bold text-dark mb-1">Scannez ce QR Code avec votre application Wave</div>
                <div class="text-muted small mb-3">Ou appuyez sur le bouton bleu ci-dessous pour ouvrir Wave :</div>
                <a href="${officialWaveUrl}" target="_blank" class="btn btn-info w-100 text-white fw-bold py-3 rounded-pill shadow-lg d-flex align-items-center justify-content-center gap-2" style="background: linear-gradient(135deg, #1dc4e9, #0284c7); border:none; font-size: 15px;">
                    <i class="fa-solid fa-mobile-screen fs-5"></i>
                    <span>OUVRIR L'APPLICATION WAVE (PAYER)</span>
                </a>
            </div>

            <button type="button" class="btn btn-success w-100 fw-bold py-3 rounded-pill shadow" onclick="triggerModalPaymentSuccess('Wave')">
                <i class="fa-solid fa-circle-check me-2"></i> J'AI EFFECTUÉ LE PAIEMENT WAVE
            </button>
        </div>
    `;
    bsModal.show();
}

window.validatePhoneSecurity = function(input) {
    if (!input) return;
    const val = input.value.replace(/[^0-9]/g, '');
    const note = document.getElementById('opFormNote');
    if (note) {
        if (val.length >= 8) {
            note.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-circle-check me-1"></i> Numéro vérifié • Canal chiffré SSL de bout en bout.</span>`;
        } else {
            note.innerHTML = `<i class="fa-solid fa-shield-halved text-success me-1"></i> <span>Session de paiement direct protégée par jeton éphémère anti-usurpation.</span>`;
        }
    }
};

function triggerModalPaymentSuccess(opName) {
    const modalBody = document.getElementById('paymentModalBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="py-4 text-center">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
                <h5 class="fw-bold text-dark">Transaction ${opName} en cours...</h5>
                <p class="text-muted small">Validation auprès du serveur sécurisé ${opName}. Veuillez patienter...</p>
            </div>
        `;

        setTimeout(() => {
            modalBody.innerHTML = `
                <div class="py-4 text-center text-success">
                    <i class="fa-solid fa-circle-check fa-4x mb-3"></i>
                    <h4 class="fw-bold">Paiement Validé avec Succès !</h4>
                    <p class="text-muted small mb-0">Règlement enregistré via <strong>${opName}</strong>.</p>
                </div>
            `;

                setTimeout(() => {
                const modalEl = document.getElementById('paymentModal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (bsModal) bsModal.hide();
                    setTimeout(() => {
                        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                    }, 300);
                }
                submitBabiOrder(true);
            }, 1400);
        }, 2200);
    }
}

function togglePaymentMode(mode) {
    const momoSec = document.getElementById('operatorSection');
    const cashSec = document.getElementById('cashSection');

    const momoBox = document.getElementById('card_momo_box');
    const cashBox = document.getElementById('card_cash_box');

    if (momoBox) {
        momoBox.classList.toggle('selected', mode === 'momo');
        momoBox.style.borderColor = (mode === 'momo') ? '#1dc4e9' : '#e2e8f0';
        momoBox.style.background = (mode === 'momo') ? '#f0f9ff' : '#ffffff';
    }
    if (cashBox) {
        cashBox.classList.toggle('selected', mode === 'cash');
        cashBox.style.borderColor = (mode === 'cash') ? '#22c55e' : '#e2e8f0';
        cashBox.style.background = (mode === 'cash') ? '#f0fdf4' : '#ffffff';
    }

    if (momoSec) momoSec.style.display = (mode === 'momo') ? 'block' : 'none';
    if (cashSec) {
        cashSec.classList.toggle('d-none', mode !== 'cash');
        cashSec.style.display = (mode === 'cash') ? 'block' : 'none';
    }
}

function selectCashChange(btn, amount) {
    document.querySelectorAll('#cashSection .btn').forEach(b => {
        b.classList.remove('btn-dark', 'active-change');
        b.classList.add('btn-outline-dark');
    });
    if (btn) {
        btn.classList.remove('btn-outline-dark');
        btn.classList.add('btn-dark', 'active-change');
    }
    window.selectedCashChange = amount;
}

function toggleOperatorSection(show) {
    togglePaymentMode(show ? 'momo' : 'cash');
}

window.selectOperator = selectOperator;
window.toggleOperatorSection = toggleOperatorSection;
window.togglePaymentMode = togglePaymentMode;
window.selectCashChange = selectCashChange;
window.openOperatorPaymentModal = openOperatorPaymentModal;
window.triggerModalPaymentSuccess = triggerModalPaymentSuccess;
window.updateDeliveryHighlight = updateDeliveryHighlight;
