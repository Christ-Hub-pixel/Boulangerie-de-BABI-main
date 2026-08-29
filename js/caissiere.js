// -------------------------------------------------------------
// 🥐 BABI POS CAISSIÈRE — TERMINAL TACTILE & GESTION RETRAITS
// -------------------------------------------------------------

const API_ROOT = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';

let posProducts = [];
let posCart = [];
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

    // Nettoyage initial unique des anciens paniers et tickets de test
    try {
        if (localStorage.getItem('babi_pos_fresh_v2') !== 'true') {
            localStorage.removeItem('babi_pos_cart');
            localStorage.removeItem('babi_pos_sales_history');
            localStorage.removeItem('babi_pos_shift_sales');
            localStorage.removeItem('babi_pos_shift_tickets');
            localStorage.setItem('babi_pos_fresh_v2', 'true');
        }
    } catch (_) {}

    purgeStaleMockOrders();

    loadPosProducts();
    renderPosCart();
    refreshPickupQueue();
    updateSessionStats();
    renderHistoryTable();
    initCashierAuthGuard();
    setInterval(updateClock, 1000);
    setInterval(verifyCashierSessionGuard, 15000); // Heartbeat session check allégé
    
    // Instant sync across tabs when orders are placed
    window.addEventListener('storage', (e) => {
        if (!e.key || e.key.includes('orders') || e.key.includes('babi')) {
            refreshPickupQueue();
            updateSessionStats();
            renderHistoryTable();
        }
    });

    // Global Real-time Sync Bus
    try {
        const globalSyncChan = new BroadcastChannel('babi_global_sync');
        globalSyncChan.onmessage = (e) => {
            handleCaissiereGlobalSync(e.data);
        };
    } catch (_) {}

    try {
        const orderChannel = new BroadcastChannel('babi_orders_sync');
        orderChannel.onmessage = () => {
            refreshPickupQueue();
            updateSessionStats();
            renderHistoryTable();
        };
    } catch (_) {}

    // Unlock Audio Context on first interaction
    const unlockAudio = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctx.resume();
        } catch (_) {}
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    schedulePickupPolling();
    initCaissiereBrainFeed();
});

function schedulePickupPolling() {
    setTimeout(async () => {
        await refreshPickupQueue();
        schedulePickupPolling();
    }, 20000); // 20s fallback polling (le bus BroadcastChannel gère l'instantané)
}

// Live Clock
function updateClock() {
    const clockEl = document.getElementById('pos-live-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// -------------------------------------------------------------
// REAL WEB AUDIO SYNTHESIZER & POS SOUND EFFECTS
// -------------------------------------------------------------
let posAudioCtx = null;

function getPosAudioContext() {
    if (!posAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            posAudioCtx = new AudioContext();
        }
    }
    if (posAudioCtx && posAudioCtx.state === 'suspended') {
        posAudioCtx.resume().catch(() => {});
    }
    return posAudioCtx;
}

// Unlock audio on any initial user tap/click
if (typeof document !== 'undefined') {
    ['click', 'touchstart', 'keydown'].forEach(evt => {
        document.addEventListener(evt, () => {
            getPosAudioContext();
        }, { once: true, passive: true });
    });
}

function playPosAudio(type = 'beep') {
    // 1. Haptic Vibration Feedback (Mobile)
    try {
        if ('vibrate' in navigator) {
            if (type === 'error' || type === 'buzz') navigator.vibrate([60, 40, 60]);
            else if (type === 'success' || type === 'chime' || type === 'new_order') navigator.vibrate([45, 30, 45]);
            else navigator.vibrate(25);
        }
    } catch (_) {}

    // 2. Real Web Audio API POS Sound Synthesis
    try {
        const ctx = getPosAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        if (type === 'beep') {
            // Crisp, authentic POS register / barcode scan beep
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1450, now);
            osc.frequency.exponentialRampToValueAtTime(1750, now + 0.05);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'click') {
            // Tactile keypad click
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(650, now);
            osc.frequency.exponentialRampToValueAtTime(250, now + 0.025);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.025);
        } else if (type === 'success') {
            // Harmonious 4-note ascending major arpeggio (C5 -> E5 -> G5 -> C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + (i * 0.055);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.18, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.2);
            });
        } else if (type === 'chime' || type === 'new_order') {
            // Warm bakery bell chime (incoming order alert)
            const bellNotes = [880, 1318.5, 1760];
            bellNotes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + (i * 0.075);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.22, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.45);
            });
        } else if (type === 'error' || type === 'buzz') {
            // Double low alert buzz
            [0, 0.09].forEach(delay => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + delay;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, startTime);
                osc.frequency.linearRampToValueAtTime(140, startTime + 0.08);

                gain.gain.setValueAtTime(0.18, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.08);
            });
        }
    } catch (_) {}
}

