# Guide de publication sur F-Droid

Ce guide explique comment publier l'application Skis-Manager sur F-Droid.

## 📋 Prérequis

### 1. Licence Open Source (OBLIGATOIRE)

F-Droid n'accepte que les applications open source. Vous devez :

1. Créer un fichier `LICENSE` à la racine du projet
2. Utiliser une licence compatible F-Droid (GPL-3.0, Apache 2.0, MIT, etc.)

**Pour créer le fichier LICENSE avec GPL-3.0 :**
```bash
curl https://www.gnu.org/licenses/gpl-3.0.txt > LICENSE
```

Ajoutez ensuite dans `package.json` :
```json
{
  "license": "GPL-3.0-or-later"
}
```

### 2. Dépôt Git Public

Votre code doit être hébergé sur un dépôt Git public :
- ✅ GitHub : https://github.com/githubbab/Skis-Manager
- Ou GitLab, Codeberg, etc.

### 3. Builds Reproductibles

**⚠️ PROBLÈME AVEC EXPO :**
- F-Droid construit les applications depuis les sources
- Expo utilise EAS Build (service cloud propriétaire)
- F-Droid ne peut pas utiliser EAS Build

**SOLUTION : Migrer vers du build natif Gradle**

## 🔧 Étape 1 : Éjecter de Expo (REQUIS pour F-Droid)

F-Droid ne peut pas builder des projets Expo non-éjectés. Vous devez :

### Option A : Prebuild (Recommandé)

```bash
# Générer les dossiers android/ et ios/ natifs
npx expo prebuild --clean

# Vérifier que le build fonctionne localement
npx expo run:android
```

Cette commande :
- Génère le code Android natif complet
- Crée les fichiers Gradle nécessaires
- Conserve la compatibilité partielle avec Expo

### Option B : Éjection complète

```bash
# Éjecter complètement de Expo
npx expo eject
```

⚠️ Après l'éjection, vous ne pourrez plus utiliser certains services Expo.

## 📦 Étape 2 : Nettoyer les dépendances propriétaires

F-Droid refuse les applications contenant :
- Services Google Play propriétaires
- Trackers
- Binaires pré-compilés non open source

**Vérifier vos dépendances :**

1. Pas de Google Services dans `android/app/build.gradle`
   ```gradle
   // ❌ À RETIRER si présent
   implementation 'com.google.android.gms:play-services-*'
   implementation 'com.google.firebase:*'
   ```

2. Vos dépendances actuelles semblent OK ✅ :
   - Expo SDK (open source)
   - React Native (open source)
   - WebDAV (open source)
   - SQLite (open source)

## 📝 Étape 3 : Créer le fichier métadonnées

Créez `fastlane/metadata/android/fr-FR/` avec :

### `fastlane/metadata/android/fr-FR/full_description.txt`
```
Skis-Manager est une application de gestion de sorties ski et hors-piste.

Fonctionnalités :
• Suivi des sorties ski
• Gestion des hors-pistes
• Gestion des amis et du matériel
• Synchronisation WebDAV
• Base de données SQLite locale
• Pas de compte requis
• Pas de trackers
• 100% gratuit et open source
```

### `fastlane/metadata/android/fr-FR/short_description.txt`
```
Gestionnaire de sorties ski et hors-piste
```

### `fastlane/metadata/android/fr-FR/title.txt`
```
Skis-Manager
```

### Captures d'écran
Placez 4-8 captures dans : `fastlane/metadata/android/fr-FR/images/phoneScreenshots/`

## 🚀 Étape 4 : Soumettre à F-Droid

### Méthode 1 : Demande via GitLab (Recommandé)

1. Allez sur : https://gitlab.com/fdroid/rfp/-/issues

2. Créez une nouvelle issue "Request for Packaging" :

```markdown
Title: Skis-Manager - Ski outing and off-piste manager

**Name:** Skis-Manager
**Description:** Application for managing ski outings, off-piste tracking, and equipment
**License:** GPL-3.0-or-later
**Source code:** https://github.com/githubbab/Skis-Manager
**Package ID:** fr.babouscorp.SkisManager
**Author:** githubbab
**Categories:** Sports & Health

**Additional info:**
- Built with React Native / Expo
- Local SQLite database
- WebDAV sync support
- No trackers, no ads, no Google Services
- Fully open source
```

3. Un mainteneur F-Droid examinera votre demande

### Méthode 2 : Créer vous-même le fichier métadonnées

Forkez le dépôt https://gitlab.com/fdroid/fdroiddata

Créez `metadata/fr.babouscorp.SkisManager.yml` :

