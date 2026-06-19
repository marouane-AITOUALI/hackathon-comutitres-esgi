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

## Docker — application seule

Renseigner d'abord `backend/.env`, puis lancer tout l'environnement de
développement avec hot reload :

```bash
docker compose up -d --build
```

Les services sont disponibles sur :

- frontend : http://localhost:5173
- backend : http://localhost:3001/api/health
- backoffice : http://localhost:5174

Pour suivre les logs :

```bash
docker compose logs -f
```

Pour arrêter l'application seule :

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

## Docker — application avec observabilité

Une stack optionnelle ajoute Prometheus, Grafana, Umami et GlitchTip sans
modifier la commande de l'application seule :

```bash
docker compose -f compose.yml -f compose.observability.yml --profile observability up -d --build
```

Pour suivre les logs de cette stack :

```bash
docker compose -f compose.yml -f compose.observability.yml --profile observability logs -f
```

Pour arrêter l'application et toute l'observabilité :

```bash
docker compose -f compose.yml -f compose.observability.yml --profile observability down
```

Prometheus collecte les metriques exposees par l'API et Grafana charge
automatiquement un tableau de bord Comutitres. Umami et GlitchTip utilisent des
bases dediees, non exposees publiquement.

### Ports locaux

| Service | URL | Port hôte |
| --- | --- | --- |
| Frontend voyageur | http://localhost:5173 | `5173` |
| Backoffice | http://localhost:5174 | `5174` |
| API / healthcheck | http://localhost:3001/api/health | `3001` |
| API / métriques | http://localhost:3001/api/metrics | `3001` |
| Grafana | http://localhost:3002 | `3002` |
| Umami | http://localhost:3003 | `3003` |
| GlitchTip | http://localhost:8000 | `8000` |
| Prometheus | http://localhost:9090 | `9090` |

Les bases PostgreSQL d'Umami et GlitchTip ainsi que Valkey n'exposent aucun port
sur la machine. Elles sont accessibles uniquement entre conteneurs.

### Si le backend devient `unhealthy`

Après l'ajout d'une dépendance backend, l'ancien volume Docker
`backend_node_modules` peut masquer les dépendances de la nouvelle image.
Actualiser ce volume puis relancer la stack :

```bash
docker compose -f compose.yml -f compose.observability.yml --profile observability exec backend npm install --ignore-scripts
docker compose -f compose.yml -f compose.observability.yml --profile observability restart backend
docker compose -f compose.yml -f compose.observability.yml --profile observability up -d
```

Pour identifier la cause d'un conteneur défaillant :

```bash
docker compose -f compose.yml -f compose.observability.yml --profile observability ps -a
docker compose -f compose.yml -f compose.observability.yml --profile observability logs --tail=200 backend
```

Voir `docs/observability.md` pour les URLs, variables et etapes de configuration.

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
