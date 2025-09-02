import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DatabaseManager';

export type OffPistes = {
    id: string;
    name: string;
    // Optional fields, will be filled when fetching
    count: number;
};

export function initOffPiste(): OffPistes {
    return {
        id: "not-an-id",
        name: "",
        count: 0,
    };
}

// -------------------- OFF-PISTES --------------------
export async function insertOffPiste(db: SQLiteDatabase, op: { name: string }) {
    const id = createId();
    await execQuery(db, insertQuery(TABLES.OFFPISTES, ["id", "name"], [id, op.name]));
    return { id: id, name: op.name } as OffPistes;
}

export async function updateOffPiste(db: SQLiteDatabase, op: OffPistes) {
    if (!op.id || op.id === "not-an-id") {
        console.error("Cannot update off-piste without id", op);
        return;
    }
    if (!op.name) {
        console.error("Cannot update off-piste without name", op);
        return;
    }
    await execQuery(db, updateQuery(TABLES.OFFPISTES, ["name"], [op.name], "id = ?", [op.id]));
}

export async function deleteOffPiste(db: SQLiteDatabase, id: string) {
    if (!id || id === "not-an-id") {
        console.error("Cannot delete off-piste without id", id);
        return;
    }
    await execQuery(db, deleteQuery(TABLES.OFFPISTES, "id = ?", [id]));
}
export async function getAllOffPistes(db: SQLiteDatabase): Promise<OffPistes[]> {
    const result: OffPistes[] = await db.getAllAsync(`
        SELECT 
            op.id, op.name, 
            COALESCE(SUM(joop.count), 0) as count 
        FROM ${TABLES.OFFPISTES} op
            LEFT JOIN joinOutingsOffPistes joop ON op.id = joop.idOffPiste 
        GROUP BY op.id
        ORDER BY count DESC, op.name
    `);
    return result;
}

export async function getSeasonOffPistes(db: SQLiteDatabase): Promise<OffPistes[]> {
    const result: OffPistes[] = await db.getAllAsync(`
      SELECT 
        op.id, 
        op.name, 
        COALESCE(SUM(joop.count), 0) as count
      FROM ${TABLES.OFFPISTES} op
        LEFT JOIN ${TABLES.JOIN_OUTINGS_OFFPISTES} joop ON op.id = joop.idOffPiste 
        LEFT JOIN ${TABLES.OUTINGS} o ON joop.idOuting = o.id
      WHERE o.date >= (SELECT begin FROM itemsSeasons ORDER BY begin DESC LIMIT 1)
      GROUP BY op.id
      ORDER BY count DESC, op.name
    `);
    return result;
}
