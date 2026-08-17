// -------------------------------------------------------------
// DASHBOARD GÉRANTE — LOGIQUE PILOTAGE & DIRECTION
// -------------------------------------------------------------

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

const DEMO_EMPLOYEES = [
    { id: 1, nom: 'Traoré', prenom: 'Mariam', poste: 'Gérante Principale', statut_presence: 'present', heure_arrivee: '05h45' },
    { id: 2, nom: 'Kouassi', prenom: 'Aya', poste: 'Caissière Caisse 1', statut_presence: 'present', heure_arrivee: '06h00' },
    { id: 3, nom: 'Bakayoko', prenom: 'Jean-Luc', poste: 'Chef Boulanger', statut_presence: 'present', heure_arrivee: '04h30' },
    { id: 4, nom: 'Diallo', prenom: 'Ibrahim', poste: 'Aide-Boulanger Fournil', statut_presence: 'present', heure_arrivee: '06h15' },
    { id: 5, nom: 'N\'Guessan', prenom: 'Clarisse', poste: 'Aide-Pâtissière', statut_presence: 'pause', heure_arrivee: '05h30' },
    { id: 6, nom: 'Yao', prenom: 'Patrick', poste: 'Apprenti Boulanger', statut_presence: 'absent', heure_arrivee: '--' }
];

const DEMO_MOVEMENTS = [
    { id: 1, nom_produit: 'Baguette Tradition', delta_quantite: 30, motif: 'Sortie fournil 09h00', date_mouvement: 'Aujourd\'hui 09h05', auteur: 'Boulanger Bakayoko' },
    { id: 2, nom_produit: 'Pain au Chocolat', delta_quantite: -14, motif: 'Ventes Caisse Matinée', date_mouvement: 'Aujourd\'hui 10h12', auteur: 'Caissière Aya' },
    { id: 3, nom_produit: 'Croissant Pur Beurre', delta_quantite: 25, motif: 'Sortie fournil 06h00', date_mouvement: 'Aujourd\'hui 06h10', auteur: 'Boulanger Bakayoko' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = JSON.parse(localStorage.getItem('babi_user'));
    if (user && document.getElementById('gerante-name-badge')) {
        document.getElementById('gerante-name-badge').innerText = (user.prenom || 'Mariam') + ' ' + (user.nom || 'Traoré');
    }

    loadDashboardData();
    setInterval(loadDashboardData, 12000); // Auto-refresh every 12s
});

async function loadDashboardData() {
    await Promise.all([
        loadKpis(),
        loadStocks(),
        loadFournilOrders(),
        renderGeranteEventOrders(),
        loadEmployees(),
        loadMovements()
    ]);
}

// 1. Load KPIs
async function loadKpis() {
    try {
        const res = await fetch('/api/reports/manager-dashboard');
        if (!res.ok) throw new Error("API Offline");
        const data = await res.json();

        document.getElementById('kpi-revenue-today').innerText = (data.todayRevenue || 0).toLocaleString() + ' F';
        document.getElementById('kpi-orders-fournil').innerText = data.ordersEnAttenteFournil || 0;
        document.getElementById('kpi-low-stocks').innerText = data.lowStocksCount || 0;
        document.getElementById('kpi-employees-present').innerText = `${data.employeesPresent || 0} / ${data.employeesTotal || 0}`;

        updateAlertBanner(data.lowStocksCount || 0);
    } catch (err) {
        // Fallback demo KPIs
        document.getElementById('kpi-revenue-today').innerText = '145 000 F';
        document.getElementById('kpi-orders-fournil').innerText = '2';
        document.getElementById('kpi-low-stocks').innerText = '2';
        document.getElementById('kpi-employees-present').innerText = '4 / 6';
        updateAlertBanner(2);
    }
}

function updateAlertBanner(count) {
    const alertBanner = document.getElementById('low-stock-alert-banner');
    if (alertBanner) {
        if (count > 0) {
            alertBanner.style.display = 'flex';
            document.getElementById('alert-count-text').innerText = `${count} produit(s) en alerte de stock faible !`;
        } else {
            alertBanner.style.display = 'none';
        }
    }
}

