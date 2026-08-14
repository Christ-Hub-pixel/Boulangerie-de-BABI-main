// Fetch and render products dynamically with real photos & dynamic pagination everywhere across the site

const realProductImages = {
    "Chill": "assets/chill.png",
    "Youyou": "assets/youzou.png",
    "Word Cola": "assets/world cola.png",
    "Youki Orange": "assets/youki moka cafe.png",
    "Youki Pomme": "assets/youki pomme.png",
    "Énergie Malt": "assets/energie malt .png",
    "Energie Malt": "assets/energie malt .png",
    "Orangina": "assets/Orangina.png",
    "Sprite": "assets/sprite.png",
    "Jus Naturel (Petit)": "assets/Jus Naturel (Petit).png",
    "Jus Naturel (Moyen)": "assets/Jus Naturel (Moyen).png",
    "Jus Naturel (Grand)": "assets/Jus Naturel (Grand).png",
    "Eau Minérale (Petite)": "assets/bouteille celeste.png",
    "Eau Minérale (Grande)": "assets/bouteille celeste.png",
    "Dégué": "assets/jus de bissap.png",
    "Passion (Grand Format)": "assets/jus de passion.png",
    "Passion (Petite Bouteille)": "assets/jus de passion.png",
    "Baobab": "assets/jus de baobab.png",
    "Baobab (Petit)": "assets/jus de baobab petit.png",
    "Bissap": "assets/jus de bissap.png",
    "Gingembre": "assets/jus de gingembre.png",
    "Tamarin": "assets/jus de tamari.png",
    "Cocktail": "assets/cocktail.png",
    "Citron": "assets/jus de citron.png",
    "Chocolat Chaud": "assets/Chocolat Chaud.png",
    "Baguette 150": "assets/baguette 150.png",
    "Baguette 200": "assets/baguette 200.png",
    "Ficelle": "assets/baguette 150.png",
    "Pain Complet (Grand)": "assets/Pain Complet (Grand).png",
    "Pain Complet (Petit)": "assets/pain complet 2.png",
    "Pain Sans Sel": "assets/pain sans sel.png",
    "Petit Pain (50F)": "assets/pain individuel.png",
    "Petit Pain (100F)": "assets/pain individuel.png",
    "Biscotte": "assets/biscottes.png",
    "Charaphe au Raisin": "assets/charaphe au raisin.png",
    "Chausson aux Pommes": "assets/chausson aux pommes.png",
    "Choco Suisse": "assets/choco suisse.png",
    "Cookies (l'unité)": "assets/cookies.png",
    "Lot de Cookies": "assets/cookies.png",
    "Croissant": "assets/Croissant.png",
    "Flan": "assets/Flan.png",
    "Pain au Chocolat": "assets/pain au chocolat.png",
    "Pain aux Raisins": "assets/pain au raisin.png",
    "Palmiers": "assets/palmier.png",
    "Torsade": "assets/torsade.png",
    "Madeleine": "assets/madeleine unite.png",
    "Madeleines (l'unité)": "assets/madeleine unite.png",
    "Lot de Madeleines": "assets/lots de madeleine.png",
    "Gâteau (10 000F)": "assets/Gateau1.png",
    "Gâteau (15 000F)": "assets/Gateau1.1.png",
    "Gâteau (20 000F)": "assets/Gateau1.2.png",
    "Gâteau (25 000F)": "assets/gateau2.png",
    "Gâteau de Mariage": "assets/gateau de mariiage.png",
    "Bûche de Noël (7000F)": "assets/buche de noel.png",
    "Bûche de Noël (5000F)": "assets/buche de noel.png",
    "Moka": "assets/moka1.png",
    "Cup Cake": "assets/moka1.1.png",
    "Cake (300F)": "assets/cake.png",
    "Cake (700F)": "assets/cake1.png",
    "Crêpe au Nutella": "assets/crepe au nutella.png",
    "Crêpe à la Vanille": "assets/crepe a la vanille.png",
    "Crêpe Suzette": "assets/Crêpe Suzette.png",
    "Fondant au Chocolat": "assets/Fondant au Chocolat.png",
    "Glace": "assets/glace.png",
    "Pain Cabré": "assets/cabre.png",
    "Pain Marbré": "assets/marbre.png",
    "Pain de Mie": "assets/pain de mie.png"
};

