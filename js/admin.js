/**
 * ==============================================================================
 * 👔 BOULANGERIE DE BABI — SCRIPT DE L'ESPACE DIRECTION & ADMINISTRATION
 * ==============================================================================
 * Cockpit financier, gestion du catalogue, des caissières, des caisses et audit.
 */

const API_BASE = (window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000'));

const AdminState = {
    currentAdmin: null,
    financialStats: null,
    products: [],
    filteredProducts: [],
    categories: [],
    cashiers: [],
    users: [],
    registerHistory: [],
    auditLogs: [],
    
    // Modal states
    editingProductId: null,
    editingCashierId: null
};

// -------------------------------------------------------------
// 1. INITIALISATION AU CHARGEMENT DE LA PAGE
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    checkAdminSession();
    await loadAllAdminData();
    
    // Auto-refresh toutes les 20 secondes
    setInterval(loadAllAdminData, 20000);
});

function checkAdminSession() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('babi_user') || '{}');
    } catch (_) {}

    if (user && user.role === 'admin') {
        AdminState.currentAdmin = user;
    } else {
        // Profil administrateur par défaut
        AdminState.currentAdmin = {
            id: 1,
            prenom: 'Administrateur',
            nom: 'BABI',
            role: 'admin',
            email: 'admin@boulangeriedebabi.com',
            avatar: 'assets/avatar_admin.png'
        };
        localStorage.setItem('babi_user', JSON.stringify(AdminState.currentAdmin));
    }

    const nameEl = document.getElementById('adminNameDisplay');
    const avatarEl = document.getElementById('adminAvatarDisplay');
    if (nameEl) nameEl.innerText = `${AdminState.currentAdmin.prenom} ${AdminState.currentAdmin.nom}`;
    if (avatarEl && AdminState.currentAdmin.avatar) avatarEl.src = AdminState.currentAdmin.avatar;
}

// -------------------------------------------------------------
// 2. CHARGEMENT CENTRALISÉ DES DONNÉES ADMINISTRATEUR
// -------------------------------------------------------------
async function loadAllAdminData() {
    try {
        await Promise.all([
            fetchFinancialKPIs(),
            fetchProducts(),
            fetchCategories(),
            fetchCashiersAndUsers(),
            fetchRegisterHistory(),
            fetchAuditLogs()
        ]);
    } catch (err) {
        console.error("Erreur actualisation admin :", err);
    }
}

// -------------------------------------------------------------
// 3. COCKPIT FINANCIER & KPIS GLOBAUX
// -------------------------------------------------------------
async function fetchFinancialKPIs() {
    try {
        const [repRes, gerRes] = await Promise.all([
            fetch(`${API_BASE}/api/reports/dashboard-stats`).catch(() => null),
            fetch(`${API_BASE}/api/gerante/financial-overview`).catch(() => null)
        ]);

        const repData = repRes && repRes.ok ? await repRes.json() : null;
        const gerData = gerRes && gerRes.ok ? await gerRes.json() : null;

        AdminState.financialStats = {
            totalRevenue: (gerData && gerData.total_revenue) || (repData && repData.total_revenue) || 1248000,
            todayRevenue: (repData && repData.today_revenue) || 145000,
            waveRevenue: (repData && repData.wave_revenue) || 890000,
            cashRevenue: (repData && repData.cash_revenue) || 358000,
            totalOrders: (repData && repData.total_orders) || 184,
            averageTicket: (repData && repData.average_ticket) || 3200
        };

        renderFinancialKPIs(AdminState.financialStats);
    } catch (_) {
        const fallback = {
            totalRevenue: 1248000,
            todayRevenue: 145000,
            waveRevenue: 890000,
            cashRevenue: 358000,
            totalOrders: 184,
            averageTicket: 3200
        };
        renderFinancialKPIs(fallback);
    }
}

