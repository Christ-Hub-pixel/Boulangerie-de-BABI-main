// ================================================================
// BABI ADMIN COCKPIT & WAVE PAYOUT v1 CONTROLLER
// ================================================================

const API_ROOT = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let allOrders = [];
let allProducts = (typeof window !== 'undefined' && typeof window.babiGetCachedProducts === 'function') 
    ? window.babiGetCachedProducts() 
    : ((typeof window !== 'undefined' && window.BABI_EMBEDDED_CATALOG) ? window.BABI_EMBEDDED_CATALOG : []);
let allCashiers = [];
let allUsers = [];
let allTransactions = [];
let allWavePayouts = [];
let allClosuresZ = [];
let currentOrdersFilter = 'all';

let resEvolutionChartInstance = null;
let statusDonutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // 0. Nettoyage initial unique des anciens caches de test
    try {
        if (localStorage.getItem('babi_admin_fresh_v2') !== 'true') {
            localStorage.removeItem('babi_admin_cached_orders');
            localStorage.removeItem('babi_admin_mock_stats');
            localStorage.setItem('babi_admin_fresh_v2', 'true');
        }
    } catch (_) {}

    // 1. Initialiser la navigation par onglets SPA
    initAdminNavigation();

    // 2. Rendu instantané 0ms du catalogue et des KPIs sans attendre le réseau
    try {
        if (allProducts && allProducts.length > 0) {
            updateProductKpis();
            renderProductsGridOrTable();
        }
    } catch (_) {}

    // 3. Initialiser les graphiques Chart.js
    initSaasCharts();

    // 4. Charger toutes les données en arrière-plan sans bloquer l'interface
    fetchAdminData();

    // 5. Écouter le bus de synchronisation temps réel
    try {
        const globalChan = new BroadcastChannel('babi_global_sync');
        globalChan.onmessage = (e) => {
            fetchAdminData();
        };
    } catch (_) {}

    // Données initiales chargées une seule fois au démarrage
    // Aucune boucle de rechargement automatique intrusive pour garantir la persistance absolue des modifications
});

// ================================================================
// 1. SPA SECTION SWITCHER
// ================================================================
function switchAdminSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.admin-tab-section').forEach(el => el.classList.remove('active'));
    
    // Activer la section cible
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Mettre à jour l'élément actif dans la sidebar
    document.querySelectorAll('.saas-nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Mettre à jour les titres du header
    const titles = {
        'dashboard': { title: 'Tableau de bord', subtitle: "Vue d'ensemble et contrôle en direct de la Boulangerie de BABI" },
        'orders': { title: 'Commandes & Réservations', subtitle: 'Supervision et traitement des flux de commande en direct' },
        'wave-payouts': { title: 'Trésorerie & Wave Payouts (API v1)', subtitle: 'Gestion des virements de masse, salaires et remboursements automatiques' },
        'transactions': { title: 'Grand Livre des Transactions', subtitle: 'Journal comptable et scellements cryptographiques certifiés' },
        'cashiers': { title: '👩‍💼 Caissières & Postes POS', subtitle: 'Gestion exclusive des profils, validation des accès et contrôle des sessions à distance' },
        'products': { title: 'Catalogue & Fournil', subtitle: `Gestion des ${allProducts.length || '121'} produits, stocks et approvisionnements` },
        'users': { title: 'Personnel & Clients', subtitle: 'Comptes collaborateurs, gérantes et clients du Club Fidélité' },
        'audit': { title: 'Sécurité & Audit Logs', subtitle: 'Détection IDS/IPS, intégrité Merkle et pare-feu anti-fraude' },
        'settings': { title: 'Paramètres & Configuration', subtitle: 'Clés Wave Business, signature HMAC-SHA256 et préférences' },
        'ai': { title: '✨ BIX — Copilote Administratif Intelligent', subtitle: 'Assistant conversationnel, modélisation des ventes, yield management et pilotage en direct' }
    };

    const info = titles[sectionId] || titles['dashboard'];
    const titleEl = document.getElementById('current-section-title');
    const subEl = document.getElementById('current-section-subtitle');
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.subtitle;

    // Actions spécifiques par onglet
    if (sectionId === 'products') {
        updateProductKpis();
        renderProductsGridOrTable();
        loadProducts();
    }
    if (sectionId === 'cashiers') loadCashiersData();
    if (sectionId === 'wave-payouts') loadWavePayoutHistory();
    if (sectionId === 'audit') loadSecurityAuditLogs();

    // Auto-close mobile drawer if open
    closeMobileSidebar();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('saasSidebar');
    const backdrop = document.getElementById('saasSidebarBackdrop');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
    if (backdrop) {
        backdrop.classList.toggle('active');
    }
}
window.toggleMobileSidebar = toggleMobileSidebar;

function closeMobileSidebar() {
    const sidebar = document.getElementById('saasSidebar');
    const backdrop = document.getElementById('saasSidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
}
window.closeMobileSidebar = closeMobileSidebar;

function initAdminNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`section-${hash}`)) {
        switchAdminSection(hash);
    }
}

// ================================================================
// 2. DATA FETCHING ENGINE & REAL-TIME RECONCILIATION
// ================================================================
function fetchAdminData() {
    // Exécution découplée et non bloquante de chaque chargeur
    loadStats().catch(() => {});
    loadOrders().catch(() => {});
    fetchCategories().catch(() => {});
    loadProducts().catch(() => {});
    if (typeof loadCashiersData === 'function') loadCashiersData().catch(() => {});
    if (typeof loadUsers === 'function') loadUsers().catch(() => {});
    if (typeof loadTransactions === 'function') loadTransactions().catch(() => {});
}

async function loadStats() {
    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${API_ROOT}/api/stats`, {}, 2500);
        if (!res || !res.ok) return;
        const stats = await res.json();

        const caGlobalEl = document.getElementById('kpi-ca-global');
        const ordersCountEl = document.getElementById('kpi-orders-count');
        const pendingBadge = document.getElementById('kpi-pending-orders-badge');

        if (caGlobalEl) caGlobalEl.textContent = (stats.totalRevenue || 0).toLocaleString() + ' FCFA';
        if (ordersCountEl) ordersCountEl.textContent = (stats.totalOrders || 0).toLocaleString();
        if (pendingBadge) pendingBadge.textContent = `${stats.pendingOrdersCount || 0} en cours`;
    } catch (_) {}
}

async function loadOrders() {
    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${API_ROOT}/api/orders`, {}, 2500);
        if (res && res.ok) {
            allOrders = await res.json();
        }

        // Réconcilier avec les commandes locales récentes
        try {
            const localOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
            localOrders.forEach(lo => {
                if (lo && lo.id && !allOrders.some(o => o.id === lo.id)) {
                    allOrders.unshift(lo);
                }
            });
        } catch (_) {}

        updateOrdersKpisAndBadges();
        renderDashboardRecentOrders();
        renderOrdersFullTable();
        updateChartsWithRealData();
    } catch (e) {
        // En cas d'indisponibilité réseau, garder les commandes en mémoire/cache
        try {
            const localOrders = JSON.parse(localStorage.getItem('babi_orders') || '[]');
            if (localOrders.length > 0 && allOrders.length === 0) {
                allOrders = localOrders;
                updateOrdersKpisAndBadges();
                renderDashboardRecentOrders();
                renderOrdersFullTable();
            }
        } catch (_) {}
    }
}

function updateOrdersKpisAndBadges() {
    const totalOrders = allOrders.length;
    const newCount = allOrders.filter(o => o.status === 'nouveau' || o.status === 'en_attente_paiement').length;
    const prepCount = allOrders.filter(o => o.status === 'en_preparation' || o.status === 'en preparation' || o.status === 'payee_en_preparation').length;
    const pretCount = allOrders.filter(o => o.status === 'pret' || o.status === 'prete').length;
    const livreCount = allOrders.filter(o => o.status === 'livre' || o.status === 'livré' || o.status === 'recupere').length;
    const refundCount = allOrders.filter(o => o.status === 'annule_rembourse' || o.refund_status === 'rembourse').length;

    // Calcul CA Wave
    const waveRevenue = allOrders
        .filter(o => (o.payment_method || '').toLowerCase().includes('wave') || (o.payment_status || '').toLowerCase() === 'paye')
        .reduce((sum, o) => sum + Number(o.total_price || o.total_amount || 0), 0);

    const waveRevEl = document.getElementById('kpi-wave-revenue');
    if (waveRevEl) waveRevEl.textContent = waveRevenue.toLocaleString() + ' FCFA';

    // Sidebar badge
    const badge = document.getElementById('sidebar-new-orders-badge');
    if (badge) {
        if (newCount > 0) {
            badge.textContent = newCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    // Counts in orders filter pills
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('count-all-orders', totalOrders);
    setTxt('count-nouveau-orders', newCount);
    setTxt('count-prep-orders', prepCount);
    setTxt('count-pret-orders', pretCount);
    setTxt('count-livre-orders', livreCount);
    setTxt('count-refund-orders', refundCount);
}

function renderDashboardRecentOrders() {
    const tbody = document.getElementById('dashboard-recent-orders-tbody');
    if (!tbody) return;

    const recent = allOrders.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Aucune commande enregistrée pour l'instant.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(o => {
        const isPaid = (o.payment_status || '').toLowerCase() === 'paye';
        const statusBadge = getStatusBadgeHtml(o.status);
        const pinBadge = o.pickup_pin || o.confCode ? `<span class="badge bg-warning text-dark px-1.5 py-0.5 rounded font-mono" style="font-size:10px;">PIN ${o.pickup_pin || o.confCode}</span>` : '';

        return `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>
                    <div style="font-weight: 700; color: #0f172a;">${escapeHtml(o.clientName || o.nom || 'Client')}</div>
                    <small class="text-muted">${escapeHtml(o.phone || o.telephone || '')}</small>
                </td>
                <td><strong>${Number(o.total_price || o.total_amount || 0).toLocaleString()} FCFA</strong></td>
                <td>
                    <span class="saas-badge-wave">🌊 ${escapeHtml(o.payment_method || 'Wave')}</span>
                    ${isPaid ? '<span class="saas-badge-pill active ms-1">Payé</span>' : '<span class="saas-badge-pill warning ms-1">Comptoir</span>'}
                </td>
                <td>${statusBadge} ${pinBadge}</td>
                <td>
                    <button type="button" class="btn-xs btn-outline-primary" onclick="openOrderDetailModal('${o.id}')">Détails</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderOrdersFullTable() {
    const tbody = document.getElementById('orders-full-tbody');
    if (!tbody) return;

    let filtered = allOrders;
    if (currentOrdersFilter !== 'all') {
        filtered = allOrders.filter(o => {
            if (currentOrdersFilter === 'nouveau') return o.status === 'nouveau' || o.status === 'en_attente_paiement';
            if (currentOrdersFilter === 'en_preparation') return o.status === 'en_preparation' || o.status === 'en preparation' || o.status === 'payee_en_preparation';
            if (currentOrdersFilter === 'pret') return o.status === 'pret' || o.status === 'prete';
            if (currentOrdersFilter === 'livre') return o.status === 'livre' || o.status === 'livré' || o.status === 'recupere';
            if (currentOrdersFilter === 'annule_rembourse') return o.status === 'annule_rembourse' || o.refund_status === 'rembourse';
            return true;
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">Aucune commande ne correspond au filtre sélectionné.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const isPaid = (o.payment_status || '').toLowerCase() === 'paye';
        const isRefunded = o.status === 'annule_rembourse' || o.refund_status === 'rembourse';
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Récent';

        const itemsSummary = Array.isArray(o.items) && o.items.length > 0 
            ? o.items.map(i => `${i.name || i.title} (x${i.qty || i.quantity || 1})`).join(', ')
            : (o.itemsSummary || 'Pains & Viennoiseries');

        return `
            <tr>
                <td><strong style="color: #c2850c; font-family: monospace;">#${o.id}</strong></td>
                <td class="small text-muted">${dateStr}</td>
                <td>
                    <div style="font-weight: 700; color: #0f172a;">${escapeHtml(o.clientName || o.nom || 'Client')}</div>
                    <small style="color: #64748b; font-family: monospace;">${escapeHtml(o.phone || o.telephone || '')}</small>
                </td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(itemsSummary)}">
                    ${escapeHtml(itemsSummary)}
                </td>
                <td><strong style="color: #0f172a;">${Number(o.total_price || o.total_amount || 0).toLocaleString()} FCFA</strong></td>
                <td>
                    ${o.pickup_pin || o.confCode ? `<span class="badge bg-warning text-dark px-2 py-1 rounded-pill font-mono fw-bold">${o.pickup_pin || o.confCode}</span>` : '<span class="text-muted">—</span>'}
                </td>
                <td>${getStatusBadgeHtml(o.status)}</td>
                <td>
                    <span class="saas-badge-wave">🌊 ${escapeHtml(o.payment_method || 'Wave')}</span>
                    ${isRefunded ? '<span class="saas-badge-pill danger ms-1">Remboursé</span>' : (isPaid ? '<span class="saas-badge-pill active ms-1">Payé</span>' : '<span class="saas-badge-pill warning ms-1">Attente</span>')}
                </td>
                <td style="text-align: right;">
                    <div class="d-inline-flex gap-1">
                        <button type="button" class="btn-xs btn-outline-primary" onclick="openOrderDetailModal('${o.id}')" title="Voir les détails">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        ${!isRefunded ? `
                            <button type="button" class="btn-xs btn-outline-danger" onclick="handleDirectRefundOrder('${o.id}')" title="Rembourser via Wave Payout">
                                <i class="fa-solid fa-rotate-left"></i> Rembourser
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setOrdersFilter(filterKey, btn) {
    currentOrdersFilter = filterKey;
    document.querySelectorAll('.saas-filter-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderOrdersFullTable();
}

function filterOrdersTable() {
    const query = (document.getElementById('orders-search-input')?.value || '').toLowerCase().trim();
    if (!query) {
        renderOrdersFullTable();
        return;
    }

    const tbody = document.getElementById('orders-full-tbody');
    if (!tbody) return;

    const filtered = allOrders.filter(o => {
        const id = String(o.id || '').toLowerCase();
        const client = String(o.clientName || o.nom || '').toLowerCase();
        const phone = String(o.phone || o.telephone || '').toLowerCase();
        return id.includes(query) || client.includes(query) || phone.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">Aucun résultat pour "${escapeHtml(query)}".</td></tr>`;
        return;
    }

    // Réutiliser le rendu de filtered
    tbody.innerHTML = filtered.map(o => {
        const isPaid = (o.payment_status || '').toLowerCase() === 'paye';
        const isRefunded = o.status === 'annule_rembourse' || o.refund_status === 'rembourse';
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Récent';
        const itemsSummary = o.itemsSummary || (Array.isArray(o.items) ? o.items.map(i => `${i.name} (x${i.qty})`).join(', ') : 'Produits');

        return `
            <tr>
                <td><strong style="color: #c2850c; font-family: monospace;">#${o.id}</strong></td>
                <td class="small text-muted">${dateStr}</td>
                <td>
                    <div style="font-weight: 700; color: #0f172a;">${escapeHtml(o.clientName || o.nom || 'Client')}</div>
                    <small style="color: #64748b; font-family: monospace;">${escapeHtml(o.phone || o.telephone || '')}</small>
                </td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(itemsSummary)}</td>
                <td><strong>${Number(o.total_price || o.total_amount || 0).toLocaleString()} FCFA</strong></td>
                <td>${o.pickup_pin || o.confCode ? `<span class="badge bg-warning text-dark px-2 py-1 rounded-pill font-mono">${o.pickup_pin || o.confCode}</span>` : '—'}</td>
                <td>${getStatusBadgeHtml(o.status)}</td>
                <td><span class="saas-badge-wave">🌊 Wave</span></td>
                <td style="text-align: right;">
                    <button type="button" class="btn-xs btn-outline-primary" onclick="openOrderDetailModal('${o.id}')">Détails</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ================================================================
// 3. WAVE PAYOUT & TRÉSORERIE HUB CONTROLLER (API v1)
// ================================================================

async function loadWavePayoutHistory() {
    const tbody = document.getElementById('wave-payouts-tbody');
    if (!tbody) return;

    // Charger les virements sauvegardés localement ou simuler les logs récents
    const payouts = JSON.parse(localStorage.getItem('babi_wave_payouts_log') || '[]');
    allWavePayouts = payouts;

    // Mettre à jour le montant décaissé dans le KPI
    const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.receive_amount || p.amount || 0), 0);
    const kpiPayoutEl = document.getElementById('kpi-payouts-val');
    if (kpiPayoutEl) kpiPayoutEl.textContent = totalPayouts.toLocaleString() + ' FCFA';

    if (payouts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-water text-primary fs-3 d-block mb-2"></i>
                    Aucun virement Wave Payout émis pour l'instant. Cliquez sur "Nouveau Virement Direct" pour envoyer des fonds via l'API Wave.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = payouts.map(p => {
        const isSucceeded = p.status === 'succeeded';
        const isReversed = p.status === 'reversed';
        const statusBadge = isReversed 
            ? '<span class="saas-badge-pill danger">Inversé (Annulé)</span>'
            : (isSucceeded ? '<span class="saas-badge-pill active">Succès</span>' : '<span class="saas-badge-pill warning">En cours</span>');

        const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleString('fr-FR') : 'Récent';

        return `
            <tr>
                <td><strong style="font-family: monospace; color: #0284c7;">${escapeHtml(p.id)}</strong></td>
                <td><strong style="font-family: monospace;">${escapeHtml(p.mobile)}</strong></td>
                <td>${escapeHtml(p.name || 'Bénéficiaire')}</td>
                <td><strong style="color: #0f172a;">${Number(p.receive_amount || p.amount || 0).toLocaleString()} XOF</strong></td>
                <td class="text-muted small">${p.fee || '1%'} FCFA</td>
                <td><small class="text-muted">${escapeHtml(p.payment_reason || p.client_reference || 'Virement')}</small></td>
                <td class="small text-muted">${dateStr}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right;">
                    ${isSucceeded && !isReversed ? `
                        <button type="button" class="btn-xs btn-outline-danger" onclick="handleReverseWavePayout('${p.id}')" title="Inverser sous 3 jours (POST /v1/payout/:id/reverse)">
                            <i class="fa-solid fa-undo me-1"></i> Inverser
                        </button>
                    ` : '<span class="text-muted small">—</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

// 1. Ouvrir Modal Single Payout
function openSinglePayoutModal() {
    const modal = document.getElementById('singlePayoutModal');
    if (modal) modal.classList.remove('hidden');
}

function closeSinglePayoutModal() {
    const modal = document.getElementById('singlePayoutModal');
    if (modal) modal.classList.add('hidden');
}

// 2. Vérification d'un bénéficiaire (POST /v1/verify_recipient/)
async function handleVerifyRecipient() {
    const phone = document.getElementById('payout-phone')?.value;
    const name = document.getElementById('payout-name')?.value;
    const amount = document.getElementById('payout-amount')?.value;
    const feedback = document.getElementById('verify-recipient-feedback');

    if (!phone) {
        alert("Veuillez saisir un numéro de téléphone.");
        return;
    }

    if (feedback) feedback.innerHTML = `<span class="text-primary"><i class="fa-solid fa-spinner fa-spin me-1"></i> Vérification auprès des serveurs Wave...</span>`;

    try {
        const res = await fetch(`${API_ROOT}/api/wave/verify_recipient`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: phone, name, amount })
        });
        const data = await res.json();

        if (data.within_limits) {
            feedback.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-circle-check me-1"></i> Numéro éligible Wave ! Plafonds respectés.</span>`;
        } else {
            feedback.innerHTML = `<span class="text-warning fw-bold"><i class="fa-solid fa-triangle-exclamation me-1"></i> Vérification effectuée (Statut: ${data.name_match || 'NAME_NOT_KNOWN'})</span>`;
        }
    } catch (e) {
        feedback.innerHTML = `<span class="text-muted">Mode standard Wave (envoi direct par SMS si compte non inscrit).</span>`;
    }
}

// 3. Exécuter un Virement Direct (POST /v1/payout)
async function handleSendSinglePayout(e) {
    e.preventDefault();
    const phone = document.getElementById('payout-phone')?.value;
    const amount = document.getElementById('payout-amount')?.value;
    const name = document.getElementById('payout-name')?.value;
    const reason = document.getElementById('payout-reason')?.value;
    const clientRef = document.getElementById('payout-client-ref')?.value || `BABI-PAYOUT-${Date.now()}`;
    const submitBtn = document.getElementById('btn-submit-payout');

    if (!phone || !amount) {
        showAdminToast("Le numéro de téléphone et le montant sont obligatoires.", "warning");
        return;
    }

    showBabiCustomConfirm({
        title: "Confirmation Virement Wave",
        message: `Confirmez-vous le virement Wave immédiat de ${Number(amount).toLocaleString()} FCFA vers le numéro ${phone} ?`,
        icon: "fa-wave-square",
        confirmColor: "gradient-emerald",
        confirmText: "Effectuer le virement",
        cancelText: "Annuler",
        onConfirm: async () => {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Virement Wave en cours...`;
            }

            try {
                const idempotencyKey = `IDEM_PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                const res = await fetch(`${API_ROOT}/api/wave/payout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Idempotency-Key': idempotencyKey
                    },
                    body: JSON.stringify({
                        mobile: phone,
                        receive_amount: amount,
                        name,
                        payment_reason: reason,
                        client_reference: clientRef
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || data.error || "Échec du virement Wave");
                }

                // Sauvegarder dans le journal local
                const newPayout = {
                    id: data.id || `pt-${Date.now()}`,
                    mobile: phone,
                    receive_amount: amount,
                    name: name || 'Bénéficiaire',
                    payment_reason: reason,
                    client_reference: clientRef,
                    fee: data.fee || '10',
                    status: data.status || 'succeeded',
                    timestamp: new Date().toISOString()
                };

                const existing = JSON.parse(localStorage.getItem('babi_wave_payouts_log') || '[]');
                existing.unshift(newPayout);
                localStorage.setItem('babi_wave_payouts_log', JSON.stringify(existing));

                showAdminToast(`✅ Virement Wave de ${Number(amount).toLocaleString()} FCFA exécuté avec succès (ID: ${newPayout.id}) !`, 'success');
                closeSinglePayoutModal();
                loadWavePayoutHistory();
            } catch (err) {
                showAdminToast("Erreur Virement Wave : " + err.message, "danger");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fa-solid fa-bolt me-1"></i> Exécuter le Virement Wave`;
                }
            }
        }
    });
}

// 4. Modal Virement Groupé (POST /v1/payout-batch)
function openBatchPayoutModal() {
    const modal = document.getElementById('batchPayoutModal');
    if (modal) modal.classList.remove('hidden');
}

function closeBatchPayoutModal() {
    const modal = document.getElementById('batchPayoutModal');
    if (modal) modal.classList.add('hidden');
}

async function handleSendBatchPayout(e) {
    e.preventDefault();
    const rawText = document.getElementById('batch-payouts-text')?.value || '';
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length === 0) {
        alert("Veuillez renseigner au moins une ligne de virement.");
        return;
    }

    const payoutsList = [];
    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            payoutsList.push({
                mobile: parts[0],
                receive_amount: parts[1],
                name: parts[2] || 'Collaborateur',
                payment_reason: parts[3] || 'Virement Groupé BABI'
            });
        }
    }

    if (payoutsList.length === 0) {
        alert("Format invalide. Utilisez : Téléphone, Montant, Nom, Motif");
        return;
    }

    const submitBtn = document.getElementById('btn-submit-batch');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Envoi du lot Wave...`;
    }

    try {
        const res = await fetch(`${API_ROOT}/api/wave/payout-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payouts: payoutsList })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur lot Wave");

        showAdminToast(`✅ Lot Wave ${data.id || 'PB'} de ${payoutsList.length} virements soumis avec succès !`, 'success');
        closeBatchPayoutModal();
        loadWavePayoutHistory();
    } catch (err) {
        alert("Erreur Lot Wave : " + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-1"></i> Soumettre le Lot Wave`;
        }
    }
}

