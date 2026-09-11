# Workflow utilisateur TrustFund

Ce parcours sert de référence fonctionnelle à la maquette noir et blanc.

## Parcours principal

1. Arrivée dans l’application.
2. Création du compte : choix du rôle, nom, prénom, téléphone, e-mail facultatif et mot de passe.
3. Vérification du numéro de téléphone par un code SMS à six chiffres.
4. Découverte de l’accueil, de l’épargne libre, des objectifs et de la boutique.
5. Épargne libre immédiate ou choix d’un produit et création d’un objectif.
6. Premier dépôt ou première demande de retrait : la vérification d’identité KYC devient nécessaire.
7. Exécution simulée de l’opération financière.
8. Suivi de la progression, des preuves et des recommandations de TrustCoach.
9. Objectif atteint, confirmation du produit, commande, livraison et réception.

## Règles de conception appliquées

- Une action principale par écran d’action.
- Les informations sensibles ne sont demandées qu’au moment nécessaire.
- Trois objectifs actifs maximum ; aucune fausse action « Nouveau » lorsque la limite est atteinte.
- Les écrans d’information peuvent être riches, mais les écrans de saisie restent focalisés.
- Les boutons principaux sont pleine largeur et placés dans la zone basse lorsque possible.
- Les formulaires longs utilisent un assistant progressif.
- Les états ne dépendent jamais uniquement d’une couleur.
- Les interfaces fournisseur fonctionnent sur mobile et sur ordinateur ; l’administration est conçue pour le web.

## Parcours fournisseur

Création du compte minimal → accès à l’espace fournisseur → complétion et vérification de la boutique avant publication → ajout d’un produit en quatre étapes → gestion du stock → confirmation des commandes → suivi des livraisons → réponse aux réclamations.

## Parcours administrateur

Connexion avec double vérification → file des preuves → validation ou rejet motivé → vérification des fournisseurs → supervision des comptes, objectifs et commandes → traitement des réclamations → contrôle des alertes IA → rapports et journal d’audit.
