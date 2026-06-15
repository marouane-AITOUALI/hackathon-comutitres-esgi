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
`backend/.env` avec `DATABASE_URL`.

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
```

Le modele conceptuel est documente dans `docs/database-model.md`.