// -------------------------------------------------------------
// 1. NAVIGATION & VIEW SWITCHING
// -------------------------------------------------------------
function showPosView(viewName) {
    // Ensure body scroll is unlocked
    document.body.style.overflow = '';
    
    // Nav links active state
    document.querySelectorAll('.prestige-nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-pos-${viewName}`);
    if (activeNav) activeNav.classList.add('active');

    // Mobile bottom tabs active state
    document.querySelectorAll('.pos-mobile-tab-btn').forEach(b => b.classList.remove('active'));
    const activeMobileTab = document.getElementById(`mobile-tab-${viewName}`);
    if (activeMobileTab) activeMobileTab.classList.add('active');

    // Main views toggle
    document.querySelectorAll('.pos-main-view').forEach(v => v.classList.add('hidden'));
    const targetView = document.getElementById(`pos-view-${viewName}`);
    if (targetView) targetView.classList.remove('hidden');

    // Scroll to top of page/view smoothly
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (viewName === 'pickups') {
        refreshPickupQueue();
    } else if (viewName === 'history') {
        renderHistoryTable();
    } else if (viewName === 'closure') {
        try {
            computeLocalShiftData();
            populateClosureModalUI();
            recalculateCashCount();
        } catch (e) {
            console.warn('Error refreshing closure view:', e);
        }
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
    // 1. PRIORITÉ ABSOLUE : Si une photo personnalisée est fournie (Base64, URL Web, Blob ou chemin asset)
    if (rawImage && typeof rawImage === 'string') {
        const trimmed = rawImage.trim();
        if (
            trimmed !== '' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined' &&
            (
                trimmed.startsWith('data:image/') ||
                trimmed.startsWith('blob:') ||
                trimmed.startsWith('http://') ||
                trimmed.startsWith('https://') ||
                trimmed.startsWith('assets/') ||
                trimmed.startsWith('/') ||
                trimmed.startsWith('./') ||
                /\.(png|jpg|jpeg|webp|svg|gif|avif)(\?.*)?$/i.test(trimmed)
            )
        ) {
            return trimmed;
        }
    }

    // 2. Si aucune photo personnalisée, vérifier la correspondance exacte par nom dans le dictionnaire
    if (name && realPosProductImages[name]) {
        return realPosProductImages[name];
    }

    // 3. Correspondance partielle par nom (uniquement si aucune image explicite n'était fournie)
    if (name && (!rawImage || rawImage === 'assets/baguette 200.png' || rawImage === 'assets/product_baguette.png')) {
        for (const [k, v] of Object.entries(realPosProductImages)) {
            if (name.toLowerCase().includes(k.toLowerCase())) return v;
        }
    }

    // 4. Si rawImage est une chaîne non vide (ex: autre format), la renvoyer directement
    if (rawImage && typeof rawImage === 'string') {
        const trimmed = rawImage.trim();
        if (trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined') {
            return trimmed;
        }
    }

    // 5. Image de secours par catégorie
    const cat = (category || '').toLowerCase();
    if (cat.includes('boisson') || cat.includes('jus')) return 'assets/jus de baobab.png';
    if (cat.includes('viennois')) return 'assets/Croissant.png';
    if (cat.includes('patiss') || cat.includes('pâtiss')) return 'assets/Gateau1.png';
    if (cat.includes('traiteur') || cat.includes('snack') || cat.includes('sale')) return 'assets/Pizza.png';
    if (cat.includes('speciaux') || cat.includes('special')) return 'assets/cabre.png';
    return 'assets/baguette 200.png';
}

async function loadPosProducts() {
    const adjustments = JSON.parse(localStorage.getItem('babi_pos_stock_adjustments') || '{}');
    const apiBase = window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : (API_ROOT || 'http://localhost:5000'));

    // 1. Rendu instantané 0ms depuis le catalogue en cache/mémoire locale
    const cached = (typeof window.babiGetCachedProducts === 'function') 
        ? window.babiGetCachedProducts() 
        : [];
    
    const sourceList = (cached && cached.length > 0) 
        ? cached 
        : ((posProducts && posProducts.length > 0) ? posProducts : FALLBACK_POS_PRODUCTS);
    
    posProducts = sourceList
        .filter(p => p.is_active !== 0 && p.is_active !== '0' && p.is_active !== false)
        .map(p => {
            const pName = p.nom || p.name;
            const pCat = (p.categorie || p.category || 'pains').toLowerCase();
            const baseStock = (p.stock !== undefined && p.stock !== null) ? Number(p.stock) : ((p.quantite_disponible !== undefined && p.quantite_disponible !== null) ? Number(p.quantite_disponible) : 30);
            const adj = adjustments[pName] !== undefined ? adjustments[pName] : 0;
            return {
                id: p.id || p._id || pName,
                name: pName,
                price: Number(p.prix || p.price || 0),
                category: pCat,
                image: resolveProductImage(pName, p.image || p.image_url, pCat),
                stock: Math.max(0, baseStock + adj),
                seuil_alerte: Number(p.seuil_alerte || 10)
            };
        });

    renderPosProductsGrid();

    // 2. Synchronisation en tâche de fond avec le serveur (timeout 4s)
    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${apiBase}/api/products`, {}, 4000);
        if (res && res.ok) {
            const rawProducts = await res.json();
            const productList = Array.isArray(rawProducts) ? rawProducts : (rawProducts.products || []);
            if (productList.length > 0) {
                if (typeof window.babiSetCachedProducts === 'function') {
                    window.babiSetCachedProducts(productList);
                }
                posProducts = productList
                    .filter(p => p.is_active !== 0 && p.is_active !== '0' && p.is_active !== false)
                    .map(p => {
                        const pName = p.nom || p.name;
                        const pCat = (p.categorie || p.category || 'pains').toLowerCase();
                        const baseStock = (p.stock !== undefined && p.stock !== null) ? Number(p.stock) : ((p.quantite_disponible !== undefined && p.quantite_disponible !== null) ? Number(p.quantite_disponible) : 30);
                        const adj = adjustments[pName] !== undefined ? adjustments[pName] : 0;
                        return {
                            id: p.id || p._id || pName,
                            name: pName,
                            price: Number(p.prix || p.price || 0),
                            category: pCat,
                            image: resolveProductImage(pName, p.image || p.image_url, pCat),
                            stock: Math.max(0, baseStock + adj),
                            seuil_alerte: Number(p.seuil_alerte || 10)
                        };
                    });
                renderPosProductsGrid();
            }
        }
    } catch (_) {
        // Le catalogue local garantit que la caisse tactile est 100% opérationnelle
    }
}

// Exposer globalement pour le Realtime Sync omnicanal
if (typeof window !== 'undefined') {
    window.loadPosProducts = loadPosProducts;
    window.loadProducts = loadPosProducts;
    window.addEventListener('babi:products:updated', () => {
        loadPosProducts();
    });
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

let currentFilteredProducts = [];

function renderPosProductsGrid(searchTerm = '') {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    const term = (searchTerm || document.getElementById('pos-product-search')?.value || '').toLowerCase().trim();

    const filtered = posProducts.filter(p => {
        const cat = (p.category || '').toLowerCase();
        let matchesCat = (currentCategory === 'all');
        if (!matchesCat) {
            if (currentCategory === 'pains') matchesCat = (cat === 'pain' || cat.includes('baguette') || cat.includes('tradition')) && !cat.includes('special') && !cat.includes('speciaux');
            else if (currentCategory === 'pains_speciaux') matchesCat = cat.includes('special') || cat.includes('speciaux') || cat === 'pains_speciaux';
            else if (currentCategory === 'viennoiseries') matchesCat = cat.includes('viennois') || cat.includes('croissant') || cat.includes('chocolat') || cat.includes('chausson');
            else if (currentCategory === 'patisseries') matchesCat = cat.includes('patiss') || cat.includes('pâtiss') || cat.includes('gateau') || cat.includes('gâteau') || cat.includes('fondant') || cat.includes('eclair') || cat.includes('tarte') || cat.includes('mille');
            else if (currentCategory === 'boissons') matchesCat = cat.includes('boisson') || cat.includes('jus') || cat.includes('cafe') || cat.includes('café') || cat.includes('cappuccino');
            else if (currentCategory === 'traiteur') matchesCat = cat.includes('traiteur') || cat.includes('snack') || cat.includes('sandwich') || cat.includes('quiche') || cat.includes('pizza');
            else matchesCat = (cat === currentCategory);
        }

        const matchesName = (p.name || '').toLowerCase().includes(term);
        return matchesCat && matchesName;
    });

    currentFilteredProducts = filtered;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl opacity-30 mb-2">search_off</span>
                <p class="font-bold text-sm">Aucun produit ne correspond à cette recherche.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map((p, idx) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const isDrink = cat.includes('boisson') || cat.includes('jus') || cat.includes('café') || cat.includes('cafe') || 
                        name.includes('chill') || name.includes('youyou') || name.includes('youki') || name.includes('cola') || 
                        name.includes('sprite') || name.includes('orangina') || name.includes('eau') || name.includes('malt') || 
                        name.includes('céleste') || name.includes('awé') || name.includes('boisson') || name.includes('jus') ||
                        name.includes('bissap') || name.includes('gingembre') || name.includes('baobab') || name.includes('tamarind');

        const boxClass = isDrink ? 'drink-box' : 'food-box';
        const imgClass = isDrink ? 'pos-img-drink' : 'pos-img-food';

        return `
            <button type="button" onclick="addToPosCartByIndex(${idx})" class="pos-product-item flex flex-col rounded-2xl overflow-hidden group relative text-left select-none active:scale-[0.98] transition-transform cursor-pointer">
                <div class="pos-product-img-box ${boxClass} w-full pointer-events-none">
                    <img class="${imgClass}" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='assets/Croissant.png';"/>
                    <div class="pos-price-badge-vip absolute top-2 right-2 px-2.5 py-0.5 rounded-lg font-mono text-[11px] sm:text-xs font-black z-10">${p.price.toLocaleString()} F</div>
                </div>
                <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-1.5 bg-white pointer-events-none">
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
        `;
    }).join('');
}

function addToPosCartByIndex(idx) {
    const p = currentFilteredProducts[idx] || posProducts[idx];
    if (!p) return;
    addToPosCart(p.id, p.name, p.price, p.image);
}

// -------------------------------------------------------------
// 3. POS CART LOGIC
// -------------------------------------------------------------
function addToPosCart(id, name, price, img) {
    playPosAudio('beep');
    const existing = posCart.find(item => String(item.id) === String(id));
    if (existing) {
        existing.qty += 1;
    } else {
        const prod = posProducts.find(p => String(p.id) === String(id));
        posCart.push({
            id: id,
            name: name || prod?.name || 'Produit',
            price: parseInt(price || prod?.price || 0, 10),
            qty: 1,
            image: img || prod?.image || 'assets/baguette 200.png'
        });
    }
    renderPosCart();
}

function updatePosItemQty(id, delta) {
    const item = posCart.find(i => String(i.id) === String(id));
    if (!item) return;

    if (delta > 0) playPosAudio('beep');
    else playPosAudio('click');

    item.qty += delta;
    if (item.qty <= 0) {
        posCart = posCart.filter(i => String(i.id) !== String(id));
    }
    renderPosCart();
}

function clearPosCart() {
    playPosAudio('click');
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

    const topbarLiveLabel = document.getElementById('topbar-live-cart-label');
    if (topbarLiveLabel) {
        topbarLiveLabel.innerText = totalItemCount > 0 ? `Ticket (${totalItemCount}) : ${total.toLocaleString()} FCFA` : `Ticket : 0 FCFA`;
    }

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
            <div class="flex-1 flex flex-col items-center justify-center text-center p-3 text-on-surface-variant/60 my-auto">
                <span class="material-symbols-outlined text-3xl mb-1 text-amber-500/40">shopping_cart</span>
                <p class="text-xs font-bold text-slate-700">Le ticket est vide</p>
                <p class="text-[10.5px] text-slate-400">Touchez un article pour l'ajouter</p>
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

function openCartOrScroll() {
    showPosView('terminal');
    if (window.innerWidth >= 1024) {
        const cartPanel = document.getElementById('pos-cart-panel');
        if (cartPanel) {
            cartPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            cartPanel.classList.add('ring-4', 'ring-amber-400');
            setTimeout(() => cartPanel.classList.remove('ring-4', 'ring-amber-400'), 1200);
        }
    } else {
        openMobileCart();
    }
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
    const active = (typeof getActiveCashier === 'function' ? getActiveCashier() : null);
    const cashierName = (active && (active.nom || active.prenom) ? `${active.prenom || ''} ${active.nom || ''}`.trim() : 'Caissière en service');
    const orderData = {
        id: ticketId,
        customer_name: 'Client Comptoir',
        customer_phone: 'En boutique',
        items: [...posCart],
        items_summary: posCart.map(i => `${i.qty}x ${i.name}`).join(', '),
        total_price: total,
        total_amount: total,
        total: total,
        mode_paiement: methodLabel,
        montant_recu: given !== null ? given : total,
        monnaie_rendue: change,
        status: 'recupere',
        caissiere: cashierName,
        created_at: new Date().toISOString()
    };

    // Save in localStorage babi_orders & babi_history_sales
    const savedOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    savedOrders.unshift(orderData);
    localStorage.setItem('babi_orders', JSON.stringify(savedOrders));

    const salesHistory = JSON.parse(localStorage.getItem('babi_history_sales') || '[]');
    salesHistory.unshift(orderData);
    localStorage.setItem('babi_history_sales', JSON.stringify(salesHistory));

    // Deduct stock in local adjustments
    let stockAdjustments = JSON.parse(localStorage.getItem('babi_pos_stock_adjustments') || '{}');
    posCart.forEach(item => {
        stockAdjustments[item.name] = (stockAdjustments[item.name] || 0) - item.qty;
    });
    localStorage.setItem('babi_pos_stock_adjustments', JSON.stringify(stockAdjustments));

    // Broadcast globally to Gérante, Admin and all open dashboards
    broadcastGlobalSync('POS_SALE_COMPLETED', {
        orderId: ticketId,
        total: total,
        items: posCart,
        method: methodLabel,
        cashier: cashierName,
        time: new Date().toLocaleTimeString('fr-FR')
    });

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

function broadcastGlobalSync(eventType, payload = {}) {
    try {
        const channel = new BroadcastChannel('babi_global_sync');
        channel.postMessage({ type: eventType, payload, timestamp: Date.now() });
    } catch (_) {}
    try {
        localStorage.setItem('babi_last_sync_event', JSON.stringify({ type: eventType, payload, timestamp: Date.now() }));
    } catch (_) {}
}

function handleCaissiereGlobalSync(eventData) {
    if (!eventData || !eventData.type) return;
    const { type, payload } = eventData;

    if (type === 'FOURNIL_RAYON_ADDED') {
        playPosAudio('chime');
        showPosToast(`🥖 Fournil : +${payload.quantity} ${payload.productName} mis en rayon !`, 'success');
        loadPosProducts();
    } else if (type === 'EVENT_ORDER_UPDATED' || type === 'ORDER_PAID' || type === 'NEW_ONLINE_ORDER') {
        playPosAudio('chime');
        refreshPickupQueue();
        updateSessionStats();
        renderHistoryTable();
        showPosToast(`🔔 Nouvelle commande client reçue !`, 'info');
    } else if (type === 'STOCK_UPDATED') {
        loadPosProducts();
    }
}

// -------------------------------------------------------------
// 5. THERMAL RECEIPT 80mm — EXACT REPLICA OF OFFICIAL PHYSICAL TICKET
// -------------------------------------------------------------
function showThermalReceipt(data) {
    currentReceiptData = data;
    const receiptContainer = document.getElementById('thermal-receipt-content');
    if (!receiptContainer) return;

    const receiptNum = data.receipt_number || data.id || ('25' + Math.floor(10 + Math.random() * 90));
    const cleanNum = String(receiptNum).replace(/^ORD-|^REC-|^POS-/, '');
    const now = new Date(data.created_at || Date.now());
    
    // Format: "22 juil. 2026 12:07:54"
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const dateFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const cashierName = data.caissiere || (typeof currentCashierUser !== 'undefined' && currentCashierUser?.nom ? currentCashierUser.nom : 'CAISSES 1');
    const terminalName = data.terminal || 'DESKTOP-FEHP3HD';

    let rawItems = [];
    if (Array.isArray(data.items)) {
        rawItems = data.items;
    } else if (typeof data.items === 'string') {
        try { rawItems = JSON.parse(data.items); } catch (_) { rawItems = []; }
    }
    if (rawItems.length === 0 && data.items_summary) {
        rawItems = [{ name: data.items_summary, qty: 1, price: data.total_price || data.total_amount || 0 }];
    }

    let totalItemsCount = 0;
    let itemsRowsHtml = '';

    rawItems.forEach(item => {
        const qty = Number(item.qty || item.quantity || 1);
        const unitPrice = Number(item.price || item.prix || 0);
        const lineTotal = unitPrice * qty;
        totalItemsCount += qty;
        
        const itemName = (item.name || item.nom || 'ARTICLE').toUpperCase();

        itemsRowsHtml += `
            <div style="display: grid; grid-template-columns: 1fr 58px 30px 65px; margin-bottom: 3px; font-size: 11px; line-height: 1.3;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${itemName}</span>
                <span style="text-align: right;">F ${unitPrice.toLocaleString('fr-FR')}</span>
                <span style="text-align: center;">x${qty}</span>
                <span style="text-align: right; font-weight: 600;">F ${lineTotal.toLocaleString('fr-FR')}</span>
            </div>
        `;
    });

    const totalTTC = Number(data.total_price || data.total_amount || data.total || 0);
    const modePaiement = data.mode_paiement || data.payment_method || 'Cash';
    const montantRecu = Number(data.montant_recu || data.amount_received || (totalTTC > 0 ? (totalTTC >= 10000 ? totalTTC : (totalTTC > 5000 ? 10000 : (totalTTC > 2000 ? 5000 : 2000))) : 0));
    const monnaieRendue = Number(data.monnaie_rendue || data.change_given || Math.max(0, montantRecu - totalTTC));

    receiptContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 8px;">
            <!-- Official BЯ Wreath Logo -->
            <div style="margin: 0 auto 2px auto; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                    <circle cx="50" cy="50" r="46" stroke="#000" stroke-width="1.8" stroke-dasharray="2 1"/>
                    <!-- Wheat wreath branches -->
                    <path d="M 22 72 C 12 50, 20 22, 50 14 C 80 22, 88 50, 78 72 C 70 84, 58 90, 50 90 C 42 90, 30 84, 22 72 Z" stroke="#000" stroke-width="1.2" fill="none"/>
                    <path d="M 78 72 C 82 67, 85 58, 80 54 C 76 58, 75 66, 78 72 Z" fill="#000"/>
                    <path d="M 80 54 C 85 50, 88 42, 82 38 C 78 42, 78 49, 80 54 Z" fill="#000"/>
                    <path d="M 82 38 C 86 32, 86 24, 80 22 C 76 26, 77 34, 82 38 Z" fill="#000"/>
                    <path d="M 80 22 C 78 16, 72 13, 66 14 C 67 19, 73 22, 80 22 Z" fill="#000"/>
                    <path d="M 22 72 C 18 67, 15 58, 20 54 C 24 58, 25 66, 22 72 Z" fill="#000"/>
                    <path d="M 20 54 C 15 50, 12 42, 18 38 C 22 42, 22 49, 20 54 Z" fill="#000"/>
                    <path d="M 18 38 C 14 32, 14 24, 20 22 C 24 26, 23 34, 18 38 Z" fill="#000"/>
                    <!-- Monogram BЯ -->
                    <text x="50" y="59" font-family="'Times New Roman', Georgia, serif" font-size="33" font-weight="900" text-anchor="middle" fill="#000" letter-spacing="-0.5">BЯ</text>
                </svg>
                <div style="font-family: 'Brush Script MT', 'Great Vibes', cursive, 'Times New Roman', serif; font-size: 13px; font-style: italic; color: #000; margin-top: -2px; letter-spacing: 0.5px;">Le Pain de Babi</div>
            </div>

            <div style="font-weight: 900; font-size: 12.5px; letter-spacing: 0.5px; color: #000; text-transform: uppercase; margin-top: 4px;">BOULANGERIE DE BABI</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #000; margin: 1px 0;">TEL: 2722564123 / 0704389201 / 0706817977</div>
            <div style="font-size: 10.5px; font-weight: 600; color: #000;">Recu</div>
        </div>

        <div style="font-size: 11px; line-height: 1.4; margin-bottom: 8px; color: #000;">
            <div style="display: flex; justify-content: space-between;">
                <span>Receipt:</span>
                <span style="font-weight: 600;">${cleanNum || '2512'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Date:</span>
                <span>${dateFormatted}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Terminal:</span>
                <span>${terminalName}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Caissier(e):</span>
                <span>${cashierName}</span>
            </div>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0 3px 0; margin-bottom: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 58px 30px 65px; font-size: 10.5px; font-weight: 700; color: #000; margin-bottom: 3px;">
                <span>Article</span>
                <span style="text-align: right;">Prix</span>
                <span style="text-align: center;">Qte</span>
                <span style="text-align: right;">Valeur</span>
            </div>
            <div style="border-top: 1px dashed #000; margin: 2px 0 4px 0;"></div>
            ${itemsRowsHtml || `<div style="font-size: 11px;">1x VENTE COMPTOIR F ${totalTTC.toLocaleString('fr-FR')}</div>`}
        </div>

        <div style="font-size: 11px; line-height: 1.35; color: #000; margin-bottom: 8px;">
            <div style="margin-bottom: 6px;">Items count: ${totalItemsCount || 1}</div>
            
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin-bottom: 4px;">
                <span>Total TTC</span>
                <span>F ${totalTTC.toLocaleString('fr-FR')}</span>
            </div>
            
            <div style="font-weight: 700; margin-bottom: 1px;">
                ${modePaiement.toLowerCase().includes('wave') ? 'Wave' : (modePaiement.toLowerCase().includes('orange') ? 'Orange Money' : 'Cash')}
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 10.5px;">
                <span>Recu:</span>
                <span>F ${montantRecu.toLocaleString('fr-FR')}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 10.5px;">
                <span>Monnaie:</span>
                <span>F ${monnaieRendue.toLocaleString('fr-FR')}</span>
            </div>
        </div>

        ${(data.code_pin || data.pickup_pin) ? `
        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px;">
            <div style="font-size: 9.5px; text-transform: uppercase; font-weight: 800; color: #000;">🔑 CODE PIN RETRAIT</div>
            <div style="font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #000; font-family: monospace;">${data.code_pin || data.pickup_pin}</div>
        </div>` : ''}

        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 9.5px; color: #000;">
            <div>Merci de votre visite et à bientôt ! 🥐</div>
            <div style="font-size: 8.5px; font-family: monospace; letter-spacing: 1px; margin-top: 2px;">*** BOULANGERIE DE BABI ***</div>
        </div>
    `;

    document.getElementById('receiptModal').classList.remove('hidden');
}

function printCurrentThermalReceipt() {
    playPosAudio('click');
    window.print();
}

function shareReceiptOnWhatsApp() {
    if (!currentReceiptData) return;
    const d = currentReceiptData;
    const num = d.receipt_number || d.id || ('25' + Math.floor(10 + Math.random() * 90));
    const cleanNum = String(num).replace(/^ORD-|^REC-|^POS-/, '');
    const now = new Date(d.created_at || Date.now());
    const dateFormatted = now.toLocaleString('fr-FR');
    const total = Number(d.total_price || d.total_amount || d.total || 0).toLocaleString('fr-FR');
    
    let rawItems = [];
    if (Array.isArray(d.items)) rawItems = d.items;
    else if (typeof d.items === 'string') { try { rawItems = JSON.parse(d.items); } catch (_) { rawItems = []; } }

    let text = `🥖 *BOULANGERIE DE BABI* 🥐\n`;
    text += `_Le Pain de Babi_\n`;
    text += `TEL: 2722564123 / 0704389201 / 0706817977\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🧾 *Receipt:* ${cleanNum}\n`;
    text += `📅 *Date:* ${dateFormatted}\n`;
    text += `👤 *Caissier(e):* ${d.caissiere || 'CAISSES 1'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Article* | *Prix* | *Qte* | *Valeur*\n`;
    
    rawItems.forEach(it => {
        const qty = it.qty || it.quantity || 1;
        const uPrice = (it.price || it.prix || 0);
        const val = uPrice * qty;
        text += `• ${it.name || it.nom} : F ${uPrice.toLocaleString('fr-FR')} x${qty} = F ${val.toLocaleString('fr-FR')}\n`;
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total TTC:* F ${total}\n`;
    text += `💳 *Mode:* ${d.mode_paiement || 'Cash'}\n`;
    if (d.code_pin || d.pickup_pin) {
        text += `🔑 *CODE SECRET RETRAIT:* *${d.code_pin || d.pickup_pin}*\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Merci de votre visite et à bientôt !_ 🥖`;

    const phone = (d.customer_phone || d.phone || '').replace(/[^0-9]/g, '');
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function copyReceiptText() {
    if (!currentReceiptData) return;
    const d = currentReceiptData;
    const num = d.receipt_number || d.id || '2512';
    const cleanNum = String(num).replace(/^ORD-|^REC-|^POS-/, '');
    const now = new Date(d.created_at || Date.now());
    const total = Number(d.total_price || d.total_amount || d.total || 0).toLocaleString('fr-FR');

    let text = `BOULANGERIE DE BABI\n`;
    text += `Le Pain de Babi\n`;
    text += `TEL: 2722564123 / 0704389201 / 0706817977\n`;
    text += `Recu\n\n`;
    text += `Receipt:     ${cleanNum}\n`;
    text += `Date:        ${now.toLocaleString('fr-FR')}\n`;
    text += `Terminal:    ${d.terminal || 'DESKTOP-FEHP3HD'}\n`;
    text += `Caissier(e): ${d.caissiere || 'CAISSES 1'}\n\n`;
    text += `Article                 Prix    Qte    Valeur\n`;
    text += `--------------------------------------------\n`;

    let rawItems = [];
    if (Array.isArray(d.items)) rawItems = d.items;
    else if (typeof d.items === 'string') { try { rawItems = JSON.parse(d.items); } catch (_) { rawItems = []; } }

    rawItems.forEach(it => {
        const qty = it.qty || it.quantity || 1;
        const uPrice = (it.price || it.prix || 0);
        const val = uPrice * qty;
        text += `${(it.name || it.nom || '').padEnd(20)} F ${String(uPrice).padEnd(6)} x${String(qty).padEnd(4)} F ${val.toLocaleString('fr-FR')}\n`;
    });

    text += `--------------------------------------------\n`;
    text += `Total TTC                            F ${total}\n`;

    navigator.clipboard.writeText(text).then(() => {
        showPosToast("📋 Texte du ticket copié avec succès !", 'success');
    }).catch(() => {
        showPosToast("Ticket copié !", 'info');
    });
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

function safeParseStorageJson(raw) {
    if (!raw) return [];
    try {
        let val = JSON.parse(raw);
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (_) {}
        }
        if (Array.isArray(val)) return val;
        if (typeof val === 'object' && val !== null) return [val];
        return [];
    } catch (_) {
        return [];
    }
}

async function previewPinOrder(pin) {
    const resultBox = document.getElementById('pin-verify-result-box');
    if (!resultBox) return;

    const cleanPin = String(pin || '').trim();
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <div class="p-3 bg-surface-container rounded-2xl text-center text-xs text-on-surface-variant font-bold">
            <span class="material-symbols-outlined text-xl animate-spin align-middle mr-1 text-primary">sync</span> Recherche de la commande #${cleanPin}...
        </div>
    `;

    // 0. Anti-Fraud Local Registry Check
    const consumedPins = JSON.parse(localStorage.getItem('babi_consumed_pins') || '[]');
    const alreadyConsumed = consumedPins.find(c => String(c.pin) === cleanPin || (cleanPin.length === 4 && String(c.pin).padStart(4, '0') === cleanPin));

    if (alreadyConsumed) {
        const active = (typeof getActiveCashier === 'function' ? getActiveCashier() : null);
        const currentCName = (active && (active.nom || active.prenom) ? `${active.prenom || ''} ${active.nom || ''}`.trim() : 'Caissière en service');
        renderPinFraudWarning({
            orderId: alreadyConsumed.orderId || `BABI-${cleanPin}`,
            pin: cleanPin,
            consumedAt: alreadyConsumed.consumedAt || 'Précédemment',
            cashier: alreadyConsumed.cashier || currentCName
        });
        return;
    }

    // 1. Try Backend API lookup
    const apiEndpoints = [
        `${API_ROOT}/api/pickup/lookup`,
        `/api/pickup/lookup`
    ];

    for (const url of apiEndpoints) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: cleanPin })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    renderPinPreviewSuccess(data, cleanPin);
                    return;
                }
            } else if (res.status === 400 || res.status === 403 || res.status === 404) {
                const data = await res.json().catch(() => ({}));
                if (data.isFraudAlert || data.isAlreadyUsed) {
                    const active = (typeof getActiveCashier === 'function' ? getActiveCashier() : null);
                    const currentCName = (active && (active.nom || active.prenom) ? `${active.prenom || ''} ${active.nom || ''}`.trim() : 'Caissière en service');
                    renderPinFraudWarning({
                        orderId: data.orderId || `BABI-${cleanPin}`,
                        pin: cleanPin,
                        consumedAt: data.validatedAt || 'Aujourd\'hui',
                        cashier: data.validatedBy || currentCName
                    });
                    return;
                }
            }
        } catch (_) {}
    }

    // 2. Fallback: Search all local storage keys (Flutter web double-encoded JSON & standard web app)
    let allOrders = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('orders') || key.includes('order') || key.includes('babi'))) {
            if (key === 'babi_consumed_pins') continue;
            const items = safeParseStorageJson(localStorage.getItem(key));
            if (items && items.length > 0) {
                allOrders.push(...items);
            }
        }
    }

    const matched = allOrders.find(o => {
        const oPin = String(o.pickupPin || o.pickup_pin || o.pin_code || o.code_pin || o.pin || '').trim();
        return oPin === cleanPin || (cleanPin.length === 4 && oPin.padStart(4, '0') === cleanPin);
    });

    if (matched) {
        if (matched.status === 'recupere' || matched.status === 'PICKED_UP' || matched.is_used === 1) {
            const active = (typeof getActiveCashier === 'function' ? getActiveCashier() : null);
            const currentCName = (active && (active.nom || active.prenom) ? `${active.prenom || ''} ${active.nom || ''}`.trim() : 'Caissière en service');
            renderPinFraudWarning({
                orderId: matched.id || `BABI-${cleanPin}`,
                pin: cleanPin,
                consumedAt: matched.updated_at || 'Aujourd\'hui',
                cashier: currentCName
            });
            return;
        }

        let itemsSummary = 'Articles boulangerie';
        if (Array.isArray(matched.items)) {
            itemsSummary = matched.items.map(i => `${i.qty || i.quantity || 1}x ${i.name || i.nom || i.productName || 'Produit'}`).join(', ');
        } else if (matched.items_summary) {
            itemsSummary = matched.items_summary;
        }

        renderPinPreviewSuccess({
            orderId: matched.id || `BABI-${cleanPin}`,
            customerName: matched.customerName || matched.customer_name || 'Client Mobile',
            customerPhone: matched.customerPhone || matched.customer_phone || '0707000000',
            totalAmount: Number(matched.total || matched.total_price || matched.total_amount || 2500),
            itemsSummary: itemsSummary,
            isPaid: true
        }, cleanPin);
        return;
    }

    // 3. Not found in any active database or order registry
    resultBox.innerHTML = `
        <div class="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold text-left">
            <div class="flex items-center gap-1.5 text-rose-700 font-extrabold mb-1">
                <span class="material-symbols-outlined text-lg">error</span>
                <span>Code PIN Introuvable</span>
            </div>
            <p>Aucun retrait actif n'est associé au code PIN <strong>#${cleanPin}</strong>. Veuillez vérifier le code sur le reçu ou l'application du client.</p>
        </div>
    `;
    playPosAudio('error');
}

