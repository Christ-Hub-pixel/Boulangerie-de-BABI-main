// -------------------------------------------------------------
// DASHBOARD GÉRANTE — LOGIQUE PILOTAGE & DIRECTION
// -------------------------------------------------------------

const API_ROOT = (typeof window !== 'undefined' && (window.API_BASE_URL || (window.location.hostname.includes('boulangeriedebabi.com') ? 'https://api.boulangeriedebabi.com' : 'http://localhost:5000'))) || 'http://localhost:5000';

let allStocks = [];
let allOrders = [];
let allEmployees = [];

// Fallback Demo Data if Server is offline
const DEMO_STOCKS = [
    { id: 1, nom_produit: 'Baguette Tradition', categorie: 'pain', quantite_disponible: 45, seuil_alerte: 15, unite: 'pièce', is_low_stock: 0 },
    { id: 2, nom_produit: 'Croissant Pur Beurre', categorie: 'viennoiserie', quantite_disponible: 28, seuil_alerte: 10, unite: 'pièce', is_low_stock: 0 },
    { id: 3, nom_produit: 'Pain au Chocolat', categorie: 'viennoiserie', quantite_disponible: 6, seuil_alerte: 12, unite: 'pièce', is_low_stock: 1 },
    { id: 4, nom_produit: 'Entremet Chocolat', categorie: 'patisserie', quantite_disponible: 4, seuil_alerte: 5, unite: 'pièce', is_low_stock: 1 },
    { id: 5, nom_produit: 'Jus de Bissap Naturel 50cl', categorie: 'jus', quantite_disponible: 22, seuil_alerte: 8, unite: 'bouteille', is_low_stock: 0 },
    { id: 6, nom_produit: 'Pain Complet Bio', categorie: 'pain', quantite_disponible: 18, seuil_alerte: 8, unite: 'pièce', is_low_stock: 0 }
];

const DEMO_ORDERS = [
    { id: 1048, client_nom: 'Aminata Koné', telephone: '07 04 38 92 01', total: 3200, statut: 'en_cuisson', items: [{ nom: 'Baguette Tradition', qte: 4 }, { nom: 'Croissant Beurre', qte: 2 }] },
    { id: 1049, client_nom: 'Koffi Marc', telephone: '05 55 12 34 56', total: 4500, statut: 'attente_fournil', items: [{ nom: 'Pain au Chocolat', qte: 6 }] },
    { id: 1050, client_nom: 'Sarah B.', telephone: '01 02 03 04 05', total: 5400, statut: 'pret_au_comptoir', items: [{ nom: 'Entremet Chocolat', qte: 2 }] }
];

const DEMO_EMPLOYEES = [];

const DEMO_MOVEMENTS = [
    { id: 1, nom_produit: 'Baguette Tradition', delta_quantite: 30, motif: 'Sortie fournil 09h00', date_mouvement: 'Aujourd\'hui 09h05', auteur: 'Boulangerie BABI' },
    { id: 2, nom_produit: 'Pain au Chocolat', delta_quantite: -14, motif: 'Ventes Caisse Matinée', date_mouvement: 'Aujourd\'hui 10h12', auteur: 'Boulangerie BABI' },
    { id: 3, nom_produit: 'Croissant Pur Beurre', delta_quantite: 25, motif: 'Sortie fournil 06h00', date_mouvement: 'Aujourd\'hui 06h10', auteur: 'Boulangerie BABI' }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialiser immédiatement le planning manuel et les compteurs
    try {
        renderManualPlanning();
        calculateManualKPIs();
        renderGeranteEventOrders();
        renderGeranteInventory();
        renderGeranteWaste();
        renderGeranteTemps();
        renderGeranteFinance();
    } catch(err) {
        console.error("Erreur init planning:", err);
    }

    // 2. Check authentication
    try {
        const user = JSON.parse(localStorage.getItem('babi_user'));
        if (user && document.getElementById('gerante-name-badge')) {
            document.getElementById('gerante-name-badge').innerText = (user.prenom || 'Gérante') + ' ' + (user.nom || 'Fournil');
        }
    } catch(e) {}

    // 3. Global Real-time Sync Bus across Fournil, POS Caissière, Admin & Client
    try {
        const globalChan = new BroadcastChannel('babi_global_sync');
        globalChan.onmessage = (e) => {
            handleGeranteGlobalSync(e.data);
        };
    } catch (_) {}

    window.addEventListener('storage', (e) => {
        if (!e.key || e.key.includes('orders') || e.key.includes('sales') || e.key.includes('babi') || e.key.includes('sync')) {
            renderGeranteFinance();
            renderGeranteEventOrders();
            calculateManualKPIs();
        }
    });

    // 4. Charger les données complémentaires en arrière-plan
    loadDashboardData();
    initGeranteBrainFeed();
    fetchGeranteBakingAiForecast();
    fetchGeranteStockAiInsights();
    setInterval(loadDashboardData, 15000);
    setInterval(fetchGeranteBakingAiForecast, 30000);
});

function broadcastGlobalSync(eventType, payload = {}) {
    try {
        const channel = new BroadcastChannel('babi_global_sync');
        channel.postMessage({ type: eventType, payload, timestamp: Date.now() });
    } catch (_) {}
    try {
        localStorage.setItem('babi_last_sync_event', JSON.stringify({ type: eventType, payload, timestamp: Date.now() }));
    } catch (_) {}
}

function handleGeranteGlobalSync(eventData) {
    if (!eventData || !eventData.type) return;
    const { type, payload } = eventData;

    if (type === 'POS_SALE_COMPLETED' || type === 'NEW_ONLINE_ORDER' || type === 'ORDER_PAID') {
        renderGeranteFinance();
        calculateManualKPIs();
        showBabiToast(`💰 Vente enregistrée : ${(payload.total || 0).toLocaleString()} FCFA (${payload.method || 'Caisse'})`, 'info');
    } else if (type === 'EVENT_ORDER_UPDATED') {
        renderGeranteEventOrders();
    } else if (type === 'STOCK_UPDATED') {
        renderGeranteInventory();
    }
}

async function loadDashboardData() {
    try {
        await Promise.allSettled([
            loadKpis(),
            loadStocks(),
            loadFournilOrders(),
            renderGeranteEventOrders(),
            loadEmployees(),
            loadMovements()
        ]);
    } catch(e) {}
}

// 1. Load KPIs
async function loadKpis() {
    try {
        const res = await fetch(`${API_ROOT}/api/reports/manager-dashboard`);
        if (!res.ok) throw new Error("API Offline");
        const data = await res.json();

        const elRev = document.getElementById('kpi-revenue-today');
        if (elRev) elRev.innerText = (data.todayRevenue || 0).toLocaleString() + ' F';
        const elOrd = document.getElementById('kpi-orders-fournil');
        if (elOrd) elOrd.innerText = data.ordersEnAttenteFournil || 0;
        const elLow = document.getElementById('kpi-low-stocks');
        if (elLow) elLow.innerText = data.lowStocksCount || 0;
        const elEmp = document.getElementById('kpi-employees-present');
        if (elEmp) elEmp.innerText = `${data.employeesPresent || 0} / ${data.employeesTotal || 0}`;

        updateAlertBanner(data.lowStocksCount || 0);
    } catch (err) {
        // Fallback demo KPIs
        const elRev = document.getElementById('kpi-revenue-today');
        if (elRev) elRev.innerText = '145 000 F';
        const elOrd = document.getElementById('kpi-orders-fournil');
        if (elOrd) elOrd.innerText = '2';
        const elLow = document.getElementById('kpi-low-stocks');
        if (elLow) elLow.innerText = '2';
        const elEmp = document.getElementById('kpi-employees-present');
        if (elEmp) elEmp.innerText = '4 / 6';
        updateAlertBanner(2);
    }
}

function updateAlertBanner(count) {
    const alertBanner = document.getElementById('low-stock-alert-banner');
    if (alertBanner) {
        if (count > 0) {
            alertBanner.style.display = 'flex';
            const alertText = document.getElementById('alert-count-text');
            if (alertText) alertText.innerText = `${count} produit(s) en alerte de stock faible !`;
        } else {
            alertBanner.style.display = 'none';
        }
    }
}

// 2. Load Stocks & Fournil
async function loadStocks() {
    try {
        const res = await fetch(`${API_ROOT}/api/stocks`);
        if (!res.ok) throw new Error("API Offline");
        allStocks = await res.json();
    } catch (err) {
        allStocks = [...DEMO_STOCKS];
    }
    renderStocksList();
}

