import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, diffAndGenerateQueries, execQuery, formatSQL, insertQuery, TABLES, updateQuery } from './DataManager';

export type Outings = {
  id: string;
  date: number;
  idSkis?: string;
  idUser?: string;
  idBoots?: string;
  idOutingType?: string;
  idFriends?: string[];
  listOfOffPistes?: { id: string, nb: number, rating?: number }[];
};

export function initOuting(): Outings {
  return {
    id: "not-an-id",
    date: 0,
    idSkis: undefined,
    idUser: undefined,
    idBoots: undefined,
    idFriends: [],
    listOfOffPistes: [],
    idOutingType: undefined,

  };
}

// -------------------- OUTINGS --------------------
export async function insertOuting(db: SQLiteDatabase, o: {
  date: number,
  idOutingType?: string,
  idSkis?: string,
  idUser?: string,
  idBoots?: string,
  idFriends?: string[],
  listOfOffPistes?: { id: string, nb: number, rating?: number }[]
}) {
  const id = createId();
  let query = insertQuery(TABLES.OUTINGS, ["id", "date", "idSkis", "idUser", "idBoots", "idOutingType"],
    [id, o.date, o.idSkis ?? null, o.idUser ?? null, o.idBoots ?? null, o.idOutingType ?? null]);
  if (o.idFriends) {
    for (const idFriend of o.idFriends) {
      query += insertQuery(TABLES.JOIN_OUTINGS_FRIENDS, ["idOuting", "idFriend"], [id, idFriend]);
    }
  }
  if (o.listOfOffPistes) {
    for (const { id: idOffPiste, nb: nb, rating } of o.listOfOffPistes) {
      query += insertQuery(TABLES.JOIN_OUTINGS_OFFPISTES, ["idOuting", "idOffPiste", "count", "rating"], 
        [id, idOffPiste, nb, rating ?? 3]);
    }
  }
  await execQuery(db, query);
  return {
    id: id, date: o.date, idOutingType: o.idOutingType, idSkis: o.idSkis, idUser: o.idUser, idBoots: o.idBoots,
    idFriends: o.idFriends, listOfOffPistes: o.listOfOffPistes
  } as Outings;
}

export async function updateOuting(db: SQLiteDatabase, o: Outings) {
  let query = updateQuery(TABLES.OUTINGS, ["date", "idSkis", "idUser", "idBoots", "idOutingType"],
    [o.date, o.idSkis ?? null, o.idUser ?? null, o.idBoots ?? null, o.idOutingType], "id = ?", [o.id]);

  if (!o.idFriends) o.idFriends = [];
  const listFriends: string[] = o.idFriends ? o.idFriends.map(id => id.toString()) : [];

  const friendsResult: any[] =
    (await db.getAllAsync(formatSQL(`SELECT idFriend FROM joinOutingsFriends WHERE idOuting = ?`, [o.id])))
      .map((row: any) => row.idFriend);

  query += diffAndGenerateQueries(friendsResult, listFriends, "joinOutingsFriends", "idOuting", o.id, "idFriend");

  query += deleteQuery(TABLES.JOIN_OUTINGS_OFFPISTES, "idOuting = ?", [o.id]);
  if (o.listOfOffPistes) {
    for (const { id: idOffPiste, nb: count, rating } of o.listOfOffPistes) {
      query += insertQuery(TABLES.JOIN_OUTINGS_OFFPISTES, ["idOuting", "idOffPiste", "count", "rating"], 
        [o.id, idOffPiste, count, rating ?? 3]);
    }
  }
  await execQuery(db, query);
}

export async function deleteOuting(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.JOIN_OUTINGS_FRIENDS, "idOuting = ?", [id]) +
    deleteQuery(TABLES.JOIN_OUTINGS_OFFPISTES, "idOuting = ?", [id]) +
    deleteQuery(TABLES.OUTINGS, "id = ?", [id]));
}

export async function getAllOutings(db: SQLiteDatabase, seasonDate: number): Promise<Outings[]> {
  const result = await db.getAllAsync(`
    SELECT
      o.id,
      o.date,
      o.idSkis,
      o.idUser,
      o.idBoots,
      o.idOutingType,
      GROUP_CONCAT(DISTINCT jof.idFriend) AS idFriends,
      GROUP_CONCAT(DISTINCT(joo.idOffPiste || ':' || joo.count || ':' || joo.rating)) AS listOfOffPistes
    FROM ${TABLES.OUTINGS} o
    LEFT JOIN ${TABLES.JOIN_OUTINGS_FRIENDS} jof ON o.id = jof.idOuting
    LEFT JOIN ${TABLES.JOIN_OUTINGS_OFFPISTES} joo ON o.id = joo.idOuting
    WHERE o.date >= ?
    GROUP BY o.id
    ORDER BY o.date DESC
    `, [seasonDate]);
  return result.map((row: any) => ({
    id: row.id,
    date: row.date,
    idSkis: row.idSkis,
    idUser: row.idUser,
    idBoots: row.idBoots,
    idOutingType: row.idOutingType,
    idFriends: (row.idFriends ?? '').split(',').filter(Boolean),
    listOfOffPistes: (row.listOfOffPistes ?? '').split(',').filter(Boolean).map((item: string) => {
      const [id, nb, rating] = item.split(':');
      return { id, nb: Number(nb), rating: rating ? Number(rating) : 3 };
    }),
  }));
}