# Hackathon Comutitres ESGI

Monorepo TypeScript pour la refonte du parcours utilisateur Comutitres.

## Workflow Git

Les developpements sont realises et pousses sur `develop`. La branche `main`
reste reservee a la mise en production finale lorsque l'ensemble est valide.

## Stack

- `frontend` : React, Vite, TypeScript, MUI, React Router et Tailwind CSS
- `backend` : Node.js, Express, TypeScript, Drizzle ORM et Supabase
- `backoffice` : React, Vite, TypeScript, MUI, React Router et Tailwind CSS

## Installation

```bash
npm install
```

Copier ensuite les fichiers `.env.example` en `.env` dans chaque application.
Pour Drizzle, recuperer l'URL PostgreSQL Supabase et renseigner
`backend/.env` avec `DATABASE_URL`. Generer egalement une valeur longue et
aleatoire pour `JWT_SECRET`.

## Developpement

```bash
npm run dev:frontend
npm run dev:backend
npm run dev:backoffice
```

## Docker

Renseigner d'abord `backend/.env`, puis lancer tout l'environnement de
developpement avec hot reload :

```bash
docker compose up --build
```

Les services sont disponibles sur :

- frontend : http://localhost:5173
- backend : http://localhost:3001/api/health
- backoffice : http://localhost:5174

Pour arreter et supprimer les conteneurs :

```bash
docker compose down
```

Pour tester les images de production :

```bash
docker compose -f compose.prod.yml up --build
```

Le frontend est alors disponible sur http://localhost:8080 et le backoffice
sur http://localhost:8081. L'API Docker utilise le port hote `3001` pour
eviter les conflits avec un backend lance localement sur `3000`.

Les ports peuvent etre modifies avant le lancement :

```powershell
$env:API_PORT=4000
docker compose up --build
```

## Base de donnees

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed:admin
npm run db:seed:demo
```

Le modele conceptuel est documente dans `docs/database-model.md`.

`db:migrate` et `db:seed` ecrivent dans la base configuree. Ne lancer ces
commandes sur Supabase qu'apres validation de la migration locale.

Les seeds de demo sont idempotents :

- `db:seed:admin` prepare `admin@comutitres.fr / Admin123!` ou les valeurs
  `ADMIN_*` definies dans `backend/.env`.
- `db:seed:demo` prepare les offres, un parent demo, un enfant porteur, une
  souscription Imagine R Scolaire, des justificatifs et des paiements simules.

## Parcours utilisateur

Le frontend propose :

- inscription et connexion email/mot de passe ;
- session prototype par JWT ;
- distinction porteur/payeur ;
- questions guidees sur le profil et les trajets ;
- recommandation explicable avec justificatifs potentiels.

Le bouton Ile-de-France Mobilites Connect est visible mais volontairement non
implemente dans cette version.

## Backoffice demo

Apres seed admin/demo, ouvrir le backoffice sur `/login` et se connecter avec :

```txt
admin@comutitres.fr
Admin123!
```

La session backoffice utilise un cookie `HttpOnly`. Le frontend utilisateur
conserve son stockage JWT prototype pour le parcours client.

Voir aussi :

- `docs/backoffice.md`
- `docs/demo-scenario.md`
