import { Buffer } from "buffer";
import { File, Paths } from "expo-file-system";
import { SQLiteDatabase } from "expo-sqlite";
import { showMessage } from "react-native-flash-message";
import { AuthType, createClient, FileStat, WebDAVClient } from "webdav";
import { cancelConcatQueries, execQuery, getDeviceID, hasDatabaseUpdated, startConcatQueries } from "./DatabaseManager";
import { clearQueriesStore, getImgStoreDir, getQueriesStoreDir, hasImageStoreUpdated, hasQueryStoreUpdated, imgStorePath } from "./FileSystemManager";


let webdavParams: { enabled: boolean, url: string, user: string, password: string } = { enabled: false, url: "", user: "", password: "" };
let syncing = false;
let syncMode: "none" | "error" | "mono" | "multi" = "none";
let syncDevices: { id: string, fileState: FileStat }[] = [];


export function getWebDavParams(): { enabled: boolean, url: string, user: string, password: string } {
  return webdavParams;
}

export function setWebDavParams(params: { enabled: boolean, url: string, user: string, password: string }) {
  webdavParams = params;
}

export async function checkWebDavSync(url: string, user: string, password: string): Promise<FileStat[] | false> {
  console.debug("Checking WebDav sync settings");
  try {
    const client = createClient(
      url,
      {
        username: user,
        password: password,
        authType: AuthType.Password,
      }
    );
    const contents: FileStat[] = await getRemoteDirectoryContents(client, "/");
    if (!contents.find((item) => item.type === "directory" && item.basename === "queries")) {
      console.debug("Creating queries directory on WebDav server");
      await client.createDirectory("/queries");
    }
    if (!contents.find((item) => item.type === "directory" && item.basename === "images")) {
      console.debug("Creating images directory on WebDav server");
      await client.createDirectory("/images");
    }
    console.debug("WebDav sync settings are valid");
    return contents;
  } catch (error) {
    console.error("WebDav sync settings are invalid: ", error);
    return false;
  }
}

export async function testWebDavConnection(): Promise<WebDAVClient | null> {
  syncDevices = [];
  if (!webdavParams.enabled) {
    console.debug("WebDav sync is disabled, aborting test");
    return null;
  }
  console.debug("Testing WebDav connection");
  try {
    const client = createClient(
      webdavParams.url,
      {
        username: webdavParams.user,
        password: webdavParams.password,
        authType: AuthType.Password,
      }
    );
    const contents: FileStat[] = await getRemoteDirectoryContents(client, "/");
    for (const item of contents) {
      if (item.type === "file" && item.basename.startsWith("skis-manager-") && item.basename.endsWith(".db")) {
        const id = item.basename.substring(13, item.basename.length - 3);
        syncDevices.push({ id: id, fileState: item });
      }
    }
    if (syncDevices.length > 1) {
      console.debug("WebDav connection is valid(multi)");
      syncMode = "multi";
    }
    else if (syncDevices.length === 1 && syncDevices[0].id !== getDeviceID()) {
      console.debug("WebDav connection is valid(multi)");
      syncMode = "multi";
    }
    else {
      console.debug("WebDav connection is valid(mono)");
      syncMode = "mono";
    }
    return client;
  } catch (error) {
    console.error("WebDav connection is invalid: ", error);
    syncMode = "error";
  }
  return null;
}

