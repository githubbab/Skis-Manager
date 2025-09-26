
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

export const queriesStorePath = FileSystem.documentDirectory + "/queries/";
export const imgStorePath = FileSystem.documentDirectory + "/images/";
export const icoUnknownBrand = imgStorePath + "brand-init-unknown.png";
let imageStoreUpdated = false;
let queryStoreUpdated = false;

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
  const tosIco = await FileSystem.getInfoAsync(imgStorePath + "tos-" + id + ".png");
  if (tosIco.exists) {
    return tosIco.uri;
  }
  return undefined;
}

export async function getBrandIcoURI(id: string): Promise<string> {
  const brandIco = await FileSystem.getInfoAsync(imgStorePath + "brand-" + id + ".png");
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
      const destFile = await FileSystem.getInfoAsync(imgStorePath + base);
      if (destFile.exists) {
        continue;
      }
      const asset = Asset.fromModule(baseImages[base]);
      await asset.downloadAsync();
      if (!asset.localUri) {
        console.error("Error loading asset", base);
        alert("Error loading asset: " + base);
        continue;
      }
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: imgStorePath + base
      });
      const checkFile = await FileSystem.getInfoAsync(imgStorePath + base);
      if (checkFile.exists) {
        imageStoreUpdated = true;
        console.debug("Copied Base Asset", base, "to", checkFile.uri);
      } else {
        console.error("Error copying Base Asset", base);
        alert("Error copying Base Asset: " + base);
      }
    } catch (error) {
      console.error("Error copying Base Asset", error);
      alert("Error copying Base Asset" + error + base);
    }
  }
}

export async function initFS() {
  console.debug("Initializing FileSystemManager", imgStorePath, queriesStorePath);
  const queriesStoreDir = await FileSystem.getInfoAsync(queriesStorePath);
  const imgStoreDir = await FileSystem.getInfoAsync(imgStorePath);
  if (!queriesStoreDir.exists) {
    await FileSystem.makeDirectoryAsync(queriesStorePath);
    console.debug("Create dataStore", queriesStoreDir.uri);
  } else if (queriesStoreDir.isDirectory) {
    console.debug("Find dataStore", queriesStoreDir.uri);
  } else {
    const message = "Error: dataStore path exists but is not a directory: " + queriesStoreDir.uri;
    console.error(message);
    alert(message);
  }
  if (!imgStoreDir.exists) {
    await FileSystem.makeDirectoryAsync(imgStorePath);
    console.debug("Create imgStore", imgStoreDir.uri);
  } else if (imgStoreDir.isDirectory) {
    console.debug("Find imgStore", imgStoreDir.uri);
  } else {
    const message = "Error: imgStore path exists but is not a directory: " + imgStoreDir.uri;
    console.error(message);
    alert(message);
  }
  try {
    await copyBaseFiles();
  } catch (error) {
    const message = "Error copying base files: " + error;
    console.error(message);
    alert(message);
  }
}

export async function writeQuery(filename: string, query: string) {
  await FileSystem.writeAsStringAsync(queriesStorePath + filename, query);
  queryStoreUpdated = true;
}

export async function delBrandIco(idBrand: string) {
  const brandIco = await FileSystem.getInfoAsync(imgStorePath + "brand-" + idBrand + ".png");
  if (brandIco.exists) {
    await FileSystem.deleteAsync(brandIco.uri);
    imageStoreUpdated = true;
    console.debug("Deleted brand ico", brandIco.uri);
  }
}

export async function delToSIco(idTypeOfSkis: string) {
  const tosIco = await FileSystem.getInfoAsync(imgStorePath + "tos-" + idTypeOfSkis + ".png");
  if (tosIco.exists) {
    await FileSystem.deleteAsync(tosIco.uri);
    imageStoreUpdated = true;
    console.debug("Deleted ToS ico", tosIco.uri);
  }
}

export async function copyBrandIco(idBrand: string, fromUri: string) {
  const brandIcoUri = imgStorePath + "brand-" + idBrand + ".png";
  const brandIco = await FileSystem.getInfoAsync(brandIcoUri);
  if (brandIco.exists) {
    await FileSystem.deleteAsync(brandIco.uri);
    console.debug("Deleted existing brand ico", brandIco.uri);
  }
  const fromFile = await FileSystem.getInfoAsync(fromUri);
  if (!fromFile.exists) {
    console.error("Source brand ico does not exist", fromUri);
    alert("Source brand ico does not exist: " + fromUri);
    return;
  }
  try {
    console.debug("Copying brand ico from", fromFile.uri, "to", brandIcoUri);
    await FileSystem.copyAsync({
      from: fromFile.uri,
      to: brandIcoUri
    });
    if ((await FileSystem.getInfoAsync(brandIcoUri)).exists) {
      imageStoreUpdated = true;
      console.debug("Copied brand ico", fromUri, "to", brandIcoUri);
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

export async function copyToSIco(idTypeOfSkis: string, fromUri: string) {
  const tosIco = await FileSystem.getInfoAsync(imgStorePath + "tos-" + idTypeOfSkis + ".png");
  if (tosIco.exists) {
    await FileSystem.deleteAsync(tosIco.uri);
    console.debug("Deleted existing ToS ico", tosIco.uri);
  }
  const fromFile = await FileSystem.getInfoAsync(fromUri);
  if (!fromFile.exists) {
    console.error("Source ToS ico does not exist", fromUri);
    alert("Source ToS ico does not exist: " + fromUri);
    return;
  }
  try {
    await FileSystem.copyAsync({
      from: fromFile.uri,
      to: tosIco.uri
    });
    if ((await FileSystem.getInfoAsync(tosIco.uri)).exists) {
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
  for (const fileName of await FileSystem.readDirectoryAsync(imgStorePath)) {
    console.debug("Delete dataStore", imgStorePath + fileName);
    await FileSystem.deleteAsync(imgStorePath + fileName);
  }
  for (const fileName of await FileSystem.readDirectoryAsync(imgStorePath)) {
    if (fileName.startsWith("brand-init") || fileName.startsWith("tos-init")) {
      continue;
    }
    console.debug("Delete imgStore", imgStorePath + fileName);
    await FileSystem.deleteAsync(imgStorePath + fileName);
  }
  await copyBaseFiles();
}

export async function clearQueriesStore(who: string = "all") {
  for (const fileName of await FileSystem.readDirectoryAsync(queriesStorePath)) {
    if (who !== "all" && !fileName.includes(who)) {
      continue;
    }
    console.debug("Delete dataStore", queriesStorePath + fileName);
    await FileSystem.deleteAsync(queriesStorePath + fileName);
  }
}