// 2. Load Stocks & Fournil
async function loadStocks() {
    try {
        const res = await fetch('/api/stocks');
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
        const res = await fetch('/api/stocks/adjust', {
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
        const res = await fetch('/api/orders');
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
        await fetch(`/api/orders/${orderId}/status`, {
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
        const res = await fetch('/api/employees');
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
        await fetch(`/api/employees/${empId}/presence`, {
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
        const res = await fetch('/api/stocks/movements');
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

// 6. Gâteaux d'Événements Gérance
function renderGeranteEventOrders() {
    let events = [];
    try {
        events = JSON.parse(localStorage.getItem('babi_event_orders')) || [];
    } catch(e) {}

    const tbody = document.getElementById('gerante-events-tbody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Aucune réservation de gâteau d'événement enregistrée.</td></tr>`;
        return;
    }

    tbody.innerHTML = events.map(evt => {
        return `
            <tr>
                <td class="fw-bold text-warning">#${evt.ref || evt.id}</td>
                <td>
                    <div class="fw-bold text-white">${evt.name || 'Client BABI'}</div>
                    <small class="text-light"><i class="fa-solid fa-phone me-1"></i> ${evt.phone || 'Non renseigné'}</small>
                </td>
                <td><span class="badge bg-warning text-dark fw-bold">${evt.eventType || 'Événement'}</span></td>
                <td>
                    <div class="fw-bold text-danger">${evt.portions || 20} parts (${evt.tiers || 1} Étage${(evt.tiers || 1) > 1 ? 's' : ''})</div>
                    <small class="text-light">${evt.flavor || 'Chocolat'}</small>
                </td>
                <td>
                    <div class="small fw-semibold text-white">"${evt.message || 'Sans inscription'}"</div>
                </td>
                <td>
                    <div class="fw-bold text-white">${evt.date || 'À convenir'}</div>
                    <small class="text-light">${evt.time || ''}</small>
                </td>
                <td class="fw-bold fs-6 text-warning">${(evt.price || 0).toLocaleString()} F</td>
                <td>
                    <div class="d-flex align-items-center gap-1">
                        <span class="badge ${evt.status && evt.status.includes('Fournil') ? 'bg-warning text-dark' : 'bg-info text-dark'}">${evt.status || 'Devis Reçu'}</span>
                        <a href="https://api.whatsapp.com/send?phone=225${(evt.phone || '').replace(/\D/g, '')}&text=Bonjour%20${encodeURIComponent(evt.name || 'Client')}%20de%20la%20part%20de%20la%20Direction%20Boulangerie%20de%20BABI%20concernant%20votre%20gâteau%20%23${evt.ref}" target="_blank" class="btn btn-outline-success btn-sm p-1 px-2" title="WhatsApp Direct">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
// IMPRESSION TICKET DE PRÉPARATION FOURNIL (FORMAT 80MM)
// =============================================================
function printBakingTicket(orderId) {
    const orders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
    const order = orders.find(o => String(o.id) === String(orderId)) || {
        id: orderId || 'BAB-001',
        customer_name: 'Client BABI',
        customer_phone: '07 04 38 92 01',
        items_summary: '2x Baguette Tradition, 3x Croissants Pur Beurre',
        pickup_slot: '16h00 - 17h00',
        total_price: 3500
    };

    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
        alert("Veuillez autoriser les fenêtres contextuelles pour imprimer le ticket.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bon de Fournil #${order.id}</title>
            <style>
                @page { size: 80mm auto; margin: 4mm; }
                body {
                    font-family: 'Courier New', monospace;
                    width: 72mm;
                    margin: 0 auto;
                    color: #000;
                    font-size: 12px;
                    line-height: 1.3;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .border-top { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
                .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
                .large { font-size: 14px; font-weight: bold; }
                .qr-placeholder { margin: 8px auto; text-align: center; border: 1px solid #000; padding: 4px; width: 60px; font-size: 9px; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="text-center">
                <div class="title">BOULANGERIE DE BABI</div>
                <div>*** BON DE PRÉPARATION FOURNIL ***</div>
                <div class="border-bottom">Abidjan - Côte d'Ivoire</div>
            </div>

            <div style="margin: 6px 0;">
                <div><strong>COMMANDE :</strong> #${order.id}</div>
                <div><strong>CLIENT :</strong> ${order.customer_name}</div>
                <div><strong>TÉLÉPHONE :</strong> ${order.customer_phone}</div>
                <div><strong>CRÉNEAU RETRAIT :</strong> <span class="large">${order.pickup_slot || '16h00 - 17h00'}</span></div>
                <div><strong>DATE :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</div>
            </div>

            <div class="border-top border-bottom">
                <div class="bold" style="margin-bottom: 4px;">ARTICLES À PRÉPARER :</div>
                <div style="font-size: 13px; font-weight: bold;">
                    ${order.items_summary.split(',').map(i => `<div>[ ] ${i.trim()}</div>`).join('')}
                </div>
            </div>

            <div style="margin: 6px 0;" class="text-right">
                <div>TOTAL RÉGLÉ : <strong>${(order.total_price || 0).toLocaleString()} FCFA</strong></div>
                <div>STATUT PAIEMENT : <strong>PAYÉ (WAVE / OM)</strong></div>
            </div>

            <div class="text-center border-top" style="margin-top: 10px; font-size: 10px;">
                <div>Emballer avec sachet kraft BABI</div>
                <div>Apposer le sticker de scellé doré</div>
                <div>Fournil de BABI 👑 - Qualité Artisanale</div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