export async function syncData(params: { db: SQLiteDatabase, force?: boolean, background?: boolean }): Promise<void> {
  const { db, force, background } = params;

  if (!webdavParams.enabled) {
    console.debug("WebDav sync is disabled, aborting sync");
    syncing = false;
    syncMode = "none";
    syncDevices = [];
    return;
  }

  if (!hasDatabaseUpdated() && !hasImageStoreUpdated() && !hasQueryStoreUpdated() && !force) {
    console.debug("Database and stores have not been updated, skipping sync");
    return;
  }
  if (syncing) {
    console.debug("WebDav sync is already in progress, aborting new sync");
    return;
  }
  syncing = true;
  console.debug("Starting sync with WebDav");

  const client = await testWebDavConnection();
  if (!client) {
    syncing = false;
    return;
  }

  let olderBase: FileStat | null = null;
  let newerBase: FileStat | null = null;

  for (const device of syncDevices) {
    if (!olderBase || new Date(device.fileState.lastmod) < new Date(olderBase.lastmod)) {
      olderBase = device.fileState;
    }
    if (!newerBase || new Date(device.fileState.lastmod) > new Date(newerBase.lastmod)) {
      newerBase = device.fileState;
    }
  }

  console.debug("Sync mode: ", syncMode);
  //import queries
  try {
    const queriesStoreDir = getQueriesStoreDir();
    let nbRemoteQueries = 0;
    if (syncMode === "multi") {
      const remoteQueries: FileStat[] = await getRemoteDirectoryContents(client, "/queries/");
      //import remote queries if newer than local DB
      if (newerBase && newerBase.basename !== ("skis-manager-" + (getDeviceID() ?? "not-an-id") + ".db")) {
        console.debug("Remote queries to import: ", remoteQueries.length);
        const localQueries = queriesStoreDir.list().map((item) => item.name);
        console.debug("Local queries: ", localQueries.length);
        startConcatQueries();
        for (const queryFile of remoteQueries) {
          if (!queryFile.basename.startsWith("query-") || !queryFile.basename.endsWith(".sql")) {
            continue;
          }
          if (localQueries.includes(queryFile.basename)) {
            console.debug("Query file already exists locally, skipping: ", queryFile.basename);
            if (new Date(queryFile.lastmod) < (olderBase ? new Date(olderBase.lastmod) : 0)) {
              console.debug("Query file is older than or same as local DB, deleting: ", queryFile.basename);
              await client.deleteFile(`/queries/${queryFile.basename}`);
              clearQueriesStore(queryFile.basename);
            }
            continue;
          }
          console.debug("Importing query file: ", queryFile.basename);
          const fileStream = await client.getFileContents("/queries/" + queryFile.basename, { format: "text" });
          if (typeof fileStream !== "string") {
            throw new Error("Unsupported fileStream type for query file");
          }
          const query2import = new File(queriesStoreDir.uri + queryFile.basename);
          query2import.write(fileStream);
          await execQuery(db, fileStream);
          nbRemoteQueries++;
          console.debug("Query file imported: ", queryFile.basename);
        }
        console.debug("All queries are imported");
        cancelConcatQueries();
      }
      else {
        console.debug("No newer remote database found, skipping query import");
      }

      if (hasQueryStoreUpdated() || force) {
        //upload local queries
        const localQueriesUpdated = queriesStoreDir.list().map((item) => item.name);
        console.debug("Local queries to sync: ", localQueriesUpdated.length);
        const remoteQueryNames = remoteQueries.map((item) => item.basename);
        for (const query of localQueriesUpdated) {
          if (!query.startsWith("query-")) {
            continue;
          }
          if (query.endsWith("-" + getDeviceID() + ".sql")) {
            console.debug("Skipping upload of query file created by this device: ", query);
            continue;
          }
          if (!remoteQueryNames.includes(query)) {
            console.debug("Uploading query file: ", query);
            const queryStream = new File(queriesStoreDir.uri + query).base64Sync();
            const queryBuffer = Buffer.from(queryStream, 'base64');
            await client.putFileContents(`/queries/${query}`, queryBuffer, { overwrite: true });
            console.debug("Query file uploaded: ", query);
          }
        }
        await clearQueriesStore("mine");
        console.debug("All local queries are synced");
      }
      else {
        console.debug("Query store has not been updated locally, skipping query sync to remote");
      }
    }
    else {
      console.debug("Multiple devices not detected, skipping query sync");
      await clearQueriesStore("all");
    }
    //sync images
    const imgStoreDir = getImgStoreDir();
    const remoteImages: FileStat[] = await getRemoteDirectoryContents(client, "/images/");
    if (syncMode === "multi") {
      const localImages = imgStoreDir.list().map((item) => item.name);
      for (const imageFile of remoteImages) {
        if (!(imageFile.basename.startsWith("brand-") || imageFile.basename.startsWith("tos-"))) {
          continue;
        }
        if (!force && localImages.includes(imageFile.basename)) {
          const localInfo = new File(imgStoreDir.uri + imageFile.basename).info();
          if (localInfo.exists && (localInfo.modificationTime || 0) * 1000 >= new Date(imageFile.lastmod).getTime()) {
            console.debug("Image file already exists locally with same or greater modification time, skipping: ", imageFile.basename);
            continue;
          }
        }
        console.debug("Importing image file: ", imageFile.basename);
        await importRemoteImage(client, imageFile.basename);
        console.debug("Image file imported: ", imageFile.basename);
      }
      console.debug("All images are imported");
    }
    if (hasImageStoreUpdated() || force) {
      //upload local images if needed
      if (hasImageStoreUpdated() || force) {
        console.debug("Image store has been updated locally, syncing images to remote");
        const localImagesUpdated = imgStoreDir.list().map((item) => item.name);
        console.debug("Local images to sync: ", localImagesUpdated.length);

        const remoteImageNames = remoteImages.map((item) => item.basename);
        for (const image of localImagesUpdated) {
          if (!(image.startsWith("brand-") || image.startsWith("tos-"))) {
            continue;
          }
          if (!remoteImageNames.includes(image)) {
            console.debug("Uploading image file: ", image);
            const imageStream = new File(imgStoreDir.uri + image).base64Sync();
            const imageBuffer = Buffer.from(imageStream, 'base64');
            await client.putFileContents(`/images/${image}`, imageBuffer, { overwrite: true });
            console.debug("Image file uploaded: ", image);
          }
          else {
            const remoteImage = remoteImages.find((item) => item.basename === image);
            if (remoteImage) {
              const localInfo = new File(imgStoreDir.uri + remoteImage.basename).info();
              if (localInfo.exists && (localInfo.modificationTime || 0) * 1000 > new Date(remoteImage.lastmod).getTime()) {
                console.debug("Uploading updated image file: ", image);
                const imageStream = new File(imgStoreDir.uri + image).base64Sync();
                const imageBuffer = Buffer.from(imageStream, 'base64');
                await client.putFileContents(`/images/${image}`, imageBuffer, { overwrite: true });
                console.debug("Updated image file uploaded: ", image);
              }
            }
            else {
              console.warn("Remote image not found for existing local image, skipping: ", image);
            }
          }
        }
      }

    } else {
      console.debug("Image store has not been updated locally, skipping image sync to remote");
    }

    //save DB if needed
    if (nbRemoteQueries > 0 || hasQueryStoreUpdated() || force) {
      console.debug("Queries have been updated locally or remotely, saving database");
      const deviceID = getDeviceID() ?? "not-an-id";
      if (deviceID === "not-an-id") {
        throw new Error("No deviceID found - cannot sync");
      }
      const dbfile = "skis-manager-" + deviceID + ".db";
      const fileStream = new File(Paths.document + "SQLite/" + dbfile).base64Sync();
      console.debug("Read DB file stream, length: ", fileStream.length);
      const buffer = Buffer.from(fileStream, 'base64');
      console.debug("Converted DB file to buffer, length: ", buffer.length);
      await client.putFileContents(`/${dbfile}`, buffer, { overwrite: true });
      console.debug("DB file synced: ", dbfile);
    } else {
      console.debug("No changes to queries or images, skipping database save");
    }
    if (!background) {
      showMessage({
        message: "WebDav sync completed successfully",
        type: "success",
        duration: 3000,
      });
    }
  } catch (error) {
    cancelConcatQueries();
    console.error("Error syncing data with WebDav: ", error);
    if (!background) {
      showMessage({
        message: "ERROR\nError syncing data with WebDav: " + error,
        type: "danger",
        hideOnPress: true,
      });
    }
  }
  finally {
    syncing = false;
  }
}

