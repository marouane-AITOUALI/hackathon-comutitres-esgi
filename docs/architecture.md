# Architecture

Le depot est un monorepo npm compose de trois applications :

- `frontend` : parcours client React, Vite, TypeScript, MUI et React Router.
- `backoffice` : pilotage React, Vite, TypeScript, MUI et React Router.
- `backend` : API REST Express, TypeScript, Drizzle ORM et PostgreSQL Supabase.

## Frontend

Le frontend separe les responsabilites :

- `components` : layouts, protection des routes et composants reutilisables.
- `pages` : landing page, authentification et etapes de l'onboarding.
- `hooks` : contexte d'authentification et acces a l'utilisateur connecte.
- `services` : appels API, stockage du JWT et brouillon d'onboarding.
- `types` : contrats TypeScript partages dans l'application.
- `theme` : palette Comutitres / Ile-de-France Mobilites et theme MUI.

Le JWT est stocke dans `localStorage` uniquement pour le prototype. Une version
de production devra privilegier un cookie `HttpOnly`, `Secure` et `SameSite`.

## Backend

L'API suit une architecture simple :

- `routes` : declaration des endpoints et middleware associes.
- `controllers` : traduction HTTP vers les services.
- `services` : logique auth, onboarding, recommandation, documents, paiements et renouvellement.
- `validation` : schemas Zod des payloads.
- `middleware` : validation, authentification JWT et gestion des erreurs.
- `db` : schema Drizzle, connexion et preparation des offres.
- `utils` et `types` : erreurs, JWT et types transverses.

Les mots de passe sont hashes avec bcryptjs. Le backend ne retourne jamais
`passwordHash`.

## Donnees

Le modele distingue :

- le compte `users`, qui se connecte et pilote la demande ;
- les `profiles`, qui representent un porteur ou un payeur ;
- la session `onboarding_sessions`, qui conserve les reponses d'orientation ;
- la `subscription`, qui relie compte, porteur, payeur, offre et session ;
- les `documents`, prepares pour une future collecte de justificatifs.
- les `payments`, qui simulent le paiement direct, le mandat et la regularisation ;
- les `renewal_events`, qui historisent les decisions de renouvellement.

Cette separation couvre notamment un parent payant pour son enfant et une
association payant pour un beneficiaire TST.

Les routes de paiement restent volontairement gratuites et simulees pour le
prototype : aucun prestataire externe n'est appele. Les routes lifecycle
agregent ensuite comptes, profils, souscriptions, documents, paiements et
renouvellements pour aider le backoffice a comprendre rapidement un dossier.
