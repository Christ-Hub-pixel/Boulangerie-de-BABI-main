/**
 * 🌊 WAVE PAYOUT & PAYMENT SERVICE — BOULANGERIE DE BABI
 * Implementation conforme aux spécifications officielles de l'API Wave Business v1
 * 
 * Endpoints officiels pris en charge :
 * - POST /v1/payout              (Créer un paiement unique)
 * - GET  /v1/payout/:id          (Récupérer un paiement)
 * - GET  /v1/payouts/search      (Rechercher par client_reference)
 * - POST /v1/payout-batch        (Créer un lot de paiements groupés)
 * - GET  /v1/payout-batch/:id    (Récupérer le statut d'un lot)
 * - POST /v1/payout/:id/reverse  (Annuler/inverser un paiement sous 3 jours)
 * - POST /v1/verify_recipient/   (Vérifier l'éligibilité d'un bénéficiaire)
 */

const crypto = require('crypto');

class WavePayoutService {
    constructor() {
        this.apiBaseUrl = (process.env.WAVE_API_BASE_URL || 'https://api.wave.com').replace(/\/v1\/?$/, '');
        this.apiKey = process.env.WAVE_API_KEY || process.env.WAVE_SECRET_KEY || '';
        this.signingSecret = process.env.WAVE_SIGNING_SECRET || process.env.WAVE_WEBHOOK_SECRET || '';
        this.currency = 'XOF';
        this.defaultCountryCode = '+225'; // Côte d'Ivoire
    }

    /**
     * Normalise un numéro de téléphone au format international E.164 (+2250704389201)
     */
    formatE164Phone(phone) {
        if (!phone) return '';
        let cleaned = String(phone).replace(/[^0-9+]/g, '');
        if (cleaned.startsWith('+')) return cleaned;
        if (cleaned.startsWith('00')) return '+' + cleaned.substring(2);
        if (cleaned.startsWith('225') && cleaned.length >= 12) return '+' + cleaned;
        return '+225' + cleaned;
    }

    /**
     * Normalise un montant en chaîne entière positive sans décimales
     */
    formatAmountString(amount) {
        const num = Math.round(Number(amount) || 0);
        if (num <= 0) throw new Error("Le montant du paiement Wave doit être strictement positif.");
        return String(num);
    }

    /**
     * Construit l'en-tête de signature cryptographique Wave-Signature (HMAC-SHA256)
     * Format : t={timestamp},v1={signature} où payload = timestamp + body
     */
    buildWaveSignatureHeader(rawBodyString, timestamp = Math.floor(Date.now() / 1000)) {
        if (!this.signingSecret) return null;
        const payload = String(timestamp) + (rawBodyString || '');
        const signature = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
        return `t=${timestamp},v1=${signature}`;
    }

    /**
     * Valide une signature Wave-Signature entrante (protection contre les attaques par rejeu)
     */
    verifyIncomingSignature(signatureHeader, rawBodyString, maxAgeSec = 300) {
        if (!signatureHeader || !this.signingSecret) return false;
        try {
            const parts = signatureHeader.split(',');
            let timestamp = null;
            let signature = null;

            parts.forEach(part => {
                const [k, v] = part.trim().split('=');
                if (k === 't') timestamp = parseInt(v, 10);
                if (k === 'v1') signature = v;
            });

            if (!timestamp || !signature) return false;

            const now = Math.floor(Date.now() / 1000);
            // Vérification de la fenêtre temporelle anti-rejeu (5 min max dans le passé, 30s dans le futur)
            if (now - timestamp > maxAgeSec || timestamp - now > 30) {
                console.warn("[Wave Security] Signature timestamp expiré ou invalide :", timestamp, "Now :", now);
                return false;
            }

            const expectedPayload = String(timestamp) + (rawBodyString || '');
            const expectedSig = crypto.createHmac('sha256', this.signingSecret).update(expectedPayload).digest('hex');

            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
        } catch (err) {
            console.error("[Wave Security] Erreur vérification signature :", err);
            return false;
        }
    }

    /**
     * Effectue une requête HTTP vers l'API Wave avec gestion de l'idempotence et des nouvelles tentatives
     */
    async executeWaveRequest(endpoint, method = 'GET', bodyData = null, idempotencyKey = null, attempt = 1) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const idemKey = idempotencyKey || (method === 'POST' ? crypto.randomUUID() : null);
        const rawBody = bodyData ? JSON.stringify(bodyData) : '';
        const timestamp = Math.floor(Date.now() / 1000);

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (idemKey) {
            headers['Idempotency-Key'] = idemKey;
        }

