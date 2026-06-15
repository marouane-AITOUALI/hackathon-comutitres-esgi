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

## Base de donnees

```bash
cd backend
npm run db:generate
npm run db:migrate
```

Le modele conceptuel est documente dans `docs/database-model.md`.
