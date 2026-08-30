/**
 * 🏛️ BOULANGERIE DE BABI — ADMIN JAVASCRIPT CONTROLLER
 */

let allProducts = [];
let allOrders = [];
let currentCategoryFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    await loadProducts();
    await loadOrders();
    await loadInsights();

    // BroadcastChannel pour synchronisation temps réel
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('babi_global_sync');
        channel.onmessage = (event) => {
            if (event.data) {
                if (event.data.type === 'PRODUCTS_UPDATED' || event.data.type === 'STOCK_UPDATED') {
                    loadProducts();
                } else if (event.data.type === 'NEW_ORDER' || event.data.type === 'ORDER_STATUS_CHANGED') {
                    loadOrders();
                    loadInsights();
                }
            }
        };
    }
});

function initClock() {
    const el = document.getElementById('admin-live-clock');
    if (!el) return;
    const update = () => {
        const now = new Date();
        el.innerText = now.toLocaleTimeString('fr-FR');
    };
    update();
    setInterval(update, 1000);
}

function toggleAdminSidebar(open) {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');
    if (!sidebar) return;
    if (open) {
        sidebar.classList.add('open');
        overlay?.classList.remove('hidden');
    } else {
        sidebar.classList.remove('open');
        overlay?.classList.add('hidden');
    }
}

function showAdminSection(sectionName) {
    const sections = ['dashboard', 'products', 'orders', 'finances'];
    sections.forEach(s => {
        const el = document.getElementById(`section-${s}`);
        const nav = document.getElementById(`nav-${s}`);
        if (el) el.classList.toggle('hidden', s !== sectionName);
        if (nav) nav.classList.toggle('active', s !== sectionName);
    });

    const titles = {
        'dashboard': 'Tableau de Bord Direction',
        'products': 'Catalogue Produits Officiel',
        'orders': 'Suivi des Commandes',
        'finances': 'Finances & Recettes'
    };

    const titleEl = document.getElementById('admin-topbar-title');
    if (titleEl) titleEl.innerText = titles[sectionName] || 'Administration';

    toggleAdminSidebar(false);
}

