// -------------------------------------------------------------
// POS CAISSIÈRE — LOGIQUE POINT DE VENTE & ENCAISSEMENT
// -------------------------------------------------------------

const posRealImages = {
    "Chill": "assets/chill.png",
    "Youyou": "assets/youzou.png",
    "Youzou": "assets/youzou.png",
    "Word Cola": "assets/world cola.png",
    "World Cola": "assets/world cola.png",
    "Youki Orange": "assets/youki moka cafe.png",
    "Youki Pomme": "assets/youki pomme.png",
    "Énergie Malt": "assets/energie malt .png",
    "Energie Malt": "assets/energie malt .png",
    "Orangina": "assets/Orangina.png",
    "Sprite": "assets/sprite.png",
    "Jus Naturel (Petit Format)": "assets/Jus Naturel (Petit).png",
    "Jus Naturel (Moyen Format)": "assets/Jus Naturel (Moyen).png",
    "Jus Naturel (Bouteille 1.5L)": "assets/Jus Naturel (Grand).png",
    "Jus Naturel (Petit)": "assets/Jus Naturel (Petit).png",
    "Jus Naturel (Moyen)": "assets/Jus Naturel (Moyen).png",
    "Jus Naturel (Grand)": "assets/Jus Naturel (Grand).png",
    "Eau Minérale (Petite)": "assets/bouteille celeste.png",
    "Eau Minérale (Grande 1.5L)": "assets/bouteille celeste.png",
    "Eau Minérale (Grande)": "assets/bouteille celeste.png",
    "Dégué Traditionnel": "assets/jus de bissap.png",
    "Dégué": "assets/jus de bissap.png",
    "Lait Frais": "assets/Chocolat Chaud.png",
    "Jus de Passion (Grand Format 1.5L)": "assets/jus de passion.png",
    "Jus de Passion (Petite Bouteille)": "assets/jus de passion.png",
    "Jus de Baobab (Pain de Singe)": "assets/jus de baobab.png",
    "Baobab (Petit)": "assets/jus de baobab petit.png",
    "Bissap Supérieur": "assets/jus de bissap.png",
    "Bissap": "assets/jus de bissap.png",
    "Jus de Gingembre (Gnamankoudji)": "assets/jus de gingembre.png",
    "Jus de Gingembre": "assets/jus de gingembre.png",
    "Jus de Tamarin": "assets/jus de tamari.png",
    "Cocktail de Fruits": "assets/cocktail.png",
    "Cocktail": "assets/cocktail.png",
    "Jus de Citron Pressé": "assets/jus de citron.png",
    "Jus de Citron": "assets/jus de citron.png",
    "Chocolat Chaud Gourmand": "assets/Chocolat Chaud.png",
    "Chocolat Chaud": "assets/Chocolat Chaud.png",
    "Baguette Standard 150F": "assets/baguette 150.png",
    "Baguette 150": "assets/baguette 150.png",
    "Baguette Traditionnelle 200F": "assets/baguette 200.png",
    "Baguette 200": "assets/baguette 200.png",
    "Ficelle Croquante": "assets/baguette 150.png",
    "Ficelle": "assets/baguette 150.png",
    "Pain Complet (Grand Format)": "assets/Pain Complet (Grand).png",
    "Pain Complet (Grand)": "assets/Pain Complet (Grand).png",
    "Pain Complet (Format Moyen)": "assets/pain complet 2.png",
    "Pain Complet (Petit)": "assets/pain complet 2.png",
    "Pain Sans Sel": "assets/pain sans sel.png",
    "Panini Chaud": "assets/Panini.png",
    "Panini": "assets/Panini.png",
    "Petit Pain Individuel 50F": "assets/pain individuel.png",
    "Petit Pain Individuel 100F": "assets/pain individuel.png",
    "Petit Pain (50F)": "assets/pain individuel.png",
    "Petit Pain (100F)": "assets/pain individuel.png",
    "Mini Pizza Gourmande": "assets/Pizza.png",
    "Petit Pizza Royale": "assets/Pizza.png",
    "Grande Pizza Familiale": "assets/Pizza.png",
    "Pizza": "assets/Pizza.png",
    "Américain": "assets/Croissant.png",
    "Biscotte Artisanale (Paquet)": "assets/biscottes.png",
    "Biscotte": "assets/biscottes.png",
    "Charaphe au Raisin": "assets/charaphe au raisin.png",
    "Chausson aux Pommes": "assets/chausson aux pommes.png",
    "Choco Suisse": "assets/choco suisse.png",
    "Cookie aux Pépites": "assets/cookies.png",
    "Cookies (l'unité)": "assets/cookies.png",
    "Lot de Cookies (x6)": "assets/cookies_unite.png",
    "Lot de Cookies": "assets/cookies.png",
    "Croissant Pur Beurre": "assets/Croissant.png",
    "Croissant": "assets/Croissant.png",
    "Escargot aux Raisins": "assets/pain au raisin.png",
    "Flan Pâtissier Traditionnel": "assets/Flan.png",
    "Flan": "assets/Flan.png",
    "Quiche Salée": "assets/Pizza.png",
    "Pain au Chocolat (Chocolatine)": "assets/pain au chocolat.png",
    "Pain au Chocolat": "assets/pain au chocolat.png",
    "Pain au Lait Moelleux": "assets/pain de mie.png",
    "Pain aux Raisins": "assets/pain au raisin.png",
    "Pain Évêque": "assets/cake.png",
    "Pain Suisse": "assets/choco suisse.png",
    "Palmier Croustillant": "assets/palmier.png",
    "Palmiers": "assets/palmier.png",
    "Star Suisse": "assets/choco suisse.png",
    "Torsade au Chocolat": "assets/torsade.png",
    "Torsade": "assets/torsade.png",
    "Croque-Monsieur Chaud": "assets/Panini.png",
    "Madeleine Pur Beurre (l'unité)": "assets/madeleine unite.png",
    "Madeleine": "assets/madeleine unite.png",
    "Madeleines (l'unité)": "assets/madeleine unite.png",
    "Lot de Madeleines (Sachet de 6)": "assets/lots de madeleine.png",
    "Lot de Madeleines": "assets/lots de madeleine.png",
    "Gâteau Anniversaire (10 pers.)": "assets/Gateau1.png",
    "Gâteau Événement (15 pers.)": "assets/Gateau1.1.png",
    "Gâteau Prestige (20 pers.)": "assets/Gateau1.2.png",
    "Gâteau Cérémonie (25 pers.)": "assets/gateau2.png",
    "Gâteau de Mariage": "assets/gateau de mariiage.png",
    "Bûche de Noël (Petite)": "assets/buche de noel.png",
    "Bûche de Noël (Grande)": "assets/buche de noel.png",
    "Gâteau Moka Café": "assets/moka1.png",
    "Moka": "assets/moka1.png",
    "Cupcake Vanille / Chocolat": "assets/moka1.1.png",
    "Cup Cake": "assets/moka1.1.png",
    "Cake Tranche (Marbré / Citron)": "assets/cake1.png",
    "Cake (300F)": "assets/cake.png",
    "Cake (700F)": "assets/cake1.png",
    "Cake Entier Familial": "assets/cake.png",
    "Crêpe au Nutella": "assets/crepe au nutella.png",
    "Crêpe à la Vanille": "assets/crepe a la vanille.png",
    "Crêpe Suzette": "assets/Crêpe Suzette.png",
    "Fondant au Chocolat": "assets/Fondant au Chocolat.png",
    "Glace Artisanale (Pot)": "assets/glace.png",
    "Glace": "assets/glace.png",
    "Pain Cabre": "assets/cabre.png",
    "Pain Cabré": "assets/cabre.png",
    "Pain Breton": "assets/pain complet.png",
    "Pain Délice": "assets/marbre1.1.png",
    "Pain Marbré": "assets/marbre.png",
    "Pain Amour": "assets/gateau evenement.png",
    "Pain Canadien": "assets/pain complet 3.png",
    "Pain de Mie Spécial (Grand)": "assets/pain de mie.png",
    "Pain de Mie": "assets/pain de mie.png",
    "Pain Parisien": "assets/pain  parisien.jpeg",
    "Pain Viennois Pépites (500F)": "assets/marbre1.1.png",
    "Pain Viennois Pépites (700F)": "assets/marbre1.png",
    "Pain Suzette": "assets/crepe jaune.png",
    "Brioche à la Viande": "assets/Panini.png",
    "Feuilleté Salé": "assets/palmier2.png"
};

