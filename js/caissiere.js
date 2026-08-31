/**
 * ==============================================================================
 * 🥖 BOULANGERIE DE BABI — SCRIPT DU TERMINAL CAISSIÈRE & RETRAIT EXPRESS POS
 * ==============================================================================
 * Conçu pour un usage ultra-rapide, tactile, fluide et infaillible au comptoir.
 */

const API_BASE = (window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000'));

// -------------------------------------------------------------
// 1. ÉTAT GLOBAL DU TERMINAL CAISSIÈRE
// -------------------------------------------------------------
const PosState = {
    currentCashier: null,
    register: {
        isOpen: false,
        id: null,
        fondDeCaisse: 50000,
        totalVentes: 0,
        totalEspeces: 0,
        totalWave: 0,
        totalTickets: 0
    },
    products: [],
    categories: [],
    filteredProducts: [],
    selectedCategory: 'all',
    searchQuery: '',
    
    // Panier de Vente Directe
    cart: [],
    paymentMethod: 'especes',
    amountReceived: 0,
    
    // Retrait Express Click & Collect
    enteredPin: '',
    selectedPickupOrder: null,
    pickupQueue: []
};

// -------------------------------------------------------------
// 2. SYNTHÉTISEUR AUDIO WEB AUDIO API (RETOURS SONORES SANS FICHIER)
// -------------------------------------------------------------
const SoundFx = {
    ctx: null,
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    },
    playTone(freq, duration, type = 'sine', delay = 0) {
        try {
            this.init();
            if (!this.ctx) return;
            setTimeout(() => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            }, delay * 1000);
        } catch (_) {}
    },
    success() {
        this.playTone(587.33, 0.1, 'sine', 0); // D5
        this.playTone(880.00, 0.25, 'sine', 0.1); // A5
    },
    saleComplete() {
        this.playTone(523.25, 0.08, 'triangle', 0);
        this.playTone(659.25, 0.08, 'triangle', 0.08);
        this.playTone(783.99, 0.08, 'triangle', 0.16);
        this.playTone(1046.50, 0.3, 'sine', 0.24); // Joyeux Carillon C-E-G-C
    },
    beep() {
        this.playTone(750, 0.05, 'square');
    },
    error() {
        this.playTone(220, 0.15, 'sawtooth', 0);
        this.playTone(180, 0.25, 'sawtooth', 0.12);
    },
    newOrderAlert() {
        this.playTone(659.25, 0.15, 'sine', 0);
        this.playTone(880.00, 0.2, 'sine', 0.15);
        this.playTone(1318.51, 0.35, 'sine', 0.35);
    }
};

// -------------------------------------------------------------
// 3. INITIALISATION AU CHARGEMENT DE LA PAGE
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    checkCashierSession();
    await loadInitialData();
    setupEventListeners();
    
    // Rafraîchissement automatique de la file de retrait toutes les 10 secondes
    setInterval(loadPickupQueue, 10000);
});

// Horloge Abidjan en temps réel
function initClock() {
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Abidjan', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const clockEl = document.getElementById('liveClock');
        if (clockEl) clockEl.innerText = `${timeStr} (GMT)`;
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// Vérification de session Caissière
function checkCashierSession() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('babi_user') || '{}');
    } catch (_) {}

    if (user && (user.role === 'caissiere' || user.role === 'admin' || user.role === 'gerante')) {
        PosState.currentCashier = user;
    } else {
        // Profil de caisse par défaut si accès direct
        PosState.currentCashier = {
            id: 2,
            prenom: 'Awa',
            nom: 'Traoré',
            role: 'caissiere',
            caisse_assignee: 'Caisse 1 - Riviera',
            avatar: 'assets/caissiere.png'
        };
        localStorage.setItem('babi_user', JSON.stringify(PosState.currentCashier));
    }

    renderCashierProfile();
}

function renderCashierProfile() {
    const nameEl = document.getElementById('cashierNameDisplay');
    const caisseEl = document.getElementById('cashierRegisterDisplay');
    const avatarEl = document.getElementById('cashierAvatarDisplay');

    if (nameEl) nameEl.innerText = `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`;
    if (caisseEl) caisseEl.innerText = PosState.currentCashier.caisse_assignee || 'Caisse 1 - Riviera';
    if (avatarEl && PosState.currentCashier.avatar) avatarEl.src = PosState.currentCashier.avatar;
}