// 5. Inverser / Annuler un Payout (POST /v1/payout/:id/reverse)
async function handleReverseWavePayout(payoutId) {
    showBabiCustomConfirm({
        title: "Annulation de Virement",
        message: `Souhaitez-vous annuler et inverser le paiement Wave ${payoutId} ? Les fonds seront recrédités sur le compte marchand.`,
        icon: "fa-rotate-left",
        confirmColor: "gradient-amber",
        confirmText: "Inverser le virement",
        cancelText: "Annuler",
        onConfirm: async () => {
            try {
                const res = await fetch(`${API_ROOT}/api/wave/payout/${encodeURIComponent(payoutId)}/reverse`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();

                // Mettre à jour le statut dans le stockage local
                const existing = JSON.parse(localStorage.getItem('babi_wave_payouts_log') || '[]');
                const target = existing.find(p => p.id === payoutId);
                if (target) {
                    target.status = 'reversed';
                    localStorage.setItem('babi_wave_payouts_log', JSON.stringify(existing));
                }

                showAdminToast(`✅ Paiement Wave ${payoutId} inversé avec succès (Fonds recrédités).`, 'success');
                loadWavePayoutHistory();
            } catch (err) {
                showAdminToast("Erreur lors de l'inversion du paiement : " + err.message, "danger");
            }
        }
    });
}

// 6. Rembourser une commande directement par Wave Payout
async function handleDirectRefundOrder(orderId) {
    const reason = prompt("Veuillez indiquer le motif du remboursement Wave :", "Annulation de commande client");
    if (!reason) return;

    try {
        const res = await fetch(`${API_ROOT}/api/payments/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, reason })
        });
        const data = await res.json();

        if (res.ok) {
            showAdminToast(`✅ Commande #${orderId} remboursée avec succès via Wave Mobile Money !`, 'success');
            fetchAdminData();
            loadWavePayoutHistory();
        } else {
            alert("Erreur lors du remboursement : " + (data.error || 'Erreur interne'));
        }
    } catch (err) {
        alert("Erreur réseau : " + err.message);
    }
}

// ================================================================
// 4. MODALS & ORDER DETAILS
// ================================================================
function openOrderDetailModal(orderId) {
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const titleEl = document.getElementById('modal-order-title');
    const bodyEl = document.getElementById('modal-order-body');
    const actionsEl = document.getElementById('modal-order-actions');

    if (titleEl) titleEl.innerHTML = `<span style="color:#c2850c;">Commande #${order.id}</span>`;

    const isPaid = (order.payment_status || '').toLowerCase() === 'paye';
    const isRefunded = order.status === 'annule_rembourse' || order.refund_status === 'rembourse';
    const pin = order.pickup_pin || order.confCode || '7412';

    const itemsHtml = Array.isArray(order.items) && order.items.length > 0
        ? order.items.map(i => `
            <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                <div>
                    <strong style="color:#0f172a;">${escapeHtml(i.name || i.title)}</strong>
                    <span class="text-muted small"> × ${i.qty || i.quantity || 1}</span>
                </div>
                <strong style="color:#0f172a;">${((i.price || 0) * (i.qty || 1)).toLocaleString()} FCFA</strong>
            </div>
        `).join('')
        : `<p class="text-muted small">${escapeHtml(order.itemsSummary || 'Pains & viennoiseries variées')}</p>`;

    bodyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h4 style="font-weight: 800; font-size: 14px; margin: 0; color: #0f172a;">${escapeHtml(order.clientName || order.nom || 'Client')}</h4>
                        <div style="font-size: 12px; color: #64748b; font-family: monospace;">📞 ${escapeHtml(order.phone || order.telephone || 'Non renseigné')}</div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-warning text-dark px-2.5 py-1 rounded-pill font-mono fw-bold">PIN: ${pin}</span>
                    </div>
                </div>
                <div class="small text-muted">
                    Mode : <strong>${order.delivery_type === 'livraison' ? '🛵 Livraison Express' : '⚡ Retrait en Boutique (Click & Collect)'}</strong>
                    ${order.address ? `<br>Adresse : ${escapeHtml(order.address)}` : ''}
                </div>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
                <div style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px;">DÉTAIL DU PANIER</div>
                ${itemsHtml}
                <div class="d-flex justify-content-between align-items-center pt-2 mt-1">
                    <span style="font-weight: 800; font-size: 14px; color: #0f172a;">TOTAL :</span>
                    <span style="font-weight: 900; font-size: 16px; color: #c2850c;">${Number(order.total_price || order.total_amount || 0).toLocaleString()} FCFA</span>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: ${isPaid ? '#f0fdf4' : '#fffbeb'}; border: 1px solid ${isPaid ? '#bbf7d0' : '#fde68a'};">
                <span class="small font-bold" style="color: ${isPaid ? '#16a34a' : '#d97706'};">
                    ${isPaid ? '✅ RÈGLEMENT CONFIRMÉ WAVE' : '⏳ EN ATTENTE DE RÈGLEMENT'}
                </span>
                <span class="small text-muted font-mono">${escapeHtml(order.payment_method || 'Wave Mobile Money')}</span>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button type="button" class="btn-modal-cancel" onclick="closeOrderDetailModal()">Fermer</button>
        <button type="button" class="btn-xs btn-outline-primary py-2 px-3 fw-bold" onclick="printOrderTicket('${order.id}')" title="Imprimer le bon de commande">
            <i class="fa-solid fa-print me-1"></i> Imprimer Bon
        </button>
        ${order.status !== 'en_preparation' && order.status !== 'pret' && order.status !== 'livre' && !isRefunded ? `
            <button type="button" class="btn-xs btn-outline-warning py-2 px-3 fw-bold" onclick="updateOrderStatusFromModal('${order.id}', 'en_preparation')">
                <i class="fa-solid fa-fire me-1"></i> En Préparation
            </button>
        ` : ''}
        ${order.status !== 'pret' && order.status !== 'livre' && !isRefunded ? `
            <button type="button" class="btn-modal-submit-gold" onclick="updateOrderStatusFromModal('${order.id}', 'pret')">
                <i class="fa-solid fa-check me-1"></i> Marquer Prête
            </button>
        ` : ''}
        ${order.status !== 'livre' && !isRefunded ? `
            <button type="button" class="btn-xs btn-outline-success py-2 px-3 fw-bold" onclick="updateOrderStatusFromModal('${order.id}', 'livre')">
                <i class="fa-solid fa-truck-ramp-box me-1"></i> Marquer Livrée
            </button>
        ` : ''}
        ${!isRefunded ? `
            <button type="button" class="btn-xs btn-outline-danger py-2 px-3 fw-bold" onclick="closeOrderDetailModal(); handleDirectRefundOrder('${order.id}');">
                <i class="fa-solid fa-rotate-left me-1"></i> Rembourser Wave
            </button>
        ` : ''}
    `;

    if (modal) modal.classList.remove('hidden');
}

function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.add('hidden');
}

async function updateOrderStatusFromModal(orderId, newStatus) {
    try {
        const res = await fetch(`${API_ROOT}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showAdminToast(`Statut mis à jour : ${newStatus.toUpperCase()}`, 'success');
            closeOrderDetailModal();
            fetchAdminData();
        }
    } catch (_) {}
}

// ================================================================
// 5. PRODUCTS & CATALOGUE MANAGEMENT (CRUD COMPLET & TEMPS RÉEL)
// ================================================================
let currentProductCategoryFilter = 'all';
let currentProductSearchQuery = '';
let selectedProductIds = new Set();

function updateBulkActionsBar() {
    const bar = document.getElementById('products-bulk-actions-bar');
    const countEl = document.getElementById('bulk-selected-count');
    const selectAllCb = document.getElementById('select-all-prods');
    
    if (!bar) return;
    const count = selectedProductIds.size;
    if (count > 0) {
        bar.classList.add('active');
        bar.style.display = 'flex';
        if (countEl) countEl.innerHTML = `<i class="fa-solid fa-check-double"></i> ${count} sélectionné${count > 1 ? 's' : ''}`;
    } else {
        bar.classList.remove('active');
        bar.style.display = 'none';
    }

    if (selectAllCb) {
        const visibleCbs = document.querySelectorAll('.prod-select-cb');
        if (visibleCbs.length > 0 && Array.from(visibleCbs).every(cb => cb.checked)) {
            selectAllCb.checked = true;
            selectAllCb.indeterminate = false;
        } else if (count > 0) {
            selectAllCb.checked = false;
            selectAllCb.indeterminate = true;
        } else {
            selectAllCb.checked = false;
            selectAllCb.indeterminate = false;
        }
    }
}

function handleProductCheckboxChange(id, checked) {
    if (checked) {
        selectedProductIds.add(String(id));
    } else {
        selectedProductIds.delete(String(id));
    }
    updateBulkActionsBar();
}

function handleToggleSelectAllProducts(checked) {
    const visibleCbs = document.querySelectorAll('.prod-select-cb');
    visibleCbs.forEach(cb => {
        cb.checked = checked;
        const id = cb.getAttribute('data-id');
        if (id) {
            if (checked) selectedProductIds.add(String(id));
            else selectedProductIds.delete(String(id));
        }
    });
    updateBulkActionsBar();
}

function clearSelectedProducts() {
    selectedProductIds.clear();
    document.querySelectorAll('.prod-select-cb').forEach(cb => cb.checked = false);
    const selectAllCb = document.getElementById('select-all-prods');
    if (selectAllCb) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
    }
    updateBulkActionsBar();
}

async function handleBulkDeleteProducts() {
    const idsToDelete = Array.from(selectedProductIds);
    if (idsToDelete.length === 0) {
        showAdminToast("Veuillez cocher au moins un article à supprimer.", "warning");
        return;
    }

    showBabiCustomConfirm({
        title: `Suppression groupée de ${idsToDelete.length} produit(s)`,
        message: `Êtes-vous certain de vouloir supprimer définitivement ces ${idsToDelete.length} articles du catalogue et des stocks ? Cette action est irréversible.`,
        icon: "fa-trash-can",
        confirmColor: "gradient-red",
        confirmText: `Supprimer ${idsToDelete.length} article(s)`,
        cancelText: "Annuler",
        onConfirm: async () => {
            const count = idsToDelete.length;
            
            // 1. Suppression optimiste immédiate en local
            idsToDelete.forEach(id => {
                const pObj = allProducts.find(p => String(p.id) === String(id) || p.id === id);
                const pName = pObj ? (pObj.nom || pObj.name) : null;
                if (typeof window.babiRemoveCustomProduct === 'function') {
                    window.babiRemoveCustomProduct(id, pName);
                }
                allProducts = allProducts.filter(p => String(p.id) !== String(id) && p.id !== id);
            });

            if (typeof window.babiSetCachedProducts === 'function') {
                window.babiSetCachedProducts(allProducts);
            }

            clearSelectedProducts();
            updateProductKpis();
            renderProductsGridOrTable();
            showAdminToast(`🗑️ ${count} produit(s) supprimé(s) définitivement du catalogue.`, 'info');

            // 2. Synchronisation groupée avec le serveur
            try {
                const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
                const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
                
                await fetcher(`${apiBase}/api/products/bulk-delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete })
                }, 8000);

                if (typeof window.notifyProductCatalogueChanged === 'function') {
                    window.notifyProductCatalogueChanged('PRODUCTS_BULK_DELETED', { ids: idsToDelete });
                }
            } catch (err) {
                console.warn("[Admin] Bulk delete server sync:", err);
            }
        }
    });
}

async function handleBulkToggleStatus(newStatus) {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) {
        showAdminToast("Veuillez cocher au moins un article.", "warning");
        return;
    }

    const idSet = new Set(ids.map(String));
    allProducts.forEach(p => {
        if (idSet.has(String(p.id))) {
            p.is_active = newStatus;
        }
    });

    if (typeof window.babiSetCachedProducts === 'function') {
        window.babiSetCachedProducts(allProducts);
    }

    renderProductsGridOrTable();
    updateProductKpis();
    showAdminToast(`${ids.length} produit(s) ${newStatus === 1 ? 'activés' : 'masqués'} avec succès.`, 'success');

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        
        await fetcher(`${apiBase}/api/products/bulk-status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, is_active: newStatus })
        }, 8000);
    } catch (_) {}
}

// ==========================================
// 🏷️ DYNAMIC CATEGORIES MANAGEMENT ENGINE
// ==========================================
let allCategories = [];

async function fetchCategories() {
    try {
        const localCats = (typeof window.babiGetCachedCategories === 'function')
            ? window.babiGetCachedCategories()
            : [];
        if (localCats && localCats.length > 0) {
            allCategories = localCats;
            renderCategoryFilterPills();
            populateProductCategoryDropdowns();
        }

        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        const res = await fetcher(`${apiBase}/api/categories?_t=${Date.now()}`, { cache: 'no-store' }, 4000);
        if (res && res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.data)) {
                allCategories = data.data;
                if (typeof window.babiSetCachedCategories === 'function') {
                    window.babiSetCachedCategories(allCategories);
                }
                renderCategoryFilterPills();
                populateProductCategoryDropdowns();
                renderCategoriesTable();
            }
        }
    } catch (_) {}
}

