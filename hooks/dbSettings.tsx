import { SQLiteDatabase } from "expo-sqlite";
import { execQuery, insertQuery, TABLES, updateQuery } from "./DatabaseManager";

export type Settings = {
  key: string;
  value: string;
}

export async function insertSettings(db: SQLiteDatabase, key: string, value: string) {
  const query = insertQuery(TABLES.SETTINGS, ["key", "value"], [key, value]);
  await execQuery(db, query);
}

export async function updateSettings(db: SQLiteDatabase, key: string, value: string) {
  const query = updateQuery(TABLES.SETTINGS, ["value"], [value], "key = ?", [key]);
  await execQuery(db, query);
}

export async function getSettings(db: SQLiteDatabase, key: string): Promise<Settings | null> {
  const result: Settings[] = await db.getAllAsync(`SELECT * FROM ${TABLES.SETTINGS} WHERE key = ?`, [key]);
  if (result && result.length > 0) {
    return result[0];
  }
  return null;
}

