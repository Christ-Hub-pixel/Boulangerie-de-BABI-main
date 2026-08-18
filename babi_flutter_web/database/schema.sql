-- ============================================================================
-- 🥖 BOULANGERIE DE BABI - BASE DE DONNÉES POSTGRESQL (SCHEMA OFFICIEL)
-- ============================================================================
-- Description : Schéma relationnel complet pour la gestion de la boulangerie,
--               des 4 rôles (Client, Caissière, Gérante, Administrateur),
--               du catalogue produit, des commandes Click & Collect,
--               des paiements Wave / Espèces, des PINs de retrait et des avis.
-- ============================================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Nettoyage préventif
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS bakery_counters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS stock_movement_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- ============================================================================
-- 1. TYPES ÉNUMÉRÉS (ENUMS)
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'client',
    'caissiere',
    'gerante',
    'administrateur'
);

CREATE TYPE order_status AS ENUM (
    'recue',              -- Étape 0 : Commande reçue dans le système
    'payee',              -- Étape 1 : Paiement reçu & validé
    'en_preparation',     -- Étape 2 : Au fournil / en cours de préparation
    'prete',              -- Étape 3 : Prête à être retirée au comptoir
    'recuperee',          -- Étape 4 : Retirée par le client (Code PIN validé)
    'annulee'             -- Commande annulée
);

CREATE TYPE payment_method AS ENUM (
    'wave',               -- Paiement officiel Wave en ligne
    'especes'             -- Espèces directes au comptoir
);

CREATE TYPE payment_status AS ENUM (
    'en_attente',         -- En attente de règlement
    'paye',               -- Règlement validé
    'rembourse'           -- Transaction remboursée
);

CREATE TYPE stock_movement_type AS ENUM (
    'entree_fournil',         -- Fournée fraîche sortie du fournil
    'vente_commande',         -- Déduction automatique lors d'une commande
    'perte_rebut',            -- Produit abîmé, invendu ou périmé
    'ajustement_inventaire'   -- Recalibrage manuel par la gérante
);

-- ============================================================================
-- 2. TABLES PRINCIPALES
-- ============================================================================

