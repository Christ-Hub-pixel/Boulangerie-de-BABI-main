// ================================================================
// BABI ADMIN COCKPIT & WAVE PAYOUT v1 CONTROLLER
// ================================================================

const API_ROOT = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';

let allOrders = [];
let allProducts = [];
let allCashiers = [];
let allUsers = [];
let allTransactions = [];
let allWavePayouts = [];
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

    // 2. Initialiser les graphiques Chart.js
    initSaasCharts();

    // 3. Charger toutes les données initiales
    fetchAdminData();

    // 4. Écouter le bus de synchronisation temps réel
    try {
        const globalChan = new BroadcastChannel('babi_global_sync');
        globalChan.onmessage = (e) => {
            fetchAdminData();
        };
    } catch (_) {}

    window.addEventListener('storage', (e) => {
        if (!e.key || e.key.includes('orders') || e.key.includes('sales') || e.key.includes('babi') || e.key.includes('sync')) {
            fetchAdminData();
        }
    });

    // 5. Polling de rafraîchissement intelligent (Événementiel + fallback 30s)
    setInterval(fetchAdminData, 30000);

    // 6. BABI Brain Engine (BBE v3.0) — Flux IA et Prévisions Business
    initAdminBrainFeed();
    fetchAdminAiBusinessForecast();
    setInterval(fetchAdminAiBusinessForecast, 180000);
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
        'products': { title: 'Catalogue & Fournil', subtitle: 'Gestion des 48 produits, stocks et seuils d\'alerte' },
        'users': { title: 'Personnel & Clients', subtitle: 'Comptes collaborateurs, gérantes et clients du Club Fidélité' },
        'audit': { title: 'Sécurité & Audit Logs', subtitle: 'Détection IDS/IPS, intégrité Merkle et pare-feu anti-fraude' },
        'settings': { title: 'Paramètres & Configuration', subtitle: 'Clés Wave Business, signature HMAC-SHA256 et préférences' }
    };

    const info = titles[sectionId] || titles['dashboard'];
    const titleEl = document.getElementById('current-section-title');
    const subEl = document.getElementById('current-section-subtitle');
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.subtitle;

    // Actions spécifiques par onglet
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

function closeMobileSidebar() {
    const sidebar = document.getElementById('saasSidebar');
    const backdrop = document.getElementById('saasSidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
}

function initAdminNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`section-${hash}`)) {
        switchAdminSection(hash);
    }
}

