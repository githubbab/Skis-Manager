import translations, { Lang } from "@/constants/Translations";
import { endConcatQueries, execQuery, startConcatQueries } from "@/hooks/DatabaseManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { SQLiteDatabase } from "expo-sqlite";
import { getCurrentSeason, Seasons } from "./dbSeasons";
import { getAllSettings, insertSettings } from "./dbSettings";
import { setWebDavParams } from "./SyncWebDav";


let seasonDate: Date = new Date();
let seasonName: string = "No season defined !";
let viewOuting: boolean = true;
let viewFriends: boolean = true;
let webDavSyncEnabled: boolean = false;
let webDavUrl: string = "";
let webDavUser: string = "";
let webDavPassword: string = "";
let lang: Lang | null = null;

async function translateDB(db: any, lang: Lang) {
  console.debug("Initializing Translation DB", lang);
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

export function getSeasonDate(): Date {
  return seasonDate;
}

export function getSeasonName(): string {
  return seasonName;
}

export function isViewOuting(): boolean {
  return viewOuting;
}

export function isViewFriends(): boolean {
  return viewFriends;
}

export function isWebDavSyncEnabled(): boolean {
  return webDavSyncEnabled;
}

export function getWebDavUrl(): string {
  return webDavUrl;
}

export function getWebDavUser(): string {
  return webDavUser;
}

export function getWebDavPassword(): string {
  return webDavPassword;
}

export function getLang(): Lang {
  return lang || getLocales()[0].languageCode === 'fr' ? 'fr' : 'en';
}


export async function initSettings(db: SQLiteDatabase) {
  const settings = await getAllSettings(db);
  for (const setting of settings) {
    if (setting.name === "seasonDate") {
      seasonDate = new Date(Number(setting.value));
    }
    if (setting.name === "seasonName") {
      seasonName = setting.value;
    }
    if (setting.name === "viewOuting") {
      viewOuting = setting.value === "true" ? true : false;
    }
    if (setting.name === "viewFriends") {
      viewFriends = setting.value === "true" ? true : false;
    }
    if (setting.name === "syncWebDav") {
      webDavSyncEnabled = setting.value === "true" ? true : false;
    }
    if (setting.name === "webDavUrl") {
      webDavUrl = setting.value;
    }
    if (setting.name === "webDavUser") {
      webDavUser = setting.value;
    }
    if (setting.name === "webDavPassword") {
      webDavPassword = setting.value;
    }
    if (setting.name === "language") {
      lang = setting.value as Lang;
    }
  }
  if (!lang) {
    startConcatQueries();
    lang = getLocales()[0].languageCode === 'fr' ? 'fr' : 'en';
    await insertSettings(db, "language", lang);
    await translateDB(db, lang);
    seasonName = translations[lang]['define_season'];
    const oldSeasonDate = await AsyncStorage.getItem("seasonDate");
    if (oldSeasonDate) {
      seasonDate = new Date(Number(oldSeasonDate));
      await insertSettings(db, "seasonDate", oldSeasonDate);
      await AsyncStorage.removeItem("seasonDate");
      await insertSettings(db, "seasonName", await AsyncStorage.getItem("seasonName") || seasonName);
      await AsyncStorage.removeItem("seasonName");
      await insertSettings(db, "viewOuting", (await AsyncStorage.getItem("viewOuting") === "false" ? "false" : "true"));
      await AsyncStorage.removeItem("viewOuting");
      await insertSettings(db, "viewFriends", (await AsyncStorage.getItem("viewFriends") === "false" ? "false" : "true"));
      await AsyncStorage.removeItem("viewFriends");
      await insertSettings(db, "syncWebDav", (await AsyncStorage.getItem("syncWebDav") === "false" ? "false" : "true"));
      await AsyncStorage.removeItem("syncWebDav");
      await insertSettings(db, "webDavUrl", (await AsyncStorage.getItem("webDavUrl") || ""));
      await AsyncStorage.removeItem("webDavUrl");
      await insertSettings(db, "webDavUser", (await AsyncStorage.getItem("webDavUser") || ""));
      await AsyncStorage.removeItem("webDavUser");
      await insertSettings(db, "webDavPassword", (await AsyncStorage.getItem("webDavPassword") || ""));
      await AsyncStorage.removeItem("webDavPassword");
    }
    endConcatQueries();
  }
  setWebDavParams({ enabled: webDavSyncEnabled, url: webDavUrl, user: webDavUser, password: webDavPassword });
  console.debug("Settings initialized: ", seasonDate, seasonName, viewOuting, viewFriends, webDavSyncEnabled, webDavUrl, webDavUser, lang);
}
// Function to initialize the season date from the database

export async function initSeasonDate(db: SQLiteDatabase) {
  const searchSeasonDate: Seasons = await getCurrentSeason(db);
  if (searchSeasonDate.id !== 'not-an-id') {
    seasonDate = new Date(searchSeasonDate.begin);
    seasonName = searchSeasonDate.name;
  }
  console.debug("EnvContext - changeSeasonDate:", searchSeasonDate);
};
export async function changeSeasonDate(date: Date) {
  seasonDate = date;
  console.debug("EnvContext - changeSeasonDate:", seasonDate);
}
// Function to set the season name
export function setSeasonName(name: string) {
  seasonName = name;
}

// Function to toggle the view of outings
export async function toggleViewOuting(db: SQLiteDatabase, view: boolean) {
  await insertSettings(db, "viewOuting", view ? "true" : "false");
  viewOuting = view;
};
// Function to toggle the view of friends
export async function toggleViewFriends(db: SQLiteDatabase, view: boolean) {
  await insertSettings(db, "viewFriends", view ? "true" : "false");
  viewFriends = view;
};
// Function to change the language
export async function changeLang(db: SQLiteDatabase, newLang: Lang) {
  await insertSettings(db, "language", newLang);
  lang = newLang;
  await translateDB(db, newLang);
  console.debug("Language changed to: ", lang);
}
// Function to toggle WebDav sync
export async function toggleSyncWebDav(db: SQLiteDatabase, sync: boolean, url: string, user: string, password: string) {
  console.debug("Toggle WebDav sync to: ", sync, url, user);
  webDavSyncEnabled = sync;
  await insertSettings(db, "syncWebDav", sync.toString());
  if (sync) {
    await insertSettings(db, "webDavUrl", url);
    await insertSettings(db, "webDavUser", user);
    await insertSettings(db, "webDavPassword", password);
    webDavUrl = url;
    webDavUser = user;
    webDavPassword = password;
  }
  setWebDavParams({ enabled: sync, url: url, user: user, password: password });
};
