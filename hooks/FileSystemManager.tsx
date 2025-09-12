
import { Asset } from "expo-asset";
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  writeAsStringAsync
} from "expo-file-system";

const queriesStore: string = documentDirectory + "queries/";
export const imgStore: string = documentDirectory + "images/";
export const icoUnknownBrand = imgStore + "brand-init-unknown.png";
let storeUpdated = false;

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
  return storeUpdated;
}

export function resetStoreUpdated() {
  storeUpdated = false;
}

export async function getToSIcoURI(id: string): Promise<string | undefined> {
  const tosIco = await getInfoAsync(imgStore + "tos-" + id + ".png");
  if (tosIco.exists) {
    return tosIco.uri;
  }
  return undefined;
}

export async function getBrandIcoURI(id: string): Promise<string> {
  const brandIco = await getInfoAsync(imgStore + "brand-" + id + ".png");
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

async function copyBaseFiles(files?: string[]) {
  for (const base of Object.keys(baseImages)) {
    if (files?.includes(base)) {
      continue;
    }
    try {
      const baseImage = (await Asset.fromModule(baseImages[base]).downloadAsync()).localUri;
      if (baseImage) {
        await copyAsync({
          from: baseImage,
          to: imgStore + base
        });
        console.log("Copied Base Asset", base);
      }
    } catch (error) {
      console.error("Error copying Base Asset", error);
      alert("Error copying Base Asset" + error + base);
    }
  }
}

export async function initFS() {
  console.debug("Initializing FileSystemManager");

  let files: string[] = [];
  try {
    await readDirectoryAsync(queriesStore)
    console.debug("Find dataStore", queriesStore);
  }
  catch {
    await makeDirectoryAsync(queriesStore)
    console.debug("Create dataStore", queriesStore);
  }
  try {
    files = await readDirectoryAsync(imgStore);
    console.debug("Find imgStore", imgStore, files);
  } catch {
    await makeDirectoryAsync(imgStore);
    console.debug("Create imgStore", imgStore);
    files = await readDirectoryAsync(imgStore);
  }
  try {
    await copyBaseFiles(files);
  } catch (error) {
    const message = "Error copying base files: " + error;
    console.error(message);
    alert(message);
  }
}

export async function writeQuery(filename: string, query: string) {
  const path = queriesStore + filename;
  await writeAsStringAsync(path, query);
  storeUpdated = true;
}



export async function copyBrandIco(idBrand: string, fromUri: string) {
  const toUri = imgStore + "brand-" + idBrand + ".png";
  try {
    const fileInfo = await getInfoAsync(toUri);
    if (fileInfo.exists) {
      console.debug("Brand ico already exists", toUri);
      return;
    }
    await copyAsync({
      from: fromUri,
      to: toUri
    });
    storeUpdated = true;
    console.debug("Copied brand ico", fromUri, "to", toUri);
  } catch (error) {
    console.error("Error copying brand ico", error);
    alert("Error copying brand ico: " + error);
  }
}

export async function copyToSIco(idTypeOfSkis: string, fromUri: string) {
  const toUri = imgStore + "tos-" + idTypeOfSkis + ".png";
  try {
    const fileInfo = await getInfoAsync(toUri);
    if (fileInfo.exists) {
      console.debug("ToS ico already exists", toUri);
      return;
    }
    await copyAsync({
      from: fromUri,
      to: toUri
    });
    storeUpdated = true;
    console.debug("Copied ToS ico", fromUri, "to", toUri);
  } catch (error) {
    console.error("Error copying ToS ico", error);
    alert("Error copying ToS ico: " + error);
  }
}

export async function clearStore() {
  for (const fileName of await readDirectoryAsync(queriesStore)) {
    console.debug("Delete dataStore", queriesStore + fileName);
    await deleteAsync(queriesStore + fileName)
  }
  for (const fileName of await readDirectoryAsync(imgStore)) {
    if (fileName.startsWith("brand-init") || fileName.startsWith("tos-init")) {
      continue;
    }
    console.debug("Delete imgStore", imgStore + fileName);
    await deleteAsync(imgStore + fileName)
  }
  await copyBaseFiles();
}