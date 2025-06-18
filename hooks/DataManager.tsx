import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  writeAsStringAsync,
  documentDirectory,
  readDirectoryAsync,
  makeDirectoryAsync,
  deleteAsync,
  downloadAsync,
} from "expo-file-system";
import {showMessage} from "react-native-flash-message";
import asyncAlert from "@/components/AsyncAlert";
import {Asset} from "expo-asset";

export let lastDBWrite = Date.now();

export type EventMaintain = {
  id: string;
  date: number;
  idSkis: string;
  idMaintainType: string;
};

export type EventOuting = {
  id: string;
  date: number;
  idSkis?: string;
  idUser?: string;
  idBoots?: string;
  idOutingType?: string;
  idFriends?: string[];
  idOffPistes?: { id: string, nb: number }[];
};


export type ItemBoots = {
  id: string;
  name: string;
  size?: string;
  length?: number;
  flex?: number;
  begin: number;
  end?: number;
};

export type ItemFriend = {
  id: string;
  name: string;
};

export type ItemOffPiste = {
  id: string;
  name: string;
};

export type ItemSkis = {
  id: string;
  name: string;
  idBrand?: string;
  idTypeOfSkis: string;
  begin: number;
  end?: number;
  size?: number;
  radius?: number;
  waist?: number;
  listUsers: string[];
  listBoots: string[];
};

export type ItemUser = {
  id: string;
  name: string;
  picture?: string | null;
  end?: number | null;
  pcolor?: string;
};

export type Setting = {
  name: string;
  value: string;
};

export type TypeOfMaintain = {
  id: string;
  name: string;
  swr: string;
};

export type TypeOfOuting = {
  id: string;
  name: string;
  canOffPiste: number;
};

export type TypeOfSkis = {
  id: string;
  name: string;
  waxNeed?: number;
  sharpNeed?: number;
};

const dataStore: string = documentDirectory+"data/";
const imgStore: string = documentDirectory+"images/";
let deviceID: string = "not-an-id";

