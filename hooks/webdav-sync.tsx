import { Buffer } from "buffer";
import { AuthType, createClient, FileStat, WebDAVClient } from "webdav";
import { SQLiteDatabase } from "expo-sqlite";
import { showMessage } from "react-native-flash-message";
import { TABLES, imgStoreDir } from "./DataManager";
import { File } from "expo-file-system";
import { Logger } from "./ToolsBox";

export type SyncStatus = "synced" | "syncing" | "error" | "disabled" | "wait";

export type DeviceInfo = {
  id: string;
  lastModified: Date;
}

type SyncMetadata = {
  lastSyncTimestamp: number;
  syncVersion: number;
}

type TableData = Record<string, unknown[]>;

type RemoteDatabase = {
  deviceId: string;
  timestamp: number;
  data: {
    tables: TableData;
    metadata?: SyncMetadata;
  };
}

type MergeResult = {
  inserted: number;
  updated: number;
  conflicts: number;
}

// List of tables that should be synchronized
const SYNCABLE_TABLES = [
  TABLES.SKIS,
  TABLES.USERS,
  TABLES.BOOTS,
  TABLES.BRANDS,
  TABLES.FRIENDS,
  TABLES.OFFPISTES,
  TABLES.OUTINGS,
  TABLES.MAINTAINS,
  TABLES.TYPE_OF_OUTINGS,
  TABLES.TYPE_OF_SKIS,
  TABLES.SEASONS,
  TABLES.JOIN_SKIS_USERS,
  TABLES.JOIN_BOOTS_USERS,
  TABLES.JOIN_SKIS_BOOTS,
  TABLES.JOIN_OUTINGS_FRIENDS,
  TABLES.JOIN_OUTINGS_OFFPISTES,
];

/**
 * Crée et initialise un client WebDAV.
 *
 * Tente de se connecter au serveur WebDAV fourni avec les identifiants.
 * Vérifie la présence du répertoire `/images` et le crée si nécessaire.
 *
 * @param params Objet contenant l'URL du serveur, le nom d'utilisateur et le mot de passe
 * @param params.url URL du serveur WebDAV (ex: "https://example.com/remote.php/dav/files/")
 * @param params.user Nom d'utilisateur pour l'authentification
 * @param params.password Mot de passe pour l'authentification
 * @returns Une instance de `WebDAVClient` en cas de succès, ou une chaîne d'erreur commençant par "ERROR: " en cas d'échec
 */
export async function createWebDavClient(params: { url: string, user: string, password: string }): Promise<WebDAVClient | string> {
  try {
    const client = createClient(
      params.url,
      {
        username: params.user,
        password: params.password,
        authType: AuthType.Password,
      }
    );
    const contents: FileStat[] = await getRemoteDirectoryContents(client, "/");
    Logger.debug("WebDav connection test succeeded");
    const hasImagesDir = contents.some((item) => item.type === "directory" && item.basename === "images");
    if (!hasImagesDir) {
      await client.createDirectory("/images");
      Logger.debug("Created /images directory on WebDav server");
    }
    return client;
  } catch (error) {
    Logger.error("WebDav connection test failed: ", error);
    return "ERROR: " + (error instanceof Error ? error.message : String(error));
  }
}

/**
 * Récupère le contenu d'un répertoire distant via le client WebDAV.
 *
 * Normalise la réponse du client pour toujours retourner un tableau de `FileStat`.
 *
 * @param client Instance de `WebDAVClient`
 * @param path Chemin distant à lister (ex: "/" ou "/images")
 * @returns Un tableau d'objets `FileStat` représentant les éléments du répertoire
 */
async function getRemoteDirectoryContents(client: WebDAVClient, path: string): Promise<FileStat[]> {
  const contentsRaw = await client.getDirectoryContents(path);
  const contents: FileStat[] = Array.isArray(contentsRaw)
    ? contentsRaw
    : (contentsRaw.data as FileStat[]);
  return contents;
}

/**
 * Importe toutes les images disponibles sur le serveur WebDAV vers le stockage local.
 *
 * Fonction utilisée pour les importations initiales (legacy). Pour chaque fichier
 * trouvé dans `/images`, appelle `importRemoteFile` pour le copier localement.
 *
 * @param client Instance de `WebDAVClient` utilisée pour l'accès distant
 */
