/**
 * ==============================================================================
 * 👩‍🍳 BOULANGERIE DE BABI — SCRIPT DE L'ESPACE SUPERVISION GÉRANTE & FOURNIL
 * ==============================================================================
 * Pilotage opérationnel : Fournées Pain Chaud, Stocks, Commandes & Équipe.
 */

const API_BASE = (window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000'));

const GeranteState = {
    currentManager: null,
    dashboardData: null,
    stocks: [],
    filteredStocks: [],
    orders: [],
    filteredOrders: [],
    selectedOrderFilter: 'all',
    employees: [],
    
    // Fournil & Pain Chaud
    hotBreadStatus: {
        isBaking: false,
        lastBatchTime: '18:15',
        nextBatchTime: '19:30',
        activeProduct: 'Baguette Tradition & Croissants Pur Beurre',
        tempDegrees: 240
    },
    
    // Mode Anti-Gaspillage
    isAntiGaspiActive: false
};

// -------------------------------------------------------------
// 1. INITIALISATION AU CHARGEMENT DE LA PAGE
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    checkManagerSession();
    await loadAllDashboardData();
    
    // Rafraîchissement automatique toutes les 15 secondes
    setInterval(loadAllDashboardData, 15000);
});

function initClock() {
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Abidjan', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const clockEl = document.getElementById('geranteClock');
        if (clockEl) clockEl.innerText = `${timeStr} (Abidjan GMT)`;
    };
    updateTime();
    setInterval(updateTime, 1000);
}

function checkManagerSession() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('babi_user') || '{}');
    } catch (_) {}

    if (user && (user.role === 'gerante' || user.role === 'admin')) {
        GeranteState.currentManager = user;
    } else {
        // Profil par défaut gérante
        GeranteState.currentManager = {
            id: 2,
            prenom: 'Marie-Claire',
            nom: 'Kouamé',
            role: 'gerante',
            avatar: 'assets/aicha.png'
        };
        localStorage.setItem('babi_user', JSON.stringify(GeranteState.currentManager));
    }

    const nameEl = document.getElementById('managerNameDisplay');
    const avatarEl = document.getElementById('managerAvatarDisplay');
    if (nameEl) nameEl.innerText = `${GeranteState.currentManager.prenom} ${GeranteState.currentManager.nom}`;
    if (avatarEl && GeranteState.currentManager.avatar) avatarEl.src = GeranteState.currentManager.avatar;
}

// -------------------------------------------------------------
// 2. CHARGEMENT CENTRALISÉ DES DONNÉES DU TABLEAU DE BORD
// -------------------------------------------------------------
async function loadAllDashboardData() {
    try {
        await Promise.all([
            fetchDashboardStats(),
            fetchStocks(),
            fetchOrders(),
            fetchEmployees(),
            fetchBakerySchedule()
        ]);
    } catch (err) {
        console.error("Erreur actualisation gérante :", err);
    }
}

async function fetchDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/api/reports/manager-dashboard`);
        if (!res.ok) throw new Error("Erreur stats");
        const data = await res.json();
        GeranteState.dashboardData = data;
        renderDashboardStats(data);
    } catch (_) {
        // Fallback local
        const fallback = {
            todayRevenue: 145000,
            todayOrdersCount: 24,
            lowStocksCount: 2,
            employeesPresent: 6,
            employeesTotal: 6,
            ordersEnAttenteFournil: 3,
            ordersPretesComptoir: 2
        };
        renderDashboardStats(fallback);
    }
}

function renderDashboardStats(data) {
    const revEl = document.getElementById('kpiTodayRevenue');
    const ordersEl = document.getElementById('kpiTodayOrders');
    const lowStockEl = document.getElementById('kpiLowStocks');
    const staffEl = document.getElementById('kpiStaffPresent');
    const prepBadge = document.getElementById('tabOrdersPrepBadge');

    if (revEl) revEl.innerText = `${formatMoney(data.todayRevenue || 0)} F`;
    if (ordersEl) ordersEl.innerText = data.todayOrdersCount || 0;
    if (lowStockEl) {
        lowStockEl.innerText = data.lowStocksCount || 0;
        lowStockEl.className = `ger-kpi-value ${data.lowStocksCount > 0 ? 'text-danger' : 'text-success'}`;
    }
    if (staffEl) staffEl.innerText = `${data.employeesPresent || 0} / ${data.employeesTotal || 0}`;
    if (prepBadge) prepBadge.innerText = (data.ordersEnAttenteFournil || 0) + (data.ordersPretesComptoir || 0);
}

// Statut horaire de la boulangerie (05h45 - 23h00)
async function fetchBakerySchedule() {
    try {
        const res = await fetch(`${API_BASE}/api/bakery/status`);
        const data = await res.json();
        const badge = document.getElementById('bakeryOpenBadge');
        if (badge) {
            if (data.isOpen) {
                badge.className = 'badge bg-success px-3 py-2 fw-bold';
                badge.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> Fournil Ouvert (${data.openingTime} - ${data.closingTime})`;
            } else {
                badge.className = 'badge bg-danger px-3 py-2 fw-bold';
                badge.innerHTML = `<i class="fa-solid fa-moon me-1"></i> Fermé (Réouverture à ${data.openingTime})`;
            }
        }
    } catch (_) {}
}

