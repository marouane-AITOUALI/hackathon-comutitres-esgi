# Comutitres - parcours de souscription unifié

Prototype réalisé pour le hackathon ESGI 2026. La solution aide les voyageurs à
choisir le titre adapté, constituer leur dossier et suivre leur souscription.
Elle fournit également à Comutitres un backoffice de pilotage des dossiers,
justificatifs, paiements et alertes support.

## Fonctionnalités livrées

### Parcours voyageur

- orientation guidée parmi les offres Navigo, Imagine R, TST et Améthyste ;
- recommandation expliquée selon le profil, l'âge et les déplacements ;
- gestion distincte du porteur et du payeur ;
- dépôt, analyse et suivi des justificatifs ;
- paiement direct ou mandat SEPA simulé ;
- suivi des souscriptions, renouvellements et actions prioritaires ;
- interface responsive, français/anglais et options d'accessibilité.

### Backoffice Comutitres

- tableau de bord des dossiers et blocages prioritaires ;
- contrôle et décision sur les justificatifs ;
- validation, refus ou suspension d'une souscription ;
- détection des paiements à régulariser et alertes support ;
- gestion des offres, communications, utilisateurs et journal d'activité ;
- accès administrateur protégé par rôle.

### Qualité et exploitation

- maquettes réalisées sur Figma et suivi des tâches avec Trello ;
- monorepo TypeScript : React pour les interfaces, Express pour l'API ;
- PostgreSQL/Supabase avec Drizzle ORM ;
- validation des données, mots de passe hachés et secrets hors du dépôt ;
- Docker pour l'application et ses services ;
- configurations de déploiement Vercel et Render ;
- tests automatisés sur les règles métier ;
- Prometheus, Grafana, Umami et GlitchTip en option.

## Prérequis

- Docker et Docker Compose ;
- un projet PostgreSQL/Supabase ;
- Git.

## Lancement étape par étape

### 1. Configurer le backend

```bash
cp backend/.env.example backend/.env
```

Renseigner au minimum dans `backend/.env` :

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=une-valeur-longue-et-aleatoire
```

### 2. Lancer l'application

```bash
docker compose up -d --build
```

Le backend applique automatiquement les migrations au démarrage.

### 3. Préparer les données de démonstration

```bash
docker compose exec backend npm run db:seed:admin
docker compose exec backend npm run db:seed:demo
```

### 4. Ouvrir les applications

| Service | URL |
| --- | --- |
| Espace voyageur | http://localhost:5173 |
| Backoffice | http://localhost:5174 |
| État de l'API | http://localhost:3001/api/health |

Comptes de démonstration :

| Espace | Identifiant | Mot de passe |
| --- | --- | --- |
| Voyageur | `parent.demo@example.com` | `Demo123!` |
| Backoffice | `admin@comutitres.fr` | `Admin123!` |

### 5. Arrêter l'application

```bash
docker compose down
```

## Lancement avec observabilité

Créer le fichier local de configuration :

```bash
cp .env.observability.example .env.observability
```

Renseigner si disponibles :

- `UMAMI_WEBSITE_ID` pour mesurer l'usage ;
- `GLITCHTIP_DSN` pour remonter les erreurs ;
- des mots de passe locaux différents des valeurs d'exemple.

Lancer l'application et toute la supervision :

```bash
docker compose \
  --env-file .env.observability \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  up -d --build
```

| Outil | URL |
| --- | --- |
| Grafana | http://localhost:3002 |
| Umami | http://localhost:3003 |
| GlitchTip local | http://localhost:8000 |
| Prometheus | http://localhost:9090 |

Arrêter toute la stack :

```bash
docker compose \
  --env-file .env.observability \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  down
```

## Vérifications

```bash
npm install
npm run typecheck
npm run lint
npm test
```

## Documentation

- [Maquettes Figma](https://www.figma.com/design/cBd3sh1OZO03TAXyUreRBl/comutitres?node-id=90-16&t=UuhQFTNTu57vzvuk-1)
- [Scénario de démonstration](docs/demo-scenario.md)
- [Architecture](docs/architecture.md)
- [Backoffice](docs/backoffice.md)
- [Modèle de données](docs/database-model.md)
- [Principes RGPD](docs/rgpd.md)
- [Observabilité](docs/observability.md)
