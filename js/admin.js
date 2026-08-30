/**
 * 🥐 BOULANGERIE DE BABI — ADMIN CONTROLLER ULTRA FACILE
 */

let allProducts = [];
let allOrders = [];
let currentCategoryFilter = 'all';
let quickSaleItems = [];
let quickSalePaymentMethod = 'especes';

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    await loadOrders();
    await loadInsights();
    populateQuickSaleSelect();

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

// Navigation Facile entre Sections
function showAdminSection(sectionName) {
    const sections = ['dashboard', 'products', 'orders', 'finances'];
    sections.forEach(s => {
        const el = document.getElementById(`section-${s}`);
        const navDesktop = document.getElementById(`nav-${s}`);
        const navMobile = document.getElementById(`mob-${s}`);
        if (el) el.classList.toggle('hidden', s !== sectionName);
        if (navDesktop) navDesktop.classList.toggle('active', s !== sectionName);
        if (navMobile) navMobile.classList.toggle('active', s !== sectionName);
    });

    const titles = {
        'dashboard': 'Tableau de Bord Direction',
        'products': 'Catalogue Produits (79 articles)',
        'orders': 'Commandes & Ventes',
        'finances': 'Recettes & Caisse'
    };

    const titleEl = document.getElementById('admin-topbar-title');
    if (titleEl) titleEl.innerText = titles[sectionName] || 'Administration';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Chargement des Produits
async function loadProducts() {
    if (typeof window.babiGetCachedProducts === 'function') {
        allProducts = window.babiGetCachedProducts();
    } else if (window.BABI_EMBEDDED_CATALOG) {
        allProducts = window.BABI_EMBEDDED_CATALOG;
    }

    renderProductsGrid();
    updateDashboardStats();
    populateQuickSaleSelect();

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
                populateQuickSaleSelect();
            }
        }
    } catch (_) {}
}

// Rendu des Produits avec Boutons Rapides de Stock (+10, +5, -1)
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

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-stone-500 font-bold">Aucun produit trouvé.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const isLow = p.stock <= p.seuil_alerte;
        const stockBadge = isLow 
            ? `<span class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[11px] border border-rose-200">Stock Bas : ${p.stock}</span>`
            : `<span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">Stock : ${p.stock}</span>`;

        return `
            <div class="product-card-easy">
                <div class="product-thumb-container">
                    <img src="${p.image || 'assets/Croissant.png'}" alt="${p.nom}" onerror="this.onerror=null; this.src='assets/Croissant.png';"/>
                    <span class="absolute top-2 right-2 bg-amber-400 text-black font-black text-xs px-2 py-0.5 rounded-lg shadow-xs">${Number(p.prix).toLocaleString()} F</span>
                </div>
                <div class="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                        <h4 class="font-serif font-black text-sm text-[#1a0c06] line-clamp-1">${p.nom}</h4>
                        <div class="flex items-center justify-between mt-1">
                            ${stockBadge}
                            <button onclick="editProduct(${p.id})" class="text-xs font-bold text-amber-700 hover:underline">Modifier</button>
                        </div>
                    </div>

                    <!-- Ajustement Rapide de Stock en 1 Clic -->
                    <div class="pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                        <span class="text-[10px] font-extrabold text-stone-500 uppercase">Ajuster :</span>
                        <div class="flex items-center gap-1">
                            <button onclick="quickAdjustStock(${p.id}, -1)" class="btn-stock-quick" title="Retirer 1">-1</button>
                            <button onclick="quickAdjustStock(${p.id}, 5)" class="btn-stock-quick" title="Ajouter 5">+5</button>
                            <button onclick="quickAdjustStock(${p.id}, 10)" class="btn-stock-quick" title="Ajouter 10">+10</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Ajustement Rapide de Stock
async function quickAdjustStock(productId, delta) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;

    p.stock = Math.max(0, (p.stock || 0) + delta);

    if (typeof window.babiSetCachedProducts === 'function') {
        window.babiSetCachedProducts(allProducts);
    }
    renderProductsGrid();
    updateDashboardStats();
    showToast(`📦 Stock de "${p.nom}" ajusté : ${p.stock} unités`);

    // Synchronisation API
    try {
        const apiBase = window.API_BASE_URL || '';
        await fetch(`${apiBase}/api/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: p.stock })
        });
    } catch (_) {}
}