// -------------------------------------------------------------
// 3. PILOTAGE DU FOURNIL & ALERTE "PAIN CHAUD"
// -------------------------------------------------------------
const FournilManager = {
    triggerHotBread() {
        GeranteState.hotBreadStatus.isBaking = true;
        GeranteState.hotBreadStatus.lastBatchTime = new Date().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Abidjan', hour: '2-digit', minute: '2-digit' });
        
        // Calcul prochaine fournée dans 45 mins
        const nextDate = new Date(Date.now() + 45 * 60000);
        GeranteState.hotBreadStatus.nextBatchTime = nextDate.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Abidjan', hour: '2-digit', minute: '2-digit' });

        renderHotBreadStatus();
        showToast("🔥 FOURNÉE DÉCLENCHÉE ! Alerte envoyée aux clients en ligne et sur l'App.", "success");
        
        // Auto-incrémenter le stock de baguettes (+50)
        fetch(`${API_BASE}/api/stocks/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom_produit: 'Baguette Tradition',
                quantite: 50,
                type: 'entree',
                motif: 'Sortie de Fournée Pain Chaud',
                auteur: `${GeranteState.currentManager.prenom} (Gérante)`
            })
        }).then(() => fetchStocks()).catch(() => {});
    }
};

function renderHotBreadStatus() {
    const lastEl = document.getElementById('hotBreadLastTime');
    const nextEl = document.getElementById('hotBreadNextTime');
    const batchBadge = document.getElementById('hotBreadLiveBadge');

    if (lastEl) lastEl.innerText = GeranteState.hotBreadStatus.lastBatchTime;
    if (nextEl) nextEl.innerText = GeranteState.hotBreadStatus.nextBatchTime;
    if (batchBadge) {
        batchBadge.className = 'badge bg-warning text-dark px-3 py-2 fw-black fs-6';
        batchBadge.innerHTML = `<i class="fa-solid fa-fire me-1 text-danger"></i> FOURNÉE EN COURS • Sortie fraîche ${GeranteState.hotBreadStatus.lastBatchTime}`;
    }
}

// -------------------------------------------------------------
// 4. GESTION DES STOCKS & MODE ANTI-GASPILLAGE
// -------------------------------------------------------------
async function fetchStocks() {
    try {
        const res = await fetch(`${API_BASE}/api/stocks`);
        if (!res.ok) throw new Error("Erreur stocks");
        const data = await res.json();
        GeranteState.stocks = Array.isArray(data) ? data : [];
        GeranteState.filteredStocks = [...GeranteState.stocks];
        renderStocksTable();
    } catch (_) {
        // Fallback local
        GeranteState.stocks = [
            { id: 1, nom_produit: 'Baguette Tradition', categorie: 'pain', quantite_disponible: 45, seuil_alerte: 10, unite: 'pièce', prix_unitaire: 400 },
            { id: 2, nom_produit: 'Croissant Pur Beurre', categorie: 'viennoiserie', quantite_disponible: 8, seuil_alerte: 10, unite: 'pièce', prix_unitaire: 600 },
            { id: 3, nom_produit: 'Pain au Chocolat', categorie: 'viennoiserie', quantite_disponible: 18, seuil_alerte: 10, unite: 'pièce', prix_unitaire: 650 },
            { id: 4, nom_produit: 'Pain Complet Gourmand', categorie: 'pain', quantite_disponible: 5, seuil_alerte: 10, unite: 'pièce', prix_unitaire: 800 },
            { id: 5, nom_produit: 'Jus de Bissap Maison', categorie: 'boisson', quantite_disponible: 25, seuil_alerte: 5, unite: 'bouteille', prix_unitaire: 1000 },
            { id: 6, nom_produit: 'Brioche Dorée', categorie: 'viennoiserie', quantite_disponible: 12, seuil_alerte: 8, unite: 'pièce', prix_unitaire: 1200 }
        ];
        GeranteState.filteredStocks = [...GeranteState.stocks];
        renderStocksTable();
    }
}

function renderStocksTable() {
    const tbody = document.getElementById('geranteStocksTableBody');
    if (!tbody) return;

    if (GeranteState.filteredStocks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Aucun article dans les stocks.</td></tr>`;
        return;
    }

    tbody.innerHTML = GeranteState.filteredStocks.map(s => {
        const qty = s.quantite_disponible !== undefined ? s.quantite_disponible : 0;
        const seuil = s.seuil_alerte || 10;
        let badgeHtml = '';

        if (qty === 0) {
            badgeHtml = `<span class="ger-stock-badge ger-stock-danger"><i class="fa-solid fa-triangle-exclamation"></i> Rupture (0)</span>`;
        } else if (qty <= seuil) {
            badgeHtml = `<span class="ger-stock-badge ger-stock-warning"><i class="fa-solid fa-bell"></i> Stock Faible (${qty})</span>`;
        } else {
            badgeHtml = `<span class="ger-stock-badge ger-stock-ok"><i class="fa-solid fa-check"></i> En Stock (${qty})</span>`;
        }

        return `
            <tr>
                <td class="fw-bold text-dark">${escapeHtml(s.nom_produit)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(s.categorie || 'Général')}</span></td>
                <td>${badgeHtml}</td>
                <td><span class="text-muted small">Alerte dès &le; ${seuil} ${escapeHtml(s.unite || 'pcs')}</span></td>
                <td class="fw-bold text-dark">${formatMoney(s.prix_unitaire || 0)} FCFA</td>
                <td class="text-end">
                    <div class="d-inline-flex align-items-center gap-1">
                        <button class="ger-quick-adjust-btn" onclick="quickAdjustStock('${escapeHtml(s.nom_produit)}', 10)" title="Ajouter 10">+10</button>
                        <button class="ger-quick-adjust-btn" onclick="quickAdjustStock('${escapeHtml(s.nom_produit)}', 50)" title="Ajouter 50">+50</button>
                        <button class="ger-quick-adjust-btn" onclick="quickAdjustStock('${escapeHtml(s.nom_produit)}', -1)" title="Retirer 1">-1</button>
                        <button class="btn btn-sm btn-outline-warning ms-1" onclick="openStockModal('${escapeHtml(s.nom_produit)}', ${qty})" title="Ajustement détaillé">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterStocks(query) {
    const q = (query || '').toLowerCase().trim();
    GeranteState.filteredStocks = GeranteState.stocks.filter(s => 
        !q || (s.nom_produit && s.nom_produit.toLowerCase().includes(q)) || (s.categorie && s.categorie.toLowerCase().includes(q))
    );
    renderStocksTable();
}

async function quickAdjustStock(nomProduit, delta) {
    try {
        const res = await fetch(`${API_BASE}/api/stocks/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom_produit: nomProduit,
                quantite: Math.abs(delta),
                type: delta > 0 ? 'entree' : 'sortie',
                motif: delta > 0 ? 'Réapprovisionnement Rapide Fournil' : 'Ajustement Vente / Rebut',
                auteur: `${GeranteState.currentManager.prenom} (Gérante)`
            })
        });

        if (!res.ok) throw new Error("Erreur ajustement");
        showToast(`Stock ${nomProduit} ajusté (${delta > 0 ? '+' : ''}${delta})`, "success");
        await fetchStocks();
        await fetchDashboardStats();
    } catch (err) {
        showToast("Erreur ajustement stock : " + err.message, "danger");
    }
}

