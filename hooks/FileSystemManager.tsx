
import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";
import { getDeviceID } from "./DatabaseManager";

export const queriesStorePath = Paths.document + "/queries/";
export const imgStorePath = Paths.document + "/images/";
export const icoUnknownBrand = imgStorePath + "brand-init-unknown.png";
let imageStoreUpdated = false;
let queryStoreUpdated = false;

export function getQueriesStoreDir(): Directory {
  return new Directory(queriesStorePath);
}

export function getImgStoreDir(): Directory {
  return new Directory(imgStorePath);
}

const baseImages: { [key: string]: any } = {
  "tos-init-gs.png": require("@/assets/images/tos/init-gs.png"),
  "tos-init-powder.png": require("@/assets/images/tos/init-powder.png"),
  "tos-init-rock.png": require("@/assets/images/tos/init-rock.png"),
  "tos-init-skating.png": require("@/assets/images/tos/init-skating.png"),
  "tos-init-sl.png": require("@/assets/images/tos/init-sl.png"),
  "tos-init-slope.png": require("@/assets/images/tos/init-slope.png"),
  "tos-init-surf.png": require("@/assets/images/tos/init-surf.png"),
  "tos-init-touring.png": require("@/assets/images/tos/init-touring.png"),
  "brand-init-armada.png": require("@/assets/images/brands/init-armada.png"),
  "brand-init-atomic.png": require("@/assets/images/brands/init-atomic.png"),
  "brand-init-black_crows.png": require("@/assets/images/brands/init-black_crows.png"),
  "brand-init-blizzard.png": require("@/assets/images/brands/init-blizzard.png"),
  "brand-init-dynastar.png": require("@/assets/images/brands/init-dynastar.png"),
  "brand-init-elan.png": require("@/assets/images/brands/init-elan.png"),
  "brand-init-faction.png": require("@/assets/images/brands/init-faction.png"),
  "brand-init-fischer.png": require("@/assets/images/brands/init-fischer.png"),
  "brand-init-head.png": require("@/assets/images/brands/init-head.png"),
  "brand-init-k2.png": require("@/assets/images/brands/init-k2.png"),
  "brand-init-lange.png": require("@/assets/images/brands/init-lange.png"),
  "brand-init-movement.png": require("@/assets/images/brands/init-movement.png"),
  "brand-init-nordica.png": require("@/assets/images/brands/init-nordica.png"),
  "brand-init-rossignol.png": require("@/assets/images/brands/init-rossignol.png"),
  "brand-init-salomon.png": require("@/assets/images/brands/init-salomon.png"),
  "brand-init-scott.png": require("@/assets/images/brands/init-scott.png"),
  "brand-init-stockli.png": require("@/assets/images/brands/init-stockli.png"),
  "brand-init-volkl.png": require("@/assets/images/brands/init-volkl.png"),
  "brand-init-zag.png": require("@/assets/images/brands/init-zag.png"),
  "brand-init-unknown.png": require("@/assets/images/brands/init-unknown.png")
};

export function hasStoreUpdated() {
  return imageStoreUpdated || queryStoreUpdated;
}

export function resetStoreUpdated() {
  imageStoreUpdated = false;
  queryStoreUpdated = false;
}

export function hasImageStoreUpdated() {
  return imageStoreUpdated;
}

export function hasQueryStoreUpdated() {
  return queryStoreUpdated;
}

export async function getToSIcoURI(id: string): Promise<string | undefined> {
  const tosIco = new File(imgStorePath + "tos-" + id + ".png");
  if (tosIco.exists) {
    return tosIco.uri;
  }
  return undefined;
}

export async function getBrandIcoURI(id: string): Promise<string> {
  const brandIco = new File(imgStorePath + "brand-" + id + ".png");
  if (brandIco.exists) {
    return brandIco.uri;
  }
  return icoUnknownBrand;
}

export async function getDistinctToSIcoURIs(data: any[]): Promise<string[]> {
  const arrayIcoToSURI: string[] = [];
  const distinctIdTypeOfSkis = Array.from(new Set(data.map((ski: any) => ski.idTypeOfSkis)));
  for (const id of distinctIdTypeOfSkis) {
    const tosIco = await getToSIcoURI(id);
    if (tosIco) {
      arrayIcoToSURI[id] = tosIco;
    }
  }
  return arrayIcoToSURI;
}