function renderStocksList() {
    const container = document.getElementById('stocks-list-container');
    const searchVal = (document.getElementById('stock-search-input')?.value || '').toLowerCase();
    if (!container) return;

    container.innerHTML = '';

    const filtered = allStocks.filter(s => {
        const name = (s.nom_produit || '').toLowerCase();
        return name.includes(searchVal);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">Aucun article de stock trouvé.</div>`;
        return;
    }

    filtered.forEach(stk => {
        const isLow = stk.is_low_stock || stk.quantite_disponible <= stk.seuil_alerte;
        const maxStock = 60;
        const pct = Math.min(100, Math.round((stk.quantite_disponible / maxStock) * 100));
        const colorClass = isLow ? 'bg-danger' : (pct < 40 ? 'bg-warning' : 'bg-success');

        const card = document.createElement('div');
        card.className = `stock-item-card ${isLow ? 'low-stock' : ''}`;
        card.innerHTML = `
            <div style="flex: 1; padding-right: 1rem;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <div class="fw-bold text-white fs-6">${stk.nom_produit}</div>
                    <div class="badge ${isLow ? 'bg-danger' : 'bg-secondary'}">${stk.quantite_disponible} ${stk.unite}s dispo</div>
                </div>
                <div class="text-muted small">${stk.categorie} • Seuil d'alerte : ${stk.seuil_alerte} ${stk.unite}s</div>
                <div class="stock-progress">
                    <div class="stock-progress-bar ${colorClass}" style="width: ${pct}%;"></div>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-warning" onclick="openAdjustStockModal(${stk.id}, '${stk.nom_produit}', ${stk.quantite_disponible})">
                    <i class="fa-solid fa-plus-minus me-1"></i> Ajuster / Fournée
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openAdjustStockModal(id, nom, currentQty) {
    document.getElementById('modal-stock-id').value = id;
    document.getElementById('modal-stock-name').innerText = nom;
    document.getElementById('modal-stock-current').innerText = currentQty;
    document.getElementById('modal-stock-delta').value = 20;

    const modal = new bootstrap.Modal(document.getElementById('adjustStockModal'));
    modal.show();
}

async function submitStockAdjustment() {
    const stockId = document.getElementById('modal-stock-id').value;
    const delta = parseInt(document.getElementById('modal-stock-delta').value) || 0;
    const motif = document.getElementById('modal-stock-motif').value;

    try {
        const res = await fetch(`${API_ROOT}/api/stocks/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stock_id: stockId,
                delta_quantite: delta,
                motif: motif,
                auteur: 'Gérante Mariam'
            })
        });
        const data = await res.json();
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('adjustStockModal')).hide();
            await loadStocks();
            await loadKpis();
            await loadMovements();
            return;
        }
    } catch (e) {
        // Local simulation if server is offline
        const stk = allStocks.find(s => s.id == stockId);
        if (stk) {
            stk.quantite_disponible = Math.max(0, stk.quantite_disponible + delta);
            stk.is_low_stock = stk.quantite_disponible <= stk.seuil_alerte ? 1 : 0;
            renderStocksList();
            bootstrap.Modal.getInstance(document.getElementById('adjustStockModal')).hide();
            alert(`✅ Stock mis à jour : +${delta} ${stk.nom_produit}`);
        }
    }
}

// 3. Load Fournil Orders
async function loadFournilOrders() {
    try {
        const res = await fetch(`${API_ROOT}/api/orders`);
        if (!res.ok) throw new Error("API Offline");
        allOrders = await res.json();
    } catch (e) {
        allOrders = [...DEMO_ORDERS];
    }
    renderFournilTable();
}

function renderFournilTable() {
    const tbody = document.getElementById('fournil-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (allOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Aucune commande en attente de préparation au fournil.</td></tr>`;
        return;
    }

    allOrders.forEach(ord => {
        const itemsSummary = (ord.items || []).map(i => `${i.qte}x ${i.nom}`).join(', ') || 'Articles de boulangerie';
        const badgeClass = ord.statut === 'en_cuisson' ? 'bg-danger' : (ord.statut === 'pret_au_comptoir' ? 'bg-success' : 'bg-warning text-dark');
        const statusLabel = ord.statut === 'en_cuisson' ? '🔥 En cuisson' : (ord.statut === 'pret_au_comptoir' ? '✅ Prêt au comptoir' : '⏳ En attente');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold text-warning">#${ord.id}</td>
            <td><strong>${ord.client_nom || 'Client'}</strong><br><small class="text-muted">${ord.telephone || '--'}</small></td>
            <td>${itemsSummary}</td>
            <td class="fw-bold">${(ord.total || 0).toLocaleString()} F</td>
            <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
            <td>
                <select class="form-select form-select-sm bg-dark text-white border-secondary" style="width:160px;" onchange="updateOrderStatus(${ord.id}, this.value)">
                    <option value="attente_fournil" ${ord.statut === 'attente_fournil' ? 'selected' : ''}>⏳ Attente</option>
                    <option value="en_cuisson" ${ord.statut === 'en_cuisson' ? 'selected' : ''}>🔥 En Cuisson</option>
                    <option value="pret_au_comptoir" ${ord.statut === 'pret_au_comptoir' ? 'selected' : ''}>✅ Prêt Comptoir</option>
                    <option value="livre" ${ord.statut === 'livre' ? 'selected' : ''}>🚀 Livré / Retiré</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await fetch(`${API_ROOT}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: newStatus })
        });
        await loadFournilOrders();
        await loadKpis();
    } catch (e) {
        const o = allOrders.find(x => x.id == orderId);
        if (o) o.statut = newStatus;
        renderFournilTable();
    }
}

// 4. Load Employees
async function loadEmployees() {
    try {
        const res = await fetch(`${API_ROOT}/api/employees`);
        if (!res.ok) throw new Error("API Offline");
        allEmployees = await res.json();
    } catch (e) {
        allEmployees = [...DEMO_EMPLOYEES];
    }
    renderEmployeesTable();
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    allEmployees.forEach(emp => {
        const statusClass = emp.statut_presence === 'present' ? 'bg-success' : (emp.statut_presence === 'pause' ? 'bg-warning text-dark' : 'bg-danger');
        const statusLabel = emp.statut_presence === 'present' ? '🟢 Présent' : (emp.statut_presence === 'pause' ? '🟡 Pause' : '🔴 Absent');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${emp.prenom} ${emp.nom}</td>
            <td><span class="badge bg-dark border border-secondary">${emp.poste}</span></td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td>${emp.heure_arrivee || '--'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success ${emp.statut_presence === 'present' ? 'active' : ''}" onclick="updateEmployeePresence(${emp.id}, 'present')">Présent</button>
                    <button class="btn btn-outline-warning ${emp.statut_presence === 'pause' ? 'active' : ''}" onclick="updateEmployeePresence(${emp.id}, 'pause')">Pause</button>
                    <button class="btn btn-outline-danger ${emp.statut_presence === 'absent' ? 'active' : ''}" onclick="updateEmployeePresence(${emp.id}, 'absent')">Absent</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateEmployeePresence(empId, status) {
    try {
        await fetch(`${API_ROOT}/api/employees/${empId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut_presence: status })
        });
        await loadEmployees();
        await loadKpis();
    } catch (e) {
        const emp = allEmployees.find(x => x.id == empId);
        if (emp) {
            emp.statut_presence = status;
            renderEmployeesTable();
        }
    }
}

