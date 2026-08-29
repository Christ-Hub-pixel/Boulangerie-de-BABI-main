/**
 * ============================================================================
 * BOULANGERIE DE BABI — CONFIGURATION GLOBALE & ACCÉLÉRATEUR 0ms
 * ============================================================================
 * Fournit :
 * 1. Résolution dynamique et résiliente de window.API_BASE_URL / window.API_ROOT
 * 2. babiFetch() avec AbortController (timeout 2s max anti-blocage)
 * 3. Catalogue complet embarqué (window.BABI_EMBEDDED_CATALOG) pour affichage instantané 0ms
 * 4. Gestionnaire de cache ultra-rapide (babiGetCachedProducts / babiSetCachedProducts)
 */

(function() {
    // ------------------------------------------------------------------------
    // 1. DÉTECTION DYNAMIQUE DE L'URL API
    // ------------------------------------------------------------------------
    const isBrowser = typeof window !== 'undefined';
    let base = 'http://localhost:5000';

    if (isBrowser) {
        const proto = window.location.protocol;

        if (proto.startsWith('http')) {
            base = window.location.origin;
        } else {
            base = 'http://localhost:5000';
        }

        window.API_BASE_URL = base;
        window.API_ROOT = base;
    }

    // ------------------------------------------------------------------------
    // 2. UTILITAIRE RÉSEAU ULTRA-RAPIDE AVEC TIMEOUT (babiFetch)
    // ------------------------------------------------------------------------
    window.babiFetch = async function(url, options = {}, timeoutMs = 2500) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const finalOptions = {
                ...options,
                signal: controller.signal
            };
            const response = await fetch(url, finalOptions);
            clearTimeout(timer);
            return response;
        } catch (err) {
            clearTimeout(timer);
            throw err;
        }
    };

    // ------------------------------------------------------------------------
    // 3. CATALOGUE EMBARQUÉ & CACHE SYNCHRONE DIRECT (AVEC PROTECTION ANTI-RÉSURRECTION)
    // ------------------------------------------------------------------------
    window.BABI_EMBEDDED_CATALOG = [];

    // Gestionnaire de liste noire persistante des produits supprimés (par ID et par Nom)
    window.babiGetDeletedProductIds = function() {
        try {
            const item = localStorage.getItem('babi_deleted_product_ids');
            return item ? JSON.parse(item) : [];
        } catch (_) {
            return [];
        }
    };

    window.babiAddDeletedProductId = function(identifier) {
        if (!identifier) return;
        try {
            const set = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
            set.add(String(identifier).toLowerCase().trim());
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify([...set]));
        } catch (_) {}
    };

    window.babiRemoveDeletedProductId = function(identifier) {
        if (!identifier) return;
        try {
            const norm = String(identifier).toLowerCase().trim();
            const set = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
            set.delete(norm);
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify([...set]));
        } catch (_) {}
    };

    let inMemoryProductsCache = [];

    window.babiGetCachedProducts = function() {
        const deletedSet = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
        let raw = [];
        if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
            raw = inMemoryProductsCache;
        } else {
            try {
                const cached = localStorage.getItem('babi_cached_products');
                if (cached !== null) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        raw = parsed;
                    }
                }
            } catch (_) {}
        }
        const filtered = raw.filter(p => {
            if (!p) return false;
            const idKey = String(p.id).toLowerCase().trim();
            const nameKey = String(p.nom || p.name || '').toLowerCase().trim();
            return !deletedSet.has(idKey) && !deletedSet.has(nameKey);
        });
        inMemoryProductsCache = filtered;
        return filtered;
    };

    window.babiSetCachedProducts = function(products) {
        if (!Array.isArray(products)) return;
        const deletedSet = new Set(window.babiGetDeletedProductIds().map(s => String(s).toLowerCase().trim()));
        const filtered = products.filter(p => {
            if (!p) return false;
            const idKey = String(p.id).toLowerCase().trim();
            const nameKey = String(p.nom || p.name || '').toLowerCase().trim();
            return !deletedSet.has(idKey) && !deletedSet.has(nameKey);
        });
        inMemoryProductsCache = filtered;
        
        // Sauvegarde persistante dans localStorage sans écraser les photos personnalisées
        try {
            const safeList = filtered.map(p => ({
                id: p.id,
                nom: p.nom || p.name,
                prix: Number(p.prix || p.price || 0),
                categorie: p.categorie || p.category || 'pain',
                image: p.image || p.image_url || 'assets/product_baguette.png',
                stock: p.stock != null ? Number(p.stock) : 50,
                seuil_alerte: p.seuil_alerte != null ? Number(p.seuil_alerte) : 10,
                is_active: (p.is_active === 0 || p.is_active === '0' || p.is_active === false) ? 0 : 1,
                description: p.description || ''
            }));
            localStorage.setItem('babi_cached_products', JSON.stringify(safeList));
        } catch (_) {
            try {
                localStorage.removeItem('babi_pos_sales_history');
                localStorage.removeItem('babi_pos_shift_sales');
                localStorage.removeItem('babi_admin_cached_orders');
                const minimalList = filtered.map(p => ({
                    id: p.id,
                    nom: p.nom || p.name,
                    prix: Number(p.prix || 0),
                    categorie: p.categorie || 'pain',
                    image: p.image || 'assets/product_baguette.png',
                    stock: p.stock != null ? Number(p.stock) : 50,
                    is_active: p.is_active != null ? p.is_active : 1
                }));
                localStorage.setItem('babi_cached_products', JSON.stringify(minimalList));
            } catch (_) {}
        }
    };

    window.babiAddCustomProduct = function(product) {
        try {
            if (product.id) window.babiRemoveDeletedProductId(product.id);
            if (product.nom || product.name) window.babiRemoveDeletedProductId(product.nom || product.name);
            const list = window.babiGetCachedProducts();
            const existingIdx = list.findIndex(p => String(p.id) === String(product.id) || (p.nom && product.nom && p.nom.trim().toLowerCase() === product.nom.trim().toLowerCase()));
            if (existingIdx >= 0) {
                list[existingIdx] = product;
            } else {
                list.unshift(product);
            }
            window.babiSetCachedProducts(list);
            return list;
        } catch (_) {
            return [];
        }
    };

    window.babiRemoveCustomProduct = function(productId, productName) {
        try {
            if (productId) window.babiAddDeletedProductId(productId);
            if (productName) window.babiAddDeletedProductId(productName);
            const list = window.babiGetCachedProducts();
            const filtered = list.filter(p => {
                if (String(p.id) === String(productId) || p.id === productId) return false;
                if (productName && (p.nom || p.name) && String(p.nom || p.name).toLowerCase().trim() === String(productName).toLowerCase().trim()) return false;
                return true;
            });
            inMemoryProductsCache = filtered;
            window.babiSetCachedProducts(filtered);
            return filtered;
        } catch (_) {
            return [];
        }
    };

    // ==========================================
    // 🏷️ Dynamic Categories Cache & Helpers
    // ==========================================
    const DEFAULT_CATEGORIES = [
        { id: 1, slug: 'pain', nom: 'Pains', icone: '🥖', ordre: 1, is_active: 1 },
        { id: 2, slug: 'pains_speciaux', nom: 'Pains Spéciaux', icone: '🌾', ordre: 2, is_active: 1 },
        { id: 3, slug: 'viennoiserie', nom: 'Viennoiseries', icone: '🥐', ordre: 3, is_active: 1 },
        { id: 4, slug: 'patisserie', nom: 'Pâtisseries', icone: '🍰', ordre: 4, is_active: 1 },
        { id: 5, slug: 'boisson', nom: 'Boissons', icone: '🧃', ordre: 5, is_active: 1 },
        { id: 6, slug: 'sale', nom: 'Salés & Traiteur', icone: '🥪', ordre: 6, is_active: 1 },
        { id: 7, slug: 'snack', nom: 'Biscuits & Snacks', icone: '🍪', ordre: 7, is_active: 1 },
        { id: 8, slug: 'autre', nom: 'Autres Gourmandises', icone: '✨', ordre: 8, is_active: 1 }
    ];

    window.babiGetCachedCategories = function() {
        try {
            const raw = localStorage.getItem('babi_cached_categories');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) {}
        return DEFAULT_CATEGORIES;
    };

    window.babiSetCachedCategories = function(categories) {
        try {
            if (Array.isArray(categories) && categories.length > 0) {
                localStorage.setItem('babi_cached_categories', JSON.stringify(categories));
            }
        } catch (_) {}
    };
})();