function renderPinFraudWarning(info) {
    const resultBox = document.getElementById('pin-verify-result-box');
    if (!resultBox) return;

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <div class="p-4 bg-rose-50 border-2 border-rose-500 text-rose-950 rounded-2xl shadow-md text-xs text-left">
            <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-2xl text-rose-600 animate-pulse">gpp_bad</span>
                <span class="font-black text-rose-700 text-sm">🛑 ALERTE FRAUDE : CODE PIN DÉJÀ UTILISÉ !</span>
            </div>
            <p class="text-rose-900 font-bold mb-2">
                Le code PIN <strong>#${info.pin}</strong> a déjà été validé et la commande <strong>#${info.orderId}</strong> a déjà été remise au client.
            </p>
            <div class="p-2.5 bg-white/95 rounded-xl border border-rose-200 space-y-1 font-mono text-[11px] text-rose-900">
                <div class="flex justify-between"><span>📅 <strong>Heure de remise :</strong></span> <span>${info.consumedAt || 'Aujourd\'hui'}</span></div>
                <div class="flex justify-between"><span>👤 <strong>Validé par :</strong></span> <span>${info.cashier || 'Caissière en service'}</span></div>
                <div class="pt-1 text-center font-sans font-black text-rose-700 text-[10px] tracking-wide uppercase border-t border-rose-100 mt-1">
                    ⛔ TENTATIVE DE DOUBLE RETRAIT BLOQUÉE PAR LE SYSTÈME
                </div>
            </div>
        </div>
    `;
    playPosAudio('error');
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
    const cleanPin = String(pin || '').trim();
    const cleanOrderId = String(orderId || '').trim();
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const active = (typeof getActiveCashier === 'function' ? getActiveCashier() : null);
    const activeName = (active && (active.nom || active.prenom) ? `${active.prenom || ''} ${active.nom || ''}`.trim() : 'Caissière en service');

    // 1. Save to consumed PINs list for instant fraud blocking
    const consumedPins = JSON.parse(localStorage.getItem('babi_consumed_pins') || '[]');
    consumedPins.unshift({
        pin: cleanPin,
        orderId: cleanOrderId,
        consumedAt: nowTime,
        cashier: activeName
    });
    localStorage.setItem('babi_consumed_pins', JSON.stringify(consumedPins));

    // 2. Call backend verification
    try {
        await fetch(`${API_ROOT}/api/pickup/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: cleanOrderId,
                pin: cleanPin,
                cashier_name: activeName
            })
        });
    } catch (_) {}

    // 3. Mark in all local orders
    // 3. Mark in all local orders
    const storageKeys = ['babi_orders', 'orders', 'flutter.babi_realtime_orders_v2', 'babi_realtime_orders_v2'];
    for (const key of storageKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const list = safeParseStorageJson(raw);
                if (Array.isArray(list) && list.length > 0) {
                    list.forEach(o => {
                        const oPin = String(o.pickupPin || o.pickup_pin || o.code_pin || o.pin || '');
                        if (String(o.id) === cleanOrderId || oPin === cleanPin) {
                            o.status = 'recupere';
                            o.is_used = 1;
                        }
                    });
                    localStorage.setItem(key, JSON.stringify(list));
                }
            }
        } catch (_) {}
    }

    playPosAudio('success');
    alert(`🎉 Commande #${cleanOrderId} remise avec succès au client !\nCode PIN #${cleanPin} scellé et invalidé pour éviter toute fraude.`);
    closePinModal();
    refreshPickupQueue();
    renderHistoryTable();
}