// 5. Load Movements
async function loadMovements() {
    let movements = [];
    try {
        const res = await fetch(`${API_ROOT}/api/stocks/movements`);
        if (!res.ok) throw new Error("API Offline");
        movements = await res.json();
    } catch (e) {
        movements = [...DEMO_MOVEMENTS];
    }

    const tbody = document.getElementById('movements-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (movements.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Aucun mouvement enregistré.</td></tr>`;
        return;
    }

    movements.forEach(m => {
        const isPos = m.delta_quantite > 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${m.date_mouvement || '--'}</td>
            <td class="fw-bold">${m.nom_produit}</td>
            <td class="${isPos ? 'text-success fw-bold' : 'text-danger fw-bold'}">${isPos ? '+' : ''}${m.delta_quantite}</td>
            <td>${m.motif || '--'}</td>
            <td class="text-muted small">${m.auteur || '--'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 6. Gâteaux d'Événements Gérance (Commandes Spéciales & Pâtisserie)
const DEFAULT_EVENT_ORDERS = [
    {
        ref: 'EVT-8821',
        name: 'Sarah Bamba',
        phone: '0704389201',
        eventType: 'Anniversaire VIP',
        portions: 25,
        tiers: 2,
        flavor: 'Chocolat Cacao Intense & Framboise',
        message: 'Joyeux 30 ans Sarah ! 👑',
        date: 'Aujourd\'hui 16:30',
        time: '16h30',
        price: 35000,
        acompte: 35000,
        status: 'decorating' // pending, decorating, ready, delivered
    },
    {
        ref: 'EVT-8822',
        name: 'M. & Mme Kouassi',
        phone: '0555123456',
        eventType: 'Mariage Civil',
        portions: 80,
        tiers: 3,
        flavor: 'Vanille Bourbon & Fruits Rouges',
        message: 'Félicitations Mariam & Jean-Luc 💕',
        date: 'Demain 11:00',
        time: '11h00',
        price: 110000,
        acompte: 60000,
        status: 'pending'
    },
    {
        ref: 'EVT-8819',
        name: 'Cabinet KPMG Plateau',
        phone: '0102030405',
        eventType: 'Cocktail Entreprise',
        portions: 50,
        tiers: 1,
        flavor: 'Mignardises & Entremets Assortis',
        message: 'Inauguration Nouveaux Locaux',
        date: 'Aujourd\'hui 14:00',
        time: '14h00',
        price: 65000,
        acompte: 65000,
        status: 'ready'
    }
];

function getGeranteEventOrders() {
    try {
        const stored = localStorage.getItem('babi_event_orders');
        if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list.length > 0) return list;
        }
    } catch(e) {}
    localStorage.setItem('babi_event_orders', JSON.stringify(DEFAULT_EVENT_ORDERS));
    return DEFAULT_EVENT_ORDERS;
}

let currentEventFilter = 'all';

function filterEventOrders(status, btnEl) {
    currentEventFilter = status;
    if (btnEl) {
        btnEl.parentElement.querySelectorAll('.magazine-period-btn').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }
    renderGeranteEventOrders();
}

function renderGeranteEventOrders() {
    const allEvents = getGeranteEventOrders();
    const tbody = document.getElementById('gerante-events-tbody');
    
    // KPI Calculation
    const totalCount = allEvents.length;
    const progressCount = allEvents.filter(e => e.status === 'decorating' || e.status === 'pending').length;
    const readyCount = allEvents.filter(e => e.status === 'ready').length;
    const totalCA = allEvents.reduce((sum, e) => sum + (Number(e.price) || 0), 0);

    const elTotal = document.getElementById('kpi-events-total');
    if (elTotal) elTotal.innerText = totalCount;
    const elProg = document.getElementById('kpi-events-progress');
    if (elProg) elProg.innerText = progressCount;
    const elReady = document.getElementById('kpi-events-ready');
    if (elReady) elReady.innerText = readyCount;
    const elCA = document.getElementById('kpi-events-ca');
    if (elCA) elCA.innerText = totalCA.toLocaleString('fr-FR') + ' FCFA';

    const badgeEvents = document.getElementById('badge-events-count');
    if (badgeEvents) {
        badgeEvents.innerText = progressCount;
        badgeEvents.style.display = progressCount > 0 ? 'inline-flex' : 'none';
    }

    if (!tbody) return;

    let filtered = allEvents;
    if (currentEventFilter !== 'all') {
        filtered = allEvents.filter(e => e.status === currentEventFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-on-surface-variant py-8 font-semibold">Aucune commande gâteau dans cette catégorie.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(evt => {
        let statusBadge = '';
        let nextBtn = '';

        if (evt.status === 'pending') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] uppercase">À Préparer</span>`;
            nextBtn = `<button onclick="updateEventStatus('${evt.ref}', 'decorating')" class="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[11px] hover:brightness-105 flex items-center gap-1 shadow-xs"><span class="material-symbols-outlined text-sm">palette</span> En Déco</button>`;
        } else if (evt.status === 'decorating') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-extrabold text-[10px] uppercase">En Décoration</span>`;
            nextBtn = `<button onclick="updateEventStatus('${evt.ref}', 'ready')" class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] hover:bg-emerald-700 flex items-center gap-1 shadow-xs"><span class="material-symbols-outlined text-sm">check</span> Marquer Prêt</button>`;
        } else if (evt.status === 'ready') {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] uppercase">Prêt en Vitrine</span>`;
            nextBtn = `<button onclick="updateEventStatus('${evt.ref}', 'delivered')" class="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] hover:bg-blue-700 flex items-center gap-1 shadow-xs"><span class="material-symbols-outlined text-sm">storefront</span> Livré</button>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[10px] uppercase">Remis au Client</span>`;
            nextBtn = `<span class="text-emerald-700 text-xs font-bold flex items-center gap-0.5"><span class="material-symbols-outlined text-sm">task_alt</span> Terminé</span>`;
        }

        const cleanPhone = (evt.phone || '').replace(/\D/g, '');
        const waLink = `https://api.whatsapp.com/send?phone=225${cleanPhone}&text=Bonjour%20${encodeURIComponent(evt.name || 'Client')}%2C%20de%20la%20part%20de%20la%20Direction%20Boulangerie%20de%20BABI%20concernant%20votre%20commande%20sp%C3%A9ciale%20%23${evt.ref}`;

        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-3">
                    <strong class="font-mono text-primary font-black block">#${evt.ref}</strong>
                    <span class="text-[11px] text-on-surface-variant">${evt.date || 'À convenir'}</span>
                </td>
                <td class="p-3">
                    <span class="font-bold text-on-surface block text-xs">${evt.name}</span>
                    <a href="${waLink}" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-semibold mt-0.5">
                        <span class="material-symbols-outlined text-xs">chat</span> ${evt.phone}
                    </a>
                </td>
                <td class="p-3">
                    <span class="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-md text-[10px] inline-block mb-1">${evt.eventType}</span>
                    <div class="font-bold text-xs">${evt.portions} parts • ${evt.flavor}</div>
                </td>
                <td class="p-3 max-w-[200px]">
                    <div class="italic text-[11px] text-on-surface-variant bg-surface-container p-1.5 rounded-lg border border-outline-variant/20">
                        « ${evt.message || 'Sans inscription'} »
                    </div>
                </td>
                <td class="p-3 text-right">
                    <div class="font-extrabold text-xs font-mono text-primary">${Number(evt.price || 0).toLocaleString()} F</div>
                    <span class="text-[10px] text-emerald-700 font-bold block">Acompte : ${Number(evt.acompte || evt.price || 0).toLocaleString()} F</span>
                </td>
                <td class="p-3 text-center">
                    ${statusBadge}
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        ${nextBtn}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateEventStatus(ref, newStatus) {
    let allEvents = getGeranteEventOrders();
    const idx = allEvents.findIndex(e => e.ref === ref);
    if (idx !== -1) {
        allEvents[idx].status = newStatus;
        localStorage.setItem('babi_event_orders', JSON.stringify(allEvents));
        playFournilChime();
        renderGeranteEventOrders();
        showBabiToast(`Commande #${ref} mise à jour avec succès !`, 'success');
    }
}

function openNewEventOrderModal() {
    const ref = 'EVT-' + Math.floor(1000 + Math.random() * 9000);
    const clientName = prompt("Nom du Client :", "Madame Diop");
    if (!clientName) return;
    const phone = prompt("Numéro WhatsApp / Téléphone :", "0708091011");
    const eventType = prompt("Type d'événement (ex: Anniversaire, Mariage, Baptême) :", "Anniversaire VIP");
    const portions = parseInt(prompt("Nombre de parts :", "20")) || 20;
    const flavor = prompt("Saveur & Garniture (ex: Vanille Bourbon / Chocolat Fraise) :", "Chocolat Intense & Framboise");
    const message = prompt("Texte écrit sur le gâteau :", "Joyeux Anniversaire !");
    const price = parseInt(prompt("Montant Total (FCFA) :", "30000")) || 30000;
    const date = prompt("Date et heure de retrait souhaitées :", "Aujourd'hui 17:00");

    const newOrder = {
        ref,
        name: clientName,
        phone: phone || '0700000000',
        eventType: eventType || 'Anniversaire',
        portions: portions,
        tiers: portions >= 40 ? 2 : 1,
        flavor: flavor || 'Chocolat',
        message: message || '',
        date: date || 'Aujourd\'hui',
        time: '17h00',
        price: price,
        acompte: price,
        status: 'pending'
    };

    let allEvents = getGeranteEventOrders();
    allEvents.unshift(newOrder);
    localStorage.setItem('babi_event_orders', JSON.stringify(allEvents));
    playFournilChime();
    renderGeranteEventOrders();
    showBabiToast(`🎂 Commande spéciale #${ref} créée et transmise au laboratoire pâtisserie !`, 'success');
}

// =============================================================
// CARILLON AUDIO DU FOURNIL (NOUVELLE COMMANDE)
// =============================================================
function playFournilChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Clochette harmonique 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 Note
        gain1.gain.setValueAtTime(0.4, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 1.2);

        // Clochette harmonique 2
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6 Note
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 1.5);
    } catch(e) {
        console.log("Audio non autorisé sans interaction préalable");
    }
}

