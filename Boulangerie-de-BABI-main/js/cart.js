// ================================================================
// BABI CART PAGE CONTROLLER — Synchronized with Unified Cart Actions
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    renderCartPage();
    setupDeliveryListeners();
    setupPromoCodeListener();
});

function renderCartPage() {
    const cartContainer = document.getElementById('cartContainer');
    const summaryBox = document.querySelector('.summary-box');
    const cartTitle = document.getElementById('cartTitle');
    
    const items = typeof getCartItems === 'function' ? getCartItems() : JSON.parse(localStorage.getItem('babi_cart') || '[]');

    // Header Count Update
    if (typeof updateAllBadges === 'function') {
        updateAllBadges();
    }

    if (!cartContainer) return;

    if (!items || items.length === 0) {
        cartContainer.innerHTML = `
            <div class="p-5 text-center my-3">
                <div class="mb-3" style="font-size: 3.5rem; color: #fb923c;">
                    <i class="fa-solid fa-basket-shopping"></i>
                </div>
                <h4 class="fw-bold mb-2" style="color:#2b160c;">Votre panier est vide</h4>
                <p class="text-muted mb-4 fs-6">Découvrez nos pains croustillants, viennoiseries dorées et jus frais fait maison !</p>
                <a href="produits.html" class="btn btn-warning btn-lg fw-bold px-4 py-2 rounded-pill shadow-sm" style="background:#fb923c; border:none; color:#2b160c;">
                    <i class="fa-solid fa-store me-2"></i>PARCOURIR LE CATALOGUE
                </a>
            </div>
        `;
        if (cartTitle) cartTitle.innerText = "Panier (0 article)";
        updateCartSummary(0, 0, 0, 0);
        return;
    }

    const totalQty = items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
    if (cartTitle) cartTitle.innerText = `Panier (${totalQty} article${totalQty > 1 ? 's' : ''})`;

    let html = `<div class="p-3 border-bottom bg-light fw-bold text-muted small d-none d-md-flex align-items-center">
        <div style="flex: 2;">PRODUIT</div>
        <div style="flex: 1;" class="text-center">PRIX UNITAIRE</div>
        <div style="flex: 1;" class="text-center">QUANTITÉ</div>
        <div style="flex: 1;" class="text-end me-3">TOTAL</div>
        <div style="width: 40px;"></div>
    </div>`;

    let subtotal = 0;

    items.forEach((item, index) => {
        const itemQty = item.qty || item.quantity || 1;
        const itemPrice = typeof parsePriceFromItem === 'function' ? parsePriceFromItem(item) : (item.price || item.prix || 0);
        const itemTotal = itemPrice * itemQty;
        subtotal += itemTotal;

        html += `
        <div class="cart-item-row p-3 border-bottom d-flex flex-column flex-md-row align-items-md-center gap-3">
            <div class="d-flex align-items-center gap-3" style="flex: 2;">
                <img src="${item.image || item.img}" alt="${item.name || item.title}" 
                    style="width: 65px; height: 65px; object-fit: cover; border-radius: 10px; border: 1px solid #eee;"
                    onerror="this.src='assets/product_baguette.png'">
                <div>
                    <h6 class="fw-bold mb-1" style="color: #2b160c; font-size: 0.95rem;">${item.name || item.title}</h6>
                    <small class="text-muted d-md-none">Prix : ${itemPrice.toLocaleString()} FCFA</small>
                </div>
            </div>
            
            <div style="flex: 1;" class="text-center d-none d-md-block fw-semibold text-muted">
                ${itemPrice.toLocaleString()} FCFA
            </div>
            
            <div style="flex: 1;" class="d-flex align-items-center justify-content-start justify-content-md-center gap-2">
                <button class="btn btn-outline-secondary btn-sm rounded-circle px-2 py-0" style="width:30px;height:30px;" onclick="handleQtyChange(${index}, ${itemQty - 1})">
                    <i class="fa-solid fa-minus" style="font-size:0.75rem;"></i>
                </button>
                <span class="fw-bold px-2" style="font-size:0.95rem; min-width:25px; text-align:center;">${itemQty}</span>
                <button class="btn btn-outline-secondary btn-sm rounded-circle px-2 py-0" style="width:30px;height:30px;" onclick="handleQtyChange(${index}, ${itemQty + 1})">
                    <i class="fa-solid fa-plus" style="font-size:0.75rem;"></i>
                </button>
            </div>
            
            <div style="flex: 1;" class="text-end fw-bold text-dark pe-md-2">
                ${itemTotal.toLocaleString()} <small>FCFA</small>
            </div>
            
            <div style="width: 40px;" class="text-end">
                <button class="btn btn-link text-danger p-0" onclick="handleRemoveItem(${index})" title="Supprimer">
                    <i class="fa-regular fa-trash-can fs-5"></i>
                </button>
            </div>
        </div>`;
    });

    cartContainer.innerHTML = html;

    // Delivery calculation
    let deliveryCost = 1000;
    const deliveryRadio = document.querySelector('input[name="delivery_method"]:checked');
    if (deliveryRadio && deliveryRadio.value === 'pickup') {
        deliveryCost = 0;
    }

    // Promo discount calculation
    let discount = window.appliedDiscount || 0;

    updateCartSummary(totalQty, subtotal, deliveryCost, discount);
}

