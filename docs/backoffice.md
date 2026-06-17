# Backoffice Comutitres

Le backoffice permet au personnel Comutitres de piloter les dossiers issus du
parcours client : souscriptions, porteur/payeur, documents, paiements simules,
alertes support et audit logs.

## Acces admin

Preparer un compte admin :

```bash
npm run db:seed:admin --workspace backend
```

Identifiants par defaut :

```txt
admin@comutitres.fr
Admin123!
```

Ces valeurs peuvent etre surchargees dans `backend/.env` avec :

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_FIRST_NAME=
ADMIN_LAST_NAME=
```

La session backoffice utilise un cookie `HttpOnly` pose par le backend. Le
backoffice n'ecrit pas le JWT admin dans `localStorage`.

## Pages

- `/login` : connexion admin, refus si `role !== "admin"`.
- `/dashboard` : statistiques, alertes prioritaires et dernieres souscriptions.
- `/subscriptions` : liste filtrable des dossiers.
- `/subscriptions/:id` : porteur, payeur, documents, paiements et next actions.
- `/documents` : analyse documentaire par regles, validation et refus.
- `/support-alerts` : signaux qui anticipent les appels support.
- `/users` : utilisateurs publics sans `passwordHash`.
- `/offers` : catalogue des offres et documents requis.
- `/audit-logs` : journal prototype derive des statuts existants.

## Endpoints utilises

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/stats`
- `GET /api/admin/subscriptions`
- `GET /api/admin/subscriptions/:id`
- `PATCH /api/admin/subscriptions/:id/status`
- `GET /api/subscriptions/:id/next-actions`
- `GET /api/admin/documents/pending`
- `PATCH /api/admin/documents/:id/review`
- `POST /api/documents/:id/analyze`
- `GET /api/documents/:id/analysis`
- `POST /api/payments/:id/regularize`
- `GET /api/admin/users`
- `GET /api/admin/offers`
- `POST /api/admin/offers`
- `PATCH /api/admin/offers/:id`
- `GET /api/admin/support-alerts`
- `GET /api/admin/audit-logs`

## Innovation demo

Le backoffice ne se limite pas a une liste de dossiers. Il transforme les
signaux metier en actions :

- un justificatif ambigu devient une revue manuelle ;
- un paiement refuse cree une alerte support ;
- les next actions indiquent quoi faire pour debloquer le dossier ;
- les audit logs aident a expliquer ce qui s'est passe.

Cette logique montre comment reduire les appels support : l'equipe voit les
blocages avant que l'usager ne se perde dans le parcours.
