import AppButton from "@/components/AppButton";
import Body from "@/components/Body";
import Separator from "@/components/Separator";
import AppStyles from "@/constants/AppStyles";
import { useEnvContext } from "@/context/EnvContext";
import { ThemeContext } from "@/context/ThemeContext";
import { TABLES } from "@/hooks/DatabaseManager";
import { Boots, insertBoots } from "@/hooks/dbBoots";
import { insertMaintain } from "@/hooks/dbMaintains";
import { insertOuting } from "@/hooks/dbOutings";
import { insertSeason } from "@/hooks/dbSeasons";
import { insertSki, Skis } from "@/hooks/dbSkis";
import { initTypeOfSkis, insertTypeOfSkis, TOS, updateTypeOfSkis } from "@/hooks/dbTypeOfSkis";
import { insertUser, Users } from "@/hooks/dbUsers";
import { delDataStore } from "@/hooks/FileSystemManager";
import { reloadAppAsync } from "expo";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from "expo-file-system";
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { useSQLiteContext } from "expo-sqlite";
import { useContext, useState } from "react";
import { StyleSheet, Text, View } from 'react-native';
import { hideMessage, showMessage } from "react-native-flash-message";


function extractRegexMatch(name: string, regex: RegExp): string | undefined {
  const matches = name.match(regex);
  return matches ? matches[1] : undefined;
}


