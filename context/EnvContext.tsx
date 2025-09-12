import translations, { Lang, TranslationKey } from "@/constants/Translations";
import { execQuery } from "@/hooks/DatabaseManager";
import { getCurrentSeason, Seasons } from "@/hooks/dbSeasons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useEffect, useState } from "react";


interface EnvContextType {
  seasonDate: Date;
  seasonName: string;
  changeSeasonDate: () => void;
  viewOuting: boolean;
  toggleViewOuting: (view: boolean) => void;
  viewFriends: boolean;
  toggleViewFriends: (view: boolean) => void;
  syncWebDav: boolean;
  webDavUrl: string;
  webDavUser: string;
  webDavPassword: string;
  toggleSyncWebDav: (sync: boolean, url: string, user: string, password: string) => void;
  lang: Lang;
  changeLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  listLanguages: () => string[];
  smDate: (value?: any) => number;
}

async function translateDB(db: any, lang: Lang) {
  console.debug("Initializing Translation DB", lang);
  await execQuery(db, `UPDATE typeOfOutings SET name = '${translations[lang]['slope']}' WHERE id='init-slope';
        UPDATE typeOfOutings SET name = '${translations[lang]['offpiste']}' WHERE id='init-offpiste';
        UPDATE typeOfOutings SET name = '${translations[lang]['touring']}' WHERE id='init-touring';
        UPDATE typeOfOutings SET name = '${translations[lang]['race']}' WHERE id='init-race';
        UPDATE typeOfOutings SET name = '${translations[lang]['training']}' WHERE id='init-training';
        UPDATE typeOfSkis SET name = '${translations[lang]['slope']}' WHERE id='init-slope';
        UPDATE typeOfSkis SET name = '${translations[lang]['powder']}' WHERE id='init-powder';
        UPDATE typeOfSkis SET name = '${translations[lang]['touring']}' WHERE id='init-touring';
        UPDATE typeOfSkis SET name = '${translations[lang]['sl']}' WHERE id='init-sl';
        UPDATE typeOfSkis SET name = '${translations[lang]['gs']}' WHERE id='init-gs';
        UPDATE typeOfSkis SET name = '${translations[lang]['surf']}' WHERE id='init-surf';
        UPDATE typeOfSkis SET name = '${translations[lang]['skating']}' WHERE id='init-skating';
        UPDATE typeOfSkis SET name = '${translations[lang]['rock']}' WHERE id='init-rock';`);
}

const EnvContext = createContext<EnvContextType | undefined>(undefined);