// ================================================================
// 2. DATA FETCHING ENGINE & REAL-TIME RECONCILIATION
// ================================================================
async function fetchAdminData() {
    try {
        await Promise.all([
            loadStats(),
            loadOrders(),
            loadProducts(),
            loadCashiersData(),
            loadUsers(),
            loadTransactions()
        ]);
    } catch (e) {
        console.warn("[Admin Sync] Note de rafraîchissement:", e.message);
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API_ROOT}/api/stats`);
        if (!res.ok) return;
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
        const res = await fetch(`${API_ROOT}/api/orders`);
        if (!res.ok) return;
        allOrders = await res.json();

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
        console.error("Erreur chargement commandes:", e);
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
        ${!isRefunded ? `
            <button type="button" class="btn-xs btn-outline-danger py-2 px-3 fw-bold" onclick="closeOrderDetailModal(); handleDirectRefundOrder('${order.id}');">
                <i class="fa-solid fa-rotate-left me-1"></i> Rembourser Wave
            </button>
        ` : ''}
        <button type="button" class="btn-modal-submit-gold" onclick="updateOrderStatusFromModal('${order.id}', 'pret')">
            <i class="fa-solid fa-check me-1"></i> Marquer Prête
        </button>
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
// ================================================================
// 5. PRODUCTS & USERS MANAGEMENT (CRUD COMPLET DU CATALOGUE)
// ================================================================
async function loadProducts() {
    try {
        const res = await fetch(`${API_ROOT}/api/products`);
        if (!res.ok) return;
        allProducts = await res.json();

        const countEl = document.getElementById('kpi-products-count');
        if (countEl) countEl.textContent = allProducts.length;

        const tbody = document.getElementById('products-full-tbody');
        if (!tbody) return;

        if (allProducts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Aucun produit dans le catalogue. Cliquez sur "+ Ajouter un Produit".</td></tr>`;
            return;
        }

        tbody.innerHTML = allProducts.map(p => {
            const isActive = p.is_active === 1 || p.is_active === undefined || p.is_active === true || p.is_active === '1';
            const imgSrc = p.image || p.image_url || 'assets/product_baguette.png';
            const stockQty = p.stock != null ? p.stock : 50;
            const alertThreshold = p.seuil_alerte != null ? p.seuil_alerte : 10;
            const isLowStock = stockQty <= alertThreshold;

            return `
            <tr style="${!isActive ? 'opacity: 0.65; background: #fafafa;' : ''}">
                <td>
                    <img src="${imgSrc}" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.06);" onerror="this.src='assets/product_baguette.png'">
                </td>
                <td>
                    <div style="font-weight: 700; color: #1e293b;">${escapeHtml(p.nom || p.title)}</div>
                    ${p.description ? `<small class="text-muted text-truncate d-block" style="max-width: 200px; font-size: 11px;">${escapeHtml(p.description)}</small>` : ''}
                </td>
                <td><span class="badge bg-light text-dark border px-2 py-1">${escapeHtml(p.categorie || p.category || 'Pain')}</span></td>
                <td><strong style="color: #b45309;">${(Number(p.prix) || 0).toLocaleString()} FCFA</strong></td>
                <td>
                    <span class="fw-bold ${isLowStock ? 'text-danger' : 'text-success'}">
                        ${stockQty} unités
                    </span>
                    ${isLowStock ? `<span class="badge bg-danger ms-1" style="font-size: 9px;">Bas</span>` : ''}
                </td>
                <td class="text-muted small">${alertThreshold} un.</td>
                <td>
                    ${isActive 
                        ? `<span class="saas-badge-pill active" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-size:11px; padding:3px 8px; border-radius:12px;"><i class="fa-solid fa-circle-check me-1 text-success"></i> Actif</span>`
                        : `<span class="saas-badge-pill inactive" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; font-size:11px; padding:3px 8px; border-radius:12px;"><i class="fa-solid fa-ban me-1 text-danger"></i> Désactivé</span>`
                    }
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn-xs btn-outline-primary me-1" onclick="openEditProductModal(${p.id})" title="Modifier le produit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" class="btn-xs ${isActive ? 'btn-outline-warning' : 'btn-outline-success'} me-1" onclick="handleToggleProductStatus(${p.id})" title="${isActive ? 'Désactiver (Masquer)' : 'Activer (Rendre visible)'}">
                        <i class="fa-solid ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button type="button" class="btn-xs btn-outline-danger" onclick="handleDeleteProduct(${p.id})" title="Supprimer définitivement">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Erreur chargement produits:", err);
    }
}

// 🖼️ GESTION DU SÉLECTEUR DE PHOTO PRODUIT (GALERIE & FICHIERS)
function handleProductImageSelect(event, modalType) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const previewEl = document.getElementById(`${modalType}-prod-preview-img`);
        const hiddenDataEl = document.getElementById(`${modalType}-prod-image-data`);
        
        if (previewEl) previewEl.src = base64Data;
        if (hiddenDataEl) hiddenDataEl.value = base64Data;
    };
    reader.readAsDataURL(file);
}

// 🟢 MODAL AJOUT PRODUIT
function openAddProductModal() {
    const form = document.getElementById('addProductModal');
    if (!form) return;
    
    // Reset form fields
    const nameEl = document.getElementById('new-prod-name');
    const priceEl = document.getElementById('new-prod-price');
    const stockEl = document.getElementById('new-prod-stock');
    const alertEl = document.getElementById('new-prod-alert');
    const descEl = document.getElementById('new-prod-desc');
    const previewEl = document.getElementById('new-prod-preview-img');
    const dataEl = document.getElementById('new-prod-image-data');
    const fileEl = document.getElementById('new-prod-file');

    if (nameEl) nameEl.value = '';
    if (priceEl) priceEl.value = '';
    if (stockEl) stockEl.value = '50';
    if (alertEl) alertEl.value = '10';
    if (descEl) descEl.value = '';
    if (previewEl) previewEl.src = 'assets/product_baguette.png';
    if (dataEl) dataEl.value = 'assets/product_baguette.png';
    if (fileEl) fileEl.value = '';

    form.classList.remove('hidden');
}