const catIcons = {
    'pain': '🥖',
    'viennoiserie': '🥐',
    'patisserie': '🍰',
    'cafe': '☕',
    'jus': '🥤',
    'glace': '🍨',
    'boisson': '🥤'
};

const FALLBACK_PRODUCTS = [
    // === BOISSONS ===
    { id: 1, nom: "Chill", prix: 700, categorie: "boisson" },
    { id: 2, nom: "Youyou", prix: 500, categorie: "boisson" },
    { id: 3, nom: "Word Cola", prix: 500, categorie: "boisson" },
    { id: 4, nom: "Youki Orange", prix: 500, categorie: "boisson" },
    { id: 5, nom: "Youki Pomme", prix: 500, categorie: "boisson" },
    { id: 6, nom: "Jus Naturel (Petit)", prix: 300, categorie: "jus" },
    { id: 7, nom: "Jus Naturel (Moyen)", prix: 500, categorie: "jus" },
    { id: 8, nom: "Jus Naturel (Grand)", prix: 2000, categorie: "jus" },
    { id: 9, nom: "Orangina", prix: 500, categorie: "boisson" },
    { id: 10, nom: "Sprite", prix: 500, categorie: "boisson" },
    { id: 11, nom: "Énergie Malt", prix: 700, categorie: "boisson" },
    { id: 12, nom: "Eau Minérale (Petite)", prix: 200, categorie: "boisson" },
    { id: 13, nom: "Eau Minérale (Grande)", prix: 1000, categorie: "boisson" },
    { id: 14, nom: "Dégué", prix: 500, categorie: "boisson" },
    { id: 15, nom: "Lait", prix: 500, categorie: "boisson" },
    { id: 16, nom: "Passion (Grand Format)", prix: 3000, categorie: "jus" },
    { id: 17, nom: "Passion (Petite Bouteille)", prix: 700, categorie: "jus" },
    { id: 18, nom: "Baobab", prix: 500, categorie: "jus" },
    { id: 86, nom: "Baobab (Petit)", prix: 300, categorie: "jus" },
    { id: 19, nom: "Bissap", prix: 2000, categorie: "jus" },
    { id: 20, nom: "Gingembre", prix: 3000, categorie: "jus" },
    { id: 21, nom: "Tamarin", prix: 2000, categorie: "jus" },
    { id: 22, nom: "Cocktail", prix: 3000, categorie: "jus" },
    { id: 23, nom: "Citron", prix: 2000, categorie: "jus" },
    { id: 24, nom: "Chocolat Chaud", prix: 3000, categorie: "cafe" },

    // === BOULANGERIE ===
    { id: 25, nom: "Baguette 150", prix: 150, categorie: "pain" },
    { id: 26, nom: "Baguette 200", prix: 200, categorie: "pain" },
    { id: 27, nom: "Ficelle", prix: 500, categorie: "pain" },
    { id: 28, nom: "Pain Complet (Grand)", prix: 1000, categorie: "pain" },
    { id: 29, nom: "Pain Complet (Petit)", prix: 500, categorie: "pain" },
    { id: 30, nom: "Pain Sans Sel", prix: 150, categorie: "pain" },
    { id: 32, nom: "Petit Pain (50F)", prix: 50, categorie: "pain" },
    { id: 33, nom: "Petit Pain (100F)", prix: 100, categorie: "pain" },

    // === VIENNOISERIES ===
    { id: 38, nom: "Biscotte", prix: 1000, categorie: "viennoiserie" },
    { id: 39, nom: "Charaphe au Raisin", prix: 700, categorie: "viennoiserie" },
    { id: 40, nom: "Chausson aux Pommes", prix: 1000, categorie: "viennoiserie" },
    { id: 41, nom: "Choco Suisse", prix: 800, categorie: "viennoiserie" },
    { id: 42, nom: "Cookies (l'unité)", prix: 200, categorie: "viennoiserie" },
    { id: 43, nom: "Croissant", prix: 500, categorie: "viennoiserie" },
    { id: 44, nom: "Escargots", prix: 700, categorie: "viennoiserie" },
    { id: 45, nom: "Flan", prix: 1000, categorie: "patisserie" },
    { id: 47, nom: "Lot de Cookies", prix: 1000, categorie: "viennoiserie" },
    { id: 48, nom: "Pain au Chocolat", prix: 500, categorie: "viennoiserie" },
    { id: 49, nom: "Pain au Lait", prix: 200, categorie: "viennoiserie" },
    { id: 50, nom: "Pain aux Raisins", prix: 700, categorie: "viennoiserie" },
    { id: 51, nom: "Pain Évêque", prix: 800, categorie: "viennoiserie" },
    { id: 52, nom: "Pain Suisse", prix: 800, categorie: "viennoiserie" },
    { id: 53, nom: "Palmiers", prix: 200, categorie: "viennoiserie" },
    { id: 54, nom: "Star Suisse", prix: 800, categorie: "viennoiserie" },
    { id: 55, nom: "Torsade", prix: 800, categorie: "viennoiserie" },
    { id: 57, nom: "Madeleines (l'unité)", prix: 100, categorie: "viennoiserie" },

    // === GATEAU & CAKE ===
    { id: 58, nom: "Gâteau (10 000F)", prix: 10000, categorie: "patisserie" },
    { id: 59, nom: "Gâteau (15 000F)", prix: 15000, categorie: "patisserie" },
    { id: 60, nom: "Gâteau (20 000F)", prix: 20000, categorie: "patisserie" },
    { id: 61, nom: "Gâteau (25 000F)", prix: 25000, categorie: "patisserie" },
    { id: 62, nom: "Bûche de Noël (7000F)", prix: 7000, categorie: "patisserie" },
    { id: 63, nom: "Bûche de Noël (5000F)", prix: 5000, categorie: "patisserie" },
    { id: 64, nom: "Moka", prix: 1500, categorie: "patisserie" },
    { id: 65, nom: "Lot de Madeleines", prix: 500, categorie: "viennoiserie" },
    { id: 66, nom: "Madeleine", prix: 100, categorie: "viennoiserie" },
    { id: 67, nom: "Cup Cake", prix: 500, categorie: "patisserie" },
    { id: 68, nom: "Cake (300F)", prix: 300, categorie: "patisserie" },
    { id: 69, nom: "Cake (700F)", prix: 700, categorie: "patisserie" },

    // === DESSERT ===
    { id: 70, nom: "Crêpe au Nutella", prix: 2000, categorie: "patisserie" },
    { id: 71, nom: "Crêpe à la Vanille", prix: 1500, categorie: "patisserie" },
    { id: 72, nom: "Crêpe Suzette", prix: 1500, categorie: "patisserie" },
    { id: 73, nom: "Fondant au Chocolat", prix: 1000, categorie: "patisserie" },
    { id: 74, nom: "Glace", prix: 1000, categorie: "glace" },

    // === PAINS SPECIAUX ===
    { id: 75, nom: "Pain Cabré", prix: 700, categorie: "pain" },
    { id: 76, nom: "Pain Breton", prix: 700, categorie: "pain" },
    { id: 77, nom: "Pain Délice", prix: 700, categorie: "pain" },
    { id: 78, nom: "Pain Marbré", prix: 500, categorie: "pain" },
    { id: 79, nom: "Pain Amour", prix: 1000, categorie: "pain" },
    { id: 80, nom: "Pain Canadien", prix: 700, categorie: "pain" },
    { id: 81, nom: "Pain de Mie", prix: 2000, categorie: "pain" },
    { id: 82, nom: "Pain Parisien", prix: 300, categorie: "pain" },
    { id: 83, nom: "Pain Viennois (500F)", prix: 500, categorie: "pain" },
    { id: 84, nom: "Pain Viennois (700F)", prix: 700, categorie: "pain" },
    { id: 85, nom: "Suzette", prix: 300, categorie: "pain" }
];