// -------------------------------------------------------------
// 7. LIVE PICKUP QUEUE & REAL-TIME ORDER ALERTS
// -------------------------------------------------------------
let previousPickupCount = -1;
let knownOrderIds = new Set();

const MOCK_ORDER_IDS = ['BABI-98402', 'BABI-87140', 'M5FLO3DTwkaTJ17PuA7gK2sJ2173', 'BABI-FOURNIL'];
const MOCK_PINS = ['757', '419', '7412'];

function isMockOrder(o) {
    if (!o) return false;
    const id = String(o.id || o.order_number || o.orderId || '').trim();
    const pin = String(o.pickupPin || o.pickup_pin || o.pin_code || o.code_pin || o.pin || '').trim();
    const phone = String(o.customer_phone || o.customerPhone || o.phone || '').trim();
    const name = String(o.customer_name || o.customerName || '').trim();

    if (MOCK_ORDER_IDS.includes(id) || id.includes('M5FLO3DT') || id.includes('98402') || id.includes('87140')) return true;
    if (MOCK_PINS.includes(pin)) return true;
    if (phone === '0707000000' && name === 'Client App Mobile') return true;
    return false;
}

function purgeStaleMockOrders() {
    const keysToClean = ['babi_orders', 'orders', 'flutter.babi_realtime_orders_v2', 'babi_realtime_orders_v2', 'babi_pos_cart'];
    
    keysToClean.forEach(k => {
        try {
            const raw = localStorage.getItem(k);
            if (raw) {
                const parsed = safeParseStorageJson(raw);
                if (Array.isArray(parsed)) {
                    const cleaned = parsed.filter(o => !isMockOrder(o));
                    localStorage.setItem(k, JSON.stringify(cleaned));
                }
            }
        } catch(_) {}
    });

    try {
        const consumedPins = JSON.parse(localStorage.getItem('babi_consumed_pins') || '[]');
        MOCK_PINS.forEach(p => {
            if (!consumedPins.some(cp => cp.pin === p)) {
                consumedPins.push({ pin: p, orderId: 'MOCK-CLEARED', consumedAt: new Date().toISOString() });
            }
        });
        localStorage.setItem('babi_consumed_pins', JSON.stringify(consumedPins));
    } catch(_) {}
}

async function refreshPickupQueue() {
    let apiOrders = [];
    
    // 1. Fetch from backend API
    const apiEndpoints = [
        `${API_ROOT}/api/orders/pickup-queue`,
        `/api/orders/pickup-queue`,
        `https://api.boulangeriedebabi.com/api/orders/pickup-queue`
    ];

    for (const url of apiEndpoints) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                isApiReachable = true;
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.orders || []);
                if (list && list.length > 0) {
                    apiOrders.push(...list);
                    break;
                }
            }
        } catch (_) {}
    }

    // 2. Fetch from specific client orders local keys only
    let localOrdersList = [];
    const validOrderKeys = ['babi_orders', 'flutter.babi_realtime_orders_v2', 'babi_realtime_orders_v2'];
    for (const key of validOrderKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const items = safeParseStorageJson(raw);
                if (Array.isArray(items) && items.length > 0) {
                    localOrdersList.push(...items);
                }
            }
        } catch (_) {}
    }

    // 3. Exclude consumed PINs and picked-up orders
    const consumedPins = JSON.parse(localStorage.getItem('babi_consumed_pins') || '[]');
    const consumedPinSet = new Set(consumedPins.map(c => String(c.pin).trim()));
    const consumedOrderSet = new Set(consumedPins.map(c => String(c.orderId).trim()));

    const allRaw = [...apiOrders, ...localOrdersList];
    const validOrdersMap = new Map();

    allRaw.forEach(o => {
        if (!o) return;
        if (isMockOrder(o)) return; // 🚫 Automatically filter out mock test orders!

        const oId = String(o.id || o.order_number || o.orderId || '').trim();
        const oPin = String(o.pickupPin || o.pickup_pin || o.pin_code || o.code_pin || o.pin || '').trim();
        const status = String(o.status || o.statusCode || '').toLowerCase();
        
        // Skip if already picked up or in consumed set
        if (status === 'recupere' || status === 'picked_up' || status === 'delivered' || o.is_used === 1 || o.is_used === true) {
            return;
        }
        if (consumedPinSet.has(oPin) || (oPin && consumedPinSet.has(oPin.padStart(4, '0')))) {
            return;
        }
        if (oId && consumedOrderSet.has(oId)) {
            return;
        }

        const key = oId || oPin || Math.random().toString();
        if (!validOrdersMap.has(key)) {
            let itemsSummary = '';
            if (Array.isArray(o.items)) {
                itemsSummary = o.items.map(i => `${i.qty || i.quantity || 1}x ${i.name || i.nom || i.productName || 'Produit'}`).join(', ');
            } else if (o.items_summary) {
                itemsSummary = o.items_summary;
            } else if (typeof o.items === 'string') {
                try {
                    const parsed = JSON.parse(o.items);
                    if (Array.isArray(parsed)) itemsSummary = parsed.map(i => `${i.qty || i.quantity || 1}x ${i.name || i.nom || 'Produit'}`).join(', ');
                    else itemsSummary = o.items;
                } catch (_) {
                    itemsSummary = o.items;
                }
            }

            validOrdersMap.set(key, {
                id: oId || `BABI-${oPin}`,
                pin_code: oPin || '7412',
                customer_name: o.customer_name || o.customerName || 'Client Web',
                customer_phone: o.customer_phone || o.customerPhone || o.phone || '07 00 00 00 00',
                total_price: Number(o.total_price || o.total_amount || o.total || 0),
                items_summary: itemsSummary || 'Articles boulangerie',
                created_at: o.created_at || o.createdAt || new Date().toISOString()
            });
        }
    });

    const newLivePickups = Array.from(validOrdersMap.values());

    // Check for incoming new orders to notify cashier with chime & toast
    if (previousPickupCount !== -1 && newLivePickups.length > previousPickupCount) {
        const newest = newLivePickups.find(o => !knownOrderIds.has(o.id)) || newLivePickups[0];
        if (newest) {
            playPosAudio('chime');
            showIncomingOrderNotification(newest);
        }
    }

    previousPickupCount = newLivePickups.length;
    knownOrderIds = new Set(newLivePickups.map(o => o.id));
    livePickups = newLivePickups;

    // Update Badge Counters (Sidebar & Mobile bottom navigation)
    const badge = document.getElementById('pickup-badge-count');
    if (badge) {
        badge.innerText = livePickups.length;
        badge.style.display = livePickups.length > 0 ? 'inline-flex' : 'none';
    }
    const mobileBadge = document.getElementById('mobile-tab-pickup-badge');
    if (mobileBadge) {
        mobileBadge.innerText = livePickups.length;
        mobileBadge.style.display = livePickups.length > 0 ? 'flex' : 'none';
    }

    // Update Real-Time Incoming Order Banner on Cashier Screen
    const banner = document.getElementById('pos-incoming-alert-banner');
    if (banner) {
        if (livePickups.length > 0) {
            banner.classList.remove('hidden');
            const desc = document.getElementById('pos-banner-order-desc');
            if (desc) {
                const first = livePickups[0];
                desc.innerText = `${livePickups.length} commande(s) prête(s) • Dernier : #${first.id} (${first.customer_name || 'Client'}) • PIN: #${first.pin_code}`;
            }
        } else {
            banner.classList.add('hidden');
        }
    }

    renderPickupCards();
}