function openStockModal(nomProduit, currentQty) {
    document.getElementById('modalStockProdName').value = nomProduit;
    document.getElementById('modalStockCurrentQty').innerText = currentQty;
    document.getElementById('modalStockNewQty').value = '';
    const modal = new bootstrap.Modal(document.getElementById('modalAdjustStock'));
    modal.show();
}

async function submitCustomStockAdjust() {
    const prodName = document.getElementById('modalStockProdName').value;
    const qty = Number(document.getElementById('modalStockNewQty').value);
    const motif = document.getElementById('modalStockMotif').value || 'Ajustement manuel gérante';
    const type = document.getElementById('modalStockType').value;

    if (!qty || qty <= 0) {
        showToast("Veuillez saisir une quantité valide.", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/stocks/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom_produit: prodName,
                quantite: qty,
                type: type,
                motif: motif,
                auteur: `${GeranteState.currentManager.prenom} (Gérante)`
            })
        });

        if (!res.ok) throw new Error("Erreur mise à jour stock");
        showToast(`Stock ${prodName} mis à jour avec succès !`, "success");
        bootstrap.Modal.getInstance(document.getElementById('modalAdjustStock'))?.hide();
        await fetchStocks();
        await fetchDashboardStats();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// Mode Anti-Gaspillage 1-Clic
