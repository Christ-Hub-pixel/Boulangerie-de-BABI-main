# 🚪 Guide de Connexion : API Gateway ➔ Site Web & Mobile

Ce document explique comment relier l'**API Gateway** au **Site Web** et à l'**Application Mobile** de la **Boulangerie de BABI**.

---

## 🏗️ 1. Schéma d'Architecture

```
[ 🌐 Site Web (React / Next.js / PHP) ]      [ 📱 Application Mobile (Flutter) ]
                 │                                           │
                 └─────────────────────┬─────────────────────┘
                                       │ HTTPS / JSON (JWT Token)
                                       ▼
                       ┌───────────────────────────────┐
                       │        🚪 API GATEWAY         │  (Port 8000 / 4000)
                       │  • Gestion des CORS           │
                       │  • Authentification (JWT)     │
                       │  • Routage des Microservices  │
                       │  • Sécurité & Rate-Limiting   │
                       └───────────────┬───────────────┘
                                       │
      ┌────────────────────────────────┼────────────────────────────────┐
      ▼                                ▼                                ▼
[ 🍞 Service Catalogue ]     [ 📦 Service Commandes ]       [ 💳 Service Paiement ]
- GET /api/v1/products       - POST /api/v1/orders          - POST /api/v1/pay/wave
- GET /api/v1/categories     - GET /api/v1/orders/:id       - POST /api/v1/pay/cash
                             - PUT /api/v1/orders/:id/pin   - POST /api/v1/pay/webhook
      │                                │                                │
      └────────────────────────────────┴────────────────────────────────┘
                                       │
                                       ▼
                     [ 🐘 Base PostgreSQL : Port 5432 ]
```

---

## ⚙️ 2. Configuration Essentielle sur l'API Gateway

### A. Autoriser les requêtes du Site Web (CORS)
Dans votre API Gateway (Node.js, Nginx, Kong, FastAPI, etc.), autorisez le domaine de votre site web :

```javascript
// Exemple en Node.js / Express Gateway
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',               // Site web local (React / Next.js / Vue)
    'http://localhost:8080',               // Serveur local alternatif
    'https://www.boulangeriedebabi.ci'     // Domaine de production
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🌐 3. Code Client sur le Site Web (Exemple JavaScript / TypeScript)

Sur le PC du site web, créez un fichier de service API unique (ex: `src/services/api.js`) :

```javascript
// src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Client HTTP générique
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('babi_jwt_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur réseau');
  }

  return response.json();
}

// --- MÉTHODES DU SITE WEB ---

// 1. Récupérer le catalogue complet
export const getProducts = () => request('/products');

// 2. Créer une nouvelle commande Click & Collect (génère le PIN de retrait)
export const createOrder = (orderData) => request('/orders', {
  method: 'POST',
  body: JSON.stringify(orderData),
});

// 3. Initialiser le paiement Wave
export const initiateWavePayment = (orderId, amount) => request('/payments/wave/initiate', {
  method: 'POST',
  body: JSON.stringify({ orderId, amount }),
});

// 4. Suivre le statut de la commande en temps réel
export const getOrderStatus = (orderId) => request(`/orders/${orderId}`);

// 5. Laisser un avis post-retrait (+20 pts)
export const submitReview = (reviewData) => request('/reviews', {
  method: 'POST',
  body: JSON.stringify(reviewData),
});
```

---

## 🛒 4. Exemple de Flux de Commande sur le Site Web

Lorsqu'un client valide son panier sur le site :

```javascript
async function handleCheckout() {
  try {
    // 1. Création de la commande avec snapshot des prix
    const order = await createOrder({
      customerName: "Koffi Kouamé",
      items: [
        { productId: "v1", name: "Croissant Pur Beurre", unitPrice: 500, quantity: 2 },
        { productId: "bl2", name: "Baguette Dorée 200g", unitPrice: 200, quantity: 1 }
      ],
      paymentMethod: "wave",
      promoCode: "BABI10" // -10%
    });

    console.log("Commande créée :", order.orderNumber); // Ex: #BAB-9842
    console.log("Code PIN de retrait :", order.pickupPin); // Ex: 4829

    // 2. Redirection vers le lien officiel Wave Marchand
    window.location.href = "https://pay.wave.com/m/M_ci_7X1JfUg2eEsX/c/ci/?src=p";

  } catch (err) {
    alert("Erreur lors de la validation : " + err.message);
  }
}
```

---

## 📡 5. Les Endpoints Standards à implémenter sur la Gateway

| Méthode | Endpoint | Rôle |
| :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Liste de tous les produits avec prix et photos. |
| `GET` | `/api/v1/categories` | Liste des 5 catégories. |
| `POST` | `/api/v1/orders` | Enregistrement de la commande et création du **Code PIN de retrait**. |
| `GET` | `/api/v1/orders/:orderId` | Statut de préparation en direct (*Reçue ➔ Payée ➔ En préparation ➔ Prête ➔ Récupérée*). |
| `POST` | `/api/v1/payments/wave/webhook` | Webhook de confirmation automatique envoyé par Wave. |
| `POST` | `/api/v1/reviews` | Enregistrement des avis 5 étoiles après retrait (+20 pts VIP). |