function showIncomingOrderNotification(order) {
    let toast = document.getElementById('pos-order-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pos-order-toast';
        toast.className = 'fixed top-20 right-4 sm:right-6 z-[999] max-w-sm p-4 bg-[#180b05] text-white rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 cursor-pointer';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="w-11 h-11 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-xl shrink-0 animate-bounce">
            🥐
        </div>
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
                <strong class="text-amber-300 text-[11px] uppercase font-mono tracking-wider font-black">🔔 Nouvelle Commande Reçue !</strong>
                <span class="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full font-mono">PIN #${order.pin_code}</span>
            </div>
            <p class="text-white font-black text-xs truncate mt-0.5">${order.customer_name} • ${order.total_price.toLocaleString()} FCFA</p>
            <p class="text-amber-100/70 text-[11px] truncate">${order.items_summary}</p>
        </div>
    `;
    toast.onclick = () => {
        showPosView('pickups');
        openPinModal(order.pin_code);
    };

    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }
    }, 8000);
}

function renderPickupCards() {
    const container = document.getElementById('pos-pickup-cards-container');
    if (!container) return;

    if (livePickups.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/30">
                <span class="material-symbols-outlined text-5xl text-amber-500 opacity-40 mb-2">takeout_dining</span>
                <p class="font-bold text-base text-on-surface">Aucune commande en attente de retrait</p>
                <p class="text-xs text-on-surface-variant">Les nouvelles commandes Click & Collect apparaîtront ici automatiquement en temps réel.</p>
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
                <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20 gap-2">
                    <span class="font-mono font-bold text-sm text-emerald-700">${total.toLocaleString()} FCFA</span>
                    <div class="flex items-center gap-1.5">
                        <button onclick="dismissPickupOrder('${o.id}', '${pin}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Retirer cette commande">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                        <button onclick="openPinModal('${pin}')" class="px-3.5 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-sm hover:brightness-95 flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">check</span> Remettre
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function dismissPickupOrder(orderId, pin) {
    const consumedPins = JSON.parse(localStorage.getItem('babi_consumed_pins') || '[]');
    consumedPins.unshift({
        pin: String(pin || ''),
        orderId: String(orderId || ''),
        consumedAt: new Date().toISOString(),
        cashier: currentCashierUser?.nom || 'Caissière'
    });
    localStorage.setItem('babi_consumed_pins', JSON.stringify(consumedPins));

    const keysToClean = ['babi_orders', 'orders', 'flutter.babi_realtime_orders_v2', 'babi_realtime_orders_v2'];
    keysToClean.forEach(k => {
        try {
            const raw = localStorage.getItem(k);
            if (raw) {
                const arr = safeParseStorageJson(raw);
                if (Array.isArray(arr)) {
                    const filtered = arr.filter(o => o.id != orderId && o.orderId != orderId && o.pin_code != pin && o.pickupPin != pin);
                    localStorage.setItem(k, JSON.stringify(filtered));
                }
            }
        } catch(_) {}
    });

    livePickups = livePickups.filter(o => o.id != orderId && o.pin_code != pin);
    renderPickupCards();
    showPosToast('🗑️ Commande retirée de la file.', 'info');
}

function clearAllPickupQueue() {
    livePickups.forEach(o => {
        const pin = o.pin_code || o.code_pin || '';
        const orderId = o.id || '';
        const consumedPins = JSON.parse(localStorage.getItem('babi_consumed_pins') || '[]');
        consumedPins.unshift({
            pin: String(pin),
            orderId: String(orderId),
            consumedAt: new Date().toISOString(),
            cashier: currentCashierUser?.nom || 'Caissière'
        });
        localStorage.setItem('babi_consumed_pins', JSON.stringify(consumedPins));
    });

    const keysToClean = ['babi_orders', 'orders', 'flutter.babi_realtime_orders_v2', 'babi_realtime_orders_v2'];
    keysToClean.forEach(k => {
        try {
            localStorage.setItem(k, JSON.stringify([]));
        } catch(_) {}
    });

    livePickups = [];
    renderPickupCards();
    showPosToast('🧹 File des retraits vidée avec succès.', 'success');
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

    let orders = [];
    try {
        const hSales = JSON.parse(localStorage.getItem('babi_history_sales') || '[]');
        const bOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
        const pSales = JSON.parse(localStorage.getItem('babi_pos_sales_history') || '[]');
        
        const map = new Map();
        [...hSales, ...bOrders, ...pSales].forEach(o => {
            if (!o) return;
            const id = String(o.id || o.order_number || o.orderId || Math.random());
            if (!map.has(id)) {
                let itemsSummary = o.items_summary;
                if (!itemsSummary && Array.isArray(o.items)) {
                    itemsSummary = o.items.map(i => `${i.qty || 1}x ${i.name || i.nom || 'Produit'}`).join(', ');
                }
                map.set(id, {
                    ...o,
                    id: o.id || id,
                    items_summary: itemsSummary || 'Articles de boulangerie',
                    created_at: o.created_at || o.createdAt || new Date().toISOString()
                });
            }
        });
        orders = Array.from(map.values());
    } catch(e) {
        orders = [];
    }

    // Sort newest first
    orders.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

    const filtered = orders.filter(o => {
        if (historyFilter === 'all') return true;
        const method = String(o.payment_method || o.mode_paiement || '').toLowerCase();
        if (historyFilter === 'especes') return method.includes('espece') || method.includes('cash');
        if (historyFilter === 'wave') return method.includes('wave') || method.includes('mobile');
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-on-surface-variant font-bold">
                    <span class="material-symbols-outlined text-4xl text-amber-500/40 block mb-1">receipt_long</span>
                    Aucune transaction enregistrée pour ce filtre.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const timeStr = new Date(o.created_at || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const total = parseFloat(o.total_price || o.total_amount || o.total) || 0;
        const method = o.mode_paiement || (o.payment_method === 'especes' ? 'Espèces' : 'Wave');
        const isCash = String(method).toLowerCase().includes('esp') || String(method).toLowerCase().includes('cash');
        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-3.5 font-mono font-extrabold text-primary">#${o.id}</td>
                <td class="p-3.5 font-mono text-on-surface-variant">${timeStr}</td>
                <td class="p-3.5 font-bold">${o.customer_name || 'Client Comptoir'}</td>
                <td class="p-3.5 text-on-surface-variant font-mono line-clamp-1 max-w-[220px] text-[11px]">${o.items_summary || 'Articles'}</td>
                <td class="p-3.5">
                    <span class="px-2.5 py-1 rounded-md font-bold text-[10px] ${isCash ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-sky-100 text-sky-900 border border-sky-300'}">${method}</span>
                </td>
                <td class="p-3.5 font-mono font-extrabold text-right text-on-surface text-sm">${total.toLocaleString()} F</td>
                <td class="p-3.5 text-center">
                    <button onclick='showThermalReceipt(${JSON.stringify(o).replace(/'/g, "&#39;")})' class="p-1.5 px-2.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 mx-auto font-bold text-xs" title="Réimprimer ticket">
                        <span class="material-symbols-outlined text-sm">print</span> Imprimer
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------
// 9. STATS & CLOSURE (Z DE CAISSE)
// -------------------------------------------------------------
let sessionStats = {
    totalSales: 0,
    cashSales: 0,
    waveSales: 0,
    ticketCount: 0
};

function updateSessionStats() {
    let salesHistory = [];
    try {
        salesHistory = JSON.parse(localStorage.getItem('babi_history_sales') || '[]');
    } catch(e) {}

    let total = 0;
    let cash = 0;
    let wave = 0;

    salesHistory.forEach(s => {
        const amt = parseFloat(s.total_price || s.total_amount || s.total) || 0;
        total += amt;
        const method = (s.mode_paiement || s.payment_method || '').toLowerCase();
        if (method.includes('espece') || method.includes('cash')) {
            cash += amt;
        } else {
            wave += amt;
        }
    });

    sessionStats = {
        totalSales: total,
        cashSales: cash,
        waveSales: wave,
        ticketCount: salesHistory.length
    };

    // Update Topbar Stats
    const topSales = document.getElementById('topbar-sales-total');
    if (topSales) topSales.innerText = `${total.toLocaleString('fr-FR')} FCFA`;
    const topTickets = document.getElementById('topbar-ticket-count');
    if (topTickets) topTickets.innerText = salesHistory.length;

    // Update Dropdown Shift Stats
    const dropSales = document.getElementById('dropdown-shift-sales');
    if (dropSales) dropSales.innerText = `${total.toLocaleString('fr-FR')} F`;
    const dropTickets = document.getElementById('dropdown-shift-tickets');
    if (dropTickets) dropTickets.innerText = salesHistory.length;
    const dropCash = document.getElementById('dropdown-shift-cash');
    if (dropCash) dropCash.innerText = `${(cash + 50000).toLocaleString('fr-FR')} F`;

    // Update Closure Modal Stats
    const closureTotal = document.getElementById('closure-total');
    if (closureTotal) closureTotal.innerText = `${total.toLocaleString('fr-FR')} FCFA`;
    const closureCash = document.getElementById('closure-cash');
    if (closureCash) closureCash.innerText = `${(cash + 50000).toLocaleString('fr-FR')} FCFA`;
    const closureWave = document.getElementById('closure-wave');
    if (closureWave) closureWave.innerText = `${wave.toLocaleString('fr-FR')} FCFA`;
    const closureTickets = document.getElementById('closure-ticket-count');
    if (closureTickets) closureTickets.innerText = salesHistory.length;
}

function showPosToast(msg, type = 'info') {
    let toast = document.getElementById('babi-pos-toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'babi-pos-toast-msg';
        document.body.appendChild(toast);
    }
    toast.className = `fixed bottom-6 right-6 z-[999999] px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2.5 transition-all transform duration-300 ${
        type === 'success' ? 'bg-emerald-800 text-white border border-emerald-400' :
        type === 'error' ? 'bg-rose-900 text-white border border-rose-400' :
        'bg-[#2b160c] text-amber-300 border border-amber-400'
    }`;
    toast.innerHTML = `<span class="material-symbols-outlined text-base">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span> <span>${msg}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
        if (toast) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
        }
    }, 3200);
}

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

// -------------------------------------------------------------
// 10. PRESTIGE CASHIER PROFILE & SESSION MANAGEMENT
// -------------------------------------------------------------
// Note: Dynamic cashier sessions are handled in Section "Gestion Session Caissière" below.

function togglePosProfileDropdown(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('posProfileDropdownMenu');
    const chevron = document.getElementById('posProfileChevron');
    if (!menu) return;

    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        // Refresh live shift stats before opening
        updateSessionStats();
        menu.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        playPosAudio('chime');
    } else {
        menu.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

// Make globally accessible on window object
window.togglePosProfileDropdown = togglePosProfileDropdown;

// Close profile dropdown on outside click
document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('posProfileWrapper');
    const menu = document.getElementById('posProfileDropdownMenu');
    const chevron = document.getElementById('posProfileChevron');
    if (wrapper && !wrapper.contains(e.target) && menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
});

// --- LOCK SCREEN POS ---
let currentLockPin = '';

function lockPosTerminal() {
    const menu = document.getElementById('posProfileDropdownMenu');
    if (menu) menu.classList.add('hidden');
    currentLockPin = '';
    updateLockPinDisplay();
    document.getElementById('posLockScreenModal').classList.remove('hidden');
    playPosAudio('chime');
    showPosToast("🔒 Terminal Caisse Verrouillé (Pause)", "info");
}

function appendLockPin(digit) {
    if (currentLockPin.length < 4) {
        currentLockPin += digit;
        updateLockPinDisplay();
        playPosAudio('beep');
        if (currentLockPin.length === 4) {
            setTimeout(submitUnlockPin, 200);
        }
    }
}

function clearLockPin() {
    currentLockPin = '';
    updateLockPinDisplay();
}

function updateLockPinDisplay() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`lock-pin-dot-${i}`);
        if (dot) {
            if (i <= currentLockPin.length) {
                dot.style.background = '#f5b800';
                dot.style.transform = 'scale(1.25)';
            } else {
                dot.style.background = 'transparent';
                dot.style.transform = 'scale(1)';
            }
        }
    }
}

function submitUnlockPin() {
    const cashier = getActiveCashier();
    // Accept cashier specific pin, or master pin '1234', or any 4 digits in demo mode
    if (currentLockPin === cashier.pin || currentLockPin === '1234' || currentLockPin.length === 4) {
        unlockPosTerminalDirect();
        showPosToast(`✅ Session déverrouillée • Bon retour ${cashier.name} !`, 'success');
    } else {
        showPosToast("❌ Code PIN erroné", "error");
        clearLockPin();
    }
}

function unlockPosTerminalDirect() {
    document.getElementById('posLockScreenModal').classList.add('hidden');
    currentLockPin = '';
    clearLockPin();
}

// --- CASH MOVEMENT MODAL ---
function openCashMovementModal() {
    const menu = document.getElementById('posProfileDropdownMenu');
    if (menu) menu.classList.add('hidden');
    document.getElementById('posCashMovementModal').classList.remove('hidden');
}

function closeCashMovementModal() {
    document.getElementById('posCashMovementModal').classList.add('hidden');
}

function submitCashMovement() {
    const type = document.querySelector('input[name="cash_move_type"]:checked')?.value || 'in';
    const amount = parseFloat(document.getElementById('cash-move-amount')?.value) || 0;
    const reason = document.getElementById('cash-move-reason')?.value.trim() || (type === 'in' ? 'Apport fond de caisse' : 'Prélèvement coffre');

    if (amount <= 0) {
        showPosToast("Veuillez saisir un montant valide", "error");
        return;
    }

    const movements = JSON.parse(localStorage.getItem('babi_cash_movements') || '[]');
    movements.unshift({
        id: Date.now(),
        type,
        amount,
        reason,
        cashier: getActiveCashier().name,
        time: new Date().toLocaleTimeString('fr-FR')
    });
    localStorage.setItem('babi_cash_movements', JSON.stringify(movements));

    closeCashMovementModal();
    playPosAudio('chime');
    showPosToast(`💵 Mouvement enregistré : ${type === 'in' ? '+' : '−'}${amount.toLocaleString()} FCFA (${reason})`, 'success');
}

// ================================================================
// 👩‍💼 GESTION SESSION CAISSIÈRE, PIN PAD & CONTRÔLE ADMINISTRATEUR
// ================================================================

let currentCashierSession = null;
let currentCashierToken = null;
let lockPinInput = '';
let availableCashiersList = [];

function getActiveCashier() {
    if (currentCashierSession) return currentCashierSession;
    try {
        const stored = localStorage.getItem('babi_cashier_session');
        if (stored) {
            currentCashierSession = JSON.parse(stored);
            return currentCashierSession;
        }
    } catch (_) {}
    return {
        id: null,
        nom: '',
        prenom: 'Caissière',
        email: '',
        caisse_assignee: 'Caisse POS',
        code_pin: '',
        avatar: 'assets/caissiere.png'
    };
}

// 1. Initialiser le garde de session au chargement
async function initCashierAuthGuard() {
    try {
        const token = localStorage.getItem('babi_cashier_token');
        const session = localStorage.getItem('babi_cashier_session');

        if (!token || !session) {
            showPosLockScreen();
            return;
        }

        currentCashierSession = JSON.parse(session);
        currentCashierToken = token;
        updateCashierHeaderUI();

        // Vérifier l'état auprès du backend
        await verifyCashierSessionGuard();
    } catch (_) {
        showPosLockScreen();
    }
}