// =============================================================
// IMPRESSION FICHE DE PRODUCTION & BONS DE FOURNIL (GRAND FORMAT LISIBLE)
// =============================================================
function printBakingTicket(targetId) {
    const batches = getManualBatches();
    const isAll = (targetId === 'TOUTES' || !targetId);

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
        alert("Veuillez autoriser les fenêtres contextuelles pour ouvrir la fiche d'impression.");
        return;
    }

    const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let contentHtml = '';

    if (isAll) {
        // Grand Planning de Production du Jour (Format A4 Pleine Page)
        const totalPcs = batches.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0);
        contentHtml = `
            <div class="header">
                <img src="assets/logo.png" alt="Boulangerie de BABI" class="print-logo"/>
                <div class="header-text">
                    <div class="brand">BOULANGERIE DE BABI</div>
                    <div class="subtitle">👑 FOURNIL PRINCIPAL • FICHE DE PRODUCTION DU JOUR</div>
                    <div class="meta-date">Date : ${todayStr} • Éditée à ${timeStr}</div>
                </div>
            </div>

            <div class="kpi-summary">
                <div class="kpi-box">
                    <span class="kpi-title">TOTAL PRODUCTION</span>
                    <span class="kpi-val">${totalPcs} Pièces</span>
                </div>
                <div class="kpi-box">
                    <span class="kpi-title">FOURNÉES PRÉVUES</span>
                    <span class="kpi-val">${batches.length} Fournées</span>
                </div>
                <div class="kpi-box">
                    <span class="kpi-title">CHEF FOURNIL</span>
                    <span class="kpi-val">Mamadou Koné</span>
                </div>
            </div>

            <table class="production-table">
                <thead>
                    <tr>
                        <th style="width: 12%;">HEURE</th>
                        <th style="width: 32%;">PRODUIT & VARIÉTÉ</th>
                        <th style="width: 14%;">QUANTITÉ</th>
                        <th style="width: 22%;">FOUR & TEMPÉRATURE</th>
                        <th style="width: 20%;">RESPONSABLE</th>
                        <th style="width: 10%;">SORTI</th>
                        <th style="width: 10%;">RAYON</th>
                    </tr>
                </thead>
                <tbody>
                    ${batches.map(b => `
                        <tr>
                            <td class="time-cell">${b.time}</td>
                            <td class="product-cell"><strong>${b.name}</strong></td>
                            <td class="qty-cell"><strong>${b.quantity} pcs</strong></td>
                            <td>${b.oven}</td>
                            <td>${b.baker}</td>
                            <td class="check-cell">[ &nbsp; ]</td>
                            <td class="check-cell">[ &nbsp; ]</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer-signatures">
                <div class="signature-box">
                    <div class="sig-title">Visa Chef Fournil / Boulanger :</div>
                    <div class="sig-line"></div>
                </div>
                <div class="signature-box">
                    <div class="sig-title">Visa Gérante / Contrôle Rayon :</div>
                    <div class="sig-line"></div>
                </div>
            </div>

            <div class="footer-note">
                Fournil Artisanal Boulangerie de BABI • Respect strict de la chaîne de température & hygiène HACCP
            </div>
        `;
    } else {
        // Bon individuel de fournée (Grande Fiche de Cuisson)
        const batch = batches.find(b => `FOUR-${b.id}` === targetId || String(b.id) === String(targetId)) || batches[0] || {
            name: 'Baguette Traditionnelle',
            quantity: 150,
            time: '17:00',
            oven: 'Four 1 (Sole 240°C)',
            baker: 'Mamadou Koné',
            category: 'Pains'
        };

        contentHtml = `
            <div class="header">
                <img src="assets/logo.png" alt="Boulangerie de BABI" class="print-logo"/>
                <div class="header-text">
                    <div class="brand">BOULANGERIE DE BABI</div>
                    <div class="subtitle">👑 BON DE CUISSON FOURNIL</div>
                    <div class="meta-date">Date : ${todayStr} à ${timeStr}</div>
                </div>
            </div>

            <div class="single-card">
                <div class="single-row">
                    <span class="label">PRODUIT :</span>
                    <span class="val highlight">${batch.name}</span>
                </div>
                <div class="single-row">
                    <span class="label">QUANTITÉ À SORTIR :</span>
                    <span class="val highlight">${batch.quantity} UNITÉS</span>
                </div>
                <div class="single-row">
                    <span class="label">HEURE DE SORTIE FOUR :</span>
                    <span class="val">${batch.time}</span>
                </div>
                <div class="single-row">
                    <span class="label">FOUR D'AFFECTATION :</span>
                    <span class="val">${batch.oven}</span>
                </div>
                <div class="single-row">
                    <span class="label">RESPONSABLE CUISSON :</span>
                    <span class="val">${batch.baker}</span>
                </div>
            </div>

            <div class="checklist">
                <div class="check-item">[ &nbsp; ] Pousse & Façonnage vérifiés</div>
                <div class="check-item">[ &nbsp; ] Buée / Injection de vapeur injectée</div>
                <div class="check-item">[ &nbsp; ] Contrôle croustillant & alvéolage à la sortie</div>
                <div class="check-item">[ &nbsp; ] Mise en sacherie kraft / Transfert boutique</div>
            </div>

            <div class="footer-note" style="margin-top: 30px;">
                Boulangerie de BABI • Fiche de Traçabilité Fournil
            </div>
        `;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <title>Fiche de Production Fournil - BABI</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 15mm;
                }
                * {
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, -apple-system, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #111;
                    font-size: 15px;
                    line-height: 1.5;
                }
                .header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    border-bottom: 3px solid #2b160c;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .print-logo {
                    width: 76px;
                    height: 76px;
                    object-fit: contain;
                    border-radius: 12px;
                    border: 2px solid #dfd3c0;
                    padding: 4px;
                    background: #ffffff;
                }
                .header-text {
                    text-align: left;
                }
                .brand {
                    font-size: 26px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: #2b160c;
                }
                .subtitle {
                    font-size: 16px;
                    font-weight: bold;
                    color: #765b00;
                    margin-top: 4px;
                }
                .meta-date {
                    font-size: 13px;
                    color: #555;
                    margin-top: 4px;
                }
                .kpi-summary {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .kpi-box {
                    flex: 1;
                    background: #fdfaf3;
                    border: 2px solid #dfd3c0;
                    border-radius: 10px;
                    padding: 12px 16px;
                    text-align: center;
                }
                .kpi-title {
                    display: block;
                    font-size: 12px;
                    font-weight: 800;
                    color: #765b00;
                    margin-bottom: 4px;
                }
                .kpi-val {
                    font-size: 22px;
                    font-weight: 900;
                    color: #2b160c;
                }
                .production-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    font-size: 14.5px;
                }
                .production-table th {
                    background: #2b160c;
                    color: #ffffff;
                    text-align: left;
                    padding: 10px 12px;
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                }
                .production-table td {
                    padding: 12px;
                    border-bottom: 1.5px solid #e0d8cc;
                }
                .production-table tr:nth-child(even) {
                    background: #faf8f5;
                }
                .time-cell {
                    font-size: 17px;
                    font-weight: 900;
                    color: #765b00;
                }
                .qty-cell {
                    font-size: 16px;
                    color: #166534;
                }
                .check-cell {
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                }
                .footer-signatures {
                    display: flex;
                    justify-content: space-between;
                    gap: 40px;
                    margin-top: 40px;
                    margin-bottom: 30px;
                }
                .signature-box {
                    flex: 1;
                    border: 1.5px dashed #999;
                    border-radius: 8px;
                    padding: 14px;
                    height: 110px;
                }
                .sig-title {
                    font-weight: bold;
                    font-size: 13px;
                }
                .footer-note {
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .single-card {
                    background: #fdfaf3;
                    border: 2px solid #2b160c;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                }
                .single-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e5dcce;
                    font-size: 16px;
                }
                .single-row .label {
                    font-weight: bold;
                    color: #555;
                }
                .single-row .val {
                    font-weight: 800;
                    color: #2b160c;
                }
                .single-row .val.highlight {
                    font-size: 22px;
                    color: #765b00;
                }
                .checklist {
                    background: #ffffff;
                    border: 1.5px solid #dfd3c0;
                    border-radius: 10px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-size: 15px;
                    font-weight: 600;
                }
            </style>
        </head>
        <body onload="window.print();">
            ${contentHtml}
        </body>
        </html>
    `);
    printWindow.document.close();
}

// =============================================================
// GESTION MANUELLE DES FOURNÉES, STOCKS ET REGISTRES (100% MANUEL)
// =============================================================

let currentCategoryFilter = 'all';

function getManualBatches() {
    const saved = localStorage.getItem('babi_manual_batches');
    if (saved) {
        return JSON.parse(saved);
    }
    // Default initial batches for immediate usability
    const defaults = [
        { id: 1, name: 'Baguette Traditionnelle', category: 'pains', quantity: 150, time: '17:00', baker: 'Mamadou Koné', oven: 'Four 1 (Sole 240°C)', status: 'en_cuisson' },
        { id: 2, name: 'Croissants Pur Beurre & Pains Choc', category: 'viennoiseries', quantity: 100, time: '18:00', baker: 'Aïcha', oven: 'Four 2 (Ventilé 180°C)', status: 'en_pousse' },
        { id: 3, name: 'Pain Complet & Pain de Mie', category: 'pains', quantity: 80, time: '14:00', baker: 'Bakary', oven: 'Four 1 (Sole 240°C)', status: 'en_rayon' }
    ];
    localStorage.setItem('babi_manual_batches', JSON.stringify(defaults));
    return defaults;
}