// Chargement initial des données (Produits, Statut Caisse, File Retrait)
async function loadInitialData() {
    try {
        await Promise.all([
            fetchProducts(),
            fetchRegisterStatus(),
            loadPickupQueue()
        ]);
    } catch (err) {
        console.error("Erreur chargement initial :", err);
    }
}

// -------------------------------------------------------------
// 4. GESTION DES PRODUITS & CATALOGUE TACTILE
// -------------------------------------------------------------
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error("Erreur réseau");
        const data = await res.json();
        PosState.products = Array.isArray(data) ? data : [];
        PosState.filteredProducts = [...PosState.products];
        renderProducts();
    } catch (err) {
        console.warn("Échec récupération produits, chargement fallback :", err);
        // Fallback si serveur en cours d'init
        PosState.products = [
            { id: 1, nom: 'Baguette Tradition', prix: 400, categorie: 'pain', image: 'assets/product_baguette.png', stock: 45 },
            { id: 2, nom: 'Croissant Pur Beurre', prix: 600, categorie: 'viennoiserie', image: 'assets/product_croissant.png', stock: 30 },
            { id: 3, nom: 'Pain au Chocolat', prix: 650, categorie: 'viennoiserie', image: 'assets/product_pain_choc.png', stock: 25 },
            { id: 4, nom: 'Pain Complet Gourmand', prix: 800, categorie: 'pain', image: 'assets/product_complet.png', stock: 15 },
            { id: 5, nom: 'Jus de Bissap Maison', prix: 1000, categorie: 'boisson', image: 'assets/product_jus_bissap.png', stock: 20 },
            { id: 6, nom: 'Brioche Dorée', prix: 1200, categorie: 'viennoiserie', image: 'assets/product_brioche.png', stock: 12 }
        ];
        PosState.filteredProducts = [...PosState.products];
        renderProducts();
    }
}

