const API_ROOT = (typeof window !== 'undefined' && (window.API_BASE_URL || (window.location.hostname.includes('boulangeriedebabi.com') ? 'https://api.boulangeriedebabi.com' : 'http://localhost:5000'))) || 'http://localhost:5000';

let map;
let bakeryMarker;
let deliveryMarker;
let customerMarker;
let isAnimating = false;
let currentInterval;
let currentPhone = null;
let currentStatus = null;

// Abidjan coordinates
const bakeryCoords = [5.3772845, -3.9272566]; // Riviera (Fournil BABI)

function initMap() {
    map = L.map('map').setView(bakeryCoords, 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // Bakery Icon
    const bakeryIcon = L.divIcon({
        html: '<div style="background:#ea580c; color:white; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(234, 88, 12, 0.5); border:3px solid white;"><i class="fa-solid fa-store fs-6"></i></div>',
        className: '', iconSize: [38, 38], iconAnchor: [19, 19]
    });
    bakeryMarker = L.marker(bakeryCoords, {icon: bakeryIcon}).addTo(map)
        .bindPopup(`
            <div style="font-family:'Inter',sans-serif; text-align:center; padding:4px;">
                <strong style="color:#2b160c; font-size:13px;">🥖 Boulangerie de BABI</strong><br>
                <small class="text-muted">Fournil & Point de Retrait Click & Collect</small><br>
                <div class="mt-2">
                    <a href="https://www.google.com/maps/place/5%C2%B022%2738.2%22N+3%C2%B055%2738.1%22W/@5.3772845,-3.9272566,17z" target="_blank" class="btn btn-warning btn-sm fw-bold text-dark px-3 py-1" style="font-size:11px; border-radius:12px;">
                        <i class="fa-solid fa-diamond-turn-right me-1"></i> Ouvrir Itinéraire GPS
                    </a>
                </div>
            </div>
        `).openPopup();
}

function updateTimeline(status) {
    const s = (status || '').toLowerCase();
    document.querySelectorAll('.timeline-step').forEach(el => {
        el.classList.remove('active', 'done');
    });

    const stepN = document.getElementById('step-nouveau');
    const stepP = document.getElementById('step-preparation');
    const stepL = document.getElementById('step-livraison');
    const stepF = document.getElementById('step-livre');

    const driverAlert = document.getElementById('driver-alert');

    if(s.includes('nouveau')) {
        stepN.classList.add('active');
        if (driverAlert) driverAlert.style.setProperty('display', 'none', 'important');
    } 
    else if(s.includes('preparation') || s.includes('préparation')) {
        stepN.classList.add('done');
        stepP.classList.add('active');
        if (driverAlert) driverAlert.style.setProperty('display', 'none', 'important');
    }
    else if(s.includes('en livraison') || s.includes('livraison') || s.includes('pret') || s.includes('prête')) {
        stepN.classList.add('done');
        stepP.classList.add('done');
        stepL.classList.add('active');
        if (driverAlert) driverAlert.style.setProperty('display', 'flex', 'important');
    }
    else if(s.includes('livre') || s.includes('livré') || s.includes('retire') || s.includes('retiré')) {
        stepN.classList.add('done');
        stepP.classList.add('done');
        stepL.classList.add('done');
        stepF.classList.add('active');
        if (driverAlert) driverAlert.style.setProperty('display', 'none', 'important');
    }
    
    // Update Badge
    const badge = document.getElementById('order-badge');
    if (badge) {
        badge.className = 'badge rounded-pill px-3 py-2 fs-6 ';
        if(s.includes('nouveau')) {
            badge.innerText = 'Reçue & En attente';
            badge.classList.add('bg-secondary');
        } else if(s.includes('preparation') || s.includes('préparation')) {
            badge.innerText = 'Au Fournil (Cuisson)';
            badge.classList.add('bg-warning', 'text-dark');
        } else if(s.includes('livraison') || s.includes('pret') || s.includes('prête')) {
            badge.innerText = 'Prête au Comptoir !';
            badge.classList.add('bg-success', 'text-white');
        } else if(s.includes('livre') || s.includes('retire')) {
            badge.innerText = 'Commande Récupérée';
            badge.classList.add('bg-dark');
        } else {
            badge.innerText = status;
            badge.classList.add('bg-primary');
        }
    }
}

function startDeliveryAnimation() {
    const alert = document.getElementById('driver-alert');
    if (alert) alert.style.setProperty('display', 'flex', 'important');
}

function stopDeliveryAnimation(delivered) {
    const alert = document.getElementById('driver-alert');
    if (alert) alert.style.setProperty('display', 'none', 'important');
}

async function fetchOrderStatus() {
    let foundOrder = null;
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');

    // 1. Try fetching by Order ID first if present
    if (orderIdParam) {
        try {
            const res = await fetch(`${API_ROOT}/api/orders/${encodeURIComponent(orderIdParam)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && (data.order || data.id)) {
                    foundOrder = data.order || data;
                }
            }
        } catch (_) {}
    }

    if (!foundOrder && currentPhone) {
        const cleanPhone = currentPhone.replace(/\s+/g, '');
        // 2. Try backend API by phone
        try {
            const res = await fetch(`${API_ROOT}/api/orders/track/` + encodeURIComponent(cleanPhone));
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    foundOrder = data[0];
                } else if (data && data.order) {
                    foundOrder = data.order;
                }
            }
        } catch(e) {}
    }

    // 3. Try localStorage current order & history
    if (!foundOrder && currentPhone) {
        const cleanPhone = currentPhone.replace(/\s+/g, '');
        try {
            const cur = JSON.parse(localStorage.getItem('babi_current_order'));
            if (cur && (cur.phone || '').replace(/\s+/g, '').includes(cleanPhone.slice(-8))) {
                foundOrder = cur;
            }
            if (!foundOrder) {
                const history = JSON.parse(localStorage.getItem('babi_orders_history') || localStorage.getItem('babi_orders') || '[]');
                const matched = history.find(o => (o.phone || '').replace(/\s+/g, '').includes(cleanPhone.slice(-8)));
                if (matched) foundOrder = matched;
            }
        } catch(e) {}
    }

    // 4. Try active session order
    if (!foundOrder) {
        try {
            foundOrder = JSON.parse(localStorage.getItem('babi_current_order'));
        } catch (_) {}
    }

    if (foundOrder) {
        displayOrderOnUI(foundOrder);
    }
}

function displayOrderOnUI(order) {
    if (!order) return;

    const searchSec = document.getElementById('search-section');
    const trackSec = document.getElementById('tracking-section');
    if (searchSec) searchSec.style.display = 'none';
    if (trackSec) {
        trackSec.style.display = 'block';
        trackSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const orderIdDisp = document.getElementById('order-id-display');
    const orderTotalDisp = document.getElementById('order-total');
    const orderPaymentDisp = document.getElementById('order-payment');
    const orderItemsDisp = document.getElementById('order-items');

    if (orderIdDisp) orderIdDisp.innerText = '#' + (order.id || 'BABI-100');
    if (orderTotalDisp) orderTotalDisp.innerText = (order.total_price || order.total || 0).toLocaleString() + ' FCFA';
    if (orderPaymentDisp) orderPaymentDisp.innerText = order.payment_method || 'Wave Mobile Money';
    if (orderItemsDisp) orderItemsDisp.innerText = order.items || order.itemsSummary || 'Produits de la Boulangerie BABI';

    const pin = order.code_pin || order.confirmation_code || order.confCode || order.pickup_pin || '7412';
    const confBox = document.getElementById('confirmation-code-box');
    const confCodeEl = document.getElementById('order-conf-code');
    const pickupRefEl = document.getElementById('pickup-order-ref');
    if (confBox) confBox.style.display = 'block';
    if (confCodeEl) confCodeEl.innerText = pin;
    if (pickupRefEl) pickupRefEl.innerText = '#' + (order.id || 'BABI-100');

    const sealEl = document.getElementById('quantum-certified-seal');
    if (sealEl) {
        const rawId = String(order.id || 'BABI-100');
        const p1 = Math.abs(rawId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(4, '0').substring(0, 4);
        const p2 = Math.abs((order.phone || '0704389201').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(4, '0').substring(0, 4);
        const p3 = Math.abs(Number(order.total_price || 3500) * 17).toString(16).toUpperCase().padStart(4, '0').substring(0, 4);
        sealEl.innerText = `CERT-BABI-${p1}-${p2}-${p3}`;
    }

    const whatsappBtn = document.getElementById('btn-whatsapp-receipt');
    if (whatsappBtn) {
        const whatsappUrl = typeof window.generateWhatsAppOrderUrl === 'function' 
            ? window.generateWhatsAppOrderUrl(order)
            : (order.whatsappUrl || '#');
        whatsappBtn.href = whatsappUrl;
    }

    const statusStr = order.status || 'Au Fournil (Cuisson)';
    if (currentStatus !== statusStr) {
        currentStatus = statusStr;
        updateTimeline(statusStr);
    }

    if (!map) initMap();
    setTimeout(() => { if (map) map.invalidateSize(); }, 300);
}

window.trackOrder = function() {
    const input = document.getElementById('phone-input');
    const phone = input ? input.value.trim() : '';
    if (!phone) {
        if (input) input.focus();
        return;
    }
    currentPhone = phone;
    fetchOrderStatus();

    if (currentInterval) clearInterval(currentInterval);
    currentInterval = setInterval(fetchOrderStatus, 8000);
};

// Auto track if phone is in URL parameters or if current active order exists in localStorage
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initMap === 'function') initMap();

    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');
    if (phone) {
        document.getElementById('phone-input').value = phone;
        trackOrder();
        return;
    }

    try {
        const currentOrder = JSON.parse(localStorage.getItem('babi_current_order'));
        if (currentOrder) {
            document.getElementById('search-section').style.display = 'none';
            document.getElementById('tracking-section').style.display = 'block';

            document.getElementById('order-id-display').innerText = '#' + (currentOrder.id || 'BABI-100');
            document.getElementById('order-total').innerText = (currentOrder.total_price || 0).toLocaleString() + ' FCFA';
            document.getElementById('order-payment').innerText = currentOrder.payment_method || 'Mobile Money';
            document.getElementById('order-items').innerText = currentOrder.itemsSummary || 'Produits Boulangerie BABI';

            if (currentOrder.confCode || currentOrder.confirmation_code) {
                const confBox = document.getElementById('confirmation-code-box');
                const confCodeEl = document.getElementById('order-conf-code');
                const pickupRefEl = document.getElementById('pickup-order-ref');
                if (confBox) confBox.style.display = 'block';
                if (confCodeEl) confCodeEl.innerText = currentOrder.confCode || currentOrder.confirmation_code;
                if (pickupRefEl) pickupRefEl.innerText = '#' + (currentOrder.id || 'BABI-100');
            }

            // Update WhatsApp receipt button
            const whatsappBtn = document.getElementById('btn-whatsapp-receipt');
            if (whatsappBtn) {
                const whatsappUrl = typeof window.generateWhatsAppOrderUrl === 'function' 
                    ? window.generateWhatsAppOrderUrl(currentOrder)
                    : (currentOrder.whatsappUrl || '#');
                whatsappBtn.href = whatsappUrl;
            }

            updateTimeline(currentOrder.status || 'En livraison');
            startDeliveryAnimation();
        }
    } catch(e) {}
});

window.openThermalReceiptModal = function() {
    let order = null;
    try {
        order = JSON.parse(localStorage.getItem('babi_current_order'));
    } catch(e) {}
    
    if (!order) {
        order = {
            id: 'BABI-CMD-2512',
            clientName: 'Client Passant',
            phone: '0704389201',
            commune: 'Riviera',
            address: 'Près de l’Église Sainte Famille',
            delivery_method: 'standard',
            subtotal: 2500,
            delivery_cost: 500,
            promo_discount: 0,
            total_price: 3000,
            payment_method: 'Wave Mobile Money',
            payment_status: 'paye',
            createdAt: new Date().toISOString(),
            items: [
                { name: 'Baguette Traditionnelle Croustillante', price: 350, qty: 2 },
                { name: 'Croissant Pur Beurre Doré', price: 600, qty: 2 },
                { name: 'Jus de Bissap Artisanal 500ml', price: 1100, qty: 1 }
            ]
        };
    }

    populateThermalReceiptData(order);

    const modalEl = document.getElementById('thermalReceiptModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
    }
};

function populateThermalReceiptData(order) {
    if (!order) return;

    const origin = window.location.origin || '';
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const trackingUrl = `${origin}${basePath}suivi.html?orderId=${order.id}&phone=${encodeURIComponent(order.phone || '')}`;

    const recId = document.getElementById('rec-id');
    const recDate = document.getElementById('rec-date');
    const recClient = document.getElementById('rec-client');
    const recPhone = document.getElementById('rec-phone');
    const recDest = document.getElementById('rec-dest');
    const recDeliveryMode = document.getElementById('rec-delivery-mode');
    const recList = document.getElementById('rec-items-list');
    const recSubtotal = document.getElementById('rec-subtotal');
    const recDeliveryFee = document.getElementById('rec-delivery-fee');
    const recDeliveryRow = document.getElementById('rec-delivery-row');
    const recDiscount = document.getElementById('rec-discount');
    const recDiscountRow = document.getElementById('rec-discount-row');
    const recTotal = document.getElementById('rec-total');
    const recPayment = document.getElementById('rec-payment');
    const recQrCode = document.getElementById('rec-qr-code');
    const recModalWhatsapp = document.getElementById('rec-modal-whatsapp');

    const d = order.createdAt ? new Date(order.createdAt) : new Date();
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

    const cleanNum = String(order.id || '2512').replace(/^ORD-|^REC-|^POS-|^BABI-CMD-/, '');

    if (recId) recId.innerText = cleanNum || '2512';
    if (recDate) recDate.innerText = formattedDate;
    if (recClient) recClient.innerText = order.clientName || 'Client';
    if (recPhone) recPhone.innerText = order.phone || '--';
    
    const pinBox = document.getElementById('rec-pin-box');
    const pinCodeEl = document.getElementById('rec-pin-code');
    const pin = order.code_pin || order.confCode || order.pickup_pin || order.confirmation_code;
    if (pinBox && pinCodeEl) {
        if (pin) {
            pinBox.style.display = 'block';
            pinCodeEl.innerText = pin;
        } else {
            pinBox.style.display = 'none';
        }
    }

    const items = order.items || order.cartItems || [];
    let itemsCount = 0;
    let itemsHtml = '';

    if (items.length > 0) {
        items.forEach(item => {
            const q = Number(item.qty || item.quantity || 1);
            const p = Number(item.price || item.prix || 0);
            const val = p * q;
            itemsCount += q;
            itemsHtml += `
            <div style="display: grid; grid-template-columns: 1fr 55px 30px 60px; font-size: 10px; margin-bottom: 2px;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;" title="${item.name || item.title}">${(item.name || item.title || '').toUpperCase()}</span>
                <span style="text-align: right;">F ${p.toLocaleString('fr-FR')}</span>
                <span style="text-align: center;">x${q}</span>
                <span style="text-align: right; font-weight: bold;">F ${val.toLocaleString('fr-FR')}</span>
            </div>`;
        });
    } else if (order.itemsSummary) {
        itemsCount = 1;
        itemsHtml = `
        <div style="display: grid; grid-template-columns: 1fr 55px 30px 60px; font-size: 10px; margin-bottom: 2px;">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${order.itemsSummary.toUpperCase()}</span>
            <span style="text-align: right;">--</span>
            <span style="text-align: center;">x1</span>
            <span style="text-align: right; font-weight: bold;">F ${(order.total_price || 0).toLocaleString('fr-FR')}</span>
        </div>`;
    }

    if (recList) recList.innerHTML = itemsHtml;

    const itemsCountLine = document.getElementById('rec-items-count-line');
    if (itemsCountLine) itemsCountLine.innerText = `Items count: ${itemsCount || 1}`;

    const totalVal = Number(order.total_price || order.total_amount || order.subtotal || 0);
    if (recTotal) recTotal.innerText = `F ${totalVal.toLocaleString('fr-FR')}`;

    const mode = (order.payment_method || 'Cash').toLowerCase();
    if (recPayment) recPayment.innerText = mode.includes('wave') ? 'Wave' : (mode.includes('orange') ? 'Orange Money' : 'Cash');

    const amountPaidEl = document.getElementById('rec-amount-paid');
    const changeGivenEl = document.getElementById('rec-change-given');
    const montantRecu = Number(order.montant_recu || (totalVal > 0 ? (totalVal >= 10000 ? totalVal : (totalVal > 5000 ? 10000 : 5000)) : 0));
    const monnaieRendue = Number(order.monnaie_rendue || Math.max(0, montantRecu - totalVal));

    if (amountPaidEl) amountPaidEl.innerText = `F ${montantRecu.toLocaleString('fr-FR')}`;
    if (changeGivenEl) changeGivenEl.innerText = `F ${monnaieRendue.toLocaleString('fr-FR')}`;

    // WhatsApp modal link
    if (recModalWhatsapp) {
        let text = `🥖 *BOULANGERIE DE BABI* 🥐\n`;
        text += `_Le Pain de Babi_\n`;
        text += `TEL: 2722564123 / 0704389201 / 0706817977\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🧾 *Receipt:* ${cleanNum || '2512'}\n`;
        text += `📅 *Date:* ${formattedDate}\n`;
        text += `👤 *Caissier(e):* CAISSES 1\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*Article* | *Prix* | *Qte* | *Valeur*\n`;
        items.forEach(it => {
            const q = it.qty || it.quantity || 1;
            const p = it.price || it.prix || 0;
            text += `• ${it.name || it.nom} : F ${p.toLocaleString('fr-FR')} x${q} = F ${(p * q).toLocaleString('fr-FR')}\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💰 *Total TTC:* F ${totalVal.toLocaleString('fr-FR')}\n`;
        if (pin) text += `🔑 *CODE RETRAIT:* *${pin}*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `_Merci de votre visite et à bientôt !_ 🥖`;

        const phone = (order.phone || '').replace(/[^0-9]/g, '');
    // QR Code
    if (recQrCode) {
        recQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;
    }

    // WhatsApp
    if (recModalWhatsapp) {
        const whatsappUrl = typeof window.generateWhatsAppOrderUrl === 'function' 
            ? window.generateWhatsAppOrderUrl(order)
            : (order.whatsappUrl || '#');
        recModalWhatsapp.href = whatsappUrl;
    }
}

window.printOfficialReceipt = function() {
    let order = null;
    try {
        order = JSON.parse(localStorage.getItem('babi_current_order'));
    } catch(e) {}
    populateThermalReceiptData(order);
    window.print();
};

// --- RATING & AUTO-CANCEL SYSTEM ---
let selectedRating = 5;
let selectedTags = new Set();

window.openRatingModal = function() {
    const modalEl = document.getElementById('ratingModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Star rating handler
    document.querySelectorAll('#starContainer .star-btn').forEach(star => {
        star.addEventListener('click', (e) => {
            selectedRating = parseInt(e.target.getAttribute('data-val'));
            document.querySelectorAll('#starContainer .star-btn').forEach((s, idx) => {
                if (idx < selectedRating) {
                    s.classList.add('text-warning');
                    s.classList.remove('text-muted');
                } else {
                    s.classList.remove('text-warning');
                    s.classList.add('text-muted');
                }
            });
        });
    });

    // Tag chip toggle
    document.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
                chip.classList.remove('bg-warning', 'text-dark', 'fw-bold');
                chip.classList.add('bg-light', 'text-dark');
            } else {
                selectedTags.add(tag);
                chip.classList.add('bg-warning', 'text-dark', 'fw-bold');
                chip.classList.remove('bg-light');
            }
        });
    });
});