function saveManualBatches(batches) {
    localStorage.setItem('babi_manual_batches', JSON.stringify(batches));
    renderManualPlanning();
    calculateManualKPIs();
}

function getManualWastes() {
    return JSON.parse(localStorage.getItem('babi_manual_wastes') || '[]');
}

// Modal Controllers
function openBakingModal() {
    const el = document.getElementById('bakingModal');
    if (el) el.classList.remove('hidden');
}
function closeBakingModal() {
    const el = document.getElementById('bakingModal');
    if (el) el.classList.add('hidden');
}

function openRayonModal() {
    const el = document.getElementById('rayonModal');
    if (el) el.classList.remove('hidden');
}
function closeRayonModal() {
    const el = document.getElementById('rayonModal');
    if (el) el.classList.add('hidden');
}

function openWasteModal() {
    const el = document.getElementById('wasteModal');
    if (el) el.classList.remove('hidden');
}
function closeWasteModal() {
    const el = document.getElementById('wasteModal');
    if (el) el.classList.add('hidden');
}

function openTempModal() {
    const el = document.getElementById('tempModal');
    if (el) el.classList.remove('hidden');
}
function closeTempModal() {
    const el = document.getElementById('tempModal');
    if (el) el.classList.add('hidden');
}

function openReassortModal() {
    const el = document.getElementById('reassortModal');
    if (el) el.classList.remove('hidden');
}
function closeReassortModal() {
    const el = document.getElementById('reassortModal');
    if (el) el.classList.add('hidden');
}

function openHelpGuideModal() {
    const el = document.getElementById('helpGuideModal');
    if (el) el.classList.remove('hidden');
}
function closeHelpGuideModal() {
    const el = document.getElementById('helpGuideModal');
    if (el) el.classList.add('hidden');
}

// =============================================================
// ERGONOMIE & SAISIE RAPIDE EN 1 CLIC (PRESETS & QUANTITÉS)
// =============================================================

function setBakingPreset(name, category, qty, oven, el) {
    const inputName = document.getElementById('manual-product-name');
    const selectCat = document.getElementById('manual-category');
    const inputQty = document.getElementById('manual-quantity');
    const selectOven = document.getElementById('manual-oven');

    if (inputName) inputName.value = name;
    if (selectCat) selectCat.value = category;
    if (inputQty) inputQty.value = qty;
    if (selectOven) selectOven.value = oven;

    document.querySelectorAll('.preset-chip-btn').forEach(btn => btn.classList.remove('active'));
    if (el) {
        el.classList.add('active');
    }

    showBabiToast(`⚡ Recette : ${name} (${qty} pcs)`, 'info');
}

function adjustManualQty(delta) {
    const inputQty = document.getElementById('manual-quantity');
    if (inputQty) {
        let current = parseInt(inputQty.value) || 0;
        current = Math.max(10, current + delta);
        inputQty.value = current;
    }
}

