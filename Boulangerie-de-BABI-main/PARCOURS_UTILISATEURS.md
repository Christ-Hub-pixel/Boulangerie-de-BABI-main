# 🥖 Parcours Utilisateurs & Cartographie Click & Collect — Boulangerie de BABI

> **Document de Référence :** Parcours Client Click & Collect, Gestion Fournil & Comptoir  
> **Modèle Économique :** Commande en ligne, Préparation artisanale au Fournil & Retrait Express en Boutique (0 FCFA)  
> **Localisation Officielle :** Cocody Riviera 2, Boulevard Sainte Famille, Abidjan - Côte d'Ivoire  

---

## 🛍️ 1. Parcours Officiel du Client (Customer Journey)

Ce schéma détaille chaque étape du parcours : **Choisir le produit ➔ Commander ➔ Mode de paiement ➔ Réserver le créneau ➔ Cuisson au fournil ➔ N° de Retrait ➔ Passage à la Boulangerie ➔ Colis Récupéré**.

```mermaid
flowchart TD
    A["1️⃣ CHOISIR LE PRODUIT\n(Pains, Viennoiseries, Pâtisseries, Jus Frais)"] --> B["2️⃣ COMMANDER\n(Mise au panier 1-clic & Validation de la commande)"]
    
    B --> C{"3️⃣ MODE DE PAIEMENT\n& RÉSERVATION"}
    C -->|Wave Mobile Money| P1["🌊 Paiement Wave QR / App"]
    C -->|Orange Money| P2["🍊 Code Push USSD #144*82#"]
    C -->|MTN / Moov| P3["🟡 MTN MoMo / Moov Money"]
    C -->|Espèces au Guichet| P4["💵 Paiement Cash au Comptoir"]
    
    P1 --> D["⏰ RÉSERVER LE CRÉNEAU\n(Dès que possible 15-20 min, 1h, Fournée du soir...)"]
    P2 --> D
    P3 --> D
    P4 --> D
    
    D --> E["🔥 PRÉPARATION & CUISSON AU FOURNIL\n(Notification en direct sur suivi.html)"]
    
    E --> F["🎫 GÉNÉRATION DU N° DE RETRAIT & CODE SECRET\n(Ex: Commande #BABI-CMD-884920 | Code Guichet: 6005)"]
    
    F --> G["🏪 PASSAGE À LA BOULANGERIE\n(Cocody Riviera 2 - Église Sainte Famille)"]
    
    G --> H["🛍️ 6️⃣ COLIS RÉCUPÉRÉ AU COMPTOIR\n(Présentation du N° de retrait sans faire la queue !)"]
```

---

## 👨‍💼 2. Parcours de l'Équipe Fournil & Comptoir (Merchant Flow)

Ce schéma décrit le processus de traitement des réservations par l'équipe en boutique :

```mermaid
flowchart TD
    A1["🔔 Réception de la Commande (#BABI-CMD-XXX)"] --> B1["🥖 Cuisson & Emballage au Fournil"]
    B1 --> C1["📦 Mise en sachet & Étiquetage avec le N° de Retrait"]
    C1 --> D1["📲 Passage au statut : 'Prêt au Comptoir' (Alerte WhatsApp/Web)"]
    D1 --> E1["🤝 Accueil du client au Guichet Express"]
    E1 --> F1["✅ Saisie du Code Secret ➔ Colis Remis & Validé"]
```

---

## 📋 Tableau Récapitulatif des Étapes du Client

| Étape | Action Client | Interface / Page | Résultat / Notification |
| :--- | :--- | :--- | :--- |
| **1. Choisir** | Explore le catalogue et les catégories | [index.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/index.html) & [produits.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/produits.html) | Produits ajoutés au panier |
| **2. Commander** | Renseigne son nom & numéro de téléphone | [cart.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/cart.html) & [checkout.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/checkout.html) | Panier validé sans frais (0 FCFA) |
| **3. Payer & Réserver** | Sélectionne Wave / OM / Espèces et choisit l'heure de retrait | [checkout.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/checkout.html) | Créneau réservé au fournil |
| **4. Préparation (Prêt)** | Suit l'état d'avancement de la cuisson | [suivi.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/suivi.html) | Notification : *« Prête au comptoir ! »* |
| **5. N° de Retrait** | Récupère son N° de commande & Code PIN | [suivi.html](file:///c:/Users/ezemi/Downloads/Boulangerie-de-BABI-main/Boulangerie-de-BABI-main/suivi.html) & WhatsApp | Ticket & QR Code de retrait généré |
| **6. Colis Récupéré** | Vient à la boutique de Cocody Riviera 2 | Comptoir Boulangerie de BABI | Colis tout chaud remis en mains propres |
