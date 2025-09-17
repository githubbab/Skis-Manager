import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import { documentDirectory, getInfoAsync, readAsStringAsync, readDirectoryAsync, writeAsStringAsync } from "expo-file-system";
import { SQLiteDatabase } from "expo-sqlite";
import { showMessage } from "react-native-flash-message";
import { AuthType, createClient, FileStat } from "webdav";
import { cancelConcatQueries, execQuery, startConcatQueries } from "./DatabaseManager";
import { hasImageStoreUpdated, hasQueryStoreUpdated } from "./FileSystemManager";


let webdavParams: { enabled: boolean, url: string, user: string, password: string } = { enabled: false, url: "", user: "", password: "" };

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

export async function syncData(params: { db: SQLiteDatabase, force?: boolean, background?: boolean }): Promise<void> {
  const { db, force, background } = params;

  try {
    const client = createClient(
      webdavParams.url,
      {
        username: webdavParams.user,
        password: webdavParams.password,
        authType: AuthType.Password,
      }
    );
    let message: string = "Starting sync with WebDav...\nSyncing remote queries... ";
    if (!background) {
      showMessage({
        message: message,
        type: "info",
        autoHide: false,
      });
    }
    //import queries
    try {
      let nbRemoteQueries = 0;
      const remoteQueries: FileStat[] = await getRemoteDirectoryContents(client, "/queries/");
      console.debug("Remote queries to import: ", remoteQueries.length);
      const localQueries = await readDirectoryAsync(documentDirectory + "/queries/");
      console.debug("Local queries: ", localQueries.length);
      startConcatQueries();
      for (const queryFile of remoteQueries) {
        if (!queryFile.basename.startsWith("query-") || !queryFile.basename.endsWith(".sql")) {
          continue;
        }
        if (localQueries.includes(queryFile.basename)) {
          console.debug("Query file already exists locally, skipping: ", queryFile.basename);
          continue;
        }
        console.debug("Importing query file: ", queryFile.basename);
        const fileStream = await client.getFileContents("/queries/" + queryFile.basename, { format: "text" });
        if (typeof fileStream !== "string") {
          throw new Error("Unsupported fileStream type for query file");
        }
        await writeAsStringAsync(documentDirectory + "/queries/" + queryFile.basename, fileStream, { encoding: "utf8" });
        await execQuery(db, fileStream);
        nbRemoteQueries++;
        console.debug("Query file imported: ", queryFile.basename);
      }
      console.debug("All queries are imported");
      message += "done(" + nbRemoteQueries + ")\nUploading local queries... ";
      if (!background) {
        showMessage({
          message: message,
          type: "info",
          autoHide: false,
        });
      }
      cancelConcatQueries();
      //upload local queries
      let nbSync = 0;
      const localQueriesUpdated = await readDirectoryAsync(documentDirectory + "/queries/");
      console.debug("Local queries to sync: ", localQueriesUpdated.length);
      const remoteQueryNames = remoteQueries.map((item) => item.basename);
      for (const query of localQueriesUpdated) {
        if (!query.startsWith("query-")) {
          continue;
        }
        if (!remoteQueryNames.includes(query)) {
          console.debug("Uploading query file: ", query);
          const queryStream = await readAsStringAsync(documentDirectory + "/queries/" + query, { encoding: "base64" });
          const queryBuffer = Buffer.from(queryStream, 'base64');
          await client.putFileContents(`/queries/${query}`, queryBuffer, { overwrite: true });
          nbSync++;
          console.debug("Query file uploaded: ", query);
        }
      }
      console.debug("All local queries are synced");
      message += "done(" + nbSync + ")\nSyncing remote images... ";
      if (!background) {
        showMessage({
          message: message,
          type: "info",
          autoHide: false,
        });
      }
      //sync images
      nbSync = 0;
      const remoteImages: FileStat[] = await getRemoteDirectoryContents(client, "/images/");
      const localImages = await readDirectoryAsync(documentDirectory + "/images/");
      for (const imageFile of remoteImages) {
        if (!(imageFile.basename.startsWith("brand-") || imageFile.basename.startsWith("tos-"))) {
          continue;
        }
        if (!force && localImages.includes(imageFile.basename)) {
          const localInfo = await getInfoAsync(documentDirectory + "/images/" + imageFile.basename);
          if (localInfo.exists && localInfo.modificationTime * 1000 >= new Date(imageFile.lastmod).getTime()) {
            console.debug("Image file already exists locally with same or greater modification time, skipping: ", imageFile.basename);
            continue;
          }
        }
        console.debug("Importing image file: ", imageFile.basename);
        await importRemoteImage(client, imageFile.basename);
        nbSync++;
        console.debug("Image file imported: ", imageFile.basename);
      }
      console.debug("All images are imported");
      message += "done(" + nbSync + ")\nSync local images... ";
      if (!background) {
        showMessage({
          message: message,
          type: "info",
          autoHide: false,
        });
      }
      //upload local images if needed
      if (hasImageStoreUpdated() || force) {
        console.debug("Image store has been updated locally, syncing images to remote");
        nbSync = 0;
        const localImagesUpdated = await readDirectoryAsync(documentDirectory + "/images/");
        console.debug("Local images to sync: ", localImagesUpdated.length);

        const remoteImageNames = remoteImages.map((item) => item.basename);
        for (const image of localImagesUpdated) {
          if (!(image.startsWith("brand-") || image.startsWith("tos-"))) {
            continue;
          }
          if (!remoteImageNames.includes(image)) {
            console.debug("Uploading image file: ", image);
            const imageStream = await readAsStringAsync(documentDirectory + "/images/" + image, { encoding: "base64" });
            const imageBuffer = Buffer.from(imageStream, 'base64');
            await client.putFileContents(`/images/${image}`, imageBuffer, { overwrite: true });
            nbSync++;
            console.debug("Image file uploaded: ", image);
          }
          else {
            const remoteImage = remoteImages.find((item) => item.basename === image);
            if (remoteImage) {
              const localInfo = await getInfoAsync(documentDirectory + "/images/" + image);
              if (localInfo.exists && localInfo.modificationTime * 1000 > new Date(remoteImage.lastmod).getTime()) {
                console.debug("Uploading updated image file: ", image);
                const imageStream = await readAsStringAsync(documentDirectory + "/images/" + image, { encoding: "base64" });
                const imageBuffer = Buffer.from(imageStream, 'base64');
                await client.putFileContents(`/images/${image}`, imageBuffer, { overwrite: true });
                nbSync++;
                console.debug("Updated image file uploaded: ", image);
              }
            }
            else {
              console.warn("Remote image not found for existing local image, skipping: ", image);
            }
          }
        }
        console.debug("All local images are synced");
        message += "done(" + nbSync + ")\nSaving database... ";
        if (!background) {
          showMessage({
            message: message,
            type: "success",
            duration: 3000,
          });
        }
      } else {
        console.debug("Image store has not been updated locally, skipping image sync to remote");
        message += "skipped(no local changes)\nSaving database... ";
        if (!background) {
          showMessage({
            message: message,
            type: "success",
            duration: 3000,
          });
        }
      }
      //save DB if needed
      if (nbRemoteQueries > 0 || hasQueryStoreUpdated() || force) {
        console.debug("Queries have been updated locally or remotely, saving database");
        const deviceID = await AsyncStorage.getItem("deviceID") ?? "not-an-id";
        if (deviceID === "not-an-id") {
          throw new Error("No deviceID found - cannot sync");
        }
        const dbfile = "skis-manager-" + deviceID + ".db";
        const fileStream = await readAsStringAsync(documentDirectory + "/SQLite/skis-manager.db", { encoding: "base64" });
        console.debug("Read DB file stream, length: ", fileStream.length);
        const buffer = Buffer.from(fileStream, 'base64');
        console.debug("Converted DB file to buffer, length: ", buffer.length);
        await client.putFileContents(`/${dbfile}`, buffer, { overwrite: true });
        console.debug("DB file synced: ", dbfile);
        message += "done\nSync with WebDav completed successfully";
      } else {
        console.debug("No changes to queries or images, skipping database save");
        message += "skipped(no changes)\nSync with WebDav completed successfully";
      }
      if (!background) {
        showMessage({
          message: message,
          type: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      cancelConcatQueries();
      console.error("Error syncing data with WebDav: ", error);
      if (!background) {
        showMessage({
          message: message + "ERROR\nError syncing data with WebDav: " + error,
          type: "danger",
          hideOnPress: true,
        });
      }
    }
  } catch (error) {
    console.error("Error connecting to WebDav: ", error);
    if (!background) {
      showMessage({
        message: "Error connecting to WebDav: " + error,
        type: "warning",
        duration: 1000,
      });
    }
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
      await writeAsStringAsync(documentDirectory + "/images/" + imageName, buffer.toString('base64'), { encoding: "base64" });
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