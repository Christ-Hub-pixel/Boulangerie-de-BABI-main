# Plan d'Implémentation : Boulangerie de Babi (Application Complète)

Ce document décrit la stratégie technique pour transformer la maquette statique actuelle en une application web dynamique complète, capable de supporter toutes les fonctionnalités listées dans le cahier des charges (gestion des utilisateurs, e-commerce, paiements mobiles, tableau de bord admin, etc.).

> [!IMPORTANT]
> **User Review Required**
> Veuillez examiner la pile technologique (Tech Stack) proposée ci-dessous et valider si elle vous convient. Étant donné l'ampleur du projet, nous devrons procéder par étapes.

## 1. Choix Technologiques (Tech Stack)

Actuellement, le projet est constitué de fichiers HTML et CSS statiques. Pour implémenter des fonctionnalités dynamiques (base de données, authentification, paiements), nous devons introduire un backend et une base de données.

**Proposition d'architecture :**
- **Frontend (Interface Utilisateur) :** Conservation de vos fichiers HTML/CSS actuels, dynamisés avec **Vanilla JavaScript** (ou migration vers un framework comme **React/Next.js** si vous souhaitez une application très réactive et moderne).
- **Backend (Serveur & Logique) :** **Node.js avec Express.js** (idéal pour les plateformes e-commerce rapides) ou utilisation de **Firebase** (Google) pour gérer l'authentification, la base de données en temps réel et l'hébergement de manière très fluide.
- **Base de données :** **MongoDB** (NoSQL) ou **PostgreSQL** (SQL) pour stocker les utilisateurs, les commandes, les produits et les points de fidélité.
- **Paiements :** Intégration d'une API de passerelle de paiement africaine (ex: **PaySika**, **CinPay**, **CinetPay** ou **Flutterwave**) pour gérer Wave, Orange Money, MTN et Moov.

## 2. Open Questions

> [!WARNING]
> **Questions pour vous (À clarifier avant de coder) :**
> 1. **Framework Frontend :** Souhaitez-vous que l'on garde les simples fichiers HTML/CSS actuels en y ajoutant du code JavaScript, ou préférez-vous que je convertisse le site en une application moderne (React / Next.js) plus robuste pour l'avenir ?
> 2. **Backend / Base de données :** Avez-vous une préférence pour la technologie serveur (ex: Firebase pour aller vite et sécurisé, ou un serveur Node.js classique) ?
> 3. **Paiement Mobile :** Avez-vous déjà un compte développeur chez un prestataire de paiement (comme CinetPay) pour intégrer Wave, Orange Money, etc. ?

## 3. Phases de Développement (Proposed Changes)

Le cahier des charges étant massif, voici comment nous allons structurer le développement :

---

### Phase 1 : Fondation & Authentification (Semaine 1)
- Mise en place de la base de données et de l'architecture serveur.
- Implémentation de la **Gestion des utilisateurs** (Inscription, Connexion, Profil).
- Sécurisation des mots de passe (hachage) et gestion des sessions.

### Phase 2 : Catalogue Dynamique & Panier (Semaine 2)
- Création de la base de données des **Produits** et affichage dynamique sur `produits.html`.
- Implémentation du système de recherche intelligente et des filtres de catégories/prix.
- Développement du **Panier d'achat** dynamique (stockage en session ou base de données), calcul des totaux.

### Phase 3 : Commandes & Paiements (Semaine 3)
- Création du flux de **Validation de commande** (Choix de livraison, utilisation des points de fidélité).
- Intégration de l'API de paiement mobile (Wave, MTN, Orange Money).
- Génération des factures et suivi des statuts de commande.

### Phase 4 : Fidélité, Promotions & Notifications (Semaine 4)
- Logique du **Programme de fidélité** (gain de points à chaque achat, conversion en réductions).
- Gestion des codes promo et des réductions automatisées.
- Système de notifications (e-mail de confirmation de commande).

### Phase 5 : Tableau de Bord Administrateur (Semaine 5)
- Création d'une interface sécurisée pour le propriétaire de la boulangerie.
- Gestion CRUD (Créer, Lire, Mettre à jour, Supprimer) pour les produits et les catégories.
- Suivi des commandes en cours et statistiques des ventes.

## 4. Verification Plan

- **Tests automatisés :** Mise en place de tests unitaires pour la logique du panier et le calcul des prix/points de fidélité pour éviter toute erreur de facturation.
- **Vérification Manuelle :** 
  - Déploiement sur un serveur de test (staging).
  - Simulation d'achats complets avec des numéros de test (Mobile Money sandbox).
  - Vérification de l'interface d'administration pour la gestion d'une commande fictive.
