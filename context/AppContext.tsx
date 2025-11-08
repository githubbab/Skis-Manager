import translations, { Lang, TranslationKey } from "@/constants/Translations";
import {  execQuery, getDeviceID } from "@/hooks/DataManager";
import { getCurrentSeason } from "@/hooks/dbSeasons";
import { getAllSettings, insertSettings, Settings } from "@/hooks/dbSettings";
import { createWebDavClient } from "@/hooks/SyncWebDav";
import { syncByState, SyncStatus } from "@/hooks/syncByState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, ReactNode, useEffect, useState } from "react";
import { WebDAVClient } from "webdav";
import { getLocales } from "expo-localization";
import { Logger } from "@/hooks/ToolsBox";


// #######                    
//    #    #   # #####  ######
//    #     # #  #    # #     
//    #      #   #    # ##### 
//    #      #   #####  #     
//    #      #   #      #     
//    #      #   #      ######

type WebDavSyncStatus = "disabled" | "wait" | "syncing" | "synced" | "error";
type WebDavParams = {
  url: string;
  user: string;
  password: string;
}


interface AppContextType {
  lang: Lang;
  changeLang: (lang: Lang) => void;
  seasonDate: Date;
  seasonName: string;
  changeSeason: (date: Date, name: string) => void;
  viewOuting: boolean;
  toggleViewOuting: (view: boolean) => void;
  viewFriends: boolean;
  toggleViewFriends: (view: boolean) => void;
  //Database
  deviceID: string;
  lastDBWrite: number;
  setLastDBWrite: (timestamp: number) => void;
  //Webdav
  webDavSyncEnabled: boolean;
  webDavSyncParams: WebDavParams;
  webDavClient: WebDAVClient | null;
  changeWebDavSync: (sync: boolean, params?: WebDavParams) => Promise<void>;
  webDavSyncStatus: WebDavSyncStatus;
  webDavSyncError: string;
  changeWebDavSyncStatus: (status: WebDavSyncStatus, error?: string) => void;
  lastWebDavSync: number;
  webDavSync: (force?: boolean) => Promise<void>;
  // Localization
  t: (key: TranslationKey) => string;
  localeDate: (date: number, options?: Intl.DateTimeFormatOptions) => string;
}

//                                           ######  ######  #                                                       
//  ####  #    #   ##   #    #  ####  ###### #     # #     # #         ##   #    #  ####  #    #   ##    ####  ######
// #    # #    #  #  #  ##   # #    # #      #     # #     # #        #  #  ##   # #    # #    #  #  #  #    # #     
// #      ###### #    # # #  # #      #####  #     # ######  #       #    # # #  # #      #    # #    # #      ##### 
// #      #    # ###### #  # # #  ### #      #     # #     # #       ###### #  # # #  ### #    # ###### #  ### #     
// #    # #    # #    # #   ## #    # #      #     # #     # #       #    # #   ## #    # #    # #    # #    # #     
//  ####  #    # #    # #    #  ####  ###### ######  ######  ####### #    # #    #  ####   ####  #    #  ####  ######

async function changeDBLanguage(db: any, lang: Lang) {
  await insertSettings(db, "language", lang);
  
  // Update settings with prepared statement
  await db.runAsync(
    'UPDATE settings SET value = ? WHERE name = ?',
    [translations[lang]['define_season'], 'seasonName']
  );
  
  // Update typeOfOutings with prepared statements
  const tooUpdates = [
    [translations[lang]['slope'], 'init-slope'],
    [translations[lang]['offpiste'], 'init-offpiste'],
    [translations[lang]['touring'], 'init-touring'],
    [translations[lang]['race'], 'init-race'],
    [translations[lang]['training'], 'init-training'],
    [translations[lang]['gs_training'], 'init-training-gs'],
    [translations[lang]['sl_training'], 'init-training-sl'],
    [translations[lang]['sg_training'], 'init-training-sg'],
    [translations[lang]['gs_race'], 'init-race-gs'],
    [translations[lang]['sl_race'], 'init-race-sl'],
    [translations[lang]['sg_race'], 'init-race-sg'],
  ];
  
  for (const [name, id] of tooUpdates) {
    await db.runAsync('UPDATE typeOfOutings SET name = ? WHERE id = ?', [name, id]);
  }
  
  // Update typeOfSkis with prepared statements
  const tosUpdates = [
    [translations[lang]['slope'], 'init-slope'],
    [translations[lang]['powder'], 'init-powder'],
    [translations[lang]['touring'], 'init-touring'],
    [translations[lang]['sl'], 'init-sl'],
    [translations[lang]['gs'], 'init-gs'],
    [translations[lang]['sg'], 'init-sg'],
    [translations[lang]['surf'], 'init-surf'],
    [translations[lang]['skating'], 'init-skating'],
    [translations[lang]['rock'], 'init-rock'],
  ];
  
  for (const [name, id] of tosUpdates) {
    await db.runAsync('UPDATE typeOfSkis SET name = ? WHERE id = ?', [name, id]);
  }
  
  Logger.debug("Database language changed to:", lang);
}

