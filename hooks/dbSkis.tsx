import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, diffAndGenerateQueries, execQuery, formatSQL, insertQuery, TABLES, updateQuery } from './DataManager';
import { getDistinctBrandIcoURIs, getDistinctToSIcoURIs } from './DataManager';
import { getCurrentSeason, Seasons } from './dbSeasons';

export type Skis = {
  id: string;
  name: string;
  idBrand: string;
  idTypeOfSkis: string;
  begin: number;
  end?: number;
  size?: number;
  radius?: number;
  waist?: number;
  // Optional fields, will be filled when fetching
  nbOutings?: number;
  nbMaintains?: number;
  listUsers: string[];
  listBoots: string[];
  listUserNames?: string[];
  typeOfSkis?: string;
  brand?: string;
  icoBrandUri?: string;
  icoTypeOfSkisUri?: string;
  majorTypeOfOuting?: string;
  lastOutingDate?: number;
  lastSharpDate?: number;
  lastWaxDate?: number;
};





export function initSkis(date: number): Skis {
  return {
    id: "not-an-id",
    name: "",
    idBrand: "init-unknown",
    idTypeOfSkis: "init-unknown",
    begin: date,
    end: undefined,
    size: undefined,
    radius: undefined,
    waist: undefined,
    nbOutings: 0,
    nbMaintains: 0,
    listUsers: [],
    listBoots: [],
    listUserNames: [],
    typeOfSkis: undefined,
    brand: undefined,
    icoBrandUri: undefined,
    icoTypeOfSkisUri: undefined,
    majorTypeOfOuting: undefined,
    lastOutingDate: undefined,
    lastSharpDate: undefined,
    lastWaxDate: undefined,
  };
}

export async function insertSki(db: SQLiteDatabase, s: {
  name: string,
  listUsers: string[],
  listBoots: string[],
  idTypeOfSkis: string,
  begin: number,
  idBrand?: string,
  end?: number,
  size?: number,
  radius?: number,
  waist?: number
}
) {
  const id = createId();
  let query = insertQuery(TABLES.SKIS, ["id", "name", "idBrand", "idTypeOfSkis", "begin", "end", "size", "radius", "waist"],
    [id, s.name, s.idBrand ?? 'init-unknown', s.idTypeOfSkis, s.begin, s.end ?? null, s.size ?? null, s.radius ?? null, s.waist ?? null]);
  for (const idUser of s.listUsers) {
    query += insertQuery(TABLES.JOIN_SKIS_USERS, ["idSkis", "idUser"], [id, idUser]);
  }
  for (const idBoots of s.listBoots) {
    query += insertQuery(TABLES.JOIN_SKIS_BOOTS, ["idSkis", "idBoots"], [id, idBoots]);
  }
  await execQuery(db, query, id);
  return {
    id: id, name: s.name, idBrand: s.idBrand, idTypeOfSkis: s.idTypeOfSkis, begin: s.begin, end: s.end, size: s.size,
    radius: s.radius, waist: s.waist, listBoots: s.listBoots, listUsers: s.listUsers
  } as Skis
}

export async function updateSki(db: SQLiteDatabase, s: Skis) {
  const query = updateQuery(TABLES.SKIS, ["name", "idBrand", "idTypeOfSkis", "begin", "end", "size", "radius", "waist"],
    [s.name, s.idBrand ?? null, s.idTypeOfSkis, s.begin, s.end ?? null, s.size ?? null, s.radius ?? null, s.waist ?? null],
    "id = ?", [s.id]);

  const usersResult: string[] =
    (await db.getAllAsync(formatSQL(`SELECT idUser FROM ${TABLES.JOIN_SKIS_USERS} WHERE idSkis = ?`, [s.id])))
      .map((row: any) => row.idUser);
  const bootsResult: string[] =
    (await db.getAllAsync(formatSQL(`SELECT idBoots FROM ${TABLES.JOIN_SKIS_BOOTS} WHERE idSkis = ?`, [s.id])))
      .map((row: any) => row.idBoots);
  const usersQuery =
    diffAndGenerateQueries(usersResult, s.listUsers, TABLES.JOIN_SKIS_USERS, "idSkis", s.id, "idUser");
  const bootsQuery =
    diffAndGenerateQueries(bootsResult, s.listBoots, TABLES.JOIN_SKIS_BOOTS, "idSkis", s.id, "idBoots");

  await execQuery(db, query + usersQuery + bootsQuery, s.id);
}

