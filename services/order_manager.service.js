/**
 * 🥖 ORDER MANAGER SERVICE
 * Manages order creation, catalog price verification (recalculating server-side),
 * order items persistence, and state transitions.
 */
class OrderManagerService {
    /**
     * Crée une commande après vérification stricte des prix depuis le catalogue SQL
     * @param {Object} db - Instance SQLite
     * @param {Object} orderData - { customer_name, customer_phone, customer_email, user_id, items, pickup_slot, pickup_point, notes, delivery_type }
     * @returns {Promise<Object>} - Commande créée avec total recalculé et items enregistrés
     */
    async createVerifiedOrder(db, orderData) {
        const {
            customer_name,
            customer_phone,
            customer_email = '',
            user_id = null,
            items = [],
            pickup_slot = 'Dès que possible (~15-20 min)',
            pickup_point = 'Riviera (Boulangerie de BABI)',
            notes = '',
            delivery_type = 'click_collect',
            delivery_address = 'Fournil Riviera'
        } = orderData;

        if (!customer_name || !customer_phone) {
            throw new Error("Nom et numéro de téléphone du client obligatoires.");
        }

        const rawItems = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items || '[]') : []);
        if (rawItems.length === 0) {
            throw new Error("Le panier est vide.");
        }

        // 1. Récupération de tous les produits depuis la base pour recalculer les prix
        const allDbProducts = await db.all("SELECT id, nom, prix FROM products");
        const productMap = new Map();
        allDbProducts.forEach(p => {
            productMap.set(p.id, p);
            productMap.set(p.nom.toLowerCase().trim(), p);
        });

        let subtotalAmount = 0;
        const verifiedItems = [];

        for (const item of rawItems) {
            const rawName = (item.name || item.nom || item.title || '').trim();
            const qty = Math.max(1, parseInt(item.qty || item.quantity || item.qte) || 1);
            
            // Recherche du produit officiel en base
            let matchedProduct = null;
            if (item.id && productMap.has(Number(item.id))) {
                matchedProduct = productMap.get(Number(item.id));
            } else if (rawName && productMap.has(rawName.toLowerCase())) {
                matchedProduct = productMap.get(rawName.toLowerCase());
            }

            let unitPrice = 0;
            if (matchedProduct) {
                unitPrice = matchedProduct.prix;
            } else {
                // Si produit sur mesure (ex: gâteau personnalisé), extraction sécurisée
                unitPrice = Math.max(100, parseInt(item.price || item.prix) || 200);
            }

            const lineTotal = unitPrice * qty;
            subtotalAmount += lineTotal;

            verifiedItems.push({
                product_id: matchedProduct ? matchedProduct.id : null,
                product_name: matchedProduct ? matchedProduct.nom : rawName,
                unit_price: unitPrice,
                quantity: qty,
                total_price: lineTotal
            });
        }

        const deliveryFee = delivery_type === 'delivery' ? 1000 : 0;
        const totalAmount = subtotalAmount + deliveryFee;
        const itemsSummary = verifiedItems.map(i => `${i.product_name} (x${i.quantity})`).join(', ');

        // 2. Insertion dans la table `orders`
        const insertRes = await db.run(
            `INSERT INTO orders 
             (user_id, customer_name, customer_phone, phone, customer_email, delivery_type, pickup_slot, pickup_point, delivery_address, notes, subtotal_amount, delivery_fee, total_amount, currency, status, type_retrait, total_price, items)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'XOF', 'CREATED', ?, ?, ?)`,
            [
                user_id,
                customer_name.trim(),
                customer_phone.trim(),
                customer_phone.trim(),
                customer_email.trim(),
                delivery_type,
                pickup_slot,
                pickup_point,
                delivery_address,
                notes.trim(),
                subtotalAmount,
                deliveryFee,
                totalAmount,
                delivery_type,
                totalAmount,
                itemsSummary
            ]
        );

        const orderNumericId = insertRes.lastID;
        const orderId = `ORD-${orderNumericId}`;

        // 3. Insertion des lignes dans `order_items`
        for (const it of verifiedItems) {
            await db.run(
                `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [String(orderNumericId), it.product_id, it.product_name, it.unit_price, it.quantity, it.total_price]
            );
        }

        return {
            id: orderId,
            customer_name,
            customer_phone,
            customer_email,
            delivery_type,
            pickup_slot,
            pickup_point,
            subtotal_amount: subtotalAmount,
            delivery_fee: deliveryFee,
            total_amount: totalAmount,
            currency: 'XOF',
            status: 'CREATED',
            items: verifiedItems,
            itemsSummary: verifiedItems.map(i => `${i.product_name} (x${i.quantity})`).join(', ')
        };
    }

    /**
     * Met à jour le statut d'une commande
     */
    async updateOrderStatus(db, orderId, newStatus) {
        const validStatuses = ['CREATED', 'PAYMENT_PENDING', 'PAID', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Statut de commande invalide: ${newStatus}`);
        }

        const cleanId = String(orderId || '').replace(/^ORD-/, '');
        await db.run("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR id = ?", [newStatus, orderId, cleanId]);
        return { orderId, status: newStatus };
    }

    /**
     * Récupère une commande avec ses articles et son code PIN
     */
    async getOrderById(db, orderId) {
        const cleanId = String(orderId || '').replace(/^ORD-/, '');
        const order = await db.get("SELECT * FROM orders WHERE id = ? OR id = ?", [orderId, cleanId]);
        if (!order) return null;

        const items = await db.all("SELECT * FROM order_items WHERE order_id = ? OR order_id = ?", [order.id, `ORD-${order.id}`]);
        const pinRecord = await db.get("SELECT * FROM pickup_codes WHERE order_id = ? OR order_id = ?", [order.id, `ORD-${order.id}`]);
        const payment = await db.get("SELECT * FROM payments WHERE order_id = ? OR order_id = ? ORDER BY created_at DESC LIMIT 1", [order.id, `ORD-${order.id}`]);

        return {
            ...order,
            items,
            pickupPin: pinRecord ? pinRecord.pin_code : (order.code_pin || null),
            isPinUsed: pinRecord ? Boolean(pinRecord.is_used) : false,
            payment
        };
    }
}

module.exports = new OrderManagerService();
