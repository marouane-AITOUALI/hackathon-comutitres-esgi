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

La stack Docker démarre le frontend, le backoffice, le backend, PostgreSQL et
un reverse proxy Nginx :

```bash
docker compose up --build
```

Les services sont disponibles sur :

- frontend : http://localhost:8080
- backoffice : http://admin.localhost:8080
- API : http://localhost:8080/api/health

La base PostgreSQL locale n'expose pas son port sur la machine.

Pour utiliser personnellement la base Supabase Production renseignée dans
`backend/.env` au lieu de la base locale, lancer :

```bash
npm run docker:up:supabase
```

`RUN_MIGRATIONS=false` protège la base de production contre l'exécution
automatique des migrations depuis la machine locale. Le conteneur PostgreSQL
local reste présent dans la stack mais n'est alors pas utilisé par le backend.

Pour arreter et supprimer les conteneurs :

```bash
docker compose down
```

Le fichier `deploy.yaml` constitue l'ébauche Docker Swarm. Les Docker Secrets
déclarés dans ce fichier sont utilisés uniquement par Swarm.

Exemple de simulation des secrets avant `docker stack deploy` :

```bash
printf '%s' 'mot-de-passe-postgres' | docker secret create postgres_password -
printf '%s' 'secret-jwt' | docker secret create jwt_secret -
printf '%s' 'https://projet.supabase.co' | docker secret create supabase_url -
printf '%s' 'cle-anon' | docker secret create supabase_anon_key -
printf '%s' 'cle-service-role' | docker secret create supabase_service_role_key -
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

Le backend lance aussi les migrations automatiquement au demarrage via
`db:migrate:auto` avant `dev` et `start`. `db:migrate` et `db:seed` restent
disponibles pour une execution manuelle et ecrivent dans la base configuree.
Ne lancer ces commandes sur Supabase qu'apres validation de la migration locale.

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