function handleQtyChange(index, newQty) {
    if (typeof updateQtyInCart === 'function') {
        updateQtyInCart(index, newQty);
    } else {
        let items = JSON.parse(localStorage.getItem('babi_cart') || '[]');
        if (newQty <= 0) items.splice(index, 1);
        else items[index].quantity = newQty;
        localStorage.setItem('babi_cart', JSON.stringify(items));
    }
    renderCartPage();
}

function handleRemoveItem(index) {
    if (typeof removeFromCart === 'function') {
        removeFromCart(index);
    } else {
        let items = JSON.parse(localStorage.getItem('babi_cart') || '[]');
        items.splice(index, 1);
        localStorage.setItem('babi_cart', JSON.stringify(items));
    }
    renderCartPage();
}

function setupDeliveryListeners() {
    document.querySelectorAll('input[name="delivery_method"]').forEach(radio => {
        radio.addEventListener('change', () => {
            renderCartPage();
        });
    });
}

function setupPromoCodeListener() {
    const applyBtn = document.getElementById('applyPromoBtn');
    const promoInput = document.getElementById('promoInput');
    if (!applyBtn || !promoInput) return;

    applyBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        if (code === 'BABI10' || code === 'BABI') {
            const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;
            window.appliedDiscount = Math.round(subtotal * 0.10);
            alert(`🎉 Code promo "${code}" appliqué ! Vous bénéficiez de 10% de réduction (-${window.appliedDiscount} FCFA).`);
            renderCartPage();
        } else if (code.length > 0) {
            alert('❌ Code promo invalide ou expiré. Essayez avec le code : BABI10');
        }
    });
}

function updateCartSummary(totalQty, subtotal, deliveryCost, discount) {
    const totalValEl = document.querySelector('.total-val');
    const grandTotalEl = document.querySelector('.grand-total-val');
    const subtotalLbl = document.querySelector('.subtotal-label');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const grandTotal = Math.max(0, subtotal + deliveryCost - discount);

    if (totalValEl) totalValEl.innerText = subtotal.toLocaleString() + ' FCFA';
    if (grandTotalEl) grandTotalEl.innerText = grandTotal.toLocaleString() + ' FCFA';
    if (subtotalLbl) subtotalLbl.innerText = `Sous-total (${totalQty} article${totalQty > 1 ? 's' : ''})`;

    if (checkoutBtn) {
        if (subtotal === 0) {
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.classList.add('disabled');
        } else {
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.classList.remove('disabled');
        }
    }

    const summaryBox = document.querySelector('.summary-box');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <h5 class="fw-bold mb-3 pb-2 border-bottom" style="color:#2b160c;">
                <i class="fa-solid fa-receipt me-2 text-warning"></i>RÉSUMÉ DU PANIER
            </h5>
            
            <div class="d-flex justify-content-between mb-2 fs-6">
                <span class="text-muted">Sous-total (${totalQty} article${totalQty > 1 ? 's' : ''})</span>
                <span class="fw-bold text-dark">${subtotal.toLocaleString()} FCFA</span>
            </div>
            
            <div class="d-flex justify-content-between mb-2 fs-6 text-muted">
                <span>Livraison</span>
                <span class="fw-bold ${deliveryCost === 0 ? 'text-success' : ''}">${deliveryCost === 0 ? 'Calculée à l\'étape suivante' : deliveryCost.toLocaleString() + ' FCFA'}</span>
            </div>
            
            ${discount > 0 ? `
            <div class="d-flex justify-content-between mb-2 fs-6 text-success fw-bold">
                <span>Réduction Code Promo</span>
                <span>- ${discount.toLocaleString()} FCFA</span>
            </div>
            ` : ''}
            
            <hr class="my-3">
            
            <div class="d-flex justify-content-between mb-4">
                <span class="fw-bold fs-5" style="color:#2b160c;">Total</span>
                <span class="fw-bold fs-4 text-primary" style="color:#fb923c !important;">${grandTotal.toLocaleString()} FCFA</span>
            </div>
            
            <a href="checkout.html" class="btn btn-warning w-100 fw-bold py-3 fs-6 rounded-pill shadow ${subtotal === 0 ? 'disabled opacity-50' : ''}" 
                style="background:#fb923c; border:none; color:#2b160c;" id="checkoutBtn">
                <i class="fa-solid fa-lock me-2"></i>PASSER LA COMMANDE
            </a>
            
            <div class="mt-3 text-center text-muted small">
                <i class="fa-solid fa-shield-halved me-1 text-success"></i>Paiement sécurisé Mobile Money & Espèces
            </div>
        `;
    }
}