async function loadProducts() {
    // 1. Initialisation synchrone depuis le cache local (79 produits)
    if (typeof window.babiGetCachedProducts === 'function') {
        allProducts = window.babiGetCachedProducts();
    } else if (window.BABI_EMBEDDED_CATALOG) {
        allProducts = window.BABI_EMBEDDED_CATALOG;
    }

    renderProductsGrid();
    updateDashboardStats();

    // 2. Fetcher depuis l'API backend
    try {
        const apiBase = window.API_BASE_URL || '';
        const fetcher = (typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${apiBase}/api/products?_t=${Date.now()}`);
        if (res && res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.products || []);
            if (list.length > 0) {
                allProducts = list;
                if (typeof window.babiSetCachedProducts === 'function') {
                    window.babiSetCachedProducts(allProducts);
                }
                renderProductsGrid();
                updateDashboardStats();
            }
        }
    } catch (_) {}
}

function renderProductsGrid() {
    const grid = document.getElementById('admin-products-grid');
    if (!grid) return;

    const searchTerm = (document.getElementById('admin-product-search')?.value || '').toLowerCase().trim();

    const filtered = allProducts.filter(p => {
        const cat = (p.categorie || p.category || '').toLowerCase();
        const nom = (p.nom || p.name || '').toLowerCase();

        const matchCat = (currentCategoryFilter === 'all') || (cat === currentCategoryFilter);
        const matchSearch = nom.includes(searchTerm) || String(p.prix).includes(searchTerm);
        return matchCat && matchSearch;
    });

    const countEl = document.getElementById('sidebar-product-count');
    if (countEl) countEl.innerText = allProducts.length;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-stone-500 font-bold">Aucun produit ne correspond à la recherche.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const stockClass = (p.stock <= p.seuil_alerte) ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
        return `
            <div class="product-card-admin">
                <div class="product-img-box-admin">
                    <img src="${p.image || 'assets/Croissant.png'}" alt="${p.nom}" onerror="this.onerror=null; this.src='assets/Croissant.png';"/>
                    <span class="badge-gold absolute top-2 right-2">${Number(p.prix).toLocaleString()} FCFA</span>
                </div>
                <div class="p-3.5 flex-1 flex flex-col justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">${p.categorie || 'Boulangerie'}</span>
                        <h4 class="font-serif font-black text-sm text-[#1a0c06] line-clamp-1 mt-0.5">${p.nom}</h4>
                        <p class="text-xs text-stone-500 line-clamp-2 mt-1">${p.description || ''}</p>
                    </div>
                    <div class="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span class="px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold ${stockClass}">
                            Stock : ${p.stock}
                        </span>
                        <div class="flex items-center gap-1">
                            <button onclick="editProduct(${p.id})" class="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-800 transition-colors" title="Modifier">
                                <span class="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button onclick="deleteProduct(${p.id})" class="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-800 transition-colors" title="Supprimer">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setAdminCategoryFilter(cat, btn) {
    currentCategoryFilter = cat;
    document.querySelectorAll('#admin-category-tabs button').forEach(b => {
        b.className = 'px-4 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50';
    });
    if (btn) {
        btn.className = 'px-4 py-1.5 rounded-full bg-amber-400 text-black font-extrabold text-xs shadow-xs';
    }
    renderProductsGrid();
}

function filterAdminProducts() {
    renderProductsGrid();
}

function updateDashboardStats() {
    const prodCountEl = document.getElementById('stat-total-products');
    if (prodCountEl) prodCountEl.innerText = allProducts.length;

    const lowStockCount = allProducts.filter(p => p.stock <= p.seuil_alerte).length;
    const lowStockEl = document.getElementById('stat-low-stock');
    if (lowStockEl) lowStockEl.innerText = lowStockCount;
}

// ============================================================================
// COMMANDES & FINANCES
// ============================================================================
async function loadOrders() {
    try {
        const apiBase = window.API_BASE_URL || '';
        const fetcher = (typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${apiBase}/api/orders?_t=${Date.now()}`);
        if (res && res.ok) {
            const data = await res.json();
            allOrders = Array.isArray(data) ? data : (data.orders || []);
            renderOrdersTable();
            renderDashboardRecentOrders();
            calculateFinances();
        }
    } catch (_) {}
}

function renderOrdersTable() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    if (allOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-stone-400">Aucune commande pour le moment.</td></tr>`;
        return;
    }

    const searchTerm = (document.getElementById('admin-order-search')?.value || '').toLowerCase().trim();

    const filtered = allOrders.filter(o => {
        const code = (o.pickup_code || o.id || '').toString().toLowerCase();
        const client = (o.customer_name || o.client_name || '').toLowerCase();
        return code.includes(searchTerm) || client.includes(searchTerm);
    });

    tbody.innerHTML = filtered.map(o => {
        const statusBadge = (o.status === 'completed' || o.status === 'delivered' || o.statut === 'pret')
            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Livré</span>'
            : '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold animate-pulse">En attente</span>';

        return `
            <tr>
                <td class="font-mono font-bold">#${o.id}</td>
                <td class="text-xs text-stone-500">${o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}</td>
                <td><strong class="font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">${o.pickup_code || '---'}</strong></td>
                <td class="font-bold text-[#1a0c06]">${o.customer_name || o.client_name || 'Client Comptoir'}</td>
                <td class="text-xs text-stone-600 max-w-xs truncate">${formatOrderItems(o.items)}</td>
                <td class="font-mono font-black text-[#1a0c06]">${Number(o.total_price || o.total || 0).toLocaleString()} F</td>
                <td class="text-xs font-bold text-stone-600 uppercase">${o.payment_method || 'Espèces'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="updateOrderStatus(${o.id}, 'completed')" class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">Valider</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderDashboardRecentOrders() {
    const tbody = document.getElementById('dashboard-recent-orders-tbody');
    if (!tbody) return;

    const recent = allOrders.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-stone-400">Aucune commande récente.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(o => `
        <tr>
            <td class="font-mono font-bold text-amber-700">#${o.id} (${o.pickup_code || 'N/A'})</td>
            <td class="font-bold text-[#1a0c06]">${o.customer_name || 'Client'}</td>
            <td class="text-xs text-stone-600 max-w-[180px] truncate">${formatOrderItems(o.items)}</td>
            <td class="font-mono font-black">${Number(o.total_price || o.total || 0).toLocaleString()} F</td>
            <td><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Payé</span></td>
        </tr>
    `).join('');
}

function formatOrderItems(items) {
    if (!items) return '1 commande';
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (_) { return items; }
    }
    if (Array.isArray(items)) {
        return items.map(i => `${i.quantity || i.qte || 1}x ${i.nom || i.name}`).join(', ');
    }
    return '1 commande';
}

function calculateFinances() {
    let totalRev = 0;
    let esp = 0;
    let wave = 0;
    let mobile = 0;

    allOrders.forEach(o => {
        const amt = Number(o.total_price || o.total || 0);
        totalRev += amt;
        const method = (o.payment_method || '').toLowerCase();
        if (method.includes('wave')) wave += amt;
        else if (method.includes('orange') || method.includes('mtn') || method.includes('moov')) mobile += amt;
        else esp += amt;
    });

    const revEl = document.getElementById('stat-total-revenue');
    if (revEl) revEl.innerText = totalRev.toLocaleString() + ' F';

    const ordEl = document.getElementById('stat-total-orders');
    if (ordEl) ordEl.innerText = allOrders.length;

    const finEsp = document.getElementById('fin-especes');
    if (finEsp) finEsp.innerText = esp.toLocaleString() + ' F';

    const finWave = document.getElementById('fin-wave');
    if (finWave) finWave.innerText = wave.toLocaleString() + ' F';

    const finMobile = document.getElementById('fin-mobile');
    if (finMobile) finMobile.innerText = mobile.toLocaleString() + ' F';

    const finGrand = document.getElementById('fin-grand-total');
    if (finGrand) finGrand.innerText = totalRev.toLocaleString() + ' FCFA';
}

async function loadInsights() {
    try {
        const apiBase = window.API_BASE_URL || '';
        const fetcher = (typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${apiBase}/api/ai/insights`);
        if (res && res.ok) {
            const data = await res.json();
            const box = document.getElementById('dashboard-bix-insight');
            if (box && data && data.salesSummary) {
                box.innerText = `💡 Analyse BIX : ${data.salesSummary.totalOrdersRecorded} commandes traitées. Recettes totales de ${data.salesSummary.totalRevenueFCFA.toLocaleString()} FCFA. Les meilleures ventes se concentrent sur les viennoiseries et les baguettes traditions.`;
            }
        }
    } catch (_) {}
}

// ============================================================================
// MODAL GESTION PRODUITS
// ============================================================================
function openProductModal() {
    document.getElementById('modal-product-title').innerText = 'Ajouter un Produit';
    document.getElementById('productForm').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
}

function editProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('modal-product-title').innerText = 'Modifier le Produit #' + id;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.nom || p.name;
    document.getElementById('prod-price').value = p.prix || p.price;
    document.getElementById('prod-cat').value = p.categorie || p.category || 'pain';
    document.getElementById('prod-stock').value = p.stock || 50;
    document.getElementById('prod-alert').value = p.seuil_alerte || 10;
    document.getElementById('prod-image').value = p.image || '';
    document.getElementById('prod-desc').value = p.description || '';
    document.getElementById('productModal').classList.remove('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const productData = {
        id: id ? Number(id) : Date.now(),
        nom: document.getElementById('prod-name').value.trim(),
        prix: Number(document.getElementById('prod-price').value),
        categorie: document.getElementById('prod-cat').value,
        stock: Number(document.getElementById('prod-stock').value),
        seuil_alerte: Number(document.getElementById('prod-alert').value),
        image: document.getElementById('prod-image').value.trim() || 'assets/Croissant.png',
        description: document.getElementById('prod-desc').value.trim(),
        is_active: 1
    };

    if (id) {
        const idx = allProducts.findIndex(x => x.id === Number(id));
        if (idx !== -1) allProducts[idx] = productData;
    } else {
        allProducts.push(productData);
    }

    if (typeof window.babiSetCachedProducts === 'function') {
        window.babiSetCachedProducts(allProducts);
    }

    renderProductsGrid();
    updateDashboardStats();
    closeProductModal();

    // Synchro API
    try {
        const apiBase = window.API_BASE_URL || '';
        await fetch(`${apiBase}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
    } catch (_) {}
}

async function deleteProduct(id) {
    if (!confirm('Confirmez-vous la suppression de ce produit ?')) return;
    allProducts = allProducts.filter(p => p.id !== id);
    if (typeof window.babiAddDeletedProductId === 'function') {
        window.babiAddDeletedProductId(id);
    }
    if (typeof window.babiSetCachedProducts === 'function') {
        window.babiSetCachedProducts(allProducts);
    }
    renderProductsGrid();
    updateDashboardStats();

    try {
        const apiBase = window.API_BASE_URL || '';
        await fetch(`${apiBase}/api/products/${id}`, { method: 'DELETE' });
    } catch (_) {}
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const apiBase = window.API_BASE_URL || '';
        await fetch(`${apiBase}/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        await loadOrders();
    } catch (_) {}
}

function logoutAdmin() {
    if (confirm('Voulez-vous vous déconnecter du panel Admin ?')) {
        window.location.href = 'index.html';
    }
}
