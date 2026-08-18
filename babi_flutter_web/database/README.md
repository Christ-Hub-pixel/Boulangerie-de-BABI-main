# 🐘 Base de Données PostgreSQL - Boulangerie de BABI

Ce dossier contient l'ensemble des fichiers nécessaires pour déployer et administrer la base de données PostgreSQL locale de la **Boulangerie de BABI**.

---

## 📁 Contenu du dossier

| Fichier | Description |
| :--- | :--- |
| [`schema.sql`](file:///c:/Users/user/Downloads/Boualangerie%20de%20babi/babi_flutter_web/database/schema.sql) | Définition des types ENUM, des 10 tables relationnelles, des contraintes, index et vues analytiques. |
| [`seed.sql`](file:///c:/Users/user/Downloads/Boualangerie%20de%20babi/babi_flutter_web/database/seed.sql) | Données initiales : 4 rôles, 5 catégories, 60+ produits avec prix en FCFA et photos, codes promo et commande test avec PIN. |
| [`docker-compose.yml`](file:///c:/Users/user/Downloads/Boualangerie%20de%20babi/babi_flutter_web/database/docker-compose.yml) | Orchestration Docker pour lancer PostgreSQL 16 et pgAdmin 4 localement en 1 clic. |

---

## 🗄️ Structure des Tables

1. **`users`** : Gestion des comptes (Client, Caissière, Gérante, Administrateur), mot de passe chiffré, points fidélité et tier VIP.
2. **`bakery_counters`** : Points de retrait au comptoir (horaires, géolocalisation).
3. **`categories`** : Les 5 rayons (Boulangerie, Viennoiseries, Gâteaux & Cakes, Desserts, Boissons).
4. **`products`** : Tous les articles avec prix unitaire en FCFA, image `.webp`, statut de disponibilité et popularité.
5. **`orders`** : Commandes Click & Collect, statut en 5 étapes, sous-total, remise, **Code PIN secret de retrait**, référence Wave ou monnaie espèces.
6. **`order_items`** : Snapshot immuable des prix unitaires et sous-totaux appliqués au moment de la validation.
7. **`payments`** : Historique des transactions (Wave / Espèces) avec URL officielle marchande Wave.
8. **`product_reviews`** : Notes 5 étoiles, critères d'appréciation et avis client post-retrait (+20 points fidélité).
9. **`promo_codes`** : Codes de réduction (`BABI10`, `VIP20`, `BIENVENUE`).
10. **`loyalty_transactions`** : Journal d'attribution et d'utilisation des points club VIP.

---

## 🚀 Démarrage Rapide (avec Docker)

Pour démarrer PostgreSQL et l'interface d'administration pgAdmin 4 :

```bash
cd database
docker compose up -d
```

* **Serveur PostgreSQL** : `localhost:5432`
  * Base : `boulangerie_de_babi`
  * Utilisateur : `babi_admin`
  * Mot de passe : `BabiPassword2026!`
* **Interface pgAdmin 4** : `http://localhost:5050`
  * Email : `admin@boulangeriedebabi.ci`
  * Mot de passe : `BabiAdmin2026!`

---

## 🛠️ Import Manuel (sans Docker)

Si vous disposez déjà d'une instance PostgreSQL locale :

```bash
psql -U postgres -d boulangerie_de_babi -f database/schema.sql
psql -U postgres -d boulangerie_de_babi -f database/seed.sql
```
