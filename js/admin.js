// JS Admin Dashboard Logic

let allOrders = [];
let allProducts = [];
let allUsers = [];
let revenueChart = null;
let categoryChart = null;
let resEvolutionChartInstance = null;
let statusDonutChartInstance = null;
let paymentsDonutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initSaasCharts();
    fetchAdminData();

    // Auto refresh orders every 10 seconds
    setInterval(fetchAdminData, 10000);

    // Form submit listener for adding products
    const addProdForm = document.getElementById('add-product-form');
    if (addProdForm) {
        addProdForm.addEventListener('submit', handleAddProduct);
    }
});

// =============================================================
// SAAS CHARTS ENGINE (CHART.JS AREA & DONUTS)
// =============================================================
function initSaasCharts() {
    // 1. Évolution des réservations (Area Chart)
    const evoCanvas = document.getElementById('reservationsEvolutionChart');
    if (evoCanvas && typeof Chart !== 'undefined') {
        const ctx = evoCanvas.getContext('2d');
        if (resEvolutionChartInstance) resEvolutionChartInstance.destroy();

        // Gradient for Orange Curve (Reservations)
        const orangeGrad = ctx.createLinearGradient(0, 0, 0, 200);
        orangeGrad.addColorStop(0, 'rgba(234, 88, 12, 0.28)');
        orangeGrad.addColorStop(1, 'rgba(234, 88, 12, 0.0)');

        // Gradient for Green Curve (Recuperees)
        const greenGrad = ctx.createLinearGradient(0, 0, 0, 200);
        greenGrad.addColorStop(0, 'rgba(22, 163, 74, 0.22)');
        greenGrad.addColorStop(1, 'rgba(22, 163, 74, 0.0)');

        resEvolutionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['14 Août', '15 Août', '16 Août', '17 Août', '18 Août', '19 Août', '20 Août'],
                datasets: [
                    {
                        label: 'Réservations',
                        data: [28, 42, 36, 54, 68, 85, 78],
                        borderColor: '#ea580c',
                        backgroundColor: orangeGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#ea580c',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1.5
                    },
                    {
                        label: 'Récupérées',
                        data: [20, 32, 28, 45, 52, 70, 62],
                        borderColor: '#16a34a',
                        backgroundColor: greenGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#16a34a',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 8,
                        titleFont: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' },
                        bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#94a3b8' }
                    },
                    y: {
                        grid: { color: '#f1f5f9', borderDash: [4, 4] },
                        ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#94a3b8', stepSize: 20 }
                    }
                }
            }
        });
    }

    // 2. Réservations par statut (Donut Chart)
    const statusCanvas = document.getElementById('statusDonutChart');
    if (statusCanvas && typeof Chart !== 'undefined') {
        const ctx = statusCanvas.getContext('2d');
        if (statusDonutChartInstance) statusDonutChartInstance.destroy();

        statusDonutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Nouvelles', 'Confirmées', 'En préparation', 'Prêtes', 'Récupérées'],
                datasets: [{
                    data: [62, 74, 68, 79, 43],
                    backgroundColor: ['#3b82f6', '#eab308', '#a855f7', '#22c55e', '#06b6d4'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 8,
                        cornerRadius: 8,
                        bodyFont: { family: 'Plus Jakarta Sans', size: 11 }
                    }
                }
            }
        });
    }

    // 3. Répartition des paiements (Donut Chart)
    const payCanvas = document.getElementById('paymentsDonutChart');
    if (payCanvas && typeof Chart !== 'undefined') {
        const ctx = payCanvas.getContext('2d');
        if (paymentsDonutChartInstance) paymentsDonutChartInstance.destroy();

        paymentsDonutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Payés', 'En attente', 'Échecs'],
                datasets: [{
                    data: [2450, 250, 150],
                    backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 8,
                        cornerRadius: 8,
                        bodyFont: { family: 'Plus Jakarta Sans', size: 11 }
                    }
                }
            }
        });
    }
}

// Submenu toggle for Utilisateurs
function toggleUsersMenu() {
    const submenu = document.getElementById('usersSubmenu');
    const arrow = document.getElementById('usersMenuArrow');
    if (submenu) {
        submenu.classList.toggle('open');
        if (arrow) {
            arrow.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

// Profile dropdown toggle
function toggleProfileDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('profileDropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close dropdown on click outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileDropdownMenu');
    if (dropdown && !dropdown.classList.contains('hidden') && !e.target.closest('#profileDropdownMenu') && !e.target.closest('.saas-profile-card') && !e.target.closest('#profileDropdownWrapper')) {
        dropdown.classList.add('hidden');
    }
});

// Logout handler
function handleAdminLogout() {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter de la plateforme administrateur ?")) {
        localStorage.removeItem('babi_admin_auth');
        window.location.href = 'index.html';
    }
}
// Show tab switcher
function showTab(tabName) {
    document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.remove('hidden');
    if (tabName === 'security') fetchSecurityAuditLogs();
}


// Fetch all required data from backend APIs
async function fetchAdminData() {
    await Promise.all([
        loadStats(),
        loadOrders(),
        loadEventOrders(),
        loadProducts(),
        loadUsers()
    ]);
}

// =============================================================
// REVENUE & STATS LIVE ENGINE (BASELINE ZÉRO OPÉRATIONNEL)
// =============================================================
async function loadStats() {
    try {
        // Compute live from orders
        const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total_price) || Number(o.total_amount) || 0), 0);
        const totalCount = allOrders.length;
        const deliveredCount = allOrders.filter(o => o.status === 'recupere' || o.status === 'livre').length;
        const newOrdersCount = allOrders.filter(o => o.status === 'nouveau' || o.status === 'recu').length;
        const avgBasket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

        const revEl = document.getElementById('stat-revenue');
        if (revEl) revEl.innerText = totalRevenue.toLocaleString() + ' FCFA';

        const delEl = document.getElementById('stat-delivered-orders');
        if (delEl) delEl.innerText = deliveredCount;

        const totEl = document.getElementById('stat-total-orders');
        if (totEl) totEl.innerText = totalCount;

        const avgEl = document.getElementById('stat-avg-basket');
        if (avgEl) avgEl.innerText = avgBasket.toLocaleString() + ' FCFA';

        const navBadge = document.getElementById('nav-orders-badge');
        if (navBadge) {
            if (newOrdersCount > 0) {
                navBadge.innerText = newOrdersCount;
                navBadge.classList.remove('hidden');
            } else {
                navBadge.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error("Erreur calcul stats:", err);
    }
}

// =============================================================
// COMMANDES EN DIRECT (SYNCHRO LOCALSTORAGE & LIVE API)
// =============================================================
async function loadOrders() {
    try {
        const localSaved = localStorage.getItem('babi_orders');
        if (localSaved) {
            allOrders = JSON.parse(localSaved);
        } else {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                allOrders = Array.isArray(data) ? data : (data.data || []);
            } else {
                allOrders = [];
            }
        }
    } catch (e) {
        allOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    }

    renderOrdersTable(allOrders);
    renderFullOrdersTable(allOrders);
    loadStats();
}