function toggleAntiGaspiMode() {
    GeranteState.isAntiGaspiActive = !GeranteState.isAntiGaspiActive;
    const btn = document.getElementById('btnAntiGaspi');
    
    if (GeranteState.isAntiGaspiActive) {
        if (btn) {
            btn.className = 'btn btn-success fw-bold px-3 py-2 rounded-3';
            btn.innerHTML = `<i class="fa-solid fa-seedling me-2"></i> Mode Anti-Gaspi ACTIF (-30% en ligne)`;
        }
        showToast("♻️ Mode Anti-Gaspillage ACTIVÉ ! Remise de fin de journée appliquée sur les viennoiseries restantes.", "success");
    } else {
        if (btn) {
            btn.className = 'btn btn-outline-success fw-bold px-3 py-2 rounded-3';
            btn.innerHTML = `<i class="fa-solid fa-recycle me-2"></i> Activer Mode Anti-Gaspi`;
        }
        showToast("Mode Anti-Gaspillage désactivé.", "info");
    }
}

// -------------------------------------------------------------
// 5. SUIVI ET TRAITEMENT DES COMMANDES
// -------------------------------------------------------------
async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/orders`);
        if (!res.ok) throw new Error("Erreur commandes");
        const data = await res.json();
        GeranteState.orders = Array.isArray(data) ? data : [];
        filterOrders(GeranteState.selectedOrderFilter);
    } catch (_) {
        // Fallback local
        GeranteState.orders = [
            { id: 28, customer_name: 'Kouassi Jean-Marc', phone: '07 04 38 92 01', total_price: 1900, status: 'pret_comptoir', code_pin: '5029', created_at: '2026-08-30 18:20:00', items: '[{"nom":"Baguette Tradition","prix":400,"quantity":2},{"nom":"Croissant","prix":600,"quantity":1}]' },
            { id: 27, customer_name: 'Adjoua Salimata', phone: '05 55 12 34 56', total_price: 3600, status: 'en_preparation', code_pin: '4443', created_at: '2026-08-30 18:10:00', items: '[{"nom":"Pain Complet","prix":800,"quantity":2},{"nom":"Jus de Bissap","prix":1000,"quantity":2}]' },
            { id: 26, customer_name: 'Touré Ibrahim', phone: '07 09 88 77 66', total_price: 1200, status: 'nouveau', code_pin: '7112', created_at: '2026-08-30 18:05:00', items: '[{"nom":"Brioche Dorée","prix":1200,"quantity":1}]' }
        ];
        filterOrders(GeranteState.selectedOrderFilter);
    }
}

function filterOrders(filter, btn) {
    GeranteState.selectedOrderFilter = filter;
    
    if (btn) {
        document.querySelectorAll('.ger-order-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    if (filter === 'all') {
        GeranteState.filteredOrders = [...GeranteState.orders];
    } else if (filter === 'en_cours') {
        GeranteState.filteredOrders = GeranteState.orders.filter(o => o.status === 'nouveau' || o.status === 'en_preparation');
    } else if (filter === 'pret') {
        GeranteState.filteredOrders = GeranteState.orders.filter(o => o.status === 'pret_comptoir');
    } else if (filter === 'livre') {
        GeranteState.filteredOrders = GeranteState.orders.filter(o => o.status === 'livre' || o.status === 'termine');
    }

    renderOrdersList();
}

function renderOrdersList() {
    const list = document.getElementById('geranteOrdersList');
    if (!list) return;

    if (GeranteState.filteredOrders.length === 0) {
        list.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-clipboard-check fs-1 opacity-25 mb-2 d-block"></i>
                <div class="fw-bold">Aucune commande dans cette section</div>
            </div>
        `;
        return;
    }

    list.innerHTML = GeranteState.filteredOrders.map(order => {
        let statusBadge = '';
        let actionBtn = '';

        if (order.status === 'nouveau') {
            statusBadge = `<span class="badge bg-danger">Nouveau</span>`;
            actionBtn = `<button class="btn btn-sm btn-warning fw-bold" onclick="updateOrderStatus(${order.id}, 'en_preparation')"><i class="fa-solid fa-fire me-1"></i> Mettre au Fournil</button>`;
        } else if (order.status === 'en_preparation') {
            statusBadge = `<span class="badge bg-warning text-dark">Au Fournil / Cuisson</span>`;
            actionBtn = `<button class="btn btn-sm btn-success fw-bold" onclick="updateOrderStatus(${order.id}, 'pret_comptoir')"><i class="fa-solid fa-box me-1"></i> Prêt au Comptoir</button>`;
        } else if (order.status === 'pret_comptoir') {
            statusBadge = `<span class="badge bg-success">Prêt au Retrait (PIN #${order.code_pin || '????'})</span>`;
            actionBtn = `<button class="btn btn-sm btn-outline-secondary" onclick="updateOrderStatus(${order.id}, 'livre')"><i class="fa-solid fa-check-double me-1"></i> Clôturer</button>`;
        } else {
            statusBadge = `<span class="badge bg-secondary">Remis & Clôturé</span>`;
            actionBtn = `<span class="text-success small fw-bold"><i class="fa-solid fa-circle-check"></i> Terminé</span>`;
        }

        let items = [];
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch (_) {}

        return `
            <div class="ger-order-card">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="fw-black text-dark fs-6">Commande #${order.id}</span>
                        ${statusBadge}
                    </div>
                    <span class="fw-bold text-dark fs-6">${formatMoney(order.total_price || 0)} FCFA</span>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-2 small text-muted">
                    <div><i class="fa-solid fa-user me-1"></i> ${escapeHtml(order.customer_name || 'Client')} • <i class="fa-solid fa-phone me-1"></i> ${escapeHtml(order.phone || '')}</div>
                    <div><i class="fa-solid fa-clock me-1"></i> ${order.created_at || 'Aujourd\'hui'}</div>
                </div>

                <div class="p-2 bg-light rounded-3 mb-2 small">
                    <strong>Articles :</strong> ${items.map(it => `${it.quantity || 1}x ${escapeHtml(it.nom || it.name || 'Produit')}`).join(', ')}
                </div>

                <div class="d-flex justify-content-end gap-2">
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) throw new Error("Erreur mise à jour");
        showToast(`Commande #${orderId} mise à jour (${newStatus}) !`, "success");
        await fetchOrders();
        await fetchDashboardStats();
    } catch (err) {
        showToast("Erreur statut commande : " + err.message, "danger");
    }
}

