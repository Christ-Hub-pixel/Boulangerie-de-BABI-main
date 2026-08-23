# 🥖 Parcours Utilisateurs & Cartographie Click & Collect — Boulangerie de BABI

> **Document de Référence :** Parcours Client Click & Collect, Gestion Fournil & Comptoir  
> **Modèle Économique :** Réservation 100% Wave en ligne, Préparation artisanale au Fournil & Retrait Express en Boutique (0 FCFA)  
> **Localisation Officielle Unique :** Riviera (En face de l'école Jules Verne), Abidjan - Côte d'Ivoire  

---

## 🛍️ 1. Parcours Officiel du Client (Customer Journey)

Ce schéma détaille chaque étape du parcours : **Choisir le produit ➔ Commander ➔ Paiement Sécurisé Wave ➔ Réserver le créneau ➔ Cuisson au fournil ➔ Code PIN de Retrait ➔ Passage à la Boulangerie ➔ Colis Récupéré**.

```mermaid
flowchart TD
    A["1️⃣ CHOISIR LE PRODUIT\n(Pains, Viennoiseries, Pâtisseries, Jus Frais)"] --> B["2️⃣ COMMANDER\n(Mise au panier 1-clic & Validation des coordonnées)"]
    
    B --> C["3️⃣ PAIEMENT OBLIGATOIRE WAVE\n(0% Frais • Débit Mobile Money sécurisé)"]
    
    C --> D["4️⃣ RÉSERVER LE CRÉNEAU\n(Dès que possible 15-20 min, 1h, Fournée du soir...)"]
    
    D --> E["🔥 PRÉPARATION & CUISSON AU FOURNIL\n(Notification en direct sur suivi.html)"]
    
    E --> F["🎫 GÉNÉRATION DU CODE PIN DE RETRAIT\n(Ex: Commande #1042 | Code PIN: 7890)"]
    
    F --> G["🏪 PASSAGE À LA BOULANGERIE UNIQUE\n(Riviera - En face de l'école Jules Verne)"]
    
    G --> H["🛍️ 6️⃣ COLIS RÉCUPÉRÉ AU COMPTOIR\n(Saisie du PIN par la caissière sans faire la queue !)"]
```

---

## 👨‍💼 2. Parcours de l'Équipe Fournil & Comptoir (Merchant Flow)

Ce schéma décrit le processus de traitement des réservations par l'équipe en boutique :

```mermaid
flowchart TD
    A1["🔔 Réception de la Commande (#1042)"] --> B1["🥖 Cuisson & Emballage au Fournil"]
    B1 --> C1["📦 Mise en sachet & Étiquetage avec le N° de Commande"]
    C1 --> D1["📲 Passage au statut : 'Prête au Comptoir'"]
    D1 --> E1["🤝 Accueil du client au Comptoir Express Click & Collect"]
    E1 --> F1["✅ Saisie du Code PIN sur le terminal POS ➔ Commande Remise & Scellée"]
```

---

## 📋 Tableau Récapitulatif des Étapes du Client

| Étape | Action Client | Interface / Page | Résultat / Notification |
| :--- | :--- | :--- | :--- |
| **1. Choisir** | Explore le catalogue et les catégories | `index.html` & `produits.html` | Produits ajoutés au panier |
| **2. Commander** | Renseigne son nom & numéro de téléphone | `cart.html` & `checkout.html` | Coordonnées validées |
| **3. Payer & Réserver** | Règle par Wave Money et choisit l'heure de retrait | `checkout.html` | Paiement validé & créneau réservé |
| **4. Préparation** | Suit l'état d'avancement au fournil | `suivi.html` | Notification : *« Prête au comptoir ! »* |
| **5. Code PIN** | Reçoit son Code PIN confidentiel unique | `suivi.html` & WhatsApp | Pass PIN à 4 chiffres généré |
| **6. Retrait au Fournil** | Vient à l'unique boutique de Riviera (Jules Verne) | Comptoir Retrait Express POS | Colis tout chaud remis en mains propres |