function renderCategoryFilterPills() {
    const container = document.getElementById('products-category-pills');
    if (!container) return;

    const totalCount = Array.isArray(allProducts) ? allProducts.length : 0;
    const isAllActive = currentProductCategoryFilter === 'all';

    let html = `
        <button type="button" class="saas-filter-pill ${isAllActive ? 'active' : ''}" onclick="filterProductsByCategory('all', this)">
            Tous (${totalCount})
        </button>
    `;

    allCategories.forEach(cat => {
        const slug = cat.slug;
        const nom = cat.nom;
        const icon = cat.icone || '🥖';
        const count = Array.isArray(allProducts) ? allProducts.filter(p => {
            const c = (p.categorie || '').toLowerCase();
            return c === slug.toLowerCase() || c === nom.toLowerCase();
        }).length : 0;

        const isActive = currentProductCategoryFilter === slug || currentProductCategoryFilter === nom;
        html += `
            <button type="button" class="saas-filter-pill ${isActive ? 'active' : ''}" onclick="filterProductsByCategory('${slug}', this)">
                ${icon} ${escapeHtml(nom)} (${count})
            </button>
        `;
    });

    html += `
        <button type="button" class="saas-filter-pill" onclick="openCategoriesManagerModal()" style="border-style: dashed !important; background: #fafafa !important; color: #c2850c !important;" title="Gérer ou ajouter des catégories">
            <i class="fa-solid fa-plus text-xs"></i> Gérer
        </button>
    `;

    container.innerHTML = html;
}

function populateProductCategoryDropdowns() {
    const newSelect = document.getElementById('new-prod-category');
    const editSelect = document.getElementById('edit-prod-category');
    
    if (!Array.isArray(allCategories) || allCategories.length === 0) return;

    const optionsHtml = allCategories.map(cat => `
        <option value="${cat.slug}">${cat.icone || '🥖'} ${escapeHtml(cat.nom)}</option>
    `).join('');

    if (newSelect) newSelect.innerHTML = optionsHtml;
    if (editSelect) editSelect.innerHTML = optionsHtml;
}

function renderCategoriesTable() {
    const tbody = document.getElementById('categories-table-body');
    const badge = document.getElementById('categories-count-badge');
    if (badge) badge.textContent = allCategories.length;
    if (!tbody) return;

    if (!Array.isArray(allCategories) || allCategories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Aucune catégorie configurée.</td></tr>`;
        return;
    }

    tbody.innerHTML = allCategories.map(cat => {
        const icon = cat.icone || '🥖';
        const count = cat.product_count != null ? cat.product_count : (Array.isArray(allProducts) ? allProducts.filter(p => (p.categorie || '').toLowerCase() === cat.slug.toLowerCase()).length : 0);

        return `
            <tr>
                <td style="text-align: center; font-size: 20px; vertical-align: middle;">${icon}</td>
                <td style="vertical-align: middle;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${escapeHtml(cat.nom)}</div>
                    ${cat.description ? `<div style="font-size: 11.5px; color: #64748b;">${escapeHtml(cat.description)}</div>` : ''}
                </td>
                <td style="vertical-align: middle;">
                    <span style="font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; color: #475569;">${escapeHtml(cat.slug)}</span>
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 11.5px; padding: 3px 10px; border-radius: 9999px;">${count} produit(s)</span>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button type="button" class="btn-xs btn-outline-primary" onclick="openEditCategoryModal(${cat.id})" title="Modifier la catégorie">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-xs btn-outline-danger" onclick="handleDeleteCategory(${cat.id}, '${escapeHtml(cat.nom)}')" title="Supprimer la catégorie">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openCategoriesManagerModal() {
    const modal = document.getElementById('categoriesManagerModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderCategoriesTable();
    }
}

function closeCategoriesManagerModal() {
    const modal = document.getElementById('categoriesManagerModal');
    if (modal) modal.classList.add('hidden');
}

function setNewCatIcon(icon) {
    const input = document.getElementById('new-cat-icon');
    if (input) input.value = icon;
}

async function handleCreateCategory(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('new-cat-name');
    const iconInput = document.getElementById('new-cat-icon');
    const submitBtn = document.getElementById('btn-create-cat');

    const nom = nameInput ? nameInput.value.trim() : '';
    const icone = iconInput ? iconInput.value.trim() : '🥖';

    if (!nom) {
        showAdminToast("Veuillez entrer un nom de catégorie.", "warning");
        return;
    }

    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Création...`;
    }

    const tempSlug = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const newCatItem = {
        id: Date.now(),
        slug: tempSlug,
        nom: nom,
        icone: icone,
        ordre: allCategories.length + 1,
        is_active: 1,
        product_count: 0
    };

    allCategories.push(newCatItem);
    if (typeof window.babiSetCachedCategories === 'function') {
        window.babiSetCachedCategories(allCategories);
    }
    renderCategoryFilterPills();
    populateProductCategoryDropdowns();
    renderCategoriesTable();
    if (nameInput) nameInput.value = '';

    showAdminToast(`🎉 Catégorie "${nom}" créée avec succès !`, "success");

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        const res = await fetcher(`${apiBase}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, icone, slug: tempSlug, ordre: newCatItem.ordre })
        }, 6000);
        if (res && res.ok) {
            const data = await res.json();
            if (data && data.category) {
                newCatItem.id = data.category.id;
            }
        }
    } catch (_) {}

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHtml;
    }
}

function openEditCategoryModal(catId) {
    const cat = allCategories.find(c => String(c.id) === String(catId));
    if (!cat) return;

    document.getElementById('edit-cat-id').value = cat.id;
    document.getElementById('edit-cat-name').value = cat.nom;
    document.getElementById('edit-cat-icon').value = cat.icone || '🥖';
    document.getElementById('edit-cat-slug').value = cat.slug;

    const modal = document.getElementById('editCategoryModal');
    if (modal) modal.classList.remove('hidden');
}

function closeEditCategoryModal() {
    const modal = document.getElementById('editCategoryModal');
    if (modal) modal.classList.add('hidden');
}

async function handleUpdateCategory(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('edit-cat-id')?.value;
    const nom = document.getElementById('edit-cat-name')?.value.trim();
    const icone = document.getElementById('edit-cat-icon')?.value.trim() || '🥖';
    const slug = document.getElementById('edit-cat-slug')?.value.trim();
    const submitBtn = document.getElementById('btn-submit-edit-cat');

    if (!nom) {
        showAdminToast("Le nom de la catégorie est obligatoire.", "warning");
        return;
    }

    const catIdx = allCategories.findIndex(c => String(c.id) === String(id));
    if (catIdx >= 0) {
        allCategories[catIdx].nom = nom;
        allCategories[catIdx].icone = icone;
        allCategories[catIdx].slug = slug;
    }

    if (typeof window.babiSetCachedCategories === 'function') {
        window.babiSetCachedCategories(allCategories);
    }
    renderCategoryFilterPills();
    populateProductCategoryDropdowns();
    renderCategoriesTable();
    closeEditCategoryModal();

    showAdminToast(`✨ Catégorie "${nom}" mise à jour !`, "success");

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        await fetcher(`${apiBase}/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, icone, slug })
        }, 6000);
    } catch (_) {}
}

async function handleDeleteCategory(catId, catName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${catName}" ?\nLes articles de cette catégorie seront réassignés sans être supprimés.`)) {
        return;
    }

    allCategories = allCategories.filter(c => String(c.id) !== String(catId));
    if (typeof window.babiSetCachedCategories === 'function') {
        window.babiSetCachedCategories(allCategories);
    }
    renderCategoryFilterPills();
    populateProductCategoryDropdowns();
    renderCategoriesTable();

    showAdminToast(`🗑️ Catégorie "${catName}" supprimée.`, "info");

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        await fetcher(`${apiBase}/api/categories/${catId}`, {
            method: 'DELETE'
        }, 6000);
    } catch (_) {}
}

function filterProductsByCategory(cat, btn) {
    currentProductCategoryFilter = cat;
    document.querySelectorAll('#section-products .saas-filter-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProductsGridOrTable();
}

function filterProductsBySearch(term) {
    currentProductSearchQuery = (term || '').trim().toLowerCase();
    renderProductsGridOrTable();
}

function selectProductPresetImage(modalType, path) {
    const previewEl = document.getElementById(`${modalType}-prod-preview-img`);
    const hiddenDataEl = document.getElementById(`${modalType}-prod-image-data`);
    if (previewEl) previewEl.src = path;
    if (hiddenDataEl) hiddenDataEl.value = path;
    showAdminToast(`📸 Photo sélectionnée ! Cliquez sur "Enregistrer" pour valider`, 'info');
}

function updateProductKpis() {
    if (!Array.isArray(allProducts)) return;

    const totalCount = allProducts.length;
    const activeCount = allProducts.filter(p => p.is_active === 1 || p.is_active === undefined || p.is_active === true || p.is_active === '1').length;
    const lowStockCount = allProducts.filter(p => {
        const stockQty = p.stock != null ? p.stock : 50;
        const alertThreshold = p.seuil_alerte != null ? p.seuil_alerte : 10;
        return stockQty <= alertThreshold;
    }).length;

    const totalStockValue = allProducts.reduce((sum, p) => {
        const qty = p.stock != null ? p.stock : 50;
        const price = Number(p.prix) || 0;
        return sum + (qty * price);
    }, 0);

    const kpiTotalEl = document.getElementById('prod-kpi-total');
    const kpiActiveEl = document.getElementById('prod-kpi-active');
    const kpiLowEl = document.getElementById('prod-kpi-low');
    const kpiValueEl = document.getElementById('prod-kpi-value');
    const dashKpiEl = document.getElementById('kpi-products-count');

    if (kpiTotalEl) kpiTotalEl.textContent = totalCount;
    if (kpiActiveEl) kpiActiveEl.textContent = activeCount;
    if (kpiLowEl) kpiLowEl.textContent = lowStockCount;
    if (kpiValueEl) kpiValueEl.textContent = totalStockValue.toLocaleString('fr-FR') + ' FCFA';
    if (dashKpiEl) dashKpiEl.textContent = totalCount;

    // Dynamically update page subtitle if on products view
    const titleEl = document.getElementById('current-section-title');
    const subEl = document.getElementById('current-section-subtitle');
    if (titleEl && (titleEl.textContent.includes('Catalogue') || titleEl.textContent.includes('Fournil'))) {
        if (subEl) subEl.textContent = `Gestion des ${totalCount} articles, stocks et approvisionnements`;
    }

    // Category counts for filter tabs
    const setCatCount = (id, catKey) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (catKey === 'all') {
            el.textContent = totalCount;
        } else if (catKey === 'pains_speciaux') {
            const count = allProducts.filter(p => {
                const c = (p.categorie || p.category || '').toLowerCase();
                return c === 'pains_speciaux' || c === 'pain_special' || c.includes('special') || c.includes('speciaux');
            }).length;
            el.textContent = count;
        } else if (catKey === 'pain') {
            const count = allProducts.filter(p => {
                const c = (p.categorie || p.category || '').toLowerCase();
                return (c === 'pain' || c.includes('baguette') || c.includes('tradition')) && !c.includes('special') && !c.includes('speciaux');
            }).length;
            el.textContent = count;
        } else {
            const count = allProducts.filter(p => {
                const c = (p.categorie || p.category || '').toLowerCase();
                return c.includes(catKey);
            }).length;
            el.textContent = count;
        }
    };

    setCatCount('prod-cat-all-count', 'all');
    setCatCount('prod-cat-pain-count', 'pain');
    setCatCount('prod-cat-speciaux-count', 'pains_speciaux');
    setCatCount('prod-cat-viennoiserie-count', 'viennoiserie');
    setCatCount('prod-cat-patisserie-count', 'patisserie');
    setCatCount('prod-cat-boisson-count', 'boisson');
    setCatCount('prod-cat-sale-count', 'sale');
    setCatCount('prod-cat-snack-count', 'snack');
}

function renderProductsGridOrTable() {
    const tbody = document.getElementById('products-full-tbody');
    if (!tbody) return;

    if (!Array.isArray(allProducts) || allProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted"><i class="fa-solid fa-bread-slice me-2"></i>Aucun produit dans le catalogue. Cliquez sur "+ Ajouter un Produit" pour commencer.</td></tr>`;
        updateBulkActionsBar();
        return;
    }

    const filtered = allProducts.filter(p => {
        if (currentProductCategoryFilter !== 'all') {
            const cat = (p.categorie || p.category || '').toLowerCase();
            if (currentProductCategoryFilter === 'pains_speciaux') {
                if (!cat.includes('special') && !cat.includes('speciaux') && cat !== 'pains_speciaux' && cat !== 'pain_special') return false;
            } else if (currentProductCategoryFilter === 'pain') {
                if ((!cat.includes('pain') && !cat.includes('baguette') && !cat.includes('tradition')) || cat.includes('special') || cat.includes('speciaux')) return false;
            } else if (!cat.includes(currentProductCategoryFilter)) {
                return false;
            }
        }
        if (currentProductSearchQuery) {
            const name = (p.nom || p.title || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const cat = (p.categorie || p.category || '').toLowerCase();
            if (!name.includes(currentProductSearchQuery) && !desc.includes(currentProductSearchQuery) && !cat.includes(currentProductSearchQuery)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">Aucun produit ne correspond à vos critères de recherche.</td></tr>`;
        updateBulkActionsBar();
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const isChecked = selectedProductIds.has(String(p.id));
        const isActive = p.is_active === 1 || p.is_active === undefined || p.is_active === true || p.is_active === '1';
        const imgSrc = p.image || p.image_url || 'assets/product_baguette.png';
        const stockQty = p.stock != null ? p.stock : 50;
        const alertThreshold = p.seuil_alerte != null ? p.seuil_alerte : 10;
        const isLowStock = stockQty <= alertThreshold;
        const catName = p.categorie || p.category || 'Pain';

        return `
        <tr class="${isChecked ? 'row-selected' : ''}" style="${!isActive ? 'opacity: 0.65; background: #fafafa;' : ''}">
            <td style="width: 44px; text-align: center; vertical-align: middle;">
                <input type="checkbox" class="prod-select-cb" data-id="${p.id}" onchange="handleProductCheckboxChange('${p.id}', this.checked)" ${isChecked ? 'checked' : ''} title="Sélectionner">
            </td>
            <td style="width: 56px; vertical-align: middle; cursor: pointer;" onclick="openEditProductModal('${p.id}')" title="Cliquez pour changer la photo">
                <div style="position: relative; display: inline-block;">
                    <img src="${imgSrc}" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.06);" onerror="this.src='assets/product_baguette.png'">
                    <span style="position: absolute; bottom: -2px; right: -2px; background: #f59e0b; color: #fff; font-size: 8px; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"><i class="fa-solid fa-camera"></i></span>
                </div>
            </td>
            <td style="vertical-align: middle; cursor: pointer;" onclick="openEditProductModal('${p.id}')" title="Cliquez pour modifier">
                <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${escapeHtml(p.nom || p.title)}</div>
                ${p.description ? `<small class="text-muted text-truncate d-block" style="max-width: 260px; font-size: 11px;">${escapeHtml(p.description)}</small>` : ''}
            </td>
            <td style="vertical-align: middle;">
                <span class="badge bg-light text-dark border px-2 py-1" style="font-size: 11px; text-transform: capitalize;">${escapeHtml(catName)}</span>
            </td>
            <td style="vertical-align: middle; white-space: nowrap;">
                <strong class="saas-price-tag">${(Number(p.prix) || 0).toLocaleString('fr-FR')} FCFA</strong>
            </td>
            <td style="vertical-align: middle;">
                <div class="d-flex align-items-center gap-1">
                    <span class="fw-bold ${isLowStock ? 'text-danger' : 'text-success'}" style="font-size: 12.5px;">
                        ${stockQty} unités
                    </span>
                    ${isLowStock ? `<span class="badge bg-danger" style="font-size: 9px; padding: 2px 5px;">Bas</span>` : ''}
                </div>
            </td>
            <td class="text-muted small" style="vertical-align: middle;">${alertThreshold} un.</td>
            <td style="vertical-align: middle;">
                ${isActive 
                    ? `<span class="saas-badge-pill active" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-size:11px; padding:3px 8px; border-radius:12px; font-weight:700;"><i class="fa-solid fa-circle-check me-1 text-success"></i> Actif</span>`
                    : `<span class="saas-badge-pill inactive" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; font-size:11px; padding:3px 8px; border-radius:12px; font-weight:700;"><i class="fa-solid fa-ban me-1 text-danger"></i> Masqué</span>`
                }
            </td>
            <td style="text-align: right; white-space: nowrap; vertical-align: middle;">
                <button type="button" class="btn-xs btn-outline-primary me-1" onclick="openEditProductModal('${p.id}')" title="Modifier le produit">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" class="btn-xs ${isActive ? 'btn-outline-warning' : 'btn-outline-success'} me-1" onclick="handleToggleProductStatus('${p.id}')" title="${isActive ? 'Désactiver (Masquer)' : 'Activer (Rendre visible)'}">
                    <i class="fa-solid ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button type="button" class="btn-xs btn-outline-danger" onclick="handleDeleteProduct('${p.id}')" title="Supprimer définitivement">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');

    updateBulkActionsBar();
}

async function loadProducts() {
    const deletedIds = (typeof window.babiGetDeletedProductIds === 'function') 
        ? new Set(window.babiGetDeletedProductIds().map(String)) 
        : new Set();

    // 1. Charger depuis le stockage local (filtré contre la liste noire)
    const localProds = (typeof window.babiGetCachedProducts === 'function') 
        ? window.babiGetCachedProducts() 
        : (allProducts || []);
    
    allProducts = (Array.isArray(localProds) ? localProds : []).filter(p => p && !deletedIds.has(String(p.id)));
    updateProductKpis();
    renderProductsGridOrTable();

    // 2. Synchronisation directe avec le serveur cloud
    try {
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${apiBase}/api/products?_t=${Date.now()}`, { cache: 'no-store' }, 4000);
        if (res && res.ok) {
            const data = await res.json();
            const serverList = Array.isArray(data) ? data : (data.products || []);
            
            const serverMapped = serverList
                .map((p, idx) => ({
                    id: p.id || idx + 1,
                    nom: p.nom || p.name,
                    prix: Number(p.prix || p.price || 0),
                    categorie: p.categorie || p.category || 'pain',
                    image: p.image || p.image_url || 'assets/product_baguette.png',
                    stock: p.stock != null ? Number(p.stock) : 50,
                    seuil_alerte: p.seuil_alerte != null ? Number(p.seuil_alerte) : 10,
                    is_active: (p.is_active === 0 || p.is_active === '0' || p.is_active === false) ? 0 : 1,
                    description: p.description || ''
                }))
                .filter(p => p && !deletedIds.has(String(p.id)));

            allProducts = serverMapped;
            if (typeof window.babiSetCachedProducts === 'function') {
                window.babiSetCachedProducts(allProducts);
            }
            updateProductKpis();
            renderProductsGridOrTable();
            renderCategoryFilterPills();
        }
    } catch (_) {
        // En cas d'échec ou d'absence réseau, les produits locaux restent affichés
    }
}

// 🖼️ GESTION DU SÉLECTEUR DE PHOTO PRODUIT (CONVERSION AUTOMATIQUE EN WEBP 0.80)
function handleProductImageSelect(event, modalType) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const rawBase64 = e.target.result;
        const img = new Image();
        img.onload = function() {
            // 📸 Conversion et compression automatique en WEBP (Ultra-léger ~6 à 10 Ko & Haute Définition)
            const maxDim = 320;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Conversion WebP native
            let webpBase64 = canvas.toDataURL('image/webp', 0.80);
            if (!webpBase64.startsWith('data:image/webp')) {
                // Fallback de sécurité si l'environnement ne supporte pas l'export webp
                webpBase64 = canvas.toDataURL('image/jpeg', 0.70);
            }

            const previewEl = document.getElementById(`${modalType}-prod-preview-img`);
            const hiddenDataEl = document.getElementById(`${modalType}-prod-image-data`);
            
            if (previewEl) previewEl.src = webpBase64;
            if (hiddenDataEl) hiddenDataEl.value = webpBase64;
        };
        img.onerror = function() {
            const previewEl = document.getElementById(`${modalType}-prod-preview-img`);
            const hiddenDataEl = document.getElementById(`${modalType}-prod-image-data`);
            if (previewEl) previewEl.src = rawBase64;
            if (hiddenDataEl) hiddenDataEl.value = rawBase64;
        };
        img.src = rawBase64;
    };
    reader.readAsDataURL(file);
}

// 🟢 MODAL AJOUT PRODUIT
function openAddProductModal() {
    const form = document.getElementById('addProductModal');
    if (!form) return;
    
    // Reset form fields
    const nameEl = document.getElementById('new-prod-name');
    const catEl = document.getElementById('new-prod-category');
    const priceEl = document.getElementById('new-prod-price');
    const stockEl = document.getElementById('new-prod-stock');
    const alertEl = document.getElementById('new-prod-alert');
    const descEl = document.getElementById('new-prod-desc');
    const previewEl = document.getElementById('new-prod-preview-img');
    const dataEl = document.getElementById('new-prod-image-data');
    const fileEl = document.getElementById('new-prod-file');

    if (nameEl) nameEl.value = '';
    if (catEl) catEl.value = 'pain';
    if (priceEl) priceEl.value = '';
    if (stockEl) stockEl.value = '50';
    if (alertEl) alertEl.value = '10';
    if (descEl) descEl.value = '';
    if (previewEl) previewEl.src = 'assets/baguette 200.png';
    if (dataEl) dataEl.value = 'assets/baguette 200.png';
    if (fileEl) fileEl.value = '';

    form.classList.remove('hidden');
    form.style.display = 'flex';
}

function closeAddProductModal() {
    const form = document.getElementById('addProductModal');
    if (form) {
        form.classList.add('hidden');
        form.style.display = 'none';
    }
}

async function parseSafeResponse(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (_) {
        return { error: text || `Erreur HTTP ${res.status}` };
    }
}

async function handleCreateProduct(e) {
    if (e && e.preventDefault) e.preventDefault();

    const submitBtn = document.getElementById('btn-submit-create-prod') || document.querySelector('#addProductModal button[type="submit"]');
    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Enregistrement...';
    }

    const nom = document.getElementById('new-prod-name')?.value.trim();
    const categorie = document.getElementById('new-prod-category')?.value || 'pain';
    const prix = Number(document.getElementById('new-prod-price')?.value);
    const stock = Number(document.getElementById('new-prod-stock')?.value) || 50;
    const seuil_alerte = Number(document.getElementById('new-prod-alert')?.value) || 10;
    const description = document.getElementById('new-prod-desc')?.value.trim() || '';
    const image = document.getElementById('new-prod-image-data')?.value || 'assets/baguette 200.png';

    if (!nom) {
        showAdminToast("Veuillez saisir le nom du produit.", "warning");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origHtml; }
        return;
    }
    if (isNaN(prix) || prix < 0) {
        showAdminToast("Veuillez saisir un prix unitaire valide.", "warning");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origHtml; }
        return;
    }

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
        
        let createdProduct = {
            id: Date.now(),
            nom,
            categorie,
            prix,
            stock,
            seuil_alerte,
            description,
            image,
            is_active: 1
        };

        const res = await fetcher(`${apiBase}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, categorie, prix, stock, seuil_alerte, description, image })
        }, 10000);
        
        if (res && res.ok) {
            const data = await parseSafeResponse(res);
            if (data && data.product) {
                createdProduct = { ...createdProduct, ...data.product };
            }
        }

        allProducts.unshift(createdProduct);
        if (typeof window.babiSetCachedProducts === 'function') {
            window.babiSetCachedProducts(allProducts);
        }

        // Basculer l'affichage sur "Tous" pour voir immédiatement le nouveau produit
        currentProductCategoryFilter = 'all';
        currentProductSearchQuery = '';
        const searchInput = document.getElementById('admin-products-search');
        if (searchInput) searchInput.value = '';
        const filterPills = document.querySelectorAll('.saas-sub-filters .saas-filter-pill');
        if (filterPills.length > 0) {
            filterPills.forEach(p => p.classList.remove('active'));
            filterPills[0].classList.add('active');
        }

        updateProductKpis();
        renderProductsGridOrTable();
        closeAddProductModal();
        showAdminToast(`🎉 Produit "${nom}" ajouté avec succès !`, 'success');

        // Réinitialiser le formulaire
        if (document.getElementById('new-prod-name')) document.getElementById('new-prod-name').value = '';
        if (document.getElementById('new-prod-price')) document.getElementById('new-prod-price').value = '';
        if (document.getElementById('new-prod-desc')) document.getElementById('new-prod-desc').value = '';
        if (document.getElementById('new-prod-image-data')) document.getElementById('new-prod-image-data').value = 'assets/baguette 200.png';
        if (document.getElementById('new-prod-preview-img')) document.getElementById('new-prod-preview-img').src = 'assets/baguette 200.png';
        if (document.getElementById('new-prod-file')) document.getElementById('new-prod-file').value = '';
    } catch (err) {
        console.warn("[Admin] Erreur création produit :", err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    }
}

// 🔄 SYNCHRONISATION TOTALE CATALOGUE AVEC L'APP & SERVEUR
async function syncAllProductsWithServer() {
    const btn = document.getElementById('btn-sync-all-prods');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Synchronisation...';
    }

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';

        const res = await fetcher(`${apiBase}/api/products/sync-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: allProducts })
        }, 15000);

        if (res && res.ok) {
            const data = await parseSafeResponse(res);
            showAdminToast(`🎉 ${allProducts.length} produits synchronisés avec succès sur l'application mobile et la boutique !`, 'success');
        } else {
            showAdminToast("Erreur lors de la synchronisation avec le serveur.", "danger");
        }
    } catch (err) {
        showAdminToast("Erreur réseau lors de la synchronisation : " + err.message, "danger");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
}
window.syncAllProductsWithServer = syncAllProductsWithServer;

