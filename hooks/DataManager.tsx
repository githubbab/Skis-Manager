
import asyncAlert from "@/components/AsyncAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SQLiteDatabase } from "expo-sqlite";
import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";
import { Logger } from "./ToolsBox";

const imgStorePath = Paths.document.uri + "/images/";
export const icoUnknownBrand = imgStorePath + "brand-init-unknown.png";
export const imgStoreDir = new Directory(imgStorePath);
// Database version
const DATABASE_VERSION = 3;

// Device ID
let deviceID: string = "not-an-id";
let lastId: string = "not-an-id";

export const TABLES = {
  FRIENDS: "itemsFriends",
  BOOTS: "itemsBoots",
  BRANDS: "itemsBrands",
  SKIS: "itemsSkis",
  USERS: "itemsUsers",
  OFFPISTES: "itemsOffPistes",
  OUTINGS: "eventsOutings",
  MAINTAINS: "eventsMaintains",
  TYPE_OF_OUTINGS: "typeOfOutings",
  TYPE_OF_SKIS: "typeOfSkis",
  JOIN_BOOTS_USERS: "joinBootsUsers",
  JOIN_OUTINGS_FRIENDS: "joinOutingsFriends",
  JOIN_OUTINGS_OFFPISTES: "joinOutingsOffPistes",
  JOIN_SKIS_USERS: "joinSkisUsers",
  JOIN_SKIS_BOOTS: "joinSkisBoots",
  SEASONS: "itemsSeasons",
  SETTINGS: "settings",
}

const baseImages: { [key: string]: any } = {
  "tos-init-gs.png": require("@/assets/images/tos/init-gs.png"),
  "tos-init-powder.png": require("@/assets/images/tos/init-powder.png"),
  "tos-init-rock.png": require("@/assets/images/tos/init-rock.png"),
  "tos-init-skating.png": require("@/assets/images/tos/init-skating.png"),
  "tos-init-sl.png": require("@/assets/images/tos/init-sl.png"),
  "tos-init-sg.png": require("@/assets/images/tos/init-sg.png"),
  "tos-init-slope.png": require("@/assets/images/tos/init-slope.png"),
  "tos-init-surf.png": require("@/assets/images/tos/init-surf.png"),
  "tos-init-touring.png": require("@/assets/images/tos/init-touring.png"),
  "brand-init-armada.png": require("@/assets/images/brands/init-armada.png"),
  "brand-init-atomic.png": require("@/assets/images/brands/init-atomic.png"),
  "brand-init-black_crows.png": require("@/assets/images/brands/init-black_crows.png"),
  "brand-init-blizzard.png": require("@/assets/images/brands/init-blizzard.png"),
  "brand-init-dynastar.png": require("@/assets/images/brands/init-dynastar.png"),
  "brand-init-elan.png": require("@/assets/images/brands/init-elan.png"),
  "brand-init-faction.png": require("@/assets/images/brands/init-faction.png"),
  "brand-init-fischer.png": require("@/assets/images/brands/init-fischer.png"),
  "brand-init-head.png": require("@/assets/images/brands/init-head.png"),
  "brand-init-k2.png": require("@/assets/images/brands/init-k2.png"),
  "brand-init-lange.png": require("@/assets/images/brands/init-lange.png"),
  "brand-init-movement.png": require("@/assets/images/brands/init-movement.png"),
  "brand-init-nordica.png": require("@/assets/images/brands/init-nordica.png"),
  "brand-init-rossignol.png": require("@/assets/images/brands/init-rossignol.png"),
  "brand-init-salomon.png": require("@/assets/images/brands/init-salomon.png"),
  "brand-init-scott.png": require("@/assets/images/brands/init-scott.png"),
  "brand-init-stockli.png": require("@/assets/images/brands/init-stockli.png"),
  "brand-init-volkl.png": require("@/assets/images/brands/init-volkl.png"),
  "brand-init-zag.png": require("@/assets/images/brands/init-zag.png"),
  "brand-init-unknown.png": require("@/assets/images/brands/init-unknown.png")
};

export function formatSQL(sql: string, values: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const val = values[i++];
    if (val === null) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    return val.toString();
  });
}

export function createId() {
  let newId = new Date().getTime().toString() + "-" + deviceID;
  while (newId === lastId) {
    Logger.debug("createId: collision, regenerating");
    // Very unlikely, but just in case
    newId = new Date().getTime().toString() + "-" + deviceID;
  }
  lastId = newId;
  return newId;
}

