import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import { documentDirectory, readAsStringAsync, readDirectoryAsync, writeAsStringAsync } from "expo-file-system";
import { SQLiteDatabase } from "expo-sqlite";
import { showMessage } from "react-native-flash-message";
import { AuthType, createClient, FileStat } from "webdav";
import { cancelConcatQueries, execQuery, startConcatQueries } from "./DatabaseManager";

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
    const contentsRaw = await client.getDirectoryContents("/");
    console.debug("WebDav connection successful, contents: ", contentsRaw);
    const contents: FileStat[] = Array.isArray(contentsRaw)
      ? contentsRaw
      : (contentsRaw.data as FileStat[]);

    console.debug("Directory contents: ", contents);
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

export async function exportData(params: { url: string, user: string, password: string }): Promise<boolean> {
  const { url, user, password } = params;
  try {
    const client = createClient(
      url,
      {
        username: user,
        password: password,
        authType: AuthType.Password,
      }
    );
    const remoteImagesRaw = await client.getDirectoryContents("/images/");
    let message: string = "Starting upload to WebDav...\nUploading database file...";
    showMessage({
      message: message,
      type: "info",
      autoHide: false,
    });
    try {
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
      message += " done\nUploading images... ";
      showMessage({
        message: message,
        type: "info",
        autoHide: false,
      });
      //upload images
      const localImages = await readDirectoryAsync(documentDirectory + "/images/");
      console.debug("Local images to sync: ", localImages);
      const remoteImages: FileStat[] = Array.isArray(remoteImagesRaw)
        ? remoteImagesRaw
        : (remoteImagesRaw.data as FileStat[]);
      const remoteImageNames = remoteImages.map((item) => item.basename);
      for (const image of localImages) {
        if (!(image.startsWith("brand-") || image.startsWith("tos-"))) {
          continue;
        }
        if (!remoteImageNames.includes(image)) {
          console.debug("Uploading image file: ", image);
          const imageStream = await readAsStringAsync(documentDirectory + "/images/" + image, { encoding: "base64" });
          const imageBuffer = Buffer.from(imageStream, 'base64');
          await client.putFileContents(`/images/${image}`, imageBuffer, { overwrite: true });
          console.debug("Image file uploaded: ", image);
        }
      }
      for (const remoteImage of remoteImages) {
        if (!(remoteImage.basename.startsWith("brand-") || remoteImage.basename.startsWith("tos-"))) {
          continue;
        }
        if (!localImages.includes(remoteImage.basename)) {
          console.debug("Deleting remote image file not present locally: ", remoteImage.basename);
          await client.deleteFile(`/images/${remoteImage.basename}`);
          console.debug("Remote image file deleted: ", remoteImage.basename);
        }
      }
      console.debug("All local images are synced");
      message += "done\nUploading queries... ";
      showMessage({
        message: message,
        type: "info",
        autoHide: false,
      });
      //upload queries
      const localQueries = await readDirectoryAsync(documentDirectory + "/queries/");
      console.debug("Local queries to sync: ", localQueries.length);
      const remoteQueriesRaw = await client.getDirectoryContents("/queries/");
      const remoteQueries: FileStat[] = Array.isArray(remoteQueriesRaw)
        ? remoteQueriesRaw
        : (remoteQueriesRaw.data as FileStat[]);
      const remoteQueryNames = remoteQueries.map((item) => item.basename);
      for (const query of localQueries) {
        if (!query.startsWith("query-")) {
          continue;
        }
        if (!remoteQueryNames.includes(query)) {
          console.debug("Uploading query file: ", query);
          const queryStream = await readAsStringAsync(documentDirectory + "/queries/" + query, { encoding: "base64" });
          const queryBuffer = Buffer.from(queryStream, 'base64');
          await client.putFileContents(`/queries/${query}`, queryBuffer, { overwrite: true });
          console.debug("Query file uploaded: ", query);
        }
      }
      console.debug("All local queries are synced");
      showMessage({
        message: message + "done\nUpload to WebDav completed successfully",
        type: "success",
        duration: 3000,
      });
      return true;
    }
    catch (error) {
      console.error("Error uploading database to WebDav: ", error);
      showMessage({
        message: message + "ERROR\nError uploading database to WebDav: " + error,
        type: "danger",
        duration: 5000,
      });
      return false;
    }
  } catch (error) {
    console.error("Error connecting to WebDav: ", error);
    showMessage({
      message: "Error connecting to WebDav: " + error,
      type: "warning",
      duration: 1000,
    });
    return false;
  }
}

export async function importData(params: { db: SQLiteDatabase, url: string, user: string, password: string, force?: boolean }): Promise<void> {
  const { db, url, user, password, force } = params;

  try {
    const client = createClient(
      url,
      {
        username: user,
        password: password,
        authType: AuthType.Password,
      }
    );
    const imagesRaw = await client.getDirectoryContents("/images");
    let message: string = "Starting import from WebDav...\nImporting images... ";
    showMessage({
      message: message,
      type: "info",
      autoHide: false,
    });
    //import images
    try {
      const images: FileStat[] = Array.isArray(imagesRaw)
        ? imagesRaw
        : (imagesRaw.data as FileStat[]);
      console.debug("Remote images to import: ", images.length);
      const localImages = await readDirectoryAsync(documentDirectory + "/images/");
      console.debug("Local images: ", localImages.length);
      for (const imageFile of images) {
        if (!(imageFile.basename.startsWith("brand-") || imageFile.basename.startsWith("tos-"))) {
          continue;
        }
        if (!force && localImages.includes(imageFile.basename)) {
          console.debug("Image file already exists locally, skipping: ", imageFile.basename);
          continue;
        }
        console.debug("Importing image file: ", imageFile.basename);
        const fileStream = await client.getFileContents("/images/" + imageFile.basename, { format: "binary" });
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
        await writeAsStringAsync(documentDirectory + "/images/" + imageFile.basename, buffer.toString('base64'), { encoding: "base64" });
        console.debug("Image file imported: ", imageFile.basename);
      }
      console.debug("All images are imported");
      message += "done\nImporting queries... ";
      showMessage({
        message: message,
        type: "info",
        autoHide: false,
      });
      //import DB
      const queriesRaw = await client.getDirectoryContents("/queries");
      const queries: FileStat[] = Array.isArray(queriesRaw)
        ? queriesRaw
        : (queriesRaw.data as FileStat[]);
      console.debug("Remote queries to import: ", queries.length);
      const localQueries = await readDirectoryAsync(documentDirectory + "/queries/");
      console.debug("Local queries: ", localQueries.length);
      startConcatQueries();
      for (const queryFile of queries) {
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
        console.debug("Query file imported: ", queryFile.basename);
      }
      message += "done\nAll data imported successfully";
      showMessage({
        message: message,
        type: "success",
        duration: 3000,
      });
      cancelConcatQueries();
    } catch (error) {
      cancelConcatQueries();
      console.error("Error importing database from WebDav: ", error);
      showMessage({
        message: message + "ERROR\nError importing database from WebDav: " + error,
        type: "danger",
        duration: 5000,
      });
    }
  } catch (error) {
    console.error("Error connecting to WebDav: ", error);
    showMessage({
      message: "Error connecting to WebDav: " + error,
      type: "warning",
      duration: 1000,
    });
    return;
  }
}