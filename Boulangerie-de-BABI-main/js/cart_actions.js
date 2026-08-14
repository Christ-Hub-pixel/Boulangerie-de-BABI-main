// ================================================================
// BABI UNIFIED CART & ORDERING SYSTEM — Dual-Storage & Fault-Tolerant
// ================================================================
var CART_KEY = typeof CART_KEY !== 'undefined' ? CART_KEY : 'babi_cart_items';
var LEGACY_CART_KEY = typeof LEGACY_CART_KEY !== 'undefined' ? LEGACY_CART_KEY : 'babi_cart';

function getCartItems() {
    try {
        const primary = JSON.parse(localStorage.getItem(CART_KEY));
        if (Array.isArray(primary) && primary.length > 0) {
            return primary.map(normalizeCartItem).filter(Boolean);
        }
        const legacy = JSON.parse(localStorage.getItem(LEGACY_CART_KEY));
        if (Array.isArray(legacy) && legacy.length > 0) {
            return legacy.map(normalizeCartItem).filter(Boolean);
        }
    } catch(e) {}
    return [];
}

function parsePriceFromItem(item) {
    if (!item) return 0;
    if (typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) return item.price;
    if (typeof item.prix === 'number' && !isNaN(item.prix) && item.prix > 0) return item.prix;
    
    const rawStr = String(item.price || item.prix || '').replace(/[^0-9]/g, '');
    let p = parseInt(rawStr);
    if (!isNaN(p) && p > 0) return p;

    const title = String(item.name || item.title || '');
    const titleMatch = title.match(/\((\d+)\s*F?\)/i) || title.match(/(\d+)\s*FCFA/i) || title.match(/(\d+)\s*F/i);
    if (titleMatch && titleMatch[1]) {
        p = parseInt(titleMatch[1]);
        if (!isNaN(p) && p > 0) return p;
    }
    return 0;
}

function normalizeCartItem(item) {
    if (!item) return null;
    const name = item.name || item.title || 'Produit';
    const priceNum = parsePriceFromItem(item);
    const image = item.image || item.img || item.src || 'assets/baguette 200.png';
    const qty = parseInt(item.qty || item.quantity) || 1;
    const id = item.id || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return { id, name, title: name, price: priceNum, prix: priceNum, image, img: image, qty, quantity: qty };
}

function saveCartItems(items) {
    const cleanItems = (items || []).map(normalizeCartItem).filter(Boolean);
    localStorage.setItem(CART_KEY, JSON.stringify(cleanItems));
    localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(cleanItems));
}

function getCartCount() {
    return getCartItems().reduce((s, i) => s + (i.qty || 1), 0);
}

function getCartTotal() {
    return getCartItems().reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
}

function addToCart(product, price, image) {
    let itemObj = null;

    if (typeof product === 'string') {
        const name = product;
        const pPrice = typeof price === 'number' ? price : parseInt(price) || 0;
        const pImg = image || 'assets/product_baguette.png';
        itemObj = normalizeCartItem({ name, price: pPrice, image: pImg, qty: 1 });
    } else if (typeof product === 'object' && product !== null) {
        itemObj = normalizeCartItem(product);
    }

    if (!itemObj) return;

    let items = getCartItems();
    const existing = items.find(i => i.id === itemObj.id || i.name === itemObj.name);
    if (existing) {
        existing.qty = (existing.qty || 1) + (itemObj.qty || 1);
        existing.quantity = existing.qty;
    } else {
        items.push(itemObj);
    }

    saveCartItems(items);
    updateAllBadges();
    showAddToCartToast(itemObj);
}

function removeFromCart(productIdOrIndex) {
    let items = getCartItems();
    if (typeof productIdOrIndex === 'number' && productIdOrIndex < items.length) {
        items.splice(productIdOrIndex, 1);
    } else {
        items = items.filter(i => i.id !== productIdOrIndex && i.name !== productIdOrIndex);
    }
    saveCartItems(items);
    updateAllBadges();
}

function updateQtyInCart(productIdOrIndex, newQty) {
    let items = getCartItems();
    let item = null;
    if (typeof productIdOrIndex === 'number' && productIdOrIndex < items.length) {
        item = items[productIdOrIndex];
    } else {
        item = items.find(i => i.id === productIdOrIndex || i.name === productIdOrIndex);
    }

    if (item) {
        if (newQty <= 0) {
            items = items.filter(i => i !== item);
        } else {
            item.qty = newQty;
            item.quantity = newQty;
        }
    }
    saveCartItems(items);
    updateAllBadges();
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(LEGACY_CART_KEY);
    updateAllBadges();
}

