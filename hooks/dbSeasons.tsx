import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DatabaseManager';

export type Seasons = {
  id: string;
  begin: number;
  name: string;
};

// -------------------- SEASONS --------------------
export async function insertSeason(db: SQLiteDatabase, s: { begin: number, name: string }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.SEASONS, ["id", "begin", "name"], [id, s.begin, s.name]));
  return { id, begin: s.begin, name: s.name } as Seasons;
}
export async function updateSeason(db: SQLiteDatabase, s: Seasons) {
  await execQuery(db, updateQuery(TABLES.SEASONS, ["begin", "name"], [s.begin, s.name], "id = ?", [s.id]));
}

export async function deleteSeason(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.SEASONS, "id = ?", [id]));
}

export async function getAllSeasons(db: SQLiteDatabase): Promise<Seasons[]> {
  const data: Seasons[] = await db.getAllAsync(`SELECT id, begin, name FROM ${TABLES.SEASONS} ORDER BY begin DESC`);
  return data;
}