export async function deleteSki(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.JOIN_SKIS_USERS, "idSkis = ?", [id]) +
    deleteQuery(TABLES.JOIN_SKIS_BOOTS, "idSkis = ?", [id]) +
    deleteQuery(TABLES.SKIS, "id = ?", [id]), id);
}

export async function getAllSkis(db: SQLiteDatabase): Promise<Skis[]> {
  const data: Skis[] = await db.getAllAsync(
    `SELECT 
      s.id, 
      s.name, 
      s.idBrand, 
      b.name as brand,
      s.idTypeOfSkis, 
      tos.name as typeOfSkis,
      s.begin, 
      s.end, 
      s.size, 
      s.radius, 
      s.waist,
      COUNT(DISTINCT em.date / 86400000) AS nbMaintains,
      COUNT(DISTINCT o.date / 86400000) AS nbOutings,
      GROUP_CONCAT(DISTINCT jsu.idUser) AS listUsers,
      GROUP_CONCAT(DISTINCT jsb.idBoots) AS listBoots,
      GROUP_CONCAT(DISTINCT u.name) AS listUserNames,
      (
        SELECT o2.idOutingType
        FROM ${TABLES.OUTINGS} o2
        WHERE o2.idSkis = s.id AND o2.idOutingType IS NOT NULL
        GROUP BY o2.idOutingType
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS majorTypeOfOuting
    FROM 
      ${TABLES.SKIS} s
      LEFT JOIN ${TABLES.JOIN_SKIS_USERS} jsu ON s.id = jsu.idSkis
      LEFT JOIN ${TABLES.JOIN_SKIS_BOOTS} jsb ON s.id = jsb.idSkis
      LEFT JOIN ${TABLES.USERS} u ON u.id = jsu.idUser
      LEFT JOIN ${TABLES.OUTINGS} o ON s.id = o.idSkis
      LEFT JOIN ${TABLES.MAINTAINS} em ON s.id = em.idSkis
      JOIN ${TABLES.BRANDS} b ON s.idBrand = b.id
      JOIN ${TABLES.TYPE_OF_SKIS} tos ON s.idTypeOfSkis = tos.id      
    GROUP BY s.id, s.name, s.idBrand, s.idTypeOfSkis, 
      s.begin, s.end, s.size, s.radius, s.waist
      `);
  const arrayIcoToSURI = getDistinctToSIcoURIs(data);
  const arrayIcoBrandURI = getDistinctBrandIcoURIs(data);
  return data.map((ski: any) => ({
    ...ski,
    listUsers: ski.listUsers ? ski.listUsers.split(',') : [],
    listBoots: ski.listBoots ? ski.listBoots.split(',') : [],
    listUserNames: ski.listUserNames ? ski.listUserNames.split(',') : [],
    icoTypeOfSkisUri: arrayIcoToSURI[ski.idTypeOfSkis] || undefined,
    icoBrandUri: arrayIcoBrandURI[ski.idBrand],
  } as Skis));
}

export async function getSeasonSkis(db: SQLiteDatabase, season?: Seasons): Promise<Skis[]> {
  const currentSeason = season ? season : await getCurrentSeason(db);
  const data: Skis[] = await db.getAllAsync(
    `SELECT 
      s.id, 
      s.name, 
      s.idBrand, 
      b.name as brand,
      s.idTypeOfSkis, 
      tos.name as typeOfSkis,
      s.begin, 
      s.end, 
      s.size, 
      s.radius, 
      s.waist,
      COUNT(DISTINCT em.id) AS nbMaintains,
      COUNT(DISTINCT o.date / 86400000) AS nbOutings,
      GROUP_CONCAT(DISTINCT jsu.idUser) AS listUsers,
      GROUP_CONCAT(DISTINCT jsb.idBoots) AS listBoots,
      GROUP_CONCAT(DISTINCT u.name) AS listUserNames,
      (
        SELECT o2.idOutingType
        FROM ${TABLES.OUTINGS} o2
        WHERE o2.idSkis = s.id AND o2.idOutingType IS NOT NULL
        GROUP BY o2.idOutingType
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS majorTypeOfOuting
    FROM 
      ${TABLES.SKIS} s
      LEFT JOIN ${TABLES.JOIN_SKIS_USERS} jsu ON s.id = jsu.idSkis
      LEFT JOIN ${TABLES.JOIN_SKIS_BOOTS} jsb ON s.id = jsb.idSkis
      LEFT JOIN ${TABLES.USERS} u ON u.id = jsu.idUser
      LEFT JOIN ${TABLES.OUTINGS} o ON ((s.id = o.idSkis) AND (o.date >= ${currentSeason.begin} AND (o.date < ${currentSeason.end ?? 4102444800000})))
      LEFT JOIN ${TABLES.MAINTAINS} em ON ((s.id = em.idSkis) AND (em.date >= ${currentSeason.begin} AND (em.date < ${currentSeason.end ?? 4102444800000})))
      JOIN ${TABLES.BRANDS} b ON s.idBrand = b.id
      JOIN ${TABLES.TYPE_OF_SKIS} tos ON s.idTypeOfSkis = tos.id
    WHERE (s.end >= ${currentSeason.begin} OR s.end IS NULL)
    GROUP BY s.id, s.name, s.idBrand, s.idTypeOfSkis,
      s.begin, s.end, s.size, s.radius, s.waist
    ORDER BY nbOutings DESC, nbMaintains DESC, s.begin DESC
      `);
  const arrayIcoToSURI = getDistinctToSIcoURIs(data);
  const arrayIcoBrandURI = getDistinctBrandIcoURIs(data);
  return data.map((ski: any) => ({
    ...ski,
    listUsers: ski.listUsers ? ski.listUsers.split(',') : [],
    listBoots: ski.listBoots ? ski.listBoots.split(',') : [],
    listUserNames: ski.listUserNames ? ski.listUserNames.split(',') : [],
    icoTypeOfSkisUri: arrayIcoToSURI[ski.idTypeOfSkis] || undefined,
    icoBrandUri: arrayIcoBrandURI[ski.idBrand],
  } as Skis));
}

