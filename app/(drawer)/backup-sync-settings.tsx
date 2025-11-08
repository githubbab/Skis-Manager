import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import CheckButton from "@/components/CheckButton";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { clearDatabase, getDeviceID, TABLES , clearStore } from "@/hooks/DataManager";
import { Boots, insertBoots } from "@/hooks/dbBoots";
import { insertMaintain } from "@/hooks/dbMaintains";
import { insertOuting } from "@/hooks/dbOutings";
import { insertSeason } from "@/hooks/dbSeasons";
import { insertSki, Skis } from "@/hooks/dbSkis";
import { initTypeOfSkis, insertTypeOfSkis, TOS, updateTypeOfSkis } from "@/hooks/dbTypeOfSkis";
import { insertUser, Users } from "@/hooks/dbUsers";
import { createWebDavClient, importAllRemoteImages } from "@/hooks/SyncWebDav";
import { getDeviceList, deleteDeviceFiles, DeviceInfo } from "@/hooks/syncByState";
import { Logger, smDate } from "@/hooks/ToolsBox";
import { reloadAppAsync } from "expo";
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { useSQLiteContext } from "expo-sqlite";
import { useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from "react-native-flash-message";
import { Directory, File, Paths } from "expo-file-system";
import AppContext from "@/context/AppContext";
import { WebDAVClient } from "webdav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native-gesture-handler";


//                                                ######                              #     #                           
// ###### #    # ##### #####    ##    ####  ##### #     # ######  ####  ###### #    # ##   ##   ##   #####  ####  #    #
// #       #  #    #   #    #  #  #  #    #   #   #     # #      #    # #       #  #  # # # #  #  #    #   #    # #    #
// #####    ##     #   #    # #    # #        #   ######  #####  #      #####    ##   #  #  # #    #   #   #      ######
// #        ##     #   #####  ###### #        #   #   #   #      #  ### #        ##   #     # ######   #   #      #    #
// #       #  #    #   #   #  #    # #    #   #   #    #  #      #    # #       #  #  #     # #    #   #   #    # #    #
// ###### #    #   #   #    # #    #  ####    #   #     # ######  ####  ###### #    # #     # #    #   #    ####  #    #
function extractRegexMatch(name: string, regex: RegExp): string | undefined {
  const matches = name.match(regex);
  return matches ? matches[1] : undefined;
}

//                                                  #####                            #####                  ######  ###### 
// #####  ######  ####  #####  ####  #####  ###### #     # #    # # #    # #  ####  #     # #    # #  ####  #     # #     #
// #    # #      #        #   #    # #    # #      #       #    # # #    # # #      #       #   #  # #      #     # #     #
// #    # #####   ####    #   #    # #    # #####   #####  #    # # #    # #  ####   #####  ####   #  ####  #     # ###### 
// #####  #           #   #   #    # #####  #            # #    # # #    # #      #       # #  #   #      # #     # #     #
// #   #  #      #    #   #   #    # #   #  #      #     # #    # #  #  #  # #    # #     # #   #  # #    # #     # #     #
// #    # ######  ####    #    ####  #    # ######  #####   ####  #   ##   #  ####   #####  #    # #  ####  ######  ###### 
async function restoreSuivisSkisDB(db: SQLite.SQLiteDatabase, sqLiteDatabase: SQLite.SQLiteDatabase) {
  let itemsBoots: Boots[] = [];
  let itemsSkis: Skis[] = [];
  let itemsUsers: Users[] = [];
  let typeOfSkis: TOS[] = [];
  let message = `Restoring SuivisSkisDB...\nReinit database...`;

  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  await clearDatabase(db);
  await clearStore();
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
  Logger.debug("restoreSuivisSkisDB: listItemBrand: ", listItemBrand);
  const extractBrand =
    (name: string) => listItemBrand.find(
      brand => name.toLowerCase().includes(brand.name.toLowerCase())) || { id: 'init-unknown', name: '?', remove: 0 };

  // Type Of Skis
  let ssResult: any = await sqLiteDatabase.getAllAsync("SELECT id, Nom, alerteAffutage, alerteFartage  FROM styleSkis");
  let smResult: any = listTypeOfSkis;
  Logger.debug("restoreSuivisSkisDB: skisStyles: ", smResult);
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
  Logger.debug("restoreSuivisSkisDB: utilisateur: ", ssResult.length);
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
  Logger.debug("restoreSuivisSkisDB: chaussures: ", ssResult.length);
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
    Logger.debug("boots: ", itemsBoots[ssRow.id]);
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
  Logger.debug("restoreSuivisSkisDB: skis: ", ssResult.length);
  for (const ssRow of ssResult) {
    Logger.debug("restoreSuivisSkisDB: skis: ", ssRow);
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
    Logger.debug("restoreSuivisSkisDB: listUsers", listUsers);
    const listBoots: string[] = ssRow.listBoots ? ssRow.listBoots.split(",").filter((id: number) => itemsBoots[id]).map((id: number) => itemsBoots[id].id) : [];
    if (itemsBoots[ssRow.idChaussures] && !listBoots.includes(itemsBoots[ssRow.idChaussures].id)) {
      listBoots.push(itemsBoots[ssRow.idChaussures].id);
    }
    Logger.debug("restoreSuivisSkisDB: listBoots", listBoots);

    name = name.trim().replace(/\s\s+/, " ");
    itemsSkis[ssRow.id] = await insertSki(db, {
      name: name, idTypeOfSkis: idTypeOfSkis,
      begin: beginDate, end: endDate, idBrand: itemBrand.id, size: (size) ? parseInt(size) : undefined,
      listUsers: listUsers,
      listBoots: listBoots,
      radius: (radius) ? parseInt(radius) : undefined
    });
    Logger.debug("restoreSuivisSkisDB: skis: ", itemsSkis[ssRow.id]);
  }
  // Outing
  message += ` done(${ssResult.length})\nRestore database(Outings)...`;
  showMessage({
    message: message,
    type: "default",
    autoHide: false,
  })
  ssResult = await sqLiteDatabase.getAllAsync("SELECT id, date, idChaussures, idSkis, idUtilisateur FROM sortie");
  Logger.debug("restoreSuivisSkisDB: sortie: ", ssResult.length);
  for (const ssRow of ssResult) {
    const date = smDate(ssRow.date);
    Logger.debug("restoreSuivisSkisDB: ", await insertOuting(db, {
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
  Logger.debug("restoreSuivisSkisDB: entretien: ", ssResult.length);
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

  Logger.debug("restoreSuivisSkisDB: seasons: ", ssResult);
  for (const ssRow of ssResult) {
    const begin = smDate(ssRow.debut);
    Logger.debug("restoreSuivisSkisDB: season: ", ssRow.Nom, begin);
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

// ######                                      #####                       #####                                           
// #     #   ##    ####  #    # #    # #####  #     # #   # #    #  ####  #     # ###### ##### ##### # #    #  ####   #### 
// #     #  #  #  #    # #   #  #    # #    # #        # #  ##   # #    # #       #        #     #   # ##   # #    # #     
// ######  #    # #      ####   #    # #    #  #####    #   # #  # #       #####  #####    #     #   # # #  # #       #### 
// #     # ###### #      #  #   #    # #####        #   #   #  # # #            # #        #     #   # #  # # #  ###      #
// #     # #    # #    # #   #  #    # #      #     #   #   #   ## #    # #     # #        #     #   # #   ## #    # #    #
// ######  #    #  ####  #    #  ####  #       #####    #   #    #  ####   #####  ######   #     #   # #    #  ####   #### 
export default function BackupSyncSettings() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext()
  const { lang, t, webDavSyncEnabled, webDavSyncParams, webDavClient, webDavSyncStatus, changeWebDavSync, localeDate, webDavSync } = useContext(AppContext);
  const [webDavUrlState, setWebDavUrl] = useState(webDavSyncParams.url);
  const [webDavUserState, setWebDavUser] = useState(webDavSyncParams.user);
  const [webDavPasswordState, setWebDavPassword] = useState(webDavSyncParams.password);
  const [inactivated, setInactivated] = useState(false);
  const [syncDevices, setSyncDevices] = useState<DeviceInfo[]>([]);
  const myID = getDeviceID();

  //                                            #####                      ###                     
  //         ###### ###### #####  ####  #    # #     # #   # #    #  ####   #  #    # ######  #### 
  //         #      #        #   #    # #    # #        # #  ##   # #    #  #  ##   # #      #    #
  //         #####  #####    #   #      ######  #####    #   # #  # #       #  # #  # #####  #    #
  //         #      #        #   #      #    #       #   #   #  # # #       #  #  # # #      #    #
  //         #      #        #   #    # #    # #     #   #   #   ## #    #  #  #   ## #      #    #
  //         #      ######   #    ####  #    #  #####    #   #    #  ####  ### #    # #       #### 
  const fetchSyncInfo = async () => {
    if (!webDavClient) return;
    const devices = await getDeviceList(webDavClient);
    setSyncDevices(devices);
  }

  //                              #######                                  
  //         #    #  ####  ###### #       ###### ###### ######  ####  #####
  //         #    # #      #      #       #      #      #      #    #   #  
  //         #    #  ####  #####  #####   #####  #####  #####  #        #  
  //         #    #      # #      #       #      #      #      #        #  
  //         #    # #    # #      #       #      #      #      #    #   #  
  //          ####   ####  ###### ####### #      #      ######  ####    #  
  useEffect(() => {
    if (!webDavSyncEnabled) return;
    fetchSyncInfo();
    /*    const interval = setInterval(() => {
         if (webDavSyncEnabled) fetchSyncInfo();
       }, 300000);
       return () => clearInterval(interval); */
  }, [webDavSyncEnabled]);

  useEffect(() => {
    if (webDavSyncEnabled && (webDavUrlState !== webDavSyncParams.url || webDavUserState !== webDavSyncParams.user || webDavPasswordState !== webDavSyncParams.password))
      changeWebDavSync(false);
  }, [webDavUrlState, webDavUserState, webDavPasswordState])

  //                                                         #######               ######  ###### 
  //         #####  ######  ####  #####  ####  #####  ###### #     # #      #####  #     # #     #
  //         #    # #      #        #   #    # #    # #      #     # #      #    # #     # #     #
  //         #    # #####   ####    #   #    # #    # #####  #     # #      #    # #     # ###### 
  //         #####  #           #   #   #    # #####  #      #     # #      #    # #     # #     #
  //         #   #  #      #    #   #   #    # #   #  #      #     # #      #    # #     # #     #
  //         #    # ######  ####    #    ####  #    # ###### ####### ###### #####  ######  ###### 
  const restoreOldDB = async () => {
    const dbRestoreDir = new Directory(Paths.document.uri + "dbRestore/");
    if (!dbRestoreDir.exists) {
      dbRestoreDir.create();
    }
    const file2restore = new File(dbRestoreDir.uri + "restore.db");
    if (file2restore.exists) {
      file2restore.delete();
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setInactivated(true);
        const dbURI = result.assets[0].uri;
        Logger.debug(`restoreOldDB: Database URI: ${dbURI}`);
        const file2copy = new File(dbURI);
        if (!file2copy.exists) {
          Logger.error("restoreOldDB: File does not exist:", dbURI);
          setInactivated(false);
          return;
        }
        Logger.debug("restoreOldDB: File to copy:", file2copy);
        file2copy.copy(file2restore);
        file2copy.delete();
      }
      else {
        Logger.debug("restoreOldDB: No valid file selected");
        return;
      }
    } catch (error) {
      showMessage({
        message: "Error picking document: " + error,
        type: "danger",
        autoHide: true,
        duration: 5000
      })
      Logger.error("restoreOldDB: Error picking documents:", error);
      return;
    }
    try {
      setInactivated(true);
      showMessage({
        message: "Opening...",
        type: "default",
        autoHide: false,
      })
      const sqLiteDatabase = await SQLite.openDatabaseAsync("restore.db", { useNewConnection: true }, dbRestoreDir.uri);
      Logger.debug("restoreOldDB: Database to restore opened !");
      showMessage({
        message: "Check version...",
        type: "default",
        autoHide: false,
      })
      const suivisSkisTables = ["chaussures", "entretien", "saison", "skis", "sortie", "styleEntretien",
        "styleSkis", "utilisateur"];
      const skisManagerTables = Object.values(TABLES);
      const listTables = (await sqLiteDatabase.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'"))
        .map((item: any) => item.name)
      Logger.debug("restoreOldDB: listTables:", listTables);
      let dbVersion = 0
      for (const tableName of suivisSkisTables) {
        if (!listTables.includes(tableName)) {
          Logger.debug("restoreOldDB: Not a SuivisSkisDB, missing table", tableName);
          dbVersion = -1;
          break;
        }
      }
      if (dbVersion === 0) {
        Logger.debug("restoreOldDB: Find suivisSkisDB")
        if (lang !== 'fr') {
          Logger.debug("restoreOldDB: Language is not French, cannot restore SuivisSkisDB", lang);
          showMessage({
            message: "La langue de l'application doit être en français pour restaurer une base de données SuivisSkis.",
            type: "danger",
            autoHide: true,
            duration: 5000
          });
          await sqLiteDatabase.closeAsync();
          file2restore.delete()
          setInactivated(false);
          return;
        }
        await restoreSuivisSkisDB(db, sqLiteDatabase);
      } else {
        dbVersion = 1
        for (const tableName of skisManagerTables) {
          if (!listTables.includes(tableName)) {
            Logger.debug("restoreOldDB: Not a skisManagerDB, missing table", tableName);
            dbVersion = -1;
          }
        }
        if (dbVersion === 1) {
          Logger.debug("restoreOldDB: Find skisManagerDB")
          try {
            // @ts-ignore
            Logger.debug("restoreOldDB: Clearing Store...");
            await clearStore()
            Logger.debug("restoreOldDB: Closing database...");
            await db.closeAsync();
          } catch (error) {
            Logger.error("restoreOldDB: Error close db:", error);
          }
          Logger.debug("restoreOldDB: Restoring database " + db.databasePath + " with " + file2restore.uri);
          try {
            copyDBFile(file2restore.uri, "file://" + db.databasePath);
          } catch (error) {
            Logger.error("restoreOldDB: Error restoring db:", error);
            showMessage({
              message: "Error restoring database !",
              type: "danger",
              autoHide: true,
              duration: 5000
            })
            setInactivated(false);
            return;
          }
          Logger.debug("restoreOldDB: Database restored to " + db.databasePath);
          await reloadAppAsync()
        } else {
          Logger.debug("restoreOldDB: Skipping database...");
          showMessage({
            message: "Unknown database !",
            type: "danger",
            autoHide: true,
            duration: 5000
          })
        }
      }
    } catch (error) {
      Logger.error("restoreOldDB: Error open db:", error);
      showMessage({
        message: "Error opening database !",
        type: "danger",
        autoHide: true,
        duration: 5000
      })
    } finally {
      setInactivated(false);
      if (file2restore.exists) {
        file2restore.delete();
      }
    }
    showMessage({
      message: "Database restored !",
      type: "success",
      autoHide: true,
      duration: 5000
    })
  }

  //                                    ######  ######  #######                
  //          ####   ####  #####  #   # #     # #     # #       # #      ######
  //         #    # #    # #    #  # #  #     # #     # #       # #      #     
  //         #      #    # #    #   #   #     # ######  #####   # #      ##### 
  //         #      #    # #####    #   #     # #     # #       # #      #     
  //         #    # #    # #        #   #     # #     # #       # #      #     
  //          ####   ####  #        #   ######  ######  #       # ###### ######
  function copyDBFile(oldDBUri: string, newDBUri: string) {
    Logger.debug("copyDBFile: Copying DB file from", oldDBUri, "to", newDBUri);
    const oldDBFile = new File(oldDBUri);
    if (!oldDBFile.exists) {
      Logger.error("copyDBFile: Old DB file does not exist:", oldDBUri);
      return;
    }
    const newDBFile = new File(newDBUri);
    if (newDBFile.exists) {
      newDBFile.delete();
    }
    oldDBFile.copy(newDBFile);
    oldDBFile.delete();
    Logger.debug("copyDBFile: DB file copied to", newDBUri);
  }

  //                                            ######                                                 
  //          ####  #    #   ##   #####  ###### #     #   ##   #####   ##   #####    ##    ####  ######
  //         #      #    #  #  #  #    # #      #     #  #  #    #    #  #  #    #  #  #  #      #     
  //          ####  ###### #    # #    # #####  #     # #    #   #   #    # #####  #    #  ####  ##### 
  //              # #    # ###### #####  #      #     # ######   #   ###### #    # ######      # #     
  //         #    # #    # #    # #   #  #      #     # #    #   #   #    # #    # #    # #    # #     
  //          ####  #    # #    # #    # ###### ######  #    #   #   #    # #####  #    #  ####  ######
  const shareDatabase = async () => {
    Logger.log("shareDatabase: ", db.databasePath);
    await Sharing.shareAsync("file://" + db.databasePath)
  }

  //                                                    #####                      #     #               ######               
  //         #    #   ##   #    # #####  #      ###### #     # #   # #    #  ####  #  #  # ###### #####  #     #   ##   #    #
  //         #    #  #  #  ##   # #    # #      #      #        # #  ##   # #    # #  #  # #      #    # #     #  #  #  #    #
  //         ###### #    # # #  # #    # #      #####   #####    #   # #  # #      #  #  # #####  #####  #     # #    # #    #
  //         #    # ###### #  # # #    # #      #            #   #   #  # # #      #  #  # #      #    # #     # ###### #    #
  //         #    # #    # #   ## #    # #      #      #     #   #   #   ## #    # #  #  # #      #    # #     # #    #  #  # 
  //         #    # #    # #    # #####  ###### ######  #####    #   #    #  ####   ## ##  ###### #####  ######  #    #   ##  
  const handleSyncWebDav = async () => {
    if (!webDavSyncEnabled) {
      setInactivated(true);
      if (webDavUrlState?.length > 0 && webDavUserState?.length > 0 && webDavPasswordState?.length > 0 && /^https?:\/\/.+\..+/.test(webDavUrlState)) {
        const res: WebDAVClient | string = await createWebDavClient({ url: webDavUrlState, user: webDavUserState, password: webDavPasswordState });
        if (typeof res === 'string') {
          alert(t('sync_webdav_error'));
          setInactivated(false);
          return;
        }
        
        // Check if other devices exist
        const devices = await getDeviceList(res);
          
        if (devices.length > 0) {
          // Other devices exist - ask user if they want to import their data
          Alert.alert(
            t('sync_webdav'),
            `${devices.length} appareil(s) trouvé(s). Voulez-vous importer leurs données ?`,
            [
              {
                text: t('cancel'),
                onPress: () => {
                  setInactivated(false);
                  return;
                },
                style: 'cancel'
              },
              {
                text: t('ok'),
                onPress: async () => {
                  changeWebDavSync(true, { url: webDavUrlState, user: webDavUserState, password: webDavPasswordState });
                  
                  showMessage({
                    message: 'Synchronisation en cours...',
                    type: "default",
                    autoHide: false,
                  });
                  
                  await webDavSync(true); // Force initial sync - wait for completion
                  
                  showMessage({
                    message: 'Téléchargement des images...',
                    type: "default",
                    autoHide: false,
                  });
                  
                  await importAllRemoteImages(res);
                  await fetchSyncInfo();
                  
                  Alert.alert(
                    t('sync_webdav'),
                    'Synchronisation initiale terminée. Les données et images ont été fusionnées.',
                    [
                      {
                        text: t('ok'),
                        onPress: async () => {
                          await reloadAppAsync();
                        }
                      }
                    ],
                    { cancelable: false }
                  );
                }
              }
            ],
            { cancelable: false }
          );
        } else {
          // No other devices - just enable sync
          changeWebDavSync(true, { url: webDavUrlState, user: webDavUserState, password: webDavPasswordState });
          await webDavSync();
          await fetchSyncInfo();
          setInactivated(false);
        }

      } else {
        alert(t('url_error'));
        setInactivated(false);
      }
    } else {
      changeWebDavSync(false, { url: webDavUrlState, user: webDavUserState, password: webDavPasswordState });
    }
  }

  //         #####  ###### ##### #    # #####  #    #
  //         #    # #        #   #    # #    # ##   #
  //         #    # #####    #   #    # #    # # #  #
  //         #####  #        #   #    # #####  #  # #
  //         #   #  #        #   #    # #   #  #   ##
  //         #    # ######   #    ####  #    # #    #
  return (
    <Body >
      {inactivated && <View style={styles.inactivate} />}
      <ScrollView>
        <Text style={appStyles.title}>{t('backup_sync')}</Text>
        <AppButton onPress={() => {
          if (webDavSyncEnabled) {
            alert(t('sync_webdav_deactivate'));
            return;
          }
          Alert.alert(
            t('restore_db'),
            t('restore_db_warning'),
            [
              {
                text: t('cancel'),
                onPress: () => { },
                style: 'cancel'
              },
              {
                text: t('ok'),
                onPress: async () => {
                  await restoreOldDB();
                }
              }
            ],
            { cancelable: false }
          );
        }} icon={"download"} disabled={inactivated} caption={t('restore_db')} />
        <AppButton onPress={shareDatabase} icon={"upload"} disabled={inactivated} caption={t('share_db')} />
        <Separator />
        <Row>
          <Text style={appStyles.title}>{t('sync_webdav')}</Text>
          <Card>
            <Text style={appStyles.text}>Id: {myID}</Text>
          </Card>
        </Row>
        <Row>
          <AppIcon name="sphere" color={colorsTheme.text} />
          <TextInput
            placeholderTextColor={colorsTheme.inactiveText}
            placeholder={t('sync_webdav_url')}
            selectionHandleColor={colorsTheme.inactiveText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            multiline={true}
            numberOfLines={3}
            value={webDavUrlState}
            onChangeText={setWebDavUrl}
            style={[appStyles.editField, { backgroundColor: colorsTheme.tileBG }]}
          />
        </Row>
        <Row>
          <AppIcon name="user" color={colorsTheme.text} />
          <TextInput
            placeholderTextColor={colorsTheme.inactiveText}
            placeholder={t('sync_webdav_user')}
            autoCapitalize="none"
            autoCorrect={false}
            selectionHandleColor={colorsTheme.inactiveText}
            value={webDavUserState}
            onChangeText={setWebDavUser}
            style={[appStyles.editField, { backgroundColor: colorsTheme.tileBG }]}
          />
        </Row>
        <Row>
          <AppIcon name="lock" color={colorsTheme.text} />
          <TextInput
            placeholderTextColor={colorsTheme.inactiveText}
            placeholder={t('sync_webdav_password')}
            selectionHandleColor={colorsTheme.inactiveText}
            autoCapitalize="none"
            autoCorrect={false}
            value={webDavPasswordState}
            onChangeText={setWebDavPassword}
            secureTextEntry={true}
            style={[appStyles.editField, { backgroundColor: colorsTheme.tileBG }]}
          />
        </Row>
        <CheckButton title={t('sync_webdav_activation')} iconName={"loop2"}
          type={'switch'}
          onPress={handleSyncWebDav} isActive={webDavSyncEnabled} />
        {
          webDavSyncEnabled && <>
            <AppButton onPress={async () => {
              setInactivated(true);
              Logger.log("Force sync...", webDavClient);
              if (!webDavClient) {
                alert(t('sync_webdav_error'));
                setInactivated(false);
                return;
              }
              await webDavSync(true);
              await fetchSyncInfo();
              setInactivated(false);
            }} icon={"shuffle"} disabled={inactivated} caption={t('sync_webdav_force')} />
            <Tile>
              <Row>
                <AppIcon name={"info"} color={colorsTheme.text} />
                <Text style={appStyles.text}>{t('sync_webdav_status')}: </Text>
                <AppIcon name={webDavSyncStatus === "wait" ? "loop2" : webDavSyncStatus === "error" ? "blocked" : "tree"} color={webDavSyncStatus === "error" ? colorsTheme.alert : webDavSyncStatus === "wait" ? colorsTheme.warning : colorsTheme.primaryGreen} />
              </Row>
              {
                // pour chacun des devices, afficher son ID, la date de la dernière synchro et un bouton pour le supprimer (sauf si c'est moi)
                syncDevices.map((item) => (
                  <Row key={item.id}>
                    <AppIcon name="mobile" color={item.id === myID ? colorsTheme.primary : colorsTheme.text} />
                    <Card >
                      <Text style={appStyles.textBold}>{item.id}</Text>
                    </Card>
                    <Text style={[appStyles.textItalic, { marginLeft: 8 }]}> {localeDate(new Date(item.lastModified).getTime(), { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        Alert.alert(
                          t('delete'),
                          t('delete_sync_device') + item.id + " ?",
                          [
                            { text: t('cancel'), style: 'cancel' },
                            {
                              text: t('delete'), style: 'destructive', onPress: async () => {
                                try {
                                  await deleteDeviceFiles(webDavClient!, item.id);
                                  await fetchSyncInfo();
                                  
                                  showMessage({
                                    message: "Device deleted successfully",
                                    type: "success",
                                    duration: 3000,
                                  });
                                } catch (error) {
                                  Logger.error("Error deleting remote device:", error);
                                  showMessage({
                                    message: `Error deleting remote device: ${error}`,
                                    type: "danger",
                                    autoHide: true,
                                    duration: 5000
                                  });
                                }
                              }
                            }
                          ]
                        );
                      }}
                      disabled={item.id === myID}
                    >
                      <AppIcon name={item.id === myID ? "blocked" : "bin"} color={item.id === myID ? colorsTheme.inactiveText : colorsTheme.alert} />
                    </TouchableOpacity>
                  </Row>
                ))
              }
            </Tile>
          </>

        }
        <Separator />
        <Text style={appStyles.title}>{t('tools')}</Text>
        <AppButton onPress={async () => {
          setInactivated(true);
          Alert.alert(
            t('clear_all_data'),
            t('clear_all_data_warning'),
            [
              {
                text: t('cancel'),
                onPress: () => {
                  setInactivated(false);
                  return;
                },
                style: 'cancel'
              },
              {
                text: t('ok'),
                onPress: async () => {
                  try {
                    // @ts-ignore
                    Logger.debug("Clearing Store...");
                    await clearStore()
                    Logger.debug("Clearing database...");
                    await clearDatabase(db);
                    Logger.debug("Clearing AsyncStorage...");
                    await AsyncStorage.clear();
                    await reloadAppAsync()
                  } catch (error) {
                    Logger.error("Error clearing db:", error);
                  }
                }
              }
            ],
            { cancelable: false }
          );
        }} icon={"trash"} disabled={inactivated} caption={t('clear_all_data')} />
      </ScrollView>
    </Body>
  );
}

//  ####  ##### #   # #      ######  #### 
// #        #    # #  #      #      #     
//  ####    #     #   #      #####   #### 
//      #   #     #   #      #           #
// #    #   #     #   #      #      #    #
//  ####    #     #   ###### ######  #### 
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