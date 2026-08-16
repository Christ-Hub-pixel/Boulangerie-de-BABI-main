/**
 * 🥖 Boulangerie de BABI — Module de Recherche Intelligente & Prédictive
 * - Autocomplétion temps réel avec photos et prix
 * - Suggestions populaires & historique des recherches
 * - Ajout au panier en 1 clic direct depuis la recherche
 * - Raccourci clavier (Ctrl+K ou /)
 * - Navigation au clavier (Flèches, Entrée, Échap)
 * - Support Desktop & Mobile
 */

(function () {
    'use strict';

    // Image mapping pour les photos réelles
    const searchImageMap = {
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
        "Pain au Lait Sucré": "assets/cabre.png",
        "Pain Cabré": "assets/cabre.png",
        "Pain Marbré": "assets/marbre.png",
        "Pain de Mie": "assets/pain de mie.png"
    };

    const categoryBadges = {
        'pain': { label: 'Pain', icon: '🥖', color: '#854d0e', bg: '#fef9c3' },
        'viennoiserie': { label: 'Viennoiserie', icon: '🥐', color: '#9a3412', bg: '#ffedd5' },
        'patisserie': { label: 'Pâtisserie', icon: '🍰', color: '#9f1239', bg: '#ffe4e6' },
        'cafe': { label: 'Café', icon: '☕', color: '#3e2723', bg: '#efebe9' },
        'jus': { label: 'Jus Naturel', icon: '🥤', color: '#166534', bg: '#dcfce7' },
        'glace': { label: 'Glace', icon: '🍨', color: '#1e40af', bg: '#dbeafe' },
        'boisson': { label: 'Boisson', icon: '🧃', color: '#075985', bg: '#e0f2fe' }
    };

    const popularQueries = [
        "Baguette",
        "Croissant",
        "Pain au Chocolat",
        "Gâteau Anniversaire",
        "Jus de Bissap",
        "Glace Artisanale",
        "Pain Complet",
        "Choco Suisse"
    ];

    let cachedProducts = [];

    // Récupération des produits
    async function getProducts() {
        if (cachedProducts.length > 0) return cachedProducts;
        if (window.allProducts && window.allProducts.length > 0) {
            cachedProducts = window.allProducts;
            return cachedProducts;
        }

        try {
            const resp = await fetch('data/products.json');
            if (resp.ok) {
                const data = await resp.json();
                cachedProducts = data.map(p => ({
                    id: p.id,
                    nom: p.name || p.nom,
                    prix: p.price || p.prix,
                    categorie: (p.category || p.categorie || 'pain').toLowerCase(),
                    description: p.description || '',
                    image: p.image || null
                }));
                return cachedProducts;
            }
        } catch (e) {
            console.warn('Search fallback to embedded products');
        }

        if (window.FALLBACK_PRODUCTS) {
            cachedProducts = window.FALLBACK_PRODUCTS;
            return cachedProducts;
        }

        return [];
    }

    // Gestion de l'historique dans LocalStorage
    function getRecentSearches() {
        try {
            return JSON.parse(localStorage.getItem('babi_recent_searches') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveRecentSearch(term) {
        if (!term || term.trim().length < 2) return;
        term = term.trim();
        let history = getRecentSearches().filter(t => t.toLowerCase() !== term.toLowerCase());
        history.unshift(term);
        if (history.length > 6) history = history.slice(0, 6);
        try {
            localStorage.setItem('babi_recent_searches', JSON.stringify(history));
        } catch (e) { }
    }

    function removeRecentSearch(term) {
        let history = getRecentSearches().filter(t => t.toLowerCase() !== term.toLowerCase());
        try {
            localStorage.setItem('babi_recent_searches', JSON.stringify(history));
        } catch (e) { }
    }

    function clearRecentSearches() {
        try {
            localStorage.removeItem('babi_recent_searches');
        } catch (e) { }
    }

    // Mise en surbrillance des termes trouvés
    function highlightMatch(text, query) {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark class="babi-search-highlight">$1</mark>');
    }

    // Initialisation d'une instance de recherche
    function initSearchInstance(container) {
        const input = container.querySelector('input[type="text"]');
        const submitBtn = container.querySelector('.btn-search, button');
        const clearBtn = container.querySelector('.search-clear-btn');
        const catSelect = container.querySelector('.search-cat-select');

        if (!input) return;

        // Créer ou récupérer le dropdown
        let dropdown = container.querySelector('.babi-search-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'babi-search-dropdown shadow-lg';
            container.appendChild(dropdown);
        }

        let debounceTimer = null;
        let selectedIndex = -1;

        // Afficher le dropdown
        async function showDropdown() {
            const query = input.value.trim();
            const products = await getProducts();

            if (clearBtn) {
                clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
            }

            if (query.length === 0) {
                renderEmptyState();
            } else {
                renderSearchResults(query, products);
            }

            dropdown.classList.add('show');
            selectedIndex = -1;
        }

        // Cacher le dropdown
        function hideDropdown() {
            dropdown.classList.remove('show');
            selectedIndex = -1;
        }

        // Rendu quand l'input est vide (Historique + Tendances + Rayons)
        function renderEmptyState() {
            const history = getRecentSearches();
            let html = '';

            // Historique des recherches récentes
            if (history.length > 0) {
                html += `
                <div class="babi-search-section">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="babi-search-section-title"><i class="fa-solid fa-clock-rotate-left me-1 text-warning"></i> Recherches récentes</span>
                        <button type="button" class="btn btn-link btn-sm p-0 text-muted babi-clear-history-btn" style="font-size:0.75rem; text-decoration:none;">Effacer</button>
                    </div>
                    <div class="d-flex flex-wrap gap-1 mb-3">
                        ${history.map(item => `
                            <span class="babi-search-tag babi-history-tag" data-search="${item}">
                                <i class="fa-solid fa-arrow-trend-up text-muted me-1" style="font-size:0.7rem;"></i>${item}
                                <i class="fa-solid fa-xmark ms-1 remove-tag" data-remove="${item}" title="Supprimer"></i>
                            </span>
                        `).join('')}
                    </div>
                </div>
                `;
            }

            // Tendances & Suggestions populaires
            html += `
            <div class="babi-search-section">
                <div class="babi-search-section-title mb-2"><i class="fa-solid fa-fire text-danger me-1"></i> Tendances à Abidjan</div>
                <div class="d-flex flex-wrap gap-1 mb-3">
                    ${popularQueries.map(q => `
                        <button type="button" class="babi-search-tag babi-popular-tag" data-search="${q}">
                            <i class="fa-solid fa-magnifying-glass text-warning me-1" style="font-size:0.7rem;"></i>${q}
                        </button>
                    `).join('')}
                </div>
            </div>
            `;

            // Accès direct aux rayons
            html += `
            <div class="babi-search-section border-top pt-2 mt-2">
                <div class="babi-search-section-title mb-2"><i class="fa-solid fa-layer-group text-warning me-1"></i> Rayons de la boulangerie</div>
                <div class="row g-2">
                    <div class="col-4">
                        <a href="produits.html?cat=pain" class="babi-cat-card text-decoration-none" title="Pains">
                            <span class="babi-cat-emoji">🥖</span>
                            <span class="babi-cat-label">Pains</span>
                        </a>
                    </div>
                    <div class="col-4">
                        <a href="produits.html?cat=viennoiserie" class="babi-cat-card text-decoration-none" title="Viennoiseries">
                            <span class="babi-cat-emoji">🥐</span>
                            <span class="babi-cat-label">Viennoiseries</span>
                        </a>
                    </div>
                    <div class="col-4">
                        <a href="produits.html?cat=patisserie" class="babi-cat-card text-decoration-none" title="Pâtisseries">
                            <span class="babi-cat-emoji">🍰</span>
                            <span class="babi-cat-label">Pâtisseries</span>
                        </a>
                    </div>
                    <div class="col-4">
                        <a href="produits.html?cat=jus" class="babi-cat-card text-decoration-none" title="Jus Frais">
                            <span class="babi-cat-emoji">🥤</span>
                            <span class="babi-cat-label">Jus Frais</span>
                        </a>
                    </div>
                    <div class="col-4">
                        <a href="produits.html?cat=glace" class="babi-cat-card text-decoration-none" title="Glaces">
                            <span class="babi-cat-emoji">🍨</span>
                            <span class="babi-cat-label">Glaces</span>
                        </a>
                    </div>
                    <div class="col-4">
                        <a href="produits.html?cat=boisson" class="babi-cat-card text-decoration-none" title="Boissons">
                            <span class="babi-cat-emoji">🧃</span>
                            <span class="babi-cat-label">Boissons</span>
                        </a>
                    </div>
                </div>
            </div>
            `;

            dropdown.innerHTML = html;
            attachDropdownEvents();
        }

        // Rendu des résultats en direct
        function renderSearchResults(query, products) {
            const cleanQuery = query.toLowerCase().trim();
            const selectedCat = catSelect ? catSelect.value.toLowerCase() : '';

            let matches = products.filter(p => {
                const nameMatch = p.nom && p.nom.toLowerCase().includes(cleanQuery);
                const catMatch = p.categorie && p.categorie.toLowerCase().includes(cleanQuery);
                const descMatch = p.description && p.description.toLowerCase().includes(cleanQuery);
                const passCatFilter = !selectedCat || (p.categorie && p.categorie.toLowerCase() === selectedCat);

                return (nameMatch || catMatch || descMatch) && passCatFilter;
            });

            if (matches.length === 0) {
                dropdown.innerHTML = `
                <div class="text-center py-4 px-3">
                    <div class="mb-2" style="font-size:2.5rem;">🥖🔍</div>
                    <h6 class="fw-bold mb-1" style="color:#2b160c;">Aucun produit trouvé</h6>
                    <p class="text-muted small mb-3">Aucun résultat pour "<strong>${escapeHtml(query)}</strong>". Essayez un autre mot comme <em>pain, croissant, moka, jus</em>...</p>
                    <a href="produits.html" class="btn btn-sm btn-outline-dark rounded-pill fw-semibold px-3">
                        <i class="fa-solid fa-store me-1"></i> Voir tout le catalogue
                    </a>
                </div>
                `;
                return;
            }

            const totalCount = matches.length;
            const displayed = matches.slice(0, 6);

            let html = `
            <div class="babi-search-results-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                <span class="text-muted fs-sm"><strong>${totalCount}</strong> résultat${totalCount > 1 ? 's' : ''} trouvé${totalCount > 1 ? 's' : ''}</span>
                <span class="badge bg-warning text-dark fw-bold" style="font-size:0.7rem;">Direct de la boulangerie</span>
            </div>
            <div class="babi-search-results-list">
            `;

            displayed.forEach((p, idx) => {
                const imgSrc = searchImageMap[p.nom] || (p.image && p.image !== 'null' ? p.image : 'assets/logo.png');
                const catInfo = categoryBadges[p.categorie] || { label: p.categorie, icon: '🥖', color: '#2b160c', bg: '#f1f5f9' };
                const formattedPrice = (p.prix || 0).toLocaleString();

                html += `
                <div class="babi-search-item d-flex align-items-center gap-3 p-2 border-bottom" data-index="${idx}" data-nom="${escapeHtml(p.nom)}" data-prix="${p.prix}" data-img="${imgSrc}">
                    <div class="babi-search-item-thumb position-relative rounded overflow-hidden flex-shrink-0" style="width:48px;height:48px;background:#f8fafc;">
                        <img src="${imgSrc}" alt="${escapeHtml(p.nom)}" class="w-100 h-100 object-fit-cover" onerror="this.src='assets/logo.png'">
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <div class="d-flex align-items-center gap-2">
                            <h6 class="mb-0 fw-semibold text-truncate" style="font-size:0.9rem; color:#2b160c;">
                                ${highlightMatch(escapeHtml(p.nom), query)}
                            </h6>
                            <span class="badge flex-shrink-0" style="background:${catInfo.bg}; color:${catInfo.color}; font-size:0.65rem; border: 1px solid ${catInfo.color}30;">
                                ${catInfo.icon} ${catInfo.label}
                            </span>
                        </div>
                        <div class="d-flex align-items-baseline gap-2 mt-1">
                            <span class="fw-bold text-dark" style="font-size:0.95rem;">${formattedPrice} <small class="text-muted fw-normal" style="font-size:0.75rem;">FCFA</small></span>
                            <span class="text-success small fw-medium" style="font-size:0.75rem;"><i class="fa-solid fa-circle-check me-1"></i>En stock</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                        <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark px-3 shadow-sm babi-quick-add-btn" 
                            title="Ajouter au panier"
                            onclick="event.stopPropagation(); window.quickAddToCart('${escapeQuotes(p.nom)}', ${p.prix}, '${imgSrc}')">
                            <i class="fa-solid fa-cart-plus me-1"></i> <span class="d-none d-sm-inline">Ajouter</span>
                        </button>
                    </div>
                </div>
                `;
            });

            html += `</div>`;

            // Footer avec lien complet
            html += `
            <a href="produits.html?search=${encodeURIComponent(query)}" class="babi-search-footer d-flex justify-content-between align-items-center p-3 text-decoration-none border-top">
                <span class="fw-semibold text-dark fs-sm">
                    <i class="fa-solid fa-arrow-right-long text-warning me-2"></i>Voir tous les <strong>${totalCount}</strong> résultats pour "<em>${escapeHtml(query)}</em>"
                </span>
                <span class="badge bg-dark text-white rounded-pill px-2 py-1" style="font-size:0.75rem;">Catalogue complet ➔</span>
            </a>
            `;

            dropdown.innerHTML = html;
            attachDropdownEvents();
        }

        // Attachement des événements au contenu du dropdown
        function attachDropdownEvents() {
            // Clic sur tag historique ou tendance
            dropdown.querySelectorAll('.babi-search-tag, .babi-popular-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove-tag')) {
                        e.stopPropagation();
                        const toRemove = e.target.getAttribute('data-remove');
                        removeRecentSearch(toRemove);
                        renderEmptyState();
                        return;
                    }
                    const searchTerm = tag.getAttribute('data-search');
                    input.value = searchTerm;
                    executeSearch(searchTerm);
                });
            });

            // Bouton effacer l'historique
            const clearHistoryBtn = dropdown.querySelector('.babi-clear-history-btn');
            if (clearHistoryBtn) {
                clearHistoryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    clearRecentSearches();
                    renderEmptyState();
                });
            }

            // Clic sur un élément de produit
            dropdown.querySelectorAll('.babi-search-item').forEach(item => {
                item.addEventListener('click', () => {
                    const nom = item.getAttribute('data-nom');
                    saveRecentSearch(nom);
                    window.location.href = `produits.html?search=${encodeURIComponent(nom)}`;
                });
            });
        }

        // Exécution de la recherche
        function executeSearch(query) {
            query = (query !== undefined ? query : input.value).trim();
            if (!query) return;

            saveRecentSearch(query);
            hideDropdown();

            // Si déjà sur la page produits.html, filtrer directement en temps réel
            if (window.location.pathname.includes('produits.html') && typeof window.searchProducts === 'function') {
                window.searchProducts(query);
                // Mettre à jour l'URL sans recharger la page
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('search', query);
                window.history.pushState({}, '', newUrl);
            } else {
                window.location.href = `produits.html?search=${encodeURIComponent(query)}`;
            }
        }

        // Gestion de la saisie
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                showDropdown();
            }, 120);
        });

        input.addEventListener('focus', () => {
            showDropdown();
        });

        // Bouton vider le champ
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                input.value = '';
                clearBtn.style.display = 'none';
                input.focus();
                showDropdown();

                if (window.location.pathname.includes('produits.html') && typeof window.searchProducts === 'function') {
                    window.searchProducts('');
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('search');
                    window.history.pushState({}, '', newUrl);
                }
            });
        }

        // Soumission
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                executeSearch();
            });
        }

        // Navigation au clavier
        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.babi-search-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length === 0) return;
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length === 0) return;
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelection(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                } else {
                    executeSearch();
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });

        function updateSelection(items) {
            items.forEach((it, idx) => {
                if (idx === selectedIndex) {
                    it.classList.add('active');
                    it.scrollIntoView({ block: 'nearest' });
                } else {
                    it.classList.remove('active');
                }
            });
        }

        // Fermer en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                hideDropdown();
            }
        });
    }

    // Échappement HTML sécurisé
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeQuotes(str) {
        if (!str) return '';
        return String(str).replace(/'/g, "\\'");
    }

    // Fonction globale pour ajout rapide avec notification
    window.quickAddToCart = function (name, price, image) {
        if (typeof window.addToCart === 'function') {
            window.addToCart(name, price, image);
        } else {
            // Fallback panier
            try {
                let cart = JSON.parse(localStorage.getItem('babi_cart_items') || '[]');
                const existing = cart.find(i => i.name === name);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push({ name, price, image, quantity: 1 });
                }
                localStorage.setItem('babi_cart_items', JSON.stringify(cart));
                if (typeof window.updateCartUI === 'function') window.updateCartUI();
            } catch (e) { }
        }

        // Toast de confirmation discret
        showSearchToast(`🥖 <strong>${escapeHtml(name)}</strong> ajouté au panier !`);
    };

    function showSearchToast(message) {
        let toast = document.getElementById('babi-search-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'babi-search-toast';
            toast.className = 'babi-search-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Raccourci global clavier Ctrl+K ou /
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const firstSearchInput = document.querySelector('.header-search-container input[type="text"]') || document.querySelector('input[type="text"]');
            if (firstSearchInput) {
                firstSearchInput.focus();
                firstSearchInput.select();
            }
        }
    });

    // Initialisation au chargement du DOM
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.header-search-container, .header-search-mobile, .babi-search-wrapper').forEach(container => {
            initSearchInstance(container);
        });

        // Traitement du paramètre URL ?search= sur la page produits.html
        if (window.location.pathname.includes('produits.html')) {
            const params = new URLSearchParams(window.location.search);
            const query = params.get('search');
            if (query) {
                const searchInputs = document.querySelectorAll('.header-search-container input, .header-search-mobile input');
                searchInputs.forEach(inp => inp.value = query);
                // Le filtrage se fera quand loadProducts() sera prêt dans products.js
            }
        }
    });

})();
