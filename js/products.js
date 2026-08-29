// ================================================================
// BOULANGERIE DE BABI — GESTIONNAIRE DYNAMIQUE DU CATALOGUE CLIENT
// ================================================================

const catIcons = {
    'pain': '🥖',
    'pains_speciaux': '🌾',
    'pain_special': '🌾',
    'viennoiserie': '🥐',
    'patisserie': '🍰',
    'cafe': '☕',
    'jus': '🥤',
    'glace': '🍨',
    'boisson': '🧃',
    'autre': '🥖'
};

const FALLBACK_PRODUCTS = [];

let allProducts = (typeof window !== 'undefined' && typeof window.babiGetCachedProducts === 'function')
    ? window.babiGetCachedProducts()
    : [];

allProducts.sort((a, b) => (a.nom || a.name || '').localeCompare(b.nom || b.name || '', 'fr', { sensitivity: 'base' }));
let currentFilteredList = [...allProducts];
let currentPage = 1;
const itemsPerPage = 12;

// ⚡ Rendu immédiat 0ms synchrone (dès l'évaluation du script si le DOM est prêt)
if (typeof document !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        try { loadHomepageProducts(); } catch (_) { }
    }
}

async function loadProducts() {
    // 1. Rendu instantané 0ms depuis le catalogue en mémoire/cache
    if (!allProducts || allProducts.length === 0) {
        allProducts = (typeof window.babiGetCachedProducts === 'function')
            ? window.babiGetCachedProducts()
            : FALLBACK_PRODUCTS.filter(p => p.is_active !== 0 && p.is_active !== '0');
    }
    allProducts.sort((a, b) => (a.nom || a.name || '').localeCompare(b.nom || b.name || '', 'fr', { sensitivity: 'base' }));
    currentFilteredList = [...allProducts];

    // Rendu immédiat sans attendre le réseau
    loadHomepageProducts();
    const container = document.getElementById('product-grid');
    if (container) {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const cat = urlParams.get('cat');
        if (searchQuery) {
            searchProducts(searchQuery);
        } else if (cat) {
            filterCat(cat);
        } else {
            renderProductsPage();
        }
    }

    // 2. Synchronisation transparente en arrière-plan avec l'API Cloud (timeout 2s)
    try {
        const apiBase = window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000');
        const apiUrl = `${apiBase}/api/products?_t=${Date.now()}`;
        const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
        const response = await fetcher(apiUrl, { cache: 'no-store' }, 2000);
        if (response && response.ok) {
            const rawProducts = await response.json();
            const valid = (Array.isArray(rawProducts) ? rawProducts : (rawProducts.products || []))
                .filter(p => p.is_active !== 0 && p.is_active !== '0' && p.is_active !== false)
                .map(p => ({
                    id: p.id,
                    nom: p.nom || p.name,
                    prix: Number(p.prix || p.price || 0),
                    categorie: p.categorie || p.category || 'pain',
                    image: p.image || p.image_url || 'assets/product_baguette.png',
                    stock: p.stock != null ? Number(p.stock) : 40,
                    seuil_alerte: p.seuil_alerte != null ? Number(p.seuil_alerte) : 10,
                    is_active: 1
                }));
            if (valid.length > 0) {
                // Merge with local products
                const mergedMap = new Map();
                valid.forEach(p => mergedMap.set(String(p.id), p));
                allProducts.forEach(p => {
                    if (!mergedMap.has(String(p.id))) mergedMap.set(String(p.id), p);
                });
                allProducts = Array.from(mergedMap.values());
                if (typeof window.babiSetCachedProducts === 'function') {
                    window.babiSetCachedProducts(allProducts);
                }
                allProducts.sort((a, b) => (a.nom || a.name || '').localeCompare(b.nom || b.name || '', 'fr', { sensitivity: 'base' }));
                currentFilteredList = [...allProducts];
                loadHomepageProducts();
                if (container) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const searchQuery = urlParams.get('search');
                    const cat = urlParams.get('cat');
                    if (searchQuery) searchProducts(searchQuery);
                    else if (cat) filterCat(cat);
                    else renderProductsPage();
                }
            }
        }
    } catch (err) {
        // En cas de lenteur réseau ou serveur hors ligne, la vitrine fonctionne parfaitement à 100%
    }
}