// -------------------------------------------------------------
// 6. GESTION DE L'ÉQUIPE & POINTAGE
// -------------------------------------------------------------
async function fetchEmployees() {
    try {
        const res = await fetch(`${API_BASE}/api/employees`);
        if (!res.ok) throw new Error("Erreur employés");
        const data = await res.json();
        GeranteState.employees = Array.isArray(data) ? data : [];
        renderEmployeesList();
    } catch (_) {
        // Fallback local
        GeranteState.employees = [
            { id: 1, nom: 'Kouassi', prenom: 'Mamadou', poste: 'Maître Boulanger', telephone: '07 01 22 33 44', statut_presence: 'present', avatar: 'assets/baker_profile.png' },
            { id: 2, nom: 'Diabaté', prenom: 'Sékou', poste: 'Chef Pâtissier', telephone: '07 02 33 44 55', statut_presence: 'present', avatar: 'assets/chef_profile.png' },
            { id: 3, nom: 'Traoré', prenom: 'Awa', poste: 'Caissière Principale', telephone: '05 55 12 34 56', statut_presence: 'present', avatar: 'assets/caissiere.png' },
            { id: 4, nom: 'Bamba', prenom: 'Fatou', poste: 'Caissière Retrait Express', telephone: '05 55 78 90 12', statut_presence: 'present', avatar: 'assets/caissiere1.png' },
            { id: 5, nom: 'Yao', prenom: 'Konan Yves', poste: 'Aide Fournil & Cuisson', telephone: '07 09 88 77 66', statut_presence: 'present', avatar: 'assets/kouassi.png' },
            { id: 6, nom: 'Koné', prenom: 'Adjoua Salimata', poste: 'Vendeuse & Accueil', telephone: '01 02 03 04 05', statut_presence: 'present', avatar: 'assets/aicha.png' }
        ];
        renderEmployeesList();
    }
}