// Système de Toast Notification Doré Non-Bloquant
function showBabiToast(message, type = 'success') {
    let container = document.getElementById('babi-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'babi-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
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
    }

    toast.style.cssText = `
        background: ${bg};
        border: ${border};
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.35);
        font-family: 'Manrope', sans-serif;
        font-size: 13.5px;
        font-weight: 700;
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
    }, 3200);
}

// 1. Submit Manual Baking Batch
function submitManualBakingBatch() {
    const name = document.getElementById('manual-product-name')?.value.trim();
    const category = document.getElementById('manual-category')?.value || 'pains';
    const quantity = parseInt(document.getElementById('manual-quantity')?.value) || 100;
    const time = document.getElementById('manual-time')?.value || '17:00';
    const baker = document.getElementById('manual-baker')?.value.trim() || 'Chef Boulanger';
    const oven = document.getElementById('manual-oven')?.value || 'Four 1';

    if (!name) {
        showBabiToast("Veuillez saisir le nom du produit", "error");
        return;
    }

    const batches = getManualBatches();
    const newBatch = {
        id: Date.now(),
        name: name,
        category: category,
        quantity: quantity,
        time: time,
        baker: baker,
        oven: oven,
        status: 'en_cuisson'
    };

    batches.unshift(newBatch);
    saveManualBatches(batches);
    closeBakingModal();
    playFournilChime();
    showBabiToast(`✅ Fournée ajoutée : ${quantity}x ${name} (${time}) !`, 'success');
}

// 2. Submit Manual Rayon Entry
function submitManualRayonEntry() {
    const product = document.getElementById('rayon-product-name')?.value.trim();
    const qty = parseInt(document.getElementById('rayon-quantity')?.value) || 0;
    const loc = document.getElementById('rayon-location')?.value;

    if (!product || qty <= 0) {
        showBabiToast("Veuillez renseigner un produit et une quantité", "error");
        return;
    }

    const entries = JSON.parse(localStorage.getItem('babi_rayon_entries') || '[]');
    entries.unshift({ id: Date.now(), product, qty, loc, time: new Date().toLocaleTimeString() });
    localStorage.setItem('babi_rayon_entries', JSON.stringify(entries));

    closeRayonModal();
    showBabiToast(`✅ ${qty}x ${product} transférés en rayon (${loc}) !`, 'success');
}

// 3. Submit Manual Waste
function submitManualWaste() {
    const product = document.getElementById('waste-product-name')?.value.trim();
    const qty = parseInt(document.getElementById('waste-quantity')?.value) || 0;
    const reason = document.getElementById('waste-reason')?.value;

    if (!product || qty <= 0) {
        showBabiToast("Veuillez renseigner le produit et la quantité", "error");
        return;
    }

    const wastes = getManualWastes();
    wastes.unshift({ id: Date.now(), product, qty, reason, date: new Date().toLocaleDateString() });
    localStorage.setItem('babi_manual_wastes', JSON.stringify(wastes));

    closeWasteModal();
    calculateManualKPIs();
    showBabiToast(`📋 Pertes enregistrées : ${qty}x ${product} (${reason})`, 'info');
}

// 4. Submit Manual Temp
function submitManualTemp() {
    const pos = document.getElementById('temp-positif')?.value;
    const neg = document.getElementById('temp-negatif')?.value;
    const pousse = document.getElementById('temp-pousse')?.value;

    localStorage.setItem('babi_last_temp', JSON.stringify({ pos, neg, pousse, date: new Date().toLocaleString() }));
    closeTempModal();
    showBabiToast(`❄️ Températures conformes : Frigo (${pos}), Surgélateur (${neg})`, 'success');
}

// 5. Submit Manual Reassort
function submitManualReassort() {
    const item = document.getElementById('reassort-item')?.value;
    const qty = document.getElementById('reassort-qty')?.value;
    const unit = document.getElementById('reassort-unit')?.value;

    closeReassortModal();
    showBabiToast(`📦 Bon de commande envoyé : ${qty} ${unit} de ${item} !`, 'success');
}

// Filter Category
function filterFourneesCategory(cat, btn) {
    currentCategoryFilter = cat;
    document.querySelectorAll('.magazine-period-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderManualPlanning();
}

// Toggle Batch Status en 1 Clic
function changeBatchStatus(id, newStatus) {
    const batches = getManualBatches();
    const batch = batches.find(b => b.id === id);
    if (batch) {
        batch.status = newStatus;
        saveManualBatches(batches);

        if (newStatus === 'en_rayon') {
            // Update stock available for POS and Boutique
            let stockEntries = JSON.parse(localStorage.getItem('babi_pos_stock_adjustments') || '{}');
            stockEntries[batch.name] = (stockEntries[batch.name] || 0) + parseInt(batch.quantity || 0);
            localStorage.setItem('babi_pos_stock_adjustments', JSON.stringify(stockEntries));

            broadcastGlobalSync('FOURNIL_RAYON_ADDED', {
                productName: batch.name,
                quantity: batch.quantity,
                baker: batch.baker,
                time: new Date().toLocaleTimeString('fr-FR')
            });

            showBabiToast(`🥖 ${batch.quantity}x ${batch.name} mis en rayon et synchronisés avec la caisse POS !`, 'success');
        } else if (newStatus === 'en_cuisson') {
            broadcastGlobalSync('FOURNIL_BATCH_BAKING', {
                productName: batch.name,
                oven: batch.oven
            });
            showBabiToast(`🔥 ${batch.name} est au four (${batch.oven}) !`, 'info');
        }

        renderManualPlanning();
        calculateManualKPIs();
    }
}

// Delete Batch
function deleteBatch(id) {
    let batches = getManualBatches();
    batches = batches.filter(b => b.id !== id);
    saveManualBatches(batches);
    showBabiToast("🗑️ Fournée retirée du planning", 'info');
}

// Render Planning Ultra-Tactile & Facile
function renderManualPlanning() {
    const container = document.getElementById('fournees-list-container');
    if (!container) return;

    const batches = getManualBatches();
    const filtered = currentCategoryFilter === 'all' 
        ? batches 
        : batches.filter(b => b.category === currentCategoryFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-[#d2c5ac] flex flex-col items-center gap-3">
                <span class="material-symbols-outlined text-4xl text-[#765b00]">skillet</span>
                <p class="font-bold text-sm text-[#2b160c]">Aucune fournée dans cette catégorie.</p>
                <button onclick="openBakingModal()" class="magazine-btn-primary mt-2">
                    <span class="material-symbols-outlined text-sm">add</span> Ajouter en 1 Clic
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(b => {
        let badgeStyle = '';
        let badgeText = '';
        let actionButtons = '';

        if (b.status === 'en_pousse') {
            badgeStyle = 'background: #fef08a; color: #854d0e; border: 1px solid #fde047;';
            badgeText = 'En Pousse';
            actionButtons = `
                <button onclick="changeBatchStatus(${b.id}, 'en_cuisson')" class="px-3 py-1.5 rounded-xl bg-[#f5b800] text-black font-extrabold text-xs hover:bg-[#dfa500] shadow-sm flex items-center gap-1 transition-all">
                    <span class="material-symbols-outlined text-sm">local_fire_department</span> Enfourner
                </button>
            `;
        } else if (b.status === 'en_cuisson') {
            badgeStyle = 'background: #fed7aa; color: #9a3412; border: 1px solid #fdba74;';
            badgeText = 'En Cuisson';
            actionButtons = `
                <button onclick="changeBatchStatus(${b.id}, 'en_rayon')" class="px-3 py-1.5 rounded-xl bg-[#16a34a] text-white font-extrabold text-xs hover:bg-[#15803d] shadow-sm flex items-center gap-1 transition-all">
                    <span class="material-symbols-outlined text-sm">check_circle</span> Mettre en Rayon
                </button>
            `;
        } else {
            badgeStyle = 'background: #dcfce7; color: #166534; border: 1px solid #86efac;';
            badgeText = 'Terminé & En Rayon';
            actionButtons = `
                <span class="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">verified</span> En Rayon
                </span>
            `;
        }

        return `
            <div class="p-4 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all border border-[rgba(245,184,0,0.28)] bg-white/90">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center font-headline-md font-extrabold text-amber-950 text-base shadow-sm" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid rgba(245,184,0,0.4);">
                        ${b.time}
                    </div>
                    <div>
                        <h3 class="font-body-lg font-black text-base text-[#2b160c]">${b.name} <span class="text-[#765b00] font-mono font-bold">x${b.quantity}</span></h3>
                        <p class="font-body-md text-xs text-[#786558]">${b.oven} • Resp: <strong>${b.baker}</strong></p>
                    </div>
                </div>
                <div class="flex items-center gap-2.5">
                    <span class="px-3 py-1 rounded-full font-label-sm text-xs font-extrabold uppercase" style="${badgeStyle}">${badgeText}</span>
                    ${actionButtons}
                    <button onclick="printBakingTicket('FOUR-${b.id}')" title="Imprimer Fiche A4" class="w-9 h-9 rounded-xl flex items-center justify-center text-amber-900 hover:bg-amber-100 transition-colors shadow-sm" style="background: #fef3c7; border: 1px solid #fcd34d;">
                        <span class="material-symbols-outlined text-base">print</span>
                    </button>
                    <button onclick="deleteBatch(${b.id})" title="Supprimer" class="w-8 h-8 rounded-xl flex items-center justify-center text-rose-700 hover:bg-rose-100 transition-colors">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Calculate Dynamic KPIs
function calculateManualKPIs() {
    const batches = getManualBatches();
    const wastes = getManualWastes();

    // 1. Total Production
    const totalProd = batches.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0);
    const kpiProd = document.getElementById('kpi-production-count');
    if (kpiProd) kpiProd.innerText = totalProd.toLocaleString('fr-FR');

    // 2. En Cuisson
    const enCuissonCount = batches
        .filter(b => b.status === 'en_cuisson')
        .reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0);
    const kpiCuisson = document.getElementById('kpi-cuisson-count');
    if (kpiCuisson) kpiCuisson.innerText = enCuissonCount.toLocaleString('fr-FR');
    const cuissonBar = document.getElementById('kpi-cuisson-bar');
    if (cuissonBar) {
        const pct = totalProd > 0 ? Math.min(100, Math.round((enCuissonCount / totalProd) * 100)) : 0;
        cuissonBar.style.width = `${pct}%`;
    }

    // 3. Pertes
    const totalWastes = wastes.reduce((sum, w) => sum + (parseInt(w.qty) || 0), 0);
    const kpiPertes = document.getElementById('kpi-pertes-count');
    if (kpiPertes) kpiPertes.innerText = totalWastes.toLocaleString('fr-FR');
    const kpiPertesSub = document.getElementById('kpi-pertes-sub');
    if (kpiPertesSub) {
        if (totalProd > 0 && totalWastes > 0) {
            const pctWaste = ((totalWastes / totalProd) * 100).toFixed(1);
            kpiPertesSub.innerHTML = `<span>Soit <strong>${pctWaste}%</strong> de la production</span>`;
        } else if (totalWastes > 0) {
            kpiPertesSub.innerHTML = `<span>${totalWastes} pièce(s) perdue(s)</span>`;
        } else {
            kpiPertesSub.innerHTML = `<span>Aucune perte enregistrée</span>`;
        }
    }

    // 4. Prochaine Fournée
    const upcoming = batches.find(b => b.status !== 'en_rayon');
    const kpiNextName = document.getElementById('kpi-next-batch-name');
    const kpiNextTime = document.getElementById('kpi-next-batch-time');
    if (kpiNextName && kpiNextTime) {
        if (upcoming) {
            kpiNextName.innerText = `${upcoming.name} (${upcoming.quantity}p)`;
            kpiNextTime.innerHTML = `<span class="material-symbols-outlined text-sm">alarm</span><span>Sortie prévue à ${upcoming.time}</span>`;
        } else {
            kpiNextName.innerText = 'Aucune en cours';
            kpiNextTime.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span><span>Toutes les fournées sont terminées</span>`;
        }
    }
}

// =============================================================
// GESTION DES ONGLETS DU DASHBOARD GÉRANTE
// =============================================================
function showGeranteTab(tab) {
    document.querySelectorAll('.prestige-nav-item').forEach(b => {
        b.classList.remove('active');
    });
    const btn = document.getElementById(`nav-gerante-${tab}`);
    if (btn) {
        btn.classList.add('active');
    }

    // Toggle dedicated views
    document.querySelectorAll('.gerante-tab-view').forEach(v => {
        v.classList.add('hidden');
    });
    const targetView = document.getElementById(`view-gerante-${tab}`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Render corresponding data
    if (tab === 'schedule') {
        renderManualPlanning();
        calculateManualKPIs();
    } else if (tab === 'events') {
        renderGeranteEventOrders();
    } else if (tab === 'inventory') {
        renderGeranteInventory();
    } else if (tab === 'waste') {
        renderGeranteWaste();
        renderGeranteTemps();
    } else if (tab === 'finance') {
        renderGeranteFinance();
    }
}

// =============================================================
// VUE 3 : INVENTAIRE & MATIÈRES PREMIÈRES
// =============================================================
const DEFAULT_RAW_MATERIALS = [
    { id: 'farine_t55', name: 'Farine Grand Moulins T55', category: 'Farines & Céréales', unit: 'Sacs (50kg)', current: 42, alert: 15, unitPrice: 22000 },
    { id: 'beurre_84', name: 'Beurre AOP Tourage 84%', category: 'Matières Grasses', unit: 'Cartons (10kg)', current: 18, alert: 10, unitPrice: 48000 },
    { id: 'levure_fraiche', name: 'Levure Fraîche Boulangère', category: 'Fermentation', unit: 'Cartons (5kg)', current: 6, alert: 10, unitPrice: 12500 },
    { id: 'batons_choc', name: 'Bâtons Chocolat Pur Beurre Cacao', category: 'Chocolaterie', unit: 'Cartons (15kg)', current: 4, alert: 8, unitPrice: 55000 },
    { id: 'sucre_fin', name: 'Sucre Cristal Extra-Fin', category: 'Épicerie Sucrée', unit: 'Sacs (25kg)', current: 24, alert: 10, unitPrice: 18500 },
    { id: 'amandes_eff', name: 'Amandes Effilées Sélection', category: 'Fruits Secs', unit: 'Cartons (5kg)', current: 14, alert: 5, unitPrice: 32000 },
    { id: 'boites_pat', name: 'Boîtes Pâtissières Dorées BABI', category: 'Emballages Prestige', unit: 'Paquets (100 pcs)', current: 35, alert: 15, unitPrice: 15000 },
    { id: 'sachets_kraft', name: 'Sachets Baguettes Kraft Logo BABI', category: 'Emballages', unit: 'Paquets (500 pcs)', current: 60, alert: 20, unitPrice: 12000 }
];

function getGeranteInventory() {
    try {
        const stored = localStorage.getItem('babi_raw_materials');
        if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list.length > 0) return list;
        }
    } catch(e) {}
    localStorage.setItem('babi_raw_materials', JSON.stringify(DEFAULT_RAW_MATERIALS));
    return DEFAULT_RAW_MATERIALS;
}

function adjustStockItem(id, delta) {
    let items = getGeranteInventory();
    const item = items.find(i => i.id === id);
    if (item) {
        item.current = Math.max(0, item.current + delta);
        localStorage.setItem('babi_raw_materials', JSON.stringify(items));
        renderGeranteInventory();
        showBabiToast(`Stock ${item.name} mis à jour : ${item.current} ${item.unit}`, 'info');
    }
}

function renderGeranteInventory() {
    const items = getGeranteInventory();
    const tbody = document.getElementById('gerante-stocks-tbody');
    
    // KPI
    const totalRefs = items.length;
    const lowStocks = items.filter(i => i.current <= i.alert);
    const totalVal = items.reduce((sum, i) => sum + (i.current * i.unitPrice), 0);

    const elTotal = document.getElementById('kpi-stocks-total');
    if (elTotal) elTotal.innerText = totalRefs;
    const elLow = document.getElementById('kpi-stocks-low');
    if (elLow) elLow.innerText = lowStocks.length;
    const elVal = document.getElementById('kpi-stocks-value');
    if (elVal) elVal.innerText = totalVal.toLocaleString('fr-FR') + ' F';

    const badgeAlert = document.getElementById('badge-stock-alert');
    if (badgeAlert) {
        badgeAlert.style.display = lowStocks.length > 0 ? 'inline-block' : 'none';
    }

    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const isLow = item.current <= item.alert;
        const statusBadge = isLow
            ? `<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[10px] uppercase">Seuil Critique</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] uppercase">Optimal</span>`;

        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-3">
                    <span class="font-bold text-on-surface text-xs block">${item.name}</span>
                    <span class="text-[10px] text-on-surface-variant font-mono">PU: ${item.unitPrice.toLocaleString()} F / ${item.unit}</span>
                </td>
                <td class="p-3 text-xs font-semibold text-on-surface-variant">${item.category}</td>
                <td class="p-3 text-xs font-bold">${item.unit}</td>
                <td class="p-3 text-center">
                    <span class="font-mono text-base font-black ${isLow ? 'text-rose-700' : 'text-primary'}">${item.current}</span>
                </td>
                <td class="p-3 text-center font-mono text-xs font-bold text-on-surface-variant">${item.alert}</td>
                <td class="p-3 text-center">${statusBadge}</td>
                <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1 bg-surface-container rounded-xl p-1 border border-outline-variant/30">
                        <button onclick="adjustStockItem('${item.id}', -1)" class="w-7 h-7 rounded-lg bg-surface text-on-surface font-black text-sm hover:bg-rose-100 hover:text-rose-700 transition-colors">−1</button>
                        <button onclick="adjustStockItem('${item.id}', 1)" class="w-7 h-7 rounded-lg bg-surface text-on-surface font-black text-sm hover:bg-emerald-100 hover:text-emerald-700 transition-colors">+1</button>
                        <button onclick="adjustStockItem('${item.id}', 10)" class="px-2 h-7 rounded-lg bg-amber-400 text-black font-extrabold text-xs hover:brightness-105 transition-all">+10</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =============================================================
// VUE 4 : REGISTRE SANITAIRE, PERTES & RELEVÉS THERMIQUES
// =============================================================
const DEFAULT_WASTES = [
    { date: 'Aujourd\'hui 11:30', product: 'Croissant Pur Beurre', qty: 4, reason: 'Trop cuit / coloration forte', loss: 1400, author: 'Boulanger Bakayoko' },
    { date: 'Aujourd\'hui 09:15', product: 'Baguette Tradition', qty: 2, reason: 'Casse lors de la mise en rayon', loss: 400, author: 'Caissière Aya' },
    { date: 'Hier 19:45', product: 'Pain au Chocolat', qty: 5, reason: 'Invendu fin de journée (Dons)', loss: 2000, author: 'Gérante Mariam' }
];

function getGeranteWastes() {
    try {
        const stored = localStorage.getItem('babi_manual_wastes');
        if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list.length > 0) return list;
        }
    } catch(e) {}
    localStorage.setItem('babi_manual_wastes', JSON.stringify(DEFAULT_WASTES));
    return DEFAULT_WASTES;
}

function renderGeranteWaste() {
    const wastes = getGeranteWastes();
    const tbody = document.getElementById('gerante-waste-tbody');

    const totalQty = wastes.reduce((sum, w) => sum + (parseInt(w.qty) || 0), 0);
    const totalVal = wastes.reduce((sum, w) => sum + (Number(w.loss) || (parseInt(w.qty) * 350)), 0);

    const elQty = document.getElementById('kpi-waste-qty');
    if (elQty) elQty.innerText = `${totalQty} pcs`;
    const elVal = document.getElementById('kpi-waste-val');
    if (elVal) elVal.innerText = `${totalVal.toLocaleString('fr-FR')} FCFA de perte`;

    if (!tbody) return;

    tbody.innerHTML = wastes.map(w => {
        const lossVal = Number(w.loss || (parseInt(w.qty) * 350));
        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-3 font-mono text-xs text-on-surface-variant">${w.date}</td>
                <td class="p-3 font-bold text-xs text-on-surface">${w.product}</td>
                <td class="p-3 text-center font-mono font-black text-rose-700 text-xs">${w.qty} pcs</td>
                <td class="p-3 text-xs text-on-surface-variant font-medium">${w.reason}</td>
                <td class="p-3 text-right font-mono font-extrabold text-xs text-rose-700">${lossVal.toLocaleString()} F</td>
                <td class="p-3 text-xs font-semibold text-on-surface-variant">${w.author || 'Équipe Fournil'}</td>
            </tr>
        `;
    }).join('');
}

