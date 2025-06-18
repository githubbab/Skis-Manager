import {Text, TouchableOpacity, View} from 'react-native';
import AppStyles from "@/constants/AppStyles";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from "expo-file-system";
import {useSQLiteContext} from "expo-sqlite";
import * as DataManager from "@/hooks/DataManager"
import AppIcon from "@/components/AppIcon";
import {
  changeSetting,
  insertMaintain,
  insertOuting,
  insertSki,
  updateTypeOfMaintains,
  updateTypeOfSkis
} from "@/hooks/DataManager";
import {hideMessage, showMessage} from "react-native-flash-message";
import * as Sharing from 'expo-sharing';
import { reloadAppAsync } from "expo";


export default function BackupSyncSettings() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext()

  const restoreOldDB = async () => {

    let itemsBoots: DataManager.ItemBoots[] = [];
    let itemsSkis: DataManager.ItemSkis[] = [];
    let itemsUsers: DataManager.ItemUser[] = [];
    let typeOfMaintain: DataManager.TypeOfMaintain[] = [];
    let typeOfSkis: DataManager.TypeOfSkis[] = [];

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: false,
      });
      if (!result.canceled) {
        const dbURI = result.assets[0].uri;
        console.log(`Database URI: ${dbURI}`);
        if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory+"dbRestore")).exists) {
          await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory+"dbRestore");
        }
        const base64 = await FileSystem.readAsStringAsync(
          dbURI,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        )
        await FileSystem.writeAsStringAsync(FileSystem.documentDirectory+"dbRestore/restore.db", base64,
          {
            encoding: FileSystem.EncodingType.Base64,
          })
      }
      else {
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
      const sqLiteDatabase = await  SQLite.openDatabaseAsync( "restore.db",
        {useNewConnection: true}, FileSystem.documentDirectory+"dbRestore");
      console.log("Database opened !");
      showMessage({
        message: "Check version...",
        type: "default",
        autoHide: false,
      })
      const suivisSkisTables = ["chaussures", "entretien", "saison", "skis", "sortie", "styleEntretien",
        "styleSkis", "utilisateur"];
      const skisManagerTables = ["eventsMaintains", "eventsOutings", "joinSkisBoots", "joinSkisUsers",
        "itemsSkis", "itemsBoots", "itemsUsers", "typeOfSkis", "typeOfMaintains", "itemsFriends", "itemsOffPistes",
        "joinOutingsFriends", "joinOutingsOffPistes", "settings", "typeOfOutings"];
      // @ts-ignore
      const listTables = (await sqLiteDatabase.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'")).map(item => item.name)
      console.log(listTables);
      let dbVersion = 0
      for (const tableName of suivisSkisTables) {
        if (listTables.includes(tableName)) {
          console.log(tableName);
        }
        else {
          dbVersion=-1;
          break;
        }
      }
      if (dbVersion === 0) {
        console.debug("Find suivisSkisDB")
        showMessage({
          message: "Erase database...",
          type: "default",
          autoHide: false,
        })
        for (const table of ["eventsMaintains", "eventsOutings", "joinSkisBoots", "joinSkisUsers", "itemsSkis", "itemsBoots", "itemsUsers" ]) {
          console.debug("DELETE " + table);
          await db.execAsync("DELETE FROM " + table );
        }
        for (const table of [ "typeOfSkis", "typeOfMaintains" ]) {
          console.debug("DELETE " + table);
          await db.execAsync("DELETE FROM " + table + " WHERE  id NOT like 'init-%';");
        }
        await DataManager.delDataStore()
        showMessage({
          message: "Restore database(typeOfSkis)...",
          type: "default",
          autoHide: false,
        })
        const listTypeOfSkis=  await db.getAllAsync("SELECT id, name FROM typeOfSkis");
        const listItemBrand= await db.getAllAsync("SELECT id, name FROM itemsBrands")
        // Type Of Skis
        let ssResult: any = await sqLiteDatabase.getAllAsync("SELECT id, Nom, alerteAffutage, alerteFartage  FROM styleSkis");
        console.debug("styleSkis: ",ssResult.length);
        let smResult: any = listTypeOfSkis;
        console.debug("skisStyles: ",smResult);
        for (const ssRow of ssResult) {
          let name = ssRow.Nom;
          for (const smRow of smResult ) {
            if (smRow.name === ssRow.Nom) {
              await updateTypeOfSkis(db, {id: smRow.id, name: smRow.name,
                sharpNeed: ssRow.alerteAffutage, waxNeed: ssRow.alerteFartage});
              typeOfSkis[ssRow.id] = {id: smRow.id, name: smRow.name,
                sharpNeed: ssRow.alerteAffutage, waxNeed: ssRow.alerteFartage}
            }
          }
          if (! typeOfSkis[ssRow.id]) {
            typeOfSkis[ssRow.id] = await DataManager.insertTypeOfSkis(db,
              {name: name, sharpNeed: ssRow.alerteAffutage, waxNeed: ssRow.alerteFartage});
          }
        }
        // Types Of Maintains
        showMessage({
          message: "Restore database(typeOfMaintains)...",
          type: "default",
          autoHide: false,
        })
        ssResult = await sqLiteDatabase.getAllAsync("SELECT id, Nom, isAffutage, isFartage, isReparation FROM styleEntretien");
        console.debug("styleEntretien: ", ssResult.length);
        smResult = await db.getAllAsync("SELECT id, name FROM typeOfMaintains");
        console.debug("maintains: ", smResult);
        for (const ssRow of ssResult) {
          let name = ssRow.Nom;
          const style: string =
            ((ssRow.isAffutage === 0) ? "" : "S")
            + ((ssRow.isFartage === 0) ? "" : "W")
            + ((ssRow.isReparation === 0) ? "" : "R")
          for (const smRow of smResult ) {
            if (smRow.name === ssRow.Nom) {
              await updateTypeOfMaintains(db, { id: smRow.id, name: smRow.name, swr: style})
              typeOfMaintain[ssRow.id] = { id: smRow.id, name: smRow.name, swr: style}
            }
          }
          if (! typeOfMaintain[ssRow.id]) {
            typeOfMaintain[ssRow.id] = await DataManager.insertTypeOfMaintains(db, { name: name, swr: style});
          }
        }
        // Users
        showMessage({
          message: "Restore database(Usres)...",
          type: "default",
          autoHide: false,
        })
        ssResult = await sqLiteDatabase.getAllAsync("SELECT id, Nom FROM utilisateur");
        console.debug("utilisateur: ", ssResult.length);
        smResult = await db.getAllAsync("SELECT name FROM itemsUsers");
        console.debug("users: ", smResult);
        for (const ssRow of ssResult) {
          let name = ssRow.Nom;
          for (const smRow of smResult ) {
            if (smRow.name === ssRow.Nom) {
              name+="(recup)"
            }
          }
          itemsUsers[ssRow.id] = await DataManager.insertUser(db, { name: name });
          console.debug("users: ", itemsUsers[ssRow.id]);

        }
        // Boots
        showMessage({
          message: "Restore database(Boots)...",
          type: "default",
          autoHide: false,
        })
        ssResult = await sqLiteDatabase.getAllAsync("SELECT id, Nom, debut, fin FROM chaussures");
        console.debug("chaussures: ", ssResult.length);
        smResult = await db.getAllAsync("SELECT id, name FROM itemsBoots");
        console.debug("boots: ", smResult);
        for (const ssRow of ssResult) {
          let name = ssRow.Nom;
          const beginDate = DataManager.smDate(ssRow.debut);
          const endDate = (ssRow.fin === 99999999) ? undefined : DataManager.smDate(ssRow.fin)
          for (const smRow of smResult ) {
            if (smRow.name === ssRow.Nom) {
              name+="(recup)"
            }
          }
          itemsBoots[ssRow.id] = await DataManager.insertBoots(db, { name: name, begin: beginDate, end: endDate});
          console.debug("boots: ", itemsBoots[ssRow.id]);
        }
        // Skis
        showMessage({
          message: "Restore database(Skis)...",
          type: "default",
          autoHide: false,
        })
        ssResult = await sqLiteDatabase.getAllAsync("SELECT id, Nom, idChaussures, idStyleSkis, idUtilisateur, debut, fin FROM skis" );
        console.debug("skis: ", ssResult.length);
        smResult = await db.getAllAsync("SELECT id, name FROM itemsSkis");
        console.debug("skis: ", smResult);
        for (const ssRow of ssResult) {
          let name = ssRow.Nom;
          const beginDate = DataManager.smDate(ssRow.debut);
          const endDate = (ssRow.fin === 99999999) ? undefined : DataManager.smDate(ssRow.fin)
          for (const smRow of smResult ) {
            if (smRow.name === ssRow.Nom) {
              name+="(recup)"
            }
          }
          let idBrand = 'init-unknown'
          for (const brand of listItemBrand as {id: string, name: string}[]) {
            if (ssRow.Nom.toLocaleLowerCase().includes(brand.name.toLocaleLowerCase())) {
              idBrand = brand.id;
            }
          }
          let idTypeOfSkis = typeOfSkis[ssRow.idStyleSkis].id
          if (typeOfSkis[ssRow.idStyleSkis].name === 'Course') {
            if (ssRow.Nom.includes('SL')) {
              idTypeOfSkis = 'init-sl';
            }
            if (ssRow.Nom.includes('GS')) {
              idTypeOfSkis = 'init-gs';
            }
          }
          itemsSkis[ssRow.id] = await insertSki(db, {name: name, idTypeOfSkis: idTypeOfSkis,
            begin: beginDate, end: endDate, listUsers: [itemsUsers[ssRow.idUtilisateur].id], idBrand: idBrand,
            listBoots: [itemsBoots[ssRow.idChaussures].id]  });
          console.debug("skis: ", itemsSkis[ssRow.id]);
        }
        // Outing
        showMessage({
          message: "Restore database(Outings)...",
          type: "default",
          autoHide: false,
        })
        ssResult = await sqLiteDatabase.getAllAsync("SELECT id, date, idChaussures, idSkis, idUtilisateur FROM sortie" );
        console.debug("sortie: ", ssResult.length);
        for (const ssRow of ssResult) {
          const date = DataManager.smDate(ssRow.date);
          console.debug( await insertOuting(db, { date: date, idSkis: itemsSkis[ssRow.idSkis].id,
            idBoots: itemsBoots[ssRow.idChaussures].id, idUser: itemsUsers[ssRow.idUtilisateur].id}));
        }
        // Maintains
        showMessage({
          message: "Restore database(Maintains)...",
          type: "default",
          autoHide: false,
        })
        ssResult = await sqLiteDatabase.getAllAsync("SELECT id, date, idSkis, idStyleEntretien FROM entretien");
        console.debug("entretien: ", ssResult.length);
        for (const ssRow of ssResult) {
          const date = DataManager.smDate(ssRow.date)
          await insertMaintain(db, {date: date, idSkis: itemsSkis[ssRow.idSkis].id,
            idMaintainType: typeOfMaintain[ssRow.idStyleEntretien].id})
        }
        // season
        ssResult = await sqLiteDatabase.getFirstSync("SELECT debut FROM saison ORDER BY debut DESC")
        console.debug("season: ", ssResult.debut);
        await changeSetting(db, {name: 'seasonDate', value: DataManager.smDate(ssResult.debut).toString()});
        hideMessage()
        await sqLiteDatabase.closeAsync()
        await reloadAppAsync()
      }
      else {
        dbVersion = 1
        for (const tableName of skisManagerTables) {
          if (listTables.includes(tableName)) {
            console.log(tableName);
          }
          else {
            dbVersion=-1;
          }
        }
        if (dbVersion === 1) {
          // @ts-ignore
          let { user_version: dbVersion } = await db.getFirstAsync('PRAGMA user_version');
          console.log("Database version " + dbVersion);
          await DataManager.delDataStore()
          await db.closeAsync()
          await FileSystem.moveAsync({from: sqLiteDatabase.databasePath, to: "file://"+db.databasePath});
          await reloadAppAsync()
        }
        else {
          console.debug("Skipping database...");
          showMessage({
            message: "Unknown database !",
            type: "danger",
            autoHide: true,
            duration: 5000
          })
        }
      }
    }
    catch (error) {
      console.log("Error open db:", error);
      return
    }
    await FileSystem.deleteAsync(FileSystem.documentDirectory+"dbRestore/restore.db", { idempotent: true });
  }

  const shareBatabase = async () => {
    console.log("shareBatabase: ", db.databasePath);
    await Sharing.shareAsync("file://"+db.databasePath)
  }

  return (
    <View style={appStyles.container}>
      <View style={appStyles.body}>
        <Text style={appStyles.title}>Sauvegarde/Synchronisation</Text>
        <TouchableOpacity style={[appStyles.button]}
                          onPress={restoreOldDB}>
          <View style={appStyles.buttonBody}>
            <AppIcon name={"download"} color={colorsTheme.text}/>
            <Text style={appStyles.buttonText}>Restaurer une base</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[appStyles.button]}
                          onPress={shareBatabase}>
          <View style={appStyles.buttonBody}>
            <AppIcon name={"upload"} color={colorsTheme.text}/>
            <Text style={appStyles.buttonText}>Récupérer la base actuelle</Text>
          </View>
        </TouchableOpacity>
        <View style={appStyles.separator}/>
      </View>
    </View>
  );
}