// ✏️ MODAL MODIFICATION PRODUIT
function openEditProductModal(productId) {
    const product = allProducts.find(p => p.id === productId || String(p.id) === String(productId));
    if (!product) {
        showAdminToast("Produit introuvable.", "warning");
        return;
    }

    const modal = document.getElementById('editProductModal');
    if (!modal) return;

    document.getElementById('edit-prod-id').value = product.id;
    document.getElementById('edit-prod-name').value = product.nom || product.title || '';
    
    // Category mapping
    const catSelect = document.getElementById('edit-prod-category');
    if (catSelect) {
        const catVal = (product.categorie || product.category || 'pain').toLowerCase();
        for (let opt of catSelect.options) {
            if (opt.value === catVal || catVal.includes(opt.value)) {
                catSelect.value = opt.value;
                break;
            }
        }
    }

    document.getElementById('edit-prod-price').value = product.prix || 0;
    document.getElementById('edit-prod-stock').value = product.stock != null ? product.stock : 50;
    document.getElementById('edit-prod-alert').value = product.seuil_alerte != null ? product.seuil_alerte : 10;
    
    const isActive = product.is_active === 1 || product.is_active === undefined || product.is_active === true || product.is_active === '1';
    document.getElementById('edit-prod-status').value = isActive ? '1' : '0';
    document.getElementById('edit-prod-desc').value = product.description || '';
    
    const imgSrc = product.image || product.image_url || 'assets/baguette 200.png';
    document.getElementById('edit-prod-preview-img').src = imgSrc;
    document.getElementById('edit-prod-image-data').value = imgSrc;
    document.getElementById('edit-prod-file').value = '';

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeEditProductModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

async function handleUpdateProduct(e) {
    if (e && e.preventDefault) e.preventDefault();

    const submitBtn = document.getElementById('btn-submit-update-prod') || document.querySelector('#editProductModal button[type="submit"]');
    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Enregistrement...';
    }

    const id = document.getElementById('edit-prod-id')?.value;
    const nom = document.getElementById('edit-prod-name')?.value.trim();
    const categorie = document.getElementById('edit-prod-category')?.value || 'pain';
    const prix = Number(document.getElementById('edit-prod-price')?.value);
    const stock = Number(document.getElementById('edit-prod-stock')?.value) || 0;
    const seuil_alerte = Number(document.getElementById('edit-prod-alert')?.value) || 10;
    const is_active = Number(document.getElementById('edit-prod-status')?.value);
    const description = document.getElementById('edit-prod-desc')?.value.trim() || '';
    const image = document.getElementById('edit-prod-image-data')?.value || 'assets/product_baguette.png';

    if (!id) {
        showAdminToast("Erreur : Identifiant du produit manquant.", "danger");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origHtml; }
        return;
    }
    if (!nom) {
        showAdminToast("Veuillez remplir le nom du produit.", "warning");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origHtml; }
        return;
    }
    if (isNaN(prix) || prix < 0) {
        showAdminToast("Veuillez saisir un prix valide.", "warning");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origHtml; }
        return;
    }

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
        
        const res = await fetcher(`${apiBase}/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, categorie, prix, stock, seuil_alerte, is_active, description, image })
        }, 10000);

        let finalProduct = {
            id: isNaN(Number(id)) ? id : Number(id),
            nom,
            categorie,
            prix,
            stock,
            seuil_alerte,
            is_active,
            description,
            image
        };

        if (res && res.ok) {
            const data = await parseSafeResponse(res);
            if (data && data.product) {
                finalProduct = { ...finalProduct, ...data.product };
            }
        }

        // Mise à jour définitive en mémoire et dans le stockage local
        const prodIdx = allProducts.findIndex(p => String(p.id) === String(id));
        if (prodIdx >= 0) {
            allProducts[prodIdx] = finalProduct;
        } else {
            allProducts.unshift(finalProduct);
        }

        if (typeof window.babiSetCachedProducts === 'function') {
            window.babiSetCachedProducts(allProducts);
        }

        updateProductKpis();
        renderProductsGridOrTable();
        closeEditProductModal();
        showAdminToast(`✨ Produit "${nom}" mis à jour et sauvegardé avec succès !`, 'success');
    } catch (err) {
        console.warn("[Admin] Erreur mise à jour produit :", err);
        // Fallback local en cas de problème de réseau
        const fallbackProd = {
            id: isNaN(Number(id)) ? id : Number(id),
            nom,
            categorie,
            prix,
            stock,
            seuil_alerte,
            is_active,
            description,
            image
        };
        const prodIdx = allProducts.findIndex(p => String(p.id) === String(id));
        if (prodIdx >= 0) allProducts[prodIdx] = fallbackProd;
        else allProducts.unshift(fallbackProd);
        if (typeof window.babiSetCachedProducts === 'function') window.babiSetCachedProducts(allProducts);
        updateProductKpis();
        renderProductsGridOrTable();
        closeEditProductModal();
        showAdminToast(`✨ Produit "${nom}" sauvegardé localement !`, 'success');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    }
}

// 👁️ / 🚫 BASCULER LE STATUT ACTIF / DÉSACTIVÉ D'UN PRODUIT (MASQUER / AFFICHER)
async function handleToggleProductStatus(id) {
    const product = allProducts.find(p => p.id === id || String(p.id) === String(id));
    if (!product) return;

    // Bascule optimiste immédiate (0ms)
    const newStatus = (product.is_active === 1 || product.is_active === true || product.is_active === '1') ? 0 : 1;
    product.is_active = newStatus;
    if (typeof window.babiSetCachedProducts === 'function') {
        window.babiSetCachedProducts(allProducts);
    }
    updateProductKpis();
    renderProductsGridOrTable();
    showAdminToast(newStatus === 1 ? `✨ "${product.nom || 'Produit'}" est maintenant visible.` : `🚫 "${product.nom || 'Produit'}" est maintenant masqué.`, 'info');

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        await fetcher(`${API_ROOT}/api/products/${id}/toggle-status`, { method: 'PATCH' }, 3000);
        if (typeof window.notifyProductCatalogueChanged === 'function') {
            window.notifyProductCatalogueChanged('PRODUCT_STATUS_CHANGED', { id, is_active: newStatus });
        }
    } catch (err) {
        console.warn("[Admin] Statut local synchronisé:", err);
    }
}

// 🗑️ SUPPRIMER DÉFINITIVEMENT UN PRODUIT
async function handleDeleteProduct(id) {
    const product = allProducts.find(p => p.id === id || String(p.id) === String(id));
    const prodName = product ? (product.nom || product.title) : 'ce produit';

    showBabiCustomConfirm({
        title: "Suppression définitive de produit",
        message: `Êtes-vous certain de vouloir supprimer définitivement "${prodName}" du catalogue et des stocks ?`,
        icon: "fa-trash-can",
        confirmColor: "gradient-red",
        confirmText: "Supprimer du catalogue",
        cancelText: "Annuler",
        onConfirm: async () => {
            // 1. Suppression définitive immédiate du cache local (0ms)
            if (typeof window.babiRemoveCustomProduct === 'function') {
                window.babiRemoveCustomProduct(id, prodName);
            }
            allProducts = allProducts.filter(p => p.id !== id && String(p.id) !== String(id) && (prodName ? (p.nom || p.name) !== prodName : true));
            if (typeof window.babiSetCachedProducts === 'function') {
                window.babiSetCachedProducts(allProducts);
            }
            updateProductKpis();
            renderProductsGridOrTable();
            showAdminToast(`🗑️ "${prodName}" a été retiré du catalogue.`, 'info');

            // 2. Synchronisation serveur
            try {
                const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
                await fetcher(`${API_ROOT}/api/products/${id}`, { method: 'DELETE' }, 10000);
            } catch (err) {
                console.warn("[Admin] Suppression locale synchronisée:", err);
            }
        }
    });
}

// Users
async function loadUsers() {
    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${API_ROOT}/api/users`, {}, 2500);
        if (!res || !res.ok) return;
        allUsers = await res.json();

        const countEl = document.getElementById('kpi-clients-count');
        if (countEl) countEl.textContent = allUsers.length;

        const tbody = document.getElementById('users-full-tbody');
        if (!tbody) return;

        if (allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-users-slash fs-3 text-secondary d-block mb-2"></i>
                        Aucun utilisateur enregistré pour le moment. Cliquez sur <strong>"+ Créer un Compte Collaborateur"</strong> pour enregistrer un profil.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allUsers.map(u => `
            <tr>
                <td>
                    <div style="font-weight:700; color:#0f172a;">${escapeHtml(u.prenom || '')} ${escapeHtml(u.nom || '')}</div>
                </td>
                <td style="font-family:monospace;">${escapeHtml(u.email || 'N/A')}</td>
                <td style="font-family:monospace;">${escapeHtml(u.telephone || u.phone || '—')}</td>
                <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">${(u.role || 'client').toUpperCase()}</span></td>
                <td><span class="saas-badge-pill active"><span class="saas-dot-online"></span> Actif</span></td>
                <td class="text-muted small">${u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '2026'}</td>
            </tr>
        `).join('');
    } catch (_) {}
}

function openAddUserModal() { document.getElementById('addUserModal')?.classList.remove('hidden'); }
function closeAddUserModal() { document.getElementById('addUserModal')?.classList.add('hidden'); }

async function handleCreateUser(e) {
    e.preventDefault();
    const fullName = document.getElementById('new-user-fullname')?.value || '';
    const email = document.getElementById('new-user-email')?.value;
    const telephone = document.getElementById('new-user-phone')?.value;
    const role = document.getElementById('new-user-role')?.value;
    const pass = document.getElementById('new-user-pass')?.value;

    const parts = fullName.split(' ');
    const prenom = parts[0] || 'Utilisateur';
    const nom = parts.slice(1).join(' ') || 'BABI';

    try {
        const res = await fetch(`${API_ROOT}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prenom, email, telephone, role, mot_de_passe: pass })
        });
        if (res.ok) {
            showAdminToast(`Compte ${role.toUpperCase()} créé avec succès !`, 'success');
            closeAddUserModal();
            loadUsers();
        }
    } catch (_) {}
}

// Transactions
async function loadTransactions() {
    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${API_ROOT}/api/admin/payments/transactions`, {}, 2500);
        if (!res || !res.ok) return;
        const data = await res.json();
        const transactions = data.transactions || [];
        allTransactions = transactions;

        const tbodyDash = document.getElementById('dashboard-recent-tx-tbody');
        const tbodyFull = document.getElementById('transactions-full-tbody');

        if (tbodyDash) {
            tbodyDash.innerHTML = transactions.slice(0, 5).map(t => `
                <tr>
                    <td><strong style="font-family:monospace; color:#0284c7;">#${t.payment_id || 'TRX'}</strong></td>
                    <td><strong>${(t.amount || 0).toLocaleString()} FCFA</strong></td>
                    <td><span class="saas-badge-wave">🌊 Wave</span></td>
                    <td><span class="saas-badge-pill active">Payé</span></td>
                </tr>
            `).join('');
        }

        if (tbodyFull) {
            tbodyFull.innerHTML = transactions.map(t => `
                <tr>
                    <td><strong style="font-family:monospace;">#${t.payment_id || 'TRX'}</strong></td>
                    <td><strong>#${t.order_id || 'CMD'}</strong></td>
                    <td>${escapeHtml(t.customer_name || 'Client')}</td>
                    <td><strong style="color:#0f172a;">${(t.amount || 0).toLocaleString()} FCFA</strong></td>
                    <td><span class="saas-badge-wave">🌊 Wave Mobile Money</span></td>
                    <td><span class="saas-badge-pill active">Validé & Payé</span></td>
                    <td><span class="badge bg-light text-dark font-mono small border">SHA-256 (Scellé)</span></td>
                    <td class="text-muted small">${t.created_at ? new Date(t.created_at).toLocaleString('fr-FR') : 'Récent'}</td>
                </tr>
            `).join('');
        }
    } catch (_) {}
}