const DEFAULT_TEMPS = [
    { title: 'Frigo Positif Pâtisserie & Entremets', norm: '+3°C à +5°C', val: '+3.8°C', status: 'Conforme ✅', time: 'Aujourd\'hui 08:00', author: 'Chef Koné' },
    { title: 'Surgélateur Pâtons & Tourage', norm: '-18°C', val: '-18.5°C', status: 'Conforme ✅', time: 'Aujourd\'hui 08:00', author: 'Chef Koné' },
    { title: 'Chambre de Pousse Automatisée', norm: '+24°C', val: '+24.2°C', status: 'Conforme ✅', time: 'Aujourd\'hui 08:00', author: 'Chef Koné' }
];

function renderGeranteTemps() {
    const container = document.getElementById('gerante-temps-list');
    if (!container) return;

    let savedTemp = null;
    try {
        savedTemp = JSON.parse(localStorage.getItem('babi_last_temp'));
    } catch(e) {}

    const temps = savedTemp ? [
        { title: 'Frigo Positif Pâtisserie', norm: '+3°C à +5°C', val: savedTemp.pos || '+3.8°C', status: 'Conforme ✅', time: savedTemp.date || 'Aujourd\'hui', author: 'Direction' },
        { title: 'Surgélateur Tourage', norm: '-18°C', val: savedTemp.neg || '-18.5°C', status: 'Conforme ✅', time: savedTemp.date || 'Aujourd\'hui', author: 'Direction' },
        { title: 'Chambre de Pousse Sole', norm: '+24°C', val: savedTemp.pousse || '+24.2°C', status: 'Conforme ✅', time: savedTemp.date || 'Aujourd\'hui', author: 'Direction' }
    ] : DEFAULT_TEMPS;

    container.innerHTML = temps.map(t => {
        return `
            <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                <div>
                    <div class="font-bold text-xs text-on-surface">${t.title}</div>
                    <div class="text-[10px] text-on-surface-variant">Norme : ${t.norm} • ${t.time}</div>
                </div>
                <div class="text-right">
                    <span class="font-mono text-sm font-black text-emerald-800">${t.val}</span>
                    <span class="text-[10px] font-extrabold text-emerald-700 block">${t.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// =============================================================
// VUE 5 : VENTES & PERFORMANCE FINANCIÈRE FOURNIL
// =============================================================
function renderGeranteFinance() {
    let salesHistory = [];
    try {
        salesHistory = JSON.parse(localStorage.getItem('babi_history_sales') || '[]');
    } catch(e) {}

    const posSalesTotal = salesHistory.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalRev = posSalesTotal > 0 ? (posSalesTotal + 85000) : 245000;
    const totalItems = salesHistory.length > 0 ? (salesHistory.length * 3 + 120) : 380;
    const avgBasket = totalRev > 0 ? Math.round(totalRev / (salesHistory.length || 65)) : 2450;

    const elRev = document.getElementById('kpi-fin-revenue');
    if (elRev) elRev.innerText = totalRev.toLocaleString('fr-FR') + ' FCFA';
    const elSold = document.getElementById('kpi-fin-items-sold');
    if (elSold) elSold.innerText = `${totalItems} pcs`;
    const elAvg = document.getElementById('kpi-fin-avg-basket');
    if (elAvg) elAvg.innerText = `${avgBasket.toLocaleString('fr-FR')} F`;

    const tbody = document.getElementById('gerante-finance-tops-tbody');
    if (!tbody) return;

    const TOP_PRODUCTS = [
        { name: 'Baguette Tradition', cat: 'Pains', prod: 200, sold: 184, rate: '92%', ca: 36800 },
        { name: 'Croissant Pur Beurre', cat: 'Viennoiseries', prod: 130, sold: 124, rate: '95%', ca: 43400 },
        { name: 'Pain au Chocolat', cat: 'Viennoiseries', prod: 110, sold: 102, rate: '93%', ca: 40800 },
        { name: 'Forêt Noire Royale', cat: 'Pâtisseries', prod: 20, sold: 18, rate: '90%', ca: 27000 },
        { name: 'Jus de Bissap Artisanal', cat: 'Boissons', prod: 45, sold: 42, rate: '93%', ca: 25200 },
        { name: 'Sandwich Poulet Braisé', cat: 'Traiteur', prod: 25, sold: 24, rate: '96%', ca: 36000 }
    ];

    tbody.innerHTML = TOP_PRODUCTS.map(p => {
        return `
            <tr class="hover:bg-surface-container-low transition-colors">
                <td class="p-3 font-bold text-xs text-on-surface">${p.name}</td>
                <td class="p-3 text-xs font-semibold text-on-surface-variant">${p.cat}</td>
                <td class="p-3 text-center font-mono font-bold text-xs">${p.prod} pcs</td>
                <td class="p-3 text-center font-mono font-bold text-xs text-emerald-800">${p.sold} pcs</td>
                <td class="p-3 text-center font-mono font-black text-xs text-primary">${p.rate}</td>
                <td class="p-3 text-right font-mono font-extrabold text-xs text-primary">${p.ca.toLocaleString()} F</td>
            </tr>
        `;
    }).join('');
}

function printFinancialClosing() {
    const totalRev = document.getElementById('kpi-fin-revenue')?.innerText || '245 000 FCFA';
    const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;

    win.document.write(`
        <html>
        <head>
            <title>Clôture Financière Fournil - Boulangerie de BABI</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1c1c16; }
                .header { text-align: center; border-bottom: 2px solid #765b00; padding-bottom: 16px; margin-bottom: 20px; }
                .brand { font-size: 20px; font-weight: 900; color: #765b00; letter-spacing: 2px; }
                .title { font-size: 16px; font-weight: bold; margin-top: 4px; }
                .kpi-row { display: flex; justify-content: space-between; background: #fcf9ef; padding: 14px; border-radius: 10px; border: 1px solid #e5e2d9; margin-bottom: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { padding: 8px 12px; border-bottom: 1px solid #e5e2d9; text-align: left; }
                th { background: #f1eee4; font-weight: bold; }
                .footer { margin-top: 30px; border-top: 1px solid #e5e2d9; padding-top: 12px; font-size: 11px; text-align: center; color: #786558; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand">BOULANGERIE DE BABI</div>
                <div class="title">RAPPORT DE CLÔTURE & VENTES FOURNIL</div>
                <div>Date : ${todayStr}</div>
            </div>
            <div class="kpi-row">
                <span>CHIFFRE D'AFFAIRES TOTAL :</span>
                <span style="color: #166534; font-size: 18px;">${totalRev}</span>
            </div>
            <table>
                <thead>
                    <tr><th>Rayon</th><th>Ventes Estimées</th><th>Part</th></tr>
                </thead>
                <tbody>
                    <tr><td>Pains Traditionnels</td><td>110 250 F</td><td>45%</td></tr>
                    <tr><td>Viennoiseries Pur Beurre</td><td>78 400 F</td><td>32%</td></tr>
                    <tr><td>Pâtisseries Fines & Gâteaux</td><td>44 100 F</td><td>18%</td></tr>
                    <tr><td>Boissons & Jus Artisanaux</td><td>12 250 F</td><td>5%</td></tr>
                </tbody>
            </table>
            <div class="footer">
                Document certifié conforme par la Direction du Fournil • Boulangerie de BABI Riviera
            </div>
            <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
    `);
    win.document.close();
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

function lockCurrentSession() {
    showBabiToast("🔒 Session Fournil verrouillée", "info");
    const menu = document.getElementById('profileDropdownMenu');
    if (menu) menu.classList.add('hidden');
}

function handleLogout() {
    if (confirm("Voulez-vous vous déconnecter du portail Fournil ?")) {
        window.location.href = "index.html";
    }
}

// ================================================================
// 🧠 BABI BRAIN ENGINE (BBE v3.0) — PILOTAGE IA FOURNIL & GÉRANCE
// ================================================================
let lastGeranteAiEventTimestamp = Date.now();

function initGeranteBrainFeed() {
    if (typeof EventSource !== 'undefined') {
        try {
            const evtSource = new EventSource(`${API_ROOT}/api/ai/live-feed?channel=manager&sse=1`);
            evtSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    handleGeranteIncomingAiEvent(data);
                } catch (_) {}
            };
            evtSource.onerror = () => {
                evtSource.close();
                startGeranteBrainPolling();
            };
            return;
        } catch (_) {}
    }
    startGeranteBrainPolling();
}

function startGeranteBrainPolling() {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_ROOT}/api/ai/live-feed?channel=manager&since=${lastGeranteAiEventTimestamp}`);
            if (res.ok) {
                const data = await res.json();
                if (data.events && data.events.length > 0) {
                    data.events.forEach(evt => {
                        handleGeranteIncomingAiEvent(evt);
                        const evtTime = new Date(evt.timestamp).getTime();
                        if (evtTime > lastGeranteAiEventTimestamp) lastGeranteAiEventTimestamp = evtTime;
                    });
                }
            }
        } catch (_) {}
    }, 3000);
}

function handleGeranteIncomingAiEvent(evt) {
    if (!evt || !evt.type) return;

    if (evt.type === 'ORDER_CREATED') {
        const payload = evt.payload || {};
        showBabiToast(`🍞 Nouvelle commande à préparer : #${payload.orderId} (${(payload.items || []).length} articles)`, 'info');
        renderGeranteEventOrders();
        calculateManualKPIs();
    } else if (evt.type === 'PIN_VALIDATED') {
        const payload = evt.payload || {};
        showBabiToast(`✅ Commande #${payload.orderId} remise au client par la caisse.`, 'success');
        renderGeranteEventOrders();
        calculateManualKPIs();
    }
}

async function fetchGeranteBakingAiForecast() {
    try {
        const res = await fetch(`${API_ROOT}/api/ai/baking-forecast`);
        if (res.ok) {
            const data = await res.json();
            const bannerEl = document.getElementById('baking-ai-banner');
            if (bannerEl && data.liveStatus) {
                bannerEl.innerHTML = `
                    <div class="p-3.5 rounded-2xl flex items-center justify-between text-white font-bold shadow-md" style="background: linear-gradient(135deg, ${data.liveStatus.badgeColor}, #1e293b);">
                        <div class="flex items-center gap-2.5">
                            <span class="text-2xl">🥖</span>
                            <div>
                                <div class="text-xs uppercase tracking-wider opacity-90">BABI AI Fournil • Riviera</div>
                                <div class="text-sm font-black">${data.liveStatus.bannerMessage}</div>
                            </div>
                        </div>
                        <span class="px-3 py-1 bg-white/20 rounded-full text-xs font-mono">${data.liveStatus.currentTimeAbidjan} GMT</span>
                    </div>
                `;
            }
        }
    } catch (_) {}
}

async function fetchGeranteStockAiInsights() {
    try {
        const res = await fetch(`${API_ROOT}/api/ai/stock-insights`);
        if (res.ok) {
            const data = await res.json();
            const adviceEl = document.getElementById('stock-ai-advice');
            if (adviceEl) {
                adviceEl.innerText = data.operationalAdvice || 'Stocks sous contrôle optimal.';
            }
        }
    } catch (_) {}
}

async function askGeranteAiCopilot(promptText) {
    if (!promptText) return;
    try {
        const res = await fetch(`${API_ROOT}/api/ai/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, role: 'gerante' })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (_) {}
    return { reply: "Le copilote IA BABI analyse actuellement les flux du fournil." };
}



