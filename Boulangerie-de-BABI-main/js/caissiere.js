// -------------------------------------------------------------
// 🥐 BABI POS CAISSIÈRE — TERMINAL TACTILE & GESTION RETRAITS
// -------------------------------------------------------------

const API_ROOT = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';

let posProducts = [];
let posCart = [
    { id: 'baguette', name: 'Baguette Tradition', price: 200, qty: 2, image: 'assets/baguette 200.png' },
    { id: 'croissant', name: 'Croissant Pur Beurre', price: 350, qty: 1, image: 'assets/Croissant.png' }
];
let currentCategory = 'all';
let currentCashDue = 0;
let currentReceiptData = null;
let livePickups = [];
let currentPinInput = '';
let isApiReachable = false;

const FALLBACK_POS_PRODUCTS = [
    { id: 'baguette', name: 'Baguette Tradition', price: 200, category: 'pains', image: 'assets/baguette 200.png', stock: 42 },
    { id: 'croissant', name: 'Croissant Pur Beurre', price: 350, category: 'viennoiseries', image: 'assets/Croissant.png', stock: 28 },
    { id: 'pain_choc', name: 'Pain au Chocolat', price: 400, category: 'viennoiseries', image: 'assets/pain au chocolat.png', stock: 24 },
    { id: 'croissant_amande', name: 'Croissant aux Amandes', price: 500, category: 'viennoiseries', image: 'assets/Croissant.png', stock: 15 },
    { id: 'pain_raisin', name: 'Pain aux Raisins', price: 450, category: 'viennoiseries', image: 'assets/pain au raisin.png', stock: 18 },
    { id: 'chausson_pommes', name: 'Chausson aux Pommes', price: 450, category: 'viennoiseries', image: 'assets/chausson aux pommes.png', stock: 14 },
    { id: 'foret_noire', name: 'Forêt Noire Royale', price: 1500, category: 'patisseries', image: 'assets/product_foret_noire.png', stock: 8 },
    { id: 'fondant', name: 'Fondant au Chocolat', price: 800, category: 'patisseries', image: 'assets/Fondant au Chocolat.png', stock: 15 },
    { id: 'eclair_choc', name: 'Éclair au Chocolat', price: 700, category: 'patisseries', image: 'assets/choco suisse.png', stock: 20 },
    { id: 'tarte_citron', name: 'Tarte au Citron Meringuée', price: 1200, category: 'patisseries', image: 'assets/Gateau1.png', stock: 10 },
    { id: 'mille_feuille', name: 'Mille-feuille Vanille', price: 1000, category: 'patisseries', image: 'assets/cake.png', stock: 12 },
    { id: 'bissap', name: 'Jus de Bissap Artisanal', price: 600, category: 'boissons', image: 'assets/jus de bissap.png', stock: 35 },
    { id: 'gingembre', name: 'Jus de Gingembre Frais', price: 600, category: 'boissons', image: 'assets/jus de gingembre.png', stock: 30 },
    { id: 'cappuccino', name: 'Cappuccino Moka', price: 1000, category: 'boissons', image: 'assets/product_cappuccino.png', stock: 50 },
    { id: 'espresso', name: 'Espresso Pur Arabica', price: 800, category: 'boissons', image: 'assets/Chocolat Chaud.png', stock: 60 },
    { id: 'sandwich', name: 'Sandwich Poulet Braisé', price: 1500, category: 'traiteur', image: 'assets/product_sandwich.png', stock: 12 },
    { id: 'quiche_lorraine', name: 'Quiche Lorraine Dorée', price: 1200, category: 'traiteur', image: 'assets/Panini.png', stock: 16 }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Clear any obsolete service worker cache if quota was exceeded
    if ('caches' in window) {
        caches.keys().then(keys => {
            keys.forEach(key => {
                if (key !== 'babi-bakery-v7') caches.delete(key);
            });
        }).catch(() => {});
    }

    loadPosProducts();
    renderPosCart();
    refreshPickupQueue();
    updateSessionStats();
    renderHistoryTable();
    setInterval(updateClock, 1000);
    
    // Instant sync across tabs when orders are placed
    window.addEventListener('storage', (e) => {
        if (e.key === 'babi_orders') {
            refreshPickupQueue();
            updateSessionStats();
            renderHistoryTable();
        }
    });
    schedulePickupPolling();
});

function schedulePickupPolling() {
    setTimeout(async () => {
        await refreshPickupQueue();
        schedulePickupPolling();
    }, 20000);
}

// Live Clock
function updateClock() {
    const clockEl = document.getElementById('pos-live-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// POS Audio Synthesizer
function playPosAudio(type = 'beep') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'beep') {
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.25); // C6
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.28);
        } else if (type === 'error') {
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (_) {}
}

