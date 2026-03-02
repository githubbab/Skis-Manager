# Fastlane Metadata pour F-Droid

Ce dossier contient les métadonnées de l'application pour F-Droid.

## 📁 Structure

```
fastlane/
└── metadata/
    └── android/
        ├── fr-FR/              # Métadonnées en français
        │   ├── title.txt
        │   ├── short_description.txt
        │   ├── full_description.txt
        │   └── images/
        │       └── phoneScreenshots/   # Mettez vos captures ici
        └── en-US/              # Métadonnées en anglais
            ├── title.txt
            ├── short_description.txt
            ├── full_description.txt
            └── images/
                └── phoneScreenshots/   # Mettez vos captures ici
```

## 📸 Captures d'écran

Pour compléter la soumission F-Droid, ajoutez 4 à 8 captures d'écran :

### Format requis
- **Résolution** : 1080x1920 ou similaire (ratio 16:9)
- **Format** : PNG ou JPEG
- **Nombre** : 4 à 8 captures
- **Nommage** : Numérotées (ex: `01.png`, `02.png`, etc.)

### Comment faire les captures

**Sur Android :**
```bash
# Lancer l'app sur un émulateur ou appareil
npx expo run:android

# Prendre des captures avec adb
adb shell screencap -p /sdcard/screenshot-01.png
adb pull /sdcard/screenshot-01.png fastlane/metadata/android/fr-FR/images/phoneScreenshots/01.png
```

**Ou depuis l'appareil :**
1. Lancez l'application
2. Naviguez vers les écrans importants
3. Faites des captures (bouton Power + Volume bas)
4. Transférez les fichiers vers le bon dossier

### Écrans suggérés à capturer

1. **Écran d'accueil** - Vue principale avec les skis
2. **Journal des sorties** - Liste des événements
3. **Gestion des skis** - Vue de la gestion du matériel
4. **Statistiques** - Vue des statistiques par saison
5. **Gestion des hors-pistes** - Liste des hors-pistes
6. **Paramètres/Sync** - Options de synchronisation WebDAV

### Placer les captures

Copiez vos captures dans :
- `fastlane/metadata/android/fr-FR/images/phoneScreenshots/` (captures en français)
- `fastlane/metadata/android/en-US/images/phoneScreenshots/` (captures en anglais)

**Note :** Vous pouvez utiliser les mêmes captures pour les deux langues si l'interface n'est pas traduite.

## ✅ Validation

Une fois les captures ajoutées, vérifiez :

```bash
ls -lh fastlane/metadata/android/fr-FR/images/phoneScreenshots/
ls -lh fastlane/metadata/android/en-US/images/phoneScreenshots/
```

Vous devriez voir 4 à 8 fichiers PNG/JPEG dans chaque dossier.

## 📤 Soumission

Ces métadonnées seront utilisées automatiquement par F-Droid lors de la publication de votre application.
