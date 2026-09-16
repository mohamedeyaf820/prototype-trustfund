# Workflow utilisateur TrustFund

Ce parcours sert de référence fonctionnelle à la maquette noir et blanc.

## Parcours principal

1. Arrivée dans l’application : connexion, création de compte minimale ou découverte sans compte.
2. Création du compte : choix du rôle, nom, prénom, téléphone, e-mail facultatif et mot de passe — sans vérification SMS immédiate (sauf compte administrateur, sur invitation).
3. Découverte libre : accueil, épargne simulée, objectifs et boutique restent accessibles sans vérification.
4. Première opération sensible (dépôt, retrait, création d’un objectif, publication d’une offre fournisseur) : vérification renforcée par code OTP (SMS ou e-mail) et pièce d’identité.
5. Exécution simulée de l’opération financière.
6. Suivi de la progression, des preuves et des recommandations de TrustCoach.
7. Objectif atteint, confirmation du produit, commande, livraison et réception.

## Registre des opérations sensibles

La vérification renforcée (OTP + pièce d’identité contrôlée) n’est exigée qu’au moment nécessaire :

| Opération | Déclencheur dans le prototype |
|---|---|
| Dépôt d’argent | Boutons d’épargne (`requireKyc('freePayment')`, `requireKyc('goalPayment')`) |
| Retrait de fonds | Boutons de retrait (`requireKyc('withdraw')`) |
| Création d’un objectif d’épargne | Ouverture du panneau objectif (`requireGoalVerification`) |
| Publication d’une offre fournisseur | Ouverture du panneau produit (`requireKyc('offerPublication')`) |

Une seule vérification par session suffit : l’opération en attente (`state.pendingFinancialAction`) reprend automatiquement après validation du panneau `kycSheet`.

## Authentification : arbitrage SMS, coût et alternatives

- SMS différé : aucun SMS n’est envoyé à l’inscription ni en mode découverte ; le code OTP (SMS ou e-mail, au choix dans `kycSheet`) n’est déclenché qu’avant une opération sensible. Cela limite le coût d’acquisition aux utilisateurs réellement actifs.
- Coût à chiffrer avant production : tarif unitaire, validité des packs, coût par utilisateur vérifié et projection en cas de croissance. Le prototype n’envoie aucun SMS réel.
- Le SMS ne doit pas être considéré comme la solution la plus sûre : SIM swap et interception restent possibles. Alternatives à étudier : OTP par e-mail (déjà proposé dans `kycSheet`), OTP TOTP via application d’authentification (plus sûr, mais plus exigeant pour certains publics), vérification humaine de la pièce par l’équipe TrustFund (déjà prévue dans le flux KYC).
- Choix recommandé pour la cible : OTP SMS ou e-mail au choix + contrôle documentaire humain pour la première opération sensible, puis TOTP applicatif en option pour les comptes à risque (fournisseurs, administrateurs). Sécurité, simplicité, coût et profil des utilisateurs restent à équilibrer lors de l’étude production.

## Règles de conception appliquées

- Une action principale par écran d’action.
- Les informations sensibles ne sont demandées qu’au moment nécessaire.
- Trois objectifs actifs maximum ; aucune fausse action « Nouveau » lorsque la limite est atteinte.
- Les écrans d’information peuvent être riches, mais les écrans de saisie restent focalisés.
- Les boutons principaux sont pleine largeur et placés dans la zone basse lorsque possible.
- Les formulaires longs utilisent un assistant progressif.
- Les états ne dépendent jamais uniquement d’une couleur.
- Les interfaces fournisseur fonctionnent sur mobile et sur ordinateur ; l’administration est conçue pour le web.

## Parcours conversationnel TrustCoach (workflow métier)

L’expérience conversationnelle est un workflow comme les autres, documenté ici
indépendamment de l’architecture technique (Orchestrateur, agents, Tools, backend).

Chaîne générale, visible dans l’écran TrustCoach et détaillée dans `coachWorkflowSheet` :

1. Message utilisateur (langage simple).
2. Détection de l’intention : budget, priorités, produit, rappel ou risque.
3. Vérification des informations : croisement avec l’épargne et les objectifs.
4. Routage vers l’agent adapté au sujet.
5. Agent spécialisé : réponse chiffrée et plan d’action proposé.
6. Réponse / action : l’utilisateur confirme chaque modification avant application.

### Cas 1 — informations insuffisantes

Exemple : « Je veux faire un plan d’épargne. »
TrustCoach demande progressivement : objectif, montant cible, durée souhaitée,
capacité d’épargne, fréquence des cotisations. Une fois les informations
suffisantes, la demande est transmise au Planificateur.

### Cas 2 — informations déjà suffisantes

Exemple : « Je veux économiser 120 000 FCFA et je peux mettre 2 500 FCFA par jour. »
L’intention est claire et les données nécessaires sont disponibles : le système
transmet directement au Planificateur pour calculer et proposer un plan.

### Cas 3 — demande hors plan d’épargne

Priorisation d’objectifs, recherche d’offre, rappel ou risque : l’Orchestrateur
identifie l’intention correspondante et transmet à l’agent ou à l’outil approprié
(voir `answerCoach` dans `app.js` : branches budget, priorités, offre, rappel,
risque, plus réponse de repli demandant une précision).

### Rôles des agents (workflows individuels)

- Orchestrateur : message → détection d’intention → extraction → vérification → routage.
- TrustCoach : contexte utilisateur → analyse de l’objectif → questions complémentaires → conseil → transmission éventuelle au Planificateur.
- Planificateur : données de l’objectif → vérification → calcul des scénarios → proposition → validation utilisateur.

### RAG : état et sources à prévoir

Le RAG n’est pas encore mis en œuvre : `answerCoach` répond à partir de règles
locales et des données fictives du prototype. Avant production, adosser les
réponses aux sources du dossier TrustFund (règles d’épargne et d’objectifs,
catalogue vérifié, conditions de commande et de livraison, tarifs et frais)
afin d’éviter les réponses fondées uniquement sur des connaissances générales.
En attendant, chaque proposition reste un conseil : la décision finale appartient
à l’utilisateur et chaque modification est confirmée avant application.

## Parcours fournisseur

Création du compte minimal → accès à l’espace fournisseur → complétion et vérification de la boutique avant publication → ajout d’un produit en quatre étapes → gestion du stock → confirmation des commandes → suivi des livraisons → réponse aux réclamations.

## Parcours administrateur

Connexion avec double vérification → file des preuves → validation ou rejet motivé → vérification des fournisseurs → supervision des comptes, objectifs et commandes → traitement des réclamations → contrôle des alertes IA → rapports et journal d’audit.