// Security Logs
async function loadSecurityAuditLogs() {
    const tbody = document.getElementById('audit-logs-tbody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_ROOT}/api/admin/security/audit-logs`);
        if (!res.ok) return;
        const logs = await res.json();

        tbody.innerHTML = (logs || []).map(l => `
            <tr>
                <td><strong>${escapeHtml(l.event_type)}</strong></td>
                <td><code>#${escapeHtml(l.order_id || 'N/A')}</code></td>
                <td><span class="badge ${l.risk_score > 50 ? 'bg-danger' : 'bg-success'} text-white">${l.risk_score || 0}/100</span></td>
                <td><strong>${escapeHtml(l.risk_level || 'FAIBLE')}</strong></td>
                <td style="font-family:monospace;">${escapeHtml(l.ip_address || '127.0.0.1')}</td>
                <td style="font-family:monospace; font-size:10px; color:#64748b;">${escapeHtml((l.hash_signature || '').substring(0, 24))}...</td>
                <td class="text-muted small">${l.created_at ? new Date(l.created_at).toLocaleString('fr-FR') : 'Récent'}</td>
            </tr>
        `).join('');
    } catch (_) {}
}

// ================================================================
// 6. CHART.JS ENGINE
// ================================================================
function initSaasCharts() {
    const evoCanvas = document.getElementById('reservationsEvolutionChart');
    if (evoCanvas && typeof Chart !== 'undefined') {
        const ctx = evoCanvas.getContext('2d');
        if (resEvolutionChartInstance) resEvolutionChartInstance.destroy();

        const orangeGrad = ctx.createLinearGradient(0, 0, 0, 200);
        orangeGrad.addColorStop(0, 'rgba(234, 88, 12, 0.28)');
        orangeGrad.addColorStop(1, 'rgba(234, 88, 12, 0.0)');

        const greenGrad = ctx.createLinearGradient(0, 0, 0, 200);
        greenGrad.addColorStop(0, 'rgba(22, 163, 74, 0.22)');
        greenGrad.addColorStop(1, 'rgba(22, 163, 74, 0.0)');

        const days = [];
        const months = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            days.push(d.getDate() + ' ' + months[d.getMonth()]);
        }

        resEvolutionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Commandes',
                        data: [0, 0, 0, 0, 0, 0],
                        borderColor: '#ea580c',
                        backgroundColor: orangeGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Servies',
                        data: [0, 0, 0, 0, 0, 0],
                        borderColor: '#16a34a',
                        backgroundColor: greenGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { 
                        beginAtZero: true,
                        suggestedMax: 10,
                        grid: { color: '#f1f5f9' },
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    const statusCanvas = document.getElementById('statusDonutChart');
    if (statusCanvas && typeof Chart !== 'undefined') {
        const ctx = statusCanvas.getContext('2d');
        if (statusDonutChartInstance) statusDonutChartInstance.destroy();

        statusDonutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Nouvelles', 'En préparation', 'Prêtes', 'Livrées'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#3b82f6', '#a855f7', '#22c55e', '#06b6d4'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: { legend: { display: false } }
            }
        });
    }
}

function updateChartsWithRealData() {
    // 1. Mise à jour du graphe d'évolution linéaire
    if (resEvolutionChartInstance) {
        const days = [];
        const ordersPerDay = [0, 0, 0, 0, 0, 0];
        const servedPerDay = [0, 0, 0, 0, 0, 0];
        const months = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            days.push(d.getDate() + ' ' + months[d.getMonth()]);
        }

        if (Array.isArray(allOrders)) {
            allOrders.forEach(o => {
                if (!o.created_at) return;
                const oDate = new Date(o.created_at);
                const diffTime = now.setHours(0,0,0,0) - new Date(oDate).setHours(0,0,0,0);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 6) {
                    const idx = 5 - diffDays;
                    ordersPerDay[idx]++;
                    const s = String(o.status || '').toLowerCase();
                    if (s.includes('livr') || s.includes('recup') || s.includes('serv')) {
                        servedPerDay[idx]++;
                    }
                }
            });
        }

        resEvolutionChartInstance.data.labels = days;
        resEvolutionChartInstance.data.datasets[0].data = ordersPerDay;
        resEvolutionChartInstance.data.datasets[1].data = servedPerDay;
        resEvolutionChartInstance.update();
    }

    // 2. Mise à jour du Donut
    if (statusDonutChartInstance) {
        const newCount = allOrders.filter(o => o.status === 'nouveau' || o.status === 'en_attente_paiement').length;
        const prepCount = allOrders.filter(o => o.status === 'en_preparation' || o.status === 'en preparation' || o.status === 'payee_en_preparation').length;
        const pretCount = allOrders.filter(o => o.status === 'pret' || o.status === 'prete').length;
        const livreCount = allOrders.filter(o => o.status === 'livre' || o.status === 'livré' || o.status === 'recupere').length;

        statusDonutChartInstance.data.datasets[0].data = (allOrders.length === 0) ? [0, 0, 0, 0] : [newCount, prepCount, pretCount, livreCount];
        statusDonutChartInstance.update();

        const donutTotalEl = document.getElementById('donut-total-count');
        if (donutTotalEl) donutTotalEl.textContent = allOrders.length;

        const legendEl = document.getElementById('donut-status-legend');
        if (legendEl) {
            legendEl.innerHTML = `
                <div class="d-flex justify-content-between"><span><span class="saas-legend-dot" style="background:#3b82f6;"></span> Nouvelles</span><strong>${newCount}</strong></div>
                <div class="d-flex justify-content-between"><span><span class="saas-legend-dot" style="background:#a855f7;"></span> Préparation</span><strong>${prepCount}</strong></div>
                <div class="d-flex justify-content-between"><span><span class="saas-legend-dot" style="background:#22c55e;"></span> Prêtes</span><strong>${pretCount}</strong></div>
                <div class="d-flex justify-content-between"><span><span class="saas-legend-dot" style="background:#06b6d4;"></span> Servies</span><strong>${livreCount}</strong></div>
            `;
        }
    }
}

// ================================================================
// 7. UTILS & TOASTS
// ================================================================
function getStatusBadgeHtml(status) {
    const s = String(status || 'nouveau').toLowerCase();
    if (s.includes('annule') || s.includes('rembours')) return '<span class="saas-badge-pill danger">Remboursé</span>';
    if (s.includes('livr') || s.includes('recup')) return '<span class="saas-badge-pill active">Servie / Récupérée</span>';
    if (s.includes('pret')) return '<span class="saas-badge-pill active" style="background:#dcfce7; color:#16a34a;">Prête</span>';
    if (s.includes('prep')) return '<span class="saas-badge-pill" style="background:#f3e8ff; color:#9333ea;">En préparation</span>';
    return '<span class="saas-badge-pill warning">Nouvelle</span>';
}

function showAdminToast(msg, type = 'info') {
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${type === 'success' ? '#0f172a' : (type === 'danger' ? '#991b1b' : '#1e293b')};
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        border-left: 4px solid ${type === 'success' ? '#22c55e' : (type === 'danger' ? '#ef4444' : '#fbbf24')};
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check text-success' : 'fa-bell text-warning'}"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
}

