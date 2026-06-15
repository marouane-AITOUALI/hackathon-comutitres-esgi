# Modele conceptuel de donnees

```mermaid
erDiagram
    USERS ||--o{ PROFILES : manages
    USERS ||--o{ ONBOARDING_SESSIONS : starts
    USERS ||--o{ SUBSCRIPTIONS : creates
    PROFILES ||--o{ ONBOARDING_SESSIONS : identifies
    PROFILES ||--o{ SUBSCRIPTIONS : participates
    ONBOARDING_SESSIONS ||--o{ SUBSCRIPTIONS : prepares
    OFFERS ||--o{ SUBSCRIPTIONS : concerns
    SUBSCRIPTIONS ||--o{ DOCUMENTS : contains
```

- `users` : compte authentifie et consentement RGPD.
- `profiles` : personne porteuse ou payeuse.
- `onboarding_sessions` : choix et reponses du parcours guide.
- `offers` : catalogue des offres et justificatifs potentiels.
- `subscriptions` : demande reliant toutes les entites metier.
- `documents` : metadonnees des justificatifs futurs.

Les fichiers eux-memes sont destines a un stockage protege. La table
`documents` ne conserve que l'URL, le type, le statut et le motif de refus.