// -------------------------------------------------------------
// 1. NAVIGATION & VIEW SWITCHING
// -------------------------------------------------------------
function showPosView(viewName) {
    // Nav links active state
    document.querySelectorAll('.prestige-nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-pos-${viewName}`);
    if (activeNav) activeNav.classList.add('active');

    // Main views toggle
    document.querySelectorAll('.pos-main-view').forEach(v => v.classList.add('hidden'));
    const targetView = document.getElementById(`pos-view-${viewName}`);
    if (targetView) targetView.classList.remove('hidden');

    if (viewName === 'pickups') {
        refreshPickupQueue();
    } else if (viewName === 'history') {
        renderHistoryTable();
    }
}

const realPosProductImages = {
    "Chill": "assets/chill.png",
    "Youyou": "assets/youzou.png",
    "Word Cola": "assets/world cola.png",
    "Youki Orange": "assets/youki moka cafe.png",
    "Youki Pomme": "assets/youki pomme.png",
    "Énergie Malt": "assets/energie malt .png",
    "Energie Malt": "assets/energie malt .png",
    "Orangina": "assets/Orangina.png",
    "Sprite": "assets/sprite.png",
    "Jus Naturel (Petit)": "assets/Jus Naturel (Petit).png",
    "Jus Naturel (Petit Format)": "assets/Jus Naturel (Petit).png",
    "Jus Naturel (Moyen)": "assets/Jus Naturel (Moyen).png",
    "Jus Naturel (Moyen Format)": "assets/Jus Naturel (Moyen).png",
    "Jus Naturel (Grand)": "assets/Jus Naturel (Grand).png",
    "Jus Naturel (Bouteille 1.5L)": "assets/Jus Naturel (Grand).png",
    "Eau Minérale (Petite)": "assets/bouteille celeste.png",
    "Eau Minérale (Grande)": "assets/bouteille celeste.png",
    "Dégué": "assets/jus de bissap.png",
    "Passion (Grand Format)": "assets/jus de passion.png",
    "Passion (Petite Bouteille)": "assets/jus de passion.png",
    "Baobab": "assets/jus de baobab.png",
    "Baobab (Petit)": "assets/jus de baobab petit.png",
    "Bissap": "assets/jus de bissap.png",
    "Gingembre": "assets/jus de gingembre.png",
    "Tamarin": "assets/jus de tamari.png",
    "Cocktail": "assets/cocktail.png",
    "Citron": "assets/jus de citron.png",
    "Chocolat Chaud": "assets/Chocolat Chaud.png",
    "Baguette 150": "assets/baguette 150.png",
    "Baguette 200": "assets/baguette 200.png",
    "Baguette Tradition": "assets/baguette 200.png",
    "Ficelle": "assets/baguette 150.png",
    "Pain Complet (Grand)": "assets/Pain Complet (Grand).png",
    "Pain Complet (Petit)": "assets/pain complet 2.png",
    "Pain Sans Sel": "assets/pain sans sel.png",
    "Petit Pain (50F)": "assets/pain individuel.png",
    "Petit Pain (100F)": "assets/pain individuel.png",
    "Biscotte": "assets/biscottes.png",
    "Charaphe au Raisin": "assets/charaphe au raisin.png",
    "Chausson aux Pommes": "assets/chausson aux pommes.png",
    "Choco Suisse": "assets/choco suisse.png",
    "Cookies (l'unité)": "assets/cookies.png",
    "Lot de Cookies": "assets/cookies.png",
    "Croissant": "assets/Croissant.png",
    "Croissant Pur Beurre": "assets/Croissant.png",
    "Flan": "assets/Flan.png",
    "Pain au Chocolat": "assets/pain au chocolat.png",
    "Pain aux Raisins": "assets/pain au raisin.png",
    "Palmiers": "assets/palmier.png",
    "Torsade": "assets/torsade.png",
    "Madeleine": "assets/madeleine unite.png",
    "Madeleines (l'unité)": "assets/madeleine unite.png",
    "Lot de Madeleines": "assets/lots de madeleine.png",
    "Gâteau (10 000F)": "assets/Gateau1.png",
    "Gâteau (15 000F)": "assets/Gateau1.1.png",
    "Gâteau (20 000F)": "assets/Gateau1.2.png",
    "Gâteau (25 000F)": "assets/gateau2.png",
    "Gâteau de Mariage": "assets/gateau de mariiage.png",
    "Bûche de Noël (7000F)": "assets/buche de noel.png",
    "Bûche de Noël (5000F)": "assets/buche de noel.png",
    "Moka": "assets/moka1.png",
    "Cup Cake": "assets/moka1.1.png",
    "Cake (300F)": "assets/cake.png",
    "Cake (700F)": "assets/cake1.png",
    "Crêpe au Nutella": "assets/crepe au nutella.png",
    "Crêpe à la Vanille": "assets/crepe a la vanille.png",
    "Crêpe Suzette": "assets/Crêpe Suzette.png",
    "Fondant au Chocolat": "assets/Fondant au Chocolat.png",
    "Glace": "assets/glace.png",
    "Pain Cabré": "assets/cabre.png",
    "Pain Marbré": "assets/marbre.png",
    "Pain Amour": "assets/pain complet.png",
    "Pain Canadien": "assets/pain complet 3.png",
    "Pain de Mie": "assets/pain de mie.png",
    "Pain Parisien": "assets/baguette 150.png",
    "Suzette": "assets/pain individuel.png"
};

function resolveProductImage(name, rawImage, category) {
    if (realPosProductImages[name]) return realPosProductImages[name];
    for (const [k, v] of Object.entries(realPosProductImages)) {
        if (name && name.toLowerCase().includes(k.toLowerCase())) return v;
    }
    if (rawImage && (rawImage.endsWith('.png') || rawImage.endsWith('.jpg') || rawImage.endsWith('.jpeg'))) {
        return rawImage;
    }
    const cat = (category || '').toLowerCase();
    if (cat.includes('boisson') || cat.includes('jus')) return 'assets/jus de baobab.png';
    if (cat.includes('viennois')) return 'assets/Croissant.png';
    if (cat.includes('patiss') || cat.includes('pâtiss')) return 'assets/Gateau1.png';
    if (cat.includes('traiteur') || cat.includes('snack')) return 'assets/Pizza.png';
    return 'assets/baguette 200.png';
}

// -------------------------------------------------------------
// 2. PRODUCT CATALOG & SEARCH
// -------------------------------------------------------------
async function loadPosProducts() {
    try {
        const res = await fetch('data/products.json');
        if (res.ok) {
            const data = await res.json();
            const productList = Array.isArray(data) ? data : (data.products || []);
            if (productList.length > 0) {
                posProducts = productList.map(p => {
                    const pName = p.nom || p.name;
                    const pCat = (p.categorie || p.category || 'pains').toLowerCase();
                    return {
                        id: p.id || p._id || pName,
                        name: pName,
                        price: p.prix || p.price,
                        category: pCat,
                        image: resolveProductImage(pName, p.image, pCat),
                        stock: p.stock !== undefined ? p.stock : 30
                    };
                });
                renderPosProductsGrid();
                return;
            }
        }
    } catch (_) {}

    posProducts = FALLBACK_POS_PRODUCTS.map(p => ({
        ...p,
        image: resolveProductImage(p.name, p.image, p.category)
    }));
    renderPosProductsGrid();
}

function filterPosCategory(cat, btn) {
    currentCategory = cat.toLowerCase();
    document.querySelectorAll('.category-filter-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-surface', 'text-on-surface');
    });
    if (btn) {
        btn.classList.remove('bg-surface', 'text-on-surface');
        btn.classList.add('bg-primary', 'text-on-primary');
    }
    renderPosProductsGrid();
}