function makeId(length: number) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function initCheck() {
  console.debug("Initializing DataManager");
  try {
    await readDirectoryAsync(dataStore)
    console.debug("Find dataStore", dataStore);
  }
  catch {
    await makeDirectoryAsync(dataStore)
    console.debug("Create dataStore", dataStore);
  }
  try {
    await readDirectoryAsync(imgStore)
    console.debug("Find imgStore", imgStore);
  }
  catch {
    await makeDirectoryAsync(imgStore)
    console.debug("Create imgStore", imgStore);
  }
  try {
    const files = await readDirectoryAsync(imgStore+"tos/")
    console.debug("Find imgStore", imgStore+"tos/", files);
    if (!files.includes("init-gs.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-gs.png')).uri, imgStore+"tos/init-gs.png");
    }
    if (!files.includes("init-powder.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-powder.png')).uri, imgStore+"tos/init-powder.png");
    }
    if (!files.includes("init-rock.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-rock.png')).uri, imgStore+"tos/init-rock.png");
    }
    if (!files.includes("init-skating.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-skating.png')).uri, imgStore+"tos/init-skating.png");
    }
    if (!files.includes("init-sl.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-sl.png')).uri, imgStore+"tos/init-sl.png");
    }
    if (!files.includes("init-slope.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-slope.png')).uri, imgStore+"tos/init-slope.png");
    }
    if (!files.includes("init-surf.png")) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-surf.png')).uri, imgStore+"tos/init-surf.png");
    }
  }
  catch {
    await makeDirectoryAsync(imgStore+"tos/")
    console.debug("Create imgStore", imgStore+"tos/");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-gs.png')).uri, imgStore+"tos/init-gs.png");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-powder.png')).uri, imgStore+"tos/init-powder.png");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-rock.png')).uri, imgStore+"tos/init-rock.png");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-skating.png')).uri, imgStore+"tos/init-skating.png");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-sl.png')).uri, imgStore+"tos/init-sl.png");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-slope.png')).uri, imgStore+"tos/init-slope.png");
    await downloadAsync(Asset.fromModule(require('@/assets/images/tos/init-surf.png')).uri, imgStore+"tos/init-surf.png");
  }
  try {
    const files = await readDirectoryAsync(imgStore + "brands/")
    console.debug("Find imgStore", imgStore + "brands/", files);
    if (!files.includes('init-armada.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-armada.png')).uri, imgStore + 'brands/init-armada.png');
    }
    if (!files.includes('init-atomic.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-atomic.png')).uri, imgStore + 'brands/init-atomic.png');
    }
    if (!files.includes('init-black_crows.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-black_crows.png')).uri, imgStore + 'brands/init-black_crows.png');
    }
    if (!files.includes('init-blizzard.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-blizzard.png')).uri, imgStore + 'brands/init-blizzard.png');
    }
    if (!files.includes('init-dynastar.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-dynastar.png')).uri, imgStore + 'brands/init-dynastar.png');
    }
    if (!files.includes('init-elan.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-elan.png')).uri, imgStore + 'brands/init-elan.png');
    }
    if (!files.includes('init-faction.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-faction.png')).uri, imgStore + 'brands/init-faction.png');
    }
    if (!files.includes('init-fisher.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-fisher.png')).uri, imgStore + 'brands/init-fisher.png');
    }
    if (!files.includes('init-head.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-head.png')).uri, imgStore + 'brands/init-head.png');
    }
    if (!files.includes('init-k2.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-k2.png')).uri, imgStore + 'brands/init-k2.png');
    }
    if (!files.includes('init-movement.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-movement.png')).uri, imgStore + 'brands/init-movement.png');
    }
    if (!files.includes('init-nordica.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-nordica.png')).uri, imgStore + 'brands/init-nordica.png');
    }
    if (!files.includes('init-rossignol.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-rossignol.png')).uri, imgStore + 'brands/init-rossignol.png');
    }
    if (!files.includes('init-salomon.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-salomon.png')).uri, imgStore + 'brands/init-salomon.png');
    }
    if (!files.includes('init-stockli.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-stockli.png')).uri, imgStore + 'brands/init-stockli.png');
    }
    if (!files.includes('init-unknown.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-unknown.png')).uri, imgStore + 'brands/init-unknown.png');
    }
    if (!files.includes('init-volk.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-volk.png')).uri, imgStore + 'brands/init-volk.png');
    }
    if (!files.includes('init-zag.png')) {
      await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-zag.png')).uri, imgStore + 'brands/init-zag.png');
    }
  } catch {
    await makeDirectoryAsync(imgStore + "brands/")
    console.debug("Create imgStore", imgStore + "brands/");
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-armada.png')).uri, imgStore + 'brands/init-armada.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-atomic.png')).uri, imgStore + 'brands/init-atomic.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-black_crows.png')).uri, imgStore + 'brands/init-black_crows.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-blizzard.png')).uri, imgStore + 'brands/init-blizzard.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-dynastar.png')).uri, imgStore + 'brands/init-dynastar.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-elan.png')).uri, imgStore + 'brands/init-elan.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-faction.png')).uri, imgStore + 'brands/init-faction.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-fisher.png')).uri, imgStore + 'brands/init-fisher.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-head.png')).uri, imgStore + 'brands/init-head.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-k2.png')).uri, imgStore + 'brands/init-k2.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-movement.png')).uri, imgStore + 'brands/init-movement.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-nordica.png')).uri, imgStore + 'brands/init-nordica.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-rossignol.png')).uri, imgStore + 'brands/init-rossignol.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-salomon.png')).uri, imgStore + 'brands/init-salomon.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-stockli.png')).uri, imgStore + 'brands/init-stockli.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-unknown.png')).uri, imgStore + 'brands/init-unknown.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-volk.png')).uri, imgStore + 'brands/init-volk.png');
    await downloadAsync(Asset.fromModule(require('@/assets/images/brands/init-zag.png')).uri, imgStore + 'brands/init-zag.png');
  }
  // Device ID
  deviceID = await AsyncStorage.getItem("deviceID") ?? "not-an-id"
  if (deviceID === "not-an-id") {
    console.debug("No deviceID found - generate it");
    deviceID = makeId(4)
    await AsyncStorage.setItem("deviceID", deviceID);
  }
  console.debug("deviceID: ", deviceID);

}

