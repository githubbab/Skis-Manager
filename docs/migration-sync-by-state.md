# Migration vers la synchronisation par état

## Modifications effectuées

### 1. Base de données (DataManager.tsx)

#### Version de la base
- **Avant** : DATABASE_VERSION = 2
- **Après** : DATABASE_VERSION = 3

#### Migration version 2 → 3
Ajout des champs de synchronisation :
- `lastModified` (INTEGER) : timestamp de la dernière modification
- `modifiedBy` (TEXT) : ID du device ayant effectué la modification

Tables concernées :
- itemsSkis
- itemsUsers
- itemsBoots
- itemsBrands
- itemsFriends
- itemsOffPistes
- eventsOutings
- eventsMaintains
- typeOfOutings
- typeOfSkis
- itemsSeasons

#### Nouvelles tables
1. **syncMetadata** : stocke les métadonnées de synchronisation
   - key (TEXT, PRIMARY KEY)
   - value (TEXT)
   - Valeurs initiales : lastSyncTimestamp=0, syncVersion=1

2. **syncFiles** : gère les métadonnées des fichiers (images)
   - filename (TEXT, PRIMARY KEY)
   - lastModified (INTEGER)
   - modifiedBy (TEXT)
   - deleted (INTEGER, default 0)

#### Modifications des fonctions

##### isTableSyncable()
Nouvelle fonction qui détermine si une table doit être synchronisée :
```typescript
function isTableSyncable(table: string): boolean {
  const syncableTables = [
    TABLES.SKIS, TABLES.USERS, TABLES.BOOTS, TABLES.BRANDS,
    TABLES.FRIENDS, TABLES.OFFPISTES, TABLES.OUTINGS, TABLES.MAINTAINS,
    TABLES.TYPE_OF_OUTINGS, TABLES.TYPE_OF_SKIS, TABLES.SEASONS
  ];
  return syncableTables.includes(table);
}
```

##### insertQuery()
- **Nouveau paramètre** : `withSync: boolean = true`
- **Comportement** : Si `withSync=true` et que la table est synchronisable, ajoute automatiquement les champs `lastModified` et `modifiedBy`

##### updateQuery()
- **Nouveau paramètre** : `withSync: boolean = true`
- **Comportement** : Si `withSync=true` et que la table est synchronisable, ajoute automatiquement les champs `lastModified` et `modifiedBy`

## Compatibilité

### Rétrocompatibilité
✅ Les appels existants à `insertQuery()` et `updateQuery()` continuent de fonctionner sans modification car le paramètre `withSync` est optionnel (par défaut `true`).

✅ Les tables de jointure ne sont pas affectées car `isTableSyncable()` retourne `false` pour elles.

## Prochaines étapes

### Phase 1 : Tests ✅
- [x] Modifier le schéma de base (migration v2 → v3)
- [x] Ajouter les fonctions helpers (`isTableSyncable`, `insertQuery`, `updateQuery`)
- [ ] Tester la migration sur un device de développement
- [ ] Vérifier que les données existantes ont bien été initialisées

### Phase 2 : Création du moteur de synchronisation
- [ ] Créer `hooks/syncByState.tsx`
- [ ] Implémenter `syncByState()`
- [ ] Implémenter `mergeAllTables()`
- [ ] Implémenter `mergeTable()`
- [ ] Implémenter la gestion des images

### Phase 3 : Intégration
- [ ] Ajouter un flag `useNewSync` dans les settings
- [ ] Modifier `AppContext.tsx` pour utiliser le nouveau système en parallèle
- [ ] Tester avec 2 devices

### Phase 4 : Migration progressive
- [ ] Activer pour un device de test
- [ ] Si OK, activer pour tous les devices
- [ ] Supprimer l'ancien système (journal d'actions)

### Phase 5 : Nettoyage
- [ ] Supprimer les fichiers d'actions obsolètes
- [ ] Supprimer le code du journal d'actions
- [ ] Mettre à jour la documentation

## Notes importantes

⚠️ **Backup** : Avant de tester, faire un backup de la base de données
⚠️ **Test** : Tester d'abord sur un seul device avant de déployer
⚠️ **Migration** : La migration est irréversible (passage de v2 à v3)

## Avantages de la synchronisation par état

✅ Plus simple à comprendre et maintenir
✅ Pas de gestion complexe de journal d'actions
✅ Conflits résolus automatiquement (timestamp le plus récent)
✅ Nouveau device = copie de l'état final (pas de replay)
✅ Pas de problème de déduplication
✅ Facile à débugger

## Désavantages

⚠️ Plus gourmand en bande passante (copie de bases complètes)
⚠️ Nécessite compression pour optimiser
⚠️ Synchronisation plus longue si beaucoup de données

## Optimisations futures

- [ ] Compression gzip des bases avant upload
- [ ] Synchronisation incrémentale (uniquement les changements)
- [ ] Vérification rapide de version avant téléchargement
- [ ] Indicateur visuel de l'état de sync