async function importRemoteImage(client: any, imageName: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const fileStream = await client.getFileContents(`/images/${imageName}`, { format: "binary" });
      let buffer: Buffer;
      if (Buffer.isBuffer(fileStream)) {
        buffer = fileStream;
      } else if (typeof fileStream === "string") {
        buffer = Buffer.from(fileStream);
      } else if (fileStream instanceof ArrayBuffer) {
        buffer = Buffer.from(new Uint8Array(fileStream));
      } else {
        throw new Error("Unsupported fileStream type");
      }
      const imageFile = new File(imgStorePath + imageName);
      if (imageFile.exists) {
        imageFile.delete();
        console.debug("Deleted existing image file: ", imageName);
      }
      imageFile.write(buffer.toString('base64'));
      console.debug("Image file copied: ", imageName);
      resolve();
    } catch (error) {
      console.error("Error importing image file: ", imageName, error);
      reject(error);
    }
  });
}

async function getRemoteDirectoryContents(client: any, path: string): Promise<FileStat[]> {
  const contentsRaw = await client.getDirectoryContents(path);
  const contents: FileStat[] = Array.isArray(contentsRaw)
    ? contentsRaw
    : (contentsRaw.data as FileStat[]);
  return contents;
}

export function getSyncMode(): "none" | "error" | "mono" | "multi" {
  return syncMode;
}

export function getSyncDevices(): { id: string, fileState: FileStat }[] {
  return syncDevices;
}