export async function importAllRemoteImages(client: WebDAVClient): Promise<void> {
  Logger.debug("Importing all remote images from WebDav server");
  const remoteImages: FileStat[] = (await getRemoteDirectoryContents(client, "/images/")).filter((item) => item.type === "file");

  for (const image of remoteImages) {
    const localPath = `${imgStoreDir.uri}/${image.basename}`;
    await importRemoteFile(client, "/images/" + image.basename, localPath);
  }
}

/**
 * Importe un fichier distant unique depuis WebDAV vers le chemin local fourni.
 *
 * Gère plusieurs formats de retour du client (`Buffer`, `string`, `ArrayBuffer`).
 * Si le fichier local existe déjà, il est supprimé avant l'écriture.
 *
 * @param client Instance de `WebDAVClient`
 * @param remotePath Chemin du fichier sur le serveur (ex: "/images/photo.png")
 * @param localPath Chemin local où écrire le fichier (URI complet)
 * @throws Erreur si le type de contenu renvoyé par le client n'est pas pris en charge
 */
async function importRemoteFile(client: WebDAVClient, remotePath: string, localPath: string): Promise<void> {
  const fileStream = await client.getFileContents(remotePath, { format: "binary" });
  let buffer: Buffer;
  if (Buffer.isBuffer(fileStream)) {
    buffer = fileStream;
  } else if (typeof fileStream === "string") {
    buffer = Buffer.from(fileStream);
  } else if (fileStream instanceof ArrayBuffer) {
    buffer = Buffer.from(new Uint8Array(fileStream));
  } else {
    throw new Error("Unsupported fileStream type");
  }
  const localFile = new File(localPath);
  if (localFile.exists) {
    localFile.delete();
  }
  localFile.write(buffer);
}

/**
 * Compte le nombre total d'enregistrements présents localement dans les tables synchronisables.
 *
 * Utilisé pour déterminer si la base locale est vide lors d'un premier sync.
 *
 * @param db Instance de `SQLiteDatabase`
 * @returns Nombre total d'enregistrements dans toutes les tables synchronisables
 */
async function countLocalRecords(db: SQLiteDatabase): Promise<number> {
  let total = 0;

  for (const tableName of SYNCABLE_TABLES) {
    try {
      const result = await db.getAllAsync(`SELECT COUNT(*) as count FROM ${tableName}`);
      const count = (result[0] as any).count || 0;
      total += count;
    } catch (error) {
      Logger.error(`Error counting records in ${tableName}:`, error);
    }
  }

  return total;
}

/**
 * Fonction principale de synchronisation basée sur l'état.
 *
 * Orchestration complète du processus de synchronisation :
 * - Téléchargement des bases distantes
 * - Fusion/import selon si l'appareil est nouveau ou non
 * - Upload de la base locale
 * - Synchronisation des images
 * - Mise à jour des métadonnées de synchronisation
 *
 * @param db Instance de `SQLiteDatabase` locale
 * @param webDavClient Client WebDAV connecté
 * @param deviceId Identifiant local de l'appareil (ex: 'ABCD')
 * @param onProgress Callback optionnel pour remonter le statut (SyncStatus, message)
 * @param silent Si true, supprime les notifications visuelles (utile pour les syncs en arrière-plan)
 * @returns `true` si la synchronisation s'est bien déroulée, `false` sinon
 */