function closeAddProductModal() {
    document.getElementById('addProductModal')?.classList.add('hidden');
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
    const nom = document.getElementById('new-prod-name')?.value.trim();
    const categorie = document.getElementById('new-prod-category')?.value;
    const prix = Number(document.getElementById('new-prod-price')?.value);
    const stock = Number(document.getElementById('new-prod-stock')?.value) || 50;
    const seuil_alerte = Number(document.getElementById('new-prod-alert')?.value) || 10;
    const description = document.getElementById('new-prod-desc')?.value.trim() || '';
    const image = document.getElementById('new-prod-image-data')?.value || 'assets/product_baguette.png';

    if (!nom || !prix || !categorie) {
        showAdminToast("Veuillez remplir tous les champs obligatoires (Nom, Catégorie, Prix).", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_ROOT}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, categorie, prix, stock, seuil_alerte, description, image })
        });
        const data = await parseSafeResponse(res);
        if (res.ok) {
            showAdminToast(`🎉 Produit "${nom}" ajouté avec succès au catalogue !`, 'success');
            closeAddProductModal();
            await loadProducts();
        } else {
            showAdminToast("Erreur : " + (data.error || "Impossible d'ajouter le produit."), 'danger');
        }
    } catch (err) {
        showAdminToast("Erreur de communication : " + err.message, 'danger');
    }
}

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
    
    const imgSrc = product.image || product.image_url || 'assets/product_baguette.png';
    document.getElementById('edit-prod-preview-img').src = imgSrc;
    document.getElementById('edit-prod-image-data').value = imgSrc;
    document.getElementById('edit-prod-file').value = '';

    modal.classList.remove('hidden');
}

function closeEditProductModal() {
    document.getElementById('editProductModal')?.classList.add('hidden');
}

async function handleUpdateProduct(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('edit-prod-id')?.value;
    const nom = document.getElementById('edit-prod-name')?.value.trim();
    const categorie = document.getElementById('edit-prod-category')?.value;
    const prix = Number(document.getElementById('edit-prod-price')?.value);
    const stock = Number(document.getElementById('edit-prod-stock')?.value) || 0;
    const seuil_alerte = Number(document.getElementById('edit-prod-alert')?.value) || 10;
    const is_active = Number(document.getElementById('edit-prod-status')?.value);
    const description = document.getElementById('edit-prod-desc')?.value.trim() || '';
    const image = document.getElementById('edit-prod-image-data')?.value;

    if (!id || !nom || !prix || !categorie) {
        showAdminToast("Veuillez remplir les informations requises (Nom, Catégorie, Prix).", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_ROOT}/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, categorie, prix, stock, seuil_alerte, is_active, description, image })
        });
        const data = await parseSafeResponse(res);
        if (res.ok) {
            showAdminToast(`✨ Produit "${nom}" mis à jour avec succès !`, 'success');
            closeEditProductModal();
            await loadProducts();
        } else {
            showAdminToast("Erreur : " + (data.error || "Impossible de modifier le produit."), 'danger');
        }
    } catch (err) {
        showAdminToast("Erreur de communication : " + err.message, 'danger');
    }
}

// 👁️ / ⏸️ BASCULER LE STATUT ACTIF / DÉSACTIVÉ D'UN PRODUIT
async function handleToggleProductStatus(id) {
    try {
        const res = await fetch(`${API_ROOT}/api/products/${id}/toggle-status`, {
            method: 'PATCH'
        });
        const data = await parseSafeResponse(res);
        if (res.ok) {
            showAdminToast(data.message || "Statut du produit modifié.", 'info');
            await loadProducts();
        } else {
            showAdminToast("Erreur : " + (data.error || "Impossible de modifier le statut."), "danger");
        }
    } catch (err) {
        showAdminToast("Erreur de communication : " + err.message, "danger");
    }
}

