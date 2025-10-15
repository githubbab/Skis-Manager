import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DataManager';

export type Seasons = {
  id: string;
  begin: number;
  name: string;
  end?: number;
};

// -------------------- SEASONS --------------------
export async function insertSeason(db: SQLiteDatabase, s: { begin: number, name: string }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.SEASONS, ["id", "begin", "name"], [id, s.begin, s.name]), id);
  return { id, begin: s.begin, name: s.name } as Seasons;
}
export async function updateSeason(db: SQLiteDatabase, s: Seasons) {
  await execQuery(db, updateQuery(TABLES.SEASONS, ["begin", "name"], [s.begin, s.name], "id = ?", [s.id]), s.id);
}

export async function deleteSeason(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.SEASONS, "id = ?", [id]), id);
}

export async function getAllSeasons(db: SQLiteDatabase): Promise<Seasons[]> {
  const data: Seasons[] = await db.getAllAsync(`SELECT id, begin, name FROM ${TABLES.SEASONS} ORDER BY begin DESC`);
  for (let i = 1; i < data.length; i++) {
    data[i].end = data[i - 1].begin;
  }
  return data;
}

export function initSeason(): Seasons {
  return {
    id: "not-an-id",
    begin: 0,
    name: "",
    end: undefined,
  };
}

export async function getSeasonByDate(db: SQLiteDatabase, date: Date): Promise<Seasons> {
  const seasonsList = await getAllSeasons(db);
  if (seasonsList.length === 0) {
    return initSeason();
  }
  const timestamp = date.getTime();
  // Find the season that includes the timestamp
  for (let i = 0; i < seasonsList.length; i++) {
    const currentSeason: Seasons = seasonsList[i];
    if (timestamp >= currentSeason.begin) {
      const nextSeason = seasonsList[i - 1]; // The next season is the previous in the sorted list
      if (nextSeason) {
        // If there's a next season, we can set the end date of the current season
        currentSeason.end = nextSeason.begin;
      }
      return currentSeason;
    }
  }
  return initSeason();
}

export async function getCurrentSeason(db: SQLiteDatabase): Promise<Seasons> {
  return getSeasonByDate(db, new Date());
}