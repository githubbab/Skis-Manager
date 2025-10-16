import translations, { Lang, TranslationKey } from "@/constants/Translations";
import { endConcatQueries, execQuery, getDeviceID, startConcatQueries } from "@/hooks/DataManager";
import { getCurrentSeason } from "@/hooks/dbSeasons";
import { getAllSettings, insertSettings, Settings } from "@/hooks/dbSettings";
import { createWebDavClient, syncData } from "@/hooks/SyncWebDav";
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
  webDavSyncMulti: boolean;
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
  await execQuery(db, `
    UPDATE settings SET value='${translations[lang]['define_season']}' WHERE name='seasonName';
    UPDATE typeOfOutings SET name = '${translations[lang]['slope']}' WHERE id='init-slope';
    UPDATE typeOfOutings SET name = '${translations[lang]['offpiste']}' WHERE id='init-offpiste';
    UPDATE typeOfOutings SET name = '${translations[lang]['touring']}' WHERE id='init-touring';
    UPDATE typeOfOutings SET name = '${translations[lang]['race']}' WHERE id='init-race';
    UPDATE typeOfOutings SET name = '${translations[lang]['training']}' WHERE id='init-training';
    UPDATE typeOfOutings SET name = '${translations[lang]['gs_training']}' WHERE id='init-training-gs';
    UPDATE typeOfOutings SET name = '${translations[lang]['sl_training']}' WHERE id='init-training-sl';
    UPDATE typeOfOutings SET name = '${translations[lang]['gs_race']}' WHERE id='init-race-gs';
    UPDATE typeOfOutings SET name = '${translations[lang]['sl_race']}' WHERE id='init-race-sl';
    UPDATE typeOfSkis SET name = '${translations[lang]['slope']}' WHERE id='init-slope';
    UPDATE typeOfSkis SET name = '${translations[lang]['powder']}' WHERE id='init-powder';
    UPDATE typeOfSkis SET name = '${translations[lang]['touring']}' WHERE id='init-touring';
    UPDATE typeOfSkis SET name = '${translations[lang]['sl']}' WHERE id='init-sl';
    UPDATE typeOfSkis SET name = '${translations[lang]['gs']}' WHERE id='init-gs';
    UPDATE typeOfSkis SET name = '${translations[lang]['surf']}' WHERE id='init-surf';
    UPDATE typeOfSkis SET name = '${translations[lang]['skating']}' WHERE id='init-skating';
    UPDATE typeOfSkis SET name = '${translations[lang]['rock']}' WHERE id='init-rock';`,
    "changeDBLanguage");
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
  webDavSyncMulti: false,
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
  const [webDavSyncMulti, setWebDavSyncMulti] = useState<boolean>(false);


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
    startConcatQueries();
    if (params) {
      setWebDavSyncParams(params);
      await AsyncStorage.setItem("webDavUrl", params.url);
      await AsyncStorage.setItem("webDavUser", params.user);
      await AsyncStorage.setItem("webDavPassword", params.password);
    }
    if (!sync) {
      changeWebDavSyncStatus("disabled");
      setWebDavSyncEnabled(false);
      await AsyncStorage.setItem("webDavSyncEnabled", "false");
    } else if (params) {
      changeWebDavSyncStatus("wait");
      setWebDavSyncEnabled(true);
      await AsyncStorage.setItem("webDavSyncEnabled", "true");
      await initWebDavClientAndSync(params.url, params.user, params.password);
    }
    else {
      changeWebDavSyncStatus("error", "Missing WebDav parameters");
      setWebDavSyncEnabled(false);
      await AsyncStorage.setItem("webDavSyncEnabled", "false");
    }
    endConcatQueries("webDavSettings");
  }

  //                          ######                 #####                     
  //     #    # ###### #####  #     #   ##   #    # #     # #   # #    #  #### 
  //     #    # #      #    # #     #  #  #  #    # #        # #  ##   # #    #
  //     #    # #####  #####  #     # #    # #    #  #####    #   # #  # #     
  //     # ## # #      #    # #     # ###### #    #       #   #   #  # # #     
  //     ##  ## #      #    # #     # #    #  #  #  #     #   #   #   ## #    #
  //     #    # ###### #####  ######  #    #   ##    #####    #   #    #  #### 
  const webDavSync = async (force: boolean = false) => {
    if (webDavSyncEnabled && webDavClient) {
      if (webDavSyncStatus === "syncing") {
        Logger.debug("WebDav sync already in progress, skipping full sync");
        return;
      }
      const delta = new Date().getTime() - lastWebDavSync;
      if (!force && delta < 10 * 1000) {
        Logger.debug("WebDav sync done less than 10 seconds ago, skipping full sync:", delta);
        return;
      }
      changeWebDavSyncStatus("syncing");
      const { synced, multi, error } = await syncData({ db: db, myID: myId, webDavClient: webDavClient, background: true });
      setWebDavSyncMulti(multi);
      Logger.debug(": Full WebDav sync completed:", synced, error);
      if (synced === "error") {
        Logger.error(": Full WebDav sync error:", error);
        changeWebDavSyncStatus("error", error || "Unknown error");
      }
      else {
        changeWebDavSyncStatus("synced");
      }
    }
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
    }
    else {
      Logger.debug("initWebDavClientAndSync: WebDav client created successfully");
      setWebDavClient(res);
      changeWebDavSyncStatus("syncing");
      const { synced, multi, error } = await syncData({ db: db, myID: myId, webDavClient: res, background: false });
      setWebDavSyncMulti(multi);
      Logger.debug("initWebDavClientAndSync: Initial WebDav sync completed:", synced, error);
      if (synced === "error") {
        Logger.error("initWebDavClientAndSync: WebDav sync error:", error);
        changeWebDavSyncStatus("error", error || "Unknown error");
      }
      else {
        changeWebDavSyncStatus("synced");
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
    if (needTranslation && lang !== 'en') {
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
        webDavSyncMulti,
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