function renderEmployeesList() {
    const container = document.getElementById('geranteEmployeesGrid');
    if (!container) return;

    container.innerHTML = GeranteState.employees.map(emp => {
        const isPresent = emp.statut_presence === 'present';
        const isPause = emp.statut_presence === 'pause';

        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="ger-employee-card">
                    <img src="${emp.avatar || 'assets/aicha.png'}" alt="${escapeHtml(emp.prenom)}" class="ger-employee-avatar" onerror="this.src='assets/aicha.png'">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-dark">${escapeHtml(emp.prenom)} ${escapeHtml(emp.nom)}</div>
                        <div class="small text-muted">${escapeHtml(emp.poste)}</div>
                        <div class="mt-2">
                            <span class="badge ${isPresent ? 'bg-success' : (isPause ? 'bg-warning text-dark' : 'bg-danger')}">
                                ${isPresent ? '✅ En Poste' : (isPause ? '☕ En Pause' : '❌ Absent')}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            Pointage
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <li><a class="dropdown-item text-success" href="javascript:void(0)" onclick="updateEmployeePresence(${emp.id}, 'present')"><i class="fa-solid fa-circle-check me-2"></i> En Poste</a></li>
                            <li><a class="dropdown-item text-warning" href="javascript:void(0)" onclick="updateEmployeePresence(${emp.id}, 'pause')"><i class="fa-solid fa-mug-saucer me-2"></i> En Pause</a></li>
                            <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="updateEmployeePresence(${emp.id}, 'absent')"><i class="fa-solid fa-circle-xmark me-2"></i> Absent</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function updateEmployeePresence(employeeId, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/api/employees/${employeeId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut_presence: newStatus })
        });

        if (!res.ok) throw new Error("Erreur statut employé");
        showToast("Pointage employé enregistré avec succès !", "success");
        await fetchEmployees();
        await fetchDashboardStats();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// -------------------------------------------------------------
// 7. GESTION DES ONGLETS & VUES
// -------------------------------------------------------------
function switchGeranteTab(tabName, btn) {
    document.querySelectorAll('.ger-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ger-tab-view').forEach(v => v.style.display = 'none');

    if (btn) btn.classList.add('active');
    const view = document.getElementById(`gerView_${tabName}`);
    if (view) view.style.display = 'block';
}

// Utilitaires
function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('fr-FR');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} shadow-lg py-2 px-3 m-0 d-flex align-items-center gap-2 fade show`;
    toast.style.cssText = 'min-width: 280px; border-radius: 12px; font-weight: 600; font-size: 0.95rem;';
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-success' : (type === 'danger' ? 'fa-triangle-exclamation text-danger' : 'fa-circle-info text-info')}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
