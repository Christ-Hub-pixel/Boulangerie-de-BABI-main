/**
 * ⚡ BABI POS OFFLINE-FIRST SYNCHRONIZER (IndexedDB v1.0)
 * Permet l'encaissement continu sans interruption réseau et la synchronisation automatique.
 */

const DB_NAME = 'BabiPosOfflineDB';
const DB_VERSION = 1;
let posDb = null;

async function initPosOfflineDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('products')) {
                db.createObjectStore('products', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('pending_sales')) {
                db.createObjectStore('pending_sales', { keyPath: 'offline_id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('loyalty_cache')) {
                db.createObjectStore('loyalty_cache', { keyPath: 'id' });
            }
        };
        req.onsuccess = (e) => {
            posDb = e.target.result;
            updateNetworkStatusUI();
            syncPendingSalesToServer();
            resolve(posDb);
        };
        req.onerror = (e) => reject(e.target.error);
    });
}

// 📦 Mise en cache des produits pour utilisation hors-ligne
async function cacheProductsOffline(productsList) {
    if (!posDb || !Array.isArray(productsList)) return;
    try {
        const tx = posDb.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        for (const p of productsList) {
            store.put(p);
        }
    } catch (_) {}
}

// 🛒 Sauvegarde d'une vente en mode hors-ligne
async function saveSaleOffline(saleData) {
    if (!posDb) await initPosOfflineDb();
    return new Promise((resolve, reject) => {
        try {
            const tx = posDb.transaction('pending_sales', 'readwrite');
            const store = tx.objectStore('pending_sales');
            const offlineSale = {
                ...saleData,
                offline_created_at: new Date().toISOString(),
                is_synced: false
            };
            const req = store.add(offlineSale);
            req.onsuccess = (e) => {
                updatePendingSalesCounter();
                resolve(e.target.result);
            };
            req.onerror = (e) => reject(e.target.error);
        } catch (err) {
            reject(err);
        }
    });
}

// 🔄 Synchronisation automatique des ventes en attente vers le serveur
async function syncPendingSalesToServer() {
    if (!navigator.onLine || !posDb) return;
    try {
        const tx = posDb.transaction('pending_sales', 'readonly');
        const store = tx.objectStore('pending_sales');
        const req = store.getAll();

        req.onsuccess = async () => {
            const pendingSales = req.result || [];
            if (pendingSales.length === 0) {
                updatePendingSalesCounter();
                return;
            }

            console.log(`[POS Auto-Sync] Envoi de ${pendingSales.length} vente(s) en attente...`);

            for (const sale of pendingSales) {
                try {
                    const res = await fetch('/api/pos/sale', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sale)
                    });

                    if (res.ok) {
                        // Remove from IndexedDB once sent
                        const delTx = posDb.transaction('pending_sales', 'readwrite');
                        delTx.objectStore('pending_sales').delete(sale.offline_id);
                    }
                } catch (e) {
                    console.warn("[POS Auto-Sync] Échec envoi vente:", e.message);
                    break; // stop on network error
                }
            }
            updatePendingSalesCounter();
        };
    } catch (_) {}
}

// 📊 Compteur et badge UI
async function updatePendingSalesCounter() {
    if (!posDb) return;
    try {
        const tx = posDb.transaction('pending_sales', 'readonly');
        const countReq = tx.objectStore('pending_sales').count();
        countReq.onsuccess = () => {
            const count = countReq.result || 0;
            const badge = document.getElementById('pos-offline-sync-badge');
            if (badge) {
                if (count > 0) {
                    badge.style.display = 'inline-flex';
                    badge.innerText = `🔄 ${count} vente(s) en attente`;
                    badge.className = 'pos-offline-alert-pill active';
                } else {
                    badge.style.display = 'none';
                }
            }
        };
    } catch (_) {}
}

function updateNetworkStatusUI() {
    const isOnline = navigator.onLine;
    const statusDot = document.getElementById('pos-online-dot');
    const statusText = document.getElementById('pos-online-text');
    if (statusDot && statusText) {
        if (isOnline) {
            statusDot.style.background = '#10b981';
            statusText.innerText = 'Caisse Connectée (En Ligne)';
        } else {
            statusDot.style.background = '#f59e0b';
            statusText.innerText = 'Mode Hors-Ligne (Stockage Local)';
        }
    }
}

window.addEventListener('online', () => {
    updateNetworkStatusUI();
    syncPendingSalesToServer();
});

window.addEventListener('offline', () => {
    updateNetworkStatusUI();
});

document.addEventListener('DOMContentLoaded', () => {
    initPosOfflineDb();
});