export async function syncByState(
  db: SQLiteDatabase,
  webDavClient: WebDAVClient,
  deviceId: string,
  onProgress?: (status: SyncStatus, message?: string) => void,
  silent: boolean = false
): Promise<boolean> {
  Logger.info("=== Starting state-based sync ===");

  try {
    onProgress?.("syncing", "Récupération des bases distantes...");

    // 1. Check if this is the first sync for this device
    const metadata = await getSyncMetadata(db);
    const isFirstSync = metadata.lastSyncTimestamp === 0;

    if (isFirstSync) {
      Logger.info("🆕 First sync detected for this device");
    }

    // 2. Download all remote databases
    const remoteDatabases = await downloadRemoteDatabases(webDavClient);
    Logger.debug(`Found ${remoteDatabases.length} remote databases`);

    // 3. Check if we're the only device
    const otherDevices = remoteDatabases.filter(db => db.deviceId !== deviceId);

    if (isFirstSync && otherDevices.length === 0) {
      Logger.info("🎉 First device in the sync network - uploading initial state");
      // We're the first device, just upload our state
      onProgress?.("syncing", "Premier appareil - envoi des données...");
      await uploadDatabase(db, webDavClient, deviceId);

    } else if (isFirstSync && otherDevices.length > 0) {
      Logger.info("📥 New device joining existing sync network - importing data");
      // We're a new device joining an existing network
      onProgress?.("syncing", "Importation des données existantes...");

      // Count local records to check if database is empty
      const localRecordCount = await countLocalRecords(db);

      if (localRecordCount > 0) {
        Logger.warn(`⚠️ Local database has ${localRecordCount} records - will merge with remote data`);
        onProgress?.("syncing", "Fusion des données locales et distantes...");
      }

      // Merge all remote databases
      for (const remoteDb of otherDevices) {
        await mergeRemoteDatabase(db, remoteDb, deviceId);
      }

      // Upload our merged state
      onProgress?.("syncing", "Envoi de la base fusionnée...");
      await uploadDatabase(db, webDavClient, deviceId);

    } else {
      // Normal sync - merge changes
      Logger.info("🔄 Normal sync - merging changes");
      onProgress?.("syncing", "Fusion des données...");

      for (const remoteDb of otherDevices) {
        await mergeRemoteDatabase(db, remoteDb, deviceId);
      }

      // Upload our local database
      onProgress?.("syncing", "Envoi de la base locale...");
      await uploadDatabase(db, webDavClient, deviceId);
    }

    // 4. Sync images
    onProgress?.("syncing", "Synchronisation des images...");
    await syncImages(db, webDavClient, deviceId);

    // 5. Update sync metadata
    const now = Date.now();
    await db.execAsync(
      `INSERT OR REPLACE INTO syncMetadata (key, value) VALUES ('lastSyncTimestamp', '${now}')`
    );

    onProgress?.("synced", "Synchronisation terminée");
    Logger.info("=== Sync completed successfully ===");

    if (!silent) {
      showMessage({
        message: "Synchronisation réussie",
        type: "success",
        duration: 2000,
      });
    }

    return true;

  } catch (error) {
    Logger.error("Sync error:", error);
    onProgress?.("error", "Erreur de synchronisation");

    if (!silent) {
      showMessage({
        message: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : String(error),
        type: "danger",
        duration: 4000,
      });
    }

    return false;
  }
}

/**
 * Télécharge et parse toutes les bases distantes présentes sur le serveur WebDAV.
 *
 * Recherche les fichiers nommés `db-XXXX-timestamp.json`, télécharge leur contenu
 * et retourne un tableau d'objets `RemoteDatabase`.
 *
 * @param webDavClient Client WebDAV connecté
 * @returns Tableau de bases distantes (possiblement vide)
 */
async function downloadRemoteDatabases(webDavClient: WebDAVClient): Promise<RemoteDatabase[]> {
  const databases: RemoteDatabase[] = [];

  try {
    // Check if root directory exists and is accessible
    const rootExists = await webDavClient.exists("/");
    if (!rootExists) {
      Logger.warn("WebDAV root directory not accessible");
      return databases;
    }

    const contents = await webDavClient.getDirectoryContents("/") as any[];

    for (const item of contents) {
      // Look for files like "db-XXXX-timestamp.json"
      if (item.type === "file" && item.basename.startsWith("db-") && item.basename.endsWith(".json")) {
        const match = item.basename.match(/^db-([A-Za-z0-9]{4})-(\d+)\.json$/);
        if (!match) continue;

        const deviceId = match[1];
        const timestamp = parseInt(match[2], 10);

        Logger.debug(`Downloading database from device ${deviceId}, timestamp ${timestamp}`);

        try {
          // Check if file still exists before downloading
          const fileExists = await webDavClient.exists(item.filename);
          if (!fileExists) {
            Logger.warn(`File ${item.filename} no longer exists, skipping`);
            continue;
          }

          // Download the file
          const content = await webDavClient.getFileContents(item.filename, { format: "text" }) as string;
          const data = JSON.parse(content);

          databases.push({
            deviceId,
            timestamp,
            data,
          });
        } catch (downloadError) {
          Logger.error(`Error downloading ${item.filename}:`, downloadError);
          // Continue with other files
          continue;
        }
      }
    }

  } catch (error) {
    Logger.error("Error downloading remote databases:", error);
    // Don't throw - return empty array to allow sync to continue
    // This handles the case where no files exist yet (first device)
  }

  return databases;
}

