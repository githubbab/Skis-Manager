import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DataManager';

export type Maintains = {
  id: string;
  date: number;
  idSkis: string;
  swr: string;
  description: string;
};

export function initMaintain(): Maintains {
  return {
    id: "not-an-id",
    date: 0,
    idSkis: "not-an-id",
    swr: "",
    description: "",
  };
}

// -------------------- MAINTAINS --------------------
export async function insertMaintain(db: SQLiteDatabase, m: {
  date: number,
  idSkis: string,
  swr: string, description: string
}) {
  const id = createId();
  const query = insertQuery(TABLES.MAINTAINS, ["id", "date", "idSkis", "swr", "description"],
    [id, m.date, m.idSkis, m.swr, m.description])
  await execQuery(db, query);
  return { id: id, date: m.date, idSkis: m.idSkis, swr: m.swr, description: m.description } as Maintains;
}

export async function updateMaintain(db: SQLiteDatabase, m: Maintains) {
  if ((!m.id) || m.id === "not-an-id") {
    return;
  }
  if (!m.date || !m.idSkis || m.idSkis === "not-an-id") {
    return;
  }
  const query = updateQuery(TABLES.MAINTAINS, ["date", "idSkis", "swr", "description"],
    [m.date, m.idSkis, m.swr, m.description, m.id], "id = ?", [m.id]);
  await execQuery(db, query);
}

export async function deleteMaintain(db: SQLiteDatabase, id: string) {
  if (!id || id === "not-an-id") {
    return;
  }
  const query = deleteQuery(TABLES.MAINTAINS, "id = ?", [id]);
  await execQuery(db, query);
}

export async function getMaintains4Skis(db: SQLiteDatabase, idSkis: string): Promise<Maintains[]> {
  const data: Maintains[] = await db.getAllAsync(`
        SELECT 
            m.id, m.date, m.idSkis, m.swr, m.description
        FROM ${TABLES.MAINTAINS} m
        WHERE m.idSkis = ?
        GROUP BY m.id
        ORDER BY m.date DESC
  `, [idSkis]);
  return data;
}

export async function getAllMaintains(db: SQLiteDatabase, seasonDate: number): Promise<Maintains[]> {
  const data: Maintains[] = await db.getAllAsync(`
        SELECT 
            m.id, m.date, m.idSkis, m.swr, IFNULL(m.description, '') AS description
        FROM ${TABLES.MAINTAINS} m
        WHERE m.date >= ?
        GROUP BY m.id
    `, [seasonDate]);
  return data;
}