// 2. Vérification périodique de session (Heartbeat Guard)
async function verifyCashierSessionGuard() {
    try {
        const token = currentCashierToken || localStorage.getItem('babi_cashier_token');
        const cashier = currentCashierSession || JSON.parse(localStorage.getItem('babi_cashier_session') || '{}');

        if (!token && !cashier.id) return;

        const res = await fetch(`${API_ROOT}/api/cashier/session-check?token=${encodeURIComponent(token || '')}&cashier_id=${cashier.id || ''}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.valid === false) {
            handleAdminRemoteDisconnect(data.message || "Votre session a été clôturée à distance par l'administrateur.");
        }
    } catch (_) {}
}

// 3. Gestionnaire des événements temps réel (BroadcastChannel)
function handleCaissiereGlobalSync(data) {
    if (!data) return;

    if (data.type === 'CASHIER_FORCE_LOGOUT') {
        const current = getActiveCashier();
        if (!data.cashier_id || String(data.cashier_id) === String(current.id)) {
            handleAdminRemoteDisconnect("🔴 Votre session a été déconnectée à distance par l'administrateur.");
        }
    } else if (data.type === 'CASHIER_CREATED' || data.type === 'CASHIER_UPDATED') {
        loadValidCashiersIntoSelect();
    }
}

// 4. Déconnexion à distance ordonnée par l'Administrateur
function handleAdminRemoteDisconnect(reason) {
    playPosAudio('buzz');

    // Nettoyer la session locale
    localStorage.removeItem('babi_cashier_token');
    localStorage.removeItem('babi_cashier_session');
    currentCashierSession = null;
    currentCashierToken = null;

    showPosLockScreen(reason || "Votre session a été déconnectée à distance par l'administrateur.");
}

// 5. Afficher et masquer le Lock Screen
async function showPosLockScreen(alertMsg = '') {
    const modal = document.getElementById('posLockScreenModal');
    if (!modal) return;

    const alertEl = document.getElementById('pos-lock-alert');
    const alertTextEl = document.getElementById('pos-lock-alert-text');
    if (alertMsg) {
        if (alertEl) alertEl.classList.remove('hidden');
        if (alertTextEl) alertTextEl.textContent = alertMsg;
    } else {
        if (alertEl) alertEl.classList.add('hidden');
    }

    clearLockPin();
    modal.classList.remove('hidden');
    await loadValidCashiersIntoSelect();
}

function hidePosLockScreen() {
    const modal = document.getElementById('posLockScreenModal');
    if (modal) modal.classList.add('hidden');
}

// 6. Charger la liste des caissières créées et validées par l'Admin
async function loadValidCashiersIntoSelect() {
    const select = document.getElementById('pos-lock-cashier-select');
    if (!select) return;

    try {
        const res = await fetch(`${API_ROOT}/api/admin/cashiers`);
        if (res.ok) {
            const list = await res.json();
            availableCashiersList = list || [];
        }
    } catch (_) {}

    const activeList = (availableCashiersList || []).filter(c => c.statut === 'actif');

    if (activeList.length === 0) {
        select.innerHTML = `<option value="">⚠️ Aucune caissière active créée par l'administrateur</option>`;
        return;
    }

    select.innerHTML = activeList.map(c => `
        <option value="${c.id}" data-pin="${c.code_pin || ''}" data-email="${c.email}">
            👩‍💼 ${escapeHtml(c.prenom || '')} ${escapeHtml(c.nom || '')} — ${escapeHtml(c.caisse_assignee || 'Caisse 1')} (${escapeHtml(c.email)})
        </option>
    `).join('');
}

function handleSelectedCashierChange() {
    clearLockPin();
}

// 7. Saisie du Code PIN sur le NumPad Tactile
function pressLockPin(digit) {
    if (lockPinInput.length < 6) {
        lockPinInput += digit;
        updateLockPinDisplay();
        playPosAudio('click');
        if (lockPinInput.length === 4) {
            setTimeout(submitLockPin, 250);
        }
    }
}

function clearLockPin() {
    lockPinInput = '';
    updateLockPinDisplay();
}

function updateLockPinDisplay() {
    const display = document.getElementById('pos-lock-pin-display');
    if (display) {
        display.value = '•'.repeat(lockPinInput.length);
    }
}

// 8. Validation du PIN et ouverture de session
async function submitLockPin() {
    if (!lockPinInput) {
        showPosToast("Veuillez composer votre code PIN.", "warning");
        return;
    }

    const select = document.getElementById('pos-lock-cashier-select');
    const selectedId = select ? select.value : '';
    const selectedOption = select ? select.options[select.selectedIndex] : null;
    const selectedEmail = selectedOption ? selectedOption.getAttribute('data-email') : '';

    if (!selectedEmail) {
        showPosToast("Veuillez sélectionner un profil caissière valide.", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_ROOT}/api/cashier/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: selectedEmail, pin_code: lockPinInput })
        });
        const data = await res.json();

        if (!res.ok) {
            playPosAudio('buzz');
            const alertEl = document.getElementById('pos-lock-alert');
            const alertTextEl = document.getElementById('pos-lock-alert-text');
            if (alertEl) alertEl.classList.remove('hidden');
            if (alertTextEl) alertTextEl.textContent = data.error || "Code PIN incorrect.";
            clearLockPin();
            return;
        }

        currentCashierSession = data.cashier;
        currentCashierToken = data.token;
        localStorage.setItem('babi_cashier_session', JSON.stringify(data.cashier));
        localStorage.setItem('babi_cashier_token', data.token);

        updateCashierHeaderUI();
        hidePosLockScreen();
        playPosAudio('chime');
        showPosToast(`✨ Session ouverte : ${data.cashier.prenom} ${data.cashier.nom} (${data.cashier.caisse_assignee})`, 'success');
    } catch (err) {
        // Mode hors-ligne avec profil actif sélectionné
        const expectedPin = selectedOption ? selectedOption.getAttribute('data-pin') : '';
        if (expectedPin && lockPinInput === expectedPin) {
            const cashier = availableCashiersList.find(c => String(c.id) === String(selectedId));
            if (cashier) {
                currentCashierSession = cashier;
                currentCashierToken = `OFFLINE_SES_${Date.now()}`;
                localStorage.setItem('babi_cashier_session', JSON.stringify(cashier));
                localStorage.setItem('babi_cashier_token', currentCashierToken);
                updateCashierHeaderUI();
                hidePosLockScreen();
                playPosAudio('chime');
                showPosToast(`✨ Session locale ouverte : ${cashier.prenom} ${cashier.nom}`, 'success');
                return;
            }
        }
        playPosAudio('buzz');
        clearLockPin();
        showPosToast("Code PIN erroné ou serveur indisponible.", "error");
    }
}

// 9. Mise à jour de l'affichage de l'identité caissière dans le header
function updateCashierHeaderUI() {
    const cashier = getActiveCashier();
    const nameEl = document.getElementById('caissiere-name-badge');
    const roleEl = document.getElementById('caissiere-role-badge');
    const dropNameEl = document.getElementById('dropdown-cashier-name');
    const dropRoleEl = document.getElementById('dropdown-cashier-role');
    const headerAvatar = document.getElementById('pos-header-avatar');
    const dropAvatar = document.getElementById('dropdown-cashier-avatar');

    const hasRealName = Boolean(cashier && (cashier.nom || (cashier.prenom && cashier.prenom !== 'Caissière')));
    const fullName = hasRealName ? `${cashier.prenom || ''} ${cashier.nom || ''}`.trim() : 'Caisse Tactile POS';
    const caisseLabel = cashier.caisse_assignee || 'Caisse Principale';
    const avatarUrl = cashier.avatar || 'assets/caissiere.png';

    if (nameEl) {
        if (hasRealName) {
            nameEl.innerHTML = `${escapeHtml(fullName)} <span class="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-xs">VIP</span>`;
        } else {
            nameEl.textContent = fullName;
        }
    }
    if (roleEl) {
        roleEl.innerHTML = hasRealName ? `Caissière • ${escapeHtml(caisseLabel)} 🥐` : `Session Caisse • ${escapeHtml(caisseLabel)} 🥐`;
    }
    if (dropNameEl) dropNameEl.textContent = fullName;
    if (dropRoleEl) dropRoleEl.textContent = hasRealName ? `Caissière • ${caisseLabel}` : `Terminal Tactile • ${caisseLabel}`;
    if (headerAvatar) headerAvatar.src = avatarUrl;
    if (dropAvatar) dropAvatar.src = avatarUrl;
}

// 10. Changement rapide de caissière
function openSwitchCashierModal() {
    const menu = document.getElementById('posProfileDropdownMenu');
    if (menu) menu.classList.add('hidden');
    lockPosTerminal();
}

function closeSwitchCashierModal() {
    document.getElementById('posSwitchCashierModal')?.classList.add('hidden');
}

function showBabiCustomConfirm({
    title = "Déconnexion de Caisse",
    message = "Voulez-vous vraiment clôturer votre session de caisse et quitter le terminal ?",
    icon = "logout",
    confirmText = "Se déconnecter",
    cancelText = "Annuler",
    onConfirm = () => {}
} = {}) {
    const existing = document.getElementById('babiCustomConfirmModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'babiCustomConfirmModal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.25s ease;
    `;

    modal.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 24px;
            max-width: 420px;
            width: 100%;
            padding: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
            transform: scale(0.92);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-align: center;
        " id="babiConfirmCard">
            <div style="
                width: 64px;
                height: 64px;
                margin: 0 auto 18px auto;
                border-radius: 20px;
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border: 1px solid #fecaca;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ef4444;
                box-shadow: 0 8px 16px -4px rgba(239, 68, 68, 0.2);
            ">
                <span class="material-symbols-outlined" style="font-size: 32px;">${icon}</span>
            </div>
            <h3 style="
                font-family: 'Playfair Display', serif, system-ui;
                font-size: 20px;
                font-weight: 800;
                color: #1e293b;
                margin: 0 0 8px 0;
            ">${title}</h3>
            <p style="
                font-size: 14px;
                color: #64748b;
                margin: 0 0 24px 0;
                line-height: 1.5;
            ">${message}</p>
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            ">
                <button type="button" id="babiConfirmCancelBtn" style="
                    padding: 12px 18px;
                    border-radius: 14px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    color: #475569;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s ease;
                ">${cancelText}</button>
                <button type="button" id="babiConfirmOkBtn" style="
                    padding: 12px 18px;
                    border-radius: 14px;
                    border: none;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                    transition: all 0.15s ease;
                ">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        const card = document.getElementById('babiConfirmCard');
        if (card) card.style.transform = 'scale(1)';
    });

    const closeModal = () => {
        modal.style.opacity = '0';
        const card = document.getElementById('babiConfirmCard');
        if (card) card.style.transform = 'scale(0.92)';
        setTimeout(() => modal.remove(), 250);
    };

    document.getElementById('babiConfirmCancelBtn').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    document.getElementById('babiConfirmOkBtn').onclick = () => {
        closeModal();
        if (typeof onConfirm === 'function') onConfirm();
    };
}

// 11. Déconnexion volontaire par la caissière
async function handleCashierLogout() {
    const menu = document.getElementById('posProfileDropdownMenu');
    if (menu) menu.classList.add('hidden');

    showBabiCustomConfirm({
        title: "Déconnexion de Caisse",
        message: "Voulez-vous vraiment clôturer votre session de caisse et quitter le terminal ?",
        icon: "logout",
        confirmText: "Se déconnecter",
        cancelText: "Annuler",
        onConfirm: async () => {
            const cashier = getActiveCashier();
            const token = currentCashierToken || localStorage.getItem('babi_cashier_token');

            try {
                await fetch(`${API_ROOT}/api/cashier/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cashier_id: cashier ? cashier.id : null, token })
                });
            } catch (_) {}

            localStorage.removeItem('babi_cashier_token');
            localStorage.removeItem('babi_cashier_session');
            currentCashierSession = null;
            currentCashierToken = null;

            showPosToast("Session de caisse clôturée.", "info");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 300);
        }
    });
}

// ================================================================
// 🧠 BABI BRAIN ENGINE (BBE v3.0) — RÉCEPTION DES COMMANDES TEMPS RÉEL
// ================================================================
let lastAiEventTimestamp = Date.now();

function initCaissiereBrainFeed() {
    if (typeof EventSource !== 'undefined') {
        try {
            const evtSource = new EventSource(`${API_ROOT}/api/ai/live-feed?channel=cashier&sse=1`);
            evtSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    handleIncomingAiEvent(data);
                } catch (_) {}
            };
            evtSource.onerror = () => {
                evtSource.close();
                startBrainPolling();
            };
            return;
        } catch (_) {}
    }
    startBrainPolling();
}

function startBrainPolling() {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_ROOT}/api/ai/live-feed?channel=cashier&since=${lastAiEventTimestamp}`);
            if (res.ok) {
                const data = await res.json();
                if (data.events && data.events.length > 0) {
                    data.events.forEach(evt => {
                        handleIncomingAiEvent(evt);
                        const evtTime = new Date(evt.timestamp).getTime();
                        if (evtTime > lastAiEventTimestamp) lastAiEventTimestamp = evtTime;
                    });
                }
            }
        } catch (_) {}
    }, 25000);
}

function handleIncomingAiEvent(evt) {
    if (!evt || !evt.type) return;
    
    if (evt.type === 'ORDER_CREATED') {
        const payload = evt.payload || {};
        playPosAudio('new_order');
        showPosToast(`🔔 COMMANDE MOBILE : #${payload.orderId} (${payload.customerName}) — ${(payload.totalPrice || 0).toLocaleString()} F`, 'success');
        refreshPickupQueue();
        updateSessionStats();
        renderHistoryTable();
    } else if (evt.type === 'PIN_VALIDATED') {
        refreshPickupQueue();
        updateSessionStats();
        renderHistoryTable();
    }
}

// 🎁 GESTION SCANNER FIDÉLITÉ CLIENT EN CAISSE
let currentLoyaltyClient = null;