/**
 * Fusionne une base distante dans la base locale.
 *
 * Effectue la fusion table par table dans une transaction
 * et applique des règles de résolution de conflits basées sur `lastModified` et
 * `modifiedBy` pour conserver un résultat déterministe.
 *
 * @param db Instance de `SQLiteDatabase` locale
 * @param remoteDb Objet `RemoteDatabase` téléchargé depuis WebDAV
 * @param localDeviceId Identifiant de l'appareil local (utilisé pour ignorer/tenir compte des métadonnées)
 */
async function mergeRemoteDatabase(
  db: SQLiteDatabase,
  remoteDb: RemoteDatabase,
  localDeviceId: string
): Promise<void> {
  Logger.info(`Merging database from device ${remoteDb.deviceId}`);

  const results: { [table: string]: MergeResult } = {};

  try {
    // Start a transaction for atomicity
    await db.execAsync("BEGIN TRANSACTION");

    // Merge each syncable table
    for (const tableName of SYNCABLE_TABLES) {
      // Support both old format (data[tableName]) and new format (data.tables[tableName])
      let remoteRecords: unknown[] = [];

      if (remoteDb.data.tables) {
        // New format
        remoteRecords = remoteDb.data.tables[tableName] || [];
      } else if ((remoteDb.data as any)[tableName]) {
        // Old format (backward compatibility)
        remoteRecords = (remoteDb.data as any)[tableName] || [];
      }

      const result = await mergeTable(db, tableName, remoteRecords, localDeviceId);
      results[tableName] = result;

      Logger.debug(
        `Table ${tableName}: ${result.inserted} inserted, ${result.updated} updated, ${result.conflicts} conflicts`
      );
    }

    await db.execAsync("COMMIT");
    Logger.info("Merge completed successfully");

  } catch (error) {
    await db.execAsync("ROLLBACK");
    Logger.error("Error merging database:", error);
    throw error;
  }
}

/**
 * Retourne les colonnes constituant la clé primaire pour une table donnée.
 *
 * Gère les tables de jointure (clés composites) et retourne `['id']` par défaut.
 *
 * @param tableName Nom de la table
 * @returns Tableau de noms de colonnes formant la clé primaire
 */
function getPrimaryKeyColumns(tableName: string): string[] {
  // Define primary keys for join tables (composite keys)
  const joinTableKeys: { [key: string]: string[] } = {
    [TABLES.JOIN_SKIS_USERS]: ["idSkis", "idUser"],
    [TABLES.JOIN_BOOTS_USERS]: ["idBoots", "idUser"],
    [TABLES.JOIN_SKIS_BOOTS]: ["idSkis", "idBoots"],
    [TABLES.JOIN_OUTINGS_FRIENDS]: ["idOuting", "idFriend"],
    [TABLES.JOIN_OUTINGS_OFFPISTES]: ["idOuting", "idOffPiste"],
  };

  // Check if it's a join table
  if (joinTableKeys[tableName]) {
    return joinTableKeys[tableName];
  }

  // Default: all other tables use "id" as primary key
  return ["id"];
}

/**
 * Construit une clause WHERE et la liste de valeurs pour rechercher un enregistrement
 * en se basant sur la/les colonne(s) de clé primaire.
 *
 * @param tableName Nom de la table
 * @param record Objet représentant l'enregistrement distant
 * @returns Objet contenant `where` (chaîne SQL) et `values` (tableau de valeurs)
 */
function buildPrimaryKeyWhere(tableName: string, record: any): { where: string; values: any[] } {
  const pkColumns = getPrimaryKeyColumns(tableName);
  const whereClauses = pkColumns.map(col => `${col} = ?`);
  const values = pkColumns.map(col => record[col]);

  return {
    where: whereClauses.join(" AND "),
    values,
  };
}