let allProducts = [];
let currentFilteredList = [];
let currentPage = 1;
const itemsPerPage = 12;

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.ok) {
            allProducts = await response.json();
        } else {
            throw new Error("API status not ok");
        }
    } catch(err) {
        allProducts = FALLBACK_PRODUCTS;
    }
    
    // Sort all products alphabetically (A-Z) by name
    allProducts.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
    currentFilteredList = [...allProducts];
    
    // Automatically populate Homepage grid if present
    loadHomepageProducts();

    // Automatically populate Catalog grid if present
    const container = document.getElementById('product-grid');
    if(container) {
        const urlParams = new URLSearchParams(window.location.search);
        const cat = urlParams.get('cat');
        if (cat) {
            filterCat(cat);
        } else {
            renderProductsPage();
        }
    }
}

function loadHomepageProducts() {
    const recommendedContainer = document.getElementById('index-recommended-grid');
    if (!recommendedContainer) return;
    
    // Automatically pick top 10 products with real photos for the homepage
    const featured = allProducts.filter(p => realProductImages[p.nom] || (p.image && p.image !== 'null')).slice(0, 10);
    
    recommendedContainer.innerHTML = featured.map(p => {
        const imgSrc = realProductImages[p.nom] || p.image;
        const isFav = typeof isWishlisted === 'function' && isWishlisted(p.nom);
        return `
        <div class="col">
            <div class="card premium-product-card h-100 border-0 shadow-sm position-relative overflow-hidden" style="border-radius:12px;">
                <div class="position-relative overflow-hidden product-img-container" style="height:160px;background:#ffffff;">
                    <img loading="lazy" src="${imgSrc}" class="card-img-top product-img" alt="${p.nom}" 
                        style="height:160px;width:100%;object-fit:cover;transition:transform 0.4s ease;">
                    <button class="wishlist-btn position-absolute top-0 end-0 m-2 btn btn-sm bg-white rounded-circle shadow-sm border-0 ${isFav ? 'text-danger' : 'text-muted'}"
                        title="Ajouter aux favoris" style="width:32px;height:32px;padding:0;" onclick="toggleWishlist('${p.nom.replace(/'/g, "\\'")}')">
                        <i class="${isFav ? 'fa-solid text-danger' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <span class="badge position-absolute top-0 start-0 m-2" style="background:rgba(43,22,12,0.85);font-size:0.65rem;">${getCatLabel(p.categorie)}</span>
                </div>
                <div class="card-body p-2 d-flex flex-column">
                    <h6 class="card-title fw-semibold mb-1" style="font-size:0.85rem;color:#2b160c;">${p.nom}</h6>
                    <div class="d-flex align-items-center gap-1 mb-2">
                        <span class="text-warning" style="font-size:0.65rem;">★★★★<span class="text-muted">★</span></span>
                        <span class="text-muted" style="font-size:0.7rem;">(${Math.floor(Math.random()*150)+20})</span>
                    </div>
                    <div class="d-flex align-items-baseline gap-2 mb-2">
                        <span class="fw-bold text-dark" style="font-size:1rem;">${(p.prix || 0).toLocaleString()} <small>FCFA</small></span>
                    </div>
                    <button class="btn btn-primary btn-sm w-100 fw-bold text-dark mt-auto add-to-cart-btn"
                        style="font-size:0.78rem;" onclick="addToCart('${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${imgSrc || ''}')">
                        <i class="fa-solid fa-cart-plus me-1"></i>AJOUTER
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function renderProductsPage() {
    const totalPages = Math.ceil(currentFilteredList.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = currentFilteredList.slice(startIndex, endIndex);

    renderProducts(pageProducts);
    renderPagination(totalPages);

    const countEl = document.querySelector('.products-count');
    if (countEl) {
        countEl.innerText = `(${currentFilteredList.length} produits - Page ${currentPage}/${totalPages})`;
    }
}

function renderProducts(productsList) {
    const container = document.getElementById('product-grid');
    if(!container) return;
    
    if(productsList.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5">
            <i class="fa-solid fa-search text-muted" style="font-size:3rem;"></i>
            <p class="text-muted mt-3">Aucun produit trouvé dans cette catégorie.</p>
        </div>`;
        return;
    }
    
    container.innerHTML = productsList.map(p => {
        const imgSrc = realProductImages[p.nom] || (p.image && p.image !== 'null' ? p.image : null);
        const hasRealImage = !!imgSrc;
        const isFav = typeof isWishlisted === 'function' && isWishlisted(p.nom);
        
        if (hasRealImage) {
            return `
            <div class="col product-card-wrapper" data-category="${p.categorie}" data-name="${(p.nom || '').toLowerCase()}">
                <div class="card premium-product-card h-100 border-0 shadow-sm position-relative overflow-hidden" style="border-radius:12px;">
                    <div class="position-relative overflow-hidden product-img-container" style="height:160px;background:#ffffff;">
                        <img loading="lazy" src="${imgSrc}" class="card-img-top product-img" alt="${p.nom}" 
                            style="height:160px;width:100%;object-fit:cover;transition:transform 0.4s ease;"
                            onerror="handleImgError(this, '${p.categorie}')">
                        <button class="wishlist-btn position-absolute top-0 end-0 m-2 btn btn-sm bg-white rounded-circle shadow-sm border-0 ${isFav ? 'text-danger' : 'text-muted'}"
                            title="Ajouter aux favoris" style="width:32px;height:32px;padding:0;" onclick="toggleWishlist('${p.nom.replace(/'/g, "\\'")}')">
                            <i class="${isFav ? 'fa-solid text-danger' : 'fa-regular'} fa-heart"></i>
                        </button>
                        <span class="badge position-absolute top-0 start-0 m-2" style="background:rgba(43,22,12,0.85);font-size:0.65rem;">${getCatLabel(p.categorie)}</span>
                    </div>
                    <div class="card-body p-2 d-flex flex-column">
                        <h6 class="card-title fw-semibold mb-1" style="font-size:0.85rem;color:#2b160c;">${p.nom}</h6>
                        <div class="d-flex align-items-center gap-1 mb-2">
                            <span class="text-warning" style="font-size:0.65rem;">★★★★<span class="text-muted">★</span></span>
                            <span class="text-muted" style="font-size:0.7rem;">(${Math.floor(Math.random()*150)+20})</span>
                        </div>
                        <div class="d-flex align-items-baseline gap-2 mb-2">
                            <span class="fw-bold text-dark" style="font-size:1rem;">${(p.prix || 0).toLocaleString()} <small>FCFA</small></span>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 fw-bold text-dark mt-auto add-to-cart-btn"
                            style="font-size:0.78rem;" onclick="addToCart('${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${imgSrc || ''}')">
                            <i class="fa-solid fa-cart-plus me-1"></i>AJOUTER
                        </button>
                    </div>
                </div>
            </div>
            `;
        } else {
            // Elegant compact menu card with warm cream gradient & subtle watermark icon
            return `
            <div class="col product-card-wrapper" data-category="${p.categorie}" data-name="${(p.nom || '').toLowerCase()}">
                <div class="card premium-product-card h-100 border-0 shadow-sm position-relative overflow-hidden" 
                    style="border-radius:12px; background: linear-gradient(145deg, #ffffff 0%, #fcf8f2 100%); border: 1px solid #f3ece0 !important;">
                    <div class="card-body p-3 d-flex flex-column position-relative" style="z-index: 1;">
                        <span class="position-absolute" style="right:12px; bottom:60px; font-size:4rem; opacity:0.06; pointer-events:none; user-select:none;">${catIcons[p.categorie] || '🥖'}</span>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge" style="background:#2b160c;color:#ffffff;font-size:0.65rem;">${getCatLabel(p.categorie)}</span>
                            <button class="wishlist-btn btn btn-sm p-0 border-0 text-danger" title="Ajouter aux favoris">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                        <h6 class="card-title fw-bold mb-1" style="font-size:0.92rem;color:#2b160c;">${p.nom}</h6>
                        <div class="d-flex align-items-center gap-1 mb-2">
                            <span class="text-warning" style="font-size:0.65rem;">★★★★<span class="text-muted">★</span></span>
                            <span class="text-muted" style="font-size:0.7rem;">(${Math.floor(Math.random()*150)+20})</span>
                        </div>
                        <div class="d-flex align-items-baseline gap-2 mb-3">
                            <span class="fw-bold text-dark" style="font-size:1.1rem;">${(p.prix || 0).toLocaleString()} <small>FCFA</small></span>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 fw-bold text-dark mt-auto add-to-cart-btn"
                            style="font-size:0.78rem;" onclick="addToCart('${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '')">
                            <i class="fa-solid fa-cart-plus me-1"></i>AJOUTER
                        </button>
                    </div>
                </div>
            </div>
            `;
        }
    }).join('');
}

function renderPagination(totalPages) {
    const navUl = document.getElementById('pagination-container');
    if (!navUl) return;

    if (totalPages <= 1) {
        navUl.innerHTML = '';
        return;
    }

    let html = '';

    // Previous Button
    const isPrevDisabled = currentPage === 1;
    html += `
        <li class="page-item ${isPrevDisabled ? 'disabled' : ''}">
            <button class="page-link shadow-sm border-0 rounded-circle d-flex align-items-center justify-content-center" 
                style="width:38px;height:38px;background:${isPrevDisabled ? '#f1f5f9' : '#ffffff'};color:${isPrevDisabled ? '#cbd5e1' : '#2b160c'};cursor:${isPrevDisabled ? 'not-allowed' : 'pointer'};"
                onclick="changePage(${currentPage - 1})" ${isPrevDisabled ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left" style="font-size:0.8rem;"></i>
            </button>
        </li>
    `;

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        html += `
            <li class="page-item">
                <button class="page-link shadow-sm border-0 rounded-circle fw-bold d-flex align-items-center justify-content-center" 
                    style="width:38px;height:38px;background:${isActive ? '#ffc107' : '#ffffff'};color:${isActive ? '#2b160c' : '#475569'};border: ${isActive ? '2px solid #2b160c' : 'none'};transition:all 0.2s;"
                    onclick="changePage(${i})">
                    ${i}
                </button>
            </li>
        `;
    }

    // Next Button
    const isNextDisabled = currentPage === totalPages;
    html += `
        <li class="page-item ${isNextDisabled ? 'disabled' : ''}">
            <button class="page-link shadow-sm border-0 rounded-circle d-flex align-items-center justify-content-center" 
                style="width:38px;height:38px;background:${isNextDisabled ? '#f1f5f9' : '#ffffff'};color:${isNextDisabled ? '#cbd5e1' : '#2b160c'};cursor:${isNextDisabled ? 'not-allowed' : 'pointer'};"
                onclick="changePage(${currentPage + 1})" ${isNextDisabled ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right" style="font-size:0.8rem;"></i>
            </button>
        </li>
    `;

    navUl.innerHTML = html;
}