        if (this.signingSecret) {
            const sig = this.buildWaveSignatureHeader(rawBody, timestamp);
            if (sig) headers['Wave-Signature'] = sig;
        }

        const options = {
            method,
            headers
        };

        if (bodyData && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = rawBody;
        }

        // Mode simulation si aucune clé d'API Wave réelle n'est renseignée dans .env
        if (!this.apiKey || !this.apiKey.startsWith('wave_')) {
            return this.mockWaveExecution(endpoint, method, bodyData, idemKey);
        }

        try {
            const response = await fetch(url, options);
            const responseText = await response.text();
            let parsedJson = {};
            try {
                parsedJson = JSON.parse(responseText);
            } catch (_) {
                parsedJson = { raw: responseText };
            }

            // Retry automatique avec backoff exponentiel pour erreurs 408, 429, 500, 503
            if ([408, 429, 500, 502, 503, 504].includes(response.status) && attempt <= 3) {
                const backoffMs = Math.pow(2, attempt) * 1000;
                console.warn(`[Wave Payout] Statut HTTP ${response.status}. Nouvelle tentative #${attempt + 1} dans ${backoffMs}ms avec même Idempotency-Key (${idemKey})...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
                return this.executeWaveRequest(endpoint, method, bodyData, idemKey, attempt + 1);
            }

            if (!response.ok) {
                const errorCode = parsedJson.code || parsedJson.error || parsedJson.error_code || `HTTP_${response.status}`;
                const errorMessage = parsedJson.message || parsedJson.error_message || "Erreur de l'API Wave";
                const error = new Error(`[Wave API Error] ${errorCode}: ${errorMessage}`);
                error.code = errorCode;
                error.status = response.status;
                error.details = parsedJson;
                throw error;
            }

            return {
                success: true,
                status: response.status,
                idempotencyKey: idemKey,
                data: parsedJson
            };
        } catch (err) {
            // Si erreur réseau et tentatives restantes, relancer avec backoff
            if (attempt <= 3 && !err.status) {
                const backoffMs = Math.pow(2, attempt) * 1000;
                console.warn(`[Wave Payout Network] Erreur réseau. Nouvelle tentative #${attempt + 1} dans ${backoffMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
                return this.executeWaveRequest(endpoint, method, bodyData, idemKey, attempt + 1);
            }
            throw err;
        }
    }

    /**
     * 1. POST /v1/payout — Créer un paiement / transfert unique (Remboursement ou Versement)
     */
    async createPayout({ mobile, receive_amount, name, client_reference, payment_reason, national_id, aggregated_merchant_id, idempotencyKey }) {
        const formattedMobile = this.formatE164Phone(mobile);
        const formattedAmount = this.formatAmountString(receive_amount);

        const payload = {
            currency: this.currency,
            mobile: formattedMobile,
            receive_amount: formattedAmount
        };

        if (name) payload.name = String(name).substring(0, 255);
        if (client_reference) payload.client_reference = String(client_reference).substring(0, 255);
        if (payment_reason) payload.payment_reason = String(payment_reason).substring(0, 40);
        if (national_id) payload.national_id = String(national_id).substring(0, 255);
        if (aggregated_merchant_id) payload.aggregated_merchant_id = String(aggregated_merchant_id);

        return await this.executeWaveRequest('/v1/payout', 'POST', payload, idempotencyKey);
    }

    /**
     * 2. GET /v1/payout/:id — Récupérer l'état d'un paiement
     */
    async getPayout(payoutId) {
        if (!payoutId) throw new Error("L'identifiant du payout Wave (pt-...) est requis.");
        return await this.executeWaveRequest(`/v1/payout/${encodeURIComponent(payoutId)}`, 'GET');
    }

    /**
     * 3. GET /v1/payouts/search — Recherche par référence client
     */
    async searchPayoutsByClientReference(clientReference) {
        if (!clientReference) throw new Error("Le paramètre client_reference est requis.");
        return await this.executeWaveRequest(`/v1/payouts/search?client_reference=${encodeURIComponent(clientReference)}`, 'GET');
    }