function createId() {
  return smDate().toString() + "-" + deviceID;
}

export async function delDataStore() {
  for (const fileName of await readDirectoryAsync(dataStore)) {
    console.debug("Delete dataStore", dataStore+fileName);
    await deleteAsync(dataStore+fileName)
  }
}

export function smDate(value?: any): number {
  const now = new Date(Date.now());
  let date = now.getTime();
  if (value) {
    if (value instanceof Date) {
      date = value.getTime();
    }
    if (typeof value === "string") {
      const re = RegExp(/^(19[0-9]{2}|20[0-9]{2}|2100)(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/);
      if (re.test(value)) {
        const yyyy = Number(value.slice(0, 4))
        const mm = Number(value.slice(4, 6))
        const dd = Number(value.slice(6, 8))
        date = new Date(yyyy, mm - 1, dd).getTime() + (now.getTime() - new Date(now.getFullYear(),now.getMonth(), now.getDate()).getTime());
      }
      try {
        date = new Date(value).getTime();
      } catch {
      }
    }
    if (typeof value === "number") {
      if (value.toString().length === 8) {
        const yyyy: number = Math.floor(value / 10000);
        const mm: number = Math.floor((value - yyyy*10000) / 100);
        const dd: number = (value - yyyy*10000 - mm*100);
        date = new Date(yyyy, mm - 1, dd).getTime() + (now.getTime() - new Date(now.getFullYear(),now.getMonth(), now.getDate()).getTime());
      }
    }
  }
  return date;
}

function formatSQL(sql: string, values: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const val = values[i++];
    if (val === null) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    return val.toString();
  });
}

async function execQuery(db: any, query: string) {
  try {
    await db.execAsync(query);
    lastDBWrite = Date.now();
    const filename = dataStore+"query-" + smDate().toString() + "-" + deviceID+".sql"
    await writeAsStringAsync(filename, query);
  } catch (err) {
    const message = err ? err.toString() : "Unknown error";
    console.error(message);
    await asyncAlert("alert", message);
    showMessage({
      message: message,
      type: "danger",
      duration: 5000,
    });
  }
}


// -------------------- MAINTAINS --------------------
export async function insertMaintain(db: any, m: {
                                     date: number,
                                     idSkis: string,
                                     idMaintainType: string}) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO eventsMaintains (id, date, idSkis, idMaintainType)
                                 VALUES (?, ?, ?, ?); `,
    [id, m.date, m.idSkis, m.idMaintainType]));
  return {id: id, date: m.date, idSkis: m.idSkis, idMaintainType: m.idMaintainType} as EventMaintain;
}

export async function updateMaintain(db: any, m: EventMaintain) {
  await execQuery(db, formatSQL(
    `UPDATE eventsMaintains SET date = ?, idSkis = ?, idMaintainType = ? WHERE id = ?`,
    [m.date, m.idSkis, m.idMaintainType, m.id]));
}

export async function deleteMaintain(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM eventsMaintains WHERE id = ?`, [id]));
}

// -------------------- OUTINGS --------------------
export async function insertOuting(db: any, o: {
                                   date: number,
                                   idOutingType?: string,
                                   idSkis?: string,
                                   idUser?: string,
                                   idBoots?: string,
                                   idFriends?: string[],
                                   idOffPistes?: { id: string, nb: number }[] }) {
  const id = createId();
  let query = formatSQL(
    `INSERT INTO eventsOutings (id, date, idSkis, idUser, idBoots, idOutingType)
     VALUES (?, ?, ?, ?, ?, ?); `,
    [id, o.date, o.idSkis ?? null, o.idUser ?? null, o.idBoots ?? null, o.idOutingType ?? null]);
  if (o.idFriends) {
    for (const idFriend of o.idFriends) {
      query += formatSQL(
        `INSERT INTO joinOutingsFriends (idOuting, idFriend) VALUES (?, ?); `, [id, idFriend]);
    }
  }
  if (o.idOffPistes) {
    for (const {id: idOffPiste, nb: nb} of o.idOffPistes) {
      query += formatSQL(
        `INSERT INTO joinOutingsOffPistes (idOuting, idOffPiste, nb) VALUES (?, ?, ?); `, [id, idOffPiste, nb]);
    }
  }
  await execQuery(db, query);
  return {id: id, date: o.date, idOutingType: o.idOutingType, idSkis: o.idSkis, idUser: o.idUser, idBoots: o.idBoots,
            idFriends: o.idFriends, idOffPistes: o.idOffPistes} as EventOuting;
}

