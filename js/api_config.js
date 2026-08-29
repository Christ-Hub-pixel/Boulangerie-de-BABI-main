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
    // 3. CATALOGUE EMBARQUÉ & CACHE SYNCHRONE DIRECT
    // ------------------------------------------------------------------------
    window.BABI_EMBEDDED_CATALOG = [];

    // Nettoyage automatique des anciens filtres de suppression pour ne pas bloquer les nouveaux produits
    try {
        localStorage.removeItem('babi_deleted_product_ids');
    } catch (_) {}

    let inMemoryProductsCache = [];

    window.babiGetCachedProducts = function() {
        if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
            return inMemoryProductsCache;
        }
        try {
            const cached = localStorage.getItem('babi_cached_products');
            if (cached !== null) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    inMemoryProductsCache = parsed;
                    return parsed;
                }
            }
        } catch (_) {}
        return inMemoryProductsCache || [];
    };

    window.babiSetCachedProducts = function(products) {
        if (!Array.isArray(products)) return;
        inMemoryProductsCache = products;
        try {
            localStorage.setItem('babi_cached_products', JSON.stringify(products));
        } catch (storageErr) {
            // En cas de QuotaExceededError (quota 5MB plein), nettoyer les caches obsolètes
            try {
                localStorage.removeItem('babi_pos_sales_history');
                localStorage.removeItem('babi_pos_shift_sales');
                localStorage.removeItem('babi_pos_shift_tickets');
                localStorage.removeItem('babi_admin_cached_orders');
                localStorage.removeItem('babi_admin_mock_stats');
                localStorage.setItem('babi_cached_products', JSON.stringify(products));
            } catch (_) {
                // Si toujours trop lourd en local, stocker une version allégée en local
                try {
                    const lightweight = products.map(p => ({
                        ...p,
                        image: (p.image && p.image.length > 2000) ? 'assets/baguette 200.png' : p.image
                    }));
                    localStorage.setItem('babi_cached_products', JSON.stringify(lightweight));
                } catch (_) {}
            }
        }
    };

    window.babiAddCustomProduct = function(product) {
        try {
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
            const list = window.babiGetCachedProducts();
            const filtered = list.filter(p => String(p.id) !== String(productId) && p.id !== productId);
            window.babiSetCachedProducts(filtered);
            return filtered;
        } catch (_) {
            return [];
        }
    };
})();