function renderProducts() {
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;

    if (PosState.filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-cookie-bite fs-1 text-muted mb-3 d-block"></i>
                <h5 class="fw-bold text-muted">Aucun article trouvé</h5>
                <p class="small text-muted">Essayez un autre mot-clé ou filtre de catégorie.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = PosState.filteredProducts.map(p => {
        const img = p.image || 'assets/product_baguette.png';
        const stock = p.stock !== undefined ? p.stock : 50;
        const isLow = stock <= 10;

        return `
            <div class="pos-product-card" onclick="PosManager.addToCart(${p.id})">
                <div class="pos-product-img-wrapper">
                    <img src="${img}" alt="${escapeHtml(p.nom)}" class="pos-product-img" onerror="this.src='assets/product_baguette.png'">
                    <span class="pos-stock-badge ${isLow ? 'pos-stock-low' : ''}">
                        ${stock > 0 ? stock + ' dispo' : 'Rupture'}
                    </span>
                </div>
                <div class="pos-product-body">
                    <h4 class="pos-product-title" title="${escapeHtml(p.nom)}">${escapeHtml(p.nom)}</h4>
                    <div class="pos-product-price">
                        ${formatMoney(p.prix)} <small>FCFA</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterCategory(cat, btn) {
    SoundFx.beep();
    PosState.selectedCategory = cat;
    
    document.querySelectorAll('.pos-cat-pill').forEach(el => el.classList.remove('active'));
    if (btn) btn.classList.add('active');

    applyFilters();
}

function handleSearch(query) {
    PosState.searchQuery = (query || '').toLowerCase().trim();
    applyFilters();
}

function applyFilters() {
    PosState.filteredProducts = PosState.products.filter(p => {
        const matchesCat = PosState.selectedCategory === 'all' || p.categorie === PosState.selectedCategory;
        const matchesSearch = !PosState.searchQuery || (p.nom && p.nom.toLowerCase().includes(PosState.searchQuery));
        return matchesCat && matchesSearch;
    });
    renderProducts();
}

// -------------------------------------------------------------
// 5. GESTION DU PANIER & VENTE DIRECTE COMPTOIR
// -------------------------------------------------------------
const PosManager = {
    addToCart(productId) {
        SoundFx.beep();
        const product = PosState.products.find(p => p.id === productId);
        if (!product) return;

        const existing = PosState.cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity += 1;
        } else {
            PosState.cart.push({
                id: product.id,
                nom: product.nom,
                prix: product.prix,
                quantity: 1,
                image: product.image
            });
        }

        renderCart();
    },

    updateQty(productId, delta) {
        SoundFx.beep();
        const item = PosState.cart.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            PosState.cart = PosState.cart.filter(i => i.id !== productId);
        }
        renderCart();
    },

    clearCart() {
        if (PosState.cart.length === 0) return;
        SoundFx.beep();
        PosState.cart = [];
        PosState.amountReceived = 0;
        renderCart();
    },

    setPaymentMethod(method) {
        SoundFx.beep();
        PosState.paymentMethod = method;
        document.querySelectorAll('.pos-pay-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`payBtn_${method}`);
        if (activeBtn) activeBtn.classList.add('active');

        const cashCalc = document.getElementById('cashCalculatorBox');
        if (cashCalc) {
            cashCalc.style.display = method === 'especes' ? 'block' : 'none';
        }
        calculateChange();
    },

    setQuickBill(amount) {
        SoundFx.beep();
        const total = getCartTotal();
        if (amount === 'exact') {
            PosState.amountReceived = total;
        } else {
            PosState.amountReceived = Number(amount);
        }

        const input = document.getElementById('cashReceivedInput');
        if (input) input.value = PosState.amountReceived;
        calculateChange();
    },

    handleReceivedInput(value) {
        PosState.amountReceived = Number(value) || 0;
        calculateChange();
    },

    async processSale() {
        const total = getCartTotal();
        if (PosState.cart.length === 0 || total <= 0) {
            showToast("Le panier est vide !", "warning");
            return;
        }

        if (PosState.paymentMethod === 'especes' && PosState.amountReceived < total && PosState.amountReceived > 0) {
            SoundFx.error();
            showToast(`Montant reçu insuffisant (${formatMoney(PosState.amountReceived)} FCFA vs Total ${formatMoney(total)} FCFA)`, "danger");
            return;
        }

        const change = PosState.paymentMethod === 'especes' && PosState.amountReceived >= total 
            ? (PosState.amountReceived - total) 
            : 0;

        const salePayload = {
            items: PosState.cart.map(i => ({
                id: i.id,
                nom: i.nom,
                name: i.nom,
                price: i.prix,
                prix: i.prix,
                quantity: i.quantity,
                qte: i.quantity,
                total: i.prix * i.quantity
            })),
            total_price: total,
            payment_method: PosState.paymentMethod === 'wave' ? 'Wave Mobile Money' : 'Espèces (Comptoir)',
            amount_received: PosState.amountReceived || total,
            montant_recu: PosState.amountReceived || total,
            change_given: change,
            monnaie_rendue: change,
            caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
            client_name: 'Client Boutique Riviera'
        };

        const btn = document.getElementById('btnProcessSale');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Enregistrement...`;
        }

        try {
            const res = await fetch(`${API_BASE}/api/pos/sale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salePayload)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Erreur enregistrement vente");
            }

            SoundFx.saleComplete();
            showToast("✅ Vente encaissée avec succès !", "success");

            // Mettre à jour l'état de caisse localement
            PosState.register.totalVentes += total;
            if (PosState.paymentMethod === 'wave') {
                PosState.register.totalWave += total;
            } else {
                PosState.register.totalEspeces += total;
            }
            PosState.register.totalTickets += 1;
            renderRegisterSummary();

            // Générer et afficher le ticket thermique
            openThermalReceipt({
                ticketNo: data.orderId || data.receipt_number || ('#REC-' + Math.floor(1000 + Math.random() * 9000)),
                date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
                mode: salePayload.payment_method,
                caissiere: salePayload.caissiere_nom,
                items: salePayload.items,
                total: total,
                recu: salePayload.amount_received,
                monnaie: change,
                codePin: null,
                isPickup: false
            });

            // Réinitialiser le panier
            PosState.cart = [];
            PosState.amountReceived = 0;
            renderCart();
            fetchProducts(); // Actualiser stocks
        } catch (err) {
            SoundFx.error();
            showToast("Erreur encaissement : " + err.message, "danger");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-check-double me-2"></i> Encaisser la Vente`;
            }
        }
    }
};

function getCartTotal() {
    return PosState.cart.reduce((sum, i) => sum + (i.prix * i.quantity), 0);
}

function renderCart() {
    const list = document.getElementById('posCartItemsList');
    const countBadge = document.getElementById('posCartCount');
    const totalEl = document.getElementById('posCartTotalDisplay');
    const checkoutBtn = document.getElementById('btnProcessSale');

    const total = getCartTotal();
    const totalCount = PosState.cart.reduce((sum, i) => sum + i.quantity, 0);

    if (countBadge) countBadge.innerText = `${totalCount} article${totalCount > 1 ? 's' : ''}`;
    if (totalEl) totalEl.innerText = `${formatMoney(total)} FCFA`;
    if (checkoutBtn) checkoutBtn.disabled = PosState.cart.length === 0;

    if (!list) return;

    if (PosState.cart.length === 0) {
        list.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-basket-shopping fs-1 mb-2 d-block opacity-25"></i>
                <div class="fw-bold">Le ticket est vide</div>
                <small>Touchez un produit à gauche pour l'ajouter</small>
            </div>
        `;
        calculateChange();
        return;
    }

    list.innerHTML = PosState.cart.map(item => `
        <div class="pos-cart-item">
            <div class="pos-item-info">
                <div class="pos-item-name">${escapeHtml(item.nom)}</div>
                <div class="pos-item-unit-price">${formatMoney(item.prix)} FCFA / u</div>
            </div>
            <div class="pos-item-controls">
                <button class="pos-qty-btn" onclick="PosManager.updateQty(${item.id}, -1)">-</button>
                <span class="pos-qty-display">${item.quantity}</span>
                <button class="pos-qty-btn" onclick="PosManager.updateQty(${item.id}, 1)">+</button>
            </div>
            <div class="pos-item-total">
                ${formatMoney(item.prix * item.quantity)} <small style="font-size:0.65rem">F</small>
            </div>
        </div>
    `).join('');

    calculateChange();
}

function calculateChange() {
    const total = getCartTotal();
    const changeBox = document.getElementById('changeDisplayBox');
    const changeAmountEl = document.getElementById('changeAmountDisplay');
    if (!changeBox || !changeAmountEl) return;

    if (PosState.paymentMethod === 'especes' && PosState.amountReceived > 0) {
        const change = PosState.amountReceived - total;
        changeBox.style.display = 'flex';
        if (change >= 0) {
            changeAmountEl.innerHTML = `<span class="text-success fw-bold">${formatMoney(change)} FCFA</span>`;
        } else {
            changeAmountEl.innerHTML = `<span class="text-danger fw-bold">Manque ${formatMoney(Math.abs(change))} FCFA</span>`;
        }
    } else {
        changeBox.style.display = 'none';
    }
}

// -------------------------------------------------------------
// 6. RETRAIT EXPRESS CLICK & COLLECT (VALIDATION DU CODE PIN)
// -------------------------------------------------------------
const PickupManager = {
    addPinDigit(digit) {
        if (PosState.enteredPin.length >= 6) return;
        SoundFx.beep();
        PosState.enteredPin += String(digit);
        updatePinDisplay();
    },

    deletePinDigit() {
        SoundFx.beep();
        PosState.enteredPin = PosState.enteredPin.slice(0, -1);
        updatePinDisplay();
    },

    clearPin() {
        SoundFx.beep();
        PosState.enteredPin = '';
        updatePinDisplay();
    },

    async verifyPin() {
        const pin = PosState.enteredPin.trim();
        if (!pin || pin.length < 3) {
            SoundFx.error();
            showToast("Veuillez saisir un code PIN valide (4 chiffres).", "warning");
            return;
        }

        const btn = document.getElementById('btnSubmitPin');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Validation en cours...`;
        }

        try {
            // Requête vers le validateur de PIN
            const res = await fetch(`${API_BASE}/api/pos/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pin,
                    order_id: PosState.selectedPickupOrder ? PosState.selectedPickupOrder.id : undefined,
                    caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || data.message || "Code PIN incorrect ou déjà utilisé.");
            }

            SoundFx.success();
            showToast(`✅ Code PIN #${pin} validé ! Commande #${data.orderId || ''} remise avec succès.`, "success");

            // Afficher le ticket thermique de remise Click & Collect
            let parsedItems = [];
            try {
                parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
            } catch (_) {}

            openThermalReceipt({
                ticketNo: `#RETRAIT-${data.orderId || pin}`,
                date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
                mode: "CLICK & COLLECT (Paiement Wave Vérifié)",
                caissiere: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
                items: parsedItems.length > 0 ? parsedItems : [{ nom: 'Sachet Click & Collect Fournil', prix: data.total_price || 0, quantity: 1 }],
                total: data.total_price || 0,
                recu: data.total_price || 0,
                monnaie: 0,
                codePin: pin,
                isPickup: true
            });

            // Réinitialisation du champ PIN et rechargement de la file
            PosState.enteredPin = '';
            PosState.selectedPickupOrder = null;
            updatePinDisplay();
            loadPickupQueue();
        } catch (err) {
            SoundFx.error();
            showToast(err.message, "danger");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-key me-2"></i> Valider la Remise du Sachet`;
            }
        }
    },

    selectOrderFromQueue(order) {
        SoundFx.beep();
        PosState.selectedPickupOrder = order;
        if (order.code_pin) {
            PosState.enteredPin = String(order.code_pin);
            updatePinDisplay();
        }

        document.querySelectorAll('.pos-queue-item').forEach(el => el.classList.remove('active'));
        const el = document.getElementById(`queueOrder_${order.id}`);
        if (el) el.classList.add('active');

        // Prévisualisation des articles de la commande
        renderSelectedOrderPreview(order);
    }
};

