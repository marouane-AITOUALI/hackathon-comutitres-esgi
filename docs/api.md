# API REST

URL locale par defaut : `http://localhost:3000/api`.

Les routes protegees attendent :

```http
Authorization: Bearer <token>
```

Le backoffice peut aussi utiliser le cookie `HttpOnly`
`comutitres_auth_token`, pose par `/auth/login` et envoye avec
`credentials: include`. Le header Bearer reste supporte pour le frontend
utilisateur prototype.

## Sante

### `GET /health`

Retourne l'etat de l'API et indique si `DATABASE_URL` est configuree.

## Authentification

### `POST /auth/register`

```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "Password123!",
  "rgpdConsent": true
}
```

Retourne l'utilisateur public et un JWT. Le mot de passe est hashe avec
bcryptjs avant stockage.

### `POST /auth/login`

```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

Retourne l'utilisateur public et un JWT.

### `GET /auth/me`

Route protegee qui retourne l'utilisateur lie au JWT ou au cookie de session,
sans `passwordHash`.

### `POST /auth/logout`

Efface le cookie de session backoffice et retourne `204`.

## Onboarding

### `POST /onboarding`

Route protegee. Cree le profil porteur, le profil payeur si necessaire et une
session d'orientation.

```json
{
  "subscriptionFor": "child",
  "isBearerPayer": false,
  "currentStep": "result",
  "bearer": {
    "firstName": "Lea",
    "lastName": "User",
    "birthDate": "2015-05-12",
    "status": "school"
  },
  "payer": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "relationshipToBearer": "parent"
  },
  "answers": {
    "frequency": "daily",
    "planPreference": "annual"
  }
}
```

### `GET /onboarding/:id`

Route protegee. Retourne uniquement une session appartenant a l'utilisateur
connecte, avec les profils porteur et payeur.

## Recommandation

### `POST /recommendations`

Route protegee. Retourne une orientation explicable :

```json
{
  "offerCode": "IMAGINE_R_SCOLAIRE",
  "offerName": "Imagine R Scolaire",
  "confidence": 0.9,
  "reasons": ["Le porteur est scolaire ou mineur."],
  "requiredDocuments": ["Piece d'identite", "Certificat de scolarite"],
  "warnings": []
}
```

Tous les payloads sont valides par Zod. Les erreurs utilisent un message
lisible et, pour la validation, des details par champ.

## Catalogue des offres

### `GET /offers`

Retourne les offres actives par defaut.

Query params optionnels :

- `includeInactive=true` pour inclure les offres desactivees ;
- `target=senior` pour filtrer par cible metier.

### `GET /offers/:code`

Retourne le detail d'une offre par code, par exemple `NAVIGO_ANNUEL`.

### `GET /offers/:code/required-documents`

Retourne les justificatifs potentiellement requis pour l'offre.

### `GET /offers/:code/conditions`

Retourne les conditions metier simples et les avertissements de l'offre.

### `GET /offers/compare?codes=NAVIGO_ANNUEL,LIBERTE_PLUS`

Compare entre deux et quatre offres pour aider le front et le backoffice a
expliquer les differences.

## Souscriptions

Toutes les routes sont protegees par JWT.

### `POST /subscriptions`

Cree une souscription en brouillon depuis une session onboarding ou des profils
explicites.

```json
{
  "onboardingSessionId": "uuid",
  "offerCode": "NAVIGO_ANNUEL"
}
```

### `GET /subscriptions`

Liste les souscriptions de l'utilisateur connecte avec offre, porteur, payeur et
resume de session.

### `GET /subscriptions/:id`

Retourne une souscription appartenant a l'utilisateur connecte.

### `PATCH /subscriptions/:id`

Modifie une souscription tant qu'elle est en brouillon : offre, session
onboarding, porteur ou payeur.

### `POST /subscriptions/:id/submit`

Soumet le brouillon. Le statut devient `pending_documents` si l'offre attend des
justificatifs, sinon `pending_payment` afin de passer par le paiement prototype.

### `POST /subscriptions/:id/cancel`

Annule la souscription.

### `POST /subscriptions/:id/suspend`

Suspend la souscription, utile pour les cas de refus ou de gestion SAV.

### `GET /subscriptions/:id/next-actions`

Retourne les prochaines actions conseillees pour un dossier : documents
manquants, revue documentaire, regularisation paiement ou validation finale.
Un admin peut appeler cette route pour alimenter le detail backoffice.

## Documents et verification IA prototype

Les routes liees a une souscription ou a un document existant sont protegees
par JWT. Le prototype ne stocke pas encore les fichiers : `fileUrl` represente
l'emplacement ou le nom du justificatif.

### `POST /documents/analyze/demo`

Route publique de demonstration hackathon. Elle lance l'analyse documentaire
simulee sans ecrire en base, utile pour montrer la verification IA gratuite
avant d'avoir une souscription creee.

```json
{
  "type": "school_certificate",
  "fileUrl": "certificat-scolarite-2026.pdf"
}
```

Retourne le type detecte, le score de confiance, les raisons, les alertes, les
signaux de fraude et `needs_manual_review`.

### `POST /subscriptions/:subscriptionId/documents`

Ajoute une piece justificative a une souscription de l'utilisateur connecte.

```json
{
  "type": "school_certificate",
  "fileUrl": "certificat-scolarite-2026.pdf"
}
```

### `GET /subscriptions/:subscriptionId/documents`

Liste les justificatifs d'une souscription.

### `GET /documents/:id`

Retourne un justificatif appartenant a l'utilisateur connecte.

### `DELETE /documents/:id`

Supprime un justificatif.

### `PATCH /documents/:id/status`

Met a jour le statut en revue manuelle : `pending`, `validated`, `rejected` ou
`needs_manual_review`.

### `POST /documents/:id/resubmit`

Remplace le fichier d'un justificatif refuse ou incomplet et le repasse en
`pending`.

### `POST /documents/:id/analyze`

Lance une verification gratuite basee sur des regles. Elle ne remplace pas une
vraie IA documentaire, mais fournit :

- un type detecte ;
- un score de confiance ;
- un statut suggere ;
- des raisons explicables ;
- des signaux de fraude simples.

### `GET /documents/:id/analysis`

Retourne le dernier resultat d'analyse.

### `POST /documents/:id/fraud-check`

Retourne un score de risque sans modifier le document.

### `POST /documents/:id/manual-review`

Enregistre la decision humaine du backoffice.

## Backoffice admin

Toutes les routes `/admin/*` sont protegees par JWT et demandent un utilisateur
avec `role: "admin"`. Elles servent au pilotage prototype : dossiers,
documents, offres et alertes support.

### `GET /admin/stats`

Retourne les compteurs principaux du dashboard : utilisateurs, souscriptions
par statut, documents par statut, offres actives et alertes support.

### `GET /admin/subscriptions`

Liste les souscriptions avec utilisateur, porteur, payeur, offre, session
onboarding et documents rattaches.

Query optionnelle :

- `status=pending_documents` pour filtrer par statut.

### `GET /admin/subscriptions/:id`

Retourne le detail d'une souscription pour revue backoffice.

### `PATCH /admin/subscriptions/:id/status`

Met a jour le statut d'une souscription.

```json
{
  "status": "accepted"
}
```

Statuts acceptes : `draft`, `pending_documents`, `pending_payment`, `pending_validation`,
`accepted`, `rejected`, `cancelled`, `suspended`.

## Paiements prototype

Toutes les routes `/payments/*` sont protegees par JWT. Elles simulent un
paiement gratuit pour le hackathon : aucun vrai PSP n'est appele, aucune carte
bancaire ni IBAN complet ne doit etre stocke.

### `POST /payments/simulate`

Calcule un montant estime et, si une souscription est fournie, enregistre une
trace de simulation.

```json
{
  "subscriptionId": "uuid",
  "paymentMode": "monthly"
}
```

### `POST /payments/direct`

Simule un paiement carte direct. `simulateFailure` permet de montrer un cas de
paiement refuse sans vrai prestataire.

```json
{
  "subscriptionId": "uuid",
  "cardToken": "demo-token",
  "simulateFailure": false
}
```

Un paiement accepte passe la souscription en `pending_validation`. Un paiement
refuse la passe en `pending_payment`.

### `POST /payments/mandate`

Simule un mandat SEPA. Pour le prototype, seul `ibanLast4` est conserve.

```json
{
  "subscriptionId": "uuid",
  "holderName": "Test User",
  "ibanLast4": "1234",
  "mandateAccepted": true
}
```

### `GET /payments/:id`

Retourne un paiement appartenant a l'utilisateur connecte. Un admin peut lire
tous les paiements.

### `POST /payments/:id/cancel`

Annule un paiement encore en attente ou une simulation.

### `POST /payments/:id/regularize`

Regularise un paiement refuse, annule ou en attente.

```json
{
  "note": "Regularisation manuelle prototype"
}
```

## Renouvellement et lifecycle

Toutes les routes sont protegees par JWT.

### `GET /subscriptions/:id/renewal`

Retourne la prochaine date estimee de renouvellement, les paiements rattaches,
les evenements de renouvellement et les alertes eventuelles.

### `POST /subscriptions/:id/renewal/accept`

Accepte le renouvellement et passe la souscription en `pending_payment`.

### `POST /subscriptions/:id/renewal/refuse`

Refuse le renouvellement et passe la souscription en `cancelled`.

### `POST /subscriptions/:id/renewal/suspend`

Suspend le renouvellement et passe la souscription en `suspended`.

Les trois routes acceptent un corps optionnel :

```json
{
  "reason": "Decision utilisateur ou backoffice"
}
```

### `GET /users/:id/timeline`

Retourne une timeline explicable : compte, profils, onboarding, souscriptions,
documents, paiements et renouvellements. L'utilisateur ne peut lire que sa
timeline, sauf role `admin`.

### `GET /profiles/:id/lifecycle-events`

Retourne les evenements lies a un profil porteur ou payeur : souscriptions,
documents, paiements et renouvellements.

### `GET /admin/documents/pending`

Retourne les justificatifs en attente d'analyse, en analyse ou necessitant une
revue manuelle.

### `PATCH /admin/documents/:id/review`

Enregistre une decision humaine sur un justificatif.

```json
{
  "accepted": false,
  "rejectionReason": "Document illisible",
  "note": "Demander une nouvelle piece plus nette."
}
```

### `GET /admin/users`

Liste les utilisateurs publics, sans `passwordHash`, avec le nombre de
souscriptions associees.

### `GET /admin/offers`

Liste toutes les offres, actives ou non, pour pilotage catalogue.

### `POST /admin/offers`

Cree une offre dans le catalogue.

```json
{
  "code": "NAVIGO_EXEMPLE",
  "name": "Navigo Exemple",
  "description": "Offre de demonstration",
  "target": "prototype",
  "requiredDocuments": ["Piece d'identite"],
  "isActive": true
}
```

### `PATCH /admin/offers/:id`

Modifie une offre existante.

### `GET /admin/support-alerts`

Retourne des alertes calculees sans nouvelle table : justificatifs manquants,
documents a revoir, dossiers bloques.

### `GET /admin/audit-logs`

Retourne un journal prototype derive des changements de statut souscriptions et
documents. Une table dediee pourra etre ajoutee plus tard si le besoin augmente.

## Notifications temps reel

### `GET /notifications`

Liste les notifications de l'utilisateur connecte. Les parametres disponibles
sont `limit`, `status=all|unread|read` et `category`.

### `PATCH /notifications/:id/read`

Marque une notification comme lue.

### `PATCH /notifications/:id/unread`

Replace une notification dans les non lues.

### `PATCH /notifications/read-all`

Marque toutes les notifications du compte comme lues.

### `DELETE /notifications/:id`

Supprime une notification du compte.

Le WebSocket `/ws` pousse les nouvelles notifications avec l'evenement
`notification.created`. Il accepte le JWT client via sous-protocole et la
session backoffice via cookie `HttpOnly`.

### `GET /admin/communications`

Liste l'historique des communications generales publiees par le backoffice.

### `POST /admin/communications`

Publie une communication vers `clients`, `admins` ou `everyone` et cree une
notification temps reel par destinataire.

```json
{
  "audience": "clients",
  "title": "Pensez a votre renouvellement",
  "message": "Verifiez vos justificatifs avant la date de fin de droits.",
  "priority": "high",
  "actionLabel": "Voir mes abonnements",
  "actionPath": "/subscriptions"
}
```
