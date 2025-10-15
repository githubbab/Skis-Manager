import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DataManager';
import { getCurrentSeason, Seasons } from './dbSeasons';

export type Users = {
  id: string;
  name: string;
  end?: number;
  pcolor?: string;
  // Optional fields, will be filled when fetching
  nbOutings: number;
  nbSkis: number;
  nbBoots: number;
};

export function initUser(): Users {
  return {
    id: "not-an-id",
    name: "",
    end: undefined,
    pcolor: undefined,
    nbOutings: 0,
    nbSkis: 0,
    nbBoots: 0,
  };
}

// -------------------- USERS --------------------
export async function insertUser(db: SQLiteDatabase, u: { name: string, end?: number, pcolor?: string }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.USERS, ["id", "name", "end", "pcolor"],
    [id, u.name, u.end ?? null, u.pcolor ?? null]), id);
  return { id: id, name: u.name, end: u.end, pcolor: u.pcolor } as Users;
}

export async function updateUser(db: SQLiteDatabase, u: Users) {
  await execQuery(db, updateQuery(TABLES.USERS, ["name", "end", "pcolor"],
    [u.name, u.end ?? null, u.pcolor ?? null], "id = ?", [u.id]), u.id);
}

export async function deleteUser(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.USERS, "id = ?", [id]), id);
}

export async function getAllUsers(db: SQLiteDatabase, activeTo?: number): Promise<Users[]> {
  const whereClause = activeTo ? "WHERE end < " + activeTo.toString() + " OR end IS NULL" : "";
  const data: Users[] = await db.getAllAsync(`
    SELECT 
      u.id, 
      u.name,
      u.end,
      u.pcolor,
      COUNT(DISTINCT eo.id) AS nbOutings,
      COUNT(DISTINCT jsu.idSkis) AS nbSkis,
      COUNT(DISTINCT jbu.idBoots) AS nbBoots
    FROM ${TABLES.USERS} u
    LEFT JOIN ${TABLES.OUTINGS} eo ON eo.idUser = u.id
    LEFT JOIN ${TABLES.JOIN_SKIS_USERS} jsu ON jsu.idUser = u.id
    LEFT JOIN ${TABLES.JOIN_BOOTS_USERS} jbu ON jbu.idUser = u.id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.name;
  `);
  return data;
}

export async function getTopUsers(db: SQLiteDatabase, season?: Seasons): Promise<Users[]> {
  const currentSeason = season ? season : await getCurrentSeason(db);
  const data: Users[] = await db.getAllAsync(`
        SELECT 
            CONCAT('topUsers-',u.id) as id, 
            u.name as name, 
            u.pcolor as pcolor, 
            COUNT(DISTINCT o.date / 86400000) AS nbOutings
        FROM 
            ${TABLES.USERS} u 
            INNER JOIN ${TABLES.OUTINGS} o ON u.id = o.idUser
        WHERE 
            o.date >= ${currentSeason.begin} AND (o.date < ${currentSeason.end ?? 4102444800000})
        GROUP BY u.id, u.name
        ORDER BY nbOutings DESC
    `);
  return data;
}
