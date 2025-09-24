import translations, { Lang, TranslationKey } from "@/constants/Translations";
import { execQuery } from "@/hooks/DatabaseManager";
import { getCurrentSeason } from "@/hooks/dbSeasons";
import { getAllSettings, insertSettings, Settings } from "@/hooks/dbSettings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, useEffect, useState } from "react";

interface SettingsContextType {
  lang: Lang;
  changeLang: (lang: Lang) => void;
  seasonDate: Date;
  seasonName: string;
  changeSeason: (date: Date, name: string) => void;
  viewOuting: boolean;
  toggleViewOuting: (view: boolean) => void;
  viewFriends: boolean;
  toggleViewFriends: (view: boolean) => void;
  webDavSyncEnabled: boolean;
  changeWebDavSync: (sync: boolean, url: string, user: string, password: string, period: number) => void;
  webDavUrl: string;
  webDavUser: string;
  webDavPassword: string;
  webDavSyncPeriod: number;
  t: (key: TranslationKey) => string;
  localeDate: (date: number, options?: Intl.DateTimeFormatOptions) => string;
}

async function changeDBLanguage(db: any, lang: Lang) {
  console.debug("Initializing Translation DB", lang);
  await insertSettings(db, "language", lang);
  await execQuery(db, `
    UPDATE settings SET value='${translations[lang]['define_season']}' WHERE name='seasonName';
    UPDATE typeOfOutings SET name = '${translations[lang]['slope']}' WHERE id='init-slope';
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

const SettingsContext = createContext<SettingsContextType>({
  lang: 'en',
  changeLang: () => { },
  seasonDate: new Date(),
  seasonName: 'not-defined',
  changeSeason: () => { },
  viewOuting: true,
  toggleViewOuting: () => { },
  viewFriends: true,
  toggleViewFriends: () => { },
  webDavSyncEnabled: false,
  changeWebDavSync: () => { },
  webDavUrl: '',
  webDavUser: '',
  webDavPassword: '',
  webDavSyncPeriod: 60,
  t: (key: TranslationKey) => key,
  localeDate: (date: number, options?: Intl.DateTimeFormatOptions) => new Date(date).toLocaleDateString('en', options)
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>(getLocales()[0].languageCode === 'fr' ? 'fr' : 'en');
  const [seasonDate, setSeasonDate] = useState<Date>(new Date());
  const [seasonName, setSeasonName] = useState<string>('not-defined');
  const [viewOuting, setViewOuting] = useState<boolean>(true);
  const [viewFriends, setViewFriends] = useState<boolean>(true);
  const [webDavSyncEnabled, setWebDavSyncEnabled] = useState<boolean>(false);
  const [webDavUrl, setWebDavUrl] = useState<string>('');
  const [webDavUser, setWebDavUser] = useState<string>('');
  const [webDavPassword, setWebDavPassword] = useState<string>('');
  const [webDavSyncPeriod, setWebDavSyncPeriod] = useState<number>(60);

  const db = useSQLiteContext();
  if (!db) {
    throw new Error("Database not initialized");
  }

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    changeDBLanguage(db, newLang);
  }

  const changeSeason = (date: Date, name: string) => {
    setSeasonDate(date);
    setSeasonName(name);
  }

  const toggleViewOuting = (view: boolean) => {
    setViewOuting(view);
    insertSettings(db, "viewOuting", view.toString());
  }

  const toggleViewFriends = (view: boolean) => {
    setViewFriends(view);
    insertSettings(db, "viewFriends", view.toString());
  }

  const changeWebDavSync = (sync: boolean, url: string, user: string, password: string, period: number) => {
    setWebDavSyncEnabled(sync);
    setWebDavUrl(url);
    setWebDavUser(user);
    setWebDavPassword(password);
    setWebDavSyncPeriod(period);
    insertSettings(db, "webDavSyncEnabled", sync.toString());
    insertSettings(db, "webDavUrl", url);
    insertSettings(db, "webDavUser", user);
    insertSettings(db, "webDavPassword", password);
    insertSettings(db, "webDavSyncPeriod", period.toString());
  }

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || key;
  }

  const localeDate = (date: number, options?: Intl.DateTimeFormatOptions): string => {
    return new Date(date).toLocaleDateString(lang, options);
  }

  const settings: SettingsContextType = {
    lang,
    changeLang,
    seasonDate,
    seasonName,
    changeSeason,
    viewOuting,
    toggleViewOuting,
    viewFriends,
    toggleViewFriends,
    webDavSyncEnabled,
    changeWebDavSync,
    webDavUrl,
    webDavUser,
    webDavPassword,
    webDavSyncPeriod,
    t,
    localeDate: localeDate
  };

  const initSettings = async () => {
    console.debug("Initializing SettingsContext");
    const settings: Settings[] = await getAllSettings(db);
    let needTranslation = true;
    for (const setting of settings) {
      switch (setting.name) {
        case "language":
          setLang((setting.value === 'fr' ? 'fr' : 'en'));
          needTranslation = false;
          break;
        case "viewOuting":
          setViewOuting(setting.value === "true");
          break;
        case "viewFriends":
          setViewFriends(setting.value === "true");
          break;
        case "webDavSyncEnabled":
          setWebDavSyncEnabled(setting.value === "true");
          break;
        case "webDavUrl":
          setWebDavUrl(setting.value);
          break;
        case "webDavUser":
          setWebDavUser(setting.value);
          break;
        case "webDavPassword":
          setWebDavPassword(setting.value);
          break;
        case "webDavSyncPeriod":
          setWebDavSyncPeriod(Number(setting.value));
          break;
      }
    }
    const oldLang = await AsyncStorage.getItem('language');
    if (oldLang) {
      setLang(oldLang === 'fr' ? 'fr' : 'en');
      needTranslation = false;
      await AsyncStorage.removeItem('language');
      await insertSettings(db, "language", oldLang);
      const oldViewOuting = await AsyncStorage.getItem('viewOuting');
      if (oldViewOuting) {
        setViewOuting(oldViewOuting === 'true');
        await AsyncStorage.removeItem('viewOuting');
        await insertSettings(db, "viewOuting", oldViewOuting);
      }
      const oldViewFriends = await AsyncStorage.getItem('viewFriends');
      if (oldViewFriends) {
        setViewFriends(oldViewFriends === 'true');
        await AsyncStorage.removeItem('viewFriends');
        await insertSettings(db, "viewFriends", oldViewFriends);
      }
      const oldSyncWebDav = await AsyncStorage.getItem('syncWebDav');
      if (oldSyncWebDav) {
        setWebDavSyncEnabled(oldSyncWebDav === 'true');
        await AsyncStorage.removeItem('syncWebDav');
        await insertSettings(db, "syncWebDav", oldSyncWebDav);
      }
      const oldWebDavUrl = await AsyncStorage.getItem('webDavUrl');
      if (oldWebDavUrl) {
        setWebDavUrl(oldWebDavUrl);
        await AsyncStorage.removeItem('webDavUrl');
        await insertSettings(db, "webDavUrl", oldWebDavUrl);
      }
      const oldWebDavUser = await AsyncStorage.getItem('webDavUser');
      if (oldWebDavUser) {
        setWebDavUser(oldWebDavUser);
        await AsyncStorage.removeItem('webDavUser');
        await insertSettings(db, "webDavUser", oldWebDavUser);
      }
      const oldWebDavPassword = await AsyncStorage.getItem('webDavPassword');
      if (oldWebDavPassword) {
        setWebDavPassword(oldWebDavPassword);
        await AsyncStorage.removeItem('webDavPassword');
        await insertSettings(db, "webDavPassword", oldWebDavPassword);
      }
    }
    if (needTranslation && lang !== 'en') {
      changeDBLanguage(db, lang);
    }
    const actualSeason = await getCurrentSeason(db);
    if (actualSeason) {
      setSeasonDate(new Date(actualSeason.begin));
      setSeasonName(actualSeason.name);
    } else {
      setSeasonDate(new Date());
      setSeasonName(translations[lang]['define_season']);
    }
    console.debug("SettingsContext initialized");
  }

  useEffect(() => {
    initSettings();
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;