function filterPosProducts(term) {
    renderPosProductsGrid(term);
}

function renderPosProductsGrid(searchTerm = '') {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    const term = (searchTerm || document.getElementById('pos-product-search')?.value || '').toLowerCase().trim();

    const filtered = posProducts.filter(p => {
        const cat = (p.category || '').toLowerCase();
        let matchesCat = (currentCategory === 'all');
        if (!matchesCat) {
            if (currentCategory === 'pains') matchesCat = cat.includes('pain') || cat.includes('baguette');
            else if (currentCategory === 'viennoiseries') matchesCat = cat.includes('viennois') || cat.includes('croissant') || cat.includes('chocolat') || cat.includes('chausson');
            else if (currentCategory === 'patisseries') matchesCat = cat.includes('patiss') || cat.includes('pâtiss') || cat.includes('gateau') || cat.includes('gâteau') || cat.includes('fondant') || cat.includes('eclair') || cat.includes('tarte') || cat.includes('mille');
            else if (currentCategory === 'boissons') matchesCat = cat.includes('boisson') || cat.includes('jus') || cat.includes('cafe') || cat.includes('café') || cat.includes('cappuccino');
            else if (currentCategory === 'traiteur') matchesCat = cat.includes('traiteur') || cat.includes('snack') || cat.includes('sandwich') || cat.includes('quiche') || cat.includes('pizza');
            else matchesCat = (cat === currentCategory);
        }

        const matchesName = (p.name || '').toLowerCase().includes(term);
        return matchesCat && matchesName;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl opacity-30 mb-2">search_off</span>
                <p class="font-bold text-sm">Aucun produit ne correspond à cette recherche.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <button onclick="addToPosCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')" class="pos-product-item flex flex-col rounded-2xl overflow-hidden group relative text-left">
            <div class="aspect-[4/3] w-full relative overflow-hidden pos-product-img-box">
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='assets/Croissant.png';"/>
                <div class="pos-price-badge-vip absolute top-2 right-2 px-2.5 py-0.5 rounded-lg font-mono text-[11px] sm:text-xs font-black">${p.price.toLocaleString()} F</div>
            </div>
            <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-1.5 bg-white">
                <h3 class="font-headline-sm text-xs sm:text-[13.5px] font-extrabold text-[#1a0c06] line-clamp-1 leading-snug tracking-tight">${p.name}</h3>
                <div class="flex items-center justify-between text-[10.5px] sm:text-[11px] text-[#786558] font-semibold pt-1 border-t border-[rgba(212,175,55,0.15)]">
                    <span class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Stock : <strong class="text-[#765b00] font-mono">${p.stock || 30}</strong>
                    </span>
                    <div class="w-6 h-6 rounded-full bg-[#fbf8f1] border border-[#f5b800]/50 text-[#765b00] flex items-center justify-center group-hover:bg-[#f5b800] group-hover:text-black transition-all shadow-sm">
                        <span class="material-symbols-outlined text-sm font-bold">add</span>
                    </div>
                </div>
            </div>
        </button>
    `).join('');
}

// -------------------------------------------------------------
// 3. POS CART LOGIC
// -------------------------------------------------------------
function addToPosCart(id, name, price, img) {
    playPosAudio('beep');
    const existing = posCart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        posCart.push({ id, name, price: parseInt(price, 10), qty: 1, image: img || 'assets/baguette 200.png' });
    }
    renderPosCart();
}

function updatePosItemQty(id, delta) {
    const item = posCart.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        posCart = posCart.filter(i => i.id !== id);
    }
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    renderPosCart();
}

function renderPosCart() {
    const cartContainer = document.getElementById('pos-cart-items');
    const mobileCartContainer = document.getElementById('mobile-pos-cart-items');
    const floatingCart = document.getElementById('pos-mobile-floating-cart');
    const topbarCartBadge = document.getElementById('mobile-topbar-cart-badge');
    const bottomTabCartBadge = document.getElementById('mobile-tab-cart-badge');
    const floatingCount = document.getElementById('mobile-floating-count');
    const floatingTotal = document.getElementById('mobile-floating-total');
    const mobileTotalEl = document.getElementById('mobile-pos-total');

    const totalItemCount = posCart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tva = Math.round(subtotal * 0.055);
    const total = subtotal;

    // Update Badges
    if (topbarCartBadge) topbarCartBadge.innerText = totalItemCount;
    if (bottomTabCartBadge) bottomTabCartBadge.innerText = totalItemCount;
    if (floatingCount) floatingCount.innerText = totalItemCount;
    if (floatingTotal) floatingTotal.innerText = total.toLocaleString() + ' FCFA';
    if (mobileTotalEl) mobileTotalEl.innerText = total.toLocaleString() + ' FCFA';

    // Show or hide floating cart on mobile
    if (floatingCart) {
        if (posCart.length > 0) {
            floatingCart.classList.remove('hidden');
        } else {
            floatingCart.classList.add('hidden');
        }
    }

    if (posCart.length === 0) {
        const emptyHtml = `
            <div class="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/60 my-auto">
                <span class="material-symbols-outlined text-4xl mb-2 text-outline-variant">shopping_cart</span>
                <p class="text-xs font-bold">Le ticket est vide.</p>
                <p class="text-[11px] text-muted">Touchez un article pour l'ajouter.</p>
            </div>
        `;
        if (cartContainer) cartContainer.innerHTML = emptyHtml;
        if (mobileCartContainer) mobileCartContainer.innerHTML = emptyHtml;

        if (document.getElementById('pos-subtotal')) document.getElementById('pos-subtotal').innerText = '0 FCFA';
        if (document.getElementById('pos-tva')) document.getElementById('pos-tva').innerText = '0 FCFA';
        if (document.getElementById('pos-total')) document.getElementById('pos-total').innerText = '0 FCFA';
        return;
    }

    const itemsHtml = posCart.map(item => {
        const lineTotal = item.price * item.qty;
        return `
            <div class="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20">
                <div class="flex flex-col flex-1 pr-2">
                    <span class="font-body-md text-xs text-on-surface font-bold line-clamp-1">${item.name}</span>
                    <span class="font-label-sm text-[11px] text-on-surface-variant font-mono">${item.price.toLocaleString()} F / u</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-surface-container rounded-full p-0.5 border border-outline-variant/30">
                        <button onclick="updatePosItemQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface text-on-surface font-black transition-all">-</button>
                        <span class="font-label-md text-xs font-bold w-6 text-center font-mono">${item.qty}</span>
                        <button onclick="updatePosItemQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface text-on-surface font-black transition-all">+</button>
                    </div>
                    <span class="font-label-md text-xs font-extrabold text-on-surface text-right w-14 font-mono">${lineTotal.toLocaleString()} F</span>
                </div>
            </div>
        `;
    }).join('');

    if (cartContainer) cartContainer.innerHTML = itemsHtml;
    if (mobileCartContainer) mobileCartContainer.innerHTML = itemsHtml;

    if (document.getElementById('pos-subtotal')) document.getElementById('pos-subtotal').innerText = (subtotal - tva).toLocaleString() + ' FCFA';
    if (document.getElementById('pos-tva')) document.getElementById('pos-tva').innerText = tva.toLocaleString() + ' FCFA';
    if (document.getElementById('pos-total')) document.getElementById('pos-total').innerText = total.toLocaleString() + ' FCFA';
}

// Mobile drawer & sidebar helpers
function toggleMobileSidebar(forceState) {
    const sidebar = document.querySelector('.prestige-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    
    const isOpen = (typeof forceState === 'boolean') ? forceState : !sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.add('hidden');
    }
}

function openMobileCart() {
    const drawer = document.getElementById('pos-mobile-cart-drawer');
    if (drawer) drawer.classList.remove('hidden');
}

function closeMobileCart() {
    const drawer = document.getElementById('pos-mobile-cart-drawer');
    if (drawer) drawer.classList.add('hidden');
}

function setActiveMobileTab(btn) {
    document.querySelectorAll('.pos-mobile-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

// -------------------------------------------------------------
// 4. CHECKOUT & CASH CALCULATOR
// -------------------------------------------------------------
function checkoutPos(method) {
    if (posCart.length === 0) {
        alert("Le ticket est vide. Veuillez sélectionner au moins un article.");
        return;
    }

    const total = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    if (method === 'especes') {
        currentCashDue = total;
        document.getElementById('cash-modal-due').innerText = total.toLocaleString() + ' FCFA';
        document.getElementById('cash-given-input').value = total;
        calculateChange();
        document.getElementById('cashModal').classList.remove('hidden');
        return;
    }

    // Process Wave / Mobile Money directly
    finalizeSale('Wave / Mobile Money', total, total, 0);
}

function closeCashModal() {
    document.getElementById('cashModal').classList.add('hidden');
}

function setCashGiven(amount) {
    document.getElementById('cash-given-input').value = amount;
    calculateChange();
}

function calculateChange() {
    const given = parseFloat(document.getElementById('cash-given-input').value) || 0;
    const change = Math.max(0, given - currentCashDue);
    const box = document.getElementById('cash-change-box');
    const amountEl = document.getElementById('cash-change-amount');

    amountEl.innerText = change.toLocaleString() + ' FCFA';

    if (given < currentCashDue) {
        box.style.background = '#fee2e2';
        box.style.borderColor = '#fca5a5';
        amountEl.innerText = `Reste ${(currentCashDue - given).toLocaleString()} F`;
        amountEl.style.color = '#dc2626';
    } else {
        box.style.background = '#dcfce7';
        box.style.borderColor = '#86efac';
        amountEl.style.color = '#166534';
    }
}

function confirmCashPayment() {
    const given = parseFloat(document.getElementById('cash-given-input').value) || 0;
    if (given < currentCashDue) {
        alert(`⚠️ Montant insuffisant. Le total à régler est de ${currentCashDue.toLocaleString()} FCFA.`);
        return;
    }

    const change = given - currentCashDue;
    closeCashModal();
    finalizeSale('Espèces (Cash)', currentCashDue, given, change);
}

function finalizeSale(methodLabel, total, given = null, change = 0) {
    playPosAudio('success');

    const ticketId = 'POS-' + Math.floor(1000 + Math.random() * 9000);
    const cashierName = 'Awa Kouassi';
    const orderData = {
        id: ticketId,
        customer_name: 'Client Comptoir',
        customer_phone: 'En boutique',
        items: [...posCart],
        items_summary: posCart.map(i => `${i.qty}x ${i.name}`).join(', '),
        total_price: total,
        total_amount: total,
        mode_paiement: methodLabel,
        montant_recu: given !== null ? given : total,
        monnaie_rendue: change,
        status: 'recupere',
        caissiere: cashierName,
        created_at: new Date().toISOString()
    };

    // Save in localStorage babi_orders
    const savedOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    savedOrders.unshift(orderData);
    localStorage.setItem('babi_orders', JSON.stringify(savedOrders));

    // Clear cart and show thermal receipt
    clearPosCart();
    updateSessionStats();
    renderHistoryTable();
    showThermalReceipt(orderData);

    // Increment ticket number on top
    const ticketEl = document.getElementById('ticket-number');
    if (ticketEl) {
        const num = parseInt(ticketEl.innerText.replace('#', ''), 10) + 1;
        ticketEl.innerText = '#' + num;
    }
}

// -------------------------------------------------------------
// 5. THERMAL RECEIPT 80mm
// -------------------------------------------------------------
function showThermalReceipt(data) {
    const receiptContainer = document.getElementById('thermal-receipt-content');
    if (!receiptContainer) return;

    const dateStr = new Date(data.created_at || Date.now()).toLocaleDateString('fr-FR');
    const timeStr = new Date(data.created_at || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let itemsHtml = '';
    (data.items || []).forEach(item => {
        const lineTotal = (item.price || item.prix || 0) * (item.qty || item.quantity || 1);
        itemsHtml += `
            <div style="display:flex; justify-content:space-between; margin-bottom: 3px;">
                <span>${item.qty || item.quantity || 1}x ${(item.name || item.nom || '').substring(0, 19)}</span>
                <span style="font-weight: bold;">${lineTotal.toLocaleString()} F</span>
            </div>
        `;
    });

    receiptContainer.innerHTML = `
        <div style="text-align: center; border-bottom: 1.5px dashed #333; padding-bottom: 8px; margin-bottom: 8px;">
            <div style="font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">BOULANGERIE DE BABI 🥐</div>
            <div style="font-size: 11px;">Plateau, Boulevard Lagunaire, Abidjan</div>
            <div style="font-size: 11px;">Tél : +225 07 04 38 92 01</div>
        </div>

        <div style="margin-bottom: 8px; font-size: 11px; line-height: 1.4;">
            <div><strong>TICKET N° :</strong> #${data.id}</div>
            <div><strong>DATE :</strong> ${dateStr} à ${timeStr}</div>
            <div><strong>CAISSE :</strong> Caisse Principale 1</div>
            <div><strong>OPÉRATEUR :</strong> ${data.caissiere || 'Awa Kouassi'}</div>
        </div>

        <div style="border-top: 1.5px dashed #333; border-bottom: 1.5px dashed #333; padding: 6px 0; margin-bottom: 8px;">
            ${itemsHtml || `<div>${data.items_summary || 'Articles boulangerie'}</div>`}
        </div>

        <div style="font-size: 12px; margin-bottom: 6px; line-height: 1.4;">
            <div style="display:flex; justify-content:space-between; font-size: 14px; font-weight: 900;">
                <span>TOTAL TTC :</span>
                <span>${(data.total_price || data.total_amount || 0).toLocaleString()} FCFA</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size: 11px; margin-top: 4px;">
                <span>Mode : ${data.mode_paiement || 'Espèces'}</span>
                <span>Reçu : ${(data.montant_recu || data.total_price || data.total_amount || 0).toLocaleString()} F</span>
            </div>
            ${(data.monnaie_rendue && data.monnaie_rendue > 0) ? `
            <div style="display:flex; justify-content:space-between; font-size: 11px; font-weight: bold; color: #166534;">
                <span>Monnaie Rendue :</span>
                <span>${data.monnaie_rendue.toLocaleString()} FCFA</span>
            </div>` : ''}
        </div>

        <div style="text-align: center; border-top: 1.5px dashed #333; padding-top: 8px; margin-top: 8px; font-size: 10px;">
            <div>Merci de votre confiance et bonne dégustation !</div>
            <div style="font-size: 9px; margin-top: 3px; font-family: monospace;">|||| | ||||| ||| |||| || ||||||||| |||</div>
        </div>
    `;

    document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.add('hidden');
}

// -------------------------------------------------------------
// 6. TACTILE NUMERIC PIN KEYPAD & RETRAIT CLICK & COLLECT
// -------------------------------------------------------------
function openPinModal(prefilledPin = '') {
    currentPinInput = prefilledPin;
    updatePinDisplay();
    const resultBox = document.getElementById('pin-verify-result-box');
    if (resultBox) {
        resultBox.classList.add('hidden');
        resultBox.innerHTML = '';
    }
    document.getElementById('pinModal').classList.remove('hidden');
}

function closePinModal() {
    document.getElementById('pinModal').classList.add('hidden');
    currentPinInput = '';
    updatePinDisplay();
}

function appendPinDigit(digit) {
    if (currentPinInput.length < 4) {
        currentPinInput += digit;
        updatePinDisplay();
        playPosAudio('beep');
        if (currentPinInput.length === 4) {
            // Auto lookup when 4 digits are completed
            previewPinOrder(currentPinInput);
        }
    }
}

function clearPinInput() {
    currentPinInput = '';
    updatePinDisplay();
    const resultBox = document.getElementById('pin-verify-result-box');
    if (resultBox) resultBox.classList.add('hidden');
}

function updatePinDisplay() {
    const input = document.getElementById('input-pin-code');
    if (input) {
        input.value = currentPinInput;
    }
}

async function previewPinOrder(pin) {
    const resultBox = document.getElementById('pin-verify-result-box');
    if (!resultBox) return;

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <div class="p-3 bg-surface-container rounded-2xl text-center text-xs text-on-surface-variant font-bold">
            <span class="material-symbols-outlined text-xl animate-spin align-middle mr-1 text-primary">sync</span> Recherche de la commande #${pin}...
        </div>
    `;

    try {
        // Try API lookup
        const res = await fetch(`${API_ROOT}/api/pickup/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            renderPinPreviewSuccess(data, pin);
            return;
        }
    } catch (_) {}

    // Fallback: search in local storage orders
    const localOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    const matched = localOrders.find(o => String(o.code_pin || o.pin || '') === String(pin));

    if (matched) {
        renderPinPreviewSuccess({
            orderId: matched.id,
            customerName: matched.customer_name || 'Client Web',
            customerPhone: matched.customer_phone || '',
            totalAmount: matched.total_price || matched.total_amount || 0,
            itemsSummary: matched.items_summary || 'Articles',
            isPaid: true
        }, pin);
    } else {
        resultBox.innerHTML = `
            <div class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold">
                ⚠️ Aucun retrait actif pour le code PIN <strong>#${pin}</strong>.
            </div>
        `;
        playPosAudio('error');
    }
}

function renderPinPreviewSuccess(order, pin) {
    const resultBox = document.getElementById('pin-verify-result-box');
    if (!resultBox) return;

    resultBox.innerHTML = `
        <div class="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-sm text-xs">
            <div class="flex items-center justify-between mb-1.5">
                <span class="font-extrabold text-emerald-900 text-sm">Commande #${order.orderId}</span>
                <span class="bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px]">🟢 PAYÉ WAVE</span>
            </div>
            <p class="text-emerald-950 font-bold mb-1">👤 Client : <strong>${order.customerName}</strong> (${order.customerPhone || 'Abidjan'})</p>
            <p class="text-emerald-800 mb-2 font-mono">📦 <strong>Articles :</strong> ${order.itemsSummary || 'Articles'}</p>
            <div class="flex justify-between items-center pt-2 border-t border-emerald-200">
                <span class="font-bold text-emerald-900">Total : ${order.totalAmount.toLocaleString()} FCFA</span>
                <button onclick="confirmOrderPickup('${order.orderId}', '${pin}')" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow transition-all">
                    ✓ Valider Remise Client
                </button>
            </div>
        </div>
    `;
    playPosAudio('beep');
}

async function verifyPickupPinDirect() {
    if (!currentPinInput || currentPinInput.length < 4) {
        alert("Veuillez saisir les 4 chiffres du code PIN.");
        return;
    }
    previewPinOrder(currentPinInput);
}

async function confirmOrderPickup(orderId, pin) {
    try {
        await fetch(`${API_ROOT}/api/pickup/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                pin: pin,
                cashier_name: 'Awa Kouassi'
            })
        });
    } catch (_) {}

    // Update localStorage order status
    const localOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    const idx = localOrders.findIndex(o => String(o.id) === String(orderId) || String(o.code_pin) === String(pin));
    if (idx !== -1) {
        localOrders[idx].status = 'recupere';
        localStorage.setItem('babi_orders', JSON.stringify(localOrders));
    }

    playPosAudio('success');
    alert(`🎉 Commande #${orderId} remise avec succès au client !`);
    closePinModal();
    refreshPickupQueue();
    renderHistoryTable();
}

