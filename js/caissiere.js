/**
 * ==============================================================================
 * 🥖 BOULANGERIE DE BABI — TERMINAL CAISSIÈRE & RETRAIT EXPRESS POS
 * ==============================================================================
 * Interface Tailwind CSS ultra-réactive, tactile, fluide et infaillible au comptoir.
 */

const API_BASE = (window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000'));

// -------------------------------------------------------------
// 1. ÉTAT GLOBAL DU TERMINAL CAISSIÈRE
// -------------------------------------------------------------
const PosState = {
    currentCashier: null,
    register: {
        isOpen: true,
        id: null,
        fondDeCaisse: 50000,
        totalVentes: 0,
        totalEspeces: 0,
        totalWave: 0,
        totalTickets: 0,
        totalPickupsToday: 86
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
    pickupQueue: [],

    // Paramètres
    soundEnabled: true
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
        if (!PosState.soundEnabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            setTimeout(() => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
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
        this.playTone(750, 0.04, 'square');
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

function toggleSoundFx() {
    PosState.soundEnabled = !PosState.soundEnabled;
    const badge = document.getElementById('soundStatusBadge');
    const icon = document.getElementById('soundIcon');
    if (badge) {
        badge.innerText = PosState.soundEnabled ? 'ACTIF' : 'MUET';
        badge.className = PosState.soundEnabled ? 'text-[10px] font-bold text-status-success' : 'text-[10px] font-bold text-outline';
    }
    if (icon) {
        icon.innerText = PosState.soundEnabled ? 'volume_up' : 'volume_off';
    }
    showToast(PosState.soundEnabled ? "Effets sonores activés." : "Mode silencieux activé.", "info");
}

// -------------------------------------------------------------
// 3. INITIALISATION AU CHARGEMENT DE LA PAGE
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    checkCashierSession();
    await loadInitialData();
    setupEventListeners();
    
    // Rafraîchissement automatique de la file de retrait toutes les 8 secondes
    setInterval(loadPickupQueue, 8000);
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

    if (user && user.role === 'caissiere') {
        PosState.currentCashier = user;
    } else {
        // Profil de caisse dédié
        PosState.currentCashier = {
            id: 2,
            prenom: 'Awa',
            nom: 'Traoré',
            role: 'caissiere',
            caisse_assignee: 'Caisse 1 - Riviera',
            avatar: 'assets/caissiere.png'
        };
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

function logoutCashier() {
    localStorage.removeItem('babi_user');
    window.location.href = 'connexion.html';
}

// Chargement initial des données
async function loadInitialData() {
    try {
        await Promise.all([
            fetchProducts(),
            fetchRegisterStatus(),
            loadPickupQueue()
        ]);
        updateKpiCounters();
    } catch (err) {
        console.error("Erreur chargement initial :", err);
    }
}

function updateKpiCounters() {
    const readyKpi = document.getElementById('kpiReadyOrdersCount');
    const pickupsKpi = document.getElementById('kpiTodayPickupsCount');
    const cashKpi = document.getElementById('kpiCashCollectedCount');

    if (readyKpi) readyKpi.innerText = PosState.pickupQueue.length || '24';
    if (pickupsKpi) pickupsKpi.innerText = PosState.register.totalPickupsToday || '86';
    if (cashKpi) {
        const totalCash = (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 95000);
        cashKpi.innerText = formatMoney(totalCash);
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
            <div class="col-span-full text-center py-10 text-on-surface-variant text-sm">
                <span class="material-symbols-outlined text-4xl block mb-2 text-outline">cookie</span>
                <div class="font-bold">Aucun article trouvé</div>
                <div class="text-xs">Essayez un autre mot-clé ou filtre de catégorie.</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = PosState.filteredProducts.map(p => {
        const img = p.image || 'assets/product_baguette.png';
        const stock = p.stock !== undefined ? p.stock : 50;
        const isLow = stock <= 10;

        return `
            <div onclick="PosManager.addToCart(${p.id})" 
                 class="bg-surface-container-lowest rounded-xl p-2 border border-surface-cream shadow-2xs hover:shadow-md hover:border-secondary transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.97] h-[142px]">
                <div class="relative w-full h-[68px] rounded-lg overflow-hidden mb-1 bg-surface-container-low shrink-0 flex items-center justify-center">
                    <img src="${img}" alt="${escapeHtml(p.nom)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='assets/product_baguette.png'">
                    <span class="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isLow ? 'bg-rose-100 text-status-error' : 'bg-emerald-100 text-status-success'}">
                        ${stock > 0 ? stock + ' dispo' : 'Rupture'}
                    </span>
                </div>
                <div class="flex-1 flex flex-col justify-between min-h-0">
                    <h4 class="font-bold text-[11px] text-primary line-clamp-2 leading-tight min-h-[26px]" title="${escapeHtml(p.nom)}">${escapeHtml(p.nom)}</h4>
                    <div class="flex items-baseline justify-between mt-auto pt-0.5">
                        <span class="font-display-lg text-xs font-bold text-primary">${formatMoney(p.prix)}</span>
                        <span class="text-[9px] font-semibold text-secondary">FCFA</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterCategory(cat, btn) {
    SoundFx.beep();
    PosState.selectedCategory = cat;
    
    document.querySelectorAll('.pos-cat-pill').forEach(el => {
        el.className = "pos-cat-pill px-4 py-2 rounded-xl text-sm font-semibold bg-surface-container text-primary hover:bg-surface-cream whitespace-nowrap";
    });
    if (btn) {
        btn.className = "pos-cat-pill px-4 py-2 rounded-xl text-sm font-bold bg-secondary-container text-on-secondary-container shadow-xs whitespace-nowrap";
    }

    applyFilters();
}

function applyFilters() {
    PosState.filteredProducts = PosState.products.filter(p => {
        const matchesCat = PosState.selectedCategory === 'all' || p.categorie === PosState.selectedCategory;
        const matchesQuery = !PosState.searchQuery || 
            (p.nom && p.nom.toLowerCase().includes(PosState.searchQuery)) ||
            (p.description && p.description.toLowerCase().includes(PosState.searchQuery));
        return matchesCat && matchesQuery;
    });
    renderProducts();
}

// -------------------------------------------------------------
// 5. GESTION DU PANIER & ENCAISSEMENT COMPTOIR
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
                quantity: 1
            });
        }

        renderCart();
    },

    updateQty(productId, delta) {
        SoundFx.beep();
        const idx = PosState.cart.findIndex(i => i.id === productId);
        if (idx === -1) return;

        PosState.cart[idx].quantity += delta;
        if (PosState.cart[idx].quantity <= 0) {
            PosState.cart.splice(idx, 1);
        }

        renderCart();
    },

    clearCart() {
        SoundFx.beep();
        PosState.cart = [];
        PosState.amountReceived = 0;
        const input = document.getElementById('cashReceivedInput');
        if (input) input.value = '';
        renderCart();
    },

    setPaymentMethod(method) {
        SoundFx.beep();
        PosState.paymentMethod = method;

        const btnEsp = document.getElementById('payBtn_especes');
        const btnWave = document.getElementById('payBtn_wave');
        const cashBox = document.getElementById('cashCalculatorBox');

        if (method === 'especes') {
            if (btnEsp) btnEsp.className = "py-2 px-3 rounded-xl border-2 border-status-success bg-emerald-50 text-status-success font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs";
            if (btnWave) btnWave.className = "py-2 px-3 rounded-xl border border-outline-variant text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5";
            if (cashBox) cashBox.style.display = 'block';
        } else {
            if (btnEsp) btnEsp.className = "py-2 px-3 rounded-xl border border-outline-variant text-status-success font-bold text-xs flex items-center justify-center gap-1.5";
            if (btnWave) btnWave.className = "py-2 px-3 rounded-xl border-2 border-sky-600 bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs";
            if (cashBox) cashBox.style.display = 'none';
        }

        calculateChange();
    },

    handleReceivedInput(val) {
        PosState.amountReceived = Number(val || 0);
        calculateChange();
    },

    setQuickBill(bill) {
        SoundFx.beep();
        const total = getCartTotal();
        let val = 0;
        if (bill === 'exact') {
            val = total;
        } else {
            val = Number(bill);
        }

        PosState.amountReceived = val;
        const input = document.getElementById('cashReceivedInput');
        if (input) input.value = val > 0 ? val : '';
        calculateChange();
    },

    async processSale() {
        if (PosState.cart.length === 0) return;
        const total = getCartTotal();

        if (PosState.paymentMethod === 'especes') {
            if (PosState.amountReceived < total && PosState.amountReceived > 0) {
                SoundFx.error();
                showToast("Le montant reçu est insuffisant pour régler le ticket.", "danger");
                return;
            }
        }

        const btn = document.getElementById('btnProcessSale');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">refresh</span> Validation...`;
        }

        const salePayload = {
            caissiere_id: PosState.currentCashier.id,
            caissiere_nom: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
            items: PosState.cart,
            total_price: total,
            payment_method: PosState.paymentMethod,
            amount_received: PosState.paymentMethod === 'especes' ? (PosState.amountReceived || total) : total
        };

        try {
            const res = await fetch(`${API_BASE}/api/pos/sale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salePayload)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Échec de l'enregistrement de la vente.");
            }

            SoundFx.saleComplete();
            showToast(`✅ Vente validée avec succès ! Total : ${formatMoney(total)} FCFA`, "success");

            // Mise à jour de la caisse
            if (PosState.paymentMethod === 'especes') {
                PosState.register.totalEspeces += total;
            } else {
                PosState.register.totalWave += total;
            }
            PosState.register.totalVentes += total;
            PosState.register.totalTickets += 1;
            renderRegisterSummary();
            updateKpiCounters();

            // Afficher le ticket thermique
            const change = PosState.paymentMethod === 'especes' ? Math.max(0, (PosState.amountReceived || total) - total) : 0;
            openThermalReceipt({
                ticketNo: data.orderId || data.receipt_number || ('#REC-' + Math.floor(1000 + Math.random() * 9000)),
                date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
                mode: PosState.paymentMethod,
                caissiere: salePayload.caissiere_nom,
                items: salePayload.items,
                total: total,
                recu: salePayload.amount_received,
                monnaie: change,
                isPickup: false
            });

            // Réinitialiser le panier
            PosState.cart = [];
            PosState.amountReceived = 0;
            const input = document.getElementById('cashReceivedInput');
            if (input) input.value = '';
            renderCart();
            fetchProducts();
        } catch (err) {
            SoundFx.error();
            showToast("Erreur encaissement : " + err.message, "danger");
        } finally {
            if (btn) {
                btn.disabled = PosState.cart.length === 0;
                btn.innerHTML = `<span class="material-symbols-outlined">point_of_sale</span><span>Encaisser la Vente</span>`;
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
            <div class="text-center py-10 text-on-surface-variant text-xs">
                <span class="material-symbols-outlined text-4xl block mb-1 text-outline">shopping_cart</span>
                Touchez un produit pour l'ajouter au ticket.
            </div>
        `;
        calculateChange();
        return;
    }

    list.innerHTML = PosState.cart.map(item => `
        <div class="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-low border border-surface-cream text-xs">
            <div class="flex-1 pr-1.5 overflow-hidden">
                <div class="font-bold text-primary truncate leading-tight text-[11px]">${escapeHtml(item.nom)}</div>
                <div class="text-[9px] text-on-surface-variant">${formatMoney(item.prix)} F / u</div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="PosManager.updateQty(${item.id}, -1)" class="w-5 h-5 rounded-md bg-surface-container hover:bg-surface-variant flex items-center justify-center font-bold text-primary active:scale-95 text-xs">-</button>
                <span class="w-4 text-center font-bold text-[11px]">${item.quantity}</span>
                <button onclick="PosManager.updateQty(${item.id}, 1)" class="w-5 h-5 rounded-md bg-surface-container hover:bg-surface-variant flex items-center justify-center font-bold text-primary active:scale-95 text-xs">+</button>
            </div>
            <div class="w-14 text-right font-bold text-primary shrink-0 text-[11px]">
                ${formatMoney(item.prix * item.quantity)} F
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
            changeAmountEl.innerHTML = `<span class="text-status-success font-bold">${formatMoney(change)} FCFA</span>`;
        } else {
            changeAmountEl.innerHTML = `<span class="text-status-error font-bold">Manque ${formatMoney(Math.abs(change))} F</span>`;
        }
    } else {
        changeBox.style.display = 'none';
    }
}

// -------------------------------------------------------------
// 6. RETRAIT EXPRESS CLICK & COLLECT (VALIDATION DU CODE PIN)
// -------------------------------------------------------------
function handlePinInput(val) {
    PosState.enteredPin = (val || '').trim();
    const tactileDisplay = document.getElementById('tactilePinDisplay');
    if (tactileDisplay) tactileDisplay.innerText = PosState.enteredPin ? `#${PosState.enteredPin}` : '••••';

    // Auto-validation dès que 4 chiffres sont saisis
    if (PosState.enteredPin.length === 4) {
        setTimeout(() => {
            verifyPickupPin();
        }, 300);
    }
}

const PickupManager = {
    addPinDigit(digit) {
        if (PosState.enteredPin.length >= 4) return;
        SoundFx.beep();
        PosState.enteredPin += String(digit);
        syncPinInputs();
    },

    deletePinDigit() {
        SoundFx.beep();
        PosState.enteredPin = PosState.enteredPin.slice(0, -1);
        syncPinInputs();
    },

    clearPin() {
        SoundFx.beep();
        PosState.enteredPin = '';
        syncPinInputs();
    }
};

function appendPinDigit(digit) {
    PickupManager.addPinDigit(digit);
}

function clearPinDigit() {
    PickupManager.clearPin();
}

function handlePinInput(val) {
    PosState.enteredPin = (val || '').trim();
    syncPinInputs();
}

function syncPinInputs() {
    const mainInput = document.getElementById('pickupPinInput');
    const tactileDisplay = document.getElementById('tactilePinDisplay');
    if (mainInput) mainInput.value = PosState.enteredPin;
    if (tactileDisplay) tactileDisplay.innerText = PosState.enteredPin ? `#${PosState.enteredPin}` : '••••';

    if (PosState.enteredPin.length === 4) {
        setTimeout(() => {
            closeModal('modalTactilePinpad');
            verifyPickupPin();
        }, 300);
    }
}

async function verifyPickupPin() {
    const pin = PosState.enteredPin.trim();
    if (!pin || pin.length < 3) {
        SoundFx.error();
        showToast("Veuillez saisir un code PIN valide (4 chiffres).", "warning");
        return;
    }

    const btn = document.getElementById('btnAuthorizePickup');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[24px]">refresh</span><span>Validation en cours...</span>`;
    }

    try {
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
            throw new Error(data.error || data.message || "Code PIN incorrect ou déjà remis.");
        }

        SoundFx.success();
        showToast(`✅ Retrait validé ! Commande #${data.orderId || ''} remise avec succès.`, "success");

        let parsedItems = [];
        try {
            parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
        } catch (_) {}

        // Incrémentation du compteur de retraits
        PosState.register.totalPickupsToday = (PosState.register.totalPickupsToday || 86) + 1;
        updateKpiCounters();

        // Afficher le ticket thermique de remise Click & Collect
        openThermalReceipt({
            ticketNo: `#RETRAIT-${data.orderId || pin}`,
            date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
            mode: "CLICK & COLLECT (Wave Vérifié)",
            caissiere: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
            items: parsedItems.length > 0 ? parsedItems : [{ nom: 'Sachet Click & Collect Fournil', prix: data.total_price || 0, quantity: 1 }],
            total: data.total_price || 0,
            recu: data.total_price || 0,
            monnaie: 0,
            isPickup: true
        });

        // Réinitialisation du champ PIN
        PosState.enteredPin = '';
        PosState.selectedPickupOrder = null;
        syncPinInputs();
        loadPickupQueue();
    } catch (err) {
        SoundFx.error();
        showToast(err.message, "danger");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-[24px]">lock_open</span><span>AUTORISER LA REMISE</span>`;
        }
    }
}

function selectOrderForPickup(orderId, pin) {
    SoundFx.beep();
    const order = PosState.pickupQueue.find(o => o.id === orderId);
    PosState.selectedPickupOrder = order;
    if (pin) {
        PosState.enteredPin = String(pin);
        syncPinInputs();
    }
}

function openTactilePinpad() {
    SoundFx.beep();
    openModal('modalTactilePinpad');
}

function openQrScanner() {
    SoundFx.beep();
    openModal('modalQrScanner');
}

function simulateQrScanSuccess() {
    closeModal('modalQrScanner');
    PosState.enteredPin = '5029';
    syncPinInputs();
    showToast("📸 Code QR détecté : PIN #5029", "info");
    setTimeout(() => {
        verifyPickupPin();
    }, 400);
}

async function loadPickupQueue() {
    try {
        const res = await fetch(`${API_BASE}/api/orders/pickup-queue`);
        if (!res.ok) throw new Error("Erreur file");
        const data = await res.json();
        
        const previousCount = PosState.pickupQueue.length;
        PosState.pickupQueue = Array.isArray(data) ? data : (data.orders || data.queue || []);
        
        // Alerte si nouvelle commande arrivée
        if (PosState.pickupQueue.length > previousCount && previousCount > 0) {
            SoundFx.newOrderAlert();
            showToast("🔔 Nouvelle commande Click & Collect prête au comptoir !", "info");
        }

        renderPickupQueue();
        updateKpiCounters();
    } catch (_) {
        if (PosState.pickupQueue.length === 0) {
            PosState.pickupQueue = [
                { id: 28, customer_name: 'Kouassi Jean-Marc', phone: '07 04 38 92 01', total_price: 1900, code_pin: '5029', status: 'pret_comptoir', items: '[{"nom":"Baguette Tradition","prix":400,"quantity":2},{"nom":"Croissant Pur Beurre","prix":600,"quantity":1}]' },
                { id: 27, customer_name: 'Adjoua Salimata', phone: '05 55 12 34 56', total_price: 3600, code_pin: '4443', status: 'pret_comptoir', items: '[{"nom":"Pain Complet","prix":800,"quantity":2},{"nom":"Jus de Bissap","prix":1000,"quantity":2}]' },
                { id: 26, customer_name: 'Koné Ibrahim', phone: '01 02 03 04 05', total_price: 2400, code_pin: '7812', status: 'pret_comptoir', items: '[{"nom":"Pain au Chocolat","prix":650,"quantity":2},{"nom":"Brioche Dorée","prix":1200,"quantity":1}]' }
            ];
            renderPickupQueue();
            updateKpiCounters();
        }
    }
}

function renderPickupQueue() {
    const list = document.getElementById('posPickupQueueList');
    const badge = document.getElementById('pickupQueueCountBadge');
    const readyKpi = document.getElementById('kpiReadyOrdersCount');
    
    const count = PosState.pickupQueue.length;
    if (badge) badge.innerText = count;
    if (readyKpi) readyKpi.innerText = count || '0';

    if (!list) return;

    if (PosState.pickupQueue.length === 0) {
        list.innerHTML = `
            <div class="col-span-full text-center py-8 text-on-surface-variant text-xs">
                <span class="material-symbols-outlined text-4xl text-status-success block mb-1">task_alt</span>
                <div class="font-bold text-sm text-primary">Toutes les commandes ont été remises !</div>
                <div>Les nouvelles commandes Click & Collect prêtes s'afficheront ici automatiquement.</div>
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
            <div id="queueOrder_${order.id}" 
                 onclick="selectOrderForPickup(${order.id}, '${order.code_pin || ''}')"
                 class="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-cream border border-surface-cream shadow-xs cursor-pointer transition-all flex flex-col justify-between group">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="font-bold text-sm text-primary group-hover:text-secondary block">${escapeHtml(order.customer_name || 'Client Babi')}</span>
                        <span class="text-xs text-on-surface-variant flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">call</span>
                            ${escapeHtml(order.phone || '07 00 00 00 00')}
                        </span>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-mono font-bold text-xs border border-secondary shadow-xs">
                        PIN #${order.code_pin || '????'}
                    </span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-surface-cream text-xs">
                    <span class="text-on-surface-variant font-medium">${itemsCount} article${itemsCount > 1 ? 's' : ''}</span>
                    <span class="font-bold text-status-success flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">verified</span>
                        ${formatMoney(order.total_price || 0)} FCFA (Wave)
                    </span>
                </div>
                <button onclick="event.stopPropagation(); selectOrderForPickup(${order.id}, '${order.code_pin || ''}'); verifyPickupPin();" 
                        class="mt-3 w-full py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                    <span class="material-symbols-outlined text-[16px]">lock_open</span>
                    <span>Valider ce Retrait</span>
                </button>
            </div>
        `;
    }).join('');
}

function handleQuickSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        renderPickupQueue();
        return;
    }

    const filtered = PosState.pickupQueue.filter(order => {
        const name = (order.customer_name || '').toLowerCase();
        const phone = (order.phone || '').toLowerCase();
        const id = String(order.id || '');
        const pin = String(order.code_pin || '');
        return name.includes(q) || phone.includes(q) || id.includes(q) || pin.includes(q);
    });

    const list = document.getElementById('posPickupQueueList');
    if (!list) return;

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="col-span-full text-center py-6 text-on-surface-variant text-xs">
                Aucune commande ne correspond à « ${escapeHtml(q)} ».
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(order => `
        <div id="queueOrder_${order.id}" 
             onclick="selectOrderForPickup(${order.id}, '${order.code_pin || ''}')"
             class="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-cream border border-surface-cream shadow-xs cursor-pointer transition-all flex flex-col justify-between group">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="font-bold text-sm text-primary group-hover:text-secondary block">${escapeHtml(order.customer_name || 'Client Babi')}</span>
                    <span class="text-xs text-on-surface-variant flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">call</span>
                        ${escapeHtml(order.phone || '07 00 00 00 00')}
                    </span>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-mono font-bold text-xs border border-secondary shadow-xs">
                    PIN #${order.code_pin || '????'}
                </span>
            </div>
            <button onclick="event.stopPropagation(); selectOrderForPickup(${order.id}, '${order.code_pin || ''}'); verifyPickupPin();" 
                    class="mt-3 w-full py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                <span class="material-symbols-outlined text-[16px]">lock_open</span>
                <span>Valider ce Retrait</span>
            </button>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// 7. GESTION DE CAISSE & CLÔTURE Z
// -------------------------------------------------------------
async function fetchRegisterStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/pos/register/current`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.register) {
                PosState.register = Object.assign(PosState.register, data.register);
            }
        }
    } catch (_) {}
    renderRegisterSummary();
}

function renderRegisterSummary() {
    const fondEl = document.getElementById('regInitialFund');
    const cashEl = document.getElementById('regCashRevenue');
    const waveEl = document.getElementById('regWaveRevenue');
    const totalEl = document.getElementById('regTotalSales');
    const theocashEl = document.getElementById('closeZTheoricalCash');

    if (fondEl) fondEl.innerText = `${formatMoney(PosState.register.fondDeCaisse || 50000)} FCFA`;
    if (cashEl) cashEl.innerText = `${formatMoney(PosState.register.totalEspeces || 0)} FCFA`;
    if (waveEl) waveEl.innerText = `${formatMoney(PosState.register.totalWave || 0)} FCFA`;
    if (totalEl) totalEl.innerText = `${formatMoney(PosState.register.totalVentes || 0)} FCFA`;
    if (theocashEl) {
        const theo = (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 0);
        theocashEl.innerText = `${formatMoney(theo)} FCFA`;
    }
}

const RegisterManager = {
    generateTicketX() {
        SoundFx.beep();
        const theoCash = (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 0);
        openThermalReceipt({
            ticketNo: `#TICKET-X-PROVISOIRE`,
            date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
            mode: "POINT DE SITUATION",
            caissiere: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
            items: [
                { nom: 'Fond de Caisse Initial', prix: PosState.register.fondDeCaisse || 50000, quantity: 1 },
                { nom: 'Ventes Espèces Comptoir', prix: PosState.register.totalEspeces || 0, quantity: 1 },
                { nom: 'Encaissements Wave Direct', prix: PosState.register.totalWave || 0, quantity: 1 }
            ],
            total: PosState.register.totalVentes || 0,
            recu: theoCash,
            monnaie: 0,
            isPickup: false
        });
        showToast("Ticket X (provisoire) généré.", "info");
    },

    openCloseZModal() {
        SoundFx.beep();
        renderRegisterSummary();
        const input = document.getElementById('closeZActualCashInput');
        if (input) input.value = '';
        this.calculateVariance(0);
        openModal('modalCloseZ');
    },

    calculateVariance(actualCash) {
        const theo = (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 0);
        const actual = Number(actualCash || 0);
        const diff = actual - theo;

        const box = document.getElementById('closeZVarianceBox');
        const display = document.getElementById('closeZVarianceDisplay');

        if (box && display) {
            if (actual === 0) {
                box.className = "p-3 rounded-xl bg-surface-container flex justify-between items-center font-bold text-xs";
                display.innerText = "En attente de comptage...";
            } else if (diff === 0) {
                box.className = "p-3 rounded-xl bg-emerald-50 text-status-success flex justify-between items-center font-bold text-xs";
                display.innerText = "Parfait ! Écart nul (0 FCFA)";
            } else if (diff > 0) {
                box.className = "p-3 rounded-xl bg-sky-50 text-sky-700 flex justify-between items-center font-bold text-xs";
                display.innerText = `Excédent de +${formatMoney(diff)} FCFA`;
            } else {
                box.className = "p-3 rounded-xl bg-rose-50 text-status-error flex justify-between items-center font-bold text-xs";
                display.innerText = `Déficit de -${formatMoney(Math.abs(diff))} FCFA`;
            }
        }
    },

    async confirmCloseZ() {
        const input = document.getElementById('closeZActualCashInput');
        const actualCash = Number(input ? input.value : 0);
        if (!actualCash) {
            SoundFx.error();
            showToast("Veuillez saisir le montant réel compté dans votre tiroir.", "warning");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/pos/register/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caissiere_id: PosState.currentCashier.id,
                    especes_reelles: actualCash
                })
            });

            const data = await res.json();
            SoundFx.success();
            showToast("✅ Clôture Z effectuée et transmise à la Direction !", "success");

            const theo = (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 0);
            const diff = actualCash - theo;
            PosState.lastZData = {
                startingFloat: PosState.register.fondDeCaisse || 50000,
                cashSales: PosState.register.totalEspeces || 0,
                waveSales: PosState.register.totalWave || 0,
                pickupsCount: PosState.register.totalPickupsToday || 0,
                expectedCash: theo,
                actualCash: actualCash,
                variance: diff,
                sessionNo: data.numero_z || ('Z-' + Date.now().toString().slice(-6))
            };

            const btnConfirm = document.getElementById('btnConfirmCloseZ');
            const successActions = document.getElementById('closeZSuccessActions');
            if (btnConfirm) btnConfirm.classList.add('hidden');
            if (successActions) successActions.classList.remove('hidden');

            fetchRegisterStatus();

            openThermalReceipt({
                ticketNo: data.numero_z || '#TICKET-Z-OFFICIEL',
                date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
                mode: "CLÔTURE DÉFINITIVE Z",
                caissiere: `${PosState.currentCashier.prenom} ${PosState.currentCashier.nom}`,
                items: [
                    { nom: 'Fond de Caisse', prix: PosState.register.fondDeCaisse || 50000, quantity: 1 },
                    { nom: 'Recettes Espèces', prix: PosState.register.totalEspeces || 0, quantity: 1 },
                    { nom: 'Recettes Wave', prix: PosState.register.totalWave || 0, quantity: 1 },
                    { nom: 'Espèces Réelles Déclarées', prix: actualCash, quantity: 1 },
                    { nom: 'Écart de Caisse Constaté', prix: actualCash - theo, quantity: 1 }
                ],
                total: PosState.register.totalVentes || 0,
                recu: actualCash,
                monnaie: 0,
                isPickup: false
            });
        } catch (err) {
            SoundFx.error();
            showToast("Erreur clôture : " + err.message, "danger");
        }
    }
};

