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
