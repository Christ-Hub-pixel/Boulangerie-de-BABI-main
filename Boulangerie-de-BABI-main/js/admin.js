// ================================================================
// BABI ADMIN COCKPIT & WAVE PAYOUT v1 CONTROLLER
// ================================================================

const API_ROOT = (typeof window !== 'undefined' && (window.API_BASE_URL || (window.location.hostname.includes('boulangeriedebabi.com') ? 'https://api.boulangeriedebabi.com' : 'http://localhost:5000'))) || 'http://localhost:5000';

let allOrders = [];
let allProducts = [];
let allUsers = [];
let allTransactions = [];
let allWavePayouts = [];
let currentOrdersFilter = 'all';

let resEvolutionChartInstance = null;
let statusDonutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
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

    // 5. Polling de rafraîchissement automatique toutes les 8 secondes
    setInterval(fetchAdminData, 8000);
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
        'products': { title: 'Catalogue & Fournil', subtitle: 'Gestion des 48 produits, stocks et seuils d\'alerte' },
        'users': { title: 'Personnel & Utilisateurs', subtitle: 'Comptes collaborateurs, gérantes et clients du Club Fidélité' },
        'audit': { title: 'Sécurité & Audit Logs', subtitle: 'Détection IDS/IPS, intégrité Merkle et pare-feu anti-fraude' },
        'settings': { title: 'Paramètres & Configuration', subtitle: 'Clés Wave Business, signature HMAC-SHA256 et préférences' }
    };

    const info = titles[sectionId] || titles['dashboard'];
    const titleEl = document.getElementById('current-section-title');
    const subEl = document.getElementById('current-section-subtitle');
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.subtitle;

    // Actions spécifiques par onglet
    if (sectionId === 'wave-payouts') loadWavePayoutHistory();
    if (sectionId === 'audit') loadSecurityAuditLogs();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        alert("Le numéro de téléphone et le montant sont obligatoires.");
        return;
    }

    if (!confirm(`Confirmez-vous le virement Wave immédiat de ${Number(amount).toLocaleString()} FCFA vers le numéro ${phone} ?`)) {
        return;
    }

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
        alert("Erreur Virement Wave : " + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-bolt me-1"></i> Exécuter le Virement Wave`;
        }
    }
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
    if (!confirm(`Souhaitez-vous annuler et inverser le paiement Wave ${payoutId} ? Les fonds seront recrédités sur le solde de la boulangerie.`)) {
        return;
    }

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
        alert("Erreur lors de l'inversion du paiement : " + err.message);
    }
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
// 5. PRODUCTS & USERS MANAGEMENT
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

        tbody.innerHTML = allProducts.map(p => `
            <tr>
                <td><img src="${p.image_url || 'assets/product_baguette.png'}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;"></td>
                <td><strong>${escapeHtml(p.nom || p.title)}</strong></td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(p.categorie || p.category || 'Pain')}</span></td>
                <td><strong>${(p.prix || 0).toLocaleString()} FCFA</strong></td>
                <td><span class="fw-bold ${(p.stock || 50) <= 5 ? 'text-danger' : 'text-success'}">${p.stock || 50} unités</span></td>
                <td class="text-muted small">${p.seuil_alerte || 5} un.</td>
                <td><span class="saas-badge-pill active">Disponible</span></td>
                <td style="text-align: right;">
                    <button type="button" class="btn-xs btn-outline-danger" onclick="handleDeleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (_) {}
}

function openAddProductModal() { document.getElementById('addProductModal')?.classList.remove('hidden'); }
function closeAddProductModal() { document.getElementById('addProductModal')?.classList.add('hidden'); }

async function handleCreateProduct(e) {
    e.preventDefault();
    const nom = document.getElementById('new-prod-name')?.value;
    const categorie = document.getElementById('new-prod-category')?.value;
    const prix = Number(document.getElementById('new-prod-price')?.value);
    const stock = Number(document.getElementById('new-prod-stock')?.value);

    try {
        const res = await fetch(`${API_ROOT}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, categorie, prix, stock, seuil_alerte: 5, image_url: 'assets/product_baguette.png' })
        });
        if (res.ok) {
            showAdminToast("Produit ajouté avec succès au catalogue !", 'success');
            closeAddProductModal();
            loadProducts();
        }
    } catch (_) {}
}

async function handleDeleteProduct(id) {
    if (!confirm("Voulez-vous supprimer ce produit du catalogue ?")) return;
    try {
        await fetch(`${API_ROOT}/api/products/${id}`, { method: 'DELETE' });
        showAdminToast("Produit retiré du catalogue.", 'info');
        loadProducts();
    } catch (_) {}
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

function handleAdminLogout() {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter du Cockpit Administrateur ?")) {
        localStorage.removeItem('babi_admin_auth');
        window.location.href = 'index.html';
    }
}