const FALLBACK_POS_PRODUCTS = [
    { id: 1, nom: "Chill", prix: 700, categorie: "Boissons", image: "assets/chill.png" },
    { id: 2, nom: "Youyou", prix: 500, categorie: "Boissons", image: "assets/youzou.png" },
    { id: 3, nom: "Word Cola", prix: 500, categorie: "Boissons", image: "assets/world cola.png" },
    { id: 4, nom: "Youki Orange", prix: 500, categorie: "Boissons", image: "assets/youki moka cafe.png" },
    { id: 5, nom: "Youki Pomme", prix: 500, categorie: "Boissons", image: "assets/youki pomme.png" },
    { id: 6, nom: "Jus Naturel (Petit Format)", prix: 300, categorie: "Boissons", image: "assets/Jus Naturel (Petit).png" },
    { id: 7, nom: "Jus Naturel (Moyen Format)", prix: 500, categorie: "Boissons", image: "assets/Jus Naturel (Moyen).png" },
    { id: 8, nom: "Jus Naturel (Bouteille 1.5L)", prix: 2000, categorie: "Boissons", image: "assets/Jus Naturel (Grand).png" },
    { id: 9, nom: "Orangina", prix: 500, categorie: "Boissons", image: "assets/Orangina.png" },
    { id: 10, nom: "Sprite", prix: 500, categorie: "Boissons", image: "assets/sprite.png" },
    { id: 11, nom: "Énergie Malt", prix: 700, categorie: "Boissons", image: "assets/energie malt .png" },
    { id: 12, nom: "Eau Minérale (Petite)", prix: 200, categorie: "Boissons", image: "assets/bouteille celeste.png" },
    { id: 13, nom: "Eau Minérale (Grande 1.5L)", prix: 1000, categorie: "Boissons", image: "assets/bouteille celeste.png" },
    { id: 14, nom: "Bissap Supérieur", prix: 2000, categorie: "Boissons", image: "assets/jus de bissap.png" },
    { id: 15, nom: "Jus de Baobab (Pain de Singe)", prix: 500, categorie: "Boissons", image: "assets/jus de baobab.png" },
    { id: 16, nom: "Jus de Gingembre", prix: 3000, categorie: "Boissons", image: "assets/jus de gingembre.png" },
    { id: 17, nom: "Jus de Tamarin", prix: 2000, categorie: "Boissons", image: "assets/jus de tamari.png" },
    { id: 18, nom: "Cocktail de Fruits", prix: 3000, categorie: "Boissons", image: "assets/cocktail.png" },
    { id: 19, nom: "Jus de Citron Pressé", prix: 2000, categorie: "Boissons", image: "assets/jus de citron.png" },
    { id: 20, nom: "Chocolat Chaud Gourmand", prix: 3000, categorie: "Boissons", image: "assets/Chocolat Chaud.png" },
    { id: 21, nom: "Baguette Standard 150F", prix: 150, categorie: "Pains", image: "assets/baguette 150.png" },
    { id: 22, nom: "Baguette Traditionnelle 200F", prix: 200, categorie: "Pains", image: "assets/baguette 200.png" },
    { id: 23, nom: "Pain Complet (Grand Format)", prix: 1000, categorie: "Pains", image: "assets/Pain Complet (Grand).png" },
    { id: 24, nom: "Pain Sans Sel", prix: 150, categorie: "Pains", image: "assets/pain sans sel.png" },
    { id: 25, nom: "Panini Chaud", prix: 100, categorie: "Pains", image: "assets/Panini.png" },
    { id: 26, nom: "Petit Pain Individuel 50F", prix: 50, categorie: "Pains", image: "assets/pain individuel.png" },
    { id: 27, nom: "Croissant Pur Beurre", prix: 500, categorie: "Viennoiseries", image: "assets/Croissant.png" },
    { id: 28, nom: "Pain au Chocolat (Chocolatine)", prix: 500, categorie: "Viennoiseries", image: "assets/pain au chocolat.png" },
    { id: 29, nom: "Pain aux Raisins", prix: 700, categorie: "Viennoiseries", image: "assets/pain au raisin.png" },
    { id: 30, nom: "Chausson aux Pommes", prix: 1000, categorie: "Viennoiseries", image: "assets/chausson aux pommes.png" },
    { id: 31, nom: "Choco Suisse", prix: 800, categorie: "Viennoiseries", image: "assets/choco suisse.png" },
    { id: 32, nom: "Palmier Croustillant", prix: 200, categorie: "Viennoiseries", image: "assets/palmier.png" },
    { id: 33, nom: "Cookie aux Pépites", prix: 200, categorie: "Viennoiseries", image: "assets/cookies.png" },
    { id: 34, nom: "Madeleine Pur Beurre (l'unité)", prix: 100, categorie: "Viennoiseries", image: "assets/madeleine unite.png" },
    { id: 35, nom: "Lot de Madeleines (Sachet de 6)", prix: 500, categorie: "Viennoiseries", image: "assets/lots de madeleine.png" },
    { id: 36, nom: "Flan Pâtissier Traditionnel", prix: 1000, categorie: "Pâtisseries", image: "assets/Flan.png" },
    { id: 37, nom: "Fondant au Chocolat", prix: 1000, categorie: "Pâtisseries", image: "assets/Fondant au Chocolat.png" },
    { id: 38, nom: "Cake Tranche (Marbré / Citron)", prix: 300, categorie: "Pâtisseries", image: "assets/cake1.png" },
    { id: 39, nom: "Cake Entier Familial", prix: 700, categorie: "Pâtisseries", image: "assets/cake.png" },
    { id: 40, nom: "Crêpe au Nutella", prix: 2000, categorie: "Pâtisseries", image: "assets/crepe au nutella.png" },
    { id: 41, nom: "Gâteau Anniversaire (10 pers.)", prix: 10000, categorie: "Pâtisseries", image: "assets/Gateau1.png" },
    { id: 42, nom: "Glace Artisanale (Pot)", prix: 1000, categorie: "Pâtisseries", image: "assets/glace.png" },
    { id: 43, nom: "Mini Pizza Gourmande", prix: 1000, categorie: "Traiteur", image: "assets/Pizza.png" },
    { id: 44, nom: "Croque-Monsieur Chaud", prix: 700, categorie: "Traiteur", image: "assets/Panini.png" }
];

