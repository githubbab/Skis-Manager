import type {SQLiteDatabase} from "expo-sqlite";

export async function initDB(db: SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 1;
  // @ts-ignore
  let { user_version: currentDbVersion } = await db.getFirstAsync(
    'PRAGMA user_version'
  );
  console.debug("currentDbVersion: ",currentDbVersion);
  if (currentDbVersion >= DATABASE_VERSION) {
    console.debug("No init DB");
    return;
  }
  if (currentDbVersion === 0) {
    console.debug("migrateDbIfNeeded: initializing database");
    await db.execAsync(`
CREATE TABLE IF NOT EXISTS "settings" (
	"name"	TEXT NOT NULL UNIQUE,
	"value"	TEXT,
	PRIMARY KEY("name")
);
CREATE TABLE IF NOT EXISTS "itemsUsers" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL UNIQUE,
	"end"	INTEGER DEFAULT NULL,
	"pcolor"	TEXT,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "typeOfSkis" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL UNIQUE,
  "waxNeed"	INTEGER,
	"sharpNeed"	INTEGER,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "typeOfOutings" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL UNIQUE,
	"canOffPiste"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "itemsBoots" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"size"	TEXT,
	"length"	INTEGER,
	"flex"	INTEGER,
	"begin"	INTEGER,
	"end"	integer,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "itemsFriends" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "itemsOffPistes" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "itemsBrands" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "itemsSkis" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"idBrand"	TEXT,
	"idTypeOfSkis"	TEXT NOT NULL,
	"begin"	INTEGER NOT NULL,
	"end"	INTEGER,
	"size"	INTEGER,
	"radius"	INTEGER,
	"waist"	INTEGER,
  FOREIGN KEY("idTypeOfSkis") REFERENCES "typeOfSkis"("id"),
  FOREIGN KEY("idBrand") REFERENCES "itemsBrands"("id"),
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "eventsOutings" (
	"id"	TEXT NOT NULL UNIQUE,
	"date"	INTEGER NOT NULL,
	"idSkis"	TEXT,
	"idUser"	TEXT,
	"idBoots"	TEXT,
	"idOutingType"	TEXT,
	FOREIGN KEY("idBoots") REFERENCES "itemsBoots"("id"),
	PRIMARY KEY("id"),
	FOREIGN KEY("idSkis") REFERENCES "itemsSkis"("id"),
	FOREIGN KEY("idUser") REFERENCES "itemsUsers"("id"),
	FOREIGN KEY("idOutingType") REFERENCES "typeOfOutings"("id")
);
CREATE TABLE IF NOT EXISTS "eventsMaintains" (
  "id"	TEXT NOT NULL UNIQUE,
	"date"	INTEGER NOT NULL,
	"idSkis"	TEXT NOT NULL,
  "swr"	TEXT NOT NULL,
  "description"	TEXT,
  PRIMARY KEY("id"),
	FOREIGN KEY("idSkis") REFERENCES "itemsSkis"("id")
);
CREATE TABLE IF NOT EXISTS "joinOutingsFriends" (
	"idOuting"	TEXT NOT NULL,
	"idFriend"	TEXT NOT NULL,
	FOREIGN KEY("idOuting") REFERENCES "eventsOutings"("id"),
	FOREIGN KEY("idFriend") REFERENCES "itemsFriends"("id")
);
CREATE TABLE IF NOT EXISTS "joinOutingsOffPistes" (
	"idOuting"	TEXT NOT NULL,
	"idOffPiste"	TEXT NOT NULL,
	"count"	INTEGER NOT NULL DEFAULT 1,
	FOREIGN KEY("idOffPiste") REFERENCES "itemsOffPistes"("id"),
	FOREIGN KEY("idOuting") REFERENCES "eventsOutings"("id")
);
CREATE TABLE IF NOT EXISTS "joinSkisBoots" (
	"idSkis"	TEXT NOT NULL,
	"idBoots"	TEXT NOT NULL,
	FOREIGN KEY("idSkis") REFERENCES "itemsSkis"("id"),
	FOREIGN KEY("idBoots") REFERENCES "itemsBoots"("id")
);
CREATE TABLE IF NOT EXISTS "joinSkisUsers" (
	"idSkis"	TEXT NOT NULL,
	"idUser"	TEXT NOT NULL,
	FOREIGN KEY("idUser") REFERENCES "itemsUsers"("id"),
	FOREIGN KEY("idSkis") REFERENCES "itemsSkis"("id")
);`);
    console.debug("migrateDbIfNeeded: initializing data");
    await db.execAsync(`
INSERT INTO "typeOfSkis" VALUES ('init-slope','Piste',8,3);
INSERT INTO "typeOfSkis" VALUES ('init-sl','SL',6,2);
INSERT INTO "typeOfSkis" VALUES ('init-powder','Poudre',12,10);
INSERT INTO "typeOfSkis" VALUES ('init-rock','Caillou',8,5);
INSERT INTO "typeOfSkis" VALUES ('init-gs','GS',6,2);
INSERT INTO "typeOfSkis" VALUES ('init-surf','Surf',10,10);
INSERT INTO "typeOfSkis" VALUES ('init-skating','Fond',null,10);
INSERT INTO "typeOfOutings" VALUES ('init-1','Piste',0);
INSERT INTO "typeOfOutings" VALUES ('init-2','Hors-Piste',1);
INSERT INTO "typeOfOutings" VALUES ('init-3','Course',0);
INSERT INTO "typeOfOutings" VALUES ('init-4','Entrainement',0);
INSERT INTO "typeOfOutings" VALUES ('init-5','Rando',1);
INSERT INTO "itemsBrands" VALUES ('init-unknown','?');
INSERT INTO "itemsBrands" VALUES ('init-rossignol','Rossignol');
INSERT INTO "itemsBrands" VALUES ('init-salomon','Salomon');
INSERT INTO "itemsBrands" VALUES ('init-atomic','Atomic');
INSERT INTO "itemsBrands" VALUES ('init-head','Head');
INSERT INTO "itemsBrands" VALUES ('init-fischer','Fischer');
INSERT INTO "itemsBrands" VALUES ('init-dynastar','Dynastar');
INSERT INTO "itemsBrands" VALUES ('init-volkl','Volkl');
INSERT INTO "itemsBrands" VALUES ('init-nordica','Nordica');
INSERT INTO "itemsBrands" VALUES ('init-k2','K2');
INSERT INTO "itemsBrands" VALUES ('init-blizzard','Blizzard');
INSERT INTO "itemsBrands" VALUES ('init-elan','Elan');
INSERT INTO "itemsBrands" VALUES ('init-black_crows','Black Crows');
INSERT INTO "itemsBrands" VALUES ('init-faction','Faction');
INSERT INTO "itemsBrands" VALUES ('init-armada','Armada');
INSERT INTO "itemsBrands" VALUES ('init-zag','ZAG');
INSERT INTO "itemsBrands" VALUES ('init-movement','Movement');
INSERT INTO "itemsBrands" VALUES ('init-stockli','Stöckli');



`)
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  console.info("migrateDbIfNeeded: initializing database DONE");
}