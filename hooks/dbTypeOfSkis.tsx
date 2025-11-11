import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery, delToSIco, getToSIcoURI } from './DataManager';

export type TOS = {
  id: string;
  name: string;
  waxNeed: number;
  sharpNeed: number;
  icoUri?: string;
  itemCount: number; // Optional, will be filled when fetching
};

export function initTypeOfSkis(): TOS {
  return {
    id: "not-an-id",
    name: "",
    waxNeed: 0,
    sharpNeed: 0,
    icoUri: undefined, // Optional, can be set later
    itemCount: 0, // Optional, will be filled when fetching
  };
}

// -------------------- TYPE OF SKIS --------------------
export async function insertTypeOfSkis(db: SQLiteDatabase, tos: { name: string, waxNeed?: number, sharpNeed?: number }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.TYPE_OF_SKIS, ["id", "name", "waxNeed", "sharpNeed"],
    [id, tos.name, tos.waxNeed ?? null, tos.sharpNeed ?? null]));
  return { id: id, name: tos.name, waxNeed: tos.waxNeed, sharpNeed: tos.sharpNeed } as TOS;
}

export async function updateTypeOfSkis(db: SQLiteDatabase, tos: TOS) {
  await execQuery(db, updateQuery(TABLES.TYPE_OF_SKIS, ["name", "waxNeed", "sharpNeed"],
    [tos.name, tos.waxNeed ?? 0, tos.sharpNeed ?? 0], "id = ?", [tos.id]));
  return tos
}

export async function deleteTypeOfSkis(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.TYPE_OF_SKIS, "id = ?", [id]));
  await delToSIco(id);
}

export async function getAllTypeOfSkis(db: SQLiteDatabase): Promise<TOS[]> {
  const data: TOS[] = await db.getAllAsync(`
    SELECT 
    tos.id, tos.name, tos.waxNeed, tos.sharpNeed,
    COUNT(DISTINCT s.id) as itemCount
    FROM ${TABLES.TYPE_OF_SKIS} AS tos
    LEFT JOIN ${TABLES.SKIS} AS s ON tos.id = s.idTypeOfSkis
    GROUP BY tos.id
    ORDER BY itemCount DESC, tos.name`);
  for (const tos of data) {
    tos.icoUri = await getToSIcoURI(tos.id);
  }
  return data;
}