# OrdiSpace — Administration

Back-office web (Next.js) des administrateurs OrdiSpace : pilotage de tous les espaces de la plateforme — opérations et catalogue, commandes, clients, commerciaux, fournisseurs, livreurs, maintenance, coordinateurs, finance et rapports.

Elle consomme l'API du dépôt [`Ordi-Space_backend`](https://github.com/Daymond2025/Ordi-Space_backend) (Laravel) via des jetons Bearer (Sanctum).

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4
- Authentification : e-mail + mot de passe, puis code de double authentification reçu par e-mail
- Contexte React pour la session (`context/`), client HTTP unique (`lib/api.ts`)

## Fonctionnalités principales

- **Dashboard** et **Reports** — indicateurs généraux de la plateforme.
- **Opérations** — catalogue (produits, catégories, création/modification), discussions produit, négociation de prix.
- **Commandes** — commandes et paiements de confirmation.
- **Clients** — liste, fiche client (activités, commandes, garanties, profil, lien WhatsApp d'invitation), création d'un client avec sa commande, **suppression définitive**, privilèges et fidélité, GarantiX, maintenance et déclarations de panne, techniciens, réclamations, assistance (FAQ) et contenus (tutoriels).
- **Commerciaux, fournisseurs, livreurs, coordinateurs** — fiches, listes, retraits et réponses rapides.
- **Finance** — validation des retraits.
- **Settings** — compte, administrateurs et espaces autorisés.

Un administrateur peut être « restreint » à certains espaces : le backend vérifie chaque accès (middleware `espace:…`), l'interface masque les entrées non autorisées (`lib/nav.ts`).

## Structure du projet

```text
app/
├── login/                 # Connexion + double authentification, mot de passe oublié
└── (admin)/               # Pages avec la navigation de l'administration
    ├── operations/        # Catalogue, catégories, discussions produit
    ├── commandes/
    ├── clients/           # Liste, fiche (consultation/[id]), nouveau, SAV, privilèges, contenus…
    ├── commerciaux/, fournisseurs/, livreurs/, coordinateurs/
    ├── maintenance/, finance/, reports/, settings/
components/                # Coquille (sidebars, topbar), modales, discussion, icônes
context/                   # AuthContext (session, rôle, espaces)
lib/
├── api.ts                 # Client HTTP (fetch + erreurs API normalisées)
├── nav.ts                 # Navigation par espace
└── types.ts               # Types partagés
```

## Démarrage

Prérequis : Node.js 20+, et l'API backend lancée (localement ou en pointant vers la prod).

```bash
npm install
cp .env.example .env.local   # renseigner les variables ci-dessous
npm run dev                  # http://localhost:3000
```

Pour lancer plusieurs applications OrdiSpace en même temps, choisir un autre port (`npm run dev -- -p 3001`) et l'ajouter à `CORS_ALLOWED_ORIGINS` dans le `.env` du backend.

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de base de l'API (ex. `http://127.0.0.1:8000/api/v1` en local, `https://ordisapce.daymondboutique.com/api/v1` en production) |
| `NEXT_PUBLIC_CLIENT_APP_URL` | URL de l'application Client, utilisée pour le lien d'invitation envoyé par WhatsApp depuis la fiche client |

Aucune clé secrète ne doit se trouver dans cette app : c'est un client public, tout appel sensible passe par l'API.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |

## Déploiement

Production : `ordispace.admin.daymondboutique.com`. Configurer `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_CLIENT_APP_URL` sur l'hébergeur, et garder le domaine dans `CORS_ALLOWED_ORIGINS` côté backend. Tout nouveau domaine d'API doit être ajouté à `images.remotePatterns` dans `next.config.ts` (images produits servies depuis `/storage`).