function updatePinDisplay() {
    const display = document.getElementById('pickupPinDisplay');
    if (display) {
        display.innerText = PosState.enteredPin ? `#${PosState.enteredPin}` : '••••';
    }
}

async function loadPickupQueue() {
    try {
        const res = await fetch(`${API_BASE}/api/orders/pickup-queue`);
        if (!res.ok) throw new Error("Erreur file");
        const data = await res.json();
        
        const previousCount = PosState.pickupQueue.length;
        PosState.pickupQueue = Array.isArray(data) ? data : (data.queue || []);
        
        // Si nouvelle commande arrivée, jouer une alerte sonore
        if (PosState.pickupQueue.length > previousCount && previousCount > 0) {
            SoundFx.newOrderAlert();
            showToast("🔔 Nouvelle commande Click & Collect prête au comptoir !", "info");
        }

        renderPickupQueue();
    } catch (_) {
        // Mode démo / fallback
        if (PosState.pickupQueue.length === 0) {
            PosState.pickupQueue = [
                { id: 28, customer_name: 'Kouassi Jean-Marc', phone: '07 04 38 92 01', total_price: 1900, code_pin: '5029', status: 'pret_comptoir', items: '[{"nom":"Baguette Tradition","prix":400,"quantity":2},{"nom":"Croissant Pur Beurre","prix":600,"quantity":1}]' },
                { id: 27, customer_name: 'Adjoua Salimata', phone: '05 55 12 34 56', total_price: 3600, code_pin: '4443', status: 'pret_comptoir', items: '[{"nom":"Pain Complet","prix":800,"quantity":2},{"nom":"Jus de Bissap","prix":1000,"quantity":2}]' }
            ];
            renderPickupQueue();
        }
    }
}