function isTableSyncable(table: string): boolean {
  const syncableTables = [
    // Main tables
    TABLES.SKIS, TABLES.USERS, TABLES.BOOTS, TABLES.BRANDS,
    TABLES.FRIENDS, TABLES.OFFPISTES, TABLES.OUTINGS, TABLES.MAINTAINS,
    TABLES.TYPE_OF_OUTINGS, TABLES.TYPE_OF_SKIS, TABLES.SEASONS,
    // Join tables
    TABLES.JOIN_SKIS_USERS, TABLES.JOIN_BOOTS_USERS, TABLES.JOIN_SKIS_BOOTS,
    TABLES.JOIN_OUTINGS_FRIENDS, TABLES.JOIN_OUTINGS_OFFPISTES
  ];
  return syncableTables.includes(table);
}

export function getDeviceID() {
  return deviceID;
}

export async function clearDatabase(db: SQLiteDatabase) {
  Logger.debug("Reinitializing database");
  for (const table of [TABLES.MAINTAINS, TABLES.OUTINGS, TABLES.JOIN_SKIS_BOOTS, TABLES.JOIN_SKIS_USERS, TABLES.JOIN_OUTINGS_OFFPISTES, TABLES.SKIS, TABLES.BOOTS, TABLES.USERS, TABLES.SEASONS]) {
    Logger.debug("DELETE " + table);
    await db.execAsync("DELETE FROM " + table);
  }
  await db.execAsync("DELETE FROM typeOfSkis WHERE  id NOT like 'init-%';");
  Logger.debug("Database reinitialized");
}

export async function execQuery(db: SQLiteDatabase, query: string) {

  try {
    await db.execAsync(query);
  } catch (err) {
    const errNumber = (err as any)?.code ?? -1;
    const message = err ? err.toString() : "Unknown error";
    Logger.error(message);
    await asyncAlert("alert err n°" + errNumber, message);
  }
}

export function insertQuery(table: string, columns: string[], values: any[], withSync: boolean = true): string {
  // Add sync fields if table supports them and withSync is true
  if (withSync && isTableSyncable(table)) {
    columns = [...columns, 'lastModified', 'modifiedBy'];
    values = [...values, Date.now(), deviceID];
  }
  const placeholders = columns.map(() => "?").join(", ");
  return formatSQL(
    `INSERT INTO ${table} (${columns.join(", ")})
     VALUES (${placeholders});`,
    values
  );
}

export function updateQuery(table: string, columns: string[], values: any[], where: string, whereValues: any[], withSync: boolean = true): string {
  // Add sync fields if table supports them and withSync is true
  if (withSync && isTableSyncable(table)) {
    columns = [...columns, 'lastModified', 'modifiedBy'];
    values = [...values, Date.now(), deviceID];
  }
  const setClause = columns.map(col => `${col} = ?`).join(", ");
  const allValues = [...values, ...whereValues];
  return formatSQL(
    `UPDATE ${table}
     SET ${setClause}
     WHERE ${where};`,
    allValues
  );
}

export function deleteQuery(table: string, where: string, whereValues: any[]): string {
  return formatSQL(
    `DELETE
     FROM ${table}
     WHERE ${where};`,
    whereValues
  );
}

export function diffAndGenerateQueries(
  existing: string[],
  updated: string[],
  table: string,
  idColumn: string,
  idValue: string,
  idColumnToDelete: string
): string {
  Logger.debug("diffAndGenerateQueries", existing, updated, table, idColumn, idValue, idColumnToDelete);
  const toDelete = existing.filter((id) => !updated.includes(id));
  const toInsert = updated.filter((id) => !existing.includes(id));

  Logger.debug("diffAndGenerateQueries", toDelete, toInsert)
  let query = "";
  for (const id of toDelete) {
    query += formatSQL(`DELETE FROM ${table} WHERE ${idColumn} = ? AND ${idColumnToDelete} = ?;`, [idValue, id]);
  }
  for (const id of toInsert) {
    query += formatSQL(`INSERT INTO ${table} (${idColumn}, ${idColumnToDelete}) VALUES (?, ?);`, [idValue, id]);
  }
  return query;
}

