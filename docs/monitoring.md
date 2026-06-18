# Supervision avec Render et Grafana Cloud

Prometheus et Grafana ne font pas partie du `docker compose` applicatif. Le frontend et le backoffice sont hébergés par Vercel, tandis que le backend Render expose des métriques Prometheus sur :

```text
https://<backend-render>/api/metrics
```

En production, cette route exige l’en-tête `Authorization: Bearer <METRICS_TOKEN>`. Créer sur Render une variable secrète `METRICS_TOKEN` longue et aléatoire.

## Grafana Cloud

Grafana Cloud possède une offre gratuite. Il stocke et affiche les métriques, mais un collecteur doit récupérer la route Render puis les envoyer au stockage Prometheus de Grafana Cloud.

La solution recommandée est Grafana Alloy :

1. Créer un compte Grafana Cloud.
2. Ouvrir **Connections > Add new connection > Hosted Prometheus metrics**.
3. Récupérer l’URL `remote_write`, l’identifiant et un token d’accès métriques.
4. Déployer Alloy sur une machine toujours active ou un service de fond.
5. Utiliser [`monitoring/alloy/config.alloy.example`](../monitoring/alloy/config.alloy.example) avec les variables indiquées.
6. Importer [`monitoring/grafana/dashboards/comutitres-overview.json`](../monitoring/grafana/dashboards/comutitres-overview.json) dans Grafana Cloud.

Un second service Render consacré à Alloy est possible, mais les workers continus ne sont pas garantis gratuits. Le backend reste donc prêt pour Grafana Cloud sans imposer ce coût ni mélanger l’observabilité au déploiement applicatif.

En local, `http://localhost:3001/api/metrics` reste accessible sans token. Après modification d’une dépendance, recréer les volumes avec `docker compose down -v`, puis `docker compose up --build -d`.
