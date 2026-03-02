# Skis-Manager 🎿

**Skis-Manager** est une application mobile de gestion complète de votre matériel de ski et de vos sorties en montagne. Suivez vos skis, chaussures, sorties, hors-pistes et entretiens, le tout stocké localement avec synchronisation optionnelle.

![Version](https://img.shields.io/badge/version-0.9.16-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey)

## 🎯 Fonctionnalités principales

### 📊 Gestion du matériel
- **Skis** : Enregistrez tous vos skis avec leurs caractéristiques (marque, modèle, taille, rayon, patin, type)
- **Chaussures de ski** : Gérez vos chaussures (marque, modèle, taille, flex, longueur de coque)
- **Associations** : Liez vos skis et chaussures aux utilisateurs concernés
- **Marques** : Base de données personnalisable des marques d'équipement
- **Types de skis** : Catégorisez vos skis (Piste, Freeride, Course, Slalom, GS, Surf, Skating, Touring, etc.)

### 🏔️ Suivi des sorties
- **Journal de sorties** : Enregistrez chaque sortie ski avec :
  - Date et moment de la journée (matin/après-midi/toute la journée)
  - Utilisateur
  - Paire de skis et chaussures utilisées
  - Type de sortie (Piste, Hors-piste, Course, Entraînement, Touring)
  - Amis présents
  - Hors-pistes effectués avec nombre de passages et évaluation
- **Location et prêt** : Options spéciales pour matériel de location ou prêté
- **Historique complet** : Consultez toutes vos sorties passées avec filtres par utilisateur ou par paire de skis

### 🛠️ Entretien du matériel
- **Suivi des entretiens** : Enregistrez les opérations d'entretien :
  - Affûtage (Sharpening)
  - Fartage (Waxing)
  - Réparations (Repair)
- **Alertes intelligentes** : Le système vous indique automatiquement :
  - Nombre de sorties depuis le dernier affûtage
  - Nombre de sorties depuis le dernier fartage
  - Date du dernier entretien

### 🗺️ Gestion des hors-pistes
- **Base personnelle** : Créez votre bibliothèque de hors-pistes favoris
- **Évaluation** : Notez chaque descente
- **Conditions** : Enregistrez les conditions (poudreuse, cailloux, etc.)
- **Statistiques** : Nombre de passages par hors-piste

### 👥 Multi-utilisateurs
- **Famille et amis** : Gérez plusieurs profils d'utilisateurs
- **Statistiques individuelles** : Chaque utilisateur a ses propres statistiques
- **Amis** : Enregistrez avec qui vous skiez

### 📈 Statistiques par saison
- **Vue globale** : Nombre total de sorties, de hors-pistes, de kilomètres
- **Par utilisateur** : Statistiques détaillées pour chaque skieur
- **Par paire de skis** : Utilisation de chaque paire
- **Entretiens** : Suivi des opérations d'entretien par paire

### 💾 Sauvegarde et synchronisation
- **Base de données locale** : SQLite embarquée, aucune connexion requise
- **Synchronisation WebDAV** : Sauvegardez et synchronisez vos données via WebDAV
- **Export/Import** : Sauvegardez et restaurez votre base de données
- **Confidentialité** : Toutes vos données restent sous votre contrôle

## 🚀 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn
- Expo CLI
- Android Studio (pour Android) ou Xcode (pour iOS)

### Installation des dépendances

```bash
npm install
```

### Lancer l'application

#### Mode développement
```bash
npx expo start
```

Vous pouvez ensuite :
- Appuyer sur `a` pour ouvrir sur un émulateur Android
- Appuyer sur `i` pour ouvrir sur un simulateur iOS
- Scanner le QR code avec l'app Expo Go

#### Build Android
```bash
npx expo run:android
```

#### Build iOS
```bash
npx expo run:ios
```

## 📱 Technologies utilisées

- **Framework** : [React Native](https://reactnative.dev/) avec [Expo](https://expo.dev/)
- **Routing** : [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Base de données** : [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Interface** : React Native avec composants personnalisés
- **Synchronisation** : [WebDAV](https://github.com/perry-mitchell/webdav-client) pour sync cloud
- **Gestion d'état** : React Context API
- **Stockage local** : Async Storage
- **Internationalisation** : Support multi-langues (Français/Anglais)

## 🗂️ Structure du projet

```
app/
├── (drawer)/          # Navigation par tiroir
│   ├── (tabs)/        # Onglets principaux
│   │   ├── index.tsx          # Écran d'accueil
│   │   ├── events.tsx         # Journal des sorties
│   │   ├── friends.tsx        # Amis
│   │   └── offpistes.tsx      # Hors-pistes
│   ├── skis-management.tsx    # Gestion des skis
│   ├── boots-management.tsx   # Gestion des chaussures
│   ├── users-management.tsx   # Gestion des utilisateurs
│   ├── seasons-statistics.tsx # Statistiques par saison
│   └── settings.tsx           # Paramètres
components/           # Composants réutilisables
hooks/               # Hooks et logique métier
│   ├── dbSkis.tsx           # Gestion BDD skis
│   ├── dbBoots.tsx          # Gestion BDD chaussures
│   ├── dbOutings.tsx        # Gestion BDD sorties
│   ├── webdav-sync.tsx      # Synchronisation WebDAV
│   └── DataManager.tsx      # Gestionnaire de données
constants/           # Constantes et traductions
context/             # Contextes React (Thème, App)
```

## 🎨 Fonctionnalités avancées

- **Thème** : Mode clair/sombre automatique selon les préférences système
- **Offline-first** : Fonctionne complètement hors ligne
- **Aucun tracker** : Respect total de votre vie privée
- **Aucune publicité** : Application 100% gratuite
- **Open Source** : Code source ouvert sous licence GPL-3.0

## 📄 License

Ce projet est sous licence **GPL-3.0-or-later**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs via les [Issues](https://github.com/githubbab/Skis-Manager/issues)
- Proposer des améliorations
- Soumettre des Pull Requests

## 🔗 Liens utiles

- **Repository** : [github.com/githubbab/Skis-Manager](https://github.com/githubbab/Skis-Manager)

## 📞 Contact

Pour toute question ou suggestion, ouvrez une issue sur GitHub.

---

**Bon ski ! 🎿❄️**