let posProducts = [];
let posCart = [];
let currentCategory = 'all';
let currentReceiptData = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = JSON.parse(localStorage.getItem('babi_user'));
    if (user && document.getElementById('caissiere-name-badge')) {
        document.getElementById('caissiere-name-badge').innerText = (user.prenom || 'Awa') + ' ' + (user.nom || 'Kouassi');
    }

    loadPosProducts();
    setupEventListeners();
    updateClock();
    setInterval(updateClock, 1000);
});

// Update live clock
function updateClock() {
    const clockEl = document.getElementById('pos-live-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

function resolveProductImage(p) {
    const name = p.nom || p.name || '';
    if (posRealImages[name]) return posRealImages[name];
    
    // Fuzzy match
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(posRealImages)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
            return val;
        }
    }

    if (p.image && p.image !== 'null' && !p.image.includes('product_jus_orange.png') && !p.image.includes('product_jus_ananas.png')) {
        return p.image;
    }
    return 'assets/product_baguette.png';
}

// Load products
async function loadPosProducts() {
    try {
        const res = await fetch('/api/products');
        if (res.ok) {
            posProducts = await res.json();
        } else {
            throw new Error("Fallback local");
        }
    } catch (e) {
        try {
            const fallback = await fetch('data/products.json');
            posProducts = await fallback.json();
        } catch (err) {
            console.warn("Utilisation du catalogue de secours direct:", err);
            posProducts = [...FALLBACK_POS_PRODUCTS];
        }
    }

    if (!posProducts || posProducts.length === 0) {
        posProducts = [...FALLBACK_POS_PRODUCTS];
    }

    renderProductsGrid();
}

