import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, diffAndGenerateQueries, execQuery, formatSQL, insertQuery, TABLES, updateQuery, getDistinctBrandIcoURIs, icoUnknownBrand } from './DataManager';

export type Boots = {
  id: string;
  name: string;
  idBrand: string;
  begin: number;
  end?: number;
  size?: string;
  length?: number;
  flex?: number;
  // Optional fields, will be filled when fetching
  brand: string;
  listUsers: string[];
  listUserNames: string[];
  nbOutings: number;
  nbSkis: number;
  icoBrandUri: string; // Optional, can be set later
};

export function initBoots(): Boots {
  return {
    id: "not-an-id",
    name: "",
    idBrand: "not-an-id",
    begin: 0,
    end: undefined,
    size: undefined,
    length: undefined,
    flex: undefined,
    brand: "",
    nbOutings: 0,
    nbSkis: 0,
    listUsers: [],
    listUserNames: [],
    icoBrandUri: icoUnknownBrand,
  };
}

// -------------------- BOOTS --------------------
export async function insertBoots<Boots>(db: SQLiteDatabase, b: {
  name: string,
  begin: number,
  idBrand: string,
  size?: string,
  length?: number,
  flex?: number,
  end?: number,
  listUsers: string[];
}
) {
  const id = createId();
  let query = insertQuery(TABLES.BOOTS, ["id", "name", "idBrand", "size", "length", "flex", "begin", "end"],
    [id, b.name, b.idBrand, b.size ?? null, b.length ?? null, b.flex ?? null, b.begin, b.end ?? null]);
  for (const idUser of b.listUsers) {
    query += insertQuery(TABLES.JOIN_BOOTS_USERS, ["idBoots", "idUser"], [id, idUser]);
  }
  await execQuery(db, query);
  return { id: id, name: b.name, idBrand: b.idBrand, begin: b.begin, end: b.end, size: b.size, length: b.size, flex: b.flex } as Boots;
}

export async function updateBoots(db: SQLiteDatabase, b: Boots) {
  if (!b.id) {
    throw new Error("Boots ID is required for update");
  } else if (b.id === "not-an-id") {
    throw new Error("Boots ID is not valid for update");
  }
  const query = updateQuery(TABLES.BOOTS, ["name", "idBrand", "size", "length", "flex", "begin", "end"],
    [b.name, b.idBrand, b.size ?? null, b.length ?? null, b.flex ?? null, b.begin, b.end ?? null], "id = ?", [b.id]);
  const usersResult: string[] =
    (await db.getAllAsync(formatSQL(`SELECT idUser FROM joinBootsUsers WHERE idBoots = ?`, [b.id])))
      .map((row: any) => row.idUser);
  const usersQuery =
    diffAndGenerateQueries(usersResult, b.listUsers, TABLES.JOIN_BOOTS_USERS, "idBoots", b.id, "idUser");
  await execQuery(db, query + usersQuery);
}

export async function deleteBoots(db: SQLiteDatabase, id: string) {
  if (!id || id === "not-an-id") {
    throw new Error("Boots ID is required for deletion");
  }
  await execQuery(db, deleteQuery(TABLES.BOOTS, "id = ?", [id]) + deleteQuery(TABLES.JOIN_BOOTS_USERS, "idBoots = ?", [id]));
}

export async function getAllBoots(db: SQLiteDatabase, activeUntil?: number): Promise<Boots[]> {
  const whereClause = activeUntil ? "WHERE b.end > " + activeUntil.toString() + " OR b.end IS NULL" : "";
  const data: Boots[] = await db.getAllAsync(`
        SELECT b.id, b.name, b.idBrand, b.size, b.length, b.flex, b.begin, b.end,
            br.name as brand,
            GROUP_CONCAT(DISTINCT ju.idUser) as listUsers,
            GROUP_CONCAT(DISTINCT u.name) as listUserNames,
            COUNT(DISTINCT jo.date / 86400000) AS nbOutings,
            COUNT(DISTINCT js.idSkis) AS nbSkis
        FROM ${TABLES.BOOTS} b
        LEFT JOIN ${TABLES.JOIN_BOOTS_USERS} ju ON b.id = ju.idBoots
        LEFT JOIN ${TABLES.JOIN_SKIS_BOOTS} js ON js.idBoots = b.id
        LEFT JOIN ${TABLES.OUTINGS} jo ON jo.idBoots = b.id
        LEFT JOIN ${TABLES.USERS} u ON ju.idUser = u.id
        LEFT JOIN ${TABLES.BRANDS} br ON b.idBrand = br.id
        ${whereClause}
        GROUP BY b.id
        ORDER BY b.end ASC, begin DESC, nbOutings DESC
    `);
  const arrayIcoBrandURI = await getDistinctBrandIcoURIs(data);
  return data.map((row: any) => ({
    ...row,
    listUsers: row.listUsers ? row.listUsers.split(',') : [],
    listUserNames: row.listUserNames ? row.listUserNames.split(',') : [],
    icoBrandUri: arrayIcoBrandURI[row.idBrand],
  } as Boots));
}

export async function getBoots4Skis(db: SQLiteDatabase, idSkis: string): Promise<Boots[]> {
  const data: Boots[] = await db.getAllAsync(`
        SELECT b.id, b.name, b.idBrand, b.size, b.length, b.flex, b.begin, b.end,
            br.name as brand,
            GROUP_CONCAT(DISTINCT ju.idUser) as listUsers,
            GROUP_CONCAT(DISTINCT u.name) as listUserNames,
            COUNT(DISTINCT jo.date / 86400000) AS nbOutings,
            COUNT(DISTINCT js.idSkis) AS nbSkis
        FROM ${TABLES.BOOTS} b
        LEFT JOIN ${TABLES.JOIN_BOOTS_USERS} ju ON b.id = ju.idBoots
        LEFT JOIN ${TABLES.JOIN_SKIS_BOOTS} js ON js.idBoots = b.id
        LEFT JOIN ${TABLES.OUTINGS} jo ON jo.idBoots = b.id
        LEFT JOIN ${TABLES.USERS} u ON ju.idUser = u.id
        LEFT JOIN ${TABLES.BRANDS} br ON b.idBrand = br.id
        WHERE js.idSkis = ? AND b.end IS NULL
        GROUP BY b.id
        ORDER BY b.end ASC, begin DESC, nbOutings DESC
    `, [idSkis]);
  const arrayIcoBrandURI = await getDistinctBrandIcoURIs(data);
  return data.map((row: any) => ({
    ...row,
    listUsers: row.listUsers ? row.listUsers.split(',') : [],
    listUserNames: row.listUserNames ? row.listUserNames.split(',') : [],
    icoBrandUri: arrayIcoBrandURI[row.idBrand],
  } as Boots));
}