function renderPickupQueue() {
    const list = document.getElementById('posPickupQueueList');
    const badge = document.getElementById('pickupQueueCountBadge');
    if (badge) badge.innerText = PosState.pickupQueue.length;

    if (!list) return;

    if (PosState.pickupQueue.length === 0) {
        list.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-circle-check fs-1 text-success mb-3 opacity-50 d-block"></i>
                <div class="fw-bold">Aucune commande en attente</div>
                <small>Les nouvelles commandes Click & Collect s'afficheront ici en direct.</small>
            </div>
        `;
        return;
    }

    list.innerHTML = PosState.pickupQueue.map(order => {
        let itemsCount = 0;
        try {
            const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            itemsCount = parsed.length;
        } catch (_) {}

        return `
            <div id="queueOrder_${order.id}" class="pos-queue-item" onclick='PickupManager.selectOrderFromQueue(${JSON.stringify(order)})'>
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark fs-6">${escapeHtml(order.customer_name || 'Client Babi')}</span>
                    <span class="badge bg-warning text-dark fw-bold px-2 py-1">PIN #${order.code_pin || '????'}</span>
                </div>
                <div class="d-flex justify-content-between small text-muted">
                    <span><i class="fa-solid fa-phone me-1"></i> ${escapeHtml(order.phone || 'Non renseigné')}</span>
                    <span class="fw-bold text-success"><i class="fa-solid fa-shield-check me-1"></i> ${formatMoney(order.total_price || 0)} F (Payé Wave)</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderSelectedOrderPreview(order) {
    const box = document.getElementById('selectedOrderPreviewBox');
    if (!box) return;

    let items = [];
    try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch (_) {}

    box.innerHTML = `
        <div class="alert alert-warning border-2 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold text-dark m-0"><i class="fa-solid fa-box-open me-2 text-warning"></i> Commande #${order.id} — ${escapeHtml(order.customer_name)}</h6>
                <span class="badge bg-success">Wave Payé</span>
            </div>
            <div class="small text-muted mb-2">
                <strong>Articles à remettre :</strong>
                <ul class="mb-1 ps-3 mt-1">
                    ${items.map(it => `<li>${it.quantity || it.qte || 1}x ${escapeHtml(it.nom || it.name || 'Article')} (${formatMoney(it.prix || it.price || 0)} F)</li>`).join('')}
                </ul>
            </div>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top border-warning">
                <span class="fw-bold text-dark">Total Commande :</span>
                <span class="fw-black text-dark fs-5">${formatMoney(order.total_price || 0)} FCFA</span>
            </div>
        </div>
    `;
}

// -------------------------------------------------------------
// 7. GESTION DE CAISSE, TICKET X & CLÔTURE Z
// -------------------------------------------------------------
async function fetchRegisterStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/pos/register/status`);
        if (!res.ok) throw new Error("Erreur état caisse");
        const data = await res.json();
        
        PosState.register = {
            isOpen: data.is_open,
            id: data.register_id,
            caissiere: data.caissiere_nom || 'Caisse 1 - Riviera',
            fondDeCaisse: data.fond_de_caisse || 50000,
            totalVentes: data.total_ventes || 0,
            totalEspeces: data.total_especes || 0,
            totalWave: data.total_wave || 0,
            totalTickets: data.total_tickets || 0,
            especesTheoriques: data.especes_theoriques || (data.fond_de_caisse + data.total_especes)
        };

        renderRegisterSummary();
    } catch (_) {
        // Fallback local
        PosState.register.isOpen = true;
        renderRegisterSummary();
    }
}

function renderRegisterSummary() {
    const badge = document.getElementById('caisseStatusBadge');
    const openBtn = document.getElementById('btnOpenRegister');
    const closeBtn = document.getElementById('btnCloseRegisterZ');

    if (badge) {
        if (PosState.register.isOpen) {
            badge.className = 'pos-badge-status pos-badge-open';
            badge.innerHTML = `<span class="pos-status-pulse"></span> Caisse Ouverte`;
        } else {
            badge.className = 'pos-badge-status pos-badge-closed';
            badge.innerHTML = `<span class="pos-status-pulse"></span> Caisse Fermée`;
        }
    }

    // Mise à jour des cartes de synthèse
    const fondEl = document.getElementById('statFondDeCaisse');
    const totalEl = document.getElementById('statTotalVentes');
    const cashEl = document.getElementById('statTotalEspeces');
    const waveEl = document.getElementById('statTotalWave');
    const ticketsEl = document.getElementById('statTotalTickets');
    const theoriqueEl = document.getElementById('statEspecesTheoriques');

    if (fondEl) fondEl.innerText = `${formatMoney(PosState.register.fondDeCaisse)} F`;
    if (totalEl) totalEl.innerText = `${formatMoney(PosState.register.totalVentes)} F`;
    if (cashEl) cashEl.innerText = `${formatMoney(PosState.register.totalEspeces)} F`;
    if (waveEl) waveEl.innerText = `${formatMoney(PosState.register.totalWave)} F`;
    if (ticketsEl) ticketsEl.innerText = PosState.register.totalTickets;
    if (theoriqueEl) theoriqueEl.innerText = `${formatMoney(PosState.register.fondDeCaisse + PosState.register.totalEspeces)} F`;
}

// Ouvrir la caisse
async function submitOpenRegister() {
    const fondInput = document.getElementById('openFondDeCaisseInput');
    const fond = Number(fondInput ? fondInput.value : 50000) || 50000;

    try {
        const res = await fetch(`${API_BASE}/api/pos/register/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
                fond_de_caisse: fond
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur ouverture caisse");

        SoundFx.success();
        showToast("Caisse ouverte avec succès !", "success");
        bootstrap.Modal.getInstance(document.getElementById('modalOpenRegister'))?.hide();
        await fetchRegisterStatus();
    } catch (err) {
        SoundFx.error();
        showToast(err.message, "danger");
    }
}