export async function updateOuting(db: any, o: EventOuting) {
  let query = formatSQL(
    `UPDATE EventOuting SET date = ?, idSkis = ?, idUsers = ?, idBoots = ?, idOutingType = ? WHERE id = ?; `,
    [o.date, o.idSkis ?? null, o.idUser ?? null, o.idBoots ?? null, o.idOutingType, o.id]);
  
  let result: any = await db.getAllAsync(formatSQL(`SELECT idFriend FROM joinOutingsFriends WHERE idOuting = ?`,[o.id]));
  if (! o.idFriends) o.idFriends = [];
  for (const idFriend of result) {
    if (! (idFriend in o.idFriends)) {
      query+= formatSQL(`DELETE FROM joinOutingsFriends WHERE idOuting = ? AND idFriend = ?; `,[o.id, idFriend])
    }
  }
  for (const idFriend of o.idFriends) {
    if (! (idFriend in result)) {
      query+= formatSQL(`INSERT INTO joinOutingsFriends (idOuting, idFriend) VALUES (?,?); `,[o.id,idFriend])
    }
  }

  query += formatSQL(`DELETE FROM joinOutingsOffPistes WHERE idOuting = ?; `, [o.id]);
  if (o.idOffPistes) {
    for (const {id: idOffPiste, nb: nb} of o.idOffPistes) {
      query += formatSQL(
        `INSERT INTO joinOutingsOffPistes (idOuting, idOffPiste, nb) VALUES (?, ?, ?); `, [o.id, idOffPiste, nb]);
    }
  }
  await execQuery(db, query);
}

export async function deleteOuting(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM joinOutingsFriends WHERE idOuting = ?`, [id]));
  await execQuery(db, formatSQL(`DELETE FROM joinOutingsOffPistes WHERE idOuting = ?`, [id]));
  await execQuery(db, formatSQL(`DELETE FROM eventsOutings WHERE id = ?`, [id]));
}

// -------------------- BOOTS --------------------
export async function insertBoots(db: any, b: {
                                  name: string,
                                  begin: number,
                                  size?: string,
                                  length?: number,
                                  flex?: number,
                                  end?: number}
) {
  const id = createId();
  await execQuery(db, formatSQL(
    `INSERT INTO itemsBoots (id, name, size, length, flex, begin, end) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, b.name, b.size ?? null, b.length ?? null, b.flex ?? null, b.begin, b.end ?? null]));
  return {id: id, name: b.name, begin: b.begin, end: b.end, size: b.size, length: b.size, flex: b.flex} as ItemBoots;
}

export async function updateBoots(db: any, b: ItemBoots)
{
  await execQuery(db, formatSQL(
    `UPDATE itemsBoots SET name = ?, size = ?, length = ?, flex = ?, begin = ?, end = ? WHERE id = ?`,
    [b.name, b.size ?? null, b.length ?? null, b.flex ?? null, b.begin ?? null, b.end ?? null, b.id]));
}

export async function deleteBoots(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM itemsBoots WHERE id = ?`, [id]));
}

// -------------------- FRIENDS --------------------
export async function insertFriend(db: any, f: {name: string} ) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO itemsFriends (id, name) VALUES (?, ?)`, [id, f.name]));
  return { id: id, name: f.name } as ItemFriend;
}

export async function updateFriend(db: any, f: ItemFriend ) {
  await execQuery(db, formatSQL(`UPDATE itemsFriends SET name = ? WHERE id = ?`, [f.name, f.id]));
}

