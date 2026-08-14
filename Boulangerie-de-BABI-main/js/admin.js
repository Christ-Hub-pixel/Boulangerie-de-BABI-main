// JS Admin Dashboard Logic

let allOrders = [];
let allProducts = [];
let allUsers = [];
let revenueChart = null;
let categoryChart = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminData();

    // Auto refresh orders every 10 seconds
    setInterval(fetchAdminData, 10000);

    // Form submit listener for adding products
    const addProdForm = document.getElementById('add-product-form');
    if (addProdForm) {
        addProdForm.addEventListener('submit', handleAddProduct);
    }
});

// Tab navigation switcher
function showTab(tabName) {
    document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-menu a').forEach(el => el.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.add('active');

    // Highlight active link
    const activeLink = Array.from(document.querySelectorAll('.admin-menu a')).find(a => a.getAttribute('onclick') && a.getAttribute('onclick').includes(tabName));
    if (activeLink) activeLink.classList.add('active');

    // Update topbar title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        const titles = {
            'overview': "Vue d'ensemble",
            'orders': "Commandes en Direct",
            'products': "Gestion du Catalogue Produits",
            'users': "Liste des Clients Inscrits",
            'drivers': "Suivi de la Flotte de Livreurs"
        };
        pageTitle.innerText = titles[tabName] || "Dashboard Admin";
    }
}

// Fetch all required data from backend APIs
async function fetchAdminData() {
    await Promise.all([
        loadStats(),
        loadOrders(),
        loadProducts(),
        loadUsers()
    ]);
}

// Load statistics and charts
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();

        document.getElementById('stat-revenue').innerText = (stats.totalRevenue || 0).toLocaleString() + ' FCFA';
        document.getElementById('stat-new-orders').innerText = stats.newOrdersCount || 0;
        document.getElementById('stat-pending-orders').innerText = stats.pendingOrdersCount || 0;
        document.getElementById('stat-delivered-orders').innerText = stats.deliveredOrdersCount || 0;

        const navBadge = document.getElementById('nav-orders-badge');
        if (navBadge) {
            if (stats.newOrdersCount > 0) {
                navBadge.innerText = stats.newOrdersCount;
                navBadge.style.display = 'inline-block';
            } else {
                navBadge.style.display = 'none';
            }
        }

        renderCharts(stats);
    } catch (err) {
        console.error("Erreur stats:", err);
    }
}

let lastOrderCount = 0;

// Load orders table
async function loadOrders() {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        
        if (lastOrderCount > 0 && orders.length > lastOrderCount) {
            playAudioBeepAlert();
        }
        lastOrderCount = orders.length;

        allOrders = orders;
        renderOrdersTable(allOrders);
    } catch (err) {
        console.error("Erreur orders:", err);
    }
}

function playAudioBeepAlert() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Aucune commande enregistrée pour le moment.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td class="fw-bold">#${o.id}</td>
            <td>
                <div class="fw-bold">${o.customer_name || 'Client Anonyme'}</div>
                <small class="text-muted">${o.created_at ? new Date(o.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : ''}</small>
            </td>
            <td>
                <div>${o.address || 'N/A'}</div>
                <small class="text-muted">${o.phone || ''}</small>
            </td>
            <td><small>${o.items || 'N/A'}</small></td>
            <td class="fw-bold text-primary">${(o.total_price || 0).toLocaleString()} FCFA</td>
            <td><span class="badge bg-light text-dark border">${o.payment_method || 'Espèces'}</span></td>
            <td>
                <span class="badge-status ${getBadgeClass(o.status)}">${o.status || 'nouveau'}</span>
            </td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Action</button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'nouveau')">🔴 Nouveau</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'en preparation')">🟠 En préparation</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'en livraison')">🔵 En livraison</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'livre')">🟢 Livré</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-warning fw-bold" href="#" onclick="triggerAdminSupport(${o.id})"><i class="fa-solid fa-headset me-2"></i> 💬 Prise en charge (Support)</a></li>
                        <li><a class="dropdown-item text-danger fw-bold" href="#" onclick="triggerAdminRefund(${o.id})"><i class="fa-solid fa-rotate-left me-2"></i> 💸 Annuler & Rembourser</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-primary" href="#" onclick="openReceiptModal(${o.id})"><i class="fa-solid fa-receipt me-2"></i> Voir Reçu</a></li>
                    </ul>
                </div>
            </td>
        </tr>
    `).join('');
}

function getBadgeClass(status) {
    if (!status) return 'badge-nouveau';
    const s = status.toLowerCase();
    if (s.includes('livre') || s.includes('livré')) return 'badge-livre';
    if (s.includes('livraison')) return 'badge-livraison';
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
                <div><strong>Adresse :</strong> ${order.address || 'Livraison à domicile'}</div>
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

// Render Chart.js Analytics
function renderCharts(stats) {
    const ctxRev = document.getElementById('revenueChart');
    if (ctxRev && !revenueChart) {
        revenueChart = new Chart(ctxRev, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Revenus (FCFA)',
                    data: [15000, 25000, 18000, 32000, 28000, 45000, stats.totalRevenue || 50000],
                    borderColor: '#2b160c',
                    backgroundColor: 'rgba(43, 22, 12, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    const ctxCat = document.getElementById('categoryChart');
    if (ctxCat && !categoryChart) {
        categoryChart = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['Pains', 'Viennoiseries', 'Pâtisseries', 'Boissons & Jus'],
                datasets: [{
                    data: [40, 25, 20, 15],
                    backgroundColor: ['#2b160c', '#fb923c', '#e11d48', '#0284c7'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
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
