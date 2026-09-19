# TrustFund — Prototype d'Application Mobile d'Épargne

## Vue d'ensemble

TrustFund est un prototype d'application mobile d'épargne progressive permettant aux utilisateurs d'économiser pour atteindre des objectifs concrets (produits et services). Le prototype implémente trois rôles : utilisateur, fournisseur et administrateur, avec une approche de vérification d'identité différée pour réduire les frictions à l'inscription.

**Type de projet** : Prototype web interactif (HTML/CSS/JavaScript vanilla)  
**État** : Prototype noir et blanc pour validation ergonomique  
**Langue** : Français  
**Cible** : Mobile-first (responsive pour desktop)

## Architecture du Projet

```
.
├── index.html              # Point d'entrée unique de l'application
├── app.js                  # Logique métier et gestion d'état
├── styles.css              # Styles principaux
├── design-fixes.css        # Règles d'harmonisation UI/UX
├── assets/                 # Images et ressources visuelles
├── scripts/                # Scripts d'automatisation
│   ├── audit_design_system.js          # Audit de cohérence UI
│   ├── report_design_audit.js          # Rapport d'audit lisible
│   ├── capture_consistency_board.js     # Planche PDF comparative
│   ├── generate_screens_pdf.js          # Export PDF des écrans
│   └── check_sensitive_gates.js         # Vérification sécurité KYC
├── output/pdf/            # PDFs générés
└── tmp/                   # Fichiers temporaires d'audit
```

## Stack Technique

- **Frontend** : HTML5, CSS3, JavaScript ES6+ (vanilla, pas de framework)
- **Automation** : Node.js + Puppeteer pour la capture d'écrans et l'audit
- **Design** : Monochrome (noir/blanc/gris) pour validation ergonomique
- **Responsive** : Mobile-first avec adaptation desktop

## Démarrage Rapide

### Lancer l'application

```bash
# Aucune installation requise
# Ouvrez simplement index.html dans un navigateur moderne
open index.html
```

### Comptes de démonstration

- **Utilisateur** : `77 000 00 01` / `TrustUser#26`
- **Fournisseur** : `77 000 00 02` / `TrustPro#26`
- **Administrateur** : `77 000 00 03` / `TrustAdmin#26`

Utilisez le bouton "Comptes de démonstration" sur l'écran de connexion.

### Scripts d'audit et génération

```bash
# Installation des dépendances
npm install

# Audit de cohérence UI (198 états mesurés)
npm run audit

# Rapport lisible du dernier audit
npm run audit:report

# Planche PDF comparative (écrans regroupés)
npm run board

# Génération PDF complète (76 écrans)
npm run generate-pdf

# Vérification des portes de sécurité
npm run verify:sensitive

# Audit personnalisé avec largeurs spécifiques
TRUST_AUDIT_WIDTHS=320,375,414 npm run audit
```

## Fonctionnalités Principales

### 🔐 Authentification et Sécurité

