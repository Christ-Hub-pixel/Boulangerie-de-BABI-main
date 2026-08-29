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

    // Gestionnaire de liste noire persistante des produits supprimés
    window.babiGetDeletedProductIds = function() {
        try {
            const item = localStorage.getItem('babi_deleted_product_ids');
            return item ? JSON.parse(item) : [];
        } catch (_) {
            return [];
        }
    };

    window.babiAddDeletedProductId = function(productId) {
        try {
            const set = new Set(window.babiGetDeletedProductIds().map(String));
            set.add(String(productId));
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify([...set]));
        } catch (_) {}
    };

    window.babiRemoveDeletedProductId = function(productId) {
        try {
            const set = new Set(window.babiGetDeletedProductIds().map(String));
            set.delete(String(productId));
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify([...set]));
        } catch (_) {}
    };

    let inMemoryProductsCache = [];

    window.babiGetCachedProducts = function() {
        const deletedIds = new Set(window.babiGetDeletedProductIds().map(String));
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
        const filtered = raw.filter(p => p && !deletedIds.has(String(p.id)));
        inMemoryProductsCache = filtered;
        return filtered;
    };

    window.babiSetCachedProducts = function(products) {
        if (!Array.isArray(products)) return;
        const deletedIds = new Set(window.babiGetDeletedProductIds().map(String));
        const filtered = products.filter(p => p && !deletedIds.has(String(p.id)));
        inMemoryProductsCache = filtered;
        
        // Version ultra-légère pour localStorage
        try {
            const safeList = filtered.map(p => {
                const img = p.image || p.image_url || '';
                const safeImage = (img && img.startsWith('data:image/') && img.length > 1500) 
                    ? 'assets/baguette 200.png' 
                    : img;
                return {
                    id: p.id,
                    nom: p.nom || p.name,
                    prix: Number(p.prix || p.price || 0),
                    categorie: p.categorie || p.category || 'pain',
                    image: safeImage,
                    stock: p.stock != null ? Number(p.stock) : 50,
                    seuil_alerte: p.seuil_alerte != null ? Number(p.seuil_alerte) : 10,
                    is_active: (p.is_active === 0 || p.is_active === '0' || p.is_active === false) ? 0 : 1,
                    description: p.description || ''
                };
            });
            localStorage.setItem('babi_cached_products', JSON.stringify(safeList));
        } catch (_) {
            try {
                localStorage.removeItem('babi_pos_sales_history');
                localStorage.removeItem('babi_pos_shift_sales');
                localStorage.removeItem('babi_admin_cached_orders');
            } catch (_) {}
        }
    };

    window.babiAddCustomProduct = function(product) {
        try {
            window.babiRemoveDeletedProductId(product.id);
            const list = window.babiGetCachedProducts();
            const existingIdx = list.findIndex(p => String(p.id) === String(product.id));
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

    window.babiRemoveCustomProduct = function(productId) {
        try {
            window.babiAddDeletedProductId(productId);
            const list = window.babiGetCachedProducts();
            const filtered = list.filter(p => String(p.id) !== String(productId) && p.id !== productId);
            inMemoryProductsCache = filtered;
            window.babiSetCachedProducts(filtered);
            return filtered;
        } catch (_) {
            return [];
        }
    };
})();