export async function getDistinctBrandIcoURIs(data: any[]): Promise<string[]> {
  const arrayIcoBrandURI: string[] = [];
  const distinctIdBrands = Array.from(new Set(data.map((ski: any) => ski.idBrand)));
  for (const id of distinctIdBrands) {
    arrayIcoBrandURI[id] = await getBrandIcoURI(id);
  }
  return arrayIcoBrandURI;
}

async function copyBaseFiles() {
  for (const base of Object.keys(baseImages)) {
    try {
      const destFile = new File(imgStorePath + base);
      if (destFile.exists) {
        continue;
      }
      const baseImage = new File((Asset.fromModule(baseImages[base])).uri);
      baseImage.copy(destFile);
      if (destFile.exists) {
        console.log("Copied Base Asset", base);
      }
    } catch (error) {
      console.error("Error copying Base Asset", error);
      alert("Error copying Base Asset" + error + base);
    }
  }
}

export async function initFS() {
  console.debug("Initializing FileSystemManager", imgStorePath, queriesStorePath);
  const queriesStoreDir = getQueriesStoreDir();
  const imgStoreDir = getImgStoreDir();
  if (!queriesStoreDir.exists) {
    await queriesStoreDir.create();
    console.debug("Create dataStore", queriesStoreDir.uri);
  } else {
    console.debug("Find dataStore", queriesStoreDir.uri);
  }
  if (!imgStoreDir.exists) {
    await imgStoreDir.create();
    console.debug("Create imgStore", imgStoreDir.uri);
  } else {
    console.debug("Find imgStore", imgStoreDir.uri);
  }
  try {
    await copyBaseFiles();
  } catch (error) {
    const message = "Error copying base files: " + error;
    console.error(message);
    alert(message);
  }
}

export function writeQuery(filename: string, query: string) {
  const queryFile = new File(queriesStorePath + filename);
  queryFile.write(query);
  queryStoreUpdated = true;
}



export function copyBrandIco(idBrand: string, fromUri: string) {
  const brandIco = new File(imgStorePath + "brand-" + idBrand + ".png");
  if (brandIco.exists) {
    brandIco.delete();
    console.debug("Deleted existing brand ico", brandIco.uri);
  }
  const fromFile = new File(fromUri);
  if (!fromFile.exists) {
    console.error("Source brand ico does not exist", fromUri);
    alert("Source brand ico does not exist: " + fromUri);
    return;
  }
  try {
    fromFile.copy(brandIco);
    if (brandIco.exists) {
      imageStoreUpdated = true;
      console.debug("Copied brand ico", fromUri, "to", brandIco.uri);
    }
    else {
      console.error("Error copying brand ico");
      alert("Error copying brand ico");
    }
  } catch (error) {
    console.error("Error copying brand ico", error);
    alert("Error copying brand ico: " + error);
  }

}

export function copyToSIco(idTypeOfSkis: string, fromUri: string) {
  const tosIco = new File(imgStorePath + "tos-" + idTypeOfSkis + ".png");
  if (tosIco.exists) {
    tosIco.delete();
    console.debug("Deleted existing ToS ico", tosIco.uri);
  }
  const fromFile = new File(fromUri);
  if (!fromFile.exists) {
    console.error("Source ToS ico does not exist", fromUri);
    alert("Source ToS ico does not exist: " + fromUri);
    return;
  }

  try {
    fromFile.copy(tosIco);
    if (tosIco.exists) {
      imageStoreUpdated = true;
      console.debug("Copied ToS ico", fromUri, "to", tosIco.uri);
    }
    else {
      console.error("Error copying ToS ico");
      alert("Error copying ToS ico");
    }
  } catch (error) {
    console.error("Error copying ToS ico", error);
    alert("Error copying ToS ico: " + error);
  }
}

export async function clearStore() {
  await clearQueriesStore();
  await clearImageStore();
}

export async function clearImageStore() {
  const imageFileList = getImgStoreDir().list();
  for (const item of imageFileList) {
    if (item instanceof File) {
      if (item.name.startsWith("brand-init") || item.name.startsWith("tos-init")) {
        continue;
      }
      console.debug("Delete imgStore", item.uri);
      item.delete();
    }
  }
  await copyBaseFiles();
}

export function clearQueriesStore(who: string = "all") {
  const queryFileList = getQueriesStoreDir().list();
  for (const item of queryFileList) {
    if (item instanceof File) {
      if (who === "mine" && !item.name.includes(getDeviceID())) {
        continue;
      }
      if (who !== "all" && !item.name.includes(who)) {
        continue;
      }
      console.debug("Delete queriesStore", item.name);
      item.delete();
    }
  }
}