export const EnvProvider = ({ children }: { children: React.ReactNode }) => {
  const [seasonDate, setSeasonDate] = useState<Date>(new Date());
  const [viewOuting, setViewOuting] = useState<boolean>(true);
  const [viewFriends, setViewFriends] = useState<boolean>(true);
  const [lang, setLang] = useState<Lang>(getLocales()[0].languageCode === 'fr' ? 'fr' : 'en');
  const t = (key: TranslationKey) => translations[lang][key];
  const [seasonName, setSeasonName] = useState<string>(t('define_season'));
  const [syncWebDav, setSyncWebDav] = useState<boolean>(false);
  const [webDavUrl, setWebDavUrl] = useState<string>("");
  const [webDavUser, setWebDavUser] = useState<string>("");
  const [webDavPassword, setWebDavPassword] = useState<string>("");

  const db = useSQLiteContext();


  useEffect(() => {
    const init = async () => {
      console.debug("Initializing EnvContext");
      // Initialize viewOuting and viewFriends from settings or default to true
      const vOuting = await AsyncStorage.getItem("viewOuting");
      if (vOuting !== null) {
        setViewOuting(vOuting === 'true');
      } else {
        toggleViewOuting(true);
      }
      const vFriends = await AsyncStorage.getItem("viewFriends");
      if (vFriends !== null) {
        setViewFriends(vFriends === 'true');
      } else {
        toggleViewFriends(true);
      }
      // Initialize seasonDate from settings or default to current date
      changeSeasonDate();
      // Initialize language from settings or default to system language
      const searchLang = await AsyncStorage.getItem("language");
      if (searchLang) {
        console.debug("Initial language: ", searchLang);
        setLang(searchLang === 'fr' ? 'fr' : 'en');
      } else {
        changeLang(lang);
      }
      // Initialize WebDav settings from settings or default to empty
      const sync = await AsyncStorage.getItem("syncWebDav");
      if (sync !== null) {
        setSyncWebDav(sync === 'true');
      } else {
        toggleSyncWebDav(false, "", "", "");
      }
      const url = await AsyncStorage.getItem("webDavUrl");
      if (url) setWebDavUrl(url);
      const user = await AsyncStorage.getItem("webDavUser");
      if (user) setWebDavUser(user);
      const password = await AsyncStorage.getItem("webDavPassword");
      if (password) setWebDavPassword(password);
      console.debug("EnvContext initialized");
    };
    init().catch(console.error);
  }, []);

  // Function to change the season date
  const changeSeasonDate = async () => {
    const searchSeasonDate: Seasons = await getCurrentSeason(db);
    console.debug("Found seasonDate in settings: ", searchSeasonDate);
    if (searchSeasonDate.id !== 'not-an-id') {
      setSeasonDate(new Date(searchSeasonDate.begin));
      setSeasonName(searchSeasonDate.name);
    } else {
      setSeasonDate(new Date());
      setSeasonName(t('define_season'));
    }
    console.debug("Change seasonDate: ", seasonDate);
  };
  // Function to toggle the view of outings
  const toggleViewOuting = async (view: boolean) => {
    setViewOuting(view);
    await AsyncStorage.setItem("viewOuting", view.toString());
  };
  // Function to toggle the view of friends
  const toggleViewFriends = async (view: boolean) => {
    setViewFriends(view);
    await AsyncStorage.setItem("viewFriends", view.toString());
  };
  // Function to change the language
  const changeLang = async (newLang: Lang) => {
    setLang(newLang);
    await AsyncStorage.setItem("language", newLang);
    await translateDB(db, newLang);
    console.debug("Language changed to: ", lang);
  };
  // Function to toggle WebDav sync
  const toggleSyncWebDav = async (sync: boolean, url: string, user: string, password: string) => {
    setSyncWebDav(sync);
    await AsyncStorage.setItem("syncWebDav", sync.toString());
    if (sync) {
      setWebDavUrl(url);
      setWebDavUser(user);
      setWebDavPassword(password);
      await AsyncStorage.setItem("webDavUrl", url);
      await AsyncStorage.setItem("webDavUser", user);
      await AsyncStorage.setItem("webDavPassword", password);
    }
  };
  // Function to list available languages
  const listLanguages = () => {
    return Object.keys(translations);
  };
  // Function to convert various date formats to a timestamp
  const smDate = (value?: any): number => {
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
          date = new Date(yyyy, mm, dd).getTime() + (now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
        }
        try {
          date = new Date(value).getTime();
        } catch { }
      }
      if (typeof value === "number") {
        if (value.toString().length === 8) {
          const yyyy: number = Math.floor(value / 10000);
          const mm: number = Math.floor((value - yyyy * 10000) / 100);
          const dd: number = (value - yyyy * 10000 - mm * 100);
          date = new Date(yyyy, mm, dd).getTime() + (now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
        }
      }
    }
    return date;
  };

  return (
    <EnvContext.Provider value={{
      seasonDate,
      seasonName,
      changeSeasonDate,
      viewOuting,
      toggleViewOuting,
      viewFriends,
      toggleViewFriends,
      syncWebDav,
      toggleSyncWebDav,
      webDavUrl,
      webDavUser,
      webDavPassword,
      lang,
      changeLang,
      t,
      listLanguages,
      smDate
    }}>
      {children}
    </EnvContext.Provider>
  );
};

export const useEnvContext = (): EnvContextType => {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error("useEnvContext must be used within an EnvProvider");
  }
  return context;
};
