# Parcours d'onboarding

## Pourquoi un parcours guide

L'offre de transport depend fortement de l'age, du statut, de la frequence de
trajet et de certaines situations sociales. Afficher toutes les offres au meme
moment augmente le risque d'erreur et les appels au support.

Le prototype divise donc la decision en quatre etapes courtes :

1. identifier pour qui la souscription est realisee ;
2. distinguer le porteur du payeur ;
3. comprendre les trajets et l'eligibilite potentielle ;
4. expliquer une recommandation et annoncer les justificatifs.

## Porteur et payeur

Le porteur utilise personnellement le titre. Le payeur regle la souscription.
Ils peuvent etre identiques, mais le modele couvre aussi :

- un parent qui paie Imagine R pour son enfant ;
- une association qui paie pour un beneficiaire TST ;
- un employeur ou un tuteur qui prend en charge une autre personne.

## Moteur de recommandation

Le service retourne une offre, un niveau de confiance, les raisons, les
justificatifs potentiels et les avertissements. Il ne remplace pas une
verification d'eligibilite definitive.

Les regles couvrent Navigo Annuel, Senior, Mois, Semaine, Imagine R Junior,
Scolaire et Etudiant, Liberte+, TST et Amethyste.

## Ile-de-France Mobilites Connect

Le bouton est visible pour rendre l'evolution du parcours comprehensible. Dans
ce prototype, il affiche seulement un message et ne declenche aucune
integration OAuth.