window.changePage = function(page) {
    currentPage = page;
    renderProductsPage();
    const grid = document.getElementById('product-grid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.handleImgError = function(img, cat) {
    const card = img.closest('.premium-product-card');
    if (card) {
        const container = card.querySelector('.product-img-container');
        if (container) {
            container.remove();
        }
    }
}

function getCatLabel(cat) {
    const labels = {
        'pain': '🥖 Pain',
        'viennoiserie': '🥐 Viennoiserie',
        'patisserie': '🍰 Pâtisserie',
        'cafe': '☕ Café',
        'jus': '🥤 Jus',
        'glace': '🍨 Glace',
        'boisson': '🥤 Boisson'
    };
    return labels[cat] || cat;
}

// Category filter function
window.filterCat = function(term) {
    document.querySelectorAll('input[name="catFilter"]').forEach(r => {
        r.checked = (r.value === term);
    });

    if (term === '') {
        currentFilteredList = [...allProducts];
    } else {
        currentFilteredList = allProducts.filter(p => p.categorie.toLowerCase() === term.toLowerCase());
    }
    
    currentFilteredList.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
    currentPage = 1;
    renderProductsPage();
}

window.sortProducts = function(sortType) {
    if (sortType === 'Prix croissant') {
        currentFilteredList.sort((a, b) => a.prix - b.prix);
    } else if (sortType === 'Prix décroissant') {
        currentFilteredList.sort((a, b) => b.prix - a.prix);
    } else if (sortType === 'Nouveautés') {
        currentFilteredList.sort((a, b) => b.id - a.id);
    } else {
        currentFilteredList.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
    }
    currentPage = 1;
    renderProductsPage();
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