-- A. Table des Utilisateurs & Rôles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(30) UNIQUE,
    role user_role NOT NULL DEFAULT 'client',
    password_hash VARCHAR(255),
    auth_provider VARCHAR(30) DEFAULT 'email', -- 'email', 'google', 'apple'
    oauth_id VARCHAR(150),
    gender VARCHAR(10),
    avatar_url VARCHAR(255) DEFAULT 'assets/baker_profile.webp',
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    vip_tier VARCHAR(20) DEFAULT 'Standard',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- B. Table des Comptoirs de Retrait (Boutiques)
CREATE TABLE bakery_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    opening_hours VARCHAR(100) DEFAULT '06:00 - 22:00',
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- C. Table des Catégories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- D. Table des Produits du Catalogue
CREATE TABLE products (
    id VARCHAR(20) PRIMARY KEY, -- Identifiant court (v1, bl2, g6...)
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_name VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    image_url VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    preparation_time_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- E. Table des Stocks & Alertes de Stock Faible
CREATE TABLE stocks (
    product_id VARCHAR(20) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    current_quantity INTEGER NOT NULL DEFAULT 50 CHECK (current_quantity >= 0),
    min_alert_threshold INTEGER NOT NULL DEFAULT 10 CHECK (min_alert_threshold >= 0),
    last_restocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- F. Table de l'Historique des Mouvements de Stock
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(20) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    quantity_changed INTEGER NOT NULL, -- Positif pour entrée, négatif pour sortie
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Responsable (ex: Gérante)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- G. Table des Employés & Rôles Internes
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(20) UNIQUE NOT NULL, -- Ex: EMP-001, CAI-002, GER-001
    job_title VARCHAR(100) NOT NULL,
    counter_id UUID REFERENCES bakery_counters(id) ON DELETE SET NULL,
    hire_date DATE DEFAULT CURRENT_DATE,
    is_on_duty BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- H. Table des Codes Promotionnels
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount NUMERIC(10, 2) DEFAULT 0.0 CHECK (discount_amount >= 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER DEFAULT 1000,
    times_used INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- F. Table des Commandes Click & Collect
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL, -- Ex: BAB-9842
    pickup_pin VARCHAR(6) NOT NULL,           -- Ex: 4829 (Code PIN de retrait sécurisé)
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    counter_id UUID REFERENCES bakery_counters(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'recue',
    
    -- Montants financiers
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0.0 CHECK (discount_amount >= 0),
    pickup_fee NUMERIC(10, 2) DEFAULT 0.0,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    
    promo_code VARCHAR(30),
    payment_method payment_method NOT NULL DEFAULT 'wave',
    payment_status payment_status NOT NULL DEFAULT 'en_attente',
    
    -- Détails spécifiques au mode de paiement
    wave_txn_reference VARCHAR(100),  -- Ex: T_7G8H9J2K3L4M5N6P
    wave_merchant_id VARCHAR(100) DEFAULT 'M_ci_7X1JfUg2eEsX',
    bill_given NUMERIC(10, 2),        -- Montant du billet donné en espèces
    change_returned NUMERIC(10, 2),   -- Monnaie rendue en caisse
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE
);

-- G. Table des Lignes de Commande (Snapshots Immuables des Prix)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(20) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0), -- Prix unitaire verrouillé à la commande
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal_snapshot NUMERIC(10, 2) NOT NULL CHECK (subtotal_snapshot >= 0),    -- unit_price * quantity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- H. Table des Transactions et Historique des Paiements
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method payment_method NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'en_attente',
    txn_reference VARCHAR(100) UNIQUE,
    official_wave_url VARCHAR(255) DEFAULT 'https://pay.wave.com/m/M_ci_7X1JfUg2eEsX/c/ci/?src=p',
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- I. Table du Registre Immuable Cryptographique (Merkle-Proof Audit Ledger)
CREATE TABLE financial_audit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_index BIGSERIAL UNIQUE NOT NULL,
    previous_block_hash VARCHAR(128) NOT NULL,
    block_hash VARCHAR(128) UNIQUE NOT NULL,
    order_number VARCHAR(30) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    wave_reference VARCHAR(100),
    client_phone VARCHAR(30),
    merkle_signature TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- J. Table des Avis Produits Post-Retrait
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(20) REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(150) NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    criteria_tags TEXT[], -- Ex: ARRAY['Croustillant', 'Bien chaud']
    comment TEXT,
    loyalty_points_awarded INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- J. Table de l'Historique des Points de Fidélité
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    reason VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. INDEX & OPTIMISATIONS
-- ============================================================================

CREATE INDEX idx_products_category ON products(category_name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_pickup_pin ON orders(pickup_pin);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);

-- ============================================================================
-- 4. VUES UTILES POUR LE DASHBOARD & STATISTIQUES
-- ============================================================================

-- Vue du Chiffre d'Affaires et des Commandes par Jour
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    DATE(created_at) AS sale_date,
    COUNT(id) AS total_orders,
    SUM(CASE WHEN payment_status = 'paye' THEN total_amount ELSE 0 END) AS total_revenue_fcfa,
    SUM(CASE WHEN payment_method = 'wave' AND payment_status = 'paye' THEN total_amount ELSE 0 END) AS wave_revenue_fcfa,
    SUM(CASE WHEN payment_method = 'especes' AND status = 'recuperee' THEN total_amount ELSE 0 END) AS cash_revenue_fcfa
FROM orders
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Vue des Produits les Plus Vendus
CREATE OR REPLACE VIEW v_top_selling_products AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.category_name,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.subtotal_snapshot) AS total_revenue_generated
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'annulee'
GROUP BY p.id, p.name, p.category_name
ORDER BY total_units_sold DESC;

-- Vue de la Moyenne des Notes et Avis par Produit
CREATE OR REPLACE VIEW v_product_ratings AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    COUNT(r.id) AS total_reviews,
    ROUND(AVG(r.rating)::NUMERIC, 1) AS average_rating
FROM products p
LEFT JOIN product_reviews r ON p.id = r.product_id
GROUP BY p.id, p.name
ORDER BY average_rating DESC NULLS LAST;

-- ============================================================================
-- 5. ALGORITHME DE GÉNÉRATION AUTOMATIQUE DU CODE PIN DE RETRAIT
-- ============================================================================

-- Fonction PL/pgSQL qui génère un PIN sécurisé à 4 chiffres (1000-9999)
-- en excluant les séquences prévisibles et en évitant les collisions
CREATE OR REPLACE FUNCTION fn_generate_pickup_pin()
RETURNS VARCHAR(4) AS $$
DECLARE
    v_pin VARCHAR(4);
    v_exists BOOLEAN;
    v_blacklist TEXT[] := ARRAY[
        '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
        '1234', '2345', '3456', '4567', '5678', '6789', '0123',
        '4321', '5432', '6543', '7654', '8765', '9876', '3210'
    ];
BEGIN
    LOOP
        -- Générer un entier entre 1000 et 9999
        v_pin := (FLOOR(1000 + (RANDOM() * 9000)))::TEXT;
        
        -- Vérifier si le PIN n'est pas dans la liste noire
        IF NOT (v_pin = ANY(v_blacklist)) THEN
            -- Vérifier s'il n'y a pas déjà une commande non terminée avec ce même PIN aujourd'hui
            SELECT EXISTS (
                SELECT 1 FROM orders 
                WHERE pickup_pin = v_pin 
                AND status NOT IN ('recuperee', 'annulee')
                AND created_at >= CURRENT_DATE
            ) INTO v_exists;
            
            -- Si non existant, nous avons notre PIN unique
            IF NOT v_exists THEN
                RETURN v_pin;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger d'assignation automatique du PIN si non fourni à l'insertion
CREATE OR REPLACE FUNCTION trg_fn_assign_order_pin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_pin IS NULL OR TRIM(NEW.pickup_pin) = '' THEN
        NEW.pickup_pin := fn_generate_pickup_pin();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_auto_pin ON orders;
CREATE TRIGGER trg_orders_auto_pin
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION trg_fn_assign_order_pin();

