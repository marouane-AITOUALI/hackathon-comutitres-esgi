# Architecture

Le depot est un monorepo npm compose de trois applications :

- `frontend` : parcours client React, Vite, TypeScript, MUI et React Router.
- `backoffice` : administration React, Vite, TypeScript, MUI et React Router.
- `backend` : API REST Express et TypeScript.

Le backend utilise Supabase pour les services geres et Drizzle ORM pour acceder a
PostgreSQL avec une URL de connexion directe stockee dans `DATABASE_URL`.

Les interfaces suivent une structure simple :

- `components` : composants reutilisables et layouts.
- `pages` : composants associes aux routes.
- `hooks` : logique React reutilisable.
- `styles` : theme MUI et styles globaux.

L'API separe les responsabilites entre `routes`, `controllers`, `middleware`,
`config` et `db`.
