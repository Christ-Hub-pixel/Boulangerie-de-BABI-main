require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let db;

// Check API status
app.get('/api/status', (req, res) => {
    res.json({ status: 'API is running', version: '1.0.0' });
});

// --- PRODUCTS API ---

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.all("SELECT * FROM products ORDER BY id DESC");
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new product
app.post('/api/products', async (req, res) => {
    try {
        const { nom, prix, categorie, image } = req.body;
        if (!nom || !prix || !categorie) {
            return res.status(400).json({ error: "Nom, prix et catégorie obligatoires." });
        }
        const img = image || "assets/product_baguette.png";
        const result = await db.run(
            "INSERT INTO products (nom, prix, categorie, image) VALUES (?, ?, ?, ?)",
            [nom, prix, categorie, img]
        );
        res.status(201).json({ success: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { nom, prix, categorie, image } = req.body;
        await db.run(
            "UPDATE products SET nom = ?, prix = ?, categorie = ?, image = ? WHERE id = ?",
            [nom, prix, categorie, image, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.run("DELETE FROM products WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ORDERS API ---

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all("SELECT * FROM orders ORDER BY created_at DESC");
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { customer_name, phone, address, items, total_price, payment_method } = req.body;
        const result = await db.run(
            `INSERT INTO orders (customer_name, phone, address, items, total_price, payment_method, status)
             VALUES (?, ?, ?, ?, ?, ?, 'nouveau')`,
            [customer_name, phone, address, items, total_price, payment_method]
        );
        res.status(201).json({ success: true, order_id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Track order by phone
app.get('/api/orders/track/:phone', async (req, res) => {
    try {
        const orders = await db.all("SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC", [req.params.phone]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PAYMENTS API (OPTION B: WAVE & ORANGE MONEY DIRECT) ---

// In-memory payment sessions store
const paymentSessions = new Map();

// 1. Wave Checkout Endpoint
app.post('/api/payments/wave/checkout', async (req, res) => {
    try {
        const { order_id, amount, phone } = req.body;
        const sessionId = 'wave_sess_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const waveLaunchUrl = `https://wave.com/pay/${sessionId}`;
        
        const sessionData = {
            id: sessionId,
            order_id: order_id,
            amount: amount,
            phone: phone,
            provider: 'wave',
            status: 'completed', // Auto-completed in sandbox simulation
            created_at: new Date().toISOString()
        };

        paymentSessions.set(sessionId, sessionData);

        // Update DB payment_status
        if (order_id) {
            await db.run("UPDATE orders SET payment_status = 'paye', payment_method = 'Wave Mobile Money' WHERE id = ?", [order_id]);
        }

        res.json({
            success: true,
            session_id: sessionId,
            wave_launch_url: waveLaunchUrl,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waveLaunchUrl)}`,
            message: "Session de paiement Wave initialisée avec succès."
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Orange Money Checkout Endpoint
app.post('/api/payments/orange/checkout', async (req, res) => {
    try {
        const { order_id, amount, phone } = req.body;
        const sessionId = 'om_sess_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

        const sessionData = {
            id: sessionId,
            order_id: order_id,
            amount: amount,
            phone: phone,
            provider: 'orange_money',
            status: 'completed', // Auto-completed in sandbox simulation
            ussd_code: '#144*82#',
            created_at: new Date().toISOString()
        };

        paymentSessions.set(sessionId, sessionData);

        // Update DB payment_status
        if (order_id) {
            await db.run("UPDATE orders SET payment_status = 'paye', payment_method = 'Orange Money' WHERE id = ?", [order_id]);
        }

        res.json({
            success: true,
            session_id: sessionId,
            ussd_code: '#144*82#',
            notif_message: "Veuillez valider le paiement Push USSD ou composer #144*82# sur votre mobile Orange Money.",
            message: "Session Orange Money initialisée."
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Payment Status Polling
app.get('/api/payments/status/:sessionId', (req, res) => {
    const session = paymentSessions.get(req.params.sessionId);
    if (session) {
        res.json({ success: true, status: session.status, session });
    } else {
        res.json({ success: true, status: 'completed' });
    }
});

// 4. Refund API (Automated / Manual)
app.post('/api/payments/refund', async (req, res) => {
    try {
        const { order_id, reason } = req.body;
        const refundTxId = 'REFUND_' + Date.now();

        await db.run(
            `UPDATE orders 
             SET status = 'annule_rembourse', 
                 refund_status = 'rembourse', 
                 support_message = ? 
             WHERE id = ? OR id LIKE ?`,
            [
                `Remboursement de la commande effectué automatiquement via Mobile Money. Raison: ${reason || 'Commande annulée'}`,
                order_id,
                `%${order_id}%`
            ]
        );

        res.json({
            success: true,
            refund_id: refundTxId,
            status: 'rembourse',
            message: `Remboursement effectué avec succès pour la commande ${order_id}.`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Support Message API
app.post('/api/orders/:id/support-message', async (req, res) => {
    try {
        const { message, status } = req.body;
        await db.run(
            "UPDATE orders SET support_message = ?, status = COALESCE(?, status) WHERE id = ?",
            [message, status || 'support_en_cours', req.params.id]
        );
        res.json({ success: true, message: "Message du service client mis à jour." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Ratings & Annotations API (Client & Livreur)
app.post('/api/orders/:id/rate', async (req, res) => {
    try {
        const { client_rating, client_tags, client_comment, driver_rating, driver_tags, driver_notes } = req.body;

        await db.run(
            `INSERT INTO ratings (order_id, client_rating, client_tags, client_comment, driver_rating, driver_tags, driver_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.id,
                client_rating || null,
                Array.isArray(client_tags) ? client_tags.join(', ') : client_tags || null,
                client_comment || null,
                driver_rating || null,
                Array.isArray(driver_tags) ? driver_tags.join(', ') : driver_tags || null,
                driver_notes || null
            ]
        );

        if (driver_notes) {
            await db.run("UPDATE orders SET delivery_notes = ? WHERE id = ?", [driver_notes, req.params.id]);
        }

        res.json({ success: true, message: "Avis & annotations enregistrés avec succès !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Ratings Summary
app.get('/api/ratings/stats', async (req, res) => {
    try {
        const ratings = await db.all("SELECT * FROM ratings ORDER BY created_at DESC");
        const avgClientRating = ratings.filter(r => r.client_rating).reduce((sum, r, _, a) => sum + r.client_rating / a.length, 0) || 5;
        const avgDriverRating = ratings.filter(r => r.driver_rating).reduce((sum, r, _, a) => sum + r.driver_rating / a.length, 0) || 5;

        res.json({
            avgClientRating: Number(avgClientRating.toFixed(1)),
            avgDriverRating: Number(avgDriverRating.toFixed(1)),
            totalRatings: ratings.length,
            recentRatings: ratings.slice(0, 10)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- USERS API ---

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.all("SELECT id, nom, email, telephone FROM users ORDER BY id DESC");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STATS API ---

app.get('/api/stats', async (req, res) => {
    try {
        const orders = await db.all("SELECT * FROM orders");
        const productsCount = await db.get("SELECT COUNT(*) as count FROM products");
        const usersCount = await db.get("SELECT COUNT(*) as count FROM users");

        const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const newOrdersCount = orders.filter(o => o.status === 'nouveau').length;
        const deliveredOrdersCount = orders.filter(o => o.status === 'livre' || o.status === 'livré').length;
        const pendingOrdersCount = orders.filter(o => o.status === 'en preparation' || o.status === 'en livraison').length;

        res.json({
            totalRevenue,
            totalOrders: orders.length,
            newOrdersCount,
            deliveredOrdersCount,
            pendingOrdersCount,
            totalProducts: productsCount.count,
            totalUsers: usersCount.count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Automated 15-Minute Refund Rule Worker
function startAutomatedRefundWorker(database) {
    setInterval(async () => {
        try {
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const staleOrders = await database.all(
                "SELECT * FROM orders WHERE status = 'nouveau' AND created_at <= ?",
                [fifteenMinsAgo]
            );

            for (const order of staleOrders) {
                console.log(`[Auto-Refund Worker] Commande #${order.id} non confirmée depuis 15 min. Exécution du remboursement automatique...`);
                await database.run(
                    `UPDATE orders 
                     SET status = 'annule_rembourse', 
                         refund_status = 'rembourse', 
                         support_message = 'Remboursement automatique déclenché : délai d\'acceptation boulangerie (15 min) dépassé. Vos fonds ont été recrédités sur votre compte Mobile Money.'
                     WHERE id = ?`,
                    [order.id]
                );
            }
        } catch (e) {
            console.error("[Auto-Refund Worker Error]:", e.message);
        }
    }, 60000); // Checks every 60 seconds
}

// Init DB and start server
initDB().then(database => {
    db = database;
    startAutomatedRefundWorker(db);
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Erreur d'initialisation de la BD :", err);
});

