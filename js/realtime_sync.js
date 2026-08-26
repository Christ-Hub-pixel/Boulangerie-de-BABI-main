// ================================================================
// 📡 BOULANGERIE DE BABI — REALTIME OMNICHANNEL SYNCHRONIZATION HUB
// Connects Web Site, Web Admin, Cashier, and Mobile in Real-Time
// ================================================================

(function() {
    const API_BASE = window.API_BASE_URL || (window.location.hostname.includes('boulangeriedebabi.com') ? 'https://api.boulangeriedebabi.com' : 'http://localhost:5000');
    let eventSource = null;
    let reconnectTimeout = null;
    let pollInterval = null;
    let lastEventTimestamp = Date.now();
    let isBroadcasting = false;

    // 1. Cross-Tab Browser Synchronization
    let broadcastChannel = null;
    try {
        if ('BroadcastChannel' in window) {
            broadcastChannel = new BroadcastChannel('babi_products_sync');
            broadcastChannel.onmessage = (msg) => {
                if (msg.data && msg.data.type === 'PRODUCTS_UPDATED') {
                    triggerProductUpdate(msg.data.detail, false);
                }
            };
        }
    } catch (_) {}

    function triggerProductUpdate(detail, broadcast = true) {
        // Dispatch Custom DOM Event for any local listener
        const evt = new CustomEvent('babi:products:updated', { detail: detail || {} });
        window.dispatchEvent(evt);

        // Auto-refresh products table on Admin / Gérante page if function exists
        if (typeof window.loadProducts === 'function') {
            try {
                window.loadProducts();
            } catch (err) {
                console.warn("[RealTimeSync] Error calling loadProducts:", err);
            }
        }

        // Broadcast to other tabs
        if (broadcast && broadcastChannel) {
            try {
                broadcastChannel.postMessage({ type: 'PRODUCTS_UPDATED', detail });
            } catch (_) {}
        }
    }

    // 2. Server-Sent Events (SSE) Real-Time Connection
    function initSSEConnection() {
        if (eventSource) {
            try { eventSource.close(); } catch (_) {}
        }

        const sseUrl = `${API_BASE}/api/ai/live-feed?channel=all&sse=1&since=${lastEventTimestamp}`;
        
        try {
            eventSource = new EventSource(sseUrl);

            eventSource.onopen = () => {
                // Connected successfully
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
            };

            eventSource.onmessage = (event) => {
                if (!event.data) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.timestamp) {
                        lastEventTimestamp = new Date(data.timestamp).getTime();
                    }

                    // Product Events Handling
                    if (['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_STATUS_CHANGED', 'PRODUCT_DELETED'].includes(data.type)) {
                        triggerProductUpdate(data, true);
                    }
                } catch (_) {}
            };

            eventSource.onerror = () => {
                try { eventSource.close(); } catch (_) {}
                eventSource = null;
                // Fallback polling if SSE is disconnected
                startFallbackPolling();
                // Try to reconnect SSE after 5 seconds
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(initSSEConnection, 5000);
            };
        } catch (err) {
            startFallbackPolling();
        }
    }

    // 3. Fallback Polling (Every 30 seconds)
    function startFallbackPolling() {
        if (pollInterval) return;
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/ai/live-feed?channel=all&since=${lastEventTimestamp}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                        let hasProductChange = false;
                        data.events.forEach(evt => {
                            lastEventTimestamp = Math.max(lastEventTimestamp, new Date(evt.timestamp).getTime());
                            if (['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_STATUS_CHANGED', 'PRODUCT_DELETED'].includes(evt.type)) {
                                hasProductChange = true;
                            }
                        });
                        if (hasProductChange) {
                            triggerProductUpdate({ type: 'POLL_SYNC' }, true);
                        }
                    }
                }
            } catch (_) {}
        }, 8000);
    }

    // Expose global manual broadcast function for local actions
    window.notifyProductCatalogueChanged = function(actionType, productData) {
        triggerProductUpdate({ type: actionType || 'PRODUCT_UPDATED', product: productData }, true);
    };

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSSEConnection);
    } else {
        initSSEConnection();
    }
})();