function loadHomepageProducts() {
    const recommendedContainer = document.getElementById('index-recommended-grid');
    const delicesContainer = document.getElementById('index-delices-grid');

    // Pick active products for the homepage
    const featured = allProducts.filter(p => p.is_active !== 0 && p.is_active !== '0');

    const buildCardHtml = (p) => {
        const imgSrc = (p.image && p.image !== 'null' && p.image !== 'undefined' && p.image.trim() !== '') ? p.image : (realProductImages[p.nom] || 'assets/product_baguette.png');
        const isFav = typeof isWishlisted === 'function' && isWishlisted(p.nom);
        return `
        <div class="col">
            <div class="card premium-product-card h-100 border-0 shadow-sm position-relative overflow-hidden" style="border-radius:12px;">
                <div class="position-relative overflow-hidden product-img-container" style="background:#ffffff;">
                    <img loading="lazy" src="${imgSrc}" class="card-img-top product-img" alt="${p.nom}" 
                        style="width:100%;object-fit:contain;transition:transform 0.4s ease;"
                        onerror="this.src='assets/product_baguette.png'">
                    <button class="wishlist-btn position-absolute top-0 end-0 m-2 btn btn-sm bg-white rounded-circle shadow-sm border-0 ${isFav ? 'text-danger' : 'text-muted'}"
                        title="Ajouter aux favoris" style="width:32px;height:32px;padding:0;" onclick="toggleWishlist('${p.nom.replace(/'/g, "\\'")}')">
                        <i class="${isFav ? 'fa-solid text-danger' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <span class="badge position-absolute top-0 start-0 m-2" style="background:rgba(43,22,12,0.85);font-size:0.65rem;">${getCatLabel(p.categorie)}</span>
                </div>
                <div class="card-body p-2 p-md-3 d-flex flex-column">
                    <h6 class="card-title fw-semibold mb-1" style="color:#2b160c;">${p.nom}</h6>
                    <div class="d-flex align-items-center gap-1 mb-2">
                        <span class="text-warning" style="font-size:0.68rem;">★★★★<span class="text-muted">★</span></span>
                        <span class="text-muted" style="font-size:0.7rem;">(${Math.floor(Math.random() * 150) + 20})</span>
                    </div>
                    <div class="d-flex align-items-baseline gap-2 mb-2">
                        <span class="fw-bold text-dark product-price">${(p.prix || 0).toLocaleString()} <small>FCFA</small></span>
                    </div>
                    <button class="btn btn-primary btn-sm w-100 fw-bold text-dark mt-auto add-to-cart-btn"
                        onclick="addToCart('${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${imgSrc || ''}')">
                        <i class="fa-solid fa-cart-plus me-1"></i>AJOUTER
                    </button>
                </div>
            </div>
        </div>
        `;
    };

    if (recommendedContainer) {
        recommendedContainer.innerHTML = featured.slice(0, 10).map(buildCardHtml).join('');
    }

    if (delicesContainer) {
        delicesContainer.innerHTML = featured.slice(10, 20).map(buildCardHtml).join('');
    }
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
    if (!container) return;

    if (productsList.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5">
            <i class="fa-solid fa-search text-muted" style="font-size:3rem;"></i>
            <p class="text-muted mt-3">Aucun produit trouvé dans cette catégorie.</p>
        </div>`;
        return;
    }

    container.innerHTML = productsList.map(p => {
        const imgSrc = p.image || 'assets/product_baguette.png';
        const isFav = typeof isWishlisted === 'function' && isWishlisted(p.nom);

        return `
        <div class="col product-card-wrapper" data-category="${p.categorie}" data-name="${(p.nom || '').toLowerCase()}">
            <div class="card premium-product-card h-100 border-0 shadow-sm position-relative overflow-hidden" 
                style="border-radius:12px; background: linear-gradient(145deg, #ffffff 0%, #fcf8f2 100%); border: 1px solid #f3ece0 !important;">
                <div class="card-body p-3 d-flex flex-column position-relative" style="z-index: 1;">
                    <span class="position-absolute" style="right:12px; bottom:60px; font-size:4rem; opacity:0.06; pointer-events:none; user-select:none;">${catIcons[p.categorie] || '🥖'}</span>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge" style="background:#2b160c;color:#ffffff;font-size:0.65rem;">${getCatLabel(p.categorie)}</span>
                        <button class="wishlist-btn btn btn-sm p-0 border-0 ${isFav ? 'text-danger' : 'text-muted'}" title="Ajouter aux favoris" onclick="toggleWishlist('${p.nom.replace(/'/g, "\\'")}')">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    </div>
                    <h6 class="card-title fw-bold mb-1" style="font-size:0.92rem;color:#2b160c;">${p.nom}</h6>
                    <div class="d-flex align-items-center gap-1 mb-2">
                        <span class="text-warning" style="font-size:0.65rem;">★★★★<span class="text-muted">★</span></span>
                        <span class="text-muted" style="font-size:0.7rem;">(${Math.floor(Math.random() * 150) + 20})</span>
                    </div>
                    <div class="d-flex align-items-baseline gap-2 mb-3">
                        <span class="fw-bold text-dark" style="font-size:1.1rem;">${(p.prix || 0).toLocaleString()} <small>FCFA</small></span>
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

window.changePage = function (page) {
    currentPage = page;
    renderProductsPage();
    const grid = document.getElementById('product-grid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.handleImgError = function (img, cat) {
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
        'pain': '🥖 Pain & Tradition',
        'pains_speciaux': '🌾 Pain Spécial',
        'pain_special': '🌾 Pain Spécial',
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
window.filterCat = function (term) {
    document.querySelectorAll('input[name="catFilter"]').forEach(r => {
        r.checked = (r.value === term);
    });

    if (term === '') {
        currentFilteredList = [...allProducts];
    } else if (term === 'pains_speciaux' || term === 'pain_special') {
        currentFilteredList = allProducts.filter(p => {
            const c = (p.categorie || '').toLowerCase();
            return c === 'pains_speciaux' || c === 'pain_special' || c.includes('special') || c.includes('speciaux');
        });
    } else if (term === 'pain') {
        currentFilteredList = allProducts.filter(p => {
            const c = (p.categorie || '').toLowerCase();
            return (c === 'pain' || c.includes('baguette') || c.includes('tradition')) && !c.includes('special') && !c.includes('speciaux');
        });
    } else {
        currentFilteredList = allProducts.filter(p => (p.categorie || '').toLowerCase() === term.toLowerCase());
    }

    currentFilteredList.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
    currentPage = 1;
    renderProductsPage();
}

window.sortProducts = function (sortType) {
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

window.searchProducts = function (query) {
    if (!query || query.trim() === '') {
        currentFilteredList = [...allProducts];
        const headingEl = document.querySelector('.products-heading-title');
        if (headingEl) headingEl.innerText = 'Tous les Produits';
    } else {
        const q = query.toLowerCase().trim();
        currentFilteredList = allProducts.filter(p =>
            (p.nom && p.nom.toLowerCase().includes(q)) ||
            (p.categorie && p.categorie.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
        const headingEl = document.querySelector('.products-heading-title');
        if (headingEl) {
            headingEl.innerHTML = `Résultats pour "<span class="text-warning">${query}</span>" <button class="btn btn-sm btn-outline-secondary ms-2 py-0 px-2 rounded-pill" onclick="clearCatalogSearch()"><i class="fa-solid fa-xmark me-1"></i>Effacer</button>`;
        }
    }

    currentFilteredList.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
    currentPage = 1;
    renderProductsPage();
};

window.clearCatalogSearch = function () {
    const searchInputs = document.querySelectorAll('.babi-search-input, input[type="text"]');
    searchInputs.forEach(i => i.value = '');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('search');
    window.history.pushState({}, '', newUrl);
    searchProducts('');
};

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// 📡 Synchronisation temps réel du catalogue
window.addEventListener('babi:products:updated', (e) => {
    loadProducts();
});
