# 🥖 Architecture Technique du Projet — Boulangerie de BABI

> **Plateforme E-Commerce & Click & Collect Omnicanal avec Backend Ultra-Intelligent (BBE v3.0)**  
> **Localisation Officielle :** Riviera, Abidjan, Côte d'Ivoire  
> **Téléphones Officiels :** Fixe `27 00 00 00 00` | Mobiles `07 00 00 00 00` / `07 00 00 00 01`  

---

## 📌 1. Vue d'Ensemble & Modèle Économique

La plateforme **Boulangerie de BABI** est un écosystème commercial haut de gamme optimisé pour Abidjan, reposant sur un modèle **100% Click & Collect / Retrait Express au Fournil** :

1. **📱 Réservation en Ligne (Mobile App & Web PWA)** :
   - Le client réserve son pain ou ses viennoiseries depuis chez lui.
   - **Moyen de paiement exclusif en ligne : Wave Mobile Money** (garantit 0% de faux engagements et élimine l'attente).
   - Génération instantanée d'un **Code PIN unique confidentiel**.

2. **🏬 Retrait Express au Fournil (Comptoir Dédié)** :
   - Le client se présente au comptoir sans faire la queue.
   - La caissière saisit le code PIN sur son terminal tactile POS pour valider la remise.

3. **💵 Ventes Directes en Boutique (Clients sur place)** :
   - Les clients venus physiquement faire la queue peuvent régler en Espèces (Cash) ou Wave directement à la caisse.

---

## 📐 2. SCHÉMAS VISUELS DE L'ARCHITECTURE (DIAGRAMMES)

### 📊 Schéma 1 : Architecture Globale du Système Connecté

```mermaid
flowchart TB
    subgraph CLIENT["📱 CLIENT (Mobile App Flutter & Web PWA)"]
        UI["🎨 Interface Client (Catalogue, Panier, Accords Gourmands)"]
        WAVE_PAY["🌊 Paiement Exclusif Wave Mobile Money"]
        PIN_GEN["🔑 Code PIN Unique de Retrait"]
    end

    subgraph BABI_BRAIN["🧠 BACKEND ULTRA-INTELLIGENT (BABI Brain Engine v3.0)"]
        ORCH["📡 Hub d'Orchestration Temps Réel"]
        PIN_VAL["🔐 Validateur Universel de PIN & Anti-Fraude"]
        AI_BAKE["🍞 Prédiction des Fournées & Pain Chaud"]
        AI_STOCK["📦 Conseiller Stocks & Anti-Gaspillage"]
        AI_BI["📈 Business Intelligence & Prévisions CA"]
        SQLITE[("🗄️ Base de Données SQLite (database.sqlite)")]
    end

    subgraph STATIONS["🏬 POSTES DE TRAVAIL EN BOUTIQUE"]
        CAISSE["💻 Caissière (POS Comptoir) : Alerte en direct & Validation PIN"]
        GERANTE["👩‍💼 Gérante : Impact stocks & planification fournil"]
        ADMIN["👔 Direction : Cockpit financier & contrôle des caisses"]
    end

    CLIENT -->|1. Commande & Paiement Wave| ORCH
    ORCH -->|2. Dispatch instantané| CAISSE
    ORCH -->|2. Dispatch instantané| GERANTE
    ORCH -->|2. Dispatch instantané| ADMIN

    CAISSE -->|3. Saisie du Code PIN au comptoir| PIN_VAL
    PIN_VAL -->|4. Validation atomique & clôture| ORCH
    ORCH -->|5. Confirmation immédiate sur smartphone| CLIENT
```

---

### 🔄 Schéma 2 : Parcours de Commande en Ligne & Retrait Express

```mermaid
sequenceDiagram
    autonumber
    actor C as Client Abidjan (Chez lui)
    participant App as App Mobile / Web PWA
    participant Backend as BABI Brain Engine
    actor K as Caissière au Comptoir (POS)

    C->>App: Consulte le catalogue & statut Pain Chaud
    C->>App: Ajoute les produits au panier
    C->>App: Choisit l'heure de retrait au fournil
    C->>App: Règle OBLIGATOIREMENT par Wave Mobile Money
    App->>Backend: Validation du paiement Wave & Création commande
    Backend-->>App: Émission du Code PIN confidentiel (ex: #7890)
    Backend->>K: Notification sonore & affichage de la commande à préparer
    
    Note over C,K: Le client se déplace au Fournil Riviera
    C->>K: Donne son Code PIN au comptoir Click & Collect
    K->>Backend: Saisie du Code PIN sur le terminal tactile
    Backend-->>K: Validation instantanée & Affichage des articles
    K->>C: Remise immédiate du sachet sans faire la queue
    K->>Backend: Clôture de la commande & Impression du reçu thermique
```

---

### 🧾 Schéma 3 : Ticket Thermique 80mm de Caisse

```text
+--------------------------------------------------+
|              BOULANGERIE DE BABI                 |
|         Riviera, Abidjan - Côte d'Ivoire         |
|           TEL: 27 00 00 00 00 / 07 00 00 00 00   |
|--------------------------------------------------|
| Ticket N°: #1042                                 |
| Date: 23 août 2026 à 18:30:15                    |
| Mode: CLICK & COLLECT (Paiement Wave Vérifié)    |
| Opérateur: Caissière Caisse 1                    |
| Code Retrait: #7890 (Validé & Scellé)            |
|--------------------------------------------------|
| Article                  Prix     Qte    Valeur  |
|--------------------------------------------------|
| BAGUETTE TRADITION      F 400     x2     F   800 |
| CROISSANT PUR BEURRE    F 600     x3     F 1 800 |
| JUS DE BISSAP MAISON    F 1000    x1     F 1 000 |
|--------------------------------------------------|
| TOTAL PAYÉ (WAVE) :                     F 3 600  |
| RETRAIT FOURNIL :                       GRATUIT  |
|--------------------------------------------------|
|        MERCI DE VOTRE VISITE ET À BIENTÔT !      |
|             BOULANGERIE DE BABI RIVIERA          |
+--------------------------------------------------+
```

---

## 🛠️ 3. Structure des 4 Rôles de la Plateforme

| Rôle | Interface | Responsabilités | Mode de Paiement |
| :--- | :--- | :--- | :--- |
| **Client** | `index.html`, `produits.html`, `cart.html`, `checkout.html`, `suivi.html`, App Mobile Flutter | Consultation, réservations, pain chaud en direct, suivi PIN. | **Wave Mobile Money Exclusif** |
| **Caissière** | `index.html` & `js/caissiere.js` | Réception en direct des commandes, validation PIN, encaissement sur place. | Validation PIN + Ventes Espèces/Wave |
| **Gérante** | `index.html` & `js/gerante.js` | Pilotage des fournées, alertes de stocks, mode anti-gaspillage. | Consultation |
| **Administrateur** | `index.html` & `js/admin.js` | Cockpit financier, gestion des accès caissières, audit de sécurité. | Trésorerie & Payouts |