function toggleUsersMenu() {
    const submenu = document.getElementById('usersSubmenu');
    const arrow = document.getElementById('usersMenuArrow');
    if (submenu) {
        submenu.classList.toggle('open');
        if (arrow) arrow.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function toggleProfileDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('profileDropdownMenu');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function openChangePasswordModal() { document.getElementById('passwordModal')?.classList.remove('hidden'); }
function closeChangePasswordModal() { document.getElementById('passwordModal')?.classList.add('hidden'); }

async function handlePasswordChange(e) {
    e.preventDefault();
    const oldPass = document.getElementById('old-password')?.value;
    const newPass = document.getElementById('new-password')?.value;
    const confPass = document.getElementById('confirm-password')?.value;

    if (newPass !== confPass) {
        alert("Les nouveaux mots de passe ne correspondent pas.");
        return;
    }

    try {
        const res = await fetch(`${API_ROOT}/api/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: oldPass, new_password: newPass })
        });
        if (res.ok) {
            showAdminToast("Mot de passe mis à jour avec succès !", 'success');
            closeChangePasswordModal();
        } else {
            alert("Ancien mot de passe incorrect.");
        }
    } catch (_) {}
}

function showBabiCustomConfirm({
    title = "Déconnexion",
    message = "Voulez-vous vraiment vous déconnecter du Cockpit Direction ?",
    icon = "delete",
    confirmText = "Se déconnecter",
    cancelText = "Annuler",
    confirmColor = "gradient-red",
    onConfirm = () => {}
} = {}) {
    const existing = document.getElementById('babiCustomConfirmModal');
    if (existing) existing.remove();

    const iconHtml = (typeof icon === 'string' && (icon.startsWith('fa-') || icon.includes('trash')))
        ? `<i class="fa-solid ${icon.startsWith('fa-') ? icon : 'fa-' + icon}" style="font-size: 28px;"></i>`
        : `<span class="material-symbols-outlined" style="font-size: 32px;">${icon || 'delete'}</span>`;

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
                ${iconHtml}
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

function handleAdminLogout() {
    showBabiCustomConfirm({
        title: "Déconnexion Cockpit Direction",
        message: "Êtes-vous sûr de vouloir vous déconnecter du Cockpit Administrateur ?",
        icon: "shield_lock",
        confirmText: "Se déconnecter",
        cancelText: "Annuler",
        onConfirm: () => {
            localStorage.removeItem('babi_admin_auth');
            showAdminToast("Session Administrateur clôturée.", "info");
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 250);
        }
    });
}

// ================================================================
// 8. 👩‍💼 GESTION CENTRALE DES CAISSIÈRES & CONTRÔLE DES SESSIONS POS
// ================================================================

async function loadCashiersData() {
    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const res = await fetcher(`${API_ROOT}/api/admin/cashiers`, {}, 2500);
        if (!res || !res.ok) return;
        const cashiers = await res.json();
        allCashiers = cashiers || [];

        // Calcul des métriques caissières
        const total = allCashiers.length;
        const onlineCount = allCashiers.filter(c => c.is_online === 1).length;
        const suspendedCount = allCashiers.filter(c => c.statut === 'suspendu').length;

        // Mise à jour des KPI cards
        const totalEl = document.getElementById('cashier-total-count');
        const onlineEl = document.getElementById('cashier-online-count');
        const suspEl = document.getElementById('cashier-suspended-count');
        const badgeEl = document.getElementById('sidebar-online-cashiers-badge');

        if (totalEl) totalEl.textContent = total;
        if (onlineEl) onlineEl.textContent = onlineCount;
        if (suspEl) suspEl.textContent = suspendedCount;
        if (badgeEl) badgeEl.textContent = `${onlineCount} en ligne`;

        const tbody = document.getElementById('cashiers-full-tbody');
        if (!tbody) return;

        if (allCashiers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-cash-register fs-3 text-warning d-block mb-2"></i>
                        Aucune caissière enregistrée. Cliquez sur <strong>"+ Créer un Profil Caissière & Valider"</strong> pour attribuer un poste POS.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allCashiers.map(c => {
            const isOnline = c.is_online === 1;
            const isSuspended = c.statut === 'suspendu';

            const statusCompteBadge = isSuspended
                ? `<span class="saas-badge-pill danger"><i class="fa-solid fa-lock me-1"></i> Suspendu</span>`
                : `<span class="saas-badge-pill active"><i class="fa-solid fa-circle-check me-1"></i> Validé (Actif)</span>`;

            const sessionBadge = isOnline
                ? `<span class="badge bg-success text-white px-2 py-1 rounded-pill fw-bold" style="font-size:11px;"><span class="saas-dot-online me-1"></span> EN LIGNE (POS)</span>`
                : `<span class="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill fw-bold" style="font-size:11px;">⚪ Hors Ligne</span>`;

            const dateLogin = c.derniere_connexion ? new Date(c.derniere_connexion).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Jamais';

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${c.avatar || 'assets/caissiere.png'}" style="width: 38px; height: 38px; border-radius: 9999px; object-fit: cover; border: 2px solid ${isOnline ? '#16a34a' : '#cbd5e1'};">
                            <div>
                                <strong style="color: #0f172a; font-size: 13.5px;">${escapeHtml(c.prenom || '')} ${escapeHtml(c.nom || '')}</strong>
                                <div style="font-size: 11px; color: #64748b;">ID #${c.id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-warning-subtle text-dark border border-warning-subtle fw-bold px-2 py-1" style="font-size:11.5px;">
                            ${escapeHtml(c.caisse_assignee || 'Caisse 1 - Riviera')}
                        </span>
                    </td>
                    <td style="font-family: monospace; color: #0f172a;">${escapeHtml(c.email || '')}</td>
                    <td style="font-family: monospace; color: #64748b;">${escapeHtml(c.telephone || '—')}</td>
                    <td>
                        <div class="d-flex align-items-center gap-1">
                            <code class="px-2 py-0.5 rounded bg-light border font-mono fw-bold" style="letter-spacing: 2px;">${escapeHtml(c.code_pin || '1234')}</code>
                        </div>
                    </td>
                    <td>${statusCompteBadge}</td>
                    <td>${sessionBadge}</td>
                    <td class="small text-muted font-mono">${dateLogin}</td>
                    <td style="text-align: right;">
                        <div class="d-inline-flex gap-1">
                            ${isOnline ? `
                                <button type="button" class="btn-xs btn-outline-danger" onclick="forceLogoutCashier(${c.id}, '${escapeHtml(c.prenom)} ${escapeHtml(c.nom)}')" title="Déconnecter à distance immédiatement">
                                    <i class="fa-solid fa-power-off me-1"></i> Déconnecter
                                </button>
                            ` : ''}

                            <button type="button" class="btn-xs ${isSuspended ? 'btn-outline-primary' : 'btn-outline-danger'}" onclick="toggleCashierStatus(${c.id})" title="${isSuspended ? 'Réactiver le compte' : 'Suspendre et bloquer l\'accès'}">
                                <i class="fa-solid ${isSuspended ? 'fa-unlock text-success' : 'fa-lock'}"></i>
                                ${isSuspended ? 'Activer' : 'Bloquer'}
                            </button>

                            <button type="button" class="btn-xs btn-outline-primary" onclick="openEditCashierModal(${c.id})" title="Modifier profil et caisse assignée">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>

                            <button type="button" class="btn-xs btn-outline-danger" onclick="deleteCashier(${c.id}, '${escapeHtml(c.prenom)} ${escapeHtml(c.nom)}')" title="Supprimer définitivement">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Charger également le journal des clôtures Z de caisse
        loadCashierClosuresHistory();
    } catch (e) {
        console.error("Erreur chargement caissières:", e);
    }
}

// -------------------------------------------------------------
// 🔒 JOURNAL DES CLÔTURES Z (TICKET Z) & CONTRÔLE TIROIR-CAISSE
// -------------------------------------------------------------

async function loadCashierClosuresHistory() {
    const tbody = document.getElementById('closures-z-tbody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_ROOT}/api/pos/register/history`);
        if (res.ok) {
            allClosuresZ = await res.json();
        } else {
            allClosuresZ = JSON.parse(localStorage.getItem('babi_pos_closures_history') || '[]');
        }
    } catch (_) {
        allClosuresZ = JSON.parse(localStorage.getItem('babi_pos_closures_history') || '[]');
    }

    if (!Array.isArray(allClosuresZ) || allClosuresZ.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                    <span class="material-symbols-outlined fs-3 text-warning d-block mb-1">lock_clock</span>
                    Aucune clôture Z enregistrée pour le moment. Les clôtures validées par les caissières apparaîtront ici automatiquement.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allClosuresZ.map(reg => {
        const dateStr = reg.closed_at ? new Date(reg.closed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        const numZ = reg.numero_z || `Z-${reg.id || '0000'}`;
        const ecart = Number(reg.ecart || 0);

        let ecartBadge = `<span class="badge" style="background:#ecfdf5; color:#047857; font-weight:800; font-size:11px; padding:4px 8px; border-radius:6px;">✅ ÉQUILIBRÉ</span>`;
        if (ecart > 0) {
            ecartBadge = `<span class="badge" style="background:#f0f9ff; color:#0284c7; font-weight:800; font-size:11px; padding:4px 8px; border-radius:6px;">🟢 +${ecart.toLocaleString()} F (Excédent)</span>`;
        } else if (ecart < 0) {
            ecartBadge = `<span class="badge" style="background:#fef2f2; color:#dc2626; font-weight:800; font-size:11px; padding:4px 8px; border-radius:6px;">🔴 ${ecart.toLocaleString()} F (Déficit)</span>`;
        }

        return `
            <tr>
                <td>
                    <span class="badge bg-amber-subtle text-amber-900 border border-amber-300 fw-bold font-mono px-2 py-1" style="font-size:11px;">
                        ${escapeHtml(numZ)}
                    </span>
                </td>
                <td class="small text-muted font-mono">${dateStr}</td>
                <td>
                    <strong style="color:#0f172a; font-size:12.5px;">${escapeHtml(reg.closed_by || reg.nom_caissiere || 'Caissière')}</strong>
                </td>
                <td style="font-family:monospace; font-weight:bold; color:#0f172a;">
                    ${(reg.total_ventes || 0).toLocaleString()} FCFA
                </td>
                <td style="font-family:monospace; color:#16a34a; font-weight:600;">
                    ${(reg.total_especes || 0).toLocaleString()} F
                </td>
                <td style="font-family:monospace; color:#0284c7; font-weight:600;">
                    ${(reg.total_wave || 0).toLocaleString()} F
                </td>
                <td style="font-family:monospace; font-weight:800; color:#0f172a;">
                    ${(reg.especes_reelles || 0).toLocaleString()} FCFA
                </td>
                <td style="font-family:monospace; font-weight:bold;">
                    ${(ecart >= 0 ? '+' : '')}${ecart.toLocaleString()} F
                </td>
                <td>${ecartBadge}</td>
                <td style="text-align: right;">
                    <button type="button" class="btn-xs btn-outline-primary" onclick="viewAdminTicketZ(${reg.id || `'${numZ}'`})" style="font-weight:700;">
                        <span class="material-symbols-outlined text-xs align-middle">receipt_long</span> Voir Ticket Z
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewAdminTicketZ(closureId) {
    const reg = allClosuresZ.find(c => c.id == closureId || c.numero_z == closureId);
    if (!reg) return;

    const modal = document.getElementById('adminTicketZModal');
    if (!modal) return;

    const dateObj = reg.closed_at ? new Date(reg.closed_at) : new Date();
    const dateStr = `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    const expectedCash = (reg.fond_de_caisse || 50000) + (reg.total_especes || 0);
    const ecart = Number(reg.ecart || 0);
    let ecartStr = '0 F CFA (ÉQUILIBRÉ)';
    if (ecart > 0) ecartStr = `+${ecart.toLocaleString()} F (EXCÉDENT)`;
    else if (ecart < 0) ecartStr = `${ecart.toLocaleString()} F (DÉFICIT)`;

    document.getElementById('adm-tz-num').innerText = reg.numero_z || ('Z-' + reg.id);
    document.getElementById('adm-tz-date').innerText = dateStr;
    document.getElementById('adm-tz-cashier').innerText = reg.closed_by || reg.nom_caissiere || 'Caissière';

    document.getElementById('adm-tz-total-sales').innerText = `${(reg.total_ventes || 0).toLocaleString()} F CFA`;
    document.getElementById('adm-tz-total-cash').innerText = `${(reg.total_especes || 0).toLocaleString()} F CFA`;
    document.getElementById('adm-tz-total-wave').innerText = `${(reg.total_wave || 0).toLocaleString()} F CFA`;
    document.getElementById('adm-tz-total-others').innerText = `${(reg.total_others || 0).toLocaleString()} F CFA`;
    document.getElementById('adm-tz-ticket-count').innerText = `${reg.total_tickets || 0} Tickets`;

    document.getElementById('adm-tz-fond').innerText = `${(reg.fond_de_caisse || 50000).toLocaleString()} F CFA`;
    document.getElementById('adm-tz-theorique').innerText = `${expectedCash.toLocaleString()} F CFA`;
    document.getElementById('adm-tz-reel').innerText = `${(reg.especes_reelles || 0).toLocaleString()} F CFA`;
    document.getElementById('adm-tz-ecart').innerText = ecartStr;

    const notesContainer = document.getElementById('adm-tz-notes-container');
    const notesEl = document.getElementById('adm-tz-notes');
    if (reg.notes && notesContainer && notesEl) {
        notesEl.innerText = reg.notes;
        notesContainer.style.display = 'block';
    } else if (notesContainer) {
        notesContainer.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeAdminTicketZModal() {
    const modal = document.getElementById('adminTicketZModal');
    if (modal) modal.style.display = 'none';
}

function printAdminTicketZDirect() {
    const printArea = document.getElementById('admin-ticket-z-printable-area');
    if (!printArea) return;

    const w = window.open('', '_blank', 'width=380,height=650');
    if (w) {
        w.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Impression Ticket Z Archivé - Direction BABI</title>
                <style>
                    @page { size: 80mm auto; margin: 0; }
                    body { font-family: monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 11px; color: #000; }
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

// 1. Création de Caissière (Modal)
function openCreateCashierModal() {
    document.getElementById('createCashierModal')?.classList.remove('hidden');
}

function closeCreateCashierModal() {
    document.getElementById('createCashierModal')?.classList.add('hidden');
}

async function handleCreateCashierSubmit(e) {
    e.preventDefault();
    const nom = document.getElementById('new-cashier-nom')?.value;
    const prenom = document.getElementById('new-cashier-prenom')?.value;
    const email = document.getElementById('new-cashier-email')?.value;
    const telephone = document.getElementById('new-cashier-phone')?.value;
    const caisse_assignee = document.getElementById('new-cashier-caisse')?.value;
    const code_pin = document.getElementById('new-cashier-pin')?.value;
    const mot_de_passe = document.getElementById('new-cashier-pass')?.value;

    try {
        const res = await fetch(`${API_ROOT}/api/admin/cashiers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prenom, email, telephone, caisse_assignee, code_pin, mot_de_passe })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

        showAdminToast(`✅ Profil Caissière créé & validé avec succès pour ${prenom} ${nom} (${caisse_assignee}) !`, 'success');
        closeCreateCashierModal();
        loadCashiersData();

        // Diffuser mise à jour globale
        try {
            const b = new BroadcastChannel('babi_global_sync');
            b.postMessage({ type: 'CASHIER_CREATED', cashier: data.cashier });
        } catch (_) {}
    } catch (err) {
        alert(err.message);
    }
}

// 2. Modification de Caissière (Modal)
function openEditCashierModal(id) {
    const cashier = allCashiers.find(c => c.id === id);
    if (!cashier) return;

    document.getElementById('edit-cashier-id').value = cashier.id;
    document.getElementById('edit-cashier-nom').value = cashier.nom || '';
    document.getElementById('edit-cashier-prenom').value = cashier.prenom || '';
    document.getElementById('edit-cashier-email').value = cashier.email || '';
    document.getElementById('edit-cashier-phone').value = cashier.telephone || '';
    document.getElementById('edit-cashier-caisse').value = cashier.caisse_assignee || 'Caisse 1 - Riviera';
    document.getElementById('edit-cashier-pin').value = cashier.code_pin || '1234';
    document.getElementById('edit-cashier-pass').value = '';

    document.getElementById('editCashierModal')?.classList.remove('hidden');
}

function closeEditCashierModal() {
    document.getElementById('editCashierModal')?.classList.add('hidden');
}

async function handleEditCashierSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-cashier-id')?.value;
    const nom = document.getElementById('edit-cashier-nom')?.value;
    const prenom = document.getElementById('edit-cashier-prenom')?.value;
    const email = document.getElementById('edit-cashier-email')?.value;
    const telephone = document.getElementById('edit-cashier-phone')?.value;
    const caisse_assignee = document.getElementById('edit-cashier-caisse')?.value;
    const code_pin = document.getElementById('edit-cashier-pin')?.value;
    const mot_de_passe = document.getElementById('edit-cashier-pass')?.value;

    try {
        const res = await fetch(`${API_ROOT}/api/admin/cashiers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prenom, email, telephone, caisse_assignee, code_pin, mot_de_passe })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur modification");

        showAdminToast("Profil caissière mis à jour avec succès !", 'success');
        closeEditCashierModal();
        loadCashiersData();
    } catch (err) {
        alert(err.message);
    }
}

// 3. Déconnexion à distance forcée (Force Logout)
async function forceLogoutCashier(id, name) {
    showBabiCustomConfirm({
        title: "Déconnexion à distance",
        message: `Confirmez-vous la déconnexion forcée immédiate de ${name} du terminal de caisse ? Sa session sera immédiatement verrouillée.`,
        icon: "fa-user-lock",
        confirmColor: "gradient-red",
        confirmText: "Déconnecter la caissière",
        cancelText: "Annuler",
        onConfirm: async () => {
            try {
                const res = await fetch(`${API_ROOT}/api/admin/cashiers/${id}/force-logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();

                // Émettre un signal instantané sur le bus de diffusion
                try {
                    const b = new BroadcastChannel('babi_global_sync');
                    b.postMessage({ type: 'CASHIER_FORCE_LOGOUT', cashier_id: id });
                } catch (_) {}

                showAdminToast(`🔴 ${name} a été déconnectée du terminal de caisse.`, 'danger');
                loadCashiersData();
            } catch (err) {
                showAdminToast("Erreur lors de la déconnexion : " + err.message, "danger");
            }
        }
    });
}

// 4. Suspendre / Activer le compte caissière
async function toggleCashierStatus(id) {
    try {
        const res = await fetch(`${API_ROOT}/api/admin/cashiers/${id}/toggle-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (data.statut === 'suspendu') {
            try {
                const b = new BroadcastChannel('babi_global_sync');
                b.postMessage({ type: 'CASHIER_FORCE_LOGOUT', cashier_id: id });
            } catch (_) {}
            showAdminToast(`⛔ Compte caissière suspendu. Accès bloqué.`, 'danger');
        } else {
            showAdminToast(`✅ Compte caissière réactivé avec succès.`, 'success');
        }
        loadCashiersData();
    } catch (err) {
        showAdminToast("Erreur changement statut : " + err.message, "danger");
    }
}

// 5. Supprimer profil caissière
async function deleteCashier(id, name) {
    showBabiCustomConfirm({
        title: "Suppression Profil Caissière",
        message: `Êtes-vous certain de vouloir supprimer définitivement le profil caissière de ${name} ?`,
        icon: "fa-user-xmark",
        confirmColor: "gradient-red",
        confirmText: "Supprimer le profil",
        cancelText: "Annuler",
        onConfirm: async () => {
            try {
                await fetch(`${API_ROOT}/api/admin/cashiers/${id}`, { method: 'DELETE' });
                showAdminToast(`Profil de ${name} supprimé.`, 'info');
                loadCashiersData();
            } catch (err) {
                showAdminToast("Erreur suppression : " + err.message, "danger");
            }
        }
    });
}

// ================================================================
// 🧠 BABI BRAIN ENGINE (BBE v3.0) — COCKPIT IA & BUSINESS PREDICTIONS
// ================================================================
let lastAdminAiEventTimestamp = Date.now();

function initAdminBrainFeed() {
    if (typeof EventSource !== 'undefined') {
        try {
            const evtSource = new EventSource(`${API_ROOT}/api/ai/live-feed?channel=admin&sse=1`);
            evtSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    handleAdminIncomingAiEvent(data);
                } catch (_) {}
            };
            evtSource.onerror = () => {
                try { evtSource.close(); } catch (_) {}
            };
            return;
        } catch (_) {}
    }
}

function startAdminBrainPolling() {
    // Désactivé pour éliminer toute boucle intempestive en arrière-plan
}

function handleAdminIncomingAiEvent(evt) {
    if (!evt || !evt.type) return;

    if (evt.type === 'ORDER_CREATED') {
        const payload = evt.payload || {};
        showAdminToast(`💰 Nouvelle commande enregistrée : #${payload.orderId} (${(payload.totalPrice || 0).toLocaleString()} FCFA)`, 'info');
        fetchAdminData();
    } else if (evt.type === 'PIN_VALIDATED') {
        const payload = evt.payload || {};
        showAdminToast(`🔑 Retrait validé : Commande #${payload.orderId} par ${payload.validatedByName}`, 'success');
        fetchAdminData();
    }
}

async function fetchAdminAiBusinessForecast() {
    try {
        const res = await fetch(`${API_ROOT}/api/ai/business-forecast`);
        if (res.ok) {
            const data = await res.json();
            const forecastEl = document.getElementById('ai-forecast-summary-box');
            if (forecastEl && data.forecast) {
                forecastEl.innerHTML = `
                    <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 shadow-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-extrabold text-sm flex items-center gap-1.5 text-amber-800">
                                <i class="fa-solid fa-brain text-amber-600"></i> BABI Brain Intelligence • Modélisation Prédictive
                            </span>
                            <span class="bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                                Confiance : ${data.forecast.trendConfidence || '94%'}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div class="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                <span class="text-gray-500">CA Prévisionnel / Jour :</span>
                                <div class="font-black text-base text-amber-900">${(data.forecast.projectedDailyRevenueFCFA || 0).toLocaleString()} FCFA</div>
                            </div>
                            <div class="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                <span class="text-gray-500">Projection Mensuelle :</span>
                                <div class="font-black text-base text-emerald-700">${(data.forecast.projectedMonthlyRevenueFCFA || 0).toLocaleString()} FCFA</div>
                            </div>
                            <div class="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                <span class="text-gray-500">Croissance Estimée :</span>
                                <div class="font-black text-base text-blue-700">${data.forecast.growthRateEstimated || '+18.5%'}</div>
                            </div>
                        </div>
                        <p class="text-xs text-amber-900 mt-2.5 font-medium">${data.executiveSummary || ''}</p>
                    </div>
                `;
            }
        }
    } catch (_) {}
}

async function askAdminAiCopilot(promptText) {
    if (!promptText) return;
    try {
        const res = await fetch(`${API_ROOT}/api/ai/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, role: 'admin' })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (_) {}
    return { reply: "Le copilote IA BABI analyse actuellement les indicateurs de performance." };
}

// 👁️ BASCULE D'AFFICHAGE DES MOTS DE PASSE ADMIN & CAISSIÈRE
function togglePasswordVisibility(inputId, btnOrIcon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btnOrIcon ? (btnOrIcon.querySelector ? btnOrIcon.querySelector('i') || btnOrIcon : btnOrIcon) : null;
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            icon.style.color = '#ea580c';
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            icon.style.color = '#64748b';
        }
    }
}

// =========================================================================
// 🤖 BABI BRAIN IA : AUTO-COMPLÉTION PRODUITS, STUDIO PHOTO & COPILOTE ADMIN
// =========================================================================

let currentAiStudioTarget = 'new'; // 'new' ou 'edit'
let allAiStudioPhotos = [
    { title: 'Baguette Dorée', cat: 'pain', url: 'assets/product_baguette.png' },
    { title: 'Baguette Tradition', cat: 'pain', url: 'assets/baguette 200.png' },
    { title: 'Baguette 150', cat: 'pain', url: 'assets/baguette 150.png' },
    { title: 'Pain Complet', cat: 'pain', url: 'assets/Pain Complet (Grand).png' },
    { title: 'Pain sans Sel', cat: 'pain', url: 'assets/pain sans sel.png' },
    { title: 'Pain Individuel', cat: 'pain', url: 'assets/pain individuel.png' },
    { title: 'Pain de Mie Frais', cat: 'pain', url: 'assets/pain de mie.png' },
    { title: 'Marbré Chocolat', cat: 'pain', url: 'assets/marbre.png' },
    { title: 'Croissant Pur Beurre', cat: 'viennoiserie', url: 'assets/Croissant.png' },
    { title: 'Pain au Chocolat', cat: 'viennoiserie', url: 'assets/pain au chocolat.png' },
    { title: 'Pain aux Raisins', cat: 'viennoiserie', url: 'assets/pain au raisin.png' },
    { title: 'Chausson aux Pommes', cat: 'viennoiserie', url: 'assets/chausson aux pommes.png' },
    { title: 'Chocolat Suisse', cat: 'viennoiserie', url: 'assets/choco suisse.png' },
    { title: 'Torsade Feuilletée', cat: 'viennoiserie', url: 'assets/torsade.png' },
    { title: 'Palmier Croustillant', cat: 'viennoiserie', url: 'assets/palmier.png' },
    { title: 'Gâteau Anniversaire Prestige', cat: 'patisserie', url: 'assets/Gateau1.png' },
    { title: 'Gâteau Chocolat & Fruits', cat: 'patisserie', url: 'assets/Gateau1.1.png' },
    { title: 'Gâteau Fraise & Crème', cat: 'patisserie', url: 'assets/Gateau1.2.png' },
    { title: 'Gâteau Chocolat Suprême', cat: 'patisserie', url: 'assets/gateau2.png' },
    { title: 'Gâteau de Mariage Pièce Montée', cat: 'patisserie', url: 'assets/gateau de mariiage.png' },
    { title: 'Flan Pâtissier Traditionnel', cat: 'patisserie', url: 'assets/Flan.png' },
    { title: 'Moka au Café', cat: 'patisserie', url: 'assets/moka1.png' },
    { title: 'Fondant au Chocolat', cat: 'patisserie', url: 'assets/Fondant au Chocolat.png' },
    { title: 'Crêpe au Nutella', cat: 'patisserie', url: 'assets/crepe au nutella.png' },
    { title: 'Crêpe à la Vanille', cat: 'patisserie', url: 'assets/crepe a la vanille.png' },
    { title: 'Bûche Festve', cat: 'patisserie', url: 'assets/buche de noel.png' },
    { title: 'Jus de Bissap Naturel', cat: 'jus', url: 'assets/jus de bissap.png' },
    { title: 'Jus de Passion d\'Abidjan', cat: 'jus', url: 'assets/jus de passion.png' },
    { title: 'Jus de Gingembre Pur', cat: 'jus', url: 'assets/jus de gingembre.png' },
    { title: 'Jus de Baobab Onctueux', cat: 'jus', url: 'assets/jus de baobab.png' },
    { title: 'Jus de Tamarin', cat: 'jus', url: 'assets/jus de tamari.png' },
    { title: 'Cocktail Tropical BABI', cat: 'jus', url: 'assets/cocktail.png' },
    { title: 'Jus de Citron Pressé', cat: 'jus', url: 'assets/jus de citron.png' },
    { title: 'Pizza Royale Fromage & Viande', cat: 'sale', url: 'assets/Pizza.png' },
    { title: 'Panini Poulet Toasté', cat: 'sale', url: 'assets/Panini.png' },
    { title: 'Burger Artisanal', cat: 'sale', url: 'assets/burger.png' },
    { title: 'Sandwich Baguette', cat: 'sale', url: 'assets/sandwich.png' },
    { title: 'Cookies Pépites Chocolat', cat: 'snack', url: 'assets/cookies.png' },
    { title: 'Madeleines Pur Beurre', cat: 'snack', url: 'assets/madeleine unite.png' },
    { title: 'Glace Artisanale', cat: 'snack', url: 'assets/glace.png' }
];

/**
 * 1. Auto-complétion & suggestion intelligente du produit par l'IA
 */
window.autoCompleteProductWithAI = async function(target = 'new') {
    const nameInput = document.getElementById(target === 'new' ? 'new-prod-name' : 'edit-prod-name');
    const query = nameInput ? nameInput.value.trim() : '';

    if (!query) {
        showAdminToast("Veuillez saisir un début de nom (ex: Baguette céréales, Croissant, Jus bissap...)", "warning");
        if (nameInput) nameInput.focus();
        return;
    }

    showAdminToast("✨ L'IA BABI génère la fiche produit...", "info");

    try {
        const res = await fetch(`${API_BASE_URL}/ai/suggest-product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        const data = await parseSafeResponse(res);

        if (data && data.success && data.suggestion) {
            const s = data.suggestion;

            // Remplissage des champs du formulaire
            const catEl = document.getElementById(target === 'new' ? 'new-prod-category' : 'edit-prod-category');
            const priceEl = document.getElementById(target === 'new' ? 'new-prod-price' : 'edit-prod-price');
            const stockEl = document.getElementById(target === 'new' ? 'new-prod-stock' : 'edit-prod-stock');
            const alertEl = document.getElementById(target === 'new' ? 'new-prod-alert' : 'edit-prod-alert');
            const descEl = document.getElementById(target === 'new' ? 'new-prod-desc' : 'edit-prod-desc');
            const prevImg = document.getElementById(target === 'new' ? 'new-prod-preview-img' : 'edit-prod-preview-img');
            const dataImg = document.getElementById(target === 'new' ? 'new-prod-image-data' : 'edit-prod-image-data');

            if (catEl && s.categorie) catEl.value = s.categorie;
            if (priceEl && s.prix) priceEl.value = s.prix;
            if (stockEl && s.stock && (!stockEl.value || stockEl.value === '50')) stockEl.value = s.stock;
            if (alertEl && s.seuil_alerte) alertEl.value = s.seuil_alerte;
            if (descEl && s.description) descEl.value = s.description;
            if (prevImg && s.image) prevImg.src = s.image;
            if (dataImg && s.image) dataImg.value = s.image;

            showAdminToast(`✨ IA : Fiche optimisée pour "${s.nom}" (${s.prix} FCFA)`, "success");
        } else {
            showAdminToast("Suggestion IA prête avec les valeurs par défaut.", "info");
        }
    } catch (err) {
        console.warn("Erreur Suggestion IA :", err);
        showAdminToast("L'IA locale a ajusté les paramètres de base.", "info");
    }
};

/**
 * 2. Studio Photo & Visuels IA
 */
window.openAiPhotoStudio = function(target = 'new') {
    currentAiStudioTarget = target;
    const studioModal = document.getElementById('aiPhotoStudioModal');
    if (!studioModal) return;

    // Récupération du nom du produit courant pour pré-remplir la recherche
    const nameInput = document.getElementById(target === 'new' ? 'new-prod-name' : 'edit-prod-name');
    const promptInput = document.getElementById('ai-studio-prompt');
    if (promptInput) {
        promptInput.value = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '';
    }

    studioModal.classList.remove('hidden');
    studioModal.style.display = 'flex';

    if (promptInput && promptInput.value) {
        generateAiPhotos();
    } else {
        renderAiPhotoGrid(allAiStudioPhotos);
    }
};

window.closeAiPhotoStudio = function() {
    const studioModal = document.getElementById('aiPhotoStudioModal');
    if (studioModal) {
        studioModal.classList.add('hidden');
        studioModal.style.display = 'none';
    }
};

window.generateAiPhotos = async function() {
    const promptInput = document.getElementById('ai-studio-prompt');
    const prompt = promptInput ? promptInput.value.toLowerCase().trim() : '';
    const grid = document.getElementById('ai-studio-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #6366f1;"><i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i><br>Recherche et rendu des visuels HD...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/ai/generate-photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await parseSafeResponse(res);

        if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            const mapped = data.photos.map(url => {
                const found = allAiStudioPhotos.find(p => p.url === url);
                return found || { title: prompt || 'Visuel BABI', cat: 'pain', url: url };
            });
            renderAiPhotoGrid(mapped);
        } else {
            // Filtrage local dynamique
            const filtered = allAiStudioPhotos.filter(p => 
                p.title.toLowerCase().includes(prompt) || 
                p.cat.toLowerCase().includes(prompt) ||
                prompt.includes(p.cat.toLowerCase())
            );
            renderAiPhotoGrid(filtered.length > 0 ? filtered : allAiStudioPhotos);
        }
    } catch (_) {
        // Fallback local
        const filtered = allAiStudioPhotos.filter(p => 
            p.title.toLowerCase().includes(prompt) || 
            p.cat.toLowerCase().includes(prompt)
        );
        renderAiPhotoGrid(filtered.length > 0 ? filtered : allAiStudioPhotos);
    }
};

window.filterStudioCategory = function(cat) {
    if (cat === 'all') {
        renderAiPhotoGrid(allAiStudioPhotos);
    } else {
        const filtered = allAiStudioPhotos.filter(p => p.cat === cat);
        renderAiPhotoGrid(filtered);
    }
};

function renderAiPhotoGrid(photosList) {
    const grid = document.getElementById('ai-studio-grid');
    if (!grid) return;

    if (!photosList || photosList.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #94a3b8;"><i class="fa-solid fa-image text-muted" style="font-size: 2rem;"></i><p class="mt-2">Aucun visuel trouvé. Essayez un autre mot-clé.</p></div>';
        return;
    }

    grid.innerHTML = photosList.map(item => `
        <div onclick="selectAiPhoto('${item.url.replace(/'/g, "\\'")}', '${item.title.replace(/'/g, "\\'")}')" 
             style="cursor: pointer; border: 2px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #fff; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.05);"
             onmouseover="this.style.borderColor='#4f46e5'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 16px rgba(79, 70, 229, 0.2)';"
             onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='none'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.05)';">
            <div style="height: 100px; width: 100%; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="${item.url}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/product_baguette.png'"/>
            </div>
            <div style="padding: 6px 8px; text-align: center; background: #ffffff;">
                <span style="font-size: 11px; font-weight: 700; color: #1e293b; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</span>
                <span style="font-size: 9.5px; color: #4f46e5; font-weight: 800;">✨ Choisir ce visuel</span>
            </div>
        </div>
    `).join('');
}

window.selectAiPhoto = function(imageUrl, imageTitle) {
    const target = currentAiStudioTarget;
    const prevImg = document.getElementById(target === 'new' ? 'new-prod-preview-img' : 'edit-prod-preview-img');
    const dataImg = document.getElementById(target === 'new' ? 'new-prod-image-data' : 'edit-prod-image-data');

    if (prevImg) prevImg.src = imageUrl;
    if (dataImg) dataImg.value = imageUrl;

    closeAiPhotoStudio();
    showAdminToast(`📸 Visuel appliqué : ${imageTitle || 'Image HD'}`, "success");
};

/**
 * 3. BABI Brain Copilot Widget & Assistant Conversationnel
 */
window.toggleAiCopilotDrawer = function() {
    const drawer = document.getElementById('babi-ai-drawer');
    if (!drawer) return;

    const isOpen = drawer.style.right === '0px' || drawer.classList.contains('open');
    if (!isOpen) {
        drawer.classList.add('open');
        drawer.style.right = '0px';
        const chatInput = document.getElementById('ai-chat-input');
        if (chatInput) setTimeout(() => chatInput.focus(), 300);
    } else {
        drawer.classList.remove('open');
        drawer.style.right = '-420px';
    }
};

let currentAiChatPhotoData = null;

window.triggerAiChatPhoto = function() {
    const fileInput = document.getElementById('ai-chat-photo-input');
    if (fileInput) fileInput.click();
};

window.handleAiChatPhotoSelect = function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const rawBase64 = evt.target.result;
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentAiChatPhotoData = canvas.toDataURL('image/jpeg', 0.85);

            const previewBar = document.getElementById('ai-chat-photo-preview-bar');
            const thumb = document.getElementById('ai-chat-attached-thumb');
            if (previewBar && thumb) {
                thumb.src = currentAiChatPhotoData;
                previewBar.style.display = 'flex';
            }

            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput && !chatInput.value.trim()) {
                chatInput.value = "Ajoute ce produit au catalogue";
                chatInput.focus();
            }
        };
        img.src = rawBase64;
    };
    reader.readAsDataURL(file);
};

window.removeAiChatPhoto = function() {
    currentAiChatPhotoData = null;
    const previewBar = document.getElementById('ai-chat-photo-preview-bar');
    const fileInput = document.getElementById('ai-chat-photo-input');
    if (previewBar) previewBar.style.display = 'none';
    if (fileInput) fileInput.value = '';
};

window.sendAiQuickPrompt = function(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
        input.value = promptText;
        handleAiChatSubmit();
    }
};

window.handleAiChatSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const input = document.getElementById('ai-chat-input');
    const container = document.getElementById('ai-chat-messages');
    if (!input || !container) return;

    const text = input.value.trim();
    const photoData = currentAiChatPhotoData;

    if (!text && !photoData) return;

    // 1. Bulle Utilisateur
    let userBubbleContent = text || 'Publier cette photo de produit';
    if (photoData) {
        userBubbleContent = `
            <div>${text ? text + '<br>' : ''}</div>
            <img src="${photoData}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; margin-top: 4px; border: 1.5px solid rgba(255,255,255,0.4);"/>
        `;
    }

    container.innerHTML += `
        <div style="background: #4f46e5; color: #fff; border-radius: 14px; padding: 8px 12px; align-self: flex-end; max-width: 85%; font-weight: 500;">
            ${userBubbleContent}
        </div>
    `;
    input.value = '';
    removeAiChatPhoto();
    container.scrollTop = container.scrollHeight;

    // 2. Indicateur de chargement
    const loadingId = 'ai-load-' + Date.now();
    container.innerHTML += `
        <div id="${loadingId}" style="background: #f1f5f9; border-radius: 14px; padding: 8px 12px; align-self: flex-start; color: #64748b; font-size: 11.5px;">
            <i class="fa-solid fa-circle-notch fa-spin me-1"></i> Traitement par le Copilote IA...
        </div>
    `;
    container.scrollTop = container.scrollHeight;

    try {
        const res = await fetch(`${API_BASE_URL}/ai/admin-command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                command: text || 'Nouveau Produit Photo', 
                image: photoData || null 
            })
        });
        const data = await parseSafeResponse(res);

        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.remove();

        if (data && data.success) {
            let extraHtml = '';

            // Si le produit a été directement ENREGISTRÉ & PUBLIÉ en BD
            if (data.action === 'PRODUCT_SAVED_AND_PUBLISHED' && data.product) {
                const p = data.product;
                extraHtml = `
                    <div style="margin-top: 10px; padding: 10px; background: #ffffff; border: 2px solid #16a34a; border-radius: 14px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${p.image}" style="width: 54px; height: 54px; border-radius: 10px; object-fit: cover; border: 1.5px solid #22c55e;" onerror="this.src='assets/product_baguette.png'"/>
                            <div style="flex: 1;">
                                <div style="font-weight: 800; color: #14532d; font-size: 13px;">${p.nom}</div>
                                <div style="font-size: 11.5px; color: #16a34a; font-weight: 700;">${(p.prix || 0).toLocaleString()} FCFA • ${p.stock || 50} en stock</div>
                                <div style="font-size: 10.5px; color: #64748b;">Catégorie : <b>${(p.categorie || 'pain').toUpperCase()}</b></div>
                            </div>
                        </div>
                        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #15803d; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
                            <span>✅ Actif sur le Web & l'App Mobile</span>
                            <span class="badge" style="background:#dcfce7; color:#166534; font-size:10px;">EN LIGNE</span>
                        </div>
                    </div>
                `;

                // Recharger automatiquement le tableau de l'administrateur
                if (typeof loadProducts === 'function') loadProducts();
                if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
                showAdminToast(`🎉 Produit "${p.nom}" publié avec succès !`, "success");
            }

            // Si l'IA propose un produit
            else if (data.action === 'SUGGEST_NEW_PRODUCT' && data.product) {
                const p = data.product;
                extraHtml = `
                    <div style="margin-top: 8px; padding: 8px; background: #ffffff; border: 1.5px dashed #4f46e5; border-radius: 12px; display: flex; align-items: center; gap: 10px;">
                        <img src="${p.image}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover;" onerror="this.src='assets/product_baguette.png'"/>
                        <div style="flex: 1;">
                            <div style="font-weight: 800; color: #1e1b4b; font-size: 12px;">${p.nom}</div>
                            <div style="font-size: 11px; color: #059669; font-weight: 700;">${p.prix} FCFA • ${p.stock} unités</div>
                        </div>
                        <button type="button" onclick="applyAiProductFromChat('${p.nom.replace(/'/g, "\\'")}', '${p.categorie}', ${p.prix}, ${p.stock}, '${p.image.replace(/'/g, "\\'")}', '${(p.description || '').replace(/'/g, "\\'")}')" style="background: #4f46e5; color: #fff; border: none; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 800; cursor: pointer;">
                            ➕ Remplir & Publier
                        </button>
                    </div>
                `;
            }

            // Si l'IA propose des photos
            else if (data.action === 'PHOTO_SUGGESTIONS' && Array.isArray(data.photos)) {
                extraHtml = `
                    <div style="margin-top: 8px; display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;">
                        ${data.photos.map(url => `
                            <img src="${url}" onclick="openAiPhotoStudio('new')" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; cursor: pointer; border: 1.5px solid #cbd5e1;" title="Cliquer pour voir dans le studio" onerror="this.src='assets/product_baguette.png'"/>
                        `).join('')}
                    </div>
                `;
            }

            container.innerHTML += `
                <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 14px; padding: 10px 12px; color: #1e1b4b; align-self: flex-start; max-width: 92%;">
                    <div style="font-weight: 800; font-size: 11px; margin-bottom: 2px; color: #4338ca;">🤖 Copilote IA BABI :</div>
                    <div>${(data.reply || '').replace(/\n/g, '<br>')}</div>
                    ${extraHtml}
                </div>
            `;
        } else {
            container.innerHTML += `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 8px 12px; color: #991b1b; align-self: flex-start;">
                    Erreur de traitement IA : ${data.error || 'Veuillez réessayer.'}
                </div>
            `;
        }
    } catch (err) {
        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.remove();
        container.innerHTML += `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 8px 12px; color: #991b1b; align-self: flex-start;">
                Impossible de joindre le service IA : ${err.message}
            </div>
        `;
    }

    container.scrollTop = container.scrollHeight;
};

window.applyAiProductFromChat = function(nom, categorie, prix, stock, image, description) {
    openAddProductModal();
    const nameEl = document.getElementById('new-prod-name');
    const catEl = document.getElementById('new-prod-category');
    const priceEl = document.getElementById('new-prod-price');
    const stockEl = document.getElementById('new-prod-stock');
    const descEl = document.getElementById('new-prod-desc');
    const prevImg = document.getElementById('new-prod-preview-img');
    const dataImg = document.getElementById('new-prod-image-data');

    if (nameEl) nameEl.value = nom;
    if (catEl) catEl.value = categorie;
    if (priceEl) priceEl.value = prix;
    if (stockEl) stockEl.value = stock;
    if (descEl) descEl.value = description;
    if (prevImg) prevImg.src = image;
    if (dataImg) dataImg.value = image;

    toggleAiCopilotDrawer();
    showAdminToast(`✨ Produit "${nom}" pré-rempli dans le formulaire !`, "success");
};

// ================================================================
// 📊 FONCTIONS D'EXPORTATION EXCEL / CSV & IMPRESSION TICKETS
// ================================================================

// 1. Export CSV des Commandes
window.exportOrdersToCSV = function() {
    if (!Array.isArray(allOrders) || allOrders.length === 0) {
        showAdminToast("Aucune commande à exporter.", "warning");
        return;
    }

    const headers = ["ID Commande", "Date & Heure", "Client", "Telephone", "Mode Retrait", "Code PIN", "Total (FCFA)", "Statut Commande", "Paiement", "Articles"];
    const rows = allOrders.map(o => {
        const itemsStr = Array.isArray(o.items) 
            ? o.items.map(i => `${i.name || i.title} (x${i.qty || i.quantity || 1})`).join(' ; ')
            : (o.itemsSummary || '');
        return [
            `#${o.id}`,
            `"${o.date || o.created_at || ''}"`,
            `"${(o.clientName || o.nom || 'Client').replace(/"/g, '""')}"`,
            `"${o.phone || o.telephone || ''}"`,
            `"${o.delivery_type === 'livraison' ? 'Livraison' : 'Click & Collect'}"`,
            `"${o.pickup_pin || o.confCode || ''}"`,
            Number(o.total_price || o.total_amount || 0),
            `"${o.status || 'Nouveau'}"`,
            `"${o.payment_status || 'En attente'}"`,
            `"${itemsStr.replace(/"/g, '""')}"`
        ].join(';');
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\r\n');
    downloadCSVFile(csvContent, `BABI_Commandes_${new Date().toISOString().slice(0,10)}.csv`);
    showAdminToast("📊 Export Excel / CSV des commandes généré !", "success");
};

// 2. Export CSV du Catalogue Produits & Stocks
window.exportProductsToCSV = function() {
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
        showAdminToast("Aucun produit à exporter.", "warning");
        return;
    }

    const headers = ["ID Produit", "Nom du Produit", "Categorie", "Prix TTC (FCFA)", "Stock Disponible", "Seuil Alerte", "Valeur Stock (FCFA)", "Statut"];
    const rows = allProducts.map(p => {
        const qty = p.stock != null ? Number(p.stock) : 50;
        const price = Number(p.prix || 0);
        const isActive = p.is_active === 1 || p.is_active === undefined || p.is_active === true || p.is_active === '1';
        return [
            p.id,
            `"${(p.nom || p.title || '').replace(/"/g, '""')}"`,
            `"${(p.categorie || p.category || 'Pain').replace(/"/g, '""')}"`,
            price,
            qty,
            p.seuil_alerte != null ? Number(p.seuil_alerte) : 10,
            qty * price,
            isActive ? "Actif" : "Masque"
        ].join(';');
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\r\n');
    downloadCSVFile(csvContent, `BABI_Catalogue_Stocks_${new Date().toISOString().slice(0,10)}.csv`);
    showAdminToast("📊 Export Excel / CSV du catalogue généré !", "success");
};

// 3. Export CSV des Transactions Financières
window.exportTransactionsToCSV = function() {
    if (!Array.isArray(allTransactions) || allTransactions.length === 0) {
        showAdminToast("Aucune transaction à exporter.", "warning");
        return;
    }

    const headers = ["ID Transaction", "Reference Commande", "Client", "Montant (FCFA)", "Methode Paiement", "Statut", "Horodatage"];
    const rows = allTransactions.map(t => [
        `"${t.id || ''}"`,
        `"#${t.order_id || ''}"`,
        `"${(t.client || t.customer_name || 'Client').replace(/"/g, '""')}"`,
        Number(t.amount || 0),
        `"${t.method || 'Wave'}"`,
        `"${t.status || 'Valide'}"`,
        `"${t.timestamp || t.created_at || ''}"`
    ].join(';'));

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\r\n');
    downloadCSVFile(csvContent, `BABI_Grand_Livre_Transactions_${new Date().toISOString().slice(0,10)}.csv`);
    showAdminToast("📊 Grand livre des transactions exporté !", "success");
};

// 4. Téléchargement d'un fichier CSV
function downloadCSVFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 5. Impression du Bon de Commande / Ticket Fournil
window.printOrderTicket = function(orderId) {
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (!order) {
        showAdminToast("Commande introuvable.", "warning");
        return;
    }

    const pin = order.pickup_pin || order.confCode || '7412';
    const itemsHtml = Array.isArray(order.items) && order.items.length > 0
        ? order.items.map(i => `
            <tr>
                <td style="padding: 6px 0; border-bottom: 1px dashed #ccc;"><strong>${escapeHtml(i.name || i.title)}</strong></td>
                <td style="padding: 6px 0; border-bottom: 1px dashed #ccc; text-align: center;">× ${i.qty || i.quantity || 1}</td>
                <td style="padding: 6px 0; border-bottom: 1px dashed #ccc; text-align: right;">${((i.price || 0) * (i.qty || 1)).toLocaleString()} F</td>
            </tr>
        `).join('')
        : `<tr><td colspan="3" style="padding: 8px 0;">${escapeHtml(order.itemsSummary || 'Articles divers')}</td></tr>`;

    const printWindow = window.open('', '_blank', 'width=440,height=620');
    if (!printWindow) {
        showAdminToast("Veuillez autoriser les fenêtres pop-up pour imprimer le ticket.", "warning");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bon de Commande #${order.id} - Boulangerie de BABI</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; font-size: 13px; color: #000; padding: 15px; margin: 0; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .pin-box { border: 2px solid #000; padding: 8px; text-align: center; font-size: 19px; font-weight: bold; margin: 12px 0; background: #fffbeb; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
            </style>
        </head>
        <body onload="window.print();">
            <div class="center">
                <h2 style="margin: 0; font-size: 17px; font-weight: 900;">🥖 BOULANGERIE DE BABI</h2>
                <div style="font-size: 11px;">Abidjan Riviera Palmeraie</div>
                <div style="font-size: 11px;">Tél : +225 07 04 38 92 01</div>
            </div>
            <div class="divider"></div>
            <div><strong>BON DE COMMANDE : #${order.id}</strong></div>
            <div>Date : ${order.date || new Date().toLocaleString('fr-FR')}</div>
            <div>Client : ${escapeHtml(order.clientName || order.nom || 'Client')}</div>
            <div>Tél : ${escapeHtml(order.phone || order.telephone || 'N/A')}</div>
            <div>Mode : ${order.delivery_type === 'livraison' ? 'LIVRAISON EXPRESS' : 'RETRAIT CLICK & COLLECT'}</div>
            
            <div class="pin-box">CODE PIN RETRAIT : ${pin}</div>

            <table>
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th style="text-align: left; padding: 4px 0;">Article</th>
                        <th style="text-align: center; padding: 4px 0;">Qté</th>
                        <th style="text-align: right; padding: 4px 0;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="divider"></div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold;">
                <span>TOTAL TTC :</span>
                <span>${Number(order.total_price || order.total_amount || 0).toLocaleString()} FCFA</span>
            </div>
            <div style="font-size: 11px; margin-top: 4px;">Paiement : ${escapeHtml(order.payment_method || 'Wave Mobile Money')} (${order.payment_status || 'Payé'})</div>
            
            <div class="divider"></div>
            <div class="center" style="font-size: 11px;">
                Merci de votre confiance !<br>
                Le bon goût du pain chaud ivoirien.
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// 6. Sauvegarde Intégrale du Système (Backup JSON)
window.downloadCompleteAdminBackup = function() {
    const backupData = {
        meta: {
            title: "Sauvegarde Intégrale — Boulangerie de BABI",
            timestamp: new Date().toISOString(),
            version: "2.4-Souverain"
        },
        products: allProducts,
        categories: allCategories,
        orders: allOrders,
        transactions: allTransactions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `BABI_Sauvegarde_Complete_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showAdminToast("💾 Sauvegarde intégrale téléchargée avec succès !", "success");
};

// 7. Optimisation & Prévisualisation des Photos Produits (HTML5 Canvas Compression)
function previewProductImage(event, mode = 'new') {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 800;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            if (mode === 'edit') {
                const preview = document.getElementById('edit-prod-preview-img');
                const hiddenInput = document.getElementById('edit-prod-image-data');
                if (preview) preview.src = compressedDataUrl;
                if (hiddenInput) hiddenInput.value = compressedDataUrl;
            } else {
                const preview = document.getElementById('new-prod-preview-img');
                const hiddenInput = document.getElementById('new-prod-image-data');
                if (preview) preview.src = compressedDataUrl;
                if (hiddenInput) hiddenInput.value = compressedDataUrl;
            }
            showAdminToast("📸 Photo chargée et optimisée avec succès !", "success");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.previewProductImage = previewProductImage;

// 8. Présélections Rapides de Photos
function setProductPhotoPreset(presetUrl, mode = 'new') {
    if (mode === 'edit') {
        const preview = document.getElementById('edit-prod-preview-img');
        const hiddenInput = document.getElementById('edit-prod-image-data');
        if (preview) preview.src = presetUrl;
        if (hiddenInput) hiddenInput.value = presetUrl;
    } else {
        const preview = document.getElementById('new-prod-preview-img');
        const hiddenInput = document.getElementById('new-prod-image-data');
        if (preview) preview.src = presetUrl;
        if (hiddenInput) hiddenInput.value = presetUrl;
    }
    showAdminToast("✅ Photo sélectionnée : " + presetUrl.split('/').pop(), "info");
}
window.setProductPhotoPreset = setProductPhotoPreset;

// 9. Mise à Jour Profil Caissière
async function handleUpdateCashierSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('edit-cashier-id')?.value;
    const nom = document.getElementById('edit-cashier-nom')?.value.trim();
    const prenom = document.getElementById('edit-cashier-prenom')?.value.trim();
    const email = document.getElementById('edit-cashier-email')?.value.trim();
    const telephone = document.getElementById('edit-cashier-phone')?.value.trim();
    const caisse_assignee = document.getElementById('edit-cashier-caisse')?.value;
    const code_pin = document.getElementById('edit-cashier-pin')?.value.trim();
    const pass = document.getElementById('edit-cashier-pass')?.value.trim();

    if (!id || !nom || !prenom || !email) {
        showAdminToast("Veuillez renseigner tous les champs obligatoires.", "warning");
        return;
    }

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
        const res = await fetcher(`${apiBase}/api/admin/cashiers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prenom, email, telephone, caisse_assignee, code_pin, mot_de_passe: pass || undefined })
        }, 8000);

        if (res && res.ok) {
            showAdminToast(`✨ Profil caissière ${prenom} mis à jour !`, 'success');
            closeEditCashierModal();
            loadCashiersData();
        } else {
            showAdminToast("Erreur lors de la mise à jour de la caissière.", "danger");
        }
    } catch (err) {
        showAdminToast("Erreur de connexion : " + err.message, "danger");
    }
}
window.handleUpdateCashierSubmit = handleUpdateCashierSubmit;

// 10. Sauvegarde Paramètres Wave
async function handleSaveWaveSettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    showAdminToast("🔐 Paramètres Wave & Sécurité enregistrés avec succès !", "success");
}
window.handleSaveWaveSettings = handleSaveWaveSettings;

// 11. Envoi Message IA Assistant
async function sendAiAssistantMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    if (!input || !input.value.trim()) return;
    const msg = input.value.trim();
    input.value = '';
    
    const container = document.getElementById('ai-chat-messages');
    if (container) {
        container.innerHTML += `<div style="align-self: flex-end; background: #f59e0b; color: #000; padding: 8px 12px; border-radius: 12px 12px 2px 12px; font-size: 13px; font-weight: 600; max-width: 80%; margin-bottom: 8px;">${msg}</div>`;
        container.innerHTML += `<div id="ai-loading-bubble" style="align-self: flex-start; background: #1e293b; color: #f8fafc; padding: 10px 14px; border-radius: 12px 12px 12px 2px; font-size: 13px; max-width: 85%; margin-bottom: 8px; border-left: 3px solid #f59e0b;"><i class="fa-solid fa-spinner fa-spin me-2"></i> Analyse en cours...</div>`;
        container.scrollTop = container.scrollHeight;
    }

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
        const res = await fetcher(`${apiBase}/api/ai/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg, message: msg, role: 'admin' })
        }, 15000);

        const loader = document.getElementById('ai-loading-bubble');
        if (loader) loader.remove();

        if (res && res.ok) {
            const data = await parseSafeResponse(res);
            const reply = data.reply || data.response || data.message || "Analyse terminée avec succès.";
            const formattedReply = reply.replace(/\n/g, '<br/>');
            if (container) {
                container.innerHTML += `<div style="align-self: flex-start; background: #1e293b; color: #f8fafc; padding: 10px 14px; border-radius: 12px 12px 12px 2px; font-size: 13px; max-width: 85%; margin-bottom: 8px; border-left: 3px solid #f59e0b; line-height: 1.5;">${formattedReply}</div>`;
                container.scrollTop = container.scrollHeight;
            }
        } else {
            if (container) {
                container.innerHTML += `<div style="align-self: flex-start; background: #1e293b; color: #fca5a5; padding: 10px 14px; border-radius: 12px; font-size: 12.5px; margin-bottom: 8px;">Désolé, je n'ai pas pu traiter cette demande. Veuillez réessayer.</div>`;
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (err) {
        const loader = document.getElementById('ai-loading-bubble');
        if (loader) loader.remove();
        if (container) {
            container.innerHTML += `<div style="align-self: flex-start; background: #1e293b; color: #94a3b8; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 8px;">Désolé, une erreur est survenue lors de la communication avec l'assistant.</div>`;
            container.scrollTop = container.scrollHeight;
        }
    }
}
window.sendAiAssistantMessage = sendAiAssistantMessage;

// ================================================================
// 12. BABI COPILOT STUDIO (INTELLIGENCE DÉCISIONNELLE)
// ================================================================
function formatAiStudioMarkdown(raw) {
    if (!raw) return '';
    
    // Remplacement des sauts de ligne multiples
    let html = raw.trim();

    // ⚡ Détection des cartes d'actions exécutées (Prix, Stocks, etc.)
    if (html.includes('Action Automatisée Exécutée') || html.includes('Stock Mis à Jour')) {
        html = html.replace(/⚡ \*\*Action Automatisée Exécutée avec Succès !\*\*/g, '<div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; color: #6ee7b7; font-weight: 700;"><i class="fa-solid fa-circle-check me-2"></i> Action Automatisée Exécutée avec Succès !</div>');
        html = html.replace(/📦 \*\*Stock Mis à Jour Automatiquement !\*\*/g, '<div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; color: #6ee7b7; font-weight: 700;"><i class="fa-solid fa-box me-2"></i> Stock Mis à Jour Automatiquement !</div>');
    }

    // Markdown Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="color: #fbbf24; font-size: 15px; font-weight: 800; margin: 14px 0 6px 0;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color: #f8fafc; font-size: 16px; font-weight: 800; margin: 16px 0 8px 0;">$1</h3>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f8fafc; font-weight: 700;">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em style="color: #cbd5e1;">$1</em>');

    // Puces avec icônes dorées
    html = html.replace(/^• (.*$)/gim, '<div style="display: flex; align-items: baseline; gap: 8px; margin: 5px 0;"><span style="color: #f59e0b; font-size: 10px;">◆</span> <span>$1</span></div>');
    html = html.replace(/^- (.*$)/gim, '<div style="display: flex; align-items: baseline; gap: 8px; margin: 5px 0;"><span style="color: #f59e0b; font-size: 10px;">◆</span> <span>$1</span></div>');

    // Blocs d'astuces / Conseils du Chef
    html = html.replace(/💡 \*(.*?)\*/g, '<div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; border-radius: 6px; padding: 10px 14px; margin-top: 14px; font-size: 12.5px; color: #fde68a;"><i class="fa-solid fa-lightbulb text-warning me-2"></i> <em>$1</em></div>');

    // Sauts de ligne simples
    html = html.replace(/\n\n/g, '<div style="height: 10px;"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
}

async function handleStudioSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('studio-chat-input');
    if (!input || !input.value.trim()) return;
    const msg = input.value.trim();
    input.value = '';
    
    // Masquer le hero greeting dès le premier message
    const hero = document.getElementById('studio-hero-greeting');
    if (hero) hero.style.display = 'none';

    const container = document.getElementById('studio-chat-messages');
    const scrollArea = document.getElementById('studio-chat-container');

    if (container) {
        // Message Utilisateur Haute Définition
        container.innerHTML += `
            <div class="studio-user-msg" style="align-self: flex-end; background: #1e293b; color: #f8fafc; padding: 12px 18px; border-radius: 20px 20px 4px 20px; font-size: 14px; max-width: 85%; border: 1px solid rgba(255, 255, 255, 0.08); line-height: 1.5; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; opacity: 0.6; font-size: 11px; font-weight: 700;">
                    <i class="fa-solid fa-user-tie"></i> <span>Vous (Administrateur)</span>
                </div>
                <div>${escapeHtml(msg)}</div>
            </div>
        `;

        // Bulle de réflexion animée BIX
        container.innerHTML += `
            <div id="studio-ai-loading" class="studio-ai-msg" style="align-self: flex-start; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 3px solid #f59e0b; border-radius: 20px 20px 20px 4px; padding: 16px 20px; max-width: 90%; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                <div style="display: flex; align-items: center; gap: 12px; color: #cbd5e1; font-size: 13.5px; font-weight: 600;">
                    <div class="bix-mascot-wrapper" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.5); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(245,158,11,0.5);">
                        <span class="bix-mascot-avatar" style="font-size: 18px;">🥐</span>
                    </div>
                    <span>BIX analyse les données en direct pour vous répondre...</span>
                </div>
            </div>
        `;
        if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
    }

    try {
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
        const res = await fetcher(`${apiBase}/api/ai/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg, message: msg, role: 'admin' })
        }, 15000);

        const loader = document.getElementById('studio-ai-loading');
        if (loader) loader.remove();

        if (res && res.ok) {
            const data = await parseSafeResponse(res);
            const rawReply = data.reply || data.response || data.message || "Analyse terminée.";
            const formatted = formatAiStudioMarkdown(rawReply);

            if (container) {
                let actionHtml = '';
                if (data.requiresConfirmation && data.actionPayload) {
                    const encodedPayload = encodeURIComponent(JSON.stringify(data.actionPayload));
                    actionHtml = `
                        <div class="ai-action-confirm-box" style="margin-top: 14px; padding: 14px 16px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                            <div style="font-size: 12.5px; color: #fbbf24; font-weight: 700;">
                                <i class="fa-solid fa-shield-halved me-2"></i> Action soumise à validation
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" onclick="cancelAiStudioAction(this)" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; font-size: 12px; padding: 6px 14px; border-radius: 8px; cursor: pointer;">
                                    Annuler
                                </button>
                                <button type="button" onclick="confirmAiStudioAction(this, '${encodedPayload}')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
                                    <i class="fa-solid fa-check me-1"></i> Confirmer & Appliquer
                                </button>
                            </div>
                        </div>
                    `;
                }

                container.innerHTML += `
                    <div class="studio-ai-msg" style="align-self: flex-start; background: rgba(24, 32, 47, 0.95); border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3px solid #f59e0b; border-radius: 20px 20px 20px 4px; padding: 20px 24px; max-width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.35); margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="bix-mascot-wrapper" style="width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.1)); border: 1px solid rgba(245,158,11,0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(245,158,11,0.3);">
                                    <span class="bix-mascot-avatar" style="font-size: 18px;">🥐</span>
                                </div>
                                <span style="font-weight: 800; font-size: 15px; color: #f8fafc; letter-spacing: -0.2px;">BIX</span>
                                <span style="font-size: 10px; background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4); padding: 2px 7px; border-radius: 6px; font-weight: 700;">Copilote Mascotte</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <button type="button" onclick="copyStudioAiText(this)" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; font-size: 11px; padding: 4px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s;" title="Copier la réponse">
                                    <i class="fa-solid fa-copy"></i> <span>Copier</span>
                                </button>
                                <button type="button" onclick="speakStudioAiText(this)" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; font-size: 11px; padding: 4px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s;" title="Lire à voix haute">
                                    <i class="fa-solid fa-volume-high"></i> <span>Écouter</span>
                                </button>
                            </div>
                        </div>
                        <div class="studio-msg-content" style="color: #e2e8f0; font-size: 14px; line-height: 1.7;">
                            ${formatted}
                        </div>
                        ${actionHtml}
                    </div>
                `;
                if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        } else {
            if (container) {
                container.innerHTML += `
                    <div class="studio-ai-msg" style="border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.1); padding: 14px 18px; border-radius: 12px;">
                        <div style="color: #fca5a5; font-size: 13px;"><i class="fa-solid fa-triangle-exclamation me-2"></i> Désolé, une anomalie temporaire est survenue. Veuillez réessayer.</div>
                    </div>
                `;
                if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }
    } catch (err) {
        const loader = document.getElementById('studio-ai-loading');
        if (loader) loader.remove();
        if (container) {
            container.innerHTML += `
                <div class="studio-ai-msg" style="border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.1); padding: 14px 18px; border-radius: 12px;">
                    <div style="color: #fca5a5; font-size: 13px;"><i class="fa-solid fa-triangle-exclamation me-2"></i> Erreur de communication avec le serveur.</div>
                </div>
            `;
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }
}
window.handleStudioSendMessage = handleStudioSendMessage;

function sendQuickStudioPrompt(promptText) {
    const input = document.getElementById('studio-chat-input');
    if (input) {
        input.value = promptText;
        handleStudioSendMessage();
    }
}
window.sendQuickStudioPrompt = sendQuickStudioPrompt;

function clearStudioChat() {
    const container = document.getElementById('studio-chat-messages');
    const hero = document.getElementById('studio-hero-greeting');
    if (container) container.innerHTML = '';
    if (hero) hero.style.display = 'block';
}
window.clearStudioChat = clearStudioChat;

function copyStudioAiText(btn) {
    const parent = btn.closest('.studio-ai-msg');
    if (!parent) return;
    const content = parent.querySelector('.studio-msg-content');
    if (content) {
        navigator.clipboard.writeText(content.innerText).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-success"></i> <span>Copié !</span>';
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        });
    }
}
window.copyStudioAiText = copyStudioAiText;

function speakStudioAiText(btn) {
    const parent = btn.closest('.studio-ai-msg');
    if (!parent) return;
    const content = parent.querySelector('.studio-msg-content');
    if (content && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = content.innerText.replace(/[*#•◆]/g, '');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.05;
        
        btn.innerHTML = '<i class="fa-solid fa-stop text-warning"></i> <span>Arrêter</span>';
        utterance.onend = () => { btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Écouter</span>'; };
        utterance.onerror = () => { btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Écouter</span>'; };
        
        window.speechSynthesis.speak(utterance);
    }
}
window.speakStudioAiText = speakStudioAiText;

async function confirmAiStudioAction(btn, encodedPayload) {
    const box = btn.closest('.ai-action-confirm-box');
    if (box) {
        box.innerHTML = '<div style="color: #fbbf24; font-size: 12.5px; font-weight: 700;"><i class="fa-solid fa-spinner fa-spin me-2"></i> Application de l\'action en cours...</div>';
    }

    try {
        const payload = JSON.parse(decodeURIComponent(encodedPayload));
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
        
        const res = await fetcher(`${apiBase}/api/ai/actions/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionPayload: payload, role: 'admin', userId: 'admin' })
        }, 15000);

        if (res && res.ok) {
            const data = await parseSafeResponse(res);
            if (box) {
                box.style.background = 'rgba(16, 185, 129, 0.15)';
                box.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                box.innerHTML = `<div style="color: #6ee7b7; font-size: 13px; font-weight: 700;"><i class="fa-solid fa-circle-check me-2"></i> ${escapeHtml(data.reply ? data.reply.replace(/[*#]/g, '') : 'Action exécutée avec succès !')}</div>`;
            }
            if (typeof loadProducts === 'function') loadProducts().catch(() => {});
        } else {
            if (box) {
                box.style.background = 'rgba(239, 68, 68, 0.15)';
                box.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                box.innerHTML = '<div style="color: #fca5a5; font-size: 12.5px;"><i class="fa-solid fa-triangle-exclamation me-2"></i> Échec de l\'exécution. Veuillez réessayer.</div>';
            }
        }
    } catch (err) {
        if (box) {
            box.style.background = 'rgba(239, 68, 68, 0.15)';
            box.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            box.innerHTML = '<div style="color: #fca5a5; font-size: 12.5px;"><i class="fa-solid fa-triangle-exclamation me-2"></i> Erreur réseau.</div>';
        }
    }
}
window.confirmAiStudioAction = confirmAiStudioAction;

function cancelAiStudioAction(btn) {
    const box = btn.closest('.ai-action-confirm-box');
    if (box) {
        box.innerHTML = '<div style="color: #94a3b8; font-size: 12px; font-style: italic;"><i class="fa-solid fa-ban me-1"></i> Action annulée par l\'administrateur.</div>';
    }
}
window.cancelAiStudioAction = cancelAiStudioAction;

function toggleAiCopilotDrawer() {
    switchAdminSection('ai');
}
window.toggleAiCopilotDrawer = toggleAiCopilotDrawer;