// Générer le Ticket X (Lecture intermédiaire sans clôturer)
async function generateTicketX() {
    SoundFx.beep();
    try {
        const res = await fetch(`${API_BASE}/api/pos/register/ticket-x`);
        const data = await res.json();
        const ticket = data.ticket || {
            type: "TICKET_X",
            title: "LECTURE INTERMÉDIAIRE (TICKET X)",
            date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
            caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
            fond_de_caisse: PosState.register.fondDeCaisse,
            total_ventes: PosState.register.totalVentes,
            total_especes: PosState.register.totalEspeces,
            total_wave: PosState.register.totalWave,
            total_tickets: PosState.register.totalTickets,
            especes_theoriques: PosState.register.fondDeCaisse + PosState.register.totalEspeces
        };

        openThermalZReport(ticket, "TICKET X — LECTURE MI-JOURNÉE");
    } catch (err) {
        showToast("Erreur génération Ticket X : " + err.message, "danger");
    }
}

// Clôture Définitive Z
async function submitCloseRegisterZ() {
    const countedCashInput = document.getElementById('countEspecesReellesInput');
    const notesInput = document.getElementById('clotureNotesInput');
    const counted = Number(countedCashInput ? countedCashInput.value : 0);
    const notes = notesInput ? notesInput.value : '';

    try {
        const res = await fetch(`${API_BASE}/api/pos/register/close-z`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
                fond_de_caisse: PosState.register.fondDeCaisse,
                especes_reelles: counted,
                notes: notes
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur clôture Z");

        SoundFx.saleComplete();
        showToast("✅ Clôture de caisse Z effectuée avec succès !", "success");
        bootstrap.Modal.getInstance(document.getElementById('modalCloseZ'))?.hide();

        // Affichage du ticket Z officiel
        openThermalZReport(data.ticket_z || {
            numero_z: "Z-" + Date.now(),
            date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
            caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
            fond_de_caisse: PosState.register.fondDeCaisse,
            total_ventes: PosState.register.totalVentes,
            total_especes: PosState.register.totalEspeces,
            total_wave: PosState.register.totalWave,
            total_tickets: PosState.register.totalTickets,
            especes_reelles: counted,
            ecart: counted - (PosState.register.fondDeCaisse + PosState.register.totalEspeces)
        }, "TICKET Z — CLÔTURE OFFICIELLE");

        await fetchRegisterStatus();
    } catch (err) {
        SoundFx.error();
        showToast(err.message, "danger");
    }
}

// -------------------------------------------------------------
// 8. TICKETS THERMIQUES 80MM (GÉNÉRATION & IMPRESSION)
// -------------------------------------------------------------
function openThermalReceipt(data) {
    const modalEl = document.getElementById('modalThermalReceipt');
    const container = document.getElementById('thermalReceiptContainer');
    if (!modalEl || !container) return;

    container.innerHTML = `
        <div class="pos-receipt-80mm">
            <div class="pos-receipt-header">
                <div class="pos-receipt-title">🥖 BOULANGERIE DE BABI 🥖</div>
                <div>Riviera, Abidjan - Côte d'Ivoire</div>
                <div>TEL: 27 22 56 41 23 / 07 04 38 92 01</div>
                <div style="margin-top:6px; font-size:11px;">TICKET N°: <strong>${data.ticketNo}</strong></div>
                <div style="font-size:10px;">Date : ${data.date}</div>
                <div style="font-size:10px;">Opérateur : ${data.caissiere}</div>
                ${data.codePin ? `<div style="background:#000; color:#fff; padding:3px; margin-top:4px; font-weight:bold;">RETRAIT PIN : #${data.codePin} (VALIDÉ)</div>` : ''}
            </div>

            <table class="pos-receipt-table">
                <thead>
                    <tr style="border-bottom:1px solid #000; font-size:11px;">
                        <th align="left">Article</th>
                        <th align="center">Qté</th>
                        <th align="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${(data.items || []).map(it => `
                        <tr>
                            <td>${escapeHtml(it.nom || it.name || 'Article')}</td>
                            <td align="center">x${it.quantity || it.qte || 1}</td>
                            <td align="right">${formatMoney((it.prix || it.price || 0) * (it.quantity || it.qte || 1))} F</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="border-top:1px dashed #000; padding-top:6px; margin-top:6px;">
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px;">
                    <span>TOTAL :</span>
                    <span>${formatMoney(data.total)} FCFA</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:3px;">
                    <span>Mode Règlement :</span>
                    <span>${data.mode}</span>
                </div>
                ${!data.isPickup ? `
                    <div style="display:flex; justify-content:space-between; font-size:11px;">
                        <span>Montant Reçu :</span>
                        <span>${formatMoney(data.recu)} FCFA</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:11px;">
                        <span>Monnaie Rendue :</span>
                        <span>${formatMoney(data.monnaie)} FCFA</span>
                    </div>
                ` : ''}
            </div>

            <div class="pos-receipt-footer">
                <div>⭐⭐⭐⭐⭐</div>
                <div style="font-weight:bold; margin-top:4px;">MERCI DE VOTRE VISITE !</div>
                <div>À BIENTÔT AU FOURNIL RIVIERA</div>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

function openThermalZReport(ticket, title) {
    const modalEl = document.getElementById('modalThermalReceipt');
    const container = document.getElementById('thermalReceiptContainer');
    if (!modalEl || !container) return;

    const ecart = ticket.ecart || 0;
    const ecartClass = ecart === 0 ? 'text-success' : (ecart > 0 ? 'text-primary' : 'text-danger');

    container.innerHTML = `
        <div class="pos-receipt-80mm">
            <div class="pos-receipt-header">
                <div class="pos-receipt-title">🥖 BOULANGERIE DE BABI 🥖</div>
                <div>RAPPORT OFFICIEL DE CAISSE</div>
                <div style="font-size:12px; font-weight:bold; margin-top:4px; border:1px solid #000; padding:2px;">${title}</div>
                <div style="font-size:10px; margin-top:4px;">Date : ${ticket.date || new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}</div>
                <div style="font-size:10px;">Caissière : ${ticket.caissiere_nom || 'Caisse 1'}</div>
            </div>

            <div style="font-size:12px; line-height:1.6;">
                <div style="display:flex; justify-content:space-between;">
                    <span>Fond de Caisse :</span>
                    <strong>${formatMoney(ticket.fond_de_caisse || 50000)} F</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Total Tickets :</span>
                    <strong>${ticket.total_tickets || 0}</strong>
                </div>
                <div style="border-top:1px dashed #000; margin:4px 0;"></div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Ventes Espèces :</span>
                    <strong>${formatMoney(ticket.total_especes || 0)} F</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Ventes Wave :</span>
                    <strong>${formatMoney(ticket.total_wave || 0)} F</strong>
                </div>
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px; border-top:1px solid #000; padding-top:4px;">
                    <span>TOTAL RECETTES :</span>
                    <span>${formatMoney(ticket.total_ventes || 0)} F</span>
                </div>
                <div style="border-top:1px dashed #000; margin:4px 0;"></div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Espèces Attendues :</span>
                    <strong>${formatMoney((ticket.fond_de_caisse || 50000) + (ticket.total_especes || 0))} F</strong>
                </div>
                ${ticket.especes_reelles !== undefined ? `
                    <div style="display:flex; justify-content:space-between;">
                        <span>Espèces Réelles :</span>
                        <strong>${formatMoney(ticket.especes_reelles)} F</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-weight:bold;">
                        <span>Écart de Caisse :</span>
                        <span class="${ecartClass}">${ecart > 0 ? '+' : ''}${formatMoney(ecart)} FCFA</span>
                    </div>
                ` : ''}
            </div>

            <div class="pos-receipt-footer">
                <div>Document certifié - Fournil Riviera</div>
                <div style="font-size:9px; margin-top:4px;">Numéro Z : ${ticket.numero_z || 'Z-REG-SYS'}</div>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

function printCurrentThermal() {
    window.print();
}

// -------------------------------------------------------------
// 9. GESTION DES MODES & ÉVÉNEMENTS
// -------------------------------------------------------------
function switchPosMode(mode) {
    SoundFx.beep();
    document.querySelectorAll('.pos-mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pos-mode-view').forEach(v => v.style.display = 'none');

    const btn = document.getElementById(`modeBtn_${mode}`);
    const view = document.getElementById(`modeView_${mode}`);

    if (btn) btn.classList.add('active');
    if (view) view.style.display = 'block';

    const cartPanel = document.getElementById('posCartPanel');
    if (cartPanel) {
        // Masquer le panier en mode Retrait ou Caisse pour maximiser l'espace
        cartPanel.style.display = mode === 'vente' ? 'flex' : 'none';
    }
}

function setupEventListeners() {
    // Saisie clavier pour le PIN
    document.addEventListener('keydown', (e) => {
        const modeRetrait = document.getElementById('modeView_retrait');
        if (modeRetrait && modeRetrait.style.display !== 'none') {
            if (e.key >= '0' && e.key <= '9') {
                PickupManager.addPinDigit(e.key);
            } else if (e.key === 'Backspace') {
                PickupManager.deletePinDigit();
            } else if (e.key === 'Enter') {
                PickupManager.verifyPin();
            }
        }
    });
}

// -------------------------------------------------------------
// 10. UTILITAIRES DE FORMATION & NOTIFICATIONS
// -------------------------------------------------------------
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