//    #                   #####                                         
//   # #   #####  #####  #     #  ####  #    # ##### ###### #    # #####
//  #   #  #    # #    # #       #    # ##   #   #   #       #  #    #  
// #     # #    # #    # #       #    # # #  #   #   #####    ##     #  
// ####### #####  #####  #       #    # #  # #   #   #        ##     #  
// #     # #      #      #     # #    # #   ##   #   #       #  #    #  
// #     # #      #       #####   ####  #    #   #   ###### #    #   #  

const AppContext = createContext<AppContextType>({
  lang: 'en',
  changeLang: () => { },
  seasonDate: new Date(),
  seasonName: 'not-defined',
  changeSeason: () => { },
  viewOuting: true,
  toggleViewOuting: () => { },
  viewFriends: true,
  toggleViewFriends: () => { },
  //Database
  deviceID: "not-an-id",
  lastDBWrite: 0,
  setLastDBWrite: () => { },
  //Webdav
  webDavSyncEnabled: false,
  webDavSyncParams: { url: "", user: "", password: "" },
  webDavClient: null,
  changeWebDavSync: async () => {},
  webDavSyncStatus: "disabled",
  webDavSyncError: "",
  changeWebDavSyncStatus: () => { },
  lastWebDavSync: 0,
  webDavSync: async () => { },
  // Localization
  t: () => { return ""; },
  localeDate: () => { return ""; },
});

//    #                   #####                                          ######                                             
//   # #   #####  #####  #     #  ####  #    # ##### ###### #    # ##### #     # #####   ####  #    # # #####  ###### ##### 
//  #   #  #    # #    # #       #    # ##   #   #   #       #  #    #   #     # #    # #    # #    # # #    # #      #    #
// #     # #    # #    # #       #    # # #  #   #   #####    ##     #   ######  #    # #    # #    # # #    # #####  #    #
// ####### #####  #####  #       #    # #  # #   #   #        ##     #   #       #####  #    # #    # # #    # #      ##### 
// #     # #      #      #     # #    # #   ##   #   #       #  #    #   #       #   #  #    #  #  #  # #    # #      #   # 
// #     # #      #       #####   ####  #    #   #   ###### #    #   #   #       #    #  ####    ##   # #####  ###### #    #