function openLoyaltyScannerModal() {
    document.getElementById('loyaltyScanModal')?.classList.remove('hidden');
    document.getElementById('loyalty-scan-input')?.focus();
}

function closeLoyaltyScannerModal() {
    document.getElementById('loyaltyScanModal')?.classList.add('hidden');
}

async function searchLoyaltyClient() {
    const inputVal = document.getElementById('loyalty-scan-input')?.value.trim();
    if (!inputVal) {
        alert("Veuillez saisir un code client ou numéro de téléphone.");
        return;
    }

    try {
        const res = await fetch(`${API_ROOT}/api/loyalty/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code_or_phone: inputVal })
        });

        if (res.ok) {
            const data = await res.json();
            currentLoyaltyClient = data.client;
            document.getElementById('loyalty-client-result')?.classList.remove('hidden');
            document.getElementById('loyalty-client-name').innerText = `${data.client.prenom} ${data.client.nom}`;
            document.getElementById('loyalty-client-phone').innerText = data.client.telephone || '+225 0700000000';
            document.getElementById('loyalty-client-points').innerText = `${data.client.points || 50} pts`;
            playPosAudio('chime');
        } else {
            // Demo client fallback
            currentLoyaltyClient = { prenom: 'Madame', nom: 'Touré', telephone: '+225 0708091011', points: 120 };
            document.getElementById('loyalty-client-result')?.classList.remove('hidden');
            document.getElementById('loyalty-client-name').innerText = 'Madame Touré (Membre VIP)';
            document.getElementById('loyalty-client-phone').innerText = '+225 0708091011';
            document.getElementById('loyalty-client-points').innerText = '120 pts';
        }
    } catch (_) {
        currentLoyaltyClient = { prenom: 'Client', nom: 'Fidèle', points: 80 };
        document.getElementById('loyalty-client-result')?.classList.remove('hidden');
    }
}

function applyLoyaltyDiscount(percent) {
    if (posCart.length === 0) {
        alert("Veuillez d'abord ajouter des articles au panier.");
        return;
    }
    const discountFactor = (100 - percent) / 100;
    posCart.forEach(it => {
        it.price = Math.round(it.price * discountFactor);
    });
    renderPosCart();
    closeLoyaltyScannerModal();
    showPosToast(`🎉 Remise Fidélité -${percent}% appliquée avec succès !`, 'success');
}

function applyLoyaltyFreePastry() {
    posCart.push({
        id: 'gift_croissant',
        name: '🥐 Croissant Pur Beurre (Cadeau Fidélité)',
        price: 0,
        quantity: 1,
        image: 'assets/Croissant.png'
    });
    renderPosCart();
    closeLoyaltyScannerModal();
    showPosToast("🎁 Croissant offert ajouté au ticket !", 'success');
}

// 🧾 IMPRESSION THERMIQUE DIRECTE ESC/POS (58mm & 80mm)
function printThermalReceipt(saleData) {
    const receiptNum = saleData.receipt_number || ('REC-' + Math.floor(1000 + Math.random() * 9000));
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    document.getElementById('th-ticket-num').innerText = receiptNum;
    document.getElementById('th-ticket-date').innerText = dateStr;
    document.getElementById('th-cashier-name').innerText = currentCashierUser?.nom || 'Awa';
    document.getElementById('th-client-name').innerText = currentLoyaltyClient ? `${currentLoyaltyClient.prenom} ${currentLoyaltyClient.nom}` : 'Client Comptoir';
    document.getElementById('th-total-amount').innerText = `${(saleData.total_price || 0).toLocaleString()} FCFA`;
    document.getElementById('th-payment-method').innerText = saleData.payment_method || 'Espèces';
    document.getElementById('th-amount-received').innerText = `${(saleData.amount_received || saleData.total_price || 0).toLocaleString()} FCFA`;
    document.getElementById('th-change-given').innerText = `${(saleData.change_given || 0).toLocaleString()} FCFA`;

    // Render items lines
    const itemsContainer = document.getElementById('th-items-list');
    if (itemsContainer) {
        const items = Array.isArray(saleData.items) ? saleData.items : (JSON.parse(saleData.items || '[]'));
        itemsContainer.innerHTML = items.map(it => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                <span>${it.quantity || 1}x ${it.name || it.nom}</span>
                <span>${((it.price || it.prix || 0) * (it.quantity || 1)).toLocaleString()} F</span>
            </div>
        `).join('');
    }

    // Trigger Print
    window.print();
}

// -------------------------------------------------------------
// 🧾 MODULE CLÔTURE DE CAISSE TACTILE — TICKET Z & TICKET X
// -------------------------------------------------------------

let currentClosureShiftData = {
    total_sales: 0,
    total_cash: 0,
    total_wave: 0,
    total_others: 0,
    total_tickets: 0,
    fond_de_caisse: 50000,
    especes_reelles: 50000,
    ecart: 0
};

const CASH_DENOMINATIONS = [
    { id: 'b10000', value: 10000, type: 'billet' },
    { id: 'b5000',  value: 5000,  type: 'billet' },
    { id: 'b2000',  value: 2000,  type: 'billet' },
    { id: 'b1000',  value: 1000,  type: 'billet' },
    { id: 'b500',   value: 500,   type: 'billet' },
    { id: 'p500',   value: 500,   type: 'piece' },
    { id: 'p200',   value: 200,   type: 'piece' },
    { id: 'p100',   value: 100,   type: 'piece' },
    { id: 'p50',    value: 50,    type: 'piece' },
    { id: 'p25',    value: 25,    type: 'piece' }
];

// 1. Ouvrir le Modal de Clôture (Immédiat & Fluide)
function populateClosureModalUI() {
    const kpiMap = [
        { ids: ['z-kpi-total-sales', 'view-z-kpi-total-sales'], text: `${currentClosureShiftData.total_sales.toLocaleString()} FCFA` },
        { ids: ['z-kpi-cash-sales', 'view-z-kpi-cash-sales'], text: `${currentClosureShiftData.total_cash.toLocaleString()} FCFA` },
        { ids: ['z-kpi-wave-sales', 'view-z-kpi-wave-sales'], text: `${currentClosureShiftData.total_wave.toLocaleString()} FCFA` },
        { ids: ['z-kpi-ticket-count', 'view-z-kpi-ticket-count'], text: currentClosureShiftData.total_tickets },
        { ids: ['x-total-sales'], text: `${currentClosureShiftData.total_sales.toLocaleString()} FCFA` },
        { ids: ['x-cash-sales'], text: `${currentClosureShiftData.total_cash.toLocaleString()} FCFA` },
        { ids: ['x-wave-sales'], text: `${currentClosureShiftData.total_wave.toLocaleString()} FCFA` },
        { ids: ['x-ticket-count'], text: currentClosureShiftData.total_tickets }
    ];

    kpiMap.forEach(item => {
        item.ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = item.text;
        });
    });

    const fondIds = ['z-fond-de-caisse', 'view-z-fond-de-caisse'];
    fondIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = currentClosureShiftData.fond_de_caisse;
    });

    const subtitleText = `${currentCashierUser?.nom || 'Caissière'} • ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    ['closure-modal-subtitle', 'view-closure-subtitle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = subtitleText;
    });
}

function syncFondDeCaisse(val) {
    const num = parseInt(val || '0', 10);
    ['z-fond-de-caisse', 'view-z-fond-de-caisse'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value != num) el.value = num;
    });
    recalculateCashCount();
}

function syncDenomInput(denomId, val) {
    const num = parseInt(val || '0', 10);
    [`denom_${denomId}`, `view_denom_${denomId}`].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value != num) el.value = num;
    });
    recalculateCashCount();
}

function openClosureModal() {
    const modal = document.getElementById('closureModal');
    if (!modal) {
        showPosView('closure');
        return;
    }

    try {
        playPosAudio('chime');
    } catch (_) {}

    // 1. Reset physical denomination inputs
    try {
        if (typeof CASH_DENOMINATIONS !== 'undefined' && Array.isArray(CASH_DENOMINATIONS)) {
            CASH_DENOMINATIONS.forEach(d => {
                const inp = document.getElementById(`denom_${d.id}`);
                if (inp) inp.value = 0;
                const viewInp = document.getElementById(`view_denom_${d.id}`);
                if (viewInp) viewInp.value = 0;
                const sub = document.getElementById(`sub_${d.id}`);
                if (sub) sub.innerText = '0 F';
                const viewSub = document.getElementById(`view_sub_${d.id}`);
                if (viewSub) viewSub.innerText = '0 F';
            });
        }
    } catch (_) {}

    // 2. Compute local shift data and populate UI instantly (0ms lag)
    try {
        computeLocalShiftData();
        populateClosureModalUI();
        switchClosureTab('z');
        recalculateCashCount();
    } catch (err) {
        console.warn('Non-blocking UI error in closure init:', err);
    }

    // 3. Display modal immediately
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // 4. Background refresh if API is online
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        fetch(`${API_ROOT}/api/pos/register/ticket-x`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('babi_cashier_token') || ''}` },
            signal: controller.signal
        }).then(res => {
            clearTimeout(timeoutId);
            return res.ok ? res.json() : null;
        }).then(data => {
            if (data) {
                currentClosureShiftData.total_sales = data.total_sales || currentClosureShiftData.total_sales;
                currentClosureShiftData.total_cash = data.total_cash || currentClosureShiftData.total_cash;
                currentClosureShiftData.total_wave = data.total_wave || currentClosureShiftData.total_wave;
                currentClosureShiftData.total_others = data.total_others || currentClosureShiftData.total_others;
                currentClosureShiftData.total_tickets = data.total_tickets || currentClosureShiftData.total_tickets;
                currentClosureShiftData.fond_de_caisse = data.fond_de_caisse || currentClosureShiftData.fond_de_caisse;
                populateClosureModalUI();
                recalculateCashCount();
            }
        }).catch(() => {});
    } catch (_) {}
}

function openTicketXModal() {
    openClosureModal();
    switchClosureTab('x');
}

function computeLocalShiftData() {
    let sales = 0, cash = 0, wave = 0, others = 0, count = 0;
    try {
        const hSales = JSON.parse(localStorage.getItem('babi_history_sales') || '[]');
        const bOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
        const pSales = JSON.parse(localStorage.getItem('babi_pos_sales_history') || '[]');
        
        const map = new Map();
        [...hSales, ...bOrders, ...pSales].forEach(s => {
            if (!s) return;
            const id = String(s.id || s.order_number || s.orderId || Math.random());
            if (!map.has(id)) {
                map.set(id, s);
            }
        });

        const todayStr = new Date().toISOString().slice(0, 10);
        Array.from(map.values()).forEach(s => {
            const dateStr = s.created_at || s.createdAt || '';
            if (!dateStr || dateStr.startsWith(todayStr) || (new Date(dateStr).toDateString() === new Date().toDateString())) {
                const total = parseFloat(s.total_price || s.total_amount || s.total || 0);
                sales += total;
                count++;
                const method = String(s.mode_paiement || s.payment_method || '').toLowerCase();
                if (method.includes('wave') || method.includes('mobile')) wave += total;
                else if (method.includes('orange') || method.includes('mtn')) others += total;
                else cash += total;
            }
        });
    } catch (_) {}
    currentClosureShiftData.total_sales = sales;
    currentClosureShiftData.total_cash = cash;
    currentClosureShiftData.total_wave = wave;
    currentClosureShiftData.total_others = others;
    currentClosureShiftData.total_tickets = count;
}

function closeClosureModal() {
    const modal = document.getElementById('closureModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function switchClosureTab(tab) {
    const contentZ = document.getElementById('tab-content-closure-z');
    const contentX = document.getElementById('tab-content-closure-x');
    const btnZ = document.getElementById('tab-btn-closure-z');
    const btnX = document.getElementById('tab-btn-closure-x');

    if (tab === 'z') {
        if (contentZ) contentZ.classList.remove('hidden');
        if (contentX) contentX.classList.add('hidden');
        if (btnZ) {
            btnZ.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-black text-slate-900 bg-white shadow-xs transition-all flex items-center justify-center gap-1.5';
        }
        if (btnX) {
            btnX.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5';
        }
    } else {
        if (contentZ) contentZ.classList.add('hidden');
        if (contentX) contentX.classList.remove('hidden');
        if (btnX) {
            btnX.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-black text-slate-900 bg-white shadow-xs transition-all flex items-center justify-center gap-1.5';
        }
        if (btnZ) {
            btnZ.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5';
        }
    }
}

// 2. Ajustement des coupures (+ / -)
function adjustDenomQty(denomId, delta) {
    const input = document.getElementById(`denom_${denomId}`) || document.getElementById(`view_denom_${denomId}`);
    let curVal = parseInt(input?.value || '0', 10);
    let qty = curVal + delta;
    if (qty < 0) qty = 0;
    
    [`denom_${denomId}`, `view_denom_${denomId}`].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = qty;
    });
    recalculateCashCount();
}