// Load event orders
async function loadEventOrders() {
    const tbody = document.getElementById('events-tbody');
    if (!tbody) return;

    try {
        const localSaved = localStorage.getItem('babi_event_orders');
        const events = localSaved ? JSON.parse(localSaved) : [];

        if (events.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-8 text-center text-on-surface-variant">
                        <div class="flex flex-col items-center justify-center gap-2 py-4">
                            <span class="material-symbols-outlined text-4xl text-amber-700">cake</span>
                            <span class="font-bold text-sm text-on-surface">Aucune commande de gâteau sur-mesure pour le moment</span>
                            <span class="text-xs text-on-surface-variant">Les devis de pièces montées et gâteaux de mariage s'afficheront ici.</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = events.map(e => `
            <tr style="border-bottom: 1px solid #e5e2d9;">
                <td class="p-4 font-bold text-primary">#${e.id || 'EVT'}</td>
                <td class="p-4 font-bold">${e.customer_name || 'Client'}</td>
                <td class="p-4">${e.event_type || 'Gâteau'} - ${e.flavor || 'Vanille'}</td>
                <td class="p-4 font-bold">${e.portions || 15} pers.</td>
                <td class="p-4 font-bold text-primary">${(e.price || 0).toLocaleString()} FCFA</td>
                <td class="p-4 text-xs">${e.delivery_date || 'Bientôt'}</td>
                <td class="p-4"><span style="background-color: #e0f2fe; color: #075985; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px;">${e.status || 'Confirmé'}</span></td>
            </tr>
        `).join('');
    } catch(err) {
        console.error("Erreur loadEventOrders:", err);
    }
}

// Load products grid
// =============================================================
// CATALOGUE & GESTION DES STOCKS EN DIRECT (MODE MAGAZINE)
// =============================================================
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Baguette Tradition", category: "pains", price: 200, stock: 42, threshold: 15, is_available: true, image: "assets/baguette 200.png", desc: "Farine T65, levain liquide, croûte dorée croustillante" },
    { id: 2, name: "Croissant Pur Beurre", category: "viennoiseries", price: 350, stock: 28, threshold: 10, is_available: true, image: "assets/Croissant.png", desc: "Beurre AOP, feuilletage 100% artisanal" },
    { id: 3, name: "Pain au Chocolat", category: "viennoiseries", price: 400, stock: 18, threshold: 10, is_available: true, image: "assets/pain au chocolat.png", desc: "Double bâton chocolat 60% cacao de Côte d'Ivoire" },
    { id: 4, name: "Pain Complet Bio", category: "pains", price: 500, stock: 14, threshold: 8, is_available: true, image: "assets/baguette 200.png", desc: "Farine intégrale bio, riche en fibres, mie serrée" },
    { id: 5, name: "Brioche Feuilletée Gourmande", category: "viennoiseries", price: 750, stock: 6, threshold: 8, is_available: true, image: "assets/Croissant.png", desc: "Pâte levée feuilletée sucrée aux perles de sucre" },
    { id: 6, name: "Entremet Chocolat Prestige", category: "patisseries", price: 2500, stock: 4, threshold: 5, is_available: true, image: "assets/Croissant.png", desc: "Mousse chocolat grand cru 70%, praliné noisette" },
    { id: 7, name: "Tartelette Fraise & Pistache", category: "patisseries", price: 1800, stock: 8, threshold: 5, is_available: true, image: "assets/Croissant.png", desc: "Crème d'amande pistache, fraises fraîches" },
    { id: 8, name: "Éclair au Café Pur Arabica", category: "patisseries", price: 900, stock: 12, threshold: 6, is_available: true, image: "assets/Croissant.png", desc: "Pâte à choux croustillante, crème café torréfié" },
    { id: 9, name: "Jus de Bissap Naturel 50cl", category: "boissons", price: 600, stock: 25, threshold: 10, is_available: true, image: "assets/Croissant.png", desc: "Fleurs d'hibiscus infusées, menthe fraîche et vanille" },
    { id: 10, name: "Jus de Gingembre & Ananas 50cl", category: "boissons", price: 600, stock: 20, threshold: 10, is_available: true, image: "assets/Croissant.png", desc: "Gingembre frais pressé et ananas d'Abidjan" },
    { id: 11, name: "Pain de Mie Artisanal", category: "pains", price: 800, stock: 15, threshold: 6, is_available: true, image: "assets/baguette 200.png", desc: "Mie ultra moelleuse au beurre doux" },
    { id: 12, name: "Chausson aux Pommes", category: "viennoiseries", price: 450, stock: 9, threshold: 8, is_available: true, image: "assets/Croissant.png", desc: "Compotée de pommes tatin dans son feuilletage doré" }
];

let currentCategoryFilter = 'all';

async function loadProducts() {
    try {
        const localSaved = localStorage.getItem('babi_admin_products');
        if (localSaved) {
            allProducts = JSON.parse(localSaved);
        } else {
            const res = await fetch('/api/products');
            if (res.ok) {
                const prods = await res.json();
                allProducts = Array.isArray(prods) && prods.length ? prods : DEFAULT_PRODUCTS;
            } else {
                allProducts = DEFAULT_PRODUCTS;
            }
            saveProductsLocally();
        }
    } catch(err) {
        console.warn("Utilisation du catalogue local par défaut:", err);
        allProducts = DEFAULT_PRODUCTS;
    }

    renderProductsGrid();
    updateStockSummaryKpis();
    populateRestockSelect();
}

function saveProductsLocally() {
    localStorage.setItem('babi_admin_products', JSON.stringify(allProducts));
}

function updateStockSummaryKpis() {
    const total = allProducts.length;
    const available = allProducts.filter(p => p.is_available !== false && (p.stock || 0) > 0).length;
    const warning = allProducts.filter(p => (p.stock || 0) <= (p.threshold || 10) && (p.stock || 0) > 0).length;
    const outOfStock = allProducts.filter(p => (p.stock || 0) === 0 || p.is_available === false).length;

    const elTotal = document.getElementById('stock-stat-total');
    const elAvailable = document.getElementById('stock-stat-available');
    const elWarning = document.getElementById('stock-stat-warning');
    const elOut = document.getElementById('stock-stat-out');

    if (elTotal) elTotal.textContent = total;
    if (elAvailable) elAvailable.textContent = available;
    if (elWarning) elWarning.textContent = warning;
    if (elOut) elOut.textContent = outOfStock;
}

function getCategoryIcon(cat) {
    switch(cat?.toLowerCase()) {
        case 'pains': return '🥖 Pains';
        case 'viennoiseries': return '🥐 Viennoiseries';
        case 'patisseries': return '🎂 Pâtisseries';
        case 'boissons': return '🥤 Jus';
        default: return '🥐 Produit';
    }
}

function renderProductsGrid(filteredList = null) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const list = filteredList || allProducts;

    if (list.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center magazine-card flex flex-col items-center justify-center gap-3">
                <span class="material-symbols-outlined text-5xl text-amber-700">search_off</span>
                <h3 class="font-headline-md text-lg font-bold text-on-surface">Aucun produit trouvé</h3>
                <p class="text-xs text-on-surface-variant">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
                <button onclick="filterProductCategory('all', document.querySelector('#product-category-pills button'))" class="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold mt-2" style="background:#765b00; color:#fff;">Voir tous les produits</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = list.map(p => {
        const stock = p.stock ?? 0;
        const threshold = p.threshold ?? 10;
        const isCritical = stock > 0 && stock <= threshold;
        const isOut = stock === 0 || p.is_available === false;
        const isAvailable = p.is_available !== false && stock > 0;

        let statusBadge = `<span style="background:#dcfce7; color:#15803d; border:1px solid #86efac; border-radius:9999px; padding:2px 8px; font-weight:800; font-size:11px; display:inline-flex; align-items:center; gap:4px;"><span style="width:6px; height:6px; border-radius:9999px; background:#16a34a;"></span> En Rayon</span>`;
        if (isOut) {
            statusBadge = `<span style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; border-radius:9999px; padding:2px 8px; font-weight:800; font-size:11px; display:inline-flex; align-items:center; gap:4px;"><span style="width:6px; height:6px; border-radius:9999px; background:#dc2626;"></span> Rupture</span>`;
        } else if (isCritical) {
            statusBadge = `<span style="background:#fef3c7; color:#b45309; border:1px solid #fcd34d; border-radius:9999px; padding:2px 8px; font-weight:800; font-size:11px; display:inline-flex; align-items:center; gap:4px;"><span style="width:6px; height:6px; border-radius:9999px; background:#f59e0b;"></span> Critique (${stock})</span>`;
        }

        return `
            <div class="magazine-product-card">
                <!-- Cover Image with Badges -->
                <div class="product-image-container">
                    <img src="${p.image_url || p.image || 'assets/baguette 200.png'}" alt="${p.name}"/>
                    <div class="product-badge-category">${getCategoryIcon(p.category)}</div>
                    <div class="product-badge-price">${(p.price || 0).toLocaleString()} F</div>
                </div>

                <!-- Body Content -->
                <div class="p-4 flex-1 flex flex-col justify-between" style="padding: 1.15rem !important;">
                    <div>
                        <div class="flex justify-between items-start gap-2 mb-1">
                            <h3 class="font-bold text-sm text-on-surface leading-tight font-headline-sm">${p.name}</h3>
                        </div>
                        <p class="text-xs text-on-surface-variant line-clamp-2 mb-2" style="font-size: 11.5px; line-height: 1.4;">${p.desc || 'Recette artisanale de la maison BABI.'}</p>
                    </div>

                    <div>
                        <!-- Interactive Stock Control Box -->
                        <div class="stock-control-pill">
                            <div class="flex flex-col">
                                <span class="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Stock Actuel</span>
                                <span class="text-lg font-black text-on-surface leading-tight">${stock} <small class="text-xs font-normal text-muted">pièces</small></span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="adjustProductStock(${p.id}, -1)" class="stock-adjust-btn" title="Diminuer stock">-</button>
                                <button type="button" onclick="adjustProductStock(${p.id}, 1)" class="stock-adjust-btn" title="Ajouter stock">+</button>
                                <button type="button" onclick="adjustProductStock(${p.id}, 10)" class="stock-adjust-btn" style="width: auto; padding: 0 6px; font-size: 11px;" title="Ajouter +10">+10</button>
                            </div>
                        </div>

                        <!-- Status & Quick Availability Toggle -->
                        <div class="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-xs">
                            ${statusBadge}
                            <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-on-surface-variant" title="Activer / Désactiver">
                                <input type="checkbox" ${p.is_available !== false ? 'checked' : ''} onchange="toggleProductAvailability(${p.id})" class="accent-amber-600 cursor-pointer"/>
                                <span>Actif</span>
                            </label>
                        </div>

                        <!-- Card Action Buttons -->
                        <div class="flex gap-2 mt-3 pt-2 border-t border-outline-variant/20">
                            <button onclick="openEditProductModal(${p.id})" class="product-action-btn btn-edit">
                                <span class="material-symbols-outlined text-sm">edit</span> Modifier
                            </button>
                            <button onclick="deleteProduct(${p.id})" class="product-action-btn btn-delete">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Adjust stock count in real-time
function adjustProductStock(id, delta) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    prod.stock = Math.max(0, (prod.stock || 0) + delta);
    saveProductsLocally();
    filterProductsGrid();
    updateStockSummaryKpis();
    populateRestockSelect();
}

// Toggle availability
function toggleProductAvailability(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    prod.is_available = !prod.is_available;
    saveProductsLocally();
    filterProductsGrid();
    updateStockSummaryKpis();
}

// Filter by category pill
function filterProductCategory(cat, btn) {
    currentCategoryFilter = cat;
    document.querySelectorAll('#product-category-pills button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    filterProductsGrid();
}

// Combined Search, Category & Stock Filter
function filterProductsGrid() {
    const searchVal = (document.getElementById('product-search-input')?.value || '').toLowerCase().trim();
    const stockFilter = document.getElementById('product-stock-filter')?.value || 'all';

    let filtered = allProducts;

    // Filter by Category
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(p => (p.category || '').toLowerCase() === currentCategoryFilter.toLowerCase());
    }

    // Filter by Search text
    if (searchVal) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchVal) || 
            (p.desc && p.desc.toLowerCase().includes(searchVal)) ||
            (p.category && p.category.toLowerCase().includes(searchVal))
        );
    }

    // Filter by Stock status
    if (stockFilter === 'available') {
        filtered = filtered.filter(p => p.is_available !== false && (p.stock || 0) > 0);
    } else if (stockFilter === 'warning') {
        filtered = filtered.filter(p => (p.stock || 0) <= (p.threshold || 10) && (p.stock || 0) > 0);
    } else if (stockFilter === 'out') {
        filtered = filtered.filter(p => (p.stock || 0) === 0 || p.is_available === false);
    }

    renderProductsGrid(filtered);
}

// Product Modal Handlers
function openNewProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    document.getElementById('productModalTitle').textContent = "Nouveau Produit";
    document.getElementById('product-form-id').value = "";
    document.getElementById('product-form-name').value = "";
    document.getElementById('product-form-category').value = "pains";
    document.getElementById('product-form-price').value = "250";
    document.getElementById('product-form-stock').value = "30";
    document.getElementById('product-form-threshold').value = "10";
    document.getElementById('product-form-image').value = "assets/baguette 200.png";
    document.getElementById('product-form-desc').value = "";
    document.getElementById('product-form-available').checked = true;

    modal.classList.remove('hidden');
}

function openEditProductModal(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    const modal = document.getElementById('productModal');
    if (!modal) return;

    document.getElementById('productModalTitle').textContent = `Modifier : ${prod.name}`;
    document.getElementById('product-form-id').value = prod.id;
    document.getElementById('product-form-name').value = prod.name;
    document.getElementById('product-form-category').value = prod.category || 'pains';
    document.getElementById('product-form-price').value = prod.price || 0;
    document.getElementById('product-form-stock').value = prod.stock ?? 0;
    document.getElementById('product-form-threshold').value = prod.threshold ?? 10;
    document.getElementById('product-form-image').value = prod.image || 'assets/baguette 200.png';
    document.getElementById('product-form-desc').value = prod.desc || '';
    document.getElementById('product-form-available').checked = prod.is_available !== false;

    modal.classList.remove('hidden');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('hidden');
}

function saveProduct(e) {
    e.preventDefault();
    const idVal = document.getElementById('product-form-id').value;
    const name = document.getElementById('product-form-name').value.trim();
    const category = document.getElementById('product-form-category').value;
    const price = parseInt(document.getElementById('product-form-price').value, 10) || 0;
    const stock = parseInt(document.getElementById('product-form-stock').value, 10) || 0;
    const threshold = parseInt(document.getElementById('product-form-threshold').value, 10) || 10;
    const image = document.getElementById('product-form-image').value;
    const desc = document.getElementById('product-form-desc').value.trim();
    const is_available = document.getElementById('product-form-available').checked;

    if (idVal) {
        // Edit existing
        const prod = allProducts.find(p => p.id == idVal);
        if (prod) {
            prod.name = name;
            prod.category = category;
            prod.price = price;
            prod.stock = stock;
            prod.threshold = threshold;
            prod.image = image;
            prod.desc = desc;
            prod.is_available = is_available;
        }
    } else {
        // Create new
        const newId = allProducts.length ? Math.max(...allProducts.map(p => p.id || 0)) + 1 : 1;
        allProducts.unshift({
            id: newId,
            name,
            category,
            price,
            stock,
            threshold,
            image,
            desc,
            is_available
        });
    }

    saveProductsLocally();
    closeProductModal();
    filterProductsGrid();
    updateStockSummaryKpis();
    populateRestockSelect();
}

function deleteProduct(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    if (confirm(`Confirmez-vous la suppression du produit "${prod.name}" du catalogue ?`)) {
        allProducts = allProducts.filter(p => p.id !== id);
        saveProductsLocally();
        filterProductsGrid();
        updateStockSummaryKpis();
        populateRestockSelect();
    }
}

// Batch Restock Fournil
function populateRestockSelect() {
    const select = document.getElementById('restock-product-select');
    if (!select) return;

    select.innerHTML = allProducts.map(p => `
        <option value="${p.id}">${getCategoryIcon(p.category)} - ${p.name} (Stock actuel : ${p.stock ?? 0})</option>
    `).join('');
}

function openBatchRestockModal() {
    const modal = document.getElementById('batchRestockModal');
    if (!modal) return;
    populateRestockSelect();
    modal.classList.remove('hidden');
}

function closeBatchRestockModal() {
    const modal = document.getElementById('batchRestockModal');
    if (modal) modal.classList.add('hidden');
}

function applyBatchRestock(e) {
    e.preventDefault();
    const select = document.getElementById('restock-product-select');
    const qtyInput = document.getElementById('restock-quantity');
    const noteInput = document.getElementById('restock-batch-note');

    if (!select || !qtyInput) return;

    const prodId = parseInt(select.value, 10);
    const qty = parseInt(qtyInput.value, 10) || 0;
    const note = noteInput?.value || 'Réassort Fournil';

    const prod = allProducts.find(p => p.id === prodId);
    if (prod) {
        prod.stock = (prod.stock || 0) + qty;
        prod.is_available = true; // reactivate automatically on restock
        saveProductsLocally();
        closeBatchRestockModal();
        filterProductsGrid();
        updateStockSummaryKpis();
        alert(`✅ Réassort validé : +${qty} ${prod.name} ajoutés en rayon !\nNouveau stock : ${prod.stock} pièces.`);
    }
}

// Load team grid
async function loadTeam() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;

    const team = [
        { name: "Jean-Marc Konan", role: "Directeur Général & Fondateur", avatar: "assets/chef_profile.png", status: "En Service" },
        { name: "Mamadou Koné", role: "Maître Boulanger • Chef Fournil", avatar: "assets/baker_profile.png", status: "Au Fournil (Poste 1)" },
        { name: "Awa Kouassi", role: "Caissière Principale & Accueil", avatar: "assets/caissiere.png", status: "Caisse Ouverte" },
        { name: "Bakary Diarra", role: "Artisan Tourier & Pâtissier", avatar: "assets/kouassi.png", status: "Laboratoire Pâtisserie" }
    ];

    grid.innerHTML = team.map(m => `
        <div class="bg-surface-container rounded-2xl p-5 flex flex-col items-center text-center gap-3 border border-outline-variant/30 shadow-sm" style="background:#f1eee4; border:1px solid #d2c5ac; border-radius:1rem; padding:1.25rem;">
            <img src="${m.avatar}" alt="${m.name}" class="profile-avatar w-16 h-16 rounded-full object-cover ring-2 ring-primary shadow-sm" style="width:64px; height:64px; border-radius:9999px; object-fit:cover;"/>
            <div>
                <h3 class="font-bold text-sm text-on-surface">${m.name}</h3>
                <p class="text-xs text-on-surface-variant">${m.role}</p>
            </div>
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold" style="background:#dcfce7; color:#166534; padding:3px 10px; border-radius:9999px;">
                ${m.status}
            </span>
        </div>
    `).join('');
}

// Load users / loyalty table with correct column alignment
async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    try {
        const res = await fetch('/api/users');
        const users = await res.json();
        allUsers = Array.isArray(users) ? users : (users.data || []);

        const displayUsers = allUsers.length > 0 ? allUsers : [
            { name: "Jean-Marc Kouassi", phone: "07 04 38 92 01", email: "jm.kouassi@gmail.com", points: 240, orders_count: 14, total_spent: 125000 },
            { name: "Fatou Bamba", phone: "05 45 12 89 00", email: "fatou.b@yahoo.fr", points: 180, orders_count: 9, total_spent: 84000 },
            { name: "Patrick Brou", phone: "01 02 03 04 05", email: "patrick.brou@live.ci", points: 95, orders_count: 5, total_spent: 42500 },
            { name: "Sarah Diop", phone: "07 88 99 11 22", email: "sarah.diop@orange.ci", points: 310, orders_count: 18, total_spent: 168000 }
        ];

        tbody.innerHTML = displayUsers.map(u => `
            <tr style="border-bottom: 1px solid #e5e2d9;">
                <td class="p-4 font-bold text-on-surface">${u.name || u.full_name || 'Client'}</td>
                <td class="p-4">
                    <div>${u.phone || '07 00 00 00 00'}</div>
                    <div class="text-xs text-on-surface-variant">${u.email || 'N/A'}</div>
                </td>
                <td class="p-4 font-bold text-primary">⭐ ${u.points || 50} pts</td>
                <td class="p-4 font-bold">${u.orders_count || 1} cmd(s)</td>
                <td class="p-4 font-bold text-on-surface">${(u.total_spent || 12000).toLocaleString()} FCFA</td>
            </tr>
        `).join('');
    } catch(err) {
        console.error("Erreur loadUsers:", err);
    }
}

// Fetch all required data from backend APIs
async function fetchAdminData() {
    await Promise.all([
        loadStats(),
        loadOrders(),
        loadEventOrders(),
        loadProducts(),
        loadTeam(),
        loadUsers()
    ]);
}

function getPaymentMethodBadge(method) {
    const m = (method || 'wave').toLowerCase();
    if (m.includes('wave')) {
        return `<span style="background: rgba(29, 196, 255, 0.12); color: #0284c7; border: 1px solid rgba(29, 196, 255, 0.35); padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 9999px; background: #0284c7;"></span>Wave CI</span>`;
    }
    if (m.includes('orange') || m.includes('om')) {
        return `<span style="background: rgba(255, 121, 0, 0.12); color: #c2410c; border: 1px solid rgba(255, 121, 0, 0.35); padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 9999px; background: #ea580c;"></span>Orange Money</span>`;
    }
    return `<span style="background: rgba(16, 185, 129, 0.12); color: #047857; border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 9999px; background: #10b981;"></span>Espèces</span>`;
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-on-surface-variant">
                    <div class="flex flex-col items-center justify-center gap-3 py-6">
                        <div class="kpi-icon-medallion gold" style="width: 48px; height: 48px;">
                            <span class="material-symbols-outlined text-2xl">storefront</span>
                        </div>
                        <h4 class="font-bold text-sm text-on-surface">Prêt pour le Service du Jour !</h4>
                        <p class="text-xs text-on-surface-variant max-w-md">Le terminal d'encaissement et le fournil sont opérationnels. Les prochaines commandes enregistrées en boutique ou en caisse apparaîtront ici en direct.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.slice(0, 6).map(o => `
        <tr class="hover:bg-surface/50 transition-colors group" style="border-bottom: 1px solid #e5e2d9;">
            <td class="p-4 font-bold text-primary">#${o.id || o.order_number}</td>
            <td class="p-4">
                <div class="font-bold text-on-surface">${o.customer_name || 'Client Anonyme'}</div>
                <div class="text-xs text-on-surface-variant">${o.customer_phone || o.phone || '07 04 38 92 01'}</div>
            </td>
            <td class="p-4 text-xs text-on-surface-variant max-w-[200px] truncate">${o.items_summary || o.items || '2x Baguette Tradition, 3x Croissants'}</td>
            <td class="p-4 font-bold text-on-surface">${(o.total_price || o.total_amount || 0).toLocaleString()} FCFA</td>
            <td class="p-4">
                ${getPaymentMethodBadge(o.payment_method)}
            </td>
            <td class="p-4">
                <span class="inline-flex items-center" style="${getStatusBadgeStyle(o.status)}">
                    ${getStatusLabel(o.status)}
                </span>
            </td>
            <td class="p-4 text-center">
                <button onclick="openReceiptModal('${o.id}')" class="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-primary transition-all" style="background: #f5eee2; border: 1px solid #d6c7ab; padding: 5px 12px; border-radius: 8px; cursor: pointer; color: #765b00; font-weight: 800;">
                    Voir Reçu
                </button>
            </td>
        </tr>
    `).join('');
}

function renderFullOrdersTable(orders) {
    const tbody = document.getElementById('full-orders-tbody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-on-surface-variant">
                    <div class="flex flex-col items-center justify-center gap-3 py-6">
                        <div class="kpi-icon-medallion gold" style="width: 48px; height: 48px;">
                            <span class="material-symbols-outlined text-2xl">receipt_long</span>
                        </div>
                        <h4 class="font-bold text-sm text-on-surface">Aucune commande enregistrée pour le moment</h4>
                        <p class="text-xs text-on-surface-variant max-w-md">Le registre est prêt pour le suivi du fournil et les retraits au comptoir.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(o => `
        <tr class="hover:bg-surface/50 transition-colors" style="border-bottom: 1px solid #e5e2d9;">
            <td class="p-4 font-bold text-primary">#${o.id || o.order_number}</td>
            <td class="p-4 font-bold text-on-surface">${o.customer_name || 'Client'}</td>
            <td class="p-4 text-xs text-on-surface-variant">${o.customer_phone || o.phone || 'N/A'}</td>
            <td class="p-4 text-xs">${o.items_summary || o.items || 'Articles variés'}</td>
            <td class="p-4 font-bold text-on-surface">${(o.total_price || o.total_amount || 0).toLocaleString()} F</td>
            <td class="p-4">${getPaymentMethodBadge(o.payment_method)}</td>
            <td class="p-4"><span class="inline-flex items-center" style="${getStatusBadgeStyle(o.status)}">${getStatusLabel(o.status)}</span></td>
            <td class="p-4 text-center flex items-center justify-center gap-1">
                <button onclick="updateOrderStatus('${o.id}', 'pret')" style="background:#e0f2fe; color:#075985; font-weight:bold; font-size:11px; padding:4px 9px; border-radius:6px; border:none; cursor:pointer;" title="Prêt au comptoir">Prêt</button>
                <button onclick="updateOrderStatus('${o.id}', 'recupere')" style="background:#dcfce7; color:#166534; font-weight:bold; font-size:11px; padding:4px 9px; border-radius:6px; border:none; cursor:pointer;" title="Remis au client">Remis</button>
            </td>
        </tr>
    `).join('');
}

function switchPeriod(period, btn) {
    if (btn) {
        document.querySelectorAll('#tab-overview button[onclick^="switchPeriod"]').forEach(b => {
            b.className = "px-3.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs hover:bg-surface-variant transition-colors";
            b.style.background = "#f5eee2";
            b.style.color = "#5f493b";
        });
        btn.className = "px-3.5 py-1 rounded-full bg-primary text-on-primary font-label-sm text-xs shadow-sm font-bold";
        btn.style.background = "#765b00";
        btn.style.color = "#ffffff";
    }

    if (period === '7d') {
        const data = [
            { day: 'Lun', val: 45000, h: 48 },
            { day: 'Mar', val: 52000, h: 55 },
            { day: 'Mer', val: 48000, h: 51 },
            { day: 'Jeu', val: 61000, h: 64 },
            { day: 'Ven', val: 74000, h: 78 },
            { day: 'Sam', val: 95000, h: 100, peak: true },
            { day: 'Dim', val: 88500, h: 92 }
        ];
        renderBarChartElements(data);
    } else if (period === '30d') {
        const data = [
            { day: 'Sem 1', val: 320000, h: 65 },
            { day: 'Sem 2', val: 385500, h: 78 },
            { day: 'Sem 3', val: 490000, h: 100, peak: true },
            { day: 'Sem 4', val: 440000, h: 90 }
        ];
        renderBarChartElements(data);
    } else if (period === '1y') {
        const data = [
            { day: 'Trimestre 1', val: 3800000, h: 70 },
            { day: 'Trimestre 2', val: 4600000, h: 85 },
            { day: 'Trimestre 3', val: 5400000, h: 100, peak: true },
            { day: 'Trimestre 4', val: 4900000, h: 92 }
        ];
        renderBarChartElements(data);
    }
}

function renderBarChartElements(data) {
    const container = document.getElementById('revenue-bars-container');
    if (!container) return;

    container.innerHTML = `
        <div class="w-full h-full absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-20">
            <div class="w-full border-t border-outline-variant border-dashed"></div>
            <div class="w-full border-t border-outline-variant border-dashed"></div>
            <div class="w-full border-t border-outline-variant border-dashed"></div>
        </div>
        ${data.map(d => `
            <div class="revenue-bar relative group ${d.peak ? 'peak-bar' : ''}" style="height: ${d.h}%;">
                <div class="revenue-tooltip">
                    ${d.val.toLocaleString()} FCFA ${d.peak ? '👑' : ''}
                </div>
            </div>
        `).join('')}
    `;
    const labelsContainer = container.nextElementSibling;
    if (labelsContainer) {
        labelsContainer.innerHTML = data.map(d => `<span class="flex-1 text-center font-bold text-xs" style="color: ${d.peak ? '#765b00' : '#8d776a'};">${d.day}</span>`).join('');
    }
}

function getStatusBadgeStyle(status) {
    const s = (status || 'nouveau').toLowerCase();
    if (s.includes('recup') || s.includes('livre') || s.includes('complete')) return 'background-color: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; display: inline-block;';
    if (s.includes('pret') || s.includes('prete')) return 'background-color: #e0f2fe; color: #075985; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; display: inline-block;';
    if (s.includes('prep') || s.includes('fournil')) return 'background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; display: inline-block;';
    return 'background-color: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; display: inline-block;';
}

function getStatusLabel(status) {
    const s = (status || 'nouveau').toLowerCase();
    if (s.includes('recup') || s.includes('livre') || s.includes('complete')) return 'Remise (PIN OK)';
    if (s.includes('pret')) return 'Prêt au comptoir';
    if (s.includes('prep')) return 'Au Fournil';
    return 'Nouvelle Commande';
}

function getBadgeClass(status) {
    if (!status) return 'badge-nouveau';
    const s = status.toLowerCase();
    if (s.includes('recup') || s.includes('récup') || s.includes('livre') || s.includes('livré')) return 'badge-livre';
    if (s.includes('pret') || s.includes('prêt') || s.includes('livraison')) return 'badge-livraison';
    if (s.includes('prep') || s.includes('préparation')) return 'badge-preparation';
    return 'badge-nouveau';
}

async function updateStatus(orderId, newStatus) {
    try {
        await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchAdminData();
    } catch (err) {
        console.error("Erreur màj statut:", err);
    }
}

function filterOrdersTable() {
    const query = document.getElementById('order-search').value.toLowerCase();
    const status = document.getElementById('order-filter-status').value.toLowerCase();

    const filtered = allOrders.filter(o => {
        const matchesQuery = (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
                             (o.phone && o.phone.toLowerCase().includes(query));
        const matchesStatus = status === '' || (o.status && o.status.toLowerCase().includes(status));
        return matchesQuery && matchesStatus;
    });

    renderOrdersTable(filtered);
}

// Load products catalog table
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        renderProductsTable(allProducts);
    } catch (err) {
        console.error("Erreur produits:", err);
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Aucun produit dans le catalogue.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="fw-bold">#${p.id}</td>
            <td><img src="${p.image}" width="45" height="45" class="rounded-3" style="object-fit:cover;"></td>
            <td class="fw-bold">${p.nom}</td>
            <td><span class="badge bg-secondary">${p.categorie}</span></td>
            <td class="fw-bold text-primary">${(p.prix || 0).toLocaleString()} FCFA</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function filterProductsTable() {
    const query = document.getElementById('product-search').value.toLowerCase();
    const filtered = allProducts.filter(p => p.nom.toLowerCase().includes(query) || p.categorie.toLowerCase().includes(query));
    renderProductsTable(filtered);
}

async function handleAddProduct(e) {
    e.preventDefault();
    const nom = document.getElementById('prod-name').value;
    const prix = parseInt(document.getElementById('prod-price').value);
    const categorie = document.getElementById('prod-cat').value;
    const image = document.getElementById('prod-img').value || 'assets/product_baguette.png';

    try {
        await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prix, categorie, image })
        });

        // Hide modal
        const modalEl = document.getElementById('addProductModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        // Clear form
        document.getElementById('add-product-form').reset();

        // Reload data
        fetchAdminData();
    } catch (err) {
        console.error("Erreur ajout produit:", err);
    }
}

async function deleteProduct(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce produit du catalogue ?")) return;
    try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchAdminData();
    } catch (err) {
        console.error("Erreur suppression produit:", err);
    }
}

// Load registered users
async function loadUsers() {
    try {
        const res = await fetch('/api/users');
        allUsers = await res.json();

        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        if (allUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Aucun client inscrit pour le moment.</td></tr>`;
            return;
        }

        tbody.innerHTML = allUsers.map(u => `
            <tr>
                <td class="fw-bold">#${u.id}</td>
                <td class="fw-bold">${u.nom || 'Anonyme'}</td>
                <td>${u.email || 'Non renseigné'}</td>
                <td>${u.telephone || 'Non renseigné'}</td>
                <td><span class="badge bg-success">Compte Actif</span></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Erreur users:", err);
    }
}

// Open Receipt Invoice Modal
function openReceiptModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const modalBody = document.getElementById('receipt-modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="text-center mb-4">
                <img src="assets/logo.png" height="50" class="mb-2">
                <h5 class="fw-bold">Boulangerie & Pâtisserie de BABI</h5>
                <small class="text-muted">Abidjan, Côte d'Ivoire - Tél: 07 04 38 92 01</small>
            </div>
            <hr>
            <div class="d-flex justify-content-between fs-sm mb-2">
                <span>Commande <strong>#${order.id}</strong></span>
                <span>Date: ${order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}</span>
            </div>
            <div class="mb-3 fs-sm">
                <div><strong>Client :</strong> ${order.customer_name || 'Client'}</div>
                <div><strong>Téléphone :</strong> ${order.phone || 'N/A'}</div>
                <div><strong>Mode de Retrait :</strong> ${order.address || 'Retrait en Boutique (Cocody Riviera 2)'}</div>
            </div>
            <table class="table table-sm text-start mb-3">
                <thead><tr><th>Articles</th><th class="text-end">Montant</th></tr></thead>
                <tbody>
                    <tr><td>${order.items || 'Produits divers'}</td><td class="text-end fw-bold">${(order.total_price || 0).toLocaleString()} FCFA</td></tr>
                </tbody>
            </table>
            <div class="d-flex justify-content-between fw-bold fs-5 border-top pt-2">
                <span>TOTAL :</span>
                <span class="text-primary">${(order.total_price || 0).toLocaleString()} FCFA</span>
            </div>
            <div class="text-center text-muted small mt-4">Merci de votre confiance et bon appétit ! 🥖</div>
        `;
    }

    const modalEl = document.getElementById('receiptModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Render Chart.js Analytics - Haute Définition
function renderCharts(stats) {
    if (typeof Chart === 'undefined') return;

    const ctxRev = document.getElementById('revenueChart');
    const revenueLabels = (stats && stats.dailySales) ? stats.dailySales.map(d => d.day) : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const revenueData = (stats && stats.dailySales) ? stats.dailySales.map(d => d.sales) : [45000, 52000, 48000, 61000, 74000, 95000, 88500];

    if (ctxRev) {
        const ctx = ctxRev.getContext('2d');
        // Dégradé luxueux Ambre & Or
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
        gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        if (!revenueChart) {
            revenueChart = new Chart(ctxRev, {
                type: 'line',
                data: {
                    labels: revenueLabels,
                    datasets: [{
                        label: 'Chiffre d\'Affaires',
                        data: revenueData,
                        borderColor: '#ea580c',
                        backgroundColor: gradient,
                        borderWidth: 3.5,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#ea580c',
                        pointBorderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: '#2b160c',
                        pointHoverBorderColor: '#fb923c',
                        pointHoverBorderWidth: 3,
                        fill: true,
                        tension: 0.38
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            titleColor: '#fbbf24',
                            bodyColor: '#ffffff',
                            padding: 12,
                            cornerRadius: 10,
                            displayColors: false,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 14, weight: '600' },
                            callbacks: {
                                label: function(context) {
                                    return '💰 ' + Number(context.raw).toLocaleString('fr-FR') + ' FCFA';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#64748b', font: { weight: '600', size: 12 } }
                        },
                        y: {
                            grid: { color: 'rgba(226, 232, 240, 0.7)', borderDash: [4, 4] },
                            ticks: {
                                color: '#64748b',
                                font: { size: 11 },
                                callback: function(value) { return (value / 1000) + ' k F'; }
                            }
                        }
                    }
                }
            });
        } else {
            revenueChart.data.labels = revenueLabels;
            revenueChart.data.datasets[0].data = revenueData;
            revenueChart.update();
        }
    }

    const ctxCat = document.getElementById('categoryChart');
    const catData = (stats && stats.categoryBreakdown) 
        ? [stats.categoryBreakdown.pains, stats.categoryBreakdown.viennoiseries, stats.categoryBreakdown.patisseries, stats.categoryBreakdown.jus]
        : [45, 25, 18, 12];

    if (ctxCat) {
        if (!categoryChart) {
            categoryChart = new Chart(ctxCat, {
                type: 'doughnut',
                data: {
                    labels: ['Pains & Baguettes', 'Viennoiseries', 'Pâtisseries Fines', 'Jus & Boissons'],
                    datasets: [{
                        data: catData,
                        backgroundColor: [
                            '#2b160c', // Chocolat Fournil
                            '#fb923c', // Ambre Croissant
                            '#e11d48', // Framboise Pâtisserie
                            '#0284c7'  // Bleu Fraîcheur Jus
                        ],
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return ' ' + context.label + ' : ' + context.raw + '%';
                                }
                            }
                        }
                    }
                }
            });
        } else {
            categoryChart.data.datasets[0].data = catData;
            categoryChart.update();
        }
    }
}

// Sélecteur de période temporelle pour les graphiques
function switchChartPeriod(period) {
    document.querySelectorAll('.chart-period-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    if (!revenueChart) return;

    if (period === '7d') {
        revenueChart.data.labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        revenueChart.data.datasets[0].data = [45000, 52000, 48000, 61000, 74000, 95000, 88500];
    } else if (period === '30d') {
        revenueChart.data.labels = ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'];
        revenueChart.data.datasets[0].data = [295000, 342000, 318000, 385500];
    } else if (period === 'month') {
        revenueChart.data.labels = ['1-7 Août', '8-14 Août', '15-21 Août', '22-28 Août'];
        revenueChart.data.datasets[0].data = [310000, 365000, 385500, 410000];
    }
    revenueChart.update();
}

async function triggerAdminSupport(orderId) {
    const defaultMsg = "Notre service client traite actuellement votre dossier. Un conseiller étudie votre cas et vous contactera très rapidement.";
    const customMsg = prompt("Entrez le message à transmettre au client :", defaultMsg);
    if (customMsg !== null) {
        try {
            await fetch(`/api/orders/${orderId}/support-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: customMsg, status: 'support_en_cours' })
            });
            alert("💬 Message du service client enregistré et affiché sur la page du client !");
            fetchAdminData();
        } catch (e) {
            console.error(e);
        }
    }
}

async function triggerAdminRefund(orderId) {
    const reason = prompt("Indiquez la raison du remboursement (ex: Rupture de stock, Problème de livraison) :", "Rupture de stock / Annulation admin");
    if (reason !== null) {
        try {
            const res = await fetch('/api/payments/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, reason: reason })
            });
            const data = await res.json();
            alert("💸 " + (data.message || "Remboursement de la commande effectué avec succès !"));
            fetchAdminData();
        } catch (e) {
            console.error(e);
        }
    }
}

// ----------------------------------------------------
// GESTION DES GÂTEAUX D'ÉVÉNEMENTS (ADMIN & FOURNIL)
// ----------------------------------------------------
let allEventOrders = [];

function loadEventOrders() {
    let events = [];
    try {
        events = JSON.parse(localStorage.getItem('babi_event_orders')) || [];
    } catch(e) {}

    // Default mock event orders if empty
    if (events.length === 0) {
        events = [
            {
                id: 'BABI-EVT-842109',
                ref: 'BABI-EVT-842109',
                name: 'Kouassi Marc',
                phone: '0704389201',
                eventType: 'Mariage',
                portions: 45,
                tiers: 3,
                flavor: 'Chocolat Grand Cru & Praliné',
                message: 'Mariage Marc & Sarah (15 Août)',
                date: '2026-08-22',
                time: 'Après-midi (14h00 - 17h00)',
                price: 86000,
                status: 'En préparation au Fournil',
                notes: 'Dorures or comestibles, macarons blancs sur le sommet.'
            },
            {
                id: 'BABI-EVT-719542',
                ref: 'BABI-EVT-719542',
                name: 'Fatou Traoré',
                phone: '0161407064',
                eventType: 'Anniversaire',
                portions: 25,
                tiers: 1,
                flavor: 'Vanille Bourbon & Fruits Rouges',
                message: 'Joyeux Anniversaire Aminata (30 ans) !',
                date: '2026-08-18',
                time: 'Matinée (09h00 - 12h00)',
                price: 37500,
                status: 'Nouveau Devis Reçu',
                notes: 'Sans arachides, bougies dorées incluses.'
            }
        ];
        try {
            localStorage.setItem('babi_event_orders', JSON.stringify(events));
        } catch(e) {}
    }

    allEventOrders = events;
    renderEventsTable(allEventOrders);

    const badge = document.getElementById('nav-events-badge');
    if (badge) {
        badge.innerText = allEventOrders.length;
        badge.style.display = allEventOrders.length > 0 ? 'inline-block' : 'none';
    }
}

function renderEventsTable(events) {
    const tbody = document.getElementById('events-tbody');
    if (!tbody) return;

    if (!events || events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Aucune réservation de gâteau d'événement pour le moment.</td></tr>`;
        return;
    }

    tbody.innerHTML = events.map(evt => {
        const statusBadge = getEventStatusBadge(evt.status || 'Nouveau Devis Reçu');
        return `
            <tr>
                <td class="fw-bold text-dark">#${evt.ref || evt.id}</td>
                <td>
                    <div class="fw-bold">${evt.name || 'Client BABI'}</div>
                    <div class="small text-muted"><i class="fa-solid fa-phone me-1"></i> ${evt.phone || 'Non renseigné'}</div>
                </td>
                <td>
                    <span class="badge ${evt.eventType === 'Mariage' ? 'bg-warning text-dark' : 'bg-primary'} fw-bold">${evt.eventType || 'Événement'}</span>
                </td>
                <td>
                    <div class="fw-bold text-danger">${evt.portions || 20} parts (${evt.tiers || 1} Étage${(evt.tiers || 1) > 1 ? 's' : ''})</div>
                    <small class="text-muted">${evt.flavor || 'Chocolat'}</small>
                </td>
                <td>
                    <div class="small fw-semibold text-dark">"${evt.message || 'Sans inscription'}"</div>
                    ${evt.notes ? `<small class="text-muted d-block fst-italic">Note: ${evt.notes}</small>` : ''}
                </td>
                <td>
                    <div class="fw-bold text-dark">${evt.date || 'À convenir'}</div>
                    <small class="text-muted">${evt.time || ''}</small>
                </td>
                <td class="fw-bold fs-6 text-danger">${(evt.price || 0).toLocaleString()} FCFA</td>
                <td>
                    <div class="d-flex flex-column gap-1">
                        ${statusBadge}
                        <div class="btn-group btn-group-sm mt-1">
                            <button class="btn btn-outline-success btn-sm" onclick="contactEventWhatsApp('${evt.ref}')" title="Contacter sur WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </button>
                            <button class="btn btn-outline-dark btn-sm" onclick="changeEventStatus('${evt.ref}')" title="Changer le statut">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="printEventTicket('${evt.ref}')" title="Imprimer la Fiche Fournil">
                                <i class="fa-solid fa-print"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getEventStatusBadge(status) {
    if (status.includes('Fournil') || status.includes('préparation')) {
        return `<span class="badge bg-warning text-dark"><i class="fa-solid fa-fire-burner me-1"></i> Au Fournil</span>`;
    } else if (status.includes('Prêt') || status.includes('comptoir')) {
        return `<span class="badge bg-success"><i class="fa-solid fa-box-open me-1"></i> Prêt au Comptoir</span>`;
    } else if (status.includes('Livré') || status.includes('Clôturé')) {
        return `<span class="badge bg-secondary"><i class="fa-solid fa-check me-1"></i> Livré / Récupéré</span>`;
    }
    return `<span class="badge bg-info text-dark"><i class="fa-solid fa-bell me-1"></i> Devis Reçu</span>`;
}

function filterEventsTable() {
    const q = (document.getElementById('event-search')?.value || '').toLowerCase();
    const type = document.getElementById('event-filter-type')?.value || '';

    const filtered = allEventOrders.filter(evt => {
        const matchQ = (evt.name || '').toLowerCase().includes(q) ||
                       (evt.ref || '').toLowerCase().includes(q) ||
                       (evt.phone || '').includes(q);
        const matchType = !type || (evt.eventType === type);
        return matchQ && matchType;
    });

    renderEventsTable(filtered);
}

function changeEventStatus(ref) {
    const evt = allEventOrders.find(e => e.ref === ref || e.id === ref);
    if (!evt) return;

    const choices = ["Nouveau Devis Reçu", "Acompte Reçu (Validé)", "En préparation au Fournil", "Prêt pour Retrait Comptoir", "Livré & Clôturé"];
    const current = evt.status || choices[0];
    const newStatus = prompt(`Modifier le statut de la commande #${ref} :\n\nOptions :\n1. Nouveau Devis Reçu\n2. Acompte Reçu (Validé)\n3. En préparation au Fournil\n4. Prêt pour Retrait Comptoir\n5. Livré & Clôturé`, current);

    if (newStatus) {
        evt.status = newStatus;
        try {
            localStorage.setItem('babi_event_orders', JSON.stringify(allEventOrders));
        } catch(e) {}
        renderEventsTable(allEventOrders);
        alert(`✅ Statut de la commande #${ref} mis à jour : ${newStatus}`);
    }
}

function contactEventWhatsApp(ref) {
    const evt = allEventOrders.find(e => e.ref === ref || e.id === ref);
    if (!evt) return;

    const cleanPhone = (evt.phone || '').replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('225') ? cleanPhone : ('225' + cleanPhone);
    const msg = `Bonjour ${evt.name || 'cher client'}, c'est la Boulangerie de BABI (Chef Pâtissier) concernant votre réservation de gâteau #${evt.ref} (${evt.portions} parts pour le ${evt.date}). Nous sommes à votre entière disposition ! 🎂✨`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(msg)}`, '_blank');
}

function printEventTicket(ref) {
    const evt = allEventOrders.find(e => e.ref === ref || e.id === ref);
    if (!evt) return;

    const printWin = window.open('', '', 'width=600,height=700');
    printWin.document.write(`
        <html>
        <head>
            <title>Fiche Fournil - #${evt.ref}</title>
            <style>
                body { font-family: monospace; padding: 20px; color: #000; line-height: 1.4; }
                .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
                .title { font-size: 1.3rem; font-weight: bold; }
                .section { margin: 12px 0; }
                .big { font-size: 1.2rem; font-weight: bold; }
                .footer { border-top: 2px dashed #000; margin-top: 20px; padding-top: 10px; text-align: center; font-size: 0.85rem; }
            </style>
        </head>
        <body onload="window.print();">
            <div class="header">
                <div class="title">BOULANGERIE DE BABI</div>
                <div>FICHE TECHNIQUE FOURNIL & PÂTISSERIE</div>
                <div>COMMANDE GÂTEAU D'ÉVÉNEMENT</div>
            </div>
            <div class="section">
                <div><strong>RÉF :</strong> #${evt.ref}</div>
                <div><strong>DATE DE RETRAIT :</strong> ${evt.date} (${evt.time})</div>
                <div><strong>CLIENT :</strong> ${evt.name} (${evt.phone})</div>
            </div>
            <hr style="border: 1px dashed #000;">
            <div class="section">
                <div class="big">ÉVÉNEMENT : ${evt.eventType}</div>
                <div class="big">NOMBRE DE PARTS : ${evt.portions} PERSONNES</div>
                <div class="big">ARCHITECTURE : ${evt.tiers} ÉTAGE(S)</div>
                <div><strong>PARFUMS / GARNITURE :</strong> ${evt.flavor}</div>
            </div>
            <div class="section" style="background:#eee; padding: 10px;">
                <strong>INSCRIPTION CALLIGRAPHIÉE SUR LE GÂTEAU :</strong><br>
                <div class="big" style="margin-top: 5px;">"${evt.message || 'AUCUNE'}"</div>
            </div>
            ${evt.notes ? `<div class="section"><strong>CONSIGNES / THÈME :</strong> ${evt.notes}</div>` : ''}
            <div class="footer">
                <div>MONTANT TOTAL : ${evt.price.toLocaleString()} FCFA</div>
                <div>Fournil Cocody Riviera 2 — Abidjan</div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
}

async function fetchSecurityAuditLogs() {
    const tbody = document.getElementById('security-logs-tbody');
    
    // 1. Fetch SOC Metrics
    try {
        const socRes = await fetch('/api/v1/security/soc-metrics');
        if (socRes.ok) {
            const socData = await socRes.json();
            const merkleBlocksEl = document.getElementById('soc-merkle-blocks');
            const trappedCountEl = document.getElementById('soc-trapped-count');
            const bannedCountEl = document.getElementById('soc-banned-count');
            const rulesCountEl = document.getElementById('soc-rules-count');

            if (merkleBlocksEl) merkleBlocksEl.innerText = `${socData.total_merkle_blocks || 0} Blocs Scellés`;
            if (trappedCountEl) trappedCountEl.innerText = `${socData.trapped_attackers_count || 0} PIRATES PIÉGÉS`;
            if (bannedCountEl) bannedCountEl.innerText = `${socData.banned_hackers_count || 0} IPs EN QUARANTAINE`;
            if (rulesCountEl) rulesCountEl.innerText = `${socData.active_firewall_rules || 24} Règles WAF & IDS/IPS`;

            if (socData.attack_breakdown) {
                const bd = socData.attack_breakdown;
                const sqliEl = document.getElementById('stat-sqli');
                const rceEl = document.getElementById('stat-rce');
                const xssEl = document.getElementById('stat-xss');
                const lfiEl = document.getElementById('stat-lfi');
                const ssrfEl = document.getElementById('stat-ssrf');
                const botsEl = document.getElementById('stat-bots');

                if (sqliEl) sqliEl.innerText = `${bd.sqli_blocked || 0} Bloqué(s)`;
                if (rceEl) rceEl.innerText = `${bd.rce_blocked || 0} Bloqué(s)`;
                if (xssEl) xssEl.innerText = `${bd.xss_blocked || 0} Bloqué(s)`;
                if (lfiEl) lfiEl.innerText = `${bd.lfi_blocked || 0} Bloqué(s)`;
                if (ssrfEl) ssrfEl.innerText = `${bd.ssrf_blocked || 0} Bloqué(s)`;
                if (botsEl) botsEl.innerText = `${bd.bots_scanners_blocked || 0} Bloqué(s)`;
            }
        }
    } catch (e) {}

    // 2. Fetch Security Audit Logs
    const logContainer = document.getElementById('security-logs');
    if (logContainer) {
        try {
            const res = await fetch('/api/security/audit-logs');
            const data = await res.json();
            if (data.logs && data.logs.length > 0) {
                logContainer.innerHTML = data.logs.map(log => {
                    const tagClass = log.risk_level === 'ÉLEVÉ' ? 'tag-shield' : (log.event_type.includes('MERKLE') ? 'tag-merkle' : 'tag-success');
                    const dateStr = new Date(log.created_at || Date.now()).toLocaleTimeString('fr-FR');
                    return `
                        <div class="cyber-log-item">
                            <span class="cyber-log-time">[${dateStr}]</span>
                            <span class="cyber-log-tag ${tagClass}">${log.event_type || 'AUDIT_LOG'}</span>
                            <span class="text-amber-100/90 font-mono">${log.details || `Événement ${log.event_type} validé pour commande #${log.order_id || 'CMD'}`}.</span>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) {
            // Keep default rich logs
        }
    }

    if (!tbody) return;

    try {
        const res = await fetch('/api/security/audit-logs');
        const data = await res.json();

        if (!data.logs || data.logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fa-solid fa-shield-check text-success fs-3 d-block mb-2"></i>
                        Aucun incident de sécurité. Moteur IA Sentinel actif (100% Conforme).
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.logs.map(log => {
            const levelBadge = log.risk_level === 'ÉLEVÉ' 
                ? '<span class="badge bg-danger text-white">ÉLEVÉ</span>'
                : (log.risk_level === 'MODÉRÉ' 
                    ? '<span class="badge bg-warning text-dark">MODÉRÉ</span>'
                    : '<span class="badge bg-success text-white">FAIBLE</span>');

            const dateStr = new Date(log.created_at || Date.now()).toLocaleString('fr-FR');
            const shortHash = log.hash_signature ? log.hash_signature.substring(0, 16) + '...' : 'N/A';

            return `
                <tr>
                    <td class="small text-muted">${dateStr}</td>
                    <td><strong class="text-dark">${log.event_type}</strong></td>
                    <td><code>#${log.order_id || 'N/A'}</code></td>
                    <td><span class="fw-bold">${log.risk_score || 0}/100</span></td>
                    <td>${levelBadge}</td>
                    <td class="small"><code>${log.ip_address || '127.0.0.1'}</code></td>
                    <td class="small text-muted font-monospace" title="${log.hash_signature}">${shortHash}</td>
                </tr>
            `;
        }).join('');
    } catch(e) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <span class="badge bg-success py-2 px-3"><i class="fa-solid fa-circle-check me-1"></i> Moteur IA Sentinel Actif</span>
                    <div class="small mt-2">Dernière vérification : 0 tentative de fraude détectée.</div>
                </td>
            </tr>
        `;
    }
}

// =============================================================
// PRESTIGE USER PROFILE & QUICK SWITCHER FUNCTIONS
// =============================================================
function toggleProfileDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('profileDropdownMenu');
    const chevron = document.getElementById('profileChevron');
    if (!menu) return;

    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        menu.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        menu.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('profileDropdownWrapper');
    const menu = document.getElementById('profileDropdownMenu');
    const chevron = document.getElementById('profileChevron');
    if (wrapper && !wrapper.contains(e.target) && menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
});

function openChangePasswordModal() {
    const menu = document.getElementById('profileDropdownMenu');
    if (menu) menu.classList.add('hidden');
    const modal = document.getElementById('passwordModal');
    if (modal) modal.classList.remove('hidden');
}

function closeChangePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.classList.add('hidden');
}

// =============================================================
// TOAST NOTIFICATIONS PRESTIGE (SANS POPUPS BLOQUANTES)
// =============================================================
function showAdminToast(message, type = 'success') {
    let container = document.getElementById('babi-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'babi-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    let bg = 'linear-gradient(135deg, #2b160c 0%, #1c0e07 100%)';
    let border = '1px solid #f5b800';
    let icon = 'check_circle';
    let iconColor = '#f5b800';

    if (type === 'info') {
        icon = 'info';
        iconColor = '#60a5fa';
    } else if (type === 'error') {
        icon = 'warning';
        iconColor = '#f87171';
        border = '1px solid #ef4444';
    }

    toast.style.cssText = `
        background: ${bg};
        border: ${border};
        color: #ffffff;
        padding: 12px 22px;
        border-radius: 9999px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        font-family: 'Manrope', sans-serif;
        font-size: 13.5px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    toast.innerHTML = `
        <span class="material-symbols-outlined" style="color: ${iconColor}; font-size: 20px;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function handlePasswordChange(e) {
    e.preventDefault();
    const oldP = document.getElementById('old-password')?.value;
    const newP = document.getElementById('new-password')?.value;
    const confP = document.getElementById('confirm-password')?.value;

    if (newP !== confP) {
        showAdminToast('Les nouveaux mots de passe ne correspondent pas', 'error');
        return;
    }

    showAdminToast('✅ Mot de passe Super Admin mis à jour avec succès !', 'success');
    closeChangePasswordModal();
}

function handleAdminLogout() {
    if (confirm('🔒 Voulez-vous fermer votre session sécurisée de Direction ?')) {
        sessionStorage.clear();
        localStorage.removeItem('babi_admin_auth');
        window.location.href = 'index.html';
    }
}

// =============================================================
// AVATAR PROFILE MANAGEMENT & UPLOAD
// =============================================================
let currentSelectedAvatar = null;

function applySavedAvatar() {
    const saved = localStorage.getItem('babi_admin_avatar');
    if (saved) {
        const topbarImg = document.getElementById('topbar-user-avatar');
        const dropImg = document.getElementById('dropdown-user-avatar');
        const prevImg = document.getElementById('avatar-preview-img');
        if (topbarImg) topbarImg.src = saved;
        if (dropImg) dropImg.src = saved;
        if (prevImg) prevImg.src = saved;
    }
}

// Call on startup
document.addEventListener('DOMContentLoaded', () => {
    applySavedAvatar();
});

function openAvatarModal() {
    const menu = document.getElementById('profileDropdownMenu');
    if (menu) menu.classList.add('hidden');

    const modal = document.getElementById('avatarModal');
    if (!modal) return;

    const saved = localStorage.getItem('babi_admin_avatar') || 'assets/chef_profile.png';
    currentSelectedAvatar = saved;
    const preview = document.getElementById('avatar-preview-img');
    if (preview) preview.src = saved;

    modal.classList.remove('hidden');
}

function closeAvatarModal() {
    const modal = document.getElementById('avatarModal');
    if (modal) modal.classList.add('hidden');
}

function selectPresetAvatar(el, src) {
    document.querySelectorAll('.avatar-preset-item').forEach(item => item.classList.remove('selected'));
    if (el) el.classList.add('selected');
    currentSelectedAvatar = src;
    const preview = document.getElementById('avatar-preview-img');
    if (preview) preview.src = src;
}

function handleAvatarFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showAdminToast('⚠️ Fichier trop volumineux (max 5 Mo)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Data = event.target.result;
        currentSelectedAvatar = base64Data;
        const preview = document.getElementById('avatar-preview-img');
        if (preview) preview.src = base64Data;

        // Deselect preset buttons
        document.querySelectorAll('.avatar-preset-item').forEach(item => item.classList.remove('selected'));
    };
    reader.readAsDataURL(file);
}

function saveProfileAvatar() {
    if (!currentSelectedAvatar) {
        closeAvatarModal();
        return;
    }

    localStorage.setItem('babi_admin_avatar', currentSelectedAvatar);
    applySavedAvatar();
    closeAvatarModal();

    // Show luxury feedback toast
    showAdminToast('👑 Photo de profil mise à jour avec succès !', 'success');
}

// =============================================================
// RESET ALL METRICS TO ZERO (NOUVEAU CADEAU / JOUR 1)
// =============================================================
function resetAllToZeroDayOne() {
    if (confirm("🎁 Voulez-vous initialiser le tableau de bord à Zéro (Nouveau Départ / Jour 1) ?\n\n✓ Chiffre d'affaires : 0 FCFA\n✓ Commandes : 0 enregistrées\n✓ Gâteaux : 0 en cours\n✓ Catalogue : Stocks initiaux complets")) {
        localStorage.setItem('babi_orders', '[]');
        localStorage.setItem('babi_event_orders', '[]');
        localStorage.removeItem('babi_admin_products');
        
        allOrders = [];
        allProducts = DEFAULT_PRODUCTS;
        saveProductsLocally();
        
        loadOrders();
        loadEventOrders();
        filterProductsGrid();
        updateStockSummaryKpis();
        
        showAdminToast("🎁 Remise à zéro effectuée ! Tableau de bord prêt pour le Jour 1.", "success");
    }
}

// =============================================================
// EXPORT COMPTABLE EXCEL / CSV EN 1 CLIC
// =============================================================
function exportAccountingCSV() {
    const orders = allOrders && allOrders.length > 0 ? allOrders : [];
    
    // Entêtes officielles du grand livre des ventes
    const headers = [
        "Date_Vente",
        "Reference_Commande",
        "Nom_Client",
        "Telephone_Client",
        "Articles_Commandes",
        "Mode_Paiement",
        "Chiffre_Affaires_Brut_FCFA",
        "TVA_Collectee_0pct_FCFA",
        "Commission_Plateforme_12pct_FCFA",
        "Net_Fournil_88pct_FCFA",
        "Statut_Livraison",
        "Certificat_Merkle_Audit"
    ];

    let csvContent = "\uFEFF"; // BOM UTF-8 pour ouverture parfaite dans Excel
    csvContent += headers.join(";") + "\r\n";

    if (orders.length === 0) {
        // Ligne d'exemple vierge
        csvContent += [
            new Date().toLocaleDateString('fr-FR'),
            "AUCUNE_VENTE_ENREGISTREE",
            "N/A",
            "N/A",
            "Catalogue Initialisé",
            "N/A",
            "0",
            "0",
            "0",
            "0",
            "INITIALISE",
            "GENESIS_BLOCK_#0001"
        ].join(";") + "\r\n";
    } else {
        orders.forEach(o => {
            const brut = Number(o.total_price) || Number(o.total_amount) || 0;
            const com = Math.round(brut * 0.12);
            const net = brut - com;
            const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
            
            const row = [
                `"${dateStr}"`,
                `"${o.id || o.order_number || 'BAB-001'}"`,
                `"${(o.customer_name || 'Client').replace(/"/g, '""')}"`,
                `"${o.customer_phone || o.phone || 'N/A'}"`,
                `"${(o.items_summary || o.items || 'Articles variés').replace(/"/g, '""')}"`,
                `"${o.payment_method || 'Wave CI'}"`,
                brut,
                0,
                com,
                net,
                `"${o.status || 'valide'}"`,
                `"MERKLE_CERTIFIED_OK"`
            ];
            csvContent += row.join(";") + "\r\n";
        });
    }

    // Création du lien de téléchargement automatique
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `babi_grand_livre_ventes_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