export async function deleteFriend(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM itemsFriends WHERE id = ?`, [id]));
}


// -------------------- OFF-PISTES --------------------
export async function insertOffPiste(db: any, op: {name: string} ) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO  itemsOffPistes (id, name) VALUES (?, ?)`, [id, op.name]));
  return {id: id, name: op.name} as ItemOffPiste;
}

export async function updateOffpiste(db: any, op: ItemOffPiste ) {
  await execQuery(db, formatSQL(`UPDATE  itemsOffPistes SET name = ? WHERE id = ?`, [op.name, op.id]));
}

export async function deleteOffpiste(db: any, id: string ) {
  await execQuery(db, formatSQL(`DELETE FROM  itemsOffPistes WHERE id = ?`, [id]));
}

// -------------------- SKIS --------------------
export async function insertSki(db: any, s: {
  name: string,
  listUsers: string[],
  listBoots: string[],
  idTypeOfSkis: string,
  begin: number,
  idBrand?: string,
  end?: number,
  size?: number,
  radius?: number,
  waist?: number}
) {
  const id = createId();
  let query = formatSQL(
    `INSERT INTO itemsSkis (id, name, idBrand, idTypeOfSkis, begin, end, size, radius, waist) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?); `,
    [id, s.name, s.idBrand ?? 'init-unknown', s.idTypeOfSkis, s.begin, s.end ?? null, s.size ?? null, s.radius ?? null, s.waist ?? null]);
  for (const idUser of s.listUsers) {
    query += formatSQL(`INSERT INTO joinSkisUsers (idSkis, idUser) VALUES (?,?); `,[id,idUser])
  }
  for (const idBoots of s.listBoots) {
    query += formatSQL(`INSERT INTO joinSkisBoots (idSkis, idBoots) VALUES (?,?); `,[id,idBoots])
  }
  await execQuery(db, query);
  return {id: id, name: s.name, brand: s.idBrand, idTypeOfSkis: s.idTypeOfSkis, begin: s.begin, end: s.end, size: s.size,
    radius: s.radius, waist: s.waist, listBoots: s.listBoots, listUsers: s.listUsers} as ItemSkis
}

export async function updateSki(db: any, s: ItemSkis) {
  let query = formatSQL(
    `UPDATE itemsSkis SET name = ?, idBrand = ?, idTypeOfSkis = ?, begin = ?, end = ?, size = ?, radius = ?, waist = ? WHERE id = ?`,
    [s.name, s.idBrand ?? null, s.idTypeOfSkis, s.begin, s.end ?? null, s.size ?? null, s.radius ?? null, s.waist ?? null, s.id]);
  let result: any = await db.getAllAsync(formatSQL(`SELECT idUser FROM joinSkisUsers WHERE idSkis = ?`,[s.id]));
  for (const idUser of result) {
    if (! (idUser in s.listUsers)) {
      query+= formatSQL(`DELETE FROM joinSkisUsers WHERE idSkis = ? AND idUser = ?; `,[s.id, idUser])
    }
  }
  for (const idUser of s.listUsers) {
    if (! (idUser in result)) {
      query+= formatSQL(`INSERT INTO joinSkisUsers (idSkis, idUser) VALUES (?,?); `,[s.id,idUser])
    }
  }
  result = await db.getAllAsync(formatSQL(`SELECT idBoots FROM joinSkisBoots WHERE idSkis = ?`,[s.id]));
  for (const idBoots of result) {
    if (! (idBoots in s.listBoots)) {
      query+= formatSQL(`DELETE FROM joinSkisBoots WHERE idSkis = ? AND idBoots = ?; `,[s.id, idBoots])
    }
  }
  for (const idBoots of s.listBoots) {
    if (! (idBoots in result)) {
      query+= formatSQL(`INSERT INTO joinSkisBoots (idSkis, idBoots) VALUES (?,?); `,[s.id,idBoots])
    }
  }
  await execQuery(db, query);
}