async function restoreSuivisSkisDB(db: SQLite.SQLiteDatabase, sqLiteDatabase: SQLite.SQLiteDatabase, smDate: (value?: any) => number) {
  let itemsBoots: Boots[] = [];
  let itemsSkis: Skis[] = [];
  let itemsUsers: Users[] = [];
  let typeOfSkis: TOS[] = [];
  let message = `Restoring SuivisSkisDB...\nErase database...`;

  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  for (const table of ["eventsMaintains", "eventsOutings", "joinSkisBoots", "joinSkisUsers", "joinOutingsOffPistes", "itemsSkis", "itemsBoots", "itemsUsers", "itemsSeasons"]) {
    console.debug("DELETE " + table);
    await db.execAsync("DELETE FROM " + table);
  }
  message += ` done\nErase datastore...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  await db.execAsync("DELETE FROM typeOfSkis WHERE  id NOT like 'init-%';");
  await delDataStore()
  message += ` done\nRestore database(typeOfSkis)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  const listTypeOfSkis: { id: string, name: string }[] = await db.getAllAsync("SELECT id, name FROM typeOfSkis");
  const listItemBrand: { id: string, name: string, remove: number }[] = (await db.getAllAsync("SELECT id, name, 1 as remove FROM itemsBrands"));
  listItemBrand.push({ id: 'init-rossignol', name: 'ross', remove: 1 });
  listItemBrand.push({ id: 'init-rossignol', name: 'hero', remove: 0 });
  listItemBrand.push({ id: 'init-rossignol', name: 'm21', remove: 0 });
  listItemBrand.push({ id: 'init-rossignol', name: 'm23', remove: 0 });
  listItemBrand.push({ id: 'init-rossignol', name: 'poursuit', remove: 0 });
  listItemBrand.push({ id: 'init-fischer', name: 'fisher', remove: 1 });
  listItemBrand.push({ id: 'init-blizzard', name: 'rustler', remove: 0 });
  listItemBrand.push({ id: 'init-blizzard', name: 'ruslter', remove: 0 });
  listItemBrand.push({ id: 'init-blizzard', name: 'brama', remove: 0 });
  listItemBrand.push({ id: 'init-blizzard', name: 'brahma', remove: 0 });
  listItemBrand.push({ id: 'init-stockli', name: 'stolky', remove: 1 });
  listItemBrand.push({ id: 'init-stockli', name: 'stockli', remove: 1 });
  listItemBrand.push({ id: 'init-stockli', name: 'stokli', remove: 1 });
  listItemBrand.push({ id: 'init-stockli', name: 'stolki', remove: 1 });
  console.debug("listItemBrand: ", listItemBrand);
  const extractBrand =
    (name: string) => listItemBrand.find(
      brand => name.toLowerCase().includes(brand.name.toLowerCase())) || { id: 'init-unknown', name: '?', remove: 0 };

  // Type Of Skis
  let ssResult: any = await sqLiteDatabase.getAllAsync("SELECT id, Nom, alerteAffutage, alerteFartage  FROM styleSkis");
  let smResult: any = listTypeOfSkis;
  console.debug("skisStyles: ", smResult);
  for (const ssRow of ssResult) {
    const smRow =
      listTypeOfSkis.find(sm => sm.name.trim() === ssRow.Nom.trim());
    if (smRow) {
      typeOfSkis[ssRow.id] =
        await updateTypeOfSkis(db, { ...initTypeOfSkis(), id: smRow.id, name: smRow.name, sharpNeed: ssRow.alerteAffutage, waxNeed: ssRow.alerteFartage });
    } else {
      typeOfSkis[ssRow.id] =
        await insertTypeOfSkis(db, { name: ssRow.Nom, sharpNeed: ssRow.alerteAffutage, waxNeed: ssRow.alerteFartage });
    }
  }
  // Users
  message += ` done(${ssResult.length})\nRestore database(Users)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync("SELECT id, Nom FROM utilisateur");
  console.debug("utilisateur: ", ssResult.length);
  for (const ssRow of ssResult) {
    if (/location|prêt/i.test(ssRow.Nom)) continue;
    itemsUsers[ssRow.id] = await insertUser(db, { name: ssRow.Nom });
  }

  // Boots
  message += ` done(${ssResult.length})\nRestore database(Boots)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync("SELECT c.id, c.Nom, c.debut, c.fin, \
          GROUP_CONCAT(DISTINCT s.idUtilisateur) AS listUsers \
          FROM chaussures c LEFT JOIN sortie s ON s.idChaussures = c.id \
          GROUP BY c.id;");
  console.debug("chaussures: ", ssResult.length);
  for (const ssRow of ssResult) {
    if (/location|prêt/i.test(ssRow.Nom)) continue;
    let name = ssRow.Nom;
    const beginDate = smDate(ssRow.debut);
    const endDate = (ssRow.fin === 99999999) ? undefined : smDate(ssRow.fin);
    const listUsers = ssRow.listUsers.split(",").filter((id: number) => itemsUsers[id]).map((id: number) => itemsUsers[id].id);
    const itemBrand = extractBrand(name);
    if (itemBrand.remove > 0) name = name.replace(new RegExp(itemBrand.name, "i"), "").trim();
    const size = extractRegexMatch(name, /\bT(\d{2}(?:\.\d)?)\b/i);
    if (size) name = name.replace(new RegExp("T" + size, "i"), "").trim();
    const length = extractRegexMatch(name, /\b([2-3]\d\d)\b/);
    if (length) name = name.replace(new RegExp(length), "").trim();
    const flex = extractRegexMatch(name, /\b(1?\d\d)\b/);
    if (flex) name = name.replace(new RegExp(flex), "").trim();
    const year = extractRegexMatch(name, /\b(20\d{2})\b/);
    if (year) name = name.replace(new RegExp(year), "").trim();

    itemsBoots[ssRow.id] = await insertBoots(db, {
      name: name, idBrand: itemBrand.id, begin: beginDate, end: endDate,
      listUsers: listUsers, size: size, length: (length) ? parseInt(length) : undefined,
      flex: (flex) ? parseInt(flex) : undefined
    });
    console.debug("boots: ", itemsBoots[ssRow.id]);
  }
  // Skis
  message += ` done(${ssResult.length})\nRestore database(Skis)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync(
    "WITH user_counts AS (SELECT s.idSkis, s.idUtilisateur, COUNT(*) AS nbSorties \
      FROM sortie s GROUP BY s.idSkis, s.idUtilisateur ORDER BY s.idSkis ASC, nbSorties DESC ) ,\
    boots_list AS (SELECT s.idSkis, GROUP_CONCAT(DISTINCT s.idChaussures) AS listBoots \
      FROM sortie s GROUP BY s.idSkis)\
    SELECT s.id, s.Nom, s.idChaussures, s.idStyleSkis, s.idUtilisateur, s.debut, s.fin, \
      (SELECT GROUP_CONCAT(idUtilisateur) FROM user_counts uc WHERE uc.idSkis = s.id) AS listUser, \
      (SELECT listBoots FROM boots_list bl WHERE bl.idSkis = s.id) AS listBoots \
      FROM skis AS s GROUP BY s.id");
  console.debug("skis: ", ssResult.length);
  for (const ssRow of ssResult) {
    console.debug("skis: ", ssRow);
    if (/location|prêt/i.test(ssRow.Nom)) continue;
    let name = ssRow.Nom;
    const beginDate = smDate(ssRow.debut);
    const endDate = (ssRow.fin === 99999999) ? undefined : smDate(ssRow.fin)
    const itemBrand = extractBrand(name);
    if (itemBrand.remove > 0) name = name.replace(new RegExp(`${itemBrand.name}s?`, "i"), "").trim();
    const size = extractRegexMatch(name, /\b(\d\d\d)\b/);
    if (size) name = name.replace(new RegExp(size, "i"), "").trim();
    const radius = extractRegexMatch(name, /\br(\d{2})\b/i) || extractRegexMatch(name, /\b(\d{2})m\b/i);
    if (radius) name = name.replace(new RegExp(`(r${radius}|${radius}m)`, "i"), "").trim();
    const year = extractRegexMatch(name, /\b(20\d{2})\b/);
    if (year) name = name.replace(new RegExp(year), "").trim();

    let idTypeOfSkis = typeOfSkis[ssRow.idStyleSkis].id
    if (typeOfSkis[ssRow.idStyleSkis].name === 'Course') {
      if (ssRow.Nom.includes('SL')) {
        idTypeOfSkis = 'init-sl';
        name = name.replace(/\bSL\b/i, "");
      }
      if (ssRow.Nom.includes('GS')) {
        idTypeOfSkis = 'init-gs';
        name = name.replace(/\bGS\b/i, "");
      }
    }
    name = name.replace(new RegExp(typeOfSkis[ssRow.idStyleSkis].name, "i"), "");


    const listUsers: string[] = ssRow.listUser ? ssRow.listUser.split(",").filter((id: number) => itemsUsers[id]).map((id: number) => itemsUsers[id].id) : [];
    if (itemsUsers[ssRow.idUtilisateur] && !listUsers.includes(itemsUsers[ssRow.idUtilisateur].id)) {
      listUsers.push(itemsUsers[ssRow.idUtilisateur].id);
    }
    console.debug("listUsers", listUsers);
    const listBoots: string[] = ssRow.listBoots ? ssRow.listBoots.split(",").filter((id: number) => itemsBoots[id]).map((id: number) => itemsBoots[id].id) : [];
    if (itemsBoots[ssRow.idChaussures] && !listBoots.includes(itemsBoots[ssRow.idChaussures].id)) {
      listBoots.push(itemsBoots[ssRow.idChaussures].id);
    }
    console.debug("listBoots", listBoots);

    name = name.trim().replace(/\s\s+/, " ");
    itemsSkis[ssRow.id] = await insertSki(db, {
      name: name, idTypeOfSkis: idTypeOfSkis,
      begin: beginDate, end: endDate, idBrand: itemBrand.id, size: (size) ? parseInt(size) : undefined,
      listUsers: listUsers,
      listBoots: listBoots,
      radius: (radius) ? parseInt(radius) : undefined
    });
    console.debug("skis: ", itemsSkis[ssRow.id]);
  }
  // Outing
  message += ` done(${ssResult.length})\nRestore database(Outings)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync("SELECT id, date, idChaussures, idSkis, idUtilisateur FROM sortie");
  console.debug("sortie: ", ssResult.length);
  for (const ssRow of ssResult) {
    const date = smDate(ssRow.date);
    console.debug(await insertOuting(db, {
      date, idSkis: itemsSkis[ssRow.idSkis]?.id,
      idBoots: itemsBoots[ssRow.idChaussures]?.id,
      idUser: itemsUsers[ssRow.idUtilisateur]?.id
    }));
  }
  // Maintains
  message += ` done(${ssResult.length})\nRestore database(Maintains)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync(
    "SELECT e.id, e.date, e.idSkis, CONCAT(IIF(se.isAffutage,'S',''),IIF(se.isFartage,'W',''),IIF(se.isReparation,'R','')) as swr, IIF(se.id > 3,se.Nom,'') as desc FROM entretien AS e JOIN styleEntretien AS se ON e.idStyleEntretien = se.id");
  console.debug("entretien: ", ssResult.length);
  for (const ssRow of ssResult) {
    const date = smDate(ssRow.date)
    await insertMaintain(db, {
      date: date, idSkis: itemsSkis[ssRow.idSkis].id,
      swr: ssRow.swr, description: ssRow.desc
    });
  }
  // season
  message += ` done(${ssResult.length})\nRestore database(Seasons)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync("SELECT debut, Nom FROM saison ORDER BY debut DESC")

  console.debug("seasons: ", ssResult);
  for (const ssRow of ssResult) {
    const begin = smDate(ssRow.debut);
    console.debug("season: ", ssRow.Nom, begin);
    await insertSeason(db, { begin, name: ssRow.Nom });
  }
  message += ` done(${ssResult.length})\nRestore SuivisSkisDB completed !\nRestart the app to apply changes.`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  await sqLiteDatabase.closeAsync()
  await reloadAppAsync()
}

