# Observabilité locale

La stack d'observabilité est définie dans un fichier Compose séparé afin de ne
pas modifier le comportement de l'environnement existant.

## Démarrage

Copier les variables d'exemple si elles doivent être personnalisées :

```bash
cp .env.observability.example .env.observability
```

Lancer l'application et les outils :

```bash
docker compose \
  --env-file .env.observability \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  up -d --build
```

Sans fichier `.env.observability`, les valeurs locales par défaut du Compose
permettent également de lancer la stack :

```bash
docker compose \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  up -d --build
```

Le classique `docker compose up -d --build` continue de lancer uniquement
l'application.

## Accès

| Outil | URL locale | Rôle |
| --- | --- | --- |
| Prometheus | http://localhost:9090 | Collecte les métriques de l'API |
| Grafana | http://localhost:3002 | Affiche le tableau de bord Comutitres |
| Umami | http://localhost:3003 | Mesure l'usage du parcours |
| GlitchTip | http://localhost:8000 | Centralise les erreurs applicatives |

L'application utilise également :

| Service | URL locale |
| --- | --- |
| Frontend voyageur | http://localhost:5173 |
| Backoffice | http://localhost:5174 |
| API | http://localhost:3001/api/health |

Les bases PostgreSQL et Valkey n'exposent aucun port sur la machine hôte.

Grafana est préconfiguré avec Prometheus comme source et charge automatiquement
le tableau de bord `Comutitres — API`.

## Configuration initiale

### Umami

1. Se connecter à Umami.
2. Créer un site pour le frontend Comutitres.
3. Récupérer l'identifiant du site.
4. Renseigner `UMAMI_WEBSITE_ID` dans `.env.observability`.
5. Recréer le conteneur frontend.

Le frontend charge automatiquement le script Umami lorsque cet identifiant est
présent. Sans identifiant, aucun script de mesure n'est injecté.

Umami possède sa propre base PostgreSQL. Elle n'est pas exposée sur la machine
hôte et ne partage pas les données métier de Comutitres.

### GlitchTip

1. Créer une organisation et un projet GlitchTip.
2. Copier le DSN proposé.
3. Renseigner `GLITCHTIP_DSN` dans `.env.observability`.
4. Recréer les conteneurs frontend et backend.

Les SDK compatibles Sentry sont initialisés automatiquement lorsque le DSN est
présent. Le frontend remonte les erreurs JavaScript non gérées et le backend
remonte les erreurs serveur inattendues. Les erreurs métier attendues et les
validations utilisateur ne sont pas signalées.

GlitchTip utilise une base PostgreSQL et Valkey dédiés, non exposés sur la
machine hôte.

## Arrêt

```bash
docker compose \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  down
```

Les volumes conservent les tableaux de bord, métriques, événements et comptes.
L'option `down -v` efface ces données et ne doit être utilisée que volontairement.

## Dépannage du backend

Si le backend est `unhealthy` après l'ajout d'une dépendance, son ancien volume
`node_modules` peut masquer les dépendances installées dans l'image reconstruite.

Mettre à jour le volume puis reprendre le démarrage :

```bash
docker compose \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  exec backend npm install --ignore-scripts

docker compose \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  restart backend

docker compose \
  -f compose.yml \
  -f compose.observability.yml \
  --profile observability \
  up -d
```
