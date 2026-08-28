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
    // 3. CATALOGUE EMBARQUÉ (Initialement vide pour saisie manuelle officielle)
    // ------------------------------------------------------------------------
    const RAW_EMBEDDED_CATALOG = [];
    window.BABI_EMBEDDED_CATALOG = RAW_EMBEDDED_CATALOG;

    // ------------------------------------------------------------------------
    // 4. GESTIONNAIRE DE PERSISTANCE & SUPPRESSION DÉFINITIVE
    // ------------------------------------------------------------------------
    window.babiGetDeletedProductIds = function() {
        try {
            const raw = localStorage.getItem('babi_deleted_product_ids');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed.map(String);
            }
        } catch (_) {}
        return [];
    };

    window.babiMarkProductAsDeleted = function(id) {
        try {
            const deleted = window.babiGetDeletedProductIds();
            const strId = String(id);
            if (!deleted.includes(strId)) {
                deleted.push(strId);
                localStorage.setItem('babi_deleted_product_ids', JSON.stringify(deleted));
            }
            // Retirer du cache local
            const cached = localStorage.getItem('babi_cached_products');
            let current = [];
            if (cached) {
                try { current = JSON.parse(cached) || []; } catch (_) {}
            } else {
                current = RAW_EMBEDDED_CATALOG ? [...RAW_EMBEDDED_CATALOG] : [];
            }
            const updated = current.filter(p => String(p.id) !== strId && p.id !== id);
            localStorage.setItem('babi_cached_products', JSON.stringify(updated));
            localStorage.setItem('babi_catalog_user_modified', 'true');
        } catch (_) {}
    };

    window.babiGetCachedProducts = function() {
        const deletedIds = new Set(window.babiGetDeletedProductIds());
        let list = [];
        try {
            const cached = localStorage.getItem('babi_cached_products');
            if (cached !== null) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    list = parsed;
                }
            } else if (localStorage.getItem('babi_catalog_user_modified') !== 'true') {
                list = RAW_EMBEDDED_CATALOG ? [...RAW_EMBEDDED_CATALOG] : [];
            }
        } catch (_) {
            list = RAW_EMBEDDED_CATALOG ? [...RAW_EMBEDDED_CATALOG] : [];
        }
        // Filtrage strict : tout produit supprimé ne réapparaît JAMAIS
        return list.filter(p => !deletedIds.has(String(p.id)) && !deletedIds.has(String(p.id_produit || '')));
    };

    window.babiSetCachedProducts = function(products) {
        try {
            if (Array.isArray(products)) {
                const deletedIds = new Set(window.babiGetDeletedProductIds());
                const filtered = products.filter(p => !deletedIds.has(String(p.id)) && !deletedIds.has(String(p.id_produit || '')));
                localStorage.setItem('babi_cached_products', JSON.stringify(filtered));
                localStorage.setItem('babi_catalog_user_modified', 'true');
            }
        } catch (_) {}
    };

    window.babiClearAllProducts = function() {
        try {
            localStorage.setItem('babi_cached_products', JSON.stringify([]));
            localStorage.setItem('babi_catalog_user_modified', 'true');
            const allIds = RAW_EMBEDDED_CATALOG.map(p => String(p.id));
            localStorage.setItem('babi_deleted_product_ids', JSON.stringify(allIds));
        } catch (_) {}
    };

    // Initialisation du cache
    if (!localStorage.getItem('babi_cached_products') && localStorage.getItem('babi_catalog_user_modified') !== 'true') {
        window.babiSetCachedProducts(RAW_EMBEDDED_CATALOG);
    }
})();