export default function BackupSyncSettings() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext()
  const { lang, t, smDate } = useEnvContext();

  const [inactivated, setInactivated] = useState(false);

  const restoreOldDB = async () => {



    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setInactivated(true);
        const dbURI = result.assets[0].uri;
        console.log(`Database URI: ${dbURI}`);
        if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + "dbRestore")).exists) {
          await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "dbRestore");
        }
        const base64 = await FileSystem.readAsStringAsync(
          dbURI,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        )
        await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + "dbRestore/restore.db", base64,
          {
            encoding: FileSystem.EncodingType.Base64,
          })
        await FileSystem.deleteAsync(dbURI, { idempotent: true });
      } else {
        hideMessage()
        return;
      }
    } catch (error) {
      console.log("Error picking documents:", error);
      return;
    }
    try {
      showMessage({
        message: "Opening...",
        type: "default",
        autoHide: false,
      })
      const sqLiteDatabase = await SQLite.openDatabaseAsync("restore.db",
        { useNewConnection: true }, FileSystem.documentDirectory + "dbRestore");
      console.log("Database opened !");
      showMessage({
        message: "Check version...",
        type: "default",
        autoHide: false,
      })
      const suivisSkisTables = ["chaussures", "entretien", "saison", "skis", "sortie", "styleEntretien",
        "styleSkis", "utilisateur"];
      const skisManagerTables = Object.keys(TABLES).map((_, idx) => idx);
      const listTables = (await sqLiteDatabase.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'"))
        .map((item: any) => item.name)
      console.log(listTables);
      let dbVersion = 0
      for (const tableName of suivisSkisTables) {
        if (listTables.includes(tableName)) {
          console.log(tableName);
        } else {
          dbVersion = -1;
          break;
        }
      }
      if (dbVersion === 0) {
        console.debug("Find suivisSkisDB")
        if (lang !== 'fr') {
          console.debug("Language is not French, cannot restore SuivisSkisDB", lang);
          showMessage({
            message: "La langue de l'application doit être en français pour restaurer une base de données SuivisSkis.",
            type: "danger",
            autoHide: true,
            duration: 5000
          });
          await FileSystem.deleteAsync(FileSystem.documentDirectory + "dbRestore/restore.db", { idempotent: true });
          setInactivated(false);
          return;
        }
        await restoreSuivisSkisDB(db, sqLiteDatabase, smDate);
      } else {
        dbVersion = 1
        for (const tableName of skisManagerTables) {
          if (listTables.includes(tableName)) {
            console.log(tableName);
          } else {
            dbVersion = -1;
          }
        }
        if (dbVersion === 1) {
          // @ts-ignore
          let { user_version: dbVersion } = await db.getFirstAsync('PRAGMA user_version');
          console.log("Database version " + dbVersion);
          await delDataStore()
          await db.closeAsync()
          await FileSystem.moveAsync({ from: sqLiteDatabase.databasePath, to: "file://" + db.databasePath });
          await reloadAppAsync()
        } else {
          console.debug("Skipping database...");
          showMessage({
            message: "Unknown database !",
            type: "danger",
            autoHide: true,
            duration: 5000
          })
        }
      }
    } catch (error) {
      console.log("Error open db:", error);
      showMessage({
        message: "Error opening database !",
        type: "danger",
        autoHide: true,
        duration: 5000
      })
    } finally {
      setInactivated(false);
    }
    await FileSystem.deleteAsync(FileSystem.documentDirectory + "dbRestore/restore.db", { idempotent: true });
    showMessage({
      message: "Database restored !",
      type: "success",
      autoHide: true,
      duration: 5000
    })
  }

  const shareDatabase = async () => {
    console.log("shareDatabase: ", db.databasePath);
    await Sharing.shareAsync("file://" + db.databasePath)
  }


  return (
    <Body >
      {inactivated && <View style={styles.inactivate} />}
      <Text style={appStyles.title}>{t('backup_sync')}</Text>
      <AppButton onPress={restoreOldDB} icon={"download"} disabled={inactivated} caption={t('restore_db')} />
      <AppButton onPress={shareDatabase} icon={"upload"} disabled={inactivated} caption={t('share_db')} />
      <Separator />
    </Body>
  );
}

const styles = StyleSheet.create({
  inactivate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    margin: -8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    zIndex: 2,
    backgroundColor: 'rgba(45,45,45,0.5)',
  },
})