export async function deleteSki(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM joinSkisBoots WHERE idSkis = ?`, [id]));
  await execQuery(db, formatSQL(`DELETE FROM joinSkisUsers WHERE idSkis = ?`, [id]));
  await execQuery(db, formatSQL(`DELETE FROM itemsSkis WHERE id = ?`, [id]));
}

// -------------------- USERS --------------------
export async function insertUser(db: any, u: { name: string, picture?: string, end?: number, pcolor?: string } ) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO itemsUsers (id, name, picture, end, pcolor) VALUES (?, ?, ?, ?, ?)`,
    [id, u.name, u.picture ?? null, u.end ?? null, u.pcolor ?? null]));
  return {id: id, name: u.name, picture: u.picture, end: u.end, pcolor: u.pcolor} as ItemUser;
}

export async function updateUser(db: any, u: ItemUser) {
  await execQuery(db, formatSQL(`UPDATE itemsUsers SET name = ?, picture = ?, end = ?, pcolor = ? WHERE id = ?`,
    [u.name, u.picture ?? null, u.end ?? null, u.pcolor ?? null, u.id]));
}

export async function deleteUser(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM itemsUsers WHERE id = ?`, [id]));
}

// -------------------- SETTINGS --------------------
export async function changeSetting(db: any, s: {name: string, value: string}) {
  await execQuery(db, formatSQL(
    `INSERT INTO settings (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value;`,
    [s.name, s.value]));
}

export async function deleteSetting(db: any, name: string) {
  await execQuery(db, formatSQL(`DELETE FROM settings WHERE name = ?`, [name]));
}

// -------------------- TYPE OF MAINTAINS --------------------
export async function insertTypeOfMaintains(db: any, tom: {name: string, swr: string }) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO typeOfMaintains (id, name, swr) VALUES (?, ?, ?)`,
    [id, tom.name, tom.swr]));
  return {id: id, name: tom.name, swr: tom.swr} as TypeOfMaintain;
}

export async function updateTypeOfMaintains(db: any, tom: TypeOfMaintain ) {
  await execQuery(db, formatSQL(`UPDATE typeOfMaintains SET name = ?, swr = ? WHERE id = ?`,
    [tom.name, tom.swr, tom.id]));
}

export async function deleteTypeOfMaintains(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM typeOfMaintains WHERE id = ?`, [id]));
}

// -------------------- TYPE OF OUTING --------------------
export async function insertTypeOfOutings(db: any, too: { name: string, canOffPiste: number } ) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO typeOfOutings (id, name, canOffPiste) VALUES (?, ?, ?)`,
    [id, too.name, too.canOffPiste]));
  return {id: id, name: too.name, canOffPiste: too.canOffPiste} as TypeOfOuting;
}

export async function updateTypeOfOutings(db: any, too: TypeOfOuting ) {
  await execQuery(db, formatSQL(`UPDATE typeOfOutings SET name = ?, canOffPiste = ? WHERE id = ?`,
    [too.name, too.canOffPiste, too.id]));
}

export async function deleteTypeOfOutings(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM typeOfOutings WHERE id = ?`, [id]));
}

// -------------------- TYPE OF SKIS --------------------
export async function insertTypeOfSkis(db: any, tos: {name: string, waxNeed: number, sharpNeed: number} ) {
  const id = createId();
  await execQuery(db, formatSQL(`INSERT INTO typeOfSkis (id, name, waxNeed, sharpNeed) VALUES (?, ?, ?, ?)`,
    [id, tos.name, tos.waxNeed, tos.sharpNeed]));
  return {id: id, name: tos.name, waxNeed: tos.waxNeed, sharpNeed: tos.sharpNeed} as TypeOfSkis;
}

export async function updateTypeOfSkis(db: any, tos: TypeOfSkis ) {
  await execQuery(db, formatSQL(`UPDATE typeOfSkis SET name = ?, waxNeed = ?, sharpNeed = ? WHERE id = ?`,
    [tos.name, tos.waxNeed, tos.sharpNeed, tos.id]));
}

export async function deleteTypeOfSkis(db: any, id: string) {
  await execQuery(db, formatSQL(`DELETE FROM typeOfSkis WHERE id = ?`, [id]));
}