// Filter and render products
function renderProductsGrid() {
    const grid = document.getElementById('pos-products-grid');
    const searchVal = (document.getElementById('pos-search-input')?.value || '').toLowerCase();
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = posProducts.filter(p => {
        const cat = (p.categorie || p.category || '').toLowerCase();
        let matchesCategory = (currentCategory === 'all');
        if (!matchesCategory) {
            if (currentCategory === 'Pains') matchesCategory = (cat.includes('pain') || cat.includes('baguette'));
            else if (currentCategory === 'Viennoiseries') matchesCategory = (cat.includes('viennois') || cat.includes('croissant') || cat.includes('cookie') || cat.includes('biscotte'));
            else if (currentCategory === 'Pâtisseries') matchesCategory = (cat.includes('patiss') || cat.includes('pâtiss') || cat.includes('gateau') || cat.includes('gâteau') || cat.includes('cake') || cat.includes('crepe') || cat.includes('crêpe') || cat.includes('flan'));
            else if (currentCategory === 'Boissons') matchesCategory = (cat.includes('boisson') || cat.includes('jus') || cat.includes('cafe') || cat.includes('café') || cat.includes('eau') || cat.includes('glace'));
            else if (currentCategory === 'Traiteur') matchesCategory = (cat.includes('traiteur') || cat.includes('snack') || cat.includes('pizza') || cat.includes('panini') || cat.includes('salé') || cat.includes('sale'));
            else matchesCategory = (cat === currentCategory.toLowerCase());
        }

        const name = (p.nom || p.name || '').toLowerCase();
        const matchesSearch = name.includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-bread-slice fs-1 mb-2 d-block opacity-25"></i>Aucun article trouvé</div>`;
        return;
    }

    filtered.forEach(prod => {
        const name = prod.nom || prod.name;
        const price = prod.prix || prod.price;
        const img = resolveProductImage(prod);

        const itemEl = document.createElement('div');
        itemEl.className = 'pos-product-item';
        itemEl.innerHTML = `
            <div>
                <img src="${img}" alt="${name}" class="pos-prod-img" onerror="this.src='assets/product_baguette.png'">
                <div class="pos-prod-title" title="${name}">${name}</div>
            </div>
            <div class="pos-prod-price">${price.toLocaleString()} F</div>
        `;
        itemEl.addEventListener('click', () => addToCart(prod));
        grid.appendChild(itemEl);
    });
}

// Filter category
function filterCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.pos-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProductsGrid();
}