/**
 * Fusionne les enregistrements d'une table distante dans la table locale.
 *
 * Pour chaque enregistrement distant :
 * - si l'enregistrement n'existe pas localement, il est inséré
 * - si l'enregistrement existe, on compare `lastModified` et on met à jour si
 *   la version distante est plus récente
 * - en cas de même `lastModified` et `modifiedBy` différents, une règle
 *   déterministe (comparaison lexicographique de `modifiedBy`) est appliquée
 *
 * @param db Instance de `SQLiteDatabase` locale
 * @param tableName Nom de la table à fusionner
 * @param remoteRecords Tableau d'enregistrements distants
 * @param localDeviceId Identifiant de l'appareil local (utilisé pour la résolution de conflits)
 * @returns Un objet `MergeResult` contenant les compteurs (inserted, updated, conflicts)
 */
async function mergeTable(
  db: SQLiteDatabase,
  tableName: string,
  remoteRecords: any[],
  localDeviceId: string
): Promise<MergeResult> {

  const result: MergeResult = {
    inserted: 0,
    updated: 0,
    conflicts: 0,
  };

  for (const remoteRecord of remoteRecords) {
    try {
      // Build WHERE clause based on primary key(s)
      const { where, values } = buildPrimaryKeyWhere(tableName, remoteRecord);

      // Get the local record with the same primary key
      const localRows = await db.getAllAsync(
        `SELECT * FROM ${tableName} WHERE ${where}`,
        values
      );

      if (localRows.length === 0) {
        // Record doesn't exist locally - insert it
        await insertRemoteRecord(db, tableName, remoteRecord);
        result.inserted++;

      } else {
        const localRecord = localRows[0] as any;

        // Compare timestamps to determine which version is newer
        const remoteTime = remoteRecord.lastModified || 0;
        const localTime = localRecord.lastModified || 0;

        if (remoteTime > localTime) {
          // Remote is newer - update local
          await updateWithRemoteRecord(db, tableName, remoteRecord);
          result.updated++;

        } else if (remoteTime === localTime && remoteRecord.modifiedBy !== localRecord.modifiedBy) {
          // Conflict: same timestamp, different device
          Logger.warn(`Conflict detected for ${tableName} with keys ${JSON.stringify(values)}`);
          // Keep the version from the device with lexicographically "smaller" ID (deterministic)
          if (remoteRecord.modifiedBy < localRecord.modifiedBy) {
            await updateWithRemoteRecord(db, tableName, remoteRecord);
            result.updated++;
          }
          result.conflicts++;

        }
        // else: local is newer or same, keep local version
      }

    } catch (error) {
      Logger.error(`Error merging record in ${tableName}:`, error);
      // Continue with next record
    }
  }

  return result;
}

/**
 * Insère un enregistrement distant dans la table locale.
 *
 * Prépare dynamiquement la liste de colonnes et les placeholders pour l'insertion.
 *
 * @param db Instance de `SQLiteDatabase`
 * @param tableName Nom de la table
 * @param record Objet représentant l'enregistrement à insérer
 */
async function insertRemoteRecord(db: SQLiteDatabase, tableName: string, record: any): Promise<void> {
  const columns = Object.keys(record).filter(k => k !== undefined && record[k] !== undefined);
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map(col => record[col]);

  const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;
  await db.runAsync(sql, values);
}

/**
 * Met à jour un enregistrement local avec les données provenant d'un enregistrement distant.
 *
 * Exclut les colonnes de clé primaire de la clause SET et utilise une clause WHERE
 * construite à partir des clés primaires pour cibler l'enregistrement.
 *
 * @param db Instance de `SQLiteDatabase`
 * @param tableName Nom de la table
 * @param record Objet représentant l'enregistrement distant
 */
