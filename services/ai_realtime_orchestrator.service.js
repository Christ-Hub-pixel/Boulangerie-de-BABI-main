/**
 * 📡 BABI REALTIME ORCHESTRATOR SERVICE (BBE v3.0)
 * Hub de Synchronisation Omnicanal & Dispatching Temps Réel
 * Connecte instantanément : Application Mobile Flutter, Client Web, Caisse POS, Gérante et Direction.
 */

const crypto = require('crypto');

class AiRealtimeOrchestratorService {
    constructor() {
        this.eventBuffer = []; // Derniers 100 événements pour replay / reprise sur déconnexion
        this.maxBufferLength = 100;
        this.subscribers = new Map(); // subId -> { channel, callback, lastSeen }
        this.orderLocks = new Map(); // orderId -> timestamp (verrous anti-collision)
    }

    /**
     * Publie un événement système et le dispatche aux canaux cibles
     * @param {string} eventType - Type d'événement (ex: 'ORDER_CREATED', 'PIN_VALIDATED', 'STOCK_LOW')
     * @param {object} payload - Données associées
     * @param {string[]} targetChannels - Canaux destinataires (ex: ['cashier', 'manager', 'admin'])
     */
    publishEvent(eventType, payload, targetChannels = ['cashier', 'manager', 'admin']) {
        const eventId = 'evt_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
        const timestamp = new Date().toISOString();

        const envelope = {
            id: eventId,
            type: eventType,
            channels: targetChannels,
            timestamp,
            payload: payload || {}
        };

        // Sauvegarde dans le buffer circulaire
        this.eventBuffer.push(envelope);
        if (this.eventBuffer.length > this.maxBufferLength) {
            this.eventBuffer.shift();
        }

        // Notification des abonnés actifs
        for (const [subId, sub] of this.subscribers.entries()) {
            if (targetChannels.includes('*') || targetChannels.includes(sub.channel) || sub.channel === 'all') {
                try {
                    sub.callback(envelope);
                } catch (err) {
                    console.error(`[Orchestrator] Erreur notification subscriber ${subId}:`, err.message);
                }
            }
        }

        return envelope;
    }

    /**
     * Abonne un client (ex: SSE ou WebSocket fallback)
     */
    subscribe(channel, callback) {
        const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        this.subscribers.set(subId, {
            channel: channel || 'all',
            callback,
            createdAt: Date.now()
        });

        return {
            subId,
            unsubscribe: () => this.subscribers.delete(subId)
        };
    }

    /**
     * Récupère le flux d'événements récents depuis un certain timestamp
     */
    getRecentEvents(channel = 'all', sinceTimestamp = 0, limit = 20) {
        const since = Number(sinceTimestamp) || 0;
        return this.eventBuffer
            .filter(evt => {
                const matchesChannel = channel === 'all' || evt.channels.includes('*') || evt.channels.includes(channel);
                const isRecent = new Date(evt.timestamp).getTime() > since;
                return matchesChannel && isRecent;
            })
            .slice(-limit);
    }

    /**
     * Intercepte et valide une nouvelle commande issue du Mobile ou du Web
     * Dispatching instantané vers la caisse, la gérante et l'administrateur
     */
    broadcastNewOrder(orderData) {
        return this.publishEvent('ORDER_CREATED', {
            orderId: orderData.id || orderData.order_id,
            customerName: orderData.customer_name || orderData.name || 'Client BABI',
            phone: orderData.phone || orderData.customer_phone || '',
            totalPrice: orderData.total_price || orderData.total_amount || 0,
            typeRetrait: orderData.type_retrait || orderData.delivery_type || 'click_collect',
            pickupPin: orderData.code_pin || orderData.pin || null,
            items: orderData.items || [],
            source: orderData.source || (orderData.is_flutter_app ? 'mobile_app' : 'web_pwa'),
            originDevice: orderData.origin_device || 'Smartphone / Web',
            status: orderData.status || 'nouveau'
        }, ['cashier', 'manager', 'admin']);
    }

    /**
     * Diffuse la validation en temps réel d'un code PIN au comptoir de caisse
     */
    broadcastPinValidated(validationData) {
        return this.publishEvent('PIN_VALIDATED', {
            orderId: validationData.orderId,
            pinCode: validationData.pinCode,
            validatedByName: validationData.validatedByName || 'Caissière Caisse 1',
            validatedAt: new Date().toISOString(),
            status: 'terminee'
        }, ['cashier', 'manager', 'admin', `client:${validationData.orderId}`]);
    }

    /**
     * Acquiert un verrou atomique sur une commande (anti-double encaissement)
     */
    acquireOrderLock(orderId, operatorName = 'Operator', ttlMs = 15000) {
        const now = Date.now();
        const existing = this.orderLocks.get(orderId);

        if (existing && now < existing.expiresAt && existing.operator !== operatorName) {
            return {
                acquired: false,
                lockedBy: existing.operator,
                remainingSec: Math.ceil((existing.expiresAt - now) / 1000)
            };
        }

        this.orderLocks.set(orderId, {
            operator: operatorName,
            expiresAt: now + ttlMs
        });

        return { acquired: true };
    }

    /**
     * Libère le verrou sur une commande
     */
    releaseOrderLock(orderId) {
        this.orderLocks.delete(orderId);
    }
}

module.exports = new AiRealtimeOrchestratorService();