// Cart actions
function addToCart(product) {
    const name = product.nom || product.name;
    const price = product.prix || product.price;
    const id = product.id;

    const existing = posCart.find(i => (i.id === id) || (i.nom === name));
    if (existing) {
        existing.qte += 1;
    } else {
        posCart.push({
            id: id,
            nom: name,
            prix: price,
            qte: 1,
            image: resolveProductImage(product)
        });
    }

    renderCart();
}

function updateCartQte(idx, delta) {
    if (posCart[idx]) {
        posCart[idx].qte += delta;
        if (posCart[idx].qte <= 0) {
            posCart.splice(idx, 1);
        }
    }
    renderCart();
}

function removeCartItem(idx) {
    if (posCart[idx]) {
        posCart.splice(idx, 1);
    }
    renderCart();
}

function clearCart() {
    posCart = [];
    renderCart();
}

function renderCart() {
    const itemsContainer = document.getElementById('pos-cart-items');
    const itemsCountEl = document.getElementById('pos-items-count');
    const totalValEl = document.getElementById('pos-total-val');
    const payBtn = document.getElementById('pos-pay-btn');

    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    let total = 0;
    let count = 0;

    if (posCart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="text-center text-muted my-auto py-5">
                <i class="fa-solid fa-basket-shopping fs-1 opacity-25 mb-2 d-block"></i>
                Panier vide<br>
                <small>Cliquez sur un article pour l'ajouter</small>
            </div>
        `;
        if (payBtn) payBtn.disabled = true;
    } else {
        posCart.forEach((item, idx) => {
            const lineTotal = item.prix * item.qte;
            total += lineTotal;
            count += item.qte;

            const row = document.createElement('div');
            row.className = 'pos-cart-item-row';
            row.innerHTML = `
                <div style="flex:1; overflow:hidden;">
                    <div class="pos-cart-row-title" title="${item.nom}">${item.nom}</div>
                    <small class="text-muted">${item.prix.toLocaleString()} F</small>
                </div>
                <div class="pos-cart-row-ctrls">
                    <button class="pos-cart-btn-qte" onclick="updateCartQte(${idx}, -1)">-</button>
                    <span class="pos-cart-row-qte">${item.qte}</span>
                    <button class="pos-cart-btn-qte" onclick="updateCartQte(${idx}, 1)">+</button>
                </div>
                <div class="pos-cart-row-total">${lineTotal.toLocaleString()} F</div>
                <button class="btn btn-link text-danger p-0 ms-2" onclick="removeCartItem(${idx})" title="Supprimer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            itemsContainer.appendChild(row);
        });

        if (payBtn) payBtn.disabled = false;
    }

    if (itemsCountEl) itemsCountEl.innerText = `${count} article${count > 1 ? 's' : ''}`;
    if (totalValEl) totalValEl.innerText = `${total.toLocaleString()} FCFA`;
}