// 🗑️ SUPPRIMER UN PRODUIT
async function handleDeleteProduct(id) {
    const product = allProducts.find(p => p.id === id || String(p.id) === String(id));
    const prodName = product ? (product.nom || product.title) : 'ce produit';

    showBabiCustomConfirm({
        title: "Suppression de produit",
        message: `Êtes-vous certain de vouloir supprimer définitivement "${prodName}" du catalogue et des stocks ?`,
        icon: "fa-trash-can",
        confirmColor: "gradient-red",
        confirmText: "Supprimer du catalogue",
        cancelText: "Annuler",
        onConfirm: async () => {
            try {
                const res = await fetch(`${API_ROOT}/api/products/${id}`, { method: 'DELETE' });
                const data = await parseSafeResponse(res);
                if (res.ok) {
                    showAdminToast(`🗑️ "${prodName}" a été retiré du catalogue.`, 'info');
                    await loadProducts();
                } else {
                    showAdminToast("Erreur : " + (data.error || "Suppression impossible."), "danger");
                }
            } catch (err) {
                showAdminToast("Erreur : " + err.message, "danger");
            }
        }
    });
}

// Users
async function loadUsers() {
    try {
        const res = await fetch(`${API_ROOT}/api/users`);
        if (!res.ok) return;
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
        const res = await fetch(`${API_ROOT}/api/admin/payments/transactions`);
        if (!res.ok) return;
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

        resEvolutionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['18 Août', '19 Août', '20 Août', '21 Août', '22 Août', '23 Août'],
                datasets: [
                    {
                        label: 'Commandes',
                        data: [15, 24, 38, 42, 55, 68],
                        borderColor: '#ea580c',
                        backgroundColor: orangeGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Servies',
                        data: [12, 20, 32, 38, 48, 60],
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
                    y: { grid: { color: '#f1f5f9' } }
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
                    data: [10, 15, 25, 50],
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
    if (!statusDonutChartInstance) return;
    const newCount = allOrders.filter(o => o.status === 'nouveau' || o.status === 'en_attente_paiement').length;
    const prepCount = allOrders.filter(o => o.status === 'en_preparation' || o.status === 'en preparation' || o.status === 'payee_en_preparation').length;
    const pretCount = allOrders.filter(o => o.status === 'pret' || o.status === 'prete').length;
    const livreCount = allOrders.filter(o => o.status === 'livre' || o.status === 'livré' || o.status === 'recupere').length;

    statusDonutChartInstance.data.datasets[0].data = [newCount, prepCount, pretCount, livreCount];
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
    icon = "shield_lock",
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
        const res = await fetch(`${API_ROOT}/api/admin/cashiers`);
        if (!res.ok) return;
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
    } catch (e) {
        console.error("Erreur chargement caissières:", e);
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
                evtSource.close();
                startAdminBrainPolling();
            };
            return;
        } catch (_) {}
    }
    startAdminBrainPolling();
}

function startAdminBrainPolling() {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_ROOT}/api/ai/live-feed?channel=admin&since=${lastAdminAiEventTimestamp}`);
            if (res.ok) {
                const data = await res.json();
                if (data.events && data.events.length > 0) {
                    data.events.forEach(evt => {
                        handleAdminIncomingAiEvent(evt);
                        const evtTime = new Date(evt.timestamp).getTime();
                        if (evtTime > lastAdminAiEventTimestamp) lastAdminAiEventTimestamp = evtTime;
                    });
                }
            }
        } catch (_) {}
    }, 25000);
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

// 📱 GESTION DE LA NAVIGATION MOBILE & SMARTPHONE DU DASHBOARD ADMIN
window.toggleMobileSidebar = function() {
    const sidebar = document.getElementById('saasSidebar') || document.querySelector('.saas-sidebar');
    const backdrop = document.getElementById('saasSidebarBackdrop') || document.querySelector('.saas-sidebar-backdrop');
    if (sidebar) {
        const isOpen = sidebar.classList.toggle('mobile-open');
        if (backdrop) {
            backdrop.classList.toggle('active', isOpen);
        }
    }
};

// Auto-fermeture de la sidebar mobile lors du clic sur un lien de navigation
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.saas-nav-item, .saas-subnav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('saasSidebar');
                const backdrop = document.getElementById('saasSidebarBackdrop');
                if (sidebar) sidebar.classList.remove('mobile-open');
                if (backdrop) backdrop.classList.remove('active');
            }
        });
    });
});



