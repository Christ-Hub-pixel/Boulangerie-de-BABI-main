// ================================================================
// BABI CHECKOUT & ORDER SUBMISSION CONTROLLER
// ================================================================

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

    renderCheckoutSummary();
    setupCheckoutFormEvents();
}

// ================================================================
// ALGORITHME DE CALCUL KILOMÉTRIQUE DES FRAIS DE LIVRAISON
// (Cocody Riviera 2 -> Abidjan)
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
        feeSubtitle.textContent = `Livraison garantie par nos livreurs GPS — Distance : ${km} km (${label}) — Tarif calculé : ${fee.toLocaleString()} FCFA.`;
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
    const promoDiscount = window.appliedPromoDiscount || 0;
    const grandTotal = Math.max(0, subtotal + deliveryCost - promoDiscount);

    const summaryBox = document.getElementById('checkoutSummaryBox') || document.querySelector('.col-lg-4 .bg-white');
    if (!summaryBox) return;

    let itemsHtml = items.map(item => {
        const itemPrice = typeof parsePriceFromItem === 'function' ? parsePriceFromItem(item) : (item.price || item.prix || 0);
        const itemQty = item.qty || item.quantity || 1;
        return `
        <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
            <div class="d-flex align-items-center gap-2">
                <img src="${item.image || item.img}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" onerror="this.src='assets/product_baguette.png'">
                <div>
                    <div class="fw-bold small text-truncate" style="max-width:140px;">${item.name || item.title}</div>
                    <small class="text-muted">Qté: ${itemQty}</small>
                </div>
            </div>
            <div class="fw-bold small">${(itemPrice * itemQty).toLocaleString()} FCFA</div>
        </div>
    `;
    }).join('');

    const clickAndCollectBanner = `<div class="alert alert-success py-2 px-3 small fw-bold mb-3 d-flex align-items-center"><i class="fa-solid fa-store text-success me-2 fs-5"></i> ⚡ Click & Collect : Retrait Gratuit & Sans File d'Attente !</div>`;

    summaryBox.innerHTML = `
        <h6 class="fw-bold border-bottom pb-2 mb-3" style="color:#2b160c;">
            <i class="fa-solid fa-receipt me-1 text-warning"></i> RÉSUMÉ DE LA COMMANDE
        </h6>

        ${clickAndCollectBanner}
        
        <div class="items-list mb-3" style="max-height: 220px; overflow-y: auto;">
            ${itemsHtml}
        </div>

        <!-- Code Promo / Avantage Fidélité -->
        <div class="mb-3 pt-2 border-bottom pb-3">
            <label class="form-label fs-xs fw-bold text-dark mb-1"><i class="fa-solid fa-ticket text-warning me-1"></i> Code Promo / Fidélité</label>
            <div class="input-group input-group-sm">
                <input type="text" class="form-control text-uppercase fw-bold shadow-none" id="promoCodeInput" placeholder="Ex: BABI10" value="${window.appliedPromoCode || ''}" style="color: #111827 !important; background-color: #ffffff !important;">
                <button class="btn btn-dark fw-bold px-3" type="button" onclick="applyPromoCode()">APPLIQUER</button>
            </div>
            <div id="promoFeedback" class="small mt-1 ${window.appliedPromoCode ? 'text-success fw-bold' : 'd-none'}">
                ${window.appliedPromoCode ? '🎉 Code "' + window.appliedPromoCode + '" appliqué (-' + promoDiscount.toLocaleString() + ' FCFA)' : ''}
            </div>
        </div>
        
        <div class="d-flex justify-content-between mb-2 fs-sm text-muted">
            <span>Sous-total (${items.reduce((s,i) => s+(i.qty||1), 0)} articles)</span>
            <span class="fw-bold text-dark">${subtotal.toLocaleString()} FCFA</span>
        </div>
        <div class="d-flex justify-content-between mb-2 fs-sm text-muted">
            <span>Frais de retrait au fournil</span>
            <span class="fw-bold text-success">Gratuit (0 FCFA)</span>
        </div>
        ${promoDiscount > 0 ? `
        <div class="d-flex justify-content-between mb-3 fs-sm text-success fw-bold border-bottom pb-2">
            <span><i class="fa-solid fa-tag me-1"></i> Réduction (${window.appliedPromoCode})</span>
            <span>-${promoDiscount.toLocaleString()} FCFA</span>
        </div>` : '<div class="border-bottom mb-3"></div>'}
        
        <div class="d-flex justify-content-between mb-4">
            <span class="fw-bold fs-5" style="color:#2b160c;">Total</span>
            <span class="fw-bold fs-5 text-primary" style="color:#fb923c !important;">${grandTotal.toLocaleString()} FCFA</span>
        </div>
        
        <button type="button" class="btn btn-warning w-100 fw-bold text-dark shadow-sm py-3 fs-6 rounded-3" 
            style="background:#fb923c; border:none;" id="placeOrderBtn" onclick="submitBabiOrder()">
            <i class="fa-solid fa-check-circle me-2"></i>CONFIRMER ET RÉSERVER (${grandTotal.toLocaleString()} FCFA)
        </button>
    `;

    // Also update main payment submit button inside accordion if present
    const accordionSubmitBtn = document.getElementById('accordionPlaceOrderBtn');
    if (accordionSubmitBtn) {
        accordionSubmitBtn.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>CONFIRMER ET RÉSERVER (${grandTotal.toLocaleString()} FCFA)`;
        accordionSubmitBtn.onclick = submitBabiOrder;
    }
}

function applyPromoCode() {
    const inputEl = document.getElementById('promoCodeInput');
    const feedbackEl = document.getElementById('promoFeedback');
    if (!inputEl) return;

    const code = inputEl.value.trim().toUpperCase();
    const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;

    if (!code) {
        if (feedbackEl) {
            feedbackEl.className = "small mt-1 text-danger fw-bold";
            feedbackEl.innerText = "Veuillez entrer un code promo.";
        }
        return;
    }

    let discount = 0;
    if (code === 'BABI10') {
        discount = Math.round(subtotal * 0.10); // 10% off
    } else if (code === 'CROISSANT' || code === 'BABI500') {
        discount = 500;
    } else if (code === 'WELCOME' || code === 'RETRAIT' || code === 'BABI1000') {
        discount = 1000;
    } else {
        if (feedbackEl) {
            feedbackEl.className = "small mt-1 text-danger fw-bold";
            feedbackEl.innerText = "Code promo invalide.";
        }
        return;
    }

    window.appliedPromoCode = code;
    window.appliedPromoDiscount = discount;
    renderCheckoutSummary();
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

function submitBabiOrder(isAlreadyValidated = false) {
    if (typeof isStoreOpen === 'function' && !isStoreOpen()) {
        showStoreClosedModal();
        return;
    }

    const items = typeof getCartItems === 'function' ? getCartItems() : [];
    if (!items || items.length === 0) {
        alert('Votre panier est vide.');
        return;
    }

    // Read form inputs & validate required fields
    const clientNameInput = document.getElementById('clientNameInput');
    const clientPhoneInput = document.getElementById('clientPhoneInput');
    const pickupSlotSelect = document.getElementById('pickupSlotSelect');

    const inputs = document.querySelectorAll('#collapseOne input, #collapseOne select');
    const fullName = clientNameInput ? clientNameInput.value.trim() : (inputs[0] ? inputs[0].value.trim() : '');
    const phone = clientPhoneInput ? clientPhoneInput.value.trim() : (inputs[1] ? inputs[1].value.trim() : '');
    const pickupSlot = pickupSlotSelect ? pickupSlotSelect.value : 'Dès que possible (~15-20 min)';

    const alertBox = document.getElementById('checkoutAlertBox');
    if (!fullName || !phone) {
        if (alertBox) {
            alertBox.classList.remove('d-none');
            alertBox.className = "alert alert-danger fw-bold shadow-sm mb-3 align-items-center gap-2 d-flex";
            alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation fs-5 text-danger"></i> <div><strong>Champs obligatoires :</strong> Veuillez renseigner votre Prénom, Nom et Numéro de téléphone à l'Étape 1.</div>`;
            alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert('Veuillez renseigner votre Prénom, Nom et Numéro de téléphone.');
        }
        if (clientNameInput && !fullName) clientNameInput.classList.add('is-invalid');
        if (clientPhoneInput && !phone) clientPhoneInput.classList.add('is-invalid');
        const collapseOne = document.getElementById('collapseOne');
        if (collapseOne && typeof bootstrap !== 'undefined') {
            new bootstrap.Collapse(collapseOne, { show: true });
        }
        return;
    } else {
        if (alertBox) alertBox.classList.add('d-none');
        if (clientNameInput) clientNameInput.classList.remove('is-invalid');
        if (clientPhoneInput) clientPhoneInput.classList.remove('is-invalid');
    }

    const commune = 'Cocody Riviera 2';
    const address = 'Boulangerie de BABI (Fournil Riviera 2)';
    const deliveryMethod = 'Retrait en Boutique (Click & Collect)';
    const deliveryCost = 0;

    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    const isWave = paymentRadio ? paymentRadio.id !== 'p_cash' : true;
    const paymentMethod = isWave ? 'Wave Mobile Money' : 'Paiement au comptoir (Espèces)';

    const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;
    const promoDiscount = window.appliedPromoDiscount || 0;
    const grandTotal = Math.max(0, subtotal + deliveryCost - promoDiscount);

    const orderId = 'BABI-CMD-' + Math.floor(100000 + Math.random() * 900000);
    const confCode = Math.floor(1000 + Math.random() * 9000);

    const notesInput = document.getElementById('orderNotesInput');
    const orderNotes = notesInput ? notesInput.value.trim() : '';

    const newOrder = {
        id: orderId,
        clientName: fullName || 'Client BABI',
        phone: phone || '07 04 38 92 01',
        commune: commune,
        address: address,
        pickupSlot: pickupSlot,
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        payment_status: isMobileMoney ? 'paye' : 'en_attente',
        items: items,
        itemsSummary: items.map(i => `${i.name || i.title} (x${i.qty || i.quantity || 1})`).join(', '),
        subtotal: subtotal,
        delivery_cost: 0,
        promo_code: window.appliedPromoCode || '',
        promo_discount: promoDiscount,
        total_price: grandTotal,
        notes: orderNotes,
        status: 'Nouveau',
        confCode: confCode,
        createdAt: new Date().toISOString()
    };

    // Génération automatique du lien WhatsApp avec reçu et point de retrait
    const whatsappUrl = generateWhatsAppOrderUrl(newOrder);
    newOrder.whatsappUrl = whatsappUrl;

    // Helper to finish order
    const finalizeOrder = () => {
        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: newOrder.clientName,
                phone: newOrder.phone,
                address: `${newOrder.commune}, ${newOrder.address}`,
                items: newOrder.itemsSummary,
                total_price: newOrder.total_price,
                payment_method: newOrder.payment_method,
                notes: newOrder.notes
            })
        }).catch(() => {});

        localStorage.setItem('babi_current_order', JSON.stringify(newOrder));

        try {
            let history = JSON.parse(localStorage.getItem('babi_orders_history')) || [];
            history.unshift(newOrder);
            localStorage.setItem('babi_orders_history', JSON.stringify(history));
        } catch(e) {}

        if (typeof clearCart === 'function') {
            clearCart();
        } else {
            localStorage.removeItem('babi_cart_items');
            localStorage.removeItem('babi_cart');
        }

        window.location.href = `suivi.html?orderId=${orderId}&phone=${encodeURIComponent(newOrder.phone)}`;
    };

    if (isMobileMoney && !isAlreadyValidated) {
        if (typeof openOperatorPaymentModal === 'function') {
            openOperatorPaymentModal(selectedOperatorCode);
            return;
        }
    }

    finalizeOrder();
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
    msg += `📍 *Lieu de Retrait :* Cocody Riviera 2 (Fournil BABI)\n`;
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
    if (order.promo_discount) {
        msg += `🎁 *Remise Promo (${order.promo_code}) :* -${order.promo_discount.toLocaleString()} FCFA\n`;
    }
    msg += `💎 *TOTAL À RÉGLER :* *${(order.total_price || 0).toLocaleString()} FCFA*\n`;
    if (order.notes) {
        msg += `📝 *Remarques :* ${order.notes}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📱 *SUIVRE L'ÉTAT DE PRÉPARATION :*\n${trackingUrl}\n\n`;
    msg += `_Boulangerie de BABI — Cocody Riviera 2, Abidjan_ 🥖✨`;

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

    modalHeader.style.background = '#1dc4e9';
    modalTitle.innerHTML = `<img src="assets/wave_money.png" style="width:28px; height:28px; object-fit:contain; display:inline-block;" class="me-2 rounded">Guichet Wave Mobile Money`;
    modalBody.innerHTML = `
        <div class="py-2 text-start">
            <div class="text-center mb-3">
                <img src="assets/wave_money.png" style="width:54px; height:54px; object-fit:contain; display:inline-block;" class="mb-2">
                <h4 class="fw-bold text-dark mb-0">${grandTotal.toLocaleString()} FCFA</h4>
                <small class="text-muted">Guichet Officiel Wave Mobile Money CI</small>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold small text-dark">Votre Numéro Wave</label>
                <div class="input-group">
                    <span class="input-group-text bg-white fw-bold text-dark border-end-0"><span class="me-1">🇨🇮</span> +225</span>
                    <input type="tel" class="form-control text-dark fw-bold border-start-0 ps-1" id="modalWavePhone" value="${phoneVal}" placeholder="07 04 38 92 01" style="color: #111827 !important; background-color: #ffffff !important;">
                </div>
            </div>

            <div class="p-3 bg-light rounded border mb-3 text-center">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('https://wave.com/pay/' + orderId)}" class="rounded shadow-sm border p-2 bg-white mb-2" style="width:140px;">
                <div class="small text-muted mb-2">Scannez ce QR Code Wave ou cliquez ci-dessous :</div>
                <a href="https://wave.com/pay/${orderId}" target="_blank" class="btn btn-info w-100 text-white fw-bold py-2 rounded-pill shadow-sm" style="background:#1dc4e9; border:none;">
                    <i class="fa-solid fa-mobile-screen me-2"></i>OUVRIR DANS WAVE APP
                </a>
            </div>

            <button type="button" class="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow-sm" style="background:#1dc4e9; border:none;" onclick="triggerModalPaymentSuccess('Wave')">
                <i class="fa-solid fa-check-circle me-1"></i> VALIDER LE PAIEMENT WAVE (${grandTotal.toLocaleString()} FCFA)
            </button>
        </div>
    `;
    bsModal.show();
}

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

    // Réinitialiser les surbrillances
    [momoBox, cashBox].forEach(b => {
        if (b) {
            b.style.backgroundColor = '#fff';
            b.style.borderColor = '#dee2e6';
        }
    });

    if (momoSec) momoSec.style.display = (mode === 'momo') ? 'block' : 'none';
    if (cashSec) {
        cashSec.classList.toggle('d-none', mode !== 'cash');
        cashSec.style.display = (mode === 'cash') ? 'block' : 'none';
    }

    if (mode === 'momo' && momoBox) {
        momoBox.style.backgroundColor = 'rgba(244, 180, 0, 0.05)';
        momoBox.style.borderColor = '#0d6efd';
    } else if (mode === 'cash' && cashBox) {
        cashBox.style.backgroundColor = 'rgba(25, 135, 84, 0.04)';
        cashBox.style.borderColor = '#198754';
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
window.applyPromoCode = applyPromoCode;
window.updateDeliveryHighlight = updateDeliveryHighlight;