    /**
     * 4. POST /v1/payout-batch — Créer un lot de paiements groupés
     */
    async createPayoutBatch(payoutsList = [], idempotencyKey = null) {
        if (!Array.isArray(payoutsList) || payoutsList.length === 0) {
            throw new Error("La liste des paiements pour le lot est vide.");
        }

        const formattedPayouts = payoutsList.map(p => ({
            currency: this.currency,
            mobile: this.formatE164Phone(p.mobile),
            receive_amount: this.formatAmountString(p.receive_amount || p.amount),
            name: p.name ? String(p.name).substring(0, 255) : undefined,
            client_reference: p.client_reference ? String(p.client_reference).substring(0, 255) : undefined,
            payment_reason: p.payment_reason ? String(p.payment_reason).substring(0, 40) : undefined,
            aggregated_merchant_id: p.aggregated_merchant_id || undefined
        }));

        return await this.executeWaveRequest('/v1/payout-batch', 'POST', { payouts: formattedPayouts }, idempotencyKey);
    }

    /**
     * 5. GET /v1/payout-batch/:id — Récupérer le statut d'un lot
     */
    async getPayoutBatch(batchId) {
        if (!batchId) throw new Error("L'identifiant du lot de payout Wave (pb-...) est requis.");
        return await this.executeWaveRequest(`/v1/payout-batch/${encodeURIComponent(batchId)}`, 'GET');
    }

    /**
     * 6. POST /v1/payout/:id/reverse — Annuler / Inverser un paiement sous 3 jours
     */
    async reversePayout(payoutId, idempotencyKey = null) {
        if (!payoutId) throw new Error("L'identifiant du payout Wave à annuler est requis.");
        return await this.executeWaveRequest(`/v1/payout/${encodeURIComponent(payoutId)}/reverse`, 'POST', {}, idempotencyKey);
    }

    /**
     * 7. POST /v1/verify_recipient/ — Vérifier l'éligibilité d'un bénéficiaire
     */
    async verifyRecipient({ mobile, name, amount, national_id }) {
        const payload = {
            mobile: this.formatE164Phone(mobile)
        };
        if (name) payload.name = String(name);
        if (amount) {
            payload.amount = this.formatAmountString(amount);
            payload.currency = this.currency;
        }
        if (national_id) payload.national_id = String(national_id);

        return await this.executeWaveRequest('/v1/verify_recipient/', 'POST', payload);
    }

    /**
     * Mode Démo / Sandbox Intelligent avec conformité stricte du schéma
     */
    mockWaveExecution(endpoint, method, body, idemKey) {
        const mockTimestamp = new Date().toISOString();
        const fakeId = 'pt-' + crypto.randomBytes(6).toString('hex');

        if (endpoint === '/v1/payout' && method === 'POST') {
            const fee = Math.max(5, Math.round(Number(body.receive_amount) * 0.01));
            return Promise.resolve({
                success: true,
                status: 200,
                idempotencyKey: idemKey,
                data: {
                    id: fakeId,
                    currency: "XOF",
                    receive_amount: body.receive_amount,
                    fee: String(fee),
                    mobile: body.mobile,
                    name: body.name || "Client Destinataire",
                    client_reference: body.client_reference || "BABI-REF-" + Date.now(),
                    payment_reason: body.payment_reason || "Remboursement / Avoir BABI",
                    status: "succeeded",
                    timestamp: mockTimestamp,
                    mode: "simulation_sandbox"
                }
            });
        }

        if (endpoint.startsWith('/v1/payout/') && endpoint.endsWith('/reverse')) {
            return Promise.resolve({
                success: true,
                status: 200,
                idempotencyKey: idemKey,
                data: {
                    status: "reversed",
                    message: "Le paiement Wave a été annulé avec succès.",
                    timestamp: mockTimestamp
                }
            });
        }

        if (endpoint.startsWith('/v1/payout-batch') && method === 'POST') {
            const batchId = 'pb-' + crypto.randomBytes(6).toString('hex');
            return Promise.resolve({
                success: true,
                status: 200,
                idempotencyKey: idemKey,
                data: {
                    id: batchId,
                    status: "processing",
                    count: (body.payouts || []).length,
                    timestamp: mockTimestamp
                }
            });
        }

        if (endpoint === '/v1/verify_recipient/') {
            return Promise.resolve({
                success: true,
                status: 200,
                data: {
                    within_limits: true,
                    name_match: body.name ? "MATCH" : "NAME_NOT_KNOWN",
                    national_id_match: body.national_id ? "MATCH" : null
                }
            });
        }

        return Promise.resolve({
            success: true,
            status: 200,
            idempotencyKey: idemKey,
            data: {
                id: fakeId,
                currency: "XOF",
                status: "succeeded",
                timestamp: mockTimestamp
            }
        });
    }
}

module.exports = new WavePayoutService();
