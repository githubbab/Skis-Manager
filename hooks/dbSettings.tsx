import { SQLiteDatabase } from "expo-sqlite";
import { execQuery, formatSQL, TABLES } from "./DatabaseManager";

export type Settings = {
  name: string;
  value: string;
}

export async function insertSettings(db: SQLiteDatabase, name: string, value: string) {
  const query = formatSQL('INSERT INTO settings (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value', [name, value]);
  await execQuery(db, query);
}

export async function getSettings(db: SQLiteDatabase, name: string): Promise<Settings | null> {
  const result: Settings[] = await db.getAllAsync(`SELECT * FROM ${TABLES.SETTINGS} WHERE name = ?`, [name]);
  if (result && result.length > 0) {
    return result[0];
  }
  return null;
}
export async function getAllSettings(db: SQLiteDatabase): Promise<Settings[]> {
  const result: Settings[] = await db.getAllAsync(`SELECT * FROM ${TABLES.SETTINGS}`);
  return result;
}