// -------------------------------------------------------------
// 7. LIVE PICKUP QUEUE
// -------------------------------------------------------------
async function refreshPickupQueue() {
    let orders = [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${API_ROOT}/api/orders/pickup-queue`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            isApiReachable = true;
            const data = await res.json();
            if (data.orders) orders = data.orders;
        } else {
            isApiReachable = false;
        }
    } catch (_) {
        isApiReachable = false;
    }

    // Merge with local orders
    const localOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    const localPending = localOrders.filter(o => o.status !== 'recupere' && o.status !== 'PICKED_UP');
    
    // Combine and deduplicate
    const combined = [...orders, ...localPending];
    const uniqueOrders = Array.from(new Map(combined.map(o => [o.id, o])).values());
    livePickups = uniqueOrders;

    // Update Badge Count
    const badge = document.getElementById('pickup-badge-count');
    if (badge) badge.innerText = livePickups.length;

    renderPickupCards();
}

function renderPickupCards() {
    const container = document.getElementById('pos-pickup-cards-container');
    if (!container) return;

    if (livePickups.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/30">
                <span class="material-symbols-outlined text-5xl text-amber-500 opacity-40 mb-2">takeout_dining</span>
                <p class="font-bold text-base text-on-surface">Toutes les commandes ont été retirées !</p>
                <p class="text-xs text-on-surface-variant">Les nouvelles commandes Click & Collect apparaîtront ici automatiquement.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = livePickups.map(o => {
        const pin = o.pin_code || o.code_pin || '7412';
        const total = o.total_price || o.total_amount || 0;
        return `
            <div class="p-4 bg-surface rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3 hover:border-primary transition-all">
                <div class="flex items-center justify-between">
                    <span class="font-mono font-extrabold text-xs text-primary">#${o.id}</span>
                    <span class="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">key</span> PIN: ${pin}
                    </span>
                </div>
                <div>
                    <h4 class="font-extrabold text-sm text-on-surface line-clamp-1">${o.customer_name || 'Client Web'}</h4>
                    <p class="text-[11px] text-on-surface-variant">${o.customer_phone || 'En attente au comptoir'}</p>
                    <div class="p-2 bg-surface-container-high rounded-xl text-xs text-on-surface-variant mt-2 font-mono">
                        ${o.items_summary || (o.items ? (typeof o.items === 'string' ? o.items : JSON.stringify(o.items)) : 'Articles')}
                    </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <span class="font-mono font-bold text-sm text-emerald-700">${total.toLocaleString()} FCFA</span>
                    <button onclick="openPinModal('${pin}')" class="px-3.5 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-sm hover:brightness-95 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">check</span> Remettre
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// -------------------------------------------------------------
// 8. SALES HISTORY & SESSION STATS
// -------------------------------------------------------------
function updateSessionStats() {
    const orders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    let totalSales = 0;
    let totalCash = 0;
    let totalWave = 0;

    orders.forEach(o => {
        const amt = parseFloat(o.total_price || o.total_amount) || 0;
        totalSales += amt;
        if (String(o.payment_method || o.mode_paiement || '').toLowerCase().includes('espece')) {
            totalCash += amt;
        } else {
            totalWave += amt;
        }
    });

    const topbarSales = document.getElementById('topbar-sales-total');
    const topbarTickets = document.getElementById('topbar-ticket-count');
    if (topbarSales) topbarSales.innerText = totalSales.toLocaleString() + ' FCFA';
    if (topbarTickets) topbarTickets.innerText = orders.length;

    // Closure modal elements
    const closureTotal = document.getElementById('closure-total');
    const closureCash = document.getElementById('closure-cash');
    const closureWave = document.getElementById('closure-wave');
    const closureCount = document.getElementById('closure-ticket-count');

    if (closureTotal) closureTotal.innerText = totalSales.toLocaleString() + ' FCFA';
    if (closureCash) closureCash.innerText = totalCash.toLocaleString() + ' FCFA';
    if (closureWave) closureWave.innerText = totalWave.toLocaleString() + ' FCFA';
    if (closureCount) closureCount.innerText = orders.length;
}

let historyFilter = 'all';
function filterHistoryMethod(method) {
    historyFilter = method;
    document.querySelectorAll('.history-filter-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-surface', 'text-on-surface');
    });
    event?.target?.classList.remove('bg-surface', 'text-on-surface');
    event?.target?.classList.add('bg-primary', 'text-on-primary');
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById('pos-history-table-body');
    if (!tbody) return;

    const orders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    const filtered = orders.filter(o => {
        if (historyFilter === 'all') return true;
        const method = String(o.payment_method || o.mode_paiement || '').toLowerCase();
        if (historyFilter === 'especes') return method.includes('espece');
        if (historyFilter === 'wave') return method.includes('wave') || method.includes('mobile');
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-on-surface-variant font-bold">Aucune transaction enregistrée.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const timeStr = new Date(o.created_at || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const total = parseFloat(o.total_price || o.total_amount) || 0;
        const method = o.mode_paiement || (o.payment_method === 'especes' ? 'Espèces' : 'Wave');
        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-3.5 font-mono font-extrabold text-primary">#${o.id}</td>
                <td class="p-3.5 font-mono text-on-surface-variant">${timeStr}</td>
                <td class="p-3.5 font-bold">${o.customer_name || 'Client Comptoir'}</td>
                <td class="p-3.5 text-on-surface-variant font-mono line-clamp-1 max-w-[200px]">${o.items_summary || 'Articles'}</td>
                <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded-md font-bold text-[10px] ${method.includes('Espèces') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${method}</span>
                </td>
                <td class="p-3.5 font-mono font-extrabold text-right text-on-surface">${total.toLocaleString()} F</td>
                <td class="p-3.5 text-center">
                    <button onclick='showThermalReceipt(${JSON.stringify(o)})' class="p-1.5 text-primary hover:bg-surface-container-high rounded-lg transition-colors" title="Réimprimer ticket">
                        <span class="material-symbols-outlined text-base">print</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------
// 9. CLOSURE (Z DE CAISSE)
// -------------------------------------------------------------
function openClosureModal() {
    updateSessionStats();
    const dateEl = document.getElementById('closure-date');
    if (dateEl) {
        dateEl.innerText = `Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    document.getElementById('closureModal').classList.remove('hidden');
}

function closeClosureModal() {
    document.getElementById('closureModal').classList.add('hidden');
}

function printClosureReport() {
    window.print();
}
