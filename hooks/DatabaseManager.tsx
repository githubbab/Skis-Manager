
import asyncAlert from "@/components/AsyncAlert";
import { writeQuery } from "@/hooks/FileSystemManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SQLiteDatabase } from "expo-sqlite";


const DATABASE_VERSION = 1;
let currentDbVersion = 0;
let lastDBWrite = Date.now();
let dbUpdated = false;
let deviceID: string = "not-an-id";
let lastId: string = "not-an-id";

const concatQueries: string[] = [];
let concatQueriesActive = false;


// INTERNAL FUNCTIONS AND CONSTANTS

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


export function formatSQL(sql: string, values: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const val = values[i++];
    if (val === null) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "'$&'")}'`;
    return val.toString();
  });
}

export function createId() {
  let newId = new Date().getTime().toString() + "-" + deviceID;
  while (newId === lastId) {
    console.warn("createId: collision, regenerating");
    // Very unlikely, but just in case
    newId = new Date().getTime().toString() + "-" + deviceID;
  }
  lastId = newId;
  return newId;
}

export function getDeviceID() {
  return deviceID;
}

export function hasDatabaseUpdated() {
  return dbUpdated;
}

export function resetDatabaseUpdated() {
  dbUpdated = false;
}

export async function clearDatabase(db: SQLiteDatabase) {
  console.debug("Reinitializing database");
  for (const table of [TABLES.MAINTAINS, TABLES.OUTINGS, TABLES.JOIN_SKIS_BOOTS, TABLES.JOIN_SKIS_USERS, TABLES.JOIN_OUTINGS_OFFPISTES, TABLES.SKIS, TABLES.BOOTS, TABLES.USERS, TABLES.SEASONS]) {
    console.debug("DELETE " + table);
    await db.execAsync("DELETE FROM " + table);
  }
  await db.execAsync("DELETE FROM typeOfSkis WHERE  id NOT like 'init-%';");
  console.debug("Database reinitialized");
}

export async function execQuery(db: SQLiteDatabase, query: string) {
  try {
    await db.execAsync(query);
    lastDBWrite = Date.now();
    dbUpdated = true;
    if (concatQueriesActive) {
      concatQueries.push(query);
      return;
    }
    await writeQuery("query-" + new Date().getTime().toString() + "-" + deviceID + ".sql", query);
  } catch (err) {
    const errNumber = (err as any)?.code ?? -1;
    const message = err ? err.toString() : "Unknown error";
    console.error(message);
    await asyncAlert("alert err n°" + errNumber, message);
  }
}

export function startConcatQueries() {
  concatQueriesActive = true;
  concatQueries.length = 0;
}

export async function endConcatQueries() {
  concatQueriesActive = false;
  if (concatQueries.length > 0) {
    const fullQuery = concatQueries.join("\n");
    concatQueries.length = 0;
    await writeQuery("query-" + new Date().getTime().toString() + "-" + deviceID + ".sql", fullQuery);
  }
  concatQueries.length = 0;
}

export function cancelConcatQueries() {
  concatQueriesActive = false;
  concatQueries.length = 0;
}

// Génère une requête INSERT
export function insertQuery(table: string, columns: string[], values: any[]): string {
  const placeholders = columns.map(() => "?").join(", ");
  return formatSQL(
    `INSERT INTO ${table} (${columns.join(", ")})
     VALUES (${placeholders});`,
    values
  );
}

// Génère une requête UPDATE
export function updateQuery(table: string, columns: string[], values: any[], where: string, whereValues: any[]): string {
  const setClause = columns.map(col => `${col} = ?`).join(", ");
  const allValues = [...values, ...whereValues];
  return formatSQL(
    `UPDATE ${table}
     SET ${setClause}
     WHERE ${where};`,
    allValues
  );
}

// Génère une requête DELETE
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
  console.debug("diffAndGenerateQueries", existing, updated, table, idColumn, idValue, idColumnToDelete);
  const toDelete = existing.filter((id) => !updated.includes(id));
  const toInsert = updated.filter((id) => !existing.includes(id));

  console.debug("diffAndGenerateQueries", toDelete, toInsert)
  let query = "";
  for (const id of toDelete) {
    query += formatSQL(`DELETE FROM ${table} WHERE ${idColumn} = ? AND ${idColumnToDelete} = ?;`, [idValue, id]);
  }
  for (const id of toInsert) {
    query += formatSQL(`INSERT INTO ${table} (${idColumn}, ${idColumnToDelete}) VALUES (?, ?);`, [idValue, id]);
  }
  return query;
}

function makeId(length: number) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// EXTERNAL FUNCTIONS
export function getLastDBWrite() {
  return lastDBWrite;
}

export async function initDB(db: SQLiteDatabase): Promise<void> {

  // Device ID
  deviceID = await AsyncStorage.getItem("deviceID") ?? "not-an-id"
  if (deviceID === "not-an-id") {
    console.debug("No deviceID found - generate it");
    deviceID = makeId(4)
    await AsyncStorage.setItem("deviceID", deviceID);
  }
  console.debug("deviceID: ", deviceID);


  const row: { user_version: number } | null = await db.getFirstAsync('PRAGMA user_version');
  if (row) {
    currentDbVersion = row.user_version;
  }
  console.debug("currentDbVersion: ", currentDbVersion);

  if (currentDbVersion >= DATABASE_VERSION) {
    console.debug("No init DB");
    return;
  }

/*   if (currentDbVersion === 1) {
    console.debug("initDB: database is up to date (version 1)");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    `);
    currentDbVersion = 2;
  } */
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  console.info("initDB: initializing database DONE");
}