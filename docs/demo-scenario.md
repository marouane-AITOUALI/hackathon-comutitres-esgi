# Scenario de demo hackathon

## Preparation

1. Configurer `backend/.env` avec `DATABASE_URL`, `JWT_SECRET` et les variables
   admin si besoin.
2. Lancer les migrations uniquement si elles ont ete validees.
3. Preparer les donnees demo :

```bash
npm run db:seed:admin --workspace backend
npm run db:seed:demo --workspace backend
```

4. Lancer les apps :

```bash
npm run dev:backend
npm run dev:backoffice
```

Compte admin :

```txt
admin@comutitres.fr
Admin123!
```

Compte utilisateur demo :

```txt
parent.demo@example.com
Demo123!
```

## Scenario principal

1. Se connecter au backoffice.
2. Montrer le dashboard : souscriptions, documents, alertes support.
3. Ouvrir les souscriptions et filtrer les dossiers en attente.
4. Ouvrir la souscription Imagine R Scolaire.
5. Montrer la separation porteur/payeur :
   porteur `Adam Demo`, payeur `Parent Demo`.
6. Montrer les documents associes :
   piece d'identite validee, certificat scolaire en attente.
7. Aller dans `/documents`.
8. Lancer l'analyse documentaire simulee.
9. Expliquer que le prototype utilise des regles gratuites, sans API payante.
10. Valider ou refuser le document avec un motif lisible.
11. Revenir au detail du dossier et montrer les next actions.
12. Valider, refuser ou suspendre la souscription.

## Scenario innovation paiement

1. Dans le detail souscription, montrer les paiements simules.
2. Identifier le paiement `DEMO-FAILED-IMAGINE-R`.
3. Montrer que l'alerte support remonte un paiement a regulariser.
4. Cliquer sur `Regulariser`.
5. Expliquer que le dossier repasse en validation sans vraie donnee bancaire.

Phrase de presentation :

```txt
Le paiement est simule afin de demontrer l'experience metier sans manipuler de
donnees bancaires reelles. L'architecture permettrait ensuite d'integrer un PSP
reel.
```

## Scenario analyse documentaire

Tester sans ecriture base :

```bash
curl -X POST http://localhost:3001/api/documents/analyze/demo ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"school_certificate\",\"fileUrl\":\"justificatif_adam_demo.pdf\"}"
```

Message a donner au jury :

```txt
Le prototype utilise une analyse par regles pour rester gratuit. Une evolution
possible consiste a brancher un OCR open source ou Ollama local sur un VPS.
```

## Points forts a raconter

- Parcours guide et recommandation explicable.
- Distinction porteur/payeur pour les mineurs, associations et employeurs.
- Justificatifs dynamiques selon l'offre.
- Analyse documentaire simulee, gratuite et explicable.
- Paiement simule sans PSP ni donnees bancaires reelles.
- Backoffice qui anticipe les appels support.
- Audit logs et next actions pour reduire les erreurs de traitement.
- RGPD des l'inscription : minimisation, consentement, pas de mot de passe en clair.
