# Backoffice Comutitres

Le backoffice permet au personnel Comutitres de piloter les dossiers issus du
parcours client : souscriptions, porteur/payeur, documents, paiements simules
et alertes support.

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
- `/users` : utilisateurs publics sans `passwordHash`, avec archivage et reactivation.
- `/offers` : catalogue des offres et documents requis.
- `/communications` : annonces generales et rappels cibles, diffuses en temps reel.

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
- `PATCH /api/admin/users/:id/archive`
- `GET /api/admin/offers`
- `POST /api/admin/offers`
- `PATCH /api/admin/offers/:id`
- `GET /api/admin/support-alerts`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/:id/unread`
- `DELETE /api/notifications/:id`
- `GET /api/admin/communications`
- `POST /api/admin/communications`

## Innovation demo

Le backoffice ne se limite pas a une liste de dossiers. Il transforme les
signaux metier en actions :

- un justificatif ambigu devient une revue manuelle ;
- un paiement refuse cree une alerte support ;
- une cloche temps reel remonte les dossiers, documents, paiements et renouvellements a traiter ;
- une communication generale peut cibler les clients, le backoffice ou les deux ;
- les next actions indiquent quoi faire pour debloquer le dossier ;

Cette logique montre comment reduire les appels support : l'equipe voit les
blocages avant que l'usager ne se perde dans le parcours.

## Diffusion des communications

Dans le prototype, tout compte ayant le role `admin` peut agir comme manager et
publier une communication. La publication cree une ligne `communications`, puis
une ligne `notifications` par destinataire pour simplifier le temps reel, les
compteurs non lus et la suppression individuelle.

Pour une volumetrie importante, le modele recommande est different :

- une seule ligne pour la communication generale ;
- une table de recus legere par utilisateur uniquement pour les etats lu,
  masque ou acquitte ;
- les notifications metier individuelles restent dans `notifications`.