```yaml
Categories:
  - Sports & Health
License: GPL-3.0-or-later
AuthorName: githubbab
AuthorWebSite: https://github.com/githubbab
SourceCode: https://github.com/githubbab/Skis-Manager
IssueTracker: https://github.com/githubbab/Skis-Manager/issues

AutoName: Skis-Manager
Description: |-
  Skis-Manager est une application de gestion de sorties ski et hors-piste.
  
  Fonctionnalités :
  * Suivi des sorties ski
  * Gestion des hors-pistes
  * Gestion des amis et du matériel
  * Synchronisation WebDAV
  * Base de données SQLite locale
  * Pas de compte requis
  * Pas de trackers
  * 100% gratuit et open source

RepoType: git
Repo: https://github.com/githubbab/Skis-Manager.git

Builds:
  - versionName: 0.9.16
    versionCode: 916
    commit: v0.9.16  # Tag Git à créer
    subdir: android/app
    gradle:
      - yes
    prebuild: cd ../.. && npm install

AutoUpdateMode: Version v%v
UpdateCheckMode: Tags
CurrentVersion: 0.9.16
CurrentVersionCode: 916
```

Soumettez une Merge Request sur GitLab.

## 🏷️ Étape 5 : Versioning Git

F-Droid utilise les tags Git. Créez un tag pour chaque version :

```bash
# Tag de la version actuelle
git tag -a v0.9.16 -m "Version 0.9.16 for F-Droid"
git push origin v0.9.16

# Pour les prochaines versions
git tag -a v0.9.17 -m "Version 0.9.17"
git push origin v0.9.17
```

## 📱 Étape 6 : Configurer versionCode dans build.gradle

Éditez `android/app/build.gradle` :

```gradle
android {
    defaultConfig {
        applicationId "fr.babouscorp.SkisManager"
        versionCode 916  // Doit augmenter à chaque version
        versionName "0.9.16"  // Correspond à package.json
    }
}
```

**Règle pour versionCode :**
- Version 0.9.16 → versionCode 916
- Version 1.0.0 → versionCode 1000
- Version 1.2.3 → versionCode 1203

## ✅ Checklist finale

Avant de soumettre à F-Droid :

- [ ] Fichier LICENSE créé (GPL-3.0 ou autre)
- [ ] Code source public sur Git
- [ ] Projet éjecté de Expo (`npx expo prebuild`)
- [ ] Build Gradle fonctionne localement
- [ ] Aucune dépendance propriétaire (Google Play Services, etc.)
- [ ] versionCode et versionName configurés
- [ ] Tags Git créés pour les versions
- [ ] Métadonnées Fastlane créées (optionnel mais recommandé)
- [ ] README.md à jour avec mention "Disponible sur F-Droid"

## 🔍 Vérification locale

Testez si votre build est compatible F-Droid :

```bash
# Installer fdroid scanner (nécessite Python)
pip install fdroidserver

# Scanner votre projet
cd /home/sebm/Documents/Perso/Skis-Manager
fdroid scanner fr.babouscorp.SkisManager
```

Cet outil détecte :
- Binaires non-libres
- Trackers
- Dépendances propriétaires

## 📞 Support F-Droid

- **Forum :** https://forum.f-droid.org/
- **Matrix/IRC :** #fdroid:f-droid.org
- **Documentation :** https://f-droid.org/docs/

## ⏱️ Délai de publication

Après soumission :
- **Review initiale :** 1-4 semaines
- **Build et publication :** quelques jours après validation
- **Mises à jour :** détectées automatiquement via tags Git

## 🎯 Prochaines étapes immédiates

1. **Créer LICENSE**
   ```bash
   curl https://www.gnu.org/licenses/gpl-3.0.txt > LICENSE
   ```

2. **Éjecter Expo**
   ```bash
   npx expo prebuild --clean
   ```

3. **Tagger la version**
   ```bash
   git tag -a v0.9.16 -m "Version 0.9.16"
   git push origin v0.9.16
   ```

4. **Soumettre sur GitLab**
   https://gitlab.com/fdroid/rfp/-/issues/new

## ⚠️ Points d'attention pour votre projet

1. **Expo/React Native :** F-Droid peut builder React Native, mais il faut du Gradle natif
2. **WebDAV :** Vérifier que la dépendance `webdav` est 100% open source (✅ semble OK)
3. **EAS Build :** Ne sera plus utilisable, builds locaux uniquement
4. **Auto-updates :** F-Droid gère les mises à jour, pas besoin de système OTA

Bonne chance pour votre publication sur F-Droid ! 🎿