// -------------------------------------------------------------
// 8. GESTION DES MODES & MODALS
// -------------------------------------------------------------
function switchPosMode(mode) {
    SoundFx.beep();
    ['retrait', 'vente', 'caisse'].forEach(m => {
        const view = document.getElementById(`modeView_${m}`);
        const btn = document.getElementById(`modeBtn_${m}`);
        if (view) {
            if (m === mode) {
                view.classList.remove('hidden');
                view.classList.add('flex');
            } else {
                view.classList.add('hidden');
                view.classList.remove('flex');
            }
        }
        if (btn) {
            if (m === mode) {
                btn.className = "pos-mode-btn flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#F5B800] to-[#E0A300] text-[#2B160C] rounded-xl font-extrabold transition-all shadow-[0_4px_14px_rgba(245,184,0,0.35)] scale-[1.01]";
            } else {
                btn.className = "pos-mode-btn flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#D7CCC8] hover:text-white hover:bg-white/10 transition-all font-label-md text-label-md";
            }
        }
    });

    if (mode === 'vente') {
        renderProducts();
        renderCart();
    } else if (mode === 'retrait') {
        loadPickupQueue();
    } else if (mode === 'caisse') {
        renderRegisterSummary();
    }

    // Mise à jour de la barre inférieure mobile
    updateMobileCashierBottomNav(mode);
}

function updateMobileCashierBottomNav(mode) {
    ['retrait', 'vente', 'caisse'].forEach(m => {
        const navItem = document.getElementById(`mobilePosNav_${m}`);
        if (!navItem) return;
        if (m === mode) {
            navItem.classList.remove('text-[#D7CCC8]', 'font-medium');
            navItem.classList.add('text-[#F5B800]', 'font-bold');
            const icon = navItem.querySelector('.material-symbols-outlined');
            if (icon) icon.classList.add('icon-filled');
        } else {
            navItem.classList.remove('text-[#F5B800]', 'font-bold');
            navItem.classList.add('text-[#D7CCC8]', 'font-medium');
            const icon = navItem.querySelector('.material-symbols-outlined');
            if (icon) icon.classList.remove('icon-filled');
        }
    });
}

function toggleMobileCashierDrawer(open) {
    const drawer = document.getElementById('mobileCashierDrawer');
    const overlay = document.getElementById('mobileCashierOverlay');
    if (!drawer || !overlay) return;
    if (open) {
        drawer.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    } else {
        drawer.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function openThermalReceipt(receipt) {
    PosState.lastReceipt = receipt;
    const modal = document.getElementById('modalReceipt');
    if (!modal) return;

    const noEl = document.getElementById('receiptTicketNo');
    const dateEl = document.getElementById('receiptDate');
    const totalEl = document.getElementById('receiptTotal');
    const modeEl = document.getElementById('receiptMode');
    const changeRow = document.getElementById('receiptChangeRow');
    const changeEl = document.getElementById('receiptChange');
    const listEl = document.getElementById('receiptItemsList');

    if (noEl) noEl.innerText = receipt.ticketNo || '#TICKET-001';
    if (dateEl) dateEl.innerText = receipt.date || new Date().toLocaleString('fr-FR');
    if (totalEl) totalEl.innerText = `${formatMoney(receipt.total)} FCFA`;
    if (modeEl) modeEl.innerText = receipt.isPickup ? 'Click & Collect (Wave)' : (receipt.mode === 'wave' ? 'Wave Mobile Money' : 'Espèces');

    if (changeRow) {
        if (!receipt.isPickup && receipt.monnaie > 0) {
            changeRow.style.display = 'flex';
            if (changeEl) changeEl.innerText = `${formatMoney(receipt.monnaie)} FCFA`;
        } else {
            changeRow.style.display = 'none';
        }
    }

    if (listEl) {
        listEl.innerHTML = (receipt.items || []).map(i => `
            <div class="flex justify-between items-center text-xs">
                <span class="truncate pr-2">${i.quantity || 1}x ${escapeHtml(i.nom || i.name)}</span>
                <span class="font-bold shrink-0">${formatMoney((i.prix || i.price || 0) * (i.quantity || 1))} F</span>
            </div>
        `).join('');
    }

    openModal('modalReceipt');
}

function printReceipt() {
    SoundFx.beep();
    const receipt = PosState.lastReceipt;
    if (!receipt) {
        showToast("Aucun ticket à imprimer.", "warning");
        return;
    }

    const printContainer = document.getElementById('thermalPrintContainer');
    if (!printContainer) return;

    const itemsHtml = (receipt.items || []).map(i => {
        const qty = i.quantity || 1;
        const name = (i.nom || i.name || 'Article').slice(0, 22);
        const lineTotal = formatMoney((i.prix || i.price || 0) * qty);
        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>${qty}x ${escapeHtml(name)}</span>
                <span style="font-weight: bold;">${lineTotal} F</span>
            </div>
        `;
    }).join('');

    const isPickup = receipt.isPickup;
    const modeLabel = isPickup ? 'CLICK & COLLECT (Wave)' : (receipt.mode === 'wave' ? 'WAVE MOBILE MONEY' : 'ESPÈCES');

    printContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 6px;">
            <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">BOULANGERIE DE BABI</div>
            <div style="font-size: 10px;">Fournil Artisanal & Pâtisserie</div>
            <div style="font-size: 10px;">Riviera 3 • Bd F. Mitterrand, Abidjan</div>
            <div style="font-size: 10px;">Tél : +225 07 00 00 00 00</div>
            <div style="font-size: 9px; color: #333;">RCCM : CI-ABJ-2024-B-14209</div>
        </div>

        <div class="receipt-double-divider"></div>

        <div style="font-size: 10px; margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between;">
                <span>Date : ${receipt.date || new Date().toLocaleString('fr-FR')}</span>
                <span>Caisse : 1</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold;">Ticket : ${receipt.ticketNo || '#TKT-001'}</span>
                <span>Caissière : ${escapeHtml(PosState.currentCashier.prenom)}</span>
            </div>
        </div>

        <div class="receipt-divider"></div>

        <div style="font-size: 10px; font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>QTE  ARTICLE</span>
            <span>TOTAL</span>
        </div>
        <div class="receipt-divider"></div>

        <div style="font-size: 10px; margin: 4px 0;">
            ${itemsHtml}
        </div>

        <div class="receipt-divider"></div>

        <div style="font-size: 11px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 3px 0;">
                <span>TOTAL A PAYER :</span>
                <span>${formatMoney(receipt.total)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>Règlement :</span>
                <span style="font-weight: bold;">${modeLabel}</span>
            </div>
            ${receipt.recu && !isPickup ? `
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>Espèces reçues :</span>
                <span>${formatMoney(receipt.recu)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold;">
                <span>Monnaie rendue :</span>
                <span>${formatMoney(receipt.monnaie || 0)} FCFA</span>
            </div>
            ` : ''}
        </div>

        ${isPickup ? `
        <div class="receipt-divider"></div>
        <div style="text-align: center; font-size: 11px; padding: 4px; border: 1px solid #000; margin: 4px 0;">
            <div style="font-weight: bold;">CODE PIN DE RETRAIT CLIENT</div>
            <div style="font-size: 16px; font-weight: bold; letter-spacing: 3px;">${receipt.ticketNo ? receipt.ticketNo.replace(/\D/g, '') : 'VALIDÉ'}</div>
            <div style="font-size: 9px; margin-top: 2px;">COMMANDE REMISE EN MAINS PROPRES</div>
        </div>
        ` : ''}

        <div class="receipt-divider"></div>

        <div style="text-align: center; font-size: 10px; margin-top: 6px;">
            <div style="font-weight: bold;">*** MERCI DE VOTRE VISITE ! ***</div>
            <div style="font-size: 9px; margin-top: 2px;">Pain chaud croustillant chaque heure.</div>
            <div style="font-size: 9px;">www.boulangeriedebabi.com</div>
        </div>
    `;

    setTimeout(() => {
        window.print();
    }, 50);
}

function printTicketZ() {
    SoundFx.beep();
    const zData = PosState.lastZData || {
        startingFloat: PosState.register.fondDeCaisse || 50000,
        cashSales: PosState.register.totalEspeces || 145000,
        waveSales: PosState.register.totalWave || 82500,
        pickupsCount: PosState.register.totalPickupsToday || 86,
        expectedCash: (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 145000),
        actualCash: (PosState.register.fondDeCaisse || 50000) + (PosState.register.totalEspeces || 145000),
        variance: 0,
        sessionNo: 'Z-' + Date.now().toString().slice(-6)
    };

    const printContainer = document.getElementById('thermalPrintContainer');
    if (!printContainer) return;

    printContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 6px;">
            <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">BOULANGERIE DE BABI</div>
            <div style="font-size: 10px;">Fournil Artisanal & Pâtisserie</div>
            <div style="font-size: 10px;">Riviera 3 • Bd F. Mitterrand, Abidjan</div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 4px; padding: 3px 0; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                RAPPORT DE CLÔTURE DE CAISSE (TICKET Z)
            </div>
        </div>

        <div style="font-size: 10px; margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between;">
                <span>Date Clôture : ${new Date().toLocaleString('fr-FR')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Caisse : Caisse 1 (Riviera)</span>
                <span>Caissière : ${escapeHtml(PosState.currentCashier.prenom)} ${escapeHtml(PosState.currentCashier.nom)}</span>
            </div>
            <div>Réf Session : #${zData.sessionNo}</div>
        </div>

        <div class="receipt-divider"></div>

        <div style="font-size: 10px; margin: 4px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Fond de Caisse Initial :</span>
                <span style="font-weight: bold;">${formatMoney(zData.startingFloat)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Ventes Comptoir (Espèces) :</span>
                <span style="font-weight: bold;">${formatMoney(zData.cashSales)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Ventes Comptoir (Wave) :</span>
                <span style="font-weight: bold;">${formatMoney(zData.waveSales)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Retraits Click & Collect :</span>
                <span style="font-weight: bold;">${zData.pickupsCount} remis</span>
            </div>
        </div>

        <div class="receipt-divider"></div>

        <div style="font-size: 11px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>ESPÈCES THÉORIQUES EN TIROIR :</span>
                <span>${formatMoney(zData.expectedCash)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;">
                <span>ESPÈCES COMPTÉES EN TIROIR :</span>
                <span>${formatMoney(zData.actualCash)} FCFA</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 3px; padding-top: 2px; border-top: 1px dashed #000;">
                <span>ÉCART DE CAISSE :</span>
                <span>${(zData.variance > 0 ? '+' : '') + formatMoney(zData.variance)} FCFA</span>
            </div>
            <div style="text-align: right; font-size: 9px; font-weight: bold; margin-top: 2px;">
                ${zData.variance === 0 ? 'CONFORMITÉ : JUSTE (ZÉRO ÉCART)' : (zData.variance > 0 ? 'CONFORMITÉ : EXCÉDENT' : 'CONFORMITÉ : DÉFICIT')}
            </div>
        </div>

        <div class="receipt-double-divider"></div>

        <div style="margin-top: 16px; font-size: 10px;">
            <div style="margin-bottom: 20px;">Visa Caissière : _________________________</div>
            <div>Visa Responsable Fournil : _________________</div>
        </div>

        <div class="receipt-divider"></div>
        <div style="text-align: center; font-size: 9px; margin-top: 4px;">
            Document comptable certifié • Boulangerie de Babi
        </div>
    `;

    setTimeout(() => {
        window.print();
    }, 50);
}

function setupEventListeners() {
    // Saisie clavier physique pour le PIN
    document.addEventListener('keydown', (e) => {
        const modeRetrait = document.getElementById('modeView_retrait');
        if (modeRetrait && !modeRetrait.classList.contains('hidden')) {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            if (e.key >= '0' && e.key <= '9') {
                PickupManager.addPinDigit(e.key);
            } else if (e.key === 'Backspace') {
                PickupManager.deletePinDigit();
            } else if (e.key === 'Enter') {
                verifyPickupPin();
            }
        }
    });

    // Fermeture des modals par clic extérieur
    window.addEventListener('click', (e) => {
        ['modalTactilePinpad', 'modalQrScanner', 'modalReceipt', 'modalCloseZ'].forEach(id => {
            const modal = document.getElementById(id);
            if (modal && e.target === modal) {
                closeModal(id);
            }
        });
    });

    // Fermeture par touche Échap
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ['modalTactilePinpad', 'modalQrScanner', 'modalReceipt', 'modalCloseZ'].forEach(id => {
                closeModal(id);
            });
        }
    });
}

// -------------------------------------------------------------
// 9. UTILITAIRES DE NOTIFICATION & FORMATAGE
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
        container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-status-success text-white' : 
                      (type === 'danger' ? 'bg-status-error text-white' : 
                      (type === 'warning' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-primary'));
    
    toast.className = `${colorClass} px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all duration-300 pointer-events-auto transform translate-y-4 opacity-0 border border-surface-cream`;
    
    const iconName = type === 'success' ? 'check_circle' : (type === 'danger' ? 'error' : (type === 'warning' ? 'warning' : 'info'));
    toast.innerHTML = `
        <span class="material-symbols-outlined text-[18px]">${iconName}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
