# API REST

URL locale par defaut : `http://localhost:3000/api`.

Les routes protegees attendent :

```http
Authorization: Bearer <token>
```

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

Route protegee qui retourne l'utilisateur lie au JWT, sans `passwordHash`.

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
justificatifs, sinon `pending_validation`.

### `POST /subscriptions/:id/cancel`

Annule la souscription.

### `POST /subscriptions/:id/suspend`

Suspend la souscription, utile pour les cas de refus ou de gestion SAV.