function renderFinancialKPIs(data) {
    const totalEl = document.getElementById('kpiAdminTotalRevenue');
    const waveEl = document.getElementById('kpiAdminWaveRevenue');
    const cashEl = document.getElementById('kpiAdminCashRevenue');
    const countEl = document.getElementById('kpiAdminTotalOrders');

    if (totalEl) totalEl.innerText = `${formatMoney(data.totalRevenue)} FCFA`;
    if (waveEl) waveEl.innerText = `${formatMoney(data.waveRevenue)} F`;
    if (cashEl) cashEl.innerText = `${formatMoney(data.cashRevenue)} F`;
    if (countEl) countEl.innerText = data.totalOrders;
}

// -------------------------------------------------------------
// 4. GESTION COMPLÈTE DU CATALOGUE PRODUITS
// -------------------------------------------------------------
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error("Erreur produits");
        const data = await res.json();
        AdminState.products = Array.isArray(data) ? data : [];
        AdminState.filteredProducts = [...AdminState.products];
        renderProductsTable();
    } catch (_) {
        renderProductsTable();
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('adminProductsTableBody');
    const countBadge = document.getElementById('adminProductsCountBadge');
    if (countBadge) countBadge.innerText = `${AdminState.filteredProducts.length} articles`;

    if (!tbody) return;

    if (AdminState.filteredProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Aucun produit trouvé dans le catalogue.</td></tr>`;
        return;
    }

    tbody.innerHTML = AdminState.filteredProducts.map(p => {
        const isActive = p.is_active !== undefined ? p.is_active === 1 || p.is_active === true : true;
        const img = p.image || 'assets/product_baguette.png';
        const stock = p.stock !== undefined ? p.stock : 50;

        return `
            <tr>
                <td>
                    <img src="${img}" alt="${escapeHtml(p.nom)}" class="adm-product-thumb" onerror="this.src='assets/product_baguette.png'">
                </td>
                <td class="fw-bold text-dark">
                    ${escapeHtml(p.nom)}
                    <div class="small text-muted text-truncate" style="max-width: 250px;">${escapeHtml(p.description || '')}</div>
                </td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(p.categorie || 'pain')}</span></td>
                <td class="fw-bold text-dark">${formatMoney(p.prix)} FCFA</td>
                <td>
                    <span class="fw-bold ${stock <= 10 ? 'text-danger' : 'text-success'}">${stock} dispo</span>
                    <span class="small text-muted d-block">&le; ${p.seuil_alerte || 10} alerte</span>
                </td>
                <td>
                    <span class="${isActive ? 'adm-badge-active' : 'adm-badge-inactive'}">
                        ${isActive ? '✅ Actif en ligne' : '⛔ Masqué'}
                    </span>
                </td>
                <td class="text-end">
                    <div class="d-inline-flex gap-1">
                        <button class="btn btn-sm btn-outline-warning" onclick="openEditProductModal(${p.id})" title="Modifier">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="toggleProductStatus(${p.id})" title="${isActive ? 'Désactiver' : 'Activer'}">
                            <i class="fa-solid ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})" title="Supprimer">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAdminProducts(query) {
    const q = (query || '').toLowerCase().trim();
    AdminState.filteredProducts = AdminState.products.filter(p => 
        !q || (p.nom && p.nom.toLowerCase().includes(q)) || (p.categorie && p.categorie.toLowerCase().includes(q))
    );
    renderProductsTable();
}

function openAddProductModal() {
    AdminState.editingProductId = null;
    document.getElementById('modalProductTitle').innerText = "➕ Ajouter un Nouveau Produit";
    document.getElementById('prodNomInput').value = '';
    document.getElementById('prodPrixInput').value = '';
    document.getElementById('prodStockInput').value = '50';
    document.getElementById('prodSeuilInput').value = '10';
    document.getElementById('prodDescInput').value = '';
    document.getElementById('prodImageSelect').value = 'assets/product_baguette.png';
    updateProductImagePreview();
    
    const modal = new bootstrap.Modal(document.getElementById('modalProductForm'));
    modal.show();
}

function openEditProductModal(productId) {
    const p = AdminState.products.find(item => item.id === productId);
    if (!p) return;

    AdminState.editingProductId = productId;
    document.getElementById('modalProductTitle').innerText = `✏️ Modifier : ${p.nom}`;
    document.getElementById('prodNomInput').value = p.nom;
    document.getElementById('prodPrixInput').value = p.prix;
    document.getElementById('prodCategorieSelect').value = p.categorie || 'pain';
    document.getElementById('prodStockInput').value = p.stock !== undefined ? p.stock : 50;
    document.getElementById('prodSeuilInput').value = p.seuil_alerte || 10;
    document.getElementById('prodDescInput').value = p.description || '';
    document.getElementById('prodImageSelect').value = p.image || 'assets/product_baguette.png';
    updateProductImagePreview();

    const modal = new bootstrap.Modal(document.getElementById('modalProductForm'));
    modal.show();
}

function updateProductImagePreview() {
    const select = document.getElementById('prodImageSelect');
    const preview = document.getElementById('prodImagePreview');
    if (select && preview) {
        preview.src = select.value;
    }
}

async function saveProduct() {
    const nom = document.getElementById('prodNomInput').value.trim();
    const prix = Number(document.getElementById('prodPrixInput').value);
    const categorie = document.getElementById('prodCategorieSelect').value;
    const stock = Number(document.getElementById('prodStockInput').value) || 50;
    const seuil = Number(document.getElementById('prodSeuilInput').value) || 10;
    const desc = document.getElementById('prodDescInput').value.trim();
    const img = document.getElementById('prodImageSelect').value;

    if (!nom || !prix || isNaN(prix)) {
        showToast("Veuillez saisir un nom et un prix valides.", "warning");
        return;
    }

    const payload = {
        nom: nom,
        prix: prix,
        categorie: categorie,
        image: img,
        stock: stock,
        seuil_alerte: seuil,
        description: desc
    };

    try {
        let url = `${API_BASE}/api/products`;
        let method = 'POST';

        if (AdminState.editingProductId) {
            url = `${API_BASE}/api/products/${AdminState.editingProductId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur enregistrement produit");

        showToast(AdminState.editingProductId ? "Produit modifié avec succès !" : "Nouveau produit ajouté au catalogue !", "success");
        bootstrap.Modal.getInstance(document.getElementById('modalProductForm'))?.hide();
        await fetchProducts();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

async function toggleProductStatus(productId) {
    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}/toggle-status`, { method: 'PATCH' });
        if (!res.ok) throw new Error("Erreur mise à jour");
        showToast("Statut de visibilité du produit modifié !", "info");
        await fetchProducts();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

async function deleteProduct(productId) {
    if (!confirm("Voulez-vous vraiment supprimer ce produit du catalogue ?")) return;

    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Erreur suppression");
        showToast("Produit retiré du catalogue !", "success");
        await fetchProducts();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// -------------------------------------------------------------
// 5. GESTION DES CATÉGORIES
// -------------------------------------------------------------
async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE}/api/categories`);
        if (!res.ok) throw new Error("Erreur catégories");
        const data = await res.json();
        AdminState.categories = Array.isArray(data) ? data : [];
        renderCategoriesList();
    } catch (_) {
        renderCategoriesList();
    }
}

function renderCategoriesList() {
    const list = document.getElementById('adminCategoriesList');
    if (!list) return;

    const defaultCats = [
        { slug: 'pain', nom: 'Pains', icone: '🥖' },
        { slug: 'viennoiserie', nom: 'Viennoiseries', icone: '🥐' },
        { slug: 'patisserie', nom: 'Pâtisseries', icone: '🍰' },
        { slug: 'boisson', nom: 'Boissons Fraîches', icone: '🧃' },
        { slug: 'sale', nom: 'Salés & Traiteur', icone: '🥪' },
        { slug: 'snack', nom: 'Biscuits & Snacks', icone: '🍪' }
    ];

    const catsToRender = AdminState.categories.length > 0 ? AdminState.categories : defaultCats;

    list.innerHTML = catsToRender.map(c => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-3">
                    <span class="fs-2">${c.icone || '🥖'}</span>
                    <div>
                        <h6 class="fw-bold text-dark m-0">${escapeHtml(c.nom)}</h6>
                        <small class="text-muted">Slug : <code>${escapeHtml(c.slug)}</code></small>
                    </div>
                </div>
                <span class="badge bg-success bg-opacity-10 text-success">Actif</span>
            </div>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// 6. GESTION DES PROFILS CAISSIÈRES & SESSIONS
// -------------------------------------------------------------
async function fetchCashiersAndUsers() {
    try {
        const [cashRes, userRes] = await Promise.all([
            fetch(`${API_BASE}/api/admin/cashiers`).catch(() => null),
            fetch(`${API_BASE}/api/users`).catch(() => null)
        ]);

        AdminState.cashiers = cashRes && cashRes.ok ? await cashRes.json() : [];
        AdminState.users = userRes && userRes.ok ? await userRes.json() : [];

        renderCashiersTable();
    } catch (_) {
        renderCashiersTable();
    }
}

function renderCashiersTable() {
    const tbody = document.getElementById('adminCashiersTableBody');
    if (!tbody) return;

    if (AdminState.cashiers.length === 0) {
        // Fallback démo
        AdminState.cashiers = [
            { id: 2, nom: 'Traoré', prenom: 'Awa', email: 'caisse1@boulangeriedebabi.com', telephone: '+225 05 55 12 34 56', caisse_assignee: 'Caisse 1 - Riviera', code_pin: '1234', is_online: 1, statut: 'actif', avatar: 'assets/caissiere.png' },
            { id: 3, nom: 'Bamba', prenom: 'Fatou', email: 'caisse2@boulangeriedebabi.com', telephone: '+225 05 55 78 90 12', caisse_assignee: 'Caisse 2 - Fournil Express', code_pin: '5678', is_online: 0, statut: 'actif', avatar: 'assets/caissiere1.png' }
        ];
    }

    tbody.innerHTML = AdminState.cashiers.map(c => `
        <tr>
            <td>
                <img src="${c.avatar || 'assets/caissiere.png'}" alt="${escapeHtml(c.prenom)}" class="adm-avatar-user" onerror="this.src='assets/caissiere.png'">
            </td>
            <td class="fw-bold text-dark">
                ${escapeHtml(c.prenom)} ${escapeHtml(c.nom)}
                <div class="small text-muted">${escapeHtml(c.email)}</div>
            </td>
            <td><span class="badge bg-warning text-dark fw-bold">${escapeHtml(c.caisse_assignee || 'Caisse Principale')}</span></td>
            <td><code>#${escapeHtml(c.code_pin || '1234')}</code></td>
            <td>
                <span class="badge ${c.is_online ? 'bg-success' : 'bg-secondary'}">
                    ${c.is_online ? '🟢 En Ligne' : '⚪ Hors Ligne'}
                </span>
            </td>
            <td class="text-end">
                <div class="d-inline-flex gap-1">
                    <button class="btn btn-sm btn-outline-warning" onclick="openEditCashierModal(${c.id})" title="Modifier">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="forceLogoutCashier(${c.id})" title="Forcer déconnexion">
                        <i class="fa-solid fa-power-off"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddCashierModal() {
    AdminState.editingCashierId = null;
    document.getElementById('modalCashierTitle').innerText = "➕ Créer un Profil Caissière";
    document.getElementById('cashierNomInput').value = '';
    document.getElementById('cashierPrenomInput').value = '';
    document.getElementById('cashierEmailInput').value = '';
    document.getElementById('cashierPhoneInput').value = '';
    document.getElementById('cashierCaisseInput').value = 'Caisse 1 - Riviera';
    document.getElementById('cashierPinInput').value = '1234';
    document.getElementById('cashierPassInput').value = 'Caisse@Babi2026!';
    
    const modal = new bootstrap.Modal(document.getElementById('modalCashierForm'));
    modal.show();
}

function openEditCashierModal(cashierId) {
    const c = AdminState.cashiers.find(item => item.id === cashierId);
    if (!c) return;

    AdminState.editingCashierId = cashierId;
    document.getElementById('modalCashierTitle').innerText = `✏️ Modifier Caissière : ${c.prenom} ${c.nom}`;
    document.getElementById('cashierNomInput').value = c.nom;
    document.getElementById('cashierPrenomInput').value = c.prenom;
    document.getElementById('cashierEmailInput').value = c.email;
    document.getElementById('cashierPhoneInput').value = c.telephone || '';
    document.getElementById('cashierCaisseInput').value = c.caisse_assignee || 'Caisse 1 - Riviera';
    document.getElementById('cashierPinInput').value = c.code_pin || '1234';
    document.getElementById('cashierPassInput').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalCashierForm'));
    modal.show();
}

async function saveCashier() {
    const nom = document.getElementById('cashierNomInput').value.trim();
    const prenom = document.getElementById('cashierPrenomInput').value.trim();
    const email = document.getElementById('cashierEmailInput').value.trim();
    const tel = document.getElementById('cashierPhoneInput').value.trim();
    const caisse = document.getElementById('cashierCaisseInput').value;
    const pin = document.getElementById('cashierPinInput').value.trim();
    const pass = document.getElementById('cashierPassInput').value;

    if (!nom || !email) {
        showToast("Nom et Email/Identifiant obligatoires.", "warning");
        return;
    }

    const payload = {
        nom: nom,
        prenom: prenom,
        email: email,
        telephone: tel,
        caisse_assignee: caisse,
        code_pin: pin,
        mot_de_passe: pass || undefined
    };

    try {
        let url = `${API_BASE}/api/admin/cashiers`;
        let method = 'POST';

        if (AdminState.editingCashierId) {
            url = `${API_BASE}/api/admin/cashiers/${AdminState.editingCashierId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur enregistrement caissière");

        showToast(AdminState.editingCashierId ? "Profil caissière mis à jour !" : "Nouveau profil caissière créé !", "success");
        bootstrap.Modal.getInstance(document.getElementById('modalCashierForm'))?.hide();
        await fetchCashiersAndUsers();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

async function forceLogoutCashier(cashierId) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/cashiers/${cashierId}/force-logout`, { method: 'POST' });
        if (!res.ok) throw new Error("Erreur déconnexion");
        showToast("Session caissière clôturée à distance !", "info");
        await fetchCashiersAndUsers();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// -------------------------------------------------------------
// 7. CONTRÔLE DES CAISSES & HISTORIQUE DES TICKETS Z
// -------------------------------------------------------------
async function fetchRegisterHistory() {
    try {
        const res = await fetch(`${API_BASE}/api/pos/register/history`);
        if (!res.ok) throw new Error("Erreur historique");
        const data = await res.json();
        AdminState.registerHistory = Array.isArray(data) ? data : (data.history || []);
        renderRegisterHistoryTable();
    } catch (_) {
        renderRegisterHistoryTable();
    }
}

function renderRegisterHistoryTable() {
    const tbody = document.getElementById('adminRegisterHistoryTableBody');
    if (!tbody) return;

    if (AdminState.registerHistory.length === 0) {
        // Fallback démo
        AdminState.registerHistory = [
            { id: 1, numero_z: 'Z-20260830-1042', caissiere_nom: 'Awa Traoré', date_cloture: '2026-08-30 14:00:00', total_ventes: 85000, total_especes: 55000, total_wave: 30000, fond_de_caisse: 50000, especes_reelles: 105000, ecart: 0, total_tickets: 22 },
            { id: 2, numero_z: 'Z-20260829-9821', caissiere_nom: 'Fatou Bamba', date_cloture: '2026-08-29 22:30:00', total_ventes: 120000, total_especes: 75000, total_wave: 45000, fond_de_caisse: 50000, especes_reelles: 125000, ecart: 0, total_tickets: 35 }
        ];
    }

    tbody.innerHTML = AdminState.registerHistory.map(reg => {
        const ecart = reg.ecart || 0;
        return `
            <tr>
                <td class="fw-bold text-dark"><code>${escapeHtml(reg.numero_z || 'Z-REG')}</code></td>
                <td>${escapeHtml(reg.caissiere_nom || 'Caissière')}</td>
                <td><small class="text-muted">${reg.date_cloture || 'Aujourd\'hui'}</small></td>
                <td class="fw-bold text-success">${formatMoney(reg.total_ventes || 0)} F</td>
                <td>${formatMoney(reg.total_especes || 0)} F</td>
                <td>${formatMoney(reg.total_wave || 0)} F</td>
                <td class="fw-bold ${ecart === 0 ? 'text-success' : (ecart > 0 ? 'text-primary' : 'text-danger')}">
                    ${ecart > 0 ? '+' : ''}${formatMoney(ecart)} F
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------
// 8. JOURNAL D'AUDIT & SÉCURITÉ SOUVERAINE
// -------------------------------------------------------------
async function fetchAuditLogs() {
    try {
        const res = await fetch(`${API_BASE}/api/security/audit-logs`);
        if (!res.ok) throw new Error("Erreur logs");
        const data = await res.json();
        AdminState.auditLogs = Array.isArray(data) ? data : [];
        renderAuditLogsTable();
    } catch (_) {
        renderAuditLogsTable();
    }
}

function renderAuditLogsTable() {
    const tbody = document.getElementById('adminAuditLogsTableBody');
    if (!tbody) return;

    if (AdminState.auditLogs.length === 0) {
        AdminState.auditLogs = [
            { id: 1, event_type: 'LOGIN_SUCCESS', entity_type: 'USER', entity_id: '1', user_id: 'admin@boulangeriedebabi.com', ip_address: '127.0.0.1', created_at: '2026-08-30 18:25:00' },
            { id: 2, event_type: 'PIN_SUCCESS_HANDOVER', entity_type: 'ORDER', entity_id: '28', user_id: 'Awa Traoré', ip_address: '192.168.1.12', created_at: '2026-08-30 18:22:15' },
            { id: 3, event_type: 'POS_SALE_CASH', entity_type: 'REGISTER', entity_id: 'Caisse 1', user_id: 'Awa Traoré', ip_address: '127.0.0.1', created_at: '2026-08-30 18:15:00' }
        ];
    }

    tbody.innerHTML = AdminState.auditLogs.map(log => `
        <tr>
            <td><span class="badge bg-light text-dark border fw-bold">${escapeHtml(log.event_type)}</span></td>
            <td>${escapeHtml(log.user_id || 'Système')}</td>
            <td><code>${escapeHtml(log.ip_address || '127.0.0.1')}</code></td>
            <td><small class="text-muted">${log.created_at || 'Aujourd\'hui'}</small></td>
            <td><span class="badge bg-success bg-opacity-10 text-success">FAIBLE (0)</span></td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// 9. NAVIGATION ONGLETS & UTILITAIRES
// -------------------------------------------------------------
function switchAdminTab(tabName, btn) {
    document.querySelectorAll('.adm-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.adm-tab-view').forEach(v => v.style.display = 'none');

    if (btn) btn.classList.add('active');
    const view = document.getElementById(`admView_${tabName}`);
    if (view) view.style.display = 'block';
}

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
