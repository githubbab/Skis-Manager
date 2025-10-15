import type { SQLiteDatabase } from 'expo-sqlite'; // or the correct module you use for SQLite
import { createId, deleteQuery, execQuery, insertQuery, TABLES, updateQuery } from './DataManager';
import { delBrandIco, getBrandIcoURI, icoUnknownBrand } from "./DataManager";



export type Brands = {
  id: string;
  name: string;
  // Optional fields, will be filled when fetching
  icoUri: string;
  nbSkis: number;
  nbBoots: number;
};

export function initBrand(): Brands {
  return {
    id: "not-an-id",
    name: "",
    icoUri: icoUnknownBrand, // Fallback image
    nbSkis: 0,
    nbBoots: 0,
  };  
}

// -------------------- BRANDS --------------------
export async function insertBrand(db: SQLiteDatabase, b: { name: string }) {
  const id = createId();
  await execQuery(db, insertQuery(TABLES.BRANDS, ["id", "name"], [id, b.name]), id);
  return { id: id, name: b.name };
}

export async function updateBrand(db: SQLiteDatabase, b: { id: string, name: string }) {
  await execQuery(db, updateQuery(TABLES.BRANDS, ["name"], [b.name], "id = ?", [b.id]), b.id);
}

export async function deleteBrand(db: SQLiteDatabase, id: string) {
  await execQuery(db, deleteQuery(TABLES.BRANDS, "id = ?", [id]), id);
  delBrandIco(id);
}

export async function getAllBrands(db: SQLiteDatabase, order_by: "order_by_usage" | "order_by_skis" | "order_by_boots"): Promise<Brands[]> {
  // Determine the ORDER BY clause based on the order_by parameter
  const orderByClause = {
    "order_by_usage": "(nbSkis + nbBoots) DESC",
    "order_by_skis": "nbSkis DESC",
    "order_by_boots": "nbBoots DESC"
  }[order_by];

  const data: Brands[] = await db.getAllAsync(`
    SELECT b.id, b.name,
      COUNT(DISTINCT s.id) AS nbSkis,
      COUNT(DISTINCT bo.id) AS nbBoots
    FROM ${TABLES.BRANDS} b
    LEFT JOIN ${TABLES.SKIS} s ON b.id = s.idBrand
    LEFT JOIN ${TABLES.BOOTS} bo ON b.id = bo.idBrand
    GROUP BY b.id
    ORDER BY ${orderByClause}, b.name
    `);
  for (const brand of data) {
    brand.icoUri = await getBrandIcoURI(brand.id);
  }
  return data;
}