function makeDeviceId(length: number) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function initDataManager(db: SQLiteDatabase): Promise<void> {
  //
  // Device ID
  // Get or create a unique device ID
  deviceID = await AsyncStorage.getItem("deviceID") ?? "not-an-id"
  if (deviceID === "not-an-id") {
    Logger.debug("No deviceID found - generate it");
    deviceID = makeDeviceId(4)
    await AsyncStorage.setItem("deviceID", deviceID);
  }
  Logger.debug("deviceID: ", deviceID);
  //
  // Initialize file system
  //
  Logger.debug("Initializing DataManager");
  if (!imgStoreDir.exists) {
    imgStoreDir.create();
    Logger.debug("Create imgStore", imgStoreDir.uri);
  } else {
    Logger.debug("Find imgStore", imgStoreDir.uri);
  }
  //
  // Initialize database
  //
  let currentDbVersion = 0;

  const row: { user_version: number } | null = await db.getFirstAsync('PRAGMA user_version');
  if (row) {
    currentDbVersion = row.user_version;
  }
  Logger.debug("currentDbVersion: ", currentDbVersion);

  if (currentDbVersion >= DATABASE_VERSION) {
    Logger.debug("No init DB");
    return;
  }

  if (currentDbVersion === 1) {
    Logger.debug("initDB: Upgrading to version 2");
    await db.execAsync(`
        INSERT OR IGNORE INTO typeOfSkis (id, name, waxNeed, sharpNeed) VALUES ('init-sg', 'Super-G', 6, 2);
        INSERT OR IGNORE INTO typeOfOutings (id, name) VALUES ('init-training-sl', 'SL Training');
        INSERT OR IGNORE INTO typeOfOutings (id, name) VALUES ('init-race-sl', 'SL Race');
        INSERT OR IGNORE INTO typeOfOutings (id, name) VALUES ('init-training-sg', 'SG Training');
        INSERT OR IGNORE INTO typeOfOutings (id, name) VALUES ('init-race-sg', 'SG Race');
        INSERT OR IGNORE INTO typeOfOutings (id, name) VALUES ('init-training-gs', 'GS Training');
        INSERT OR IGNORE INTO typeOfOutings (id, name) VALUES ('init-race-gs', 'GS Race');
        INSERT OR IGNORE INTO settings (name, value) VALUES ('needTranslation', 'true');
      `);
    currentDbVersion = 2;
  }

  if (currentDbVersion === 2) {
    Logger.debug("initDB: Upgrading to version 3 - Adding sync metadata fields");
    const now = Date.now();
    await db.execAsync(`
        -- Add sync fields to all main tables
        ALTER TABLE ${TABLES.SKIS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.SKIS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.USERS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.USERS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.BOOTS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.BOOTS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.BRANDS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.BRANDS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.FRIENDS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.FRIENDS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.OFFPISTES} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.OFFPISTES} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.OUTINGS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.OUTINGS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.MAINTAINS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.MAINTAINS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.TYPE_OF_OUTINGS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.TYPE_OF_OUTINGS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.TYPE_OF_SKIS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.TYPE_OF_SKIS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.SEASONS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.SEASONS} ADD COLUMN modifiedBy TEXT;

        -- Add sync fields to join tables
        ALTER TABLE ${TABLES.JOIN_SKIS_USERS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.JOIN_SKIS_USERS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.JOIN_BOOTS_USERS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.JOIN_BOOTS_USERS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.JOIN_SKIS_BOOTS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.JOIN_SKIS_BOOTS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.JOIN_OUTINGS_FRIENDS} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.JOIN_OUTINGS_FRIENDS} ADD COLUMN modifiedBy TEXT;
        ALTER TABLE ${TABLES.JOIN_OUTINGS_OFFPISTES} ADD COLUMN lastModified INTEGER;
        ALTER TABLE ${TABLES.JOIN_OUTINGS_OFFPISTES} ADD COLUMN modifiedBy TEXT;

        -- Create sync metadata table
        CREATE TABLE IF NOT EXISTS syncMetadata (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        -- Create table for file sync metadata
        CREATE TABLE IF NOT EXISTS syncFiles (
          filename TEXT PRIMARY KEY,
          lastModified INTEGER,
          modifiedBy TEXT,
          deleted INTEGER DEFAULT 0
        );

        -- Initialize existing data with current timestamp and device ID
        UPDATE ${TABLES.SKIS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.USERS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.BOOTS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.BRANDS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.FRIENDS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.OFFPISTES} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.OUTINGS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.MAINTAINS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.TYPE_OF_OUTINGS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.TYPE_OF_SKIS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.SEASONS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.JOIN_SKIS_USERS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.JOIN_BOOTS_USERS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.JOIN_SKIS_BOOTS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.JOIN_OUTINGS_FRIENDS} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;
        UPDATE ${TABLES.JOIN_OUTINGS_OFFPISTES} SET lastModified = ${now}, modifiedBy = '${deviceID}' WHERE lastModified IS NULL;

        -- Initialize sync metadata
        INSERT OR REPLACE INTO syncMetadata (key, value) VALUES ('lastSyncTimestamp', '0');
        INSERT OR REPLACE INTO syncMetadata (key, value) VALUES ('syncVersion', '1');
      `);
    currentDbVersion = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export function getToSIcoURI(id: string, defaultImage: boolean = false): string | undefined {
  const tosIco = new File(imgStorePath + "tos-" + id + ".png");
  if (!defaultImage && tosIco.exists) {
    return tosIco.uri;
  }
  if (id.startsWith("init-")) {
    return Asset.fromModule(baseImages["tos-" + id + ".png"]).uri
  }
  return undefined;
}

export function getBrandIcoURI(id: string, defaultImage: boolean = false): string {
  const brandIco = new File(imgStorePath + "brand-" + id + ".png");
  if (!defaultImage && brandIco.exists) {
    return brandIco.uri;
  }
  if (id.startsWith("init-")) {
    return Asset.fromModule(baseImages["brand-" + id + ".png"]).uri
  }
  return icoUnknownBrand;
}

export function getDistinctToSIcoURIs(data: any[]): string[] {
  const arrayIcoToSURI: string[] = [];
  const distinctIdTypeOfSkis = Array.from(new Set(data.map((ski: any) => ski.idTypeOfSkis)));
  for (const id of distinctIdTypeOfSkis) {
    const tosIco = getToSIcoURI(id);
    if (tosIco) {
      arrayIcoToSURI[id] = tosIco;
    }
  }
  return arrayIcoToSURI;
}

export function getDistinctBrandIcoURIs(data: any[]): string[] {
  const arrayIcoBrandURI: string[] = [];
  const distinctIdBrands = Array.from(new Set(data.map((ski: any) => ski.idBrand)));
  for (const id of distinctIdBrands) {
    arrayIcoBrandURI[id] = getBrandIcoURI(id);
  }
  return arrayIcoBrandURI;
}

export function delBrandIco(idBrand: string) {
  const brandIco = new File(imgStorePath + "brand-" + idBrand + ".png");
  if (brandIco.exists) {
    brandIco.delete();
    Logger.debug("Deleted brand ico", brandIco.uri);
  }
}

export function delToSIco(idTypeOfSkis: string) {
  const tosIco = new File(imgStorePath + "tos-" + idTypeOfSkis + ".png");
  if (tosIco.exists) {
    tosIco.delete();
    Logger.debug("Deleted ToS ico", tosIco.uri);
  }
}

export function copyBrandIco(idBrand: string, fromUri: string) {
  const brandIco = new File(imgStorePath + "brand-" + idBrand + ".png");
  if (brandIco.exists) {
    brandIco.delete();
    Logger.debug("Deleted existing brand ico", brandIco.uri);
  }
  const fromFile = new File(fromUri);
  if (!fromFile.exists) {
    Logger.error("Source brand ico does not exist", fromUri);
    alert("Source brand ico does not exist: " + fromUri);
    return;
  }
  try {
    fromFile.copy(brandIco);
    if (brandIco.exists) {
      Logger.debug("Copied brand ico", fromUri, "to", brandIco.uri);
    }
    else {
      Logger.error("Error copying brand ico");
      alert("Error copying brand ico");
    }
  } catch (error) {
    Logger.error("Error copying brand ico", error);
    alert("Error copying brand ico: " + error);
  }
}

export function copyToSIco(idTypeOfSkis: string, fromUri: string) {
  const tosIco = new File(imgStorePath + "tos-" + idTypeOfSkis + ".png");
  if (tosIco.exists) {
    tosIco.delete();
    Logger.debug("Deleted existing ToS ico", tosIco.uri);
  }
  const fromFile = new File(fromUri);
  if (!fromFile.exists) {
    Logger.error("Source ToS ico does not exist", fromUri);
    alert("Source ToS ico does not exist: " + fromUri);
    return;
  }
  try {
    fromFile.copy(tosIco);
    if (tosIco.exists) {
      Logger.debug("Copied ToS ico", fromUri, "to", tosIco.uri);
    }
    else {
      Logger.error("Error copying ToS ico");
      alert("Error copying ToS ico");
    }
  } catch (error) {
    Logger.error("Error copying ToS ico", error);
    alert("Error copying ToS ico: " + error);
  }
}

export async function clearImageStore() {
  const imageFileList = imgStoreDir.list();
  for (const item of imageFileList) {
    if (item instanceof File) {
      Logger.debug("Delete imgStore", item.uri);
      item.delete();
    }
  }
}