function setAdminCategoryFilter(cat, btn) {
    currentCategoryFilter = cat;
    document.querySelectorAll('#admin-category-tabs button').forEach(b => {
        b.className = 'px-4 py-2 rounded-full bg-white border border-stone-200 text-stone-700 font-bold text-xs shrink-0 hover:bg-stone-50';
    });
    if (btn) {
        btn.className = 'px-4 py-2 rounded-full bg-amber-400 text-black font-extrabold text-xs shrink-0 shadow-xs';
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
// MODAL D'ENCAISSEMENT RAPIDE AU COMPTOIR
// ============================================================================
function openQuickSaleModal() {
    quickSaleItems = [];
    quickSalePaymentMethod = 'especes';
    renderQuickSaleItems();
    document.getElementById('quickSaleModal').classList.remove('hidden');
}

function closeQuickSaleModal() {
    document.getElementById('quickSaleModal').classList.add('hidden');
}

function populateQuickSaleSelect() {
    const select = document.getElementById('quick-sale-product-select');
    if (!select) return;
    select.innerHTML = `<option value="">-- Toucher pour ajouter un produit (79 articles) --</option>` + 
        allProducts.map(p => `<option value="${p.id}">${p.nom} — ${Number(p.prix).toLocaleString()} FCFA</option>`).join('');
}

function addQuickSaleItem() {
    const select = document.getElementById('quick-sale-product-select');
    const id = Number(select.value);
    if (!id) return;

    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const existing = quickSaleItems.find(i => i.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        quickSaleItems.push({
            id: product.id,
            nom: product.nom,
            prix: product.prix,
            quantity: 1
        });
    }

    select.value = '';
    renderQuickSaleItems();
}

function renderQuickSaleItems() {
    const container = document.getElementById('quick-sale-items-list');
    const totalEl = document.getElementById('quick-sale-total');
    if (!container) return;

    if (quickSaleItems.length === 0) {
        container.innerHTML = `<div class="text-stone-400 italic py-4 text-center">Aucun article ajouté pour l'instant</div>`;
        if (totalEl) totalEl.innerText = '0 F';
        return;
    }

    let total = 0;
    container.innerHTML = quickSaleItems.map((item, index) => {
        const lineTotal = item.prix * item.quantity;
        total += lineTotal;
        return `
            <div class="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-200">
                <span class="font-bold text-stone-800">${item.nom}</span>
                <div class="flex items-center gap-2">
                    <div class="flex items-center border border-stone-300 rounded-lg overflow-hidden">
                        <button onclick="changeQuickSaleQty(${index}, -1)" class="px-2 py-1 bg-stone-100 hover:bg-stone-200 font-bold">-</button>
                        <span class="px-2 font-mono font-bold">${item.quantity}</span>
                        <button onclick="changeQuickSaleQty(${index}, 1)" class="px-2 py-1 bg-stone-100 hover:bg-stone-200 font-bold">+</button>
                    </div>
                    <span class="font-mono font-black text-amber-900 w-16 text-right">${lineTotal.toLocaleString()} F</span>
                </div>
            </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = total.toLocaleString() + ' F';
}

function changeQuickSaleQty(index, delta) {
    if (!quickSaleItems[index]) return;
    quickSaleItems[index].quantity += delta;
    if (quickSaleItems[index].quantity <= 0) {
        quickSaleItems.splice(index, 1);
    }
    renderQuickSaleItems();
}

function setQuickSalePayment(method, btn) {
    quickSalePaymentMethod = method;
    document.querySelectorAll('.quick-pay-btn').forEach(b => {
        b.className = 'quick-pay-btn p-2.5 rounded-xl border-2 border-stone-200 bg-white font-bold text-xs text-center';
    });
    if (btn) {
        btn.className = 'quick-pay-btn p-2.5 rounded-xl border-2 border-amber-400 bg-amber-50 font-bold text-xs text-center';
    }
}

async function confirmQuickSale() {
    if (quickSaleItems.length === 0) {
        alert('Veuillez ajouter au moins un produit.');
        return;
    }

    const total = quickSaleItems.reduce((sum, i) => sum + (i.prix * i.quantity), 0);
    const orderData = {
        id: Date.now(),
        customer_name: 'Client Comptoir',
        items: quickSaleItems,
        total_price: total,
        payment_method: quickSalePaymentMethod,
        status: 'completed',
        pickup_code: 'VENTE-' + Math.floor(1000 + Math.random() * 9000),
        created_at: new Date().toISOString()
    };

    allOrders.unshift(orderData);
    renderOrdersTable();
    renderDashboardRecentOrders();
    calculateFinances();
    closeQuickSaleModal();
    showToast(`🎉 Vente de ${total.toLocaleString()} FCFA enregistrée avec succès !`);

    // Décrémenter stocks locaux
    quickSaleItems.forEach(item => {
        const prod = allProducts.find(p => p.id === item.id);
        if (prod) prod.stock = Math.max(0, prod.stock - item.quantity);
    });
    renderProductsGrid();
    updateDashboardStats();

    // Envoi backend
    try {
        const apiBase = window.API_BASE_URL || '';
        await fetch(`${apiBase}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
    } catch (_) {}
}

// ============================================================================
// COMMANDES, FINANCES & NOTIFICATIONS
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
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-stone-400">Aucune commande pour le moment.</td></tr>`;
        return;
    }

    const searchTerm = (document.getElementById('admin-order-search')?.value || '').toLowerCase().trim();

    const filtered = allOrders.filter(o => {
        const code = (o.pickup_code || o.id || '').toString().toLowerCase();
        const client = (o.customer_name || o.client_name || '').toLowerCase();
        return code.includes(searchTerm) || client.includes(searchTerm);
    });

    tbody.innerHTML = filtered.map(o => `
        <tr class="hover:bg-amber-50/50 transition-colors">
            <td class="py-2.5 px-3 font-mono font-bold text-amber-900">#${o.id}</td>
            <td class="py-2.5 px-3 font-bold text-stone-800">${o.customer_name || 'Client'}</td>
            <td class="py-2.5 px-3 text-stone-600 max-w-xs truncate">${formatOrderItems(o.items)}</td>
            <td class="py-2.5 px-3 font-mono font-black text-[#1a0c06]">${Number(o.total_price || o.total || 0).toLocaleString()} F</td>
            <td class="py-2.5 px-3 uppercase font-bold text-[11px] text-stone-600">${o.payment_method || 'Espèces'}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">Validé</span></td>
            <td class="py-2.5 px-3">
                <button onclick="showToast('Détails commande #${o.id}')" class="text-xs font-bold text-amber-700 hover:underline">Voir</button>
            </td>
        </tr>
    `).join('');
}

function renderDashboardRecentOrders() {
    const tbody = document.getElementById('dashboard-recent-orders-tbody');
    if (!tbody) return;

    const recent = allOrders.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-stone-400">Aucune vente enregistrée aujourd'hui.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(o => `
        <tr class="border-b border-stone-100">
            <td class="py-2 font-mono font-bold text-amber-800">#${o.id}</td>
            <td class="py-2 font-bold text-stone-800">${o.customer_name || 'Client'}</td>
            <td class="py-2 text-stone-600 truncate max-w-[160px]">${formatOrderItems(o.items)}</td>
            <td class="py-2 font-mono font-black">${Number(o.total_price || o.total || 0).toLocaleString()} F</td>
            <td class="py-2 uppercase text-[10px] font-bold text-stone-500">${o.payment_method || 'Espèces'}</td>
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
        else if (method.includes('orange') || method.includes('mtn')) mobile += amt;
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
                box.innerText = `💡 Analyse BIX : ${data.salesSummary.totalOrdersRecorded} commandes traitées pour ${data.salesSummary.totalRevenueFCFA.toLocaleString()} FCFA de recettes.`;
            }
        }
    } catch (_) {}
}