// AppContextProvider component to wrap the app and provide the context
// It initializes the context state and provides functions to update it
export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  // Get database from SQLiteContext
  const myId = getDeviceID();
  const db = useSQLiteContext();
  if (!db) {
    throw new Error("Database not initialized");
  }

  const [lang, setLang] = useState<Lang>(getLocales()[0].languageCode === 'fr' ? 'fr' : 'en');
  const [seasonDate, setSeasonDate] = useState<Date>(new Date());
  const [seasonName, setSeasonName] = useState<string>('not-defined');
  const [viewOuting, setViewOuting] = useState<boolean>(true);
  const [viewFriends, setViewFriends] = useState<boolean>(true);
  //Database
  const [deviceID] = useState<string>(myId);
  const [lastDBWrite, setLastDBWrite] = useState<number>(0);
  //Webdav
  const [webDavSyncEnabled, setWebDavSyncEnabled] = useState<boolean>(false);
  const [webDavSyncParams, setWebDavSyncParams] = useState<WebDavParams>({ url: "", user: "", password: "" });
  const [webDavSyncStatus, setWebDavSyncStatus] = useState<WebDavSyncStatus>("disabled");
  const [webDavSyncError, setWebDavSyncError] = useState<string>("");
  const [lastWebDavSync, setLastWebDavSync] = useState<number>(0);
  const [webDavClient, setWebDavClient] = useState<WebDAVClient | null>(null);


  //     #     #               #######                                         
  //     #     #  ####  ###### #       ###### ###### ######  ####  #####  #### 
  //     #     # #      #      #       #      #      #      #    #   #   #     
  //     #     #  ####  #####  #####   #####  #####  #####  #        #    #### 
  //     #     #      # #      #       #      #      #      #        #        #
  //     #     # #    # #      #       #      #      #      #    #   #   #    #
  //      #####   ####  ###### ####### #      #      ######  ####    #    #### 

  useEffect(() => {
    initAppContext();
  }, []);

  //                                               #                           
  //      ####  #    #   ##   #    #  ####  ###### #         ##   #    #  #### 
  //     #    # #    #  #  #  ##   # #    # #      #        #  #  ##   # #    #
  //     #      ###### #    # # #  # #      #####  #       #    # # #  # #     
  //     #      #    # ###### #  # # #  ### #      #       ###### #  # # #  ###
  //     #    # #    # #    # #   ## #    # #      #       #    # #   ## #    #
  //      ####  #    # #    # #    #  ####  ###### ####### #    # #    #  #### 
  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    changeDBLanguage(db, newLang);
  }

  //                                                #####                                    
  //      ####  #    #   ##   #    #  ####  ###### #     # ######   ##    ####   ####  #    #
  //     #    # #    #  #  #  ##   # #    # #      #       #       #  #  #      #    # ##   #
  //     #      ###### #    # # #  # #      #####   #####  #####  #    #  ####  #    # # #  #
  //     #      #    # ###### #  # # #  ### #            # #      ######      # #    # #  # #
  //     #    # #    # #    # #   ## #    # #      #     # #      #    # #    # #    # #   ##
  //      ####  #    # #    # #    #  ####  ######  #####  ###### #    #  ####   ####  #    #
  const changeSeason = (date: Date, name: string) => {
    setSeasonDate(date);
    setSeasonName(name);
  }

  //                                              #     #                 #######                             
  //     #####  ####   ####   ####  #      ###### #     # # ###### #    # #     # #    # ##### # #    #  #### 
  //       #   #    # #    # #    # #      #      #     # # #      #    # #     # #    #   #   # ##   # #    #
  //       #   #    # #      #      #      #####  #     # # #####  #    # #     # #    #   #   # # #  # #     
  //       #   #    # #  ### #  ### #      #       #   #  # #      # ## # #     # #    #   #   # #  # # #  ###
  //       #   #    # #    # #    # #      #        # #   # #      ##  ## #     # #    #   #   # #   ## #    #
  //       #    ####   ####   ####  ###### ######    #    # ###### #    # #######  ####    #   # #    #  #### 
  const toggleViewOuting = (view: boolean) => {
    setViewOuting(view);
    insertSettings(db, "viewOuting", view.toString());
  }

  //                                              #     #                 #######                                     
  //     #####  ####   ####   ####  #      ###### #     # # ###### #    # #       #####  # ###### #    # #####   #### 
  //       #   #    # #    # #    # #      #      #     # # #      #    # #       #    # # #      ##   # #    # #     
  //       #   #    # #      #      #      #####  #     # # #####  #    # #####   #    # # #####  # #  # #    #  #### 
  //       #   #    # #  ### #  ### #      #       #   #  # #      # ## # #       #####  # #      #  # # #    #      #
  //       #   #    # #    # #    # #      #        # #   # #      ##  ## #       #   #  # #      #   ## #    # #    #
  //       #    ####   ####   ####  ###### ######    #    # ###### #    # #       #    # # ###### #    # #####   #### 
  const toggleViewFriends = (view: boolean) => {
    setViewFriends(view);
    insertSettings(db, "viewFriends", view.toString());
  }

  //     #####
  //       #  
  //       #  
  //       #  
  //       #  
  //       #  
  const t = (key: TranslationKey): string => {
    return translations[lang][key] || key;
  }
  //                                               ######                     
  //     #       ####   ####    ##   #      ###### #     #   ##   ##### ######
  //     #      #    # #    #  #  #  #      #      #     #  #  #    #   #     
  //     #      #    # #      #    # #      #####  #     # #    #   #   ##### 
  //     #      #    # #      ###### #      #      #     # ######   #   #     
  //     #      #    # #    # #    # #      #      #     # #    #   #   #     
  //     ######  ####   ####  #    # ###### ###### ######  #    #   #   ######
  const localeDate = (date: number, options?: Intl.DateTimeFormatOptions): string => {
    return new Date(date).toLocaleDateString(lang, options);
  }

  //                                               #     #               ######                 #####                       #####                                  
  //      ####  #    #   ##   #    #  ####  ###### #  #  # ###### #####  #     #   ##   #    # #     # #   # #    #  ####  #     # #####   ##   ##### #    #  #### 
  //     #    # #    #  #  #  ##   # #    # #      #  #  # #      #    # #     #  #  #  #    # #        # #  ##   # #    # #         #    #  #    #   #    # #     
  //     #      ###### #    # # #  # #      #####  #  #  # #####  #####  #     # #    # #    #  #####    #   # #  # #       #####    #   #    #   #   #    #  #### 
  //     #      #    # ###### #  # # #  ### #      #  #  # #      #    # #     # ###### #    #       #   #   #  # # #            #   #   ######   #   #    #      #
  //     #    # #    # #    # #   ## #    # #      #  #  # #      #    # #     # #    #  #  #  #     #   #   #   ## #    # #     #   #   #    #   #   #    # #    #
  //      ####  #    # #    # #    #  ####  ######  ## ##  ###### #####  ######  #    #   ##    #####    #   #    #  ####   #####    #   #    #   #    ####   #### 
  const changeWebDavSyncStatus = (status: WebDavSyncStatus, error?: string) => {
    Logger.debug("Changing WebDav sync status:", status, error);
    setWebDavSyncStatus(status);
    setWebDavSyncError("");
    if (status === "synced") {
      setLastWebDavSync(new Date().getTime());
    } else if (status === "error" && error) {
      setWebDavSyncError(error);
    }
  }

  //                                               #     #               ######                 #####                     
  //      ####  #    #   ##   #    #  ####  ###### #  #  # ###### #####  #     #   ##   #    # #     # #   # #    #  #### 
  //     #    # #    #  #  #  ##   # #    # #      #  #  # #      #    # #     #  #  #  #    # #        # #  ##   # #    #
  //     #      ###### #    # # #  # #      #####  #  #  # #####  #####  #     # #    # #    #  #####    #   # #  # #     
  //     #      #    # ###### #  # # #  ### #      #  #  # #      #    # #     # ###### #    #       #   #   #  # # #     
  //     #    # #    # #    # #   ## #    # #      #  #  # #      #    # #     # #    #  #  #  #     #   #   #   ## #    #
  //      ####  #    # #    # #    #  ####  ######  ## ##  ###### #####  ######  #    #   ##    #####    #   #    #  #### 
  const changeWebDavSync = async (sync: boolean, params?: WebDavParams): Promise<void> => {
    Logger.debug("Changing WebDav sync settings:", sync, params);
    
    try {
      // Désactivation de la sync
      if (!sync) {
        changeWebDavSyncStatus("disabled");
        setWebDavSyncEnabled(false);
        await AsyncStorage.setItem("webDavSyncEnabled", "false");
        Logger.info("WebDav sync disabled");
        return;
      }
      
      // Activation de la sync - validation des paramètres
      if (!params || !params.url || !params.user || !params.password) {
        const missingFields = [];
        if (!params?.url) missingFields.push("URL");
        if (!params?.user) missingFields.push(t("sync_webdav_user"));
        if (!params?.password) missingFields.push(t("sync_webdav_password"));
        
        const errorMsg = `${t("sync_webdav_error")}: ${missingFields.join(", ")}`;
        changeWebDavSyncStatus("error", errorMsg);
        setWebDavSyncEnabled(false);
        await AsyncStorage.setItem("webDavSyncEnabled", "false");
        Logger.error("WebDav sync activation failed - missing parameters:", missingFields);
        return;
      }
      
      // Validation du format de l'URL
      if (!params.url.startsWith("http://") && !params.url.startsWith("https://")) {
        const errorMsg = t("url_error");
        changeWebDavSyncStatus("error", errorMsg);
        setWebDavSyncEnabled(false);
        await AsyncStorage.setItem("webDavSyncEnabled", "false");
        Logger.error("WebDav sync activation failed - invalid URL format:", params.url);
        return;
      }
      
      // Sauvegarde des paramètres
      setWebDavSyncParams(params);
      await AsyncStorage.setItem("webDavUrl", params.url);
      await AsyncStorage.setItem("webDavUser", params.user);
      await AsyncStorage.setItem("webDavPassword", params.password);
      
      // Activation de la sync
      changeWebDavSyncStatus("wait");
      setWebDavSyncEnabled(true);
      await AsyncStorage.setItem("webDavSyncEnabled", "true");
      
      Logger.info("WebDav sync enabled, initializing client...");
      await initWebDavClientAndSync(params.url, params.user, params.password);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Logger.error("Error in changeWebDavSync:", errorMsg);
      changeWebDavSyncStatus("error", errorMsg);
      setWebDavSyncEnabled(false);
      try {
        await AsyncStorage.setItem("webDavSyncEnabled", "false");
      } catch (storageError) {
        Logger.error("Failed to update AsyncStorage after error:", storageError);
      }
    }
  }

  //                          ######                 #####                     
  //     #    # ###### #####  #     #   ##   #    # #     # #   # #    #  #### 
  //     #    # #      #    # #     #  #  #  #    # #        # #  ##   # #    #
  //     #    # #####  #####  #     # #    # #    #  #####    #   # #  # #     
  //     # ## # #      #    # #     # ###### #    #       #   #   #  # # #     
  //     ##  ## #      #    # #     # #    #  #  #  #     #   #   #   ## #    #
  //     #    # ###### #####  ######  #    #   ##    #####    #   #    #  #### 
  const webDavSync = async (force: boolean = false) => {
    if (!webDavSyncEnabled || !webDavClient) {
      Logger.debug("WebDav sync disabled or client not available");
      return;
    }
    
    if (webDavSyncStatus === "syncing") {
      Logger.debug("WebDav sync already in progress, skipping");
      return;
    }
    
    const delta = new Date().getTime() - lastWebDavSync;
    if (!force && delta < 10 * 1000) {
      Logger.debug("WebDav sync done less than 10 seconds ago, skipping:", delta);
      return;
    }
    
    // Start sync in background - don't await
    Logger.info("Starting background sync");
    changeWebDavSyncStatus("syncing");
    
    // Execute sync asynchronously without blocking
    syncByState(
      db,
      webDavClient,
      myId,
      (status: SyncStatus, message?: string) => {
        changeWebDavSyncStatus(status as WebDavSyncStatus, message);
      }
    ).then((success) => {
      if (!success) {
        Logger.error("Background sync failed");
      } else {
        Logger.info("Background sync completed successfully");
      }
    }).catch((error) => {
      Logger.error("Background sync error:", error);
      changeWebDavSyncStatus("error", error instanceof Error ? error.message : String(error));
    });
  }

  //                      #     #               ######                 #####                                  #                   #####                     
  //     # #    # # ##### #  #  # ###### #####  #     #   ##   #    # #     # #      # ###### #    # #####   # #   #    # #####  #     # #   # #    #  #### 
  //     # ##   # #   #   #  #  # #      #    # #     #  #  #  #    # #       #      # #      ##   #   #    #   #  ##   # #    # #        # #  ##   # #    #
  //     # # #  # #   #   #  #  # #####  #####  #     # #    # #    # #       #      # #####  # #  #   #   #     # # #  # #    #  #####    #   # #  # #     
  //     # #  # # #   #   #  #  # #      #    # #     # ###### #    # #       #      # #      #  # #   #   ####### #  # # #    #       #   #   #  # # #     
  //     # #   ## #   #   #  #  # #      #    # #     # #    #  #  #  #     # #      # #      #   ##   #   #     # #   ## #    # #     #   #   #   ## #    #
  //     # #    # #   #    ## ##  ###### #####  ######  #    #   ##    #####  ###### # ###### #    #   #   #     # #    # #####   #####    #   #    #  #### 
  const initWebDavClientAndSync = async (webDavUrl: string, webDavUser: string, webDavPassword: string) => {
    Logger.debug("initWebDavClientAndSync: WebDav sync is enabled, creating client...");
    const res = await createWebDavClient({ url: webDavUrl, user: webDavUser, password: webDavPassword });
    if (typeof res === "string") {
      Logger.debug("initWebDavClientAndSync: Error creating WebDav client: ", res);
      changeWebDavSyncStatus("error", res);
      return;
    } else {
      Logger.debug("initWebDavClientAndSync: WebDav client created successfully");
      setWebDavClient(res);
      changeWebDavSyncStatus("syncing");
      
      // Use state-based sync
      Logger.info("Initial sync using state-based sync");
      const success = await syncByState(
        db,
        res,
        myId,
        (status: SyncStatus, message?: string) => {
          changeWebDavSyncStatus(status as WebDavSyncStatus, message);
        }
      );
      
      if (!success) {
        Logger.error("initWebDavClientAndSync: State-based sync failed");
      }
    }
  }

  //                         #                   #####                                         
  //     # #    # # #####   # #   #####  #####  #     #  ####  #    # ##### ###### #    # #####
  //     # ##   # #   #    #   #  #    # #    # #       #    # ##   #   #   #       #  #    #  
  //     # # #  # #   #   #     # #    # #    # #       #    # # #  #   #   #####    ##     #  
  //     # #  # # #   #   ####### #####  #####  #       #    # #  # #   #   #        ##     #  
  //     # #   ## #   #   #     # #      #      #     # #    # #   ##   #   #       #  #    #  
  //     # #    # #   #   #     # #      #       #####   ####  #    #   #   ###### #    #   #  
  const initAppContext = async () => {
    Logger.debug("Initializing AppContext");
    const settings: Settings[] = await getAllSettings(db);
    let needTranslation = true;
    let needTranslationForce = false;
    let syncEnabled = false;
    let webDavUrl = "";
    let webDavUser = "";
    let webDavPassword = "";
    for (const setting of settings) {
      switch (setting.name) {
        case "language":
          Logger.debug("Found language setting:", setting.value);
          setLang((setting.value === 'fr' ? 'fr' : 'en'));
          needTranslation = false;
          break;
        case "viewOuting":
          Logger.debug("Found viewOuting setting:", setting.value);
          setViewOuting(setting.value === "true");
          break;
        case "viewFriends":
          Logger.debug("Found viewFriends setting:", setting.value);
          setViewFriends(setting.value === "true");
          break;
        case "needTranslation":
          Logger.debug("Found needTranslation setting:", setting.value);
          needTranslationForce = setting.value === "true";
          await db.execAsync(`DELETE FROM settings WHERE name='needTranslation';`);
          break;
        default:
          break;
      }
    }
    const storedSyncEnabled = await AsyncStorage.getItem("webDavSyncEnabled");
    if (storedSyncEnabled && storedSyncEnabled === "true") {
      syncEnabled = true;
    }
    webDavUrl = await AsyncStorage.getItem("webDavUrl") || "";
    webDavUser = await AsyncStorage.getItem("webDavUser") || "";
    webDavPassword = await AsyncStorage.getItem("webDavPassword") || "";
    Logger.debug("Using WebDav settings:", syncEnabled ? "enabled" : "disabled", webDavUrl, webDavUser, webDavPassword ? "****" : "(no password)");
    setWebDavSyncEnabled(syncEnabled);
    setWebDavSyncParams({ url: webDavUrl, user: webDavUser, password: webDavPassword });
    if ((needTranslation && lang !== 'en') || needTranslationForce) {
      changeDBLanguage(db, lang);
    }
    const actualSeason = await getCurrentSeason(db);
    Logger.debug("Current season from DB:", actualSeason);
    setSeasonDate(new Date(actualSeason.begin));
    if (actualSeason.name === '' && actualSeason.begin === 0) {
      actualSeason.name = translations[lang]['define_season'];
    }
    setSeasonName(actualSeason.name);
    Logger.debug("AppContext initialized");
    if (syncEnabled && webDavUrl && webDavUser && webDavPassword) {
      await initWebDavClientAndSync(webDavUrl, webDavUser, webDavPassword);
    }
  }


  //     #####  ###### ##### #    # #####  #    #
  //     #    # #        #   #    # #    # ##   #
  //     #    # #####    #   #    # #    # # #  #
  //     #####  #        #   #    # #####  #  # #
  //     #   #  #        #   #    # #   #  #   ##
  //     #    # ######   #    ####  #    # #    #
  return (
    <AppContext.Provider
      value={{
        lang,
        changeLang,
        seasonDate,
        seasonName,
        changeSeason,
        viewOuting,
        toggleViewOuting,
        viewFriends,
        toggleViewFriends,
        //Database
        deviceID,
        lastDBWrite,
        setLastDBWrite,
        //Webdav
        webDavSyncEnabled,
        webDavSyncParams,
        webDavClient,
        changeWebDavSync,
        webDavSyncStatus,
        webDavSyncError,
        changeWebDavSyncStatus,
        lastWebDavSync,
        webDavSync,
        // Localization
        t,
        localeDate
      }}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;