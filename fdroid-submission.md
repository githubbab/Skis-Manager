# Message de soumission F-Droid

Créez une nouvelle issue sur : https://gitlab.com/fdroid/rfp/-/issues/new

---

## 📝 Titre de l'issue (champ "Title")

```
Skis-Manager - Ski outing and off-piste manager
```

## 📄 Description de l'issue (champ "Description")

**Name:** Skis-Manager

**Description:** Comprehensive application for managing ski equipment and mountain outings. Track your skis, boots, outings, off-piste runs, and maintenance with local SQLite database and optional WebDAV sync.

**License:** GPL-3.0-or-later

**Source code:** https://github.com/githubbab/Skis-Manager

**Package ID:** fr.babouscorp.SkisManager

**Author:** githubbab

**Categories:** Sports & Health

**Version:** 1.0.0

**Additional info:**

**Main features:**
- Equipment management (skis, boots, brands, types)
- Detailed outing tracking with date, user, equipment
- Maintenance tracking (sharpening, waxing, repairs) with automatic alerts
- Off-piste library with ratings and conditions
- Multi-user support with individual statistics
- Season statistics (outings, off-pistes, maintenance)
- Local SQLite database (works completely offline)
- Optional WebDAV synchronization
- Automatic light/dark theme

**Technical stack:**
- Built with React Native 0.81.5 / Expo 54.0.33
- Native Android code generated with `expo prebuild`
- Local SQLite database
- WebDAV sync support
- No trackers, no ads, no Google Services
- No account required
- 100% free and open source

**Build info:**
- The project has been prebuild with `npx expo prebuild --clean`
- Native Android code is included in the repository
- Successfully builds with Gradle (`./gradlew assembleRelease`)
- versionCode: 1000
- versionName: 1.0.0
- minSdkVersion: 24
- targetSdkVersion: 36

**Privacy:**
- No trackers
- No analytics
- No proprietary dependencies (no Google Play Services, no Firebase)
- All data stored locally
- Optional self-hosted WebDAV sync

**Repository structure:**
- `/android` - Native Android code (included for F-Droid builds)
- `/ios` - Native iOS code
- `/app` - React Native application code
- `/hooks` - Database and business logic
- `/components` - Reusable UI components

**Ready for F-Droid:**
- ✅ GPL-3.0-or-later license
- ✅ Public source code on GitHub
- ✅ Native Android code generated and versioned
- ✅ Successfully builds locally with Gradle
- ✅ No proprietary dependencies
- ✅ Tagged release v1.0.0
- ✅ Fastlane metadata (French and English)

**Additional notes:**
This is my first submission to F-Droid. The app is fully functional and has been tested locally. I'm available to make any necessary adjustments for F-Droid compatibility.

Thank you for considering this application!

---

## 📋 Instructions

1. **Allez sur** : https://gitlab.com/fdroid/rfp/-/issues/new
2. **Dans le champ "Title"** : Copiez `Skis-Manager - Ski outing and off-piste manager`
3. **Dans le champ "Description"** : Copiez tout le contenu depuis `**Name:** Skis-Manager` jusqu'à `Thank you for considering this application!`
4. **Cliquez** sur "Create issue"
5. **Attendez** la réponse des mainteneurs F-Droid (1-4 semaines)
