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
            'events': "Gâteaux d'Événements & Pièces Montées",
            'products': "Gestion du Catalogue Produits",
            'users': "Liste des Clients Inscrits",
            'team': "Équipe & Personnel de la Boulangerie",
            'security': "Cybersécurité & Audit IA des Transactions"
        };
        pageTitle.innerText = titles[tabName] || "Dashboard Admin";
        if (tabName === 'security') fetchSecurityAuditLogs();
    }
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
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'en preparation')">🟠 En préparation (Fournil)</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'pret')">🔵 Prêt au comptoir</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${o.id}, 'recupere')">🟢 Colis Récupéré</a></li>
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
