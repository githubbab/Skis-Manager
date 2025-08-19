
import { Asset } from "expo-asset";
import {
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  writeAsStringAsync
} from "expo-file-system";

const dataStore: string = documentDirectory+"data/";
const imgStore: string = documentDirectory+"images/";

export const icoTosStore = imgStore + "tos/";
export const icoBrandsStore = imgStore + "brands/";
export const icoUnknownBrand = icoBrandsStore + "init-unknown.png";

const tosImages: { [key: string]: any } = {
  "init-gs.png": require("@/assets/images/tos/init-gs.png"),
  "init-powder.png": require("@/assets/images/tos/init-powder.png"),
  "init-rock.png": require("@/assets/images/tos/init-rock.png"),
  "init-skating.png": require("@/assets/images/tos/init-skating.png"),
  "init-sl.png": require("@/assets/images/tos/init-sl.png"),
  "init-slope.png": require("@/assets/images/tos/init-slope.png"),
  "init-surf.png": require("@/assets/images/tos/init-surf.png"),
  "init-touring.png": require("@/assets/images/tos/init-touring.png"),
};

const brandImages: { [key: string]: any } = {
  "init-armada.png": require("@/assets/images/brands/init-armada.png"),
  "init-atomic.png": require("@/assets/images/brands/init-atomic.png"),
  "init-black_crows.png": require("@/assets/images/brands/init-black_crows.png"),
  "init-blizzard.png": require("@/assets/images/brands/init-blizzard.png"),
  "init-dynastar.png": require("@/assets/images/brands/init-dynastar.png"),
  "init-elan.png": require("@/assets/images/brands/init-elan.png"),
  "init-faction.png": require("@/assets/images/brands/init-faction.png"),
  "init-fischer.png": require("@/assets/images/brands/init-fischer.png"),
  "init-head.png": require("@/assets/images/brands/init-head.png"),
  "init-k2.png": require("@/assets/images/brands/init-k2.png"),
  "init-lange.png": require("@/assets/images/brands/init-lange.png"),
  "init-movement.png": require("@/assets/images/brands/init-movement.png"),
  "init-nordica.png": require("@/assets/images/brands/init-nordica.png"),
  "init-rossignol.png": require("@/assets/images/brands/init-rossignol.png"),
  "init-salomon.png": require("@/assets/images/brands/init-salomon.png"),
  "init-scott.png": require("@/assets/images/brands/init-scott.png"),
  "init-stockli.png": require("@/assets/images/brands/init-stockli.png"),
  "init-volkl.png": require("@/assets/images/brands/init-volkl.png"),
  "init-zag.png": require("@/assets/images/brands/init-zag.png"),
  "init-unknown.png": require("@/assets/images/brands/init-unknown.png")
};

export async function getToSIcoURI(id: string): Promise<string | undefined> {
  const tosIco = await getInfoAsync(icoTosStore + id + ".png");
  if (tosIco.exists) {
    return tosIco.uri;
  }
  return undefined;
}

export async function getBrandIcoURI(id: string): Promise<string> {
  const brandIco = await getInfoAsync(icoBrandsStore + id + ".png");
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

function copyToSFiles(files?: string[]) {
  for (const tos of Object.keys(tosImages)) {
    if (files?.includes(tos)) {
      continue;
    }
    downloadAsync(
      Asset.fromModule(tosImages[tos]).uri,
      icoTosStore + tos
    );
  }
} 

function copyBrandsFiles(files?: string[]) {
  for (const brand of Object.keys(brandImages)) {
    if (files?.includes(brand)) {
      continue;
    }
    downloadAsync(
      Asset.fromModule(brandImages[brand]).uri,
      icoBrandsStore + brand
    );
  }
}

export async function initFS() {
  console.debug("Initializing FileSystemManager");

  try {
    await readDirectoryAsync(dataStore)
    console.debug("Find dataStore", dataStore);
  }
  catch {
    await makeDirectoryAsync(dataStore)
    console.debug("Create dataStore", dataStore);
  }
  try {
    await readDirectoryAsync(imgStore)
    console.debug("Find imgStore", imgStore);
  }
  catch {
    await makeDirectoryAsync(imgStore)
    console.debug("Create imgStore", imgStore);
  }
  try {
    const tosDir = imgStore + "tos/";
    const files = await readDirectoryAsync(tosDir);
    console.debug("Find imgStore", tosDir, files);
    copyToSFiles(files);
  } catch {
    const tosDir = imgStore + "tos/";
    await makeDirectoryAsync(tosDir);
    console.debug("Create imgStore", tosDir);
    copyToSFiles();
  }
  try {
    const files = await readDirectoryAsync(icoBrandsStore)
    console.debug("Find imgStore", icoBrandsStore, files);
    copyBrandsFiles(files);
  } catch {
    await makeDirectoryAsync(icoBrandsStore);
    console.debug("Create imgStore", icoBrandsStore);
    copyBrandsFiles();
  }

}

export async function writeQuery(filename: string, query: string) {
  const path = dataStore+filename;
  await writeAsStringAsync(path, query);
}

export async function delDataStore() {
  for (const fileName of await readDirectoryAsync(dataStore)) {
    console.debug("Delete dataStore", dataStore+fileName);
    await deleteAsync(dataStore+fileName)
  }
}