export async function getTopSkis(db: SQLiteDatabase, season?: Seasons): Promise<Skis[]> {
  const currentSeason = season ? season : await getCurrentSeason(db);
  const data: Skis[] = await db.getAllAsync(
    `SELECT 
      CONCAT('topSkis-',s.id) as id, 
      s.name as name, 
      s.idBrand as idBrand, 
      b.name as brand,
      s.idTypeOfSkis as idTypeOfSkis,
      tos.name as typeOfSkis,
      s.begin as begin,
      s.end as end,
      s.size as size,
      s.radius as radius,
      s.waist as waist,
      COUNT(DISTINCT em.id) AS nbMaintains,
      COUNT(DISTINCT o.date / 86400000) AS nbOutings,
      GROUP_CONCAT(DISTINCT jsu.idUser) AS listUsers,
      GROUP_CONCAT(DISTINCT jsb.idBoots) AS listBoots,
      GROUP_CONCAT(DISTINCT u.name) AS listUserNames,
      MAX(o.date) AS lastOutingDate,
      (SELECT MAX(m.date)
         FROM ${TABLES.MAINTAINS} m
         WHERE m.swr LIKE '%S%' AND m.idSkis = s.id) AS lastSharpDate,
      (SELECT MAX(m.date)
         FROM ${TABLES.MAINTAINS} m
         WHERE m.swr LIKE '%W%' AND m.idSkis = s.id) AS lastWaxDate
    FROM 
      ${TABLES.SKIS} s
      LEFT JOIN ${TABLES.JOIN_SKIS_USERS} jsu ON s.id = jsu.idSkis
      LEFT JOIN ${TABLES.JOIN_SKIS_BOOTS} jsb ON s.id = jsb.idSkis
      LEFT JOIN ${TABLES.OUTINGS} o ON s.id = o.idSkis
      LEFT JOIN ${TABLES.MAINTAINS} em ON ((s.id = em.idSkis) AND (em.date >= ${currentSeason.begin} AND (em.date < ${currentSeason.end ?? 4102444800000})))
      LEFT JOIN ${TABLES.BRANDS} b ON s.idBrand = b.id
      LEFT JOIN ${TABLES.TYPE_OF_SKIS} tos ON s.idTypeOfSkis = tos.id
      JOIN ${TABLES.USERS} u ON u.id = jsu.idUser
    WHERE 
      o.date >= ${currentSeason.begin} AND (o.date < ${currentSeason.end ?? 4102444800000}) 
    GROUP BY s.id
    ORDER BY nbOutings DESC`
  );
  const arrayIcoToSURI = getDistinctToSIcoURIs(data);
  const arrayIcoBrandURI = getDistinctBrandIcoURIs(data);
  return data.map((ski: any) => ({
    ...ski,
    icoTypeOfSkisUri: arrayIcoToSURI[ski.idTypeOfSkis] || undefined,
    icoBrandUri: arrayIcoBrandURI[ski.idBrand],
    listUsers: ski.listUsers ? ski.listUsers.split(',') : [],
    listBoots: ski.listBoots ? ski.listBoots.split(',') : [],
    listUserNames: ski.listUserNames ? ski.listUserNames.split(',') : [],
  } as Skis));
}