window.submitClientRating = function() {
    let order = null;
    try {
        order = JSON.parse(localStorage.getItem('babi_current_order'));
    } catch(e) {}

    const orderId = order ? order.id : 'BABI-100';
    const comment = document.getElementById('clientCommentText') ? document.getElementById('clientCommentText').value : '';

    fetch(`${API_ROOT}/api/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_rating: selectedRating,
            client_tags: Array.from(selectedTags),
            client_comment: comment
        })
    }).catch(() => {});

    alert("🎉 Merci pour votre avis ! Votre évaluation a bien été prise en compte.");
    const modalEl = document.getElementById('ratingModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }
};

window.triggerCustomerAutoCancel = function() {
    let order = null;
    try {
        order = JSON.parse(localStorage.getItem('babi_current_order'));
    } catch(e) {}

    const orderId = order ? order.id : 'BABI-CMD-100';

    const executeCancel = () => {
        fetch(`${API_ROOT}/api/payments/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                reason: 'Annulation express par le client'
            })
        }).then(res => res.json()).then(data => {
            if (order) {
                order.status = 'annule_rembourse';
                localStorage.setItem('babi_current_order', JSON.stringify(order));
            }
            window.location.reload();
        }).catch(() => {
            window.location.reload();
        });
    };

    if (typeof showBabiCustomConfirm === 'function') {
        showBabiCustomConfirm({
            title: "Annulation de commande",
            message: "Voulez-vous vraiment annuler votre commande ? Le remboursement sera effectué immédiatement sur votre compte Mobile Money.",
            icon: "fa-ban",
            confirmColor: "gradient-red",
            confirmText: "Confirmer l'annulation",
            cancelText: "Garder ma commande",
            onConfirm: executeCancel
        });
    } else {
        executeCancel();
    }
};
