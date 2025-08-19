import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DatabaseManager';

export type Friends = {
  id: string;
  name: string;
  // Optional fields, will be filled when fetching
  nbOutings: number;
};

export function initFriend(): Friends {
  return {
    id: "not-an-id",
    name: "",
    nbOutings: 0,
  };
}

// -------------------- FRIENDS --------------------
export async function insertFriend(db: SQLiteDatabase, f: { name: string }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.FRIENDS, ["id", "name"], [id, f.name]));
  return { id: id, name: f.name } as Friends;
}

export async function updateFriend(db: SQLiteDatabase, f: Friends) {
  await execQuery(db, updateQuery(TABLES.FRIENDS, ["name"], [f.name], "id = ?", [f.id]));
}

export async function deleteFriend(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.FRIENDS, "id = ?", [id]));
}
export async function getAllFriends(db: SQLiteDatabase): Promise<Friends[]> {
  const result = await db.getAllAsync(`SELECT * FROM ${TABLES.FRIENDS}`);
  return result.map((row: any) => ({ id: row.id, name: row.name } as Friends));
}

export async function getFriendsWithOutingsCount(db: SQLiteDatabase): Promise<Friends[]> {
  const data: Friends[] = await db.getAllAsync(`
    SELECT f.id as id, f.name as name, COUNT(jo.idOuting) as nbOutings
    FROM ${TABLES.FRIENDS} f
    LEFT JOIN ${TABLES.JOIN_OUTINGS_FRIENDS} jo ON f.id = jo.idFriend
    GROUP BY f.id
    ORDER BY nbOutings DESC, f.name
  `);
  return data;
}