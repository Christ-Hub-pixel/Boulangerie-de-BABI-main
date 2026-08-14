
let map;
let bakeryMarker;
let deliveryMarker;
let customerMarker;
let isAnimating = false;
let currentInterval;
let currentPhone = null;
let currentStatus = null;

// Abidjan coordinates
const bakeryCoords = [5.3772845, -3.9272566]; // Cocody Riviera 2 (Fournil BABI)

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
                    <a href="https://maps.app.goo.gl/6JrQ1ryZj2KeD5zG7" target="_blank" class="btn btn-warning btn-sm fw-bold text-dark px-3 py-1" style="font-size:11px; border-radius:12px;">
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
    if(!currentPhone) return;
    try {
        const res = await fetch('/api/orders/track/' + currentPhone);
        const data = await res.json();
        
        if(data.success) {
            const order = data.order;
            document.getElementById('search-section').style.display = 'none';
            document.getElementById('tracking-section').style.display = 'block';
            
            document.getElementById('order-id-display').innerText = '#' + order.id;
            document.getElementById('order-total').innerText = order.total_price.toLocaleString() + ' FCFA';
            document.getElementById('order-payment').innerText = order.payment_method;
            document.getElementById('order-items').innerText = order.items;
            if(order.confirmation_code || order.confCode) {
                const confBox = document.getElementById('confirmation-code-box');
                const confCodeEl = document.getElementById('order-conf-code');
                const pickupRefEl = document.getElementById('pickup-order-ref');
                if (confBox) confBox.style.display = 'block';
                if (confCodeEl) confCodeEl.innerText = order.confirmation_code || order.confCode;
                if (pickupRefEl) pickupRefEl.innerText = '#' + (order.id || 'BABI-100');
            }
            
            if(currentStatus !== order.status) {
                currentStatus = order.status;
                updateTimeline(order.status);
            }
            
            if(!map) initMap();
            setTimeout(() => { if(map) map.invalidateSize(); }, 500);
            
        } else {
            alert("Aucune commande en cours pour ce numéro.");
            if(currentInterval) clearInterval(currentInterval);
        }
    } catch(e) {
        console.error(e);
    }
}

window.trackOrder = function() {
    const phone = document.getElementById('phone-input').value;
    if(!phone) return;
    currentPhone = phone;
    fetchOrderStatus();
    
    // Poll every 5 seconds
    if(currentInterval) clearInterval(currentInterval);
    currentInterval = setInterval(fetchOrderStatus, 5000);
}

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
            commune: 'Cocody Riviera 2',
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
    const formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (recId) recId.innerText = '#' + (order.id || 'BABI-100');
    if (recDate) recDate.innerText = formattedDate;
    if (recClient) recClient.innerText = order.clientName || 'Client';
    if (recPhone) recPhone.innerText = order.phone || '--';
    if (recDest) recDest.innerText = `${order.commune || 'Abidjan'}, ${order.address || ''}`;
    if (recDeliveryMode) recDeliveryMode.innerText = order.delivery_method === 'express' ? 'Livraison Express Moto' : (order.delivery_method === 'retrait' ? 'Retrait en Boutique' : 'Livraison Standard');
    
    if (recPayment) recPayment.innerText = (order.payment_method || 'Mobile Money') + (order.payment_status === 'paye' ? ' (VALIDÉ)' : '');

    const sub = order.subtotal || (order.total_price ? order.total_price - (order.delivery_cost || 0) : 0);
    if (recSubtotal) recSubtotal.innerText = (sub || 0).toLocaleString() + ' FCFA';
    
    if (order.delivery_cost && recDeliveryFee) {
        recDeliveryFee.innerText = order.delivery_cost.toLocaleString() + ' FCFA';
        if (recDeliveryRow) recDeliveryRow.style.display = 'flex';
    } else if (recDeliveryRow && order.delivery_method === 'retrait') {
        recDeliveryRow.style.display = 'none';
    }

    if (order.promo_discount && order.promo_discount > 0 && recDiscount) {
        recDiscount.innerText = `-${order.promo_discount.toLocaleString()} FCFA`;
        if (recDiscountRow) recDiscountRow.style.display = 'flex';
    } else if (recDiscountRow) {
        recDiscountRow.style.display = 'none';
    }

    if (recTotal) recTotal.innerText = (order.total_price || sub || 0).toLocaleString() + ' FCFA';

    // Articles list
    if (recList) {
        let itemsHtml = '';
        const items = order.items || order.cartItems || [];
        if (items.length > 0) {
            items.forEach(item => {
                const q = item.qty || item.quantity || 1;
                const p = item.price || item.prix || 0;
                const val = p * q;
                itemsHtml += `
                <div class="d-flex justify-content-between my-1" style="font-size: 9.5px;">
                    <span style="flex: 2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.name || item.title}">${(item.name || item.title || '').toUpperCase()}</span>
                    <span style="flex: 1; text-align: center;">${p.toLocaleString()}</span>
                    <span style="flex: 0.8; text-align: center;">x${q}</span>
                    <span style="flex: 1.2; text-align: right; font-weight:bold;">${val.toLocaleString()}</span>
                </div>`;
            });
        } else if (order.itemsSummary) {
            itemsHtml = `
            <div class="d-flex justify-content-between my-1" style="font-size: 9.5px;">
                <span style="flex: 2;">${order.itemsSummary.toUpperCase()}</span>
                <span style="flex: 1; text-align: center;">--</span>
                <span style="flex: 0.8; text-align: center;">x1</span>
                <span style="flex: 1.2; text-align: right; font-weight:bold;">${(order.total_price || 0).toLocaleString()}</span>
            </div>`;
        }
        recList.innerHTML = itemsHtml;
    }

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

    fetch(`/api/orders/${orderId}/rate`, {
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

    if (confirm("Voulez-vous vraiment annuler votre commande ?\nLe remboursement sera effectué immédiatement sur votre compte Mobile Money.")) {
        fetch('/api/payments/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                reason: 'Annulation express par le client'
            })
        }).then(res => res.json()).then(data => {
            alert("✅ Commande annulée avec succès !\n" + (data.message || "Remboursement de votre compte Mobile Money effectué."));
            if (order) {
                order.status = 'annule_rembourse';
                localStorage.setItem('babi_current_order', JSON.stringify(order));
            }
            window.location.reload();
        }).catch(() => {
            alert("✅ Commande annulée ! Votre remboursement Wave / Orange Money a été initié.");
            window.location.reload();
        });
    }
};