async function updateWithRemoteRecord(db: SQLiteDatabase, tableName: string, record: any): Promise<void> {
  // Get primary key columns to exclude them from SET clause
  const pkColumns = getPrimaryKeyColumns(tableName);

  // Build SET clause (all columns except primary keys)
  const columns = Object.keys(record).filter(k => !pkColumns.includes(k) && record[k] !== undefined);
  const setClause = columns.map(col => `${col} = ?`).join(", ");
  const setValues = columns.map(col => record[col]);

  // Build WHERE clause for primary keys
  const { where, values: whereValues } = buildPrimaryKeyWhere(tableName, record);

  const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${where}`;
  await db.runAsync(sql, [...setValues, ...whereValues]);
}

/**
 * Exporte l'état local des tables synchronisables et l'envoie sur le serveur WebDAV.
 *
 * Le fichier est nommé `db-<deviceId>-<timestamp>.json`. Après l'upload, les
 * anciens fichiers du même device sont nettoyés (on conserve uniquement le plus récent).
 *
 * @param db Instance de `SQLiteDatabase` locale
 * @param webDavClient Client WebDAV connecté
 * @param deviceId Identifiant de l'appareil émetteur
 */
async function uploadDatabase(
  db: SQLiteDatabase,
  webDavClient: WebDAVClient,
  deviceId: string
): Promise<void> {

  try {
    const data: { [table: string]: any[] } = {};

    // Export all syncable tables
    for (const tableName of SYNCABLE_TABLES) {
      const rows = await db.getAllAsync(`SELECT * FROM ${tableName}`);
      data[tableName] = rows;
    }

    // Create filename with device ID and timestamp
    const timestamp = Date.now();
    const filename = `/db-${deviceId}-${timestamp}.json`;

    // Convert to JSON
    const json = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(json, "utf-8");

    // Upload to WebDAV
    await webDavClient.putFileContents(filename, buffer, { overwrite: true });
    Logger.info(`Database uploaded: ${filename}`);

    // Clean up old database files from this device (keep only the latest)
    await cleanupOldDatabaseFiles(webDavClient, deviceId);

  } catch (error) {
    Logger.error("Error uploading database:", error);
    throw error;
  }
}

/**
 * Supprime les anciens fichiers de base de données pour un appareil donné,
 * en conservant uniquement le fichier le plus récent.
 *
 * @param webDavClient Client WebDAV connecté
 * @param deviceId Identifiant de l'appareil dont on veut nettoyer les fichiers
 */
async function cleanupOldDatabaseFiles(webDavClient: WebDAVClient, deviceId: string): Promise<void> {
  try {
    const contents = await webDavClient.getDirectoryContents("/") as any[];
    const deviceFiles: { filename: string; timestamp: number }[] = [];

    // Find all database files for this device
    for (const item of contents) {
      if (item.type === "file" && item.basename.startsWith(`db-${deviceId}-`)) {
        const match = item.basename.match(/^db-[A-Za-z0-9]{4}-(\d+)\.json$/);
        if (match) {
          deviceFiles.push({
            filename: item.filename,
            timestamp: parseInt(match[1], 10),
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    deviceFiles.sort((a, b) => b.timestamp - a.timestamp);

    // Delete all but the most recent
    for (let i = 1; i < deviceFiles.length; i++) {
      Logger.debug(`Deleting old database file: ${deviceFiles[i].filename}`);
      await webDavClient.deleteFile(deviceFiles[i].filename);
    }

  } catch (error) {
    Logger.warn("Error cleaning up old database files:", error);
    // Non-critical error, continue
  }
}

/**
 * Synchronise les images entre le stockage local et le serveur WebDAV.
 *
 * - Télécharge les images distantes manquantes ou plus récentes
 * - Upload les images locales nouvelles/modifiées
 * - Supprime les images distantes marquées supprimées localement
 *
 * @param db Instance de `SQLiteDatabase` locale (utilisée pour la table `syncFiles`)
 * @param webDavClient Client WebDAV connecté
 * @param deviceId Identifiant de l'appareil local
 */
async function syncImages(
  db: SQLiteDatabase,
  webDavClient: WebDAVClient,
  deviceId: string
): Promise<void> {

  try {
    // 1. Get list of remote images
    const remoteImages = await getRemoteImageList(webDavClient);

    // 2. Get list of local images from syncFiles table
    const localImages = await db.getAllAsync(
      `SELECT * FROM syncFiles WHERE deleted = 0`
    ) as any[];

    // 3. Download missing images
    for (const remoteImage of remoteImages) {
      const localImage = localImages.find(img => img.filename === remoteImage.filename);

      if (!localImage || (remoteImage.lastModified > localImage.lastModified)) {
        // Download the image
        await downloadImage(webDavClient, remoteImage.filename);

        // Update syncFiles table
        await db.runAsync(
          `INSERT OR REPLACE INTO syncFiles (filename, lastModified, modifiedBy, deleted)
           VALUES (?, ?, ?, 0)`,
          [remoteImage.filename, remoteImage.lastModified, remoteImage.modifiedBy]
        );
      }
    }

    // 4. Upload new/modified local images
    const imageFiles = await imgStoreDir.list();
    for (const imageFile of imageFiles) {
      const file = new File(imageFile.uri);
      const filename = file.name || "";

      // Check if this image needs to be uploaded
      const syncRecord = localImages.find(img => img.filename === filename);
      const remoteImage = remoteImages.find(img => img.filename === filename);

      if (syncRecord && (!remoteImage || syncRecord.lastModified > remoteImage.lastModified)) {
        // Upload the image
        await uploadImage(webDavClient, file, filename);
      }
    }

    // 5. Handle deletions
    for (const localImage of localImages) {
      if (localImage.deleted === 1) {
        // Delete from WebDAV if it exists
        try {
          await webDavClient.deleteFile(`/images/${localImage.filename}`);
          Logger.debug(`Deleted remote image: ${localImage.filename}`);
        } catch {
          // File might not exist, that's ok
        }
      }
    }

    Logger.info("Image sync completed");

  } catch (error) {
    Logger.error("Error syncing images:", error);
    // Non-critical, don't throw
  }
}

/**
 * Récupère la liste des images disponibles sur le serveur WebDAV `/images`.
 *
 * Retourne un tableau d'objets contenant `filename`, `lastModified` et `modifiedBy`.
 * Si le répertoire `/images` n'existe pas, il est créé et une liste vide est retournée.
 *
 * @param webDavClient Client WebDAV connecté
 * @returns Tableau d'objets décrivant les images distantes
 */
async function getRemoteImageList(webDavClient: WebDAVClient): Promise<any[]> {
  const images: any[] = [];

  try {
    // Check if images directory exists
    const exists = await webDavClient.exists("/images");
    if (!exists) {
      await webDavClient.createDirectory("/images");
      return images;
    }

    const contents = await webDavClient.getDirectoryContents("/images") as any[];

    for (const item of contents) {
      if (item.type === "file") {
        // Extract metadata from filename if possible (e.g., "image-timestamp-deviceid.png")
        // For now, use the lastmod from WebDAV
        images.push({
          filename: item.basename,
          lastModified: new Date(item.lastmod).getTime(),
          modifiedBy: "unknown", // We don't have this info from WebDAV
        });
      }
    }

  } catch (error) {
    Logger.error("Error getting remote image list:", error);
  }

  return images;
}

/**
 * Télécharge une image depuis `/images/<filename>` et l'écrit dans le stockage local.
 *
 * @param webDavClient Client WebDAV connecté
 * @param filename Nom du fichier image distant
 */
async function downloadImage(webDavClient: WebDAVClient, filename: string): Promise<void> {
  try {
    const remotePath = `/images/${filename}`;
    const localPath = imgStoreDir.uri + filename;

    const content = await webDavClient.getFileContents(remotePath, { format: "binary" });
    const buffer = Buffer.from(content as ArrayBuffer);

    const file = new File(localPath);
    await file.write(buffer.toString("base64"));

    Logger.debug(`Downloaded image: ${filename}`);

  } catch (error) {
    Logger.error(`Error downloading image ${filename}:`, error);
    throw error;
  }
}

/**
 * Téléverse une image locale sur le serveur WebDAV dans `/images/<filename>`.
 *
 * Le contenu est lu depuis `file` (format base64 attendu) et envoyé sous forme binaire.
 *
 * @param webDavClient Client WebDAV connecté
 * @param file Instance `File` pointant vers le fichier local
 * @param filename Nom sous lequel enregistrer la ressource distante
 */
async function uploadImage(webDavClient: WebDAVClient, file: File, filename: string): Promise<void> {
  try {
    const remotePath = `/images/${filename}`;

    // Read the file
    const content = await file.text();
    const buffer = Buffer.from(content, "base64");

    // Ensure images directory exists
    const exists = await webDavClient.exists("/images");
    if (!exists) {
      await webDavClient.createDirectory("/images");
    }

    // Upload
    await webDavClient.putFileContents(remotePath, buffer, { overwrite: true });
    Logger.debug(`Uploaded image: ${filename}`);

  } catch (error) {
    Logger.error(`Error uploading image ${filename}:`, error);
    throw error;
  }
}

/**
 * Récupère la liste des appareils ayant déjà poussé une base sur le serveur.
 *
 * Analyse les fichiers `db-XXXX-<timestamp>.json` et retourne pour chaque
 * appareil l'identifiant et la date de sa dernière synchronisation.
 *
 * @param webDavClient Client WebDAV connecté
 * @returns Tableau d'objets `DeviceInfo` triés par date décroissante
 */
export async function getDeviceList(webDavClient: WebDAVClient): Promise<DeviceInfo[]> {
  const devices: DeviceInfo[] = [];
  const deviceMap = new Map<string, number>(); // deviceId -> latest timestamp

  try {
    // Check if root directory exists
    const rootExists = await webDavClient.exists("/");
    if (!rootExists) {
      Logger.warn("WebDAV root directory not accessible");
      return devices;
    }

    const contents = await webDavClient.getDirectoryContents("/") as any[];

    for (const item of contents) {
      // Look for files like "db-XXXX-timestamp.json"
      if (item.type === "file" && item.basename.startsWith("db-") && item.basename.endsWith(".json")) {
        const match = item.basename.match(/^db-([A-Za-z0-9]{4})-(\d+)\.json$/);
        if (!match) continue;

        const deviceId = match[1];
        const timestamp = parseInt(match[2], 10);

        // Keep only the latest timestamp for each device
        const currentTimestamp = deviceMap.get(deviceId);
        if (!currentTimestamp || timestamp > currentTimestamp) {
          deviceMap.set(deviceId, timestamp);
        }
      }
    }

    // Convert map to array
    for (const [deviceId, timestamp] of deviceMap.entries()) {
      devices.push({
        id: deviceId,
        lastModified: new Date(timestamp),
      });
    }

    // Sort by last modified (newest first)
    devices.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  } catch (error) {
    Logger.error("Error getting device list:", error);
    // Return empty array on error - this is expected when no devices exist yet
  }

  return devices;
}

/**
 * Supprime tous les fichiers de base (`db-<device>-*.json`) présents sur WebDAV
 * pour un appareil donné.
 *
 * @param webDavClient Client WebDAV connecté
 * @param deviceId Identifiant de l'appareil dont on supprime les fichiers
 */
export async function deleteDeviceFiles(webDavClient: WebDAVClient, deviceId: string): Promise<void> {
  try {
    const contents = await webDavClient.getDirectoryContents("/") as any[];

    for (const item of contents) {
      if (item.type === "file" && item.basename.startsWith(`db-${deviceId}-`)) {
        Logger.debug(`Deleting device file: ${item.filename}`);
        await webDavClient.deleteFile(item.filename);
      }
    }

    Logger.info(`Deleted all files for device ${deviceId}`);

  } catch (error) {
    Logger.error(`Error deleting files for device ${deviceId}:`, error);
    throw error;
  }
}

/**
 * Récupère les métadonnées de synchronisation depuis la table `syncMetadata`.
 *
 * Retourne un objet contenant `lastSyncTimestamp` et `syncVersion`. En cas
 * d'erreur ou si la table est vide, renvoie des valeurs par défaut.
 *
 * @param db Instance de `SQLiteDatabase`
 * @returns Objet `SyncMetadata` avec les valeurs lues ou des valeurs par défaut
 */
export async function getSyncMetadata(db: SQLiteDatabase): Promise<SyncMetadata> {
  try {
    const rows = await db.getAllAsync(`SELECT key, value FROM syncMetadata`);

    const metadata: any = {};
    for (const row of rows as any[]) {
      metadata[row.key] = row.value;
    }

    return {
      lastSyncTimestamp: parseInt(metadata.lastSyncTimestamp || "0", 10),
      syncVersion: parseInt(metadata.syncVersion || "1", 10),
    };

  } catch (error) {
    Logger.error("Error getting sync metadata:", error);
    return {
      lastSyncTimestamp: 0,
      syncVersion: 1,
    };
  }
}

/**
 * Marque une image comme supprimée dans la table `syncFiles` (flag `deleted`).
 *
 * Ceci permet de propager la suppression vers le serveur lors du prochain sync.
 *
 * @param db Instance de `SQLiteDatabase`
 * @param filename Nom du fichier image à marquer comme supprimé
 * @param deviceId Identifiant de l'appareil ayant effectué la suppression
 */
export async function markImageAsDeleted(db: SQLiteDatabase, filename: string, deviceId: string): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO syncFiles (filename, lastModified, modifiedBy, deleted)
     VALUES (?, ?, ?, 1)`,
    [filename, now, deviceId]
  );
}