export async function getSkis2Sharp(db: SQLiteDatabase): Promise<Skis[]> {
  const data: Skis[] = await db.getAllAsync(
    `SELECT
        CONCAT('toSharp-',s.id) AS id,
        s.idBrand AS idBrand, 
        s.name AS name, 
        tos.id AS idTypeOfSkis, 
        tos.name AS typeOfSkis,
        s.size AS size,
        s.radius AS radius,
        s.waist AS waist,
        GROUP_CONCAT(DISTINCT u.name) AS listUserNames, 
        (COUNT(DISTINCT eo.date / 86400000) - tos.sharpNeed) AS nbMaintains
      FROM ${TABLES.OUTINGS} eo
         JOIN ${TABLES.SKIS} s ON s.id = eo.idSkis
         JOIN ${TABLES.TYPE_OF_SKIS} tos ON s.idTypeOfSkis = tos.id
         LEFT JOIN ${TABLES.JOIN_SKIS_USERS} jsu ON jsu.idSkis = s.id
         LEFT JOIN ${TABLES.USERS} u ON u.id = jsu.idUser
      WHERE eo.date >= IFNULL(
        (SELECT MAX(m.date)
         FROM ${TABLES.MAINTAINS} m
         WHERE m.swr LIKE '%S%' AND m.idSkis = s.id),0)
        AND tos.sharpNeed > 0
      GROUP BY s.id
      HAVING nbMaintains >= 0
      ORDER BY nbMaintains DESC`
  );
  const arrayIcoToSURI = getDistinctToSIcoURIs(data);
  const arrayIcoBrandURI = getDistinctBrandIcoURIs(data);
  return data.map((ski: any) => ({
    ...ski,
    icoTypeOfSkisUri: arrayIcoToSURI[ski.idTypeOfSkis] || undefined,
    icoBrandUri: arrayIcoBrandURI[ski.idBrand],
    listUsers: ski.listUsers ? ski.listUsers.split(',') : [],
    listBoots: ski.listBoots ? ski.listBoots.split(',') : [],
    listUserNames: ski.listUserNames ? ski.listUserNames.split(',') : [],
  } as Skis));
}

export async function getSkis2Wax(db: SQLiteDatabase): Promise<Skis[]> {
  const data: Skis[] = await db.getAllAsync(
    `SELECT
        CONCAT('toWax-',s.id) AS id,
        s.idBrand AS idBrand, 
        s.name AS name, 
        tos.id AS idTypeOfSkis, 
        tos.name AS typeOfSkis,
        s.size AS size,
        s.radius AS radius,
        s.waist AS waist,
        GROUP_CONCAT(DISTINCT u.name) AS listUserNames, 
        (COUNT(DISTINCT eo.date / 86400000) - tos.waxNeed) AS nbMaintains
      FROM ${TABLES.OUTINGS} eo
         JOIN ${TABLES.SKIS} s ON s.id = eo.idSkis
         JOIN ${TABLES.TYPE_OF_SKIS} tos ON s.idTypeOfSkis = tos.id
         LEFT JOIN ${TABLES.JOIN_SKIS_USERS} jsu ON jsu.idSkis = s.id
         LEFT JOIN ${TABLES.USERS} u ON u.id = jsu.idUser
      WHERE eo.date >= IFNULL(
        (SELECT MAX(m.date)
         FROM ${TABLES.MAINTAINS} m
         WHERE m.swr LIKE '%W%' AND m.idSkis = s.id),0)
        AND tos.waxNeed > 0
      GROUP BY s.id
      HAVING nbMaintains >= 0
      ORDER BY nbMaintains DESC`
  );

  const arrayIcoToSURI = getDistinctToSIcoURIs(data);
  const arrayIcoBrandURI = getDistinctBrandIcoURIs(data);

  return data.map((ski: any) => ({
    ...ski,
    icoTypeOfSkisUri: arrayIcoToSURI[ski.idTypeOfSkis] || undefined,
    icoBrandUri: arrayIcoBrandURI[ski.idBrand],
    listUsers: ski.listUsers ? ski.listUsers.split(',') : [],
    listBoots: ski.listBoots ? ski.listBoots.split(',') : [],
    listUserNames: ski.listUserNames ? ski.listUserNames.split(',') : [],
  } as Skis));
}