// ---- Badge & Dropdown ----
function updateAllBadges() {
    const count = getCartCount();
    document.querySelectorAll('.cart-badge, .badge.bg-danger.cart-count, .cart-count').forEach(badge => {
        badge.innerText = count;
        badge.style.display = count <= 0 ? 'none' : 'inline-block';
        if (count > 0) {
            badge.classList.remove('badge-pop');
            void badge.offsetWidth;
            badge.classList.add('badge-pop');
        }
    });
    renderCartDropdown();
}

function renderCartDropdown() {
    const items = getCartItems();
    const body = document.getElementById('cartDropdownBody');
    const footer = document.getElementById('cartDropdownFooter');
    const emptyMsg = document.getElementById('cartEmptyMsg');
    const totalEl = document.getElementById('dropdownTotal');
    if (!body) return;

    body.querySelectorAll('.dropdown-item-row').forEach(el => el.remove());

    if (items.length === 0) {
        if (emptyMsg) emptyMsg.style.display = '';
        if (footer) footer.style.display = 'none';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (footer) footer.style.display = '';

    items.slice(0, 4).forEach(item => {
        const row = document.createElement('div');
        row.className = 'dropdown-item-row d-flex align-items-center gap-2 py-2 border-bottom';
        row.innerHTML = `
            <img src="${item.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid #eee;" onerror="this.src='assets/product_baguette.png'" alt="${item.name}">
            <div class="flex-grow-1 lh-sm">
                <div style="font-size:0.82rem;font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#2b160c;">${item.name}</div>
                <div style="font-size:0.75rem;color:#666;">Qté: ${item.qty}</div>
            </div>
            <div style="font-size:0.85rem;font-weight:700;white-space:nowrap;color:#2b160c;">${(item.price * item.qty).toLocaleString()} FCFA</div>
        `;
        body.appendChild(row);
    });

    if (items.length > 4) {
        const more = document.createElement('div');
        more.className = 'dropdown-item-row text-center text-muted py-1';
        more.style.fontSize = '0.75rem';
        more.innerText = `+ ${items.length - 4} autre(s) article(s)`;
        body.appendChild(more);
    }
    if (totalEl) totalEl.innerText = getCartTotal().toLocaleString() + ' FCFA';
}

// ---- Toast Notification ----
function showAddToCartToast(product) {
    let tc = document.querySelector('.toast-container');
    if (!tc) {
        tc = document.createElement('div');
        tc.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        tc.style.zIndex = '99999';
        document.body.appendChild(tc);
    }
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-dark border-0 show shadow-lg mb-2 rounded-3';
    toast.style.cssText = 'display:flex;align-items:center;padding:12px 16px;gap:12px;background:#2b160c !important;color:#fff;';
    toast.innerHTML = `
        <img src="${product.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid #ffc107;" onerror="this.src='assets/product_baguette.png'" alt="">
        <div style="flex:1;">
            <div style="font-size:0.85rem;font-weight:700;color:#ffc107;">✅ Ajouté au panier !</div>
            <div style="font-size:0.77rem;color:#f8f9fa;">${product.name} — ${(product.price * (product.qty || 1)).toLocaleString()} FCFA</div>
        </div>
        <a href="cart.html" class="btn btn-sm btn-warning text-dark fw-bold px-3 py-1 rounded-pill" style="font-size:0.75rem;white-space:nowrap;flex-shrink:0;">Voir le panier →</a>
    `;
    tc.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ---- Auto Setup Add-to-Cart Buttons ----
document.addEventListener('DOMContentLoaded', () => {
    updateAllBadges();
    setupAddToCartGlobalDelegation();
});

function setupAddToCartGlobalDelegation() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn, .btn-add, .btn-add-to-cart');
        if (!btn) return;

        // If onclick attribute is already handled inline in HTML, skip double delegation
        if (btn.hasAttribute('onclick') && btn.getAttribute('onclick').includes('addToCart')) {
            return;
        }

        e.preventDefault();
        const card = btn.closest('.card, .product-card, [class*="col"]');
        if (!card) return;

        const nameEl = card.querySelector('.card-title, h4, h5, h6');
        const name = nameEl ? nameEl.innerText.trim() : 'Produit';

        const priceEl = card.querySelector('.fw-bold.text-dark, .price, [data-price]');
        let price = 0;
        if (priceEl && priceEl.dataset.price) {
            price = parseInt(priceEl.dataset.price);
        } else if (priceEl) {
            const m = priceEl.innerText.match(/[\d\s]+/);
            price = m ? parseInt(m[0].replace(/\s/g, '')) : 0;
        }

        const imgEl = card.querySelector('img');
        const image = imgEl ? (imgEl.getAttribute('src') || 'assets/product_baguette.png') : 'assets/product_baguette.png';

        addToCart(name, price, image);
    });
}