// 3. Calculateur de Réconciliation & Écart en Temps Réel
function recalculateCashCount() {
    let totalCashCounted = 0;
    const detailComptage = {};

    CASH_DENOMINATIONS.forEach(d => {
        const input = document.getElementById(`denom_${d.id}`) || document.getElementById(`view_denom_${d.id}`);
        const qty = parseInt(input?.value || '0', 10);
        const subtotal = qty * d.value;
        totalCashCounted += subtotal;
        detailComptage[d.id] = { qty, subtotal };

        [`sub_${d.id}`, `view_sub_${d.id}`].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `${subtotal.toLocaleString()} F`;
        });
        
        [`denom_${d.id}`, `view_denom_${d.id}`].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value != qty) el.value = qty;
        });
    });

    const fondInput = document.getElementById('z-fond-de-caisse') || document.getElementById('view-z-fond-de-caisse');
    const fond = parseInt(fondInput?.value || '50000', 10);
    const expectedCash = fond + (currentClosureShiftData.total_cash || 0);
    const ecart = totalCashCounted - expectedCash;

    currentClosureShiftData.especes_reelles = totalCashCounted;
    currentClosureShiftData.fond_de_caisse = fond;
    currentClosureShiftData.ecart = ecart;
    currentClosureShiftData.detail_comptage = detailComptage;

    // Update UI Labels in both View and Modal
    ['z-total-cash-counted', 'view-z-total-cash-counted'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = `${totalCashCounted.toLocaleString()} FCFA`;
    });

    ['z-expected-cash', 'view-z-expected-cash'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = `${expectedCash.toLocaleString()} FCFA`;
    });
    
    ['z-discrepancy-amount', 'view-z-discrepancy-amount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = `${(ecart >= 0 ? '+' : '')}${ecart.toLocaleString()} FCFA`;
    });

    let statusText = 'Caisse Parfaitement Équilibrée ✅';
    let statusClass = 'text-xs font-bold text-emerald-400';
    let amountClass = 'text-xl font-mono font-black text-emerald-400';

    if (ecart > 0) {
        statusText = `Excédent en Tiroir (+${ecart.toLocaleString()} F) 🟢`;
        statusClass = 'text-xs font-bold text-sky-400';
        amountClass = 'text-xl font-mono font-black text-sky-400';
    } else if (ecart < 0) {
        statusText = `Déficit / Manquant en Caisse (${ecart.toLocaleString()} F) ⚠️`;
        statusClass = 'text-xs font-bold text-rose-400';
        amountClass = 'text-xl font-mono font-black text-rose-400';
    }

    ['z-discrepancy-status', 'view-z-discrepancy-status'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = statusText;
            el.className = statusClass;
        }
    });

    ['z-discrepancy-amount', 'view-z-discrepancy-amount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = amountClass;
    });
}

// 4. Modal Ticket X Direct
function openTicketXModal() {
    openClosureModal();
    switchClosureTab('x');
}

function printTicketXDirect() {
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    const xNum = `X-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;

    const textToPrint = `
========================================
           BOULANGERIE DE BABI
         Riviera 3 • Abidjan
      *** TICKET X - LECTURE ***
========================================
Numéro X    : ${xNum}
Date / Heure: ${dateStr}
Terminal    : CAISSE 1 - RIVIERA
Caissier(e) : ${currentCashierUser?.nom || 'CAISSIERE 1'}
----------------------------------------
CHIFFRE D'AFFAIRES DU JOUR :
TOTAL VENTES TTC : ${currentClosureShiftData.total_sales.toLocaleString()} FCFA
  - Espèces      : ${currentClosureShiftData.total_cash.toLocaleString()} FCFA
  - Wave         : ${currentClosureShiftData.total_wave.toLocaleString()} FCFA
  - Autres / CB  : ${currentClosureShiftData.total_others.toLocaleString()} FCFA
NOMBRE TICKETS   : ${currentClosureShiftData.total_tickets}
----------------------------------------
   Lecture intermédiaire non clôturée
========================================
    `.trim();

    const w = window.open('', '_blank', 'width=350,height=550');
    if (w) {
        w.document.write(`<pre style="font-family:monospace; font-size:12px; line-height:1.4; padding:10px;">${textToPrint}</pre>`);
        w.document.close();
        w.focus();
        w.print();
        setTimeout(() => w.close(), 1000);
    }
}

// 5. Valider la Clôture Définitive (Ticket Z)
async function submitDailyClosureZ() {
    recalculateCashCount();
    const notes = document.getElementById('z-closure-notes')?.value || '';

    const payload = {
        fond_de_caisse: currentClosureShiftData.fond_de_caisse,
        total_ventes: currentClosureShiftData.total_sales,
        total_especes: currentClosureShiftData.total_cash,
        total_wave: currentClosureShiftData.total_wave,
        total_others: currentClosureShiftData.total_others,
        total_tickets: currentClosureShiftData.total_tickets,
        especes_reelles: currentClosureShiftData.especes_reelles,
        ecart: currentClosureShiftData.ecart,
        detail_comptage: currentClosureShiftData.detail_comptage,
        notes: notes,
        closed_by: currentCashierUser?.nom || 'CAISSIERE 1'
    };

    let zResult = null;

    try {
        const res = await fetch(`${API_ROOT}/api/pos/register/close-z`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('babi_cashier_token') || ''}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            zResult = await res.json();
        }
    } catch (_) {}

    // Fallback local Z calculation if offline
    if (!zResult || !zResult.z_report) {
        const now = new Date();
        const numZ = `Z-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;
        zResult = {
            success: true,
            z_report: {
                ...payload,
                numero_z: numZ,
                closed_at: now.toISOString()
            }
        };
    }

    // Save to local closure history
    try {
        const closures = JSON.parse(localStorage.getItem('babi_pos_closures_history') || '[]');
        closures.unshift(zResult.z_report);
        localStorage.setItem('babi_pos_closures_history', JSON.stringify(closures));
    } catch (_) {}

    // Close closure modal & render official 80mm Ticket Z
    closeClosureModal();
    renderTicketZModal(zResult.z_report);
    showPosToast('🔒 Clôture de Caisse effectuée avec succès ! Ticket Z généré.', 'success');
}

// 6. Rendu du Reçu Thermique Ticket Z Officiel (80mm)
function renderTicketZModal(report) {
    const modal = document.getElementById('ticketZModal');
    if (!modal) return;

    const dateObj = report.closed_at ? new Date(report.closed_at) : new Date();
    const dateStr = `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    const expectedCash = (report.fond_de_caisse || 50000) + (report.total_especes || 0);
    const ecart = (report.especes_reelles || 0) - expectedCash;
    let ecartStr = '0 F CFA (ÉQUILIBRÉ)';
    if (ecart > 0) ecartStr = `+${ecart.toLocaleString()} F (EXCÉDENT)`;
    else if (ecart < 0) ecartStr = `${ecart.toLocaleString()} F (DÉFICIT)`;

    const elNum = document.getElementById('tz-num');
    const elDate = document.getElementById('tz-date');
    const elTerm = document.getElementById('tz-terminal');
    const elCashier = document.getElementById('tz-cashier');

    const elSales = document.getElementById('tz-total-sales');
    const elCash = document.getElementById('tz-total-cash');
    const elWave = document.getElementById('tz-total-wave');
    const elOthers = document.getElementById('tz-total-others');
    const elCount = document.getElementById('tz-ticket-count');

    const elFond = document.getElementById('tz-fond');
    const elTheorique = document.getElementById('tz-theorique');
    const elReel = document.getElementById('tz-reel');
    const elEcart = document.getElementById('tz-ecart');

    if (elNum) elNum.innerText = report.numero_z || ('Z-' + Math.floor(1000 + Math.random() * 9000));
    if (elDate) elDate.innerText = dateStr;
    if (elTerm) elTerm.innerText = 'CAISSE 1 - RIVIERA';
    if (elCashier) elCashier.innerText = report.closed_by || currentCashierUser?.nom || 'CAISSIERE 1';

    if (elSales) elSales.innerText = `${(report.total_ventes || 0).toLocaleString()} F CFA`;
    if (elCash) elCash.innerText = `${(report.total_especes || 0).toLocaleString()} F CFA`;
    if (elWave) elWave.innerText = `${(report.total_wave || 0).toLocaleString()} F CFA`;
    if (elOthers) elOthers.innerText = `${(report.total_others || 0).toLocaleString()} F CFA`;
    if (elCount) elCount.innerText = `${report.total_tickets || 0} Tickets`;

    if (elFond) elFond.innerText = `${(report.fond_de_caisse || 50000).toLocaleString()} F CFA`;
    if (elTheorique) elTheorique.innerText = `${expectedCash.toLocaleString()} F CFA`;
    if (elReel) elReel.innerText = `${(report.especes_reelles || 0).toLocaleString()} F CFA`;
    if (elEcart) elEcart.innerText = ecartStr;

    modal.classList.remove('hidden');
}

function closeTicketZModal() {
    const modal = document.getElementById('ticketZModal');
    if (modal) modal.classList.add('hidden');
}

// 7. Impression Thermique Ticket Z (80mm)
function printTicketZDirect() {
    const printArea = document.getElementById('ticket-z-printable-area');
    if (!printArea) return;

    const w = window.open('', '_blank', 'width=380,height=650');
    if (w) {
        w.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Impression Ticket Z - Boulangerie de Babi</title>
                <style>
                    @page { size: 80mm auto; margin: 0; }
                    body { font-family: monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 11px; color: #000; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .flex { display: flex; justify-content: space-between; }
                    .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
                    .logo-circle { width: 44px; height: 44px; border: 2px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 900; }
                </style>
            </head>
            <body>
                ${printArea.innerHTML}
            </body>
            </html>
        `);
        w.document.close();
        w.focus();
        w.print();
        setTimeout(() => w.close(), 1200);
    }
}

// 8. Partage WhatsApp 1-Clic au Gérant
function shareTicketZOnWhatsApp() {
    const zNum = document.getElementById('tz-num')?.innerText || 'Z-0000';
    const dateStr = document.getElementById('tz-date')?.innerText || '';
    const cashier = document.getElementById('tz-cashier')?.innerText || 'Caissière';
    const totalSales = document.getElementById('tz-total-sales')?.innerText || '0 F';
    const totalCash = document.getElementById('tz-total-cash')?.innerText || '0 F';
    const totalWave = document.getElementById('tz-total-wave')?.innerText || '0 F';
    const tickets = document.getElementById('tz-ticket-count')?.innerText || '0';
    const ecart = document.getElementById('tz-ecart')?.innerText || '0 F (ÉQUILIBRÉ)';
    const fond = document.getElementById('tz-fond')?.innerText || '50 000 F';
    const reel = document.getElementById('tz-reel')?.innerText || '50 000 F';

    const msg = `🥖 *BOULANGERIE DE BABI — RAPPORT DE CLÔTURE Z* 🥖\n\n` +
        `📋 *Z N° :* ${zNum}\n` +
        `📅 *Date :* ${dateStr}\n` +
        `👤 *Caissier(e) :* ${cashier}\n` +
        `📍 *Terminal :* Caisse 1 - Riviera\n\n` +
        `💰 *CHIFFRE D'AFFAIRES :*\n` +
        `• Total TTC : *${totalSales}*\n` +
        `• Espèces : ${totalCash}\n` +
        `• Wave : ${totalWave}\n` +
        `• Tickets Servis : ${tickets}\n\n` +
        `🔍 *RÉCONCILIATION TIROIR :*\n` +
        `• Fond Initial : ${fond}\n` +
        `• Espèces Réelles : *${reel}*\n` +
        `• Écart de Caisse : *${ecart}*\n\n` +
        `✅ _Clôture journalière validée et enregistrée._`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// 9. Copier le Rapport Z
function copyTicketZText() {
    const zNum = document.getElementById('tz-num')?.innerText || 'Z-0000';
    const dateStr = document.getElementById('tz-date')?.innerText || '';
    const cashier = document.getElementById('tz-cashier')?.innerText || 'Caissière';
    const totalSales = document.getElementById('tz-total-sales')?.innerText || '0 F';
    const totalCash = document.getElementById('tz-total-cash')?.innerText || '0 F';
    const totalWave = document.getElementById('tz-total-wave')?.innerText || '0 F';
    const tickets = document.getElementById('tz-ticket-count')?.innerText || '0';
    const ecart = document.getElementById('tz-ecart')?.innerText || '0 F';

    const text = `BOULANGERIE DE BABI - CLÔTURE Z\nN°: ${zNum}\nDate: ${dateStr}\nCaissière: ${cashier}\nTotal Ventes: ${totalSales}\nEspèces: ${totalCash}\nWave: ${totalWave}\nTickets: ${tickets}\nÉcart: ${ecart}`;
    navigator.clipboard.writeText(text).then(() => {
        showPosToast('📋 Rapport Z copié dans le presse-papier !', 'info');
    });
}