// Modal Produit
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
    document.getElementById('modal-product-title').innerText = 'Modifier ' + p.nom;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.nom;
    document.getElementById('prod-price').value = p.prix;
    document.getElementById('prod-cat').value = p.categorie || 'pain';
    document.getElementById('prod-stock').value = p.stock || 50;
    document.getElementById('prod-alert').value = p.seuil_alerte || 10;
    document.getElementById('prod-image').value = p.image || '';
    document.getElementById('productModal').classList.remove('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const pData = {
        id: id ? Number(id) : Date.now(),
        nom: document.getElementById('prod-name').value.trim(),
        prix: Number(document.getElementById('prod-price').value),
        categorie: document.getElementById('prod-cat').value,
        stock: Number(document.getElementById('prod-stock').value),
        seuil_alerte: Number(document.getElementById('prod-alert').value),
        image: document.getElementById('prod-image').value.trim() || 'assets/Croissant.png',
        is_active: 1
    };

    if (id) {
        const idx = allProducts.findIndex(x => x.id === Number(id));
        if (idx !== -1) allProducts[idx] = pData;
    } else {
        allProducts.push(pData);
    }

    if (typeof window.babiSetCachedProducts === 'function') {
        window.babiSetCachedProducts(allProducts);
    }

    renderProductsGrid();
    updateDashboardStats();
    populateQuickSaleSelect();
    closeProductModal();
    showToast(`✅ Produit "${pData.nom}" enregistré avec succès !`);

    try {
        const apiBase = window.API_BASE_URL || '';
        await fetch(`${apiBase}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pData)
        });
    } catch (_) {}
}

function showToast(msg) {
    const existing = document.querySelector('.toast-babi');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-babi';
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
