# Application mobile TrustFund — prototype

Prototype construit à partir du cahier des charges de TrustFund et des 44 écrans du document `TrustFund_Maquettes_complet.pdf`. Cette itération est volontairement réalisée en noir, blanc et nuances de gris afin de valider l’ergonomie avant la réintroduction de la couleur.

## Ouvrir l’application

Ouvrez `index.html` dans un navigateur moderne. L’interface remplit l’écran sur mobile et apparaît dans un cadre de téléphone sur ordinateur. Aucune installation n’est nécessaire.

## Parcours interactifs

- écran de chargement TrustFund puis page de bienvenue ;
- connexion séparée pour utilisateur, fournisseur et administrateur ;
- inscription sécurisée sans compte Google ni réseau social ;
- inscription initiale minimale : rôle, nom, prénom, téléphone, e-mail facultatif et mot de passe ;
- vérification du numéro de téléphone par code SMS à six chiffres ;
- vérification KYC différée : pièce d’identité et code OTP demandés uniquement au moment d’une opération sensible (dépôt, retrait, création d’objectif, publication d’offre fournisseur) ;
- réutilisation de la vérification : une seule vérification pendant la session, l’opération en attente reprend ensuite automatiquement ;
- informations professionnelles du fournisseur reportées avant la publication de sa première offre ;
- double vérification SMS pour le compte administrateur ;
- accueil mobile simplifié avec épargne disponible, total épargné et trois objectifs maximum ;
- possibilité d’épargner avant de choisir un objectif, puis d’affecter ce solde plus tard sans effectuer un second paiement ;
- création guidée d’un objectif et calcul du plan recommandé ;
- modification, suspension et annulation contrôlée d’un objectif ;
- finalisation d’un objectif atteint, création de commande, réception et évaluation ;
- catalogue de produits et services partenaires avec photographies, fiches détaillées et changement de produit ;
- paiement mobile direct simulé via Wave ou Orange Money avec création automatique d’une référence et d’une preuve ;
- déclaration d’une cotisation externe avec preuve ;
- détection des références de cotisation déjà utilisées ;
- historique distinguant les statuts en attente, validé et rejeté ;
- centre de notifications et préférences de rappel ;
- modification du profil, récupération du mot de passe et résumé de sécurité ;
- espaces séparés utilisateur, administrateur et fournisseur avec navigation adaptée ;
- validation administrative avec mise à jour de la progression ;
- gestion administrative des utilisateurs, fournisseurs, objectifs, commandes et réclamations ;
- statistiques, export CSV, paramètres versionnés et journal d’audit ;
- gestion fournisseur des offres, prix, stocks, commandes, livraisons et réclamations, avec création d’un produit en quatre étapes ;
- réclamations utilisateur avec suivi des réponses et du statut.
- conditions d’utilisation et politique de confidentialité accessibles avant et après l’inscription ;
- espace fournisseur responsive : navigation mobile sur téléphone et tableau de bord web avec barre latérale sur ordinateur ;
- administration dédiée au web et signalée comme telle sur petit écran.

## Fonctions d’intelligence artificielle simulées

- prédiction explicable du risque d’abandon ;
- score de régularité et facteurs ayant influencé le score ;
- recommandation d’un plan d’épargne plus adapté ;
- TrustCoach, coach intelligent conversationnel ;
- choix d’un horaire de rappel personnalisé ;
- recommandations de produits et services selon le budget et les objectifs ;
- détection d’anomalies avec contrôle humain obligatoire côté administrateur.

Ces fonctions illustrent l’expérience cible. Les scores et réponses utilisent des données fictives : aucun modèle de production n’est encore entraîné ou connecté.

Le logo utilisé possède un fond transparent. Toutes les données affichées sont fictives. Les paiements directs sont uniquement simulés : aucun débit réel n’est effectué.

## Comptes de démonstration

- Utilisateur : `77 000 00 01` / `TrustUser#26`
- Fournisseur : `77 000 00 02` / `TrustPro#26`
- Administrateur : `77 000 00 03` / `TrustAdmin#26`

Sur l’écran de connexion, ouvrez « Comptes de démonstration » puis choisissez un profil pour remplir automatiquement ses accès.

## Principes UI/UX

- une seule action principale clairement visible par écran ;
- l’accueil commence par l’objectif prioritaire et le montant conseillé, les autres informations restent secondaires ;
- palette strictement monochrome : noir, blanc et gris ;
- images produit désaturées pour conserver le repérage visuel sans ajouter de couleurs ;
- cartes d’objectifs organisées dans une grille symétrique et quota de trois objectifs visible ;
- formulaires longs transformés en assistants étape par étape ;
- actions principales placées dans la zone basse des panneaux et formulaires ;
- panneaux alignés en bas avec arrière-plan grisé et contenu opaque ;
- textes et boutons agrandis pour une utilisation mobile confortable ;
- vocabulaire simple et explications courtes ;
- fonctions avancées rangées derrière « Voir l’analyse » ou « Plus d’outils » ;
- navigation utilisateur limitée à Accueil, Boutique et Profil ;
- aucune fonctionnalité supprimée : les détails restent accessibles progressivement.

## Cohérence du design (passe UI)

Les règles d’harmonisation sont centralisées en fin de `design-fixes.css` :

- un seul cadre par bloc : les cartes sont plates, des séparateurs remplacent les cadres imbriqués ;
- une échelle unique de boutons : 48 px pour l’action principale, 40 px pour les actions secondaires, 44 px pour les boutons d’icône ;
- un seul contrat de panneau venant du bas : largeur maximale 406 px, marges latérales 16 px, padding interne 20 px, rayon 22 px ;
- un bandeau de chiffres unique (`.metrics-scroll` et `.summary-band`) : colonnes égales, aucun défilement horizontal, aucune carte rognée ;
- un plancher typographique : 12 px minimum pour les textes secondaires, 13 px pour les libellés d’action ;
- les surfaces sombres sont réservées à l’action principale et aux badges.

### Vérifier la cohérence

```bash
npm run audit            # 198 états mesurés (320, 375, 414 px) : débordements, boutons, textes, cadres, panneaux
npm run audit:report     # rapport lisible du dernier audit
npm run board            # planche PDF : écrans regroupés par type, côte à côte
npm run generate-pdf     # régénère le PDF des 76 écrans
TRUST_AUDIT_WIDTHS=320,375,414 npm run audit
```

Seuils contrôlés par l’audit : aucun texte sous 12 px, aucun bouton sous 40 px, aucun débordement, aucun cadre imbriqué, marges de panneaux identiques.