- **Inscription minimale** : Rôle, nom, prénom, téléphone, e-mail (facultatif), mot de passe
- **KYC différé** : Vérification renforcée (OTP + pièce d'identité) déclenchée uniquement lors d'une opération sensible
- **Opérations sensibles** :
  - Dépôt d'argent
  - Retrait de fonds
  - Création d'un objectif d'épargne
  - Publication d'une offre fournisseur
- **Réutilisation de la vérification** : Une seule vérification par session
- **Double vérification SMS** pour les comptes administrateur

### 💰 Parcours Utilisateur

1. **Mode découverte** : Navigation sans compte pour explorer la boutique
2. **Épargne libre** : Possibilité d'épargner avant de définir un objectif
3. **Objectifs d'épargne** :
   - Création guidée avec plan recommandé automatique
   - Maximum 3 objectifs actifs simultanés
   - Modification, suspension, annulation
   - Finalisation et création de commande
4. **Catalogue produits** : Photographies, fiches détaillées, changement de produit
5. **Paiements simulés** : Wave, Orange Money avec références et preuves automatiques
6. **Cotisations externes** : Déclaration avec preuve et détection des doublons
7. **TrustCoach (IA simulée)** :
   - Prédiction du risque d'abandon
   - Score de régularité
   - Recommandations personnalisées
   - Coach conversationnel

### 🏪 Espace Fournisseur

- **Responsive** : Navigation mobile + tableau de bord web avec sidebar
- **Onboarding différé** : Informations professionnelles demandées avant la première publication
- **Gestion d'offres** : Création en 4 étapes, prix, stocks
- **Commandes** : Suivi, confirmation, livraisons
- **Réclamations** : Gestion des retours clients

### ⚙️ Espace Administrateur

- **Dédié au web** (signalé sur mobile)
- **Validation de preuves** : File d'attente avec validation/rejet motivé
- **Supervision** : Utilisateurs, fournisseurs, objectifs, commandes
- **Alertes IA** : Détection d'anomalies avec contrôle humain obligatoire
- **Rapports** : Statistiques, export CSV, journal d'audit

## Principes de Design (Design System)

### Palette Monochrome

- **Noir** : Texte principal (`#111`)
- **Blanc** : Arrière-plan et cartes (`#FFF`)
- **Gris** : Textes secondaires, bordures, états désactivés
- **Images désaturées** : Conservation du repérage visuel sans couleur

### Règles d'Harmonisation (design-fixes.css)

#### Cadres et Cartes
- ✅ **Un seul cadre par bloc** : Cartes plates, séparateurs au lieu de cadres imbriqués
- ❌ **Pas de cadres imbriqués**

#### Échelle de Boutons
- **48px** : Action principale
- **40px** : Actions secondaires (minimum)
- **44px** : Boutons d'icône

#### Panneaux (Bottom Sheets)
- **Largeur max** : 406px
- **Marges latérales** : 16px
- **Padding interne** : 20px
- **Rayon** : 22px
- **Alignement** : Bas de l'écran avec overlay grisé

#### Typographie
- **Minimum texte secondaire** : 12px
- **Libellés d'action** : 13px minimum
- **Agrandissement mobile** : Textes et boutons confortables au pouce

#### Bandeaux de Métriques
- **Classes** : `.metrics-scroll`, `.summary-band`
- **Colonnes égales** : Pas de défilement horizontal
- **Pas de carte rognée**

### Seuils Contrôlés par l'Audit

- ✅ Aucun texte sous 12px
- ✅ Aucun bouton sous 40px
- ✅ Aucun débordement horizontal
- ✅ Aucun cadre imbriqué
- ✅ Marges de panneaux identiques

## État de l'Application (app.js)

### Variables d'État Principales

```javascript
const state = {
  screen: 'home',           // Écran actuel
  role: 'user',             // Rôle actuel (user|provider|admin)
  isGuest: false,           // Mode découverte
  kycVerified: false,       // Statut de vérification KYC
  pendingFinancialAction: null,  // Opération en attente de KYC
  goalCount: 3,             // Nombre d'objectifs actifs
  freeSavings: 125000,      // Épargne non affectée (FCFA)
  totalSaved: 757000,       // Total épargné
  usedReferences: Set,      // Références de paiement déjà utilisées
  // ... voir app.js pour la liste complète
};
```

### Rôles et Métadonnées

```javascript
const roleMeta = {
  user: { 
    screen: 'home', 
    initials: 'AN', 
    label: 'Utilisateur',
    completion: 85 
  },
  admin: { 
    screen: 'admin',
    initials: 'MB',
    label: 'Administrateur',
    completion: 100 
  },
  provider: { 
    screen: 'provider',
    initials: 'BE',
    label: 'Fournisseur',
    completion: 92 
  }
};
```

## Workflow KYC (Vérification Différée)

### Déclencheurs d'Opération Sensible

| Opération | Fonction dans app.js |
|-----------|---------------------|
| Dépôt d'argent | `requireKyc('freePayment')` ou `requireKyc('goalPayment')` |
| Retrait | `requireKyc('withdraw')` |
| Création d'objectif | `requireGoalVerification()` |
| Publication d'offre | `requireKyc('offerPublication')` |

### Flux de Vérification

1. L'utilisateur tente une opération sensible
2. Le système vérifie `state.kycVerified`
3. Si non vérifié :
   - Stockage de l'opération dans `state.pendingFinancialAction`
   - Ouverture du panneau `kycSheet`
   - Demande OTP (SMS ou e-mail au choix)
   - Demande upload pièce d'identité
4. Après validation :
   - `state.kycVerified = true`
   - Reprise automatique de l'opération en attente
   - Plus de demande KYC pour le reste de la session

### Arbitrage SMS vs Alternatives

**Implémenté** : OTP par SMS ou e-mail (choix utilisateur)  
**Production** : Étudier TOTP (application d'authentification) pour les comptes à risque  
**Coût** : À chiffrer avant production (tarif unitaire, validité des packs)

## Workflow TrustCoach (IA Conversationnelle)

### Chaîne de Traitement

1. **Message utilisateur** (langage naturel)
2. **Détection d'intention** : budget, priorités, produit, rappel, risque
3. **Vérification des données** : Croisement avec épargne et objectifs actuels
4. **Routage vers agent spécialisé**
5. **Réponse chiffrée** avec plan d'action proposé
6. **Confirmation utilisateur** avant toute modification

### Agents Simulés

- **Orchestrateur** : Détection d'intention → Extraction → Routage
- **TrustCoach** : Analyse contextuelle → Conseil → Transmission au Planificateur
- **Planificateur** : Calcul de scénarios → Proposition → Validation

### RAG (Non Implémenté)

Actuellement : Réponses basées sur règles locales et données fictives  
**Production** : Adosser aux sources TrustFund (règles métier, catalogue, conditions)

## Scripts de Validation

### Audit de Cohérence (audit_design_system.js)

Mesure 198 états à travers 3 largeurs (320px, 375px, 414px) :

- Débordements horizontaux
- Tailles de boutons (minimum 40px)
- Tailles de texte (minimum 12px)
- Cadres imbriqués
- Marges de panneaux

**Sortie** : JSON dans `tmp/audit-design-system/`

### Vérification Sécurité (verify_sensitive.js)

Contrôle que toutes les opérations sensibles passent par les bonnes portes KYC.

### Génération PDF (generate_screens_pdf.js)

Capture et assemble les 76 écrans du prototype en PDF.

### Planche Comparative (capture_consistency_board.js)

Crée un PDF regroupant les écrans par type pour validation visuelle côte à côte.

## Conventions de Code

### JavaScript

- **Sélecteurs** : `$()` pour querySelector, `$$()` pour querySelectorAll
- **Vanilla JS** : Pas de framework, DOM natif
- **État centralisé** : Objet `state` global
- **Fonctions utilitaires** : Préfixe descriptif (`validate`, `show`, `open`, `close`)

### CSS

- **Mobile-first** : Styles de base mobile, media queries pour desktop
- **BEM léger** : Nommage de classes descriptif
- **Variables CSS** : Pour les valeurs répétées (à ajouter si refactoring)
- **Design-fixes.css** : Surcharges d'harmonisation séparées

### HTML

- **Sémantique** : Utilisation appropriée de `section`, `article`, `nav`, `aside`
- **Accessibilité** :
  - `aria-label`, `aria-describedby`, `aria-expanded` où approprié
  - `role="alert"` pour les messages d'erreur
  - `aria-live="polite"` pour les feedbacks dynamiques
- **Attributs data-*** : Pour les actions JS (`data-auth-target`, `data-open`, etc.)

## Données Fictives

Toutes les données affichées sont fictives :

- Comptes de démonstration
- Montants d'épargne
- Produits et fournisseurs
- Scores IA
- Références de paiement

**Aucun paiement réel** n'est effectué. Les simulations Wave et Orange Money sont purement visuelles.

## Limitations Connues

### Prototype uniquement

- Pas de backend
- Pas de base de données
- Pas de vraie authentification
- Pas d'envoi SMS réel
- Pas d'API de paiement
- Pas de modèle IA entraîné

### Navigation

- Application single-page (pas de routing)
- État perdu au rechargement (pas de localStorage)
- Historique de navigation simulé

### Performance

- Pas d'optimisation de production
- Images non optimisées pour le web
- Pas de lazy loading

## Retours de Validation et Corrections

**Date de révision** : 17 septembre 2026

Le wireframe a été validé avec 11 points de retour identifiés. **Tous les points majeurs ont été implémentés** dans `design-fixes.css`. Voir [RETOURS_WIREFRAME.md](RETOURS_WIREFRAME.md) pour le détail complet.

### Points Clés Corrigés

✅ **Cadres imbriqués éliminés** : Utilisation de séparateurs au lieu de cadres multiples  
✅ **Boutons uniformisés** : 48px (principal), 40px (secondaire), 44px (icône)  
✅ **Panneaux cohérents** : Largeur 406px max, marges 16px, padding 20px, rayon 22px  
✅ **Cartes fixes** : Grilles `minmax(0, 1fr)` sans débordement  
✅ **Textes lisibles** : Minimum 12px garanti partout  
✅ **Cartouches allégés** : Surfaces claires, hiérarchie conservée  
✅ **SMS différé** : Mode découverte + vérification KYC aux opérations sensibles  
✅ **TrustCoach accessible** : Bouton flottant permanent + lien header desktop

### Seuils Contrôlés (Scripts d'Audit)

- ✅ Aucun texte < 12px
- ✅ Aucun bouton < 40px
- ✅ Aucun débordement horizontal
- ✅ Aucun cadre imbriqué
- ✅ Marges identiques (16px latérales, 20px internes)

### Point d'Attention Production

⚠️ **Arbitrage SMS à finaliser** : Chiffrer le coût unitaire et étudier les alternatives (TOTP pour comptes à risque)

---

## Évolutions Futures

### Phase 2 : Couleur et Branding

- Introduction de la palette de couleurs TrustFund
- Logo et identité visuelle finalisée
- Images produit en couleur

### Phase 3 : Backend et Intégration

- API REST ou GraphQL
- Base de données (utilisateurs, objectifs, commandes)
- Authentification JWT
- Intégration SMS réelle
- Intégration paiements mobiles (Wave, Orange Money)
- Upload et stockage de documents KYC

### Phase 4 : Intelligence Artificielle

- Entraînement modèle de prédiction d'abandon
- Système de recommandation personnalisé
- TrustCoach conversationnel avec RAG
- Détection d'anomalies en temps réel

### Phase 5 : Production

- Tests E2E (Playwright/Cypress)
- Tests unitaires
- CI/CD
- Monitoring et analytics
- Conformité RGPD/GDPR
- Audit de sécurité
- Optimisation performance
- Progressive Web App (PWA)

## Contribution

### Structure des Commits

Utiliser le format Conventional Commits :

```
feat(auth): add password reset flow
fix(ui): correct button sizing on Android
style(design): apply harmonization rules to cards
docs(readme): update setup instructions
refactor(state): centralize KYC verification logic
test(audit): add coverage for nested borders
```

### Avant de Commiter

```bash
# Vérifier la cohérence UI
npm run audit
npm run audit:report

# Vérifier les portes de sécurité
npm run verify:sensitive

# Générer la documentation visuelle
npm run board
```

## Ressources

- **README.md** : Vue d'ensemble et instructions d'utilisation
- **WORKFLOW.md** : Parcours fonctionnels détaillés
- **RETOURS_WIREFRAME.md** : Synthèse des retours de validation et état d'implémentation
- **design-fixes.css** : Règles d'harmonisation commentées (890 lignes)
- **scripts/** : Scripts d'automatisation avec commentaires

## Support

Pour toute question sur le prototype :

1. Consulter README.md et WORKFLOW.md
2. Lire les commentaires dans design-fixes.css
3. Examiner les fonctions dans app.js (bien commentées)
4. Lancer `npm run audit:report` pour comprendre l'état du design

## Licence

Prototype privé TrustFund © 2026
