# Principes RGPD du prototype

## Donnees collectees

Le parcours collecte uniquement les donnees necessaires pour orienter et
preparer une souscription :

- identite et email du compte ;
- consentement et date du consentement RGPD ;
- identite, date de naissance et statut du porteur ;
- identite, email et relation du payeur lorsqu'il est different ;
- frequence de trajet, preference de forfait et situation d'eligibilite ;
- metadonnees de justificatifs dans une etape future.

La date de naissance et le statut sont utiles pour identifier des offres comme
Imagine R, Navigo Senior, TST ou Amethyste. La distinction porteur/payeur est
necessaire pour les mineurs et les prises en charge par une structure.

## Securite et minimisation

- Aucun mot de passe en clair : bcryptjs stocke uniquement un hash.
- `passwordHash` n'est jamais renvoye par l'API.
- Les secrets sont dans `.env`, ignore par Git.
- Les routes utilisateur sont protegees par JWT.
- Une session d'onboarding ne peut etre lue que par son proprietaire.
- Le bouton Ile-de-France Mobilites Connect est informatif uniquement : aucun
  fournisseur OAuth ni partage de donnees n'est implemente.

## Points a renforcer avant production

- Stocker la session dans un cookie `HttpOnly` plutot que `localStorage`.
- Definir les durees de conservation et une procedure d'effacement.
- Ajouter des droits d'acces au backoffice et une journalisation.
- Chiffrer et limiter l'acces aux justificatifs.
- Presenter une notice d'information RGPD complete et les droits de la personne.
