import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DatabaseManager';

export type TOO = {
  id: string;
  name: string;
  canOffPiste: boolean;
  // Optional fields, can be used to track outings of this type
  itemCount?: number; 
};

export function initTypeOfOutings(): TOO {
  return {
    id: "not-an-id",
    name: "",
    canOffPiste: false,
    itemCount: undefined,
  };
}

// -------------------- TYPE OF OUTING --------------------
export async function insertTypeOfOutings(db: SQLiteDatabase, too: { name: string, canOffPiste: boolean }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.TYPE_OF_OUTINGS, ["id", "name", "canOffPiste"],
    [id, too.name, too.canOffPiste]));
  return { id: id, name: too.name, canOffPiste: too.canOffPiste } as TOO;
}

export async function updateTypeOfOutings(db: SQLiteDatabase, too: TOO) {
  await execQuery(db, updateQuery(TABLES.TYPE_OF_OUTINGS, ["name", "canOffPiste"],
    [too.name, too.canOffPiste], "id = ?", [too.id]));
}

export async function deleteTypeOfOutings(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.TYPE_OF_OUTINGS, "id = ?", [id]));
}

export async function getAllTypeOfOutings(db: SQLiteDatabase): Promise<TOO[]> {
  const data: TOO[] = await db.getAllAsync(`
    SELECT o.id, o.name, o.canOffPiste,
    COUNT(jo.id) as itemCount
    FROM ${TABLES.TYPE_OF_OUTINGS} as o
    LEFT JOIN ${TABLES.OUTINGS} jo ON o.id = jo.idOutingType
    GROUP BY o.id
    ORDER BY o.name
    `);

  return data;
}