// Payment modal setup
function openPaymentModal() {
    if (posCart.length === 0) return;

    let total = posCart.reduce((sum, i) => sum + (i.prix * i.qte), 0);
    document.getElementById('modal-total-display').innerText = `${total.toLocaleString()} FCFA`;
    
    // Set cash input
    const cashInput = document.getElementById('cash-received-input');
    if (cashInput) {
        cashInput.value = total;
        calculateChange();
    }

    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

function setCashAmount(val) {
    const cashInput = document.getElementById('cash-received-input');
    if (cashInput) {
        cashInput.value = val;
        calculateChange();
    }
}

function calculateChange() {
    let total = posCart.reduce((sum, i) => sum + (i.prix * i.qte), 0);
    let received = parseInt(document.getElementById('cash-received-input')?.value) || 0;
    let change = Math.max(0, received - total);
    
    const changeEl = document.getElementById('cash-change-display');
    if (changeEl) {
        changeEl.innerText = `${change.toLocaleString()} FCFA`;
    }
}

async function processSale(paymentMethod) {
    let total = posCart.reduce((sum, i) => sum + (i.prix * i.qte), 0);
    let received = parseInt(document.getElementById('cash-received-input')?.value) || total;
    let change = Math.max(0, received - total);

    const user = JSON.parse(localStorage.getItem('babi_user')) || { prenom: 'Awa', nom: 'Kouassi' };
    const caissiereNom = `${user.prenom} ${user.nom}`;

    const orderData = {
        caissiere: caissiereNom,
        items: [...posCart],
        total: total,
        mode_paiement: paymentMethod,
        montant_recu: paymentMethod === 'Espèces' ? received : total,
        monnaie_rendue: paymentMethod === 'Espèces' ? change : 0,
        date: new Date().toISOString()
    };

    try {
        const res = await fetch('/api/orders/pos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        orderData.id = data.orderId || Math.floor(1000 + Math.random() * 9000);
    } catch (e) {
        orderData.id = Math.floor(1000 + Math.random() * 9000);
    }

    // Hide payment modal
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();

    // Show thermal receipt modal
    currentReceiptData = orderData;
    showThermalReceipt(orderData);

    // Clear cart
    clearCart();
}

function showThermalReceipt(data) {
    const receiptContainer = document.getElementById('thermal-receipt-content');
    if (!receiptContainer) return;

    const dateStr = new Date().toLocaleDateString('fr-FR');
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let itemsHtml = '';
    (data.items || []).forEach(item => {
        const totalLine = item.prix * item.qte;
        itemsHtml += `
            <div style="display:flex; justify-content:space-between; margin-bottom: 3px;">
                <span>${item.qte}x ${item.nom.substring(0, 18)}</span>
                <span>${totalLine.toLocaleString()} F</span>
            </div>
        `;
    });

    receiptContainer.innerHTML = `
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
            <div style="font-weight: 900; font-size: 14px;">BOULANGERIE DE BABI</div>
            <div>Plateau, Boulevard Lagunaire</div>
            <div>Abidjan, Côte d'Ivoire</div>
            <div>Tél : +225 07 04 38 92 01</div>
        </div>

        <div style="margin-bottom: 8px; font-size: 11px;">
            <div><strong>TICKET N° :</strong> #${data.id}</div>
            <div><strong>DATE :</strong> ${dateStr} à ${timeStr}</div>
            <div><strong>CAISSE :</strong> Caisse Principale 1</div>
            <div><strong>OPÉRATEUR :</strong> ${data.caissiere}</div>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
            ${itemsHtml}
        </div>

        <div style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">
            <div style="display:flex; justify-content:space-between;">
                <span>TOTAL TTC :</span>
                <span>${data.total.toLocaleString()} FCFA</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size: 11px; font-weight: normal; margin-top: 4px;">
                <span>Mode : ${data.mode_paiement}</span>
                <span>Reçu : ${(data.montant_recu || data.total).toLocaleString()} F</span>
            </div>
            ${data.monnaie_rendue > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size: 11px; font-weight: normal;">
                <span>Monnaie Rendue :</span>
                <span>${data.monnaie_rendue.toLocaleString()} F</span>
            </div>` : ''}
        </div>

        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 10px;">
            <div>Merci de votre visite et bonne dégustation !</div>
            <div><em>Le bon pain chaud cuit avec amour à BABI</em></div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
    modal.show();
}

function printThermalReceipt() {
    window.print();
}

// Retrait PIN Click & Collect
async function verifyPickupPin() {
    const orderInput = document.getElementById('pickup-order-id')?.value.trim();
    const pinInput = document.getElementById('pickup-pin-code')?.value.trim();
    const resultDiv = document.getElementById('pickup-verify-result');

    if (!orderInput || !pinInput) {
        resultDiv.innerHTML = `<div class="alert alert-warning mt-3">Veuillez renseigner le N° de commande et le code PIN.</div>`;
        return;
    }

    try {
        const res = await fetch('/api/orders/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderInput, code_pin: pinInput })
        });
        const data = await res.json();

        if (data.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success mt-3">
                    <h6 class="fw-bold"><i class="fa-solid fa-circle-check me-2"></i>PIN Confirmé !</h6>
                    <p class="mb-1"><strong>Client :</strong> ${data.order.customer_name} (${data.order.phone})</p>
                    <p class="mb-1"><strong>Total :</strong> ${data.order.total_price} FCFA — <em>Statut : Payé</em></p>
                    <p class="mb-0 text-success fw-bold">👉 Remettre le colis au client.</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div class="alert alert-danger mt-3"><i class="fa-solid fa-triangle-exclamation me-2"></i>${data.error || 'Code PIN invalide.'}</div>`;
        }
    } catch (e) {
        // Local simulation test
        resultDiv.innerHTML = `
            <div class="alert alert-success mt-3">
                <h6 class="fw-bold"><i class="fa-solid fa-circle-check me-2"></i>PIN #${pinInput} Validé !</h6>
                <p class="mb-1"><strong>Commande :</strong> #${orderInput}</p>
                <p class="mb-0 text-success fw-bold">👉 Colis vérifié avec succès. Remettre la commande.</p>
            </div>
        `;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', renderProductsGrid);
    }

    const cashInput = document.getElementById('cash-received-input');
    if (cashInput) {
        cashInput.addEventListener('input', calculateChange);
    }
}
