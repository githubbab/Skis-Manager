import { Buffer } from "buffer";
import { SQLiteDatabase } from "expo-sqlite";
import { showMessage } from "react-native-flash-message";
import { AuthType, createClient, FileStat, WebDAVClient } from "webdav";
import { clearActionsStore, execQuery , imgStoreDir, actionsStoreDir } from "./DataManager";
import { File } from "expo-file-system";
import { Logger } from "./ToolsBox";


// #######                           
//    #    #   # #####  ######  #### 
//    #     # #  #    # #      #     
//    #      #   #    # #####   #### 
//    #      #   #####  #           #
//    #      #   #      #      #    #
//    #      #   #      ######  #### 
export type WebDavSyncStatus = "synced" | "syncing" | "error" | "disabled" | "wait";

export type WebDavDevice = {
  id: string,
  lastModified: Date
}

//                     #     #               ######                ######                                      
//  ####  ###### ##### #  #  # ###### #####  #     #   ##   #    # #     # ###### #    # #  ####  ######  #### 
// #    # #        #   #  #  # #      #    # #     #  #  #  #    # #     # #      #    # # #    # #      #     
// #      #####    #   #  #  # #####  #####  #     # #    # #    # #     # #####  #    # # #      #####   #### 
// #  ### #        #   #  #  # #      #    # #     # ###### #    # #     # #      #    # # #      #           #
// #    # #        #   #  #  # #      #    # #     # #    #  #  #  #     # #       #  #  # #    # #      #    #
//  ####  ######   #    ## ##  ###### #####  ######  #    #   ##   ######  ######   ##   #  ####  ######  #### 
export async function getWebDavDevices(webDavClient: WebDAVClient): Promise<WebDavDevice[]> {
  let syncDevices: WebDavDevice[] = [];
  Logger.debug("Getting WebDav devices");
  try {
    const contents: FileStat[] = await getRemoteDirectoryContents(webDavClient, "/");
    for (const item of contents) {
      if (item.type === "file" && item.basename.endsWith(".lastsync") && item.basename.startsWith("device-")) {
        const match = item.basename.match(/^device-([A-Za-z0-9]{4})\.lastsync$/);
        if (!match) {
          Logger.debug("Unexpected lastsync file format: ", item.basename);
          continue;
        }
        const id: string = match[1];
        const timestamp: Date = new Date(item.lastmod);
        syncDevices.push({ id: id, lastModified: timestamp });
      }
    }
  } catch (error) {
    Logger.error("Error getting WebDav devices: ", error);
  }
  return syncDevices;
}

//                     #     #               ######                ######                                #                            #####                     
// #####  #    # ##### #  #  # ###### #####  #     #   ##   #    # #     # ###### #    # #  ####  ###### #         ##    ####  ##### #     # #   # #    #  #### 
// #    # #    #   #   #  #  # #      #    # #     #  #  #  #    # #     # #      #    # # #    # #      #        #  #  #        #   #        # #  ##   # #    #
// #    # #    #   #   #  #  # #####  #####  #     # #    # #    # #     # #####  #    # # #      #####  #       #    #  ####    #    #####    #   # #  # #     
// #####  #    #   #   #  #  # #      #    # #     # ###### #    # #     # #      #    # # #      #      #       ######      #   #         #   #   #  # # #     
// #      #    #   #   #  #  # #      #    # #     # #    #  #  #  #     # #       #  #  # #    # #      #       #    # #    #   #   #     #   #   #   ## #    #
// #       ####    #    ## ##  ###### #####  ######  #    #   ##   ######  ######   ##   #  ####  ###### ####### #    #  ####    #    #####    #   #    #  #### 
export async function putWebDavDeviceLastSync(params: { webDavClient: WebDAVClient, deviceId: string }): Promise<void> {
  const { webDavClient, deviceId } = params;
  const fileName = `/device-${deviceId}.lastsync`;
  const fileContent = Date.now().toString();
  await webDavClient.putFileContents(fileName, fileContent, { overwrite: true });
}

//                                          #     #               ######                 #####                              
//  ####  #####  ######   ##   ##### ###### #  #  # ###### #####  #     #   ##   #    # #     # #      # ###### #    # #####
// #    # #    # #       #  #    #   #      #  #  # #      #    # #     #  #  #  #    # #       #      # #      ##   #   #  
// #      #    # #####  #    #   #   #####  #  #  # #####  #####  #     # #    # #    # #       #      # #####  # #  #   #  
// #      #####  #      ######   #   #      #  #  # #      #    # #     # ###### #    # #       #      # #      #  # #   #  
// #    # #   #  #      #    #   #   #      #  #  # #      #    # #     # #    #  #  #  #     # #      # #      #   ##   #  
//  ####  #    # ###### #    #   #   ######  ## ##  ###### #####  ######  #    #   ##    #####  ###### # ###### #    #   #  
export async function createWebDavClient(params: { url: string, user: string, password: string }): Promise<WebDAVClient | string> {
  try {
    const client = createClient(
      params.url,
      {
        username: params.user,
        password: params.password,
        authType: AuthType.Password,
      }
    );
    const contents: FileStat[] = await getRemoteDirectoryContents(client, "/");
    Logger.debug("WebDav connection test succeeded");
    const listDir = contents.map((item) => item.type === "directory" ? item.basename : null);
    if (!listDir.includes("images")) {
      await client.createDirectory("/images");
      Logger.debug("Created /images directory on WebDav server");
    }
    else {
      Logger.debug("Images directory already exists on WebDav server");
    }
    if (!listDir.includes("actions")) {
      await client.createDirectory("/actions");
      Logger.debug("Created /actions directory on WebDav server");
    }
    else {
      Logger.debug("Actions directory already exists on WebDav server");
    }
    if (!listDir.includes("databases")) {
      await client.createDirectory("/databases");
      Logger.debug("Created /databases directory on WebDav server");
    }
    else {
      Logger.debug("Databases directory already exists on WebDav server");
    }
    return client;
  } catch (error) {
    Logger.error("WebDav connection test failed: ", error);
    return "ERROR: " + (error instanceof Error ? error.message : String(error));
  }
}

//                                     ######                                    #######                
// # #    # #####   ####  #####  ##### #     # ###### #    #  ####  ##### ###### #       # #      ######
// # ##  ## #    # #    # #    #   #   #     # #      ##  ## #    #   #   #      #       # #      #     
// # # ## # #    # #    # #    #   #   ######  #####  # ## # #    #   #   #####  #####   # #      ##### 
// # #    # #####  #    # #####    #   #   #   #      #    # #    #   #   #      #       # #      #     
// # #    # #      #    # #   #    #   #    #  #      #    # #    #   #   #      #       # #      #     
// # #    # #       ####  #    #   #   #     # ###### #    #  ####    #   ###### #       # ###### ######
export async function importRemoteFile(client: any, remotePath: string, localPath: string): Promise<void> {
  const fileStream = await client.getFileContents(remotePath, { format: "binary" });
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
  const localFile = new File(localPath);
  if (localFile.exists) {
    localFile.delete();
  }
  localFile.write(buffer);
}

export async function importAllRemoteImages(client: any): Promise<void> {
  Logger.debug("Importing all remote images from WebDav server");
  const remoteImages: FileStat[] = (await getRemoteDirectoryContents(client, "/images/")).filter((item) => item.type === "file");

  for (const image of remoteImages) {
    const localPath = `${imgStoreDir.uri}/${image.basename}`;
    Logger.debug("Importing remote image: ", image.basename, " to ", localPath);

    await importRemoteFile(client, "/images/" + image.basename, localPath);
  }
}

//                     ######                                    ######                                                    #####                                                
//  ####  ###### ##### #     # ###### #    #  ####  ##### ###### #     # # #####  ######  ####  #####  ####  #####  #   # #     #  ####  #    # ##### ###### #    # #####  #### 
// #    # #        #   #     # #      ##  ## #    #   #   #      #     # # #    # #      #    #   #   #    # #    #  # #  #       #    # ##   #   #   #      ##   #   #   #     
// #      #####    #   ######  #####  # ## # #    #   #   #####  #     # # #    # #####  #        #   #    # #    #   #   #       #    # # #  #   #   #####  # #  #   #    #### 
// #  ### #        #   #   #   #      #    # #    #   #   #      #     # # #####  #      #        #   #    # #####    #   #       #    # #  # #   #   #      #  # #   #        #
// #    # #        #   #    #  #      #    # #    #   #   #      #     # # #   #  #      #    #   #   #    # #   #    #   #     # #    # #   ##   #   #      #   ##   #   #    #
//  ####  ######   #   #     # ###### #    #  ####    #   ###### ######  # #    # ######  ####    #    ####  #    #   #    #####   ####  #    #   #   ###### #    #   #    #### 
async function getRemoteDirectoryContents(client: any, path: string): Promise<FileStat[]> {
  const contentsRaw = await client.getDirectoryContents(path);
  const contents: FileStat[] = Array.isArray(contentsRaw)
    ? contentsRaw
    : (contentsRaw.data as FileStat[]);
  return contents;
}

//                      ######                                    ######                               
// #####  ###### #      #     # ###### #    #  ####  ##### ###### #     # ###### #    # #  ####  ######
// #    # #      #      #     # #      ##  ## #    #   #   #      #     # #      #    # # #    # #     
// #    # #####  #      ######  #####  # ## # #    #   #   #####  #     # #####  #    # # #      ##### 
// #    # #      #      #   #   #      #    # #    #   #   #      #     # #      #    # # #      #     
// #    # #      #      #    #  #      #    # #    #   #   #      #     # #       #  #  # #    # #     
// #####  ###### ###### #     # ###### #    #  ####    #   ###### ######  ######   ##   #  ####  ######
export async function delRemoteDevice(deviceID: string, webDavClient: WebDAVClient): Promise<void> {
  try {
    await webDavClient.deleteFile(`/device-${deviceID}.lastsync`);
    Logger.debug("Remote device deleted: ", deviceID);
  } catch (error) {
    Logger.error("Error deleting remote device: ", deviceID, error);
    throw error;
  }
}

//                     ######                                    #######                
// #####  #    # ##### #     # ###### #    #  ####  ##### ###### #       # #      ######
// #    # #    #   #   #     # #      ##  ## #    #   #   #      #       # #      #     
// #    # #    #   #   ######  #####  # ## # #    #   #   #####  #####   # #      ##### 
// #####  #    #   #   #   #   #      #    # #    #   #   #      #       # #      #     
// #      #    #   #   #    #  #      #    # #    #   #   #      #       # #      #     
// #       ####    #   #     # ###### #    #  ####    #   ###### #       # ###### ######
async function putRemoteFile(client: any, remotePath: string, localFile: File): Promise<void> {
  const stream = localFile.base64Sync();
  const buffer = Buffer.from(stream, 'base64');
  await client.putFileContents(remotePath, buffer, { overwrite: true });
}

//                            ######                     
//  ####  #   # #    #  ####  #     #   ##   #####   ##  
// #       # #  ##   # #    # #     #  #  #    #    #  # 
//  ####    #   # #  # #      #     # #    #   #   #    #
//      #   #   #  # # #      #     # ######   #   ######
// #    #   #   #   ## #    # #     # #    #   #   #    #
//  ####    #   #    #  ####  ######  #    #   #   #    #
export async function syncData(params: { db: SQLiteDatabase, myID: string, webDavClient: WebDAVClient, background?: boolean }): Promise<{ synced: "changed" | "unchanged" | "error", multi: boolean, error?: string }> {
  const { db, myID, webDavClient, background = true } = params;
  let modified: boolean = false;
  let copyDB: boolean = false;
  if (!myID || myID === "not-an-id") {
    Logger.debug("syncData: No device ID found, cannot sync with WebDav");
    return { synced: "error", multi: false, error: "No device ID found - cannot sync" };
  }

  // regular expression to extract timestamp from action file names
  const fileActionsRegexp = /^(del|copy|query)_([^_]+)_([0-9]{10,})_([a-zA-Z0-9]{4})\.(sql|file)$/;
  // get remote devices
  const remoteDevices = await getWebDavDevices(webDavClient);
  // check if local data has changed since last sync
  const localimages: File[] = imgStoreDir.list().filter((item) => item instanceof File);
  const localActions: File[] = actionsStoreDir.list().filter((item) => item instanceof File);
  const remoteActions: FileStat[] = (await getRemoteDirectoryContents(webDavClient, "/actions/")).filter((item) => item.type === "file");

  if (remoteDevices.length === 0 || (remoteDevices.length === 1 && remoteDevices[0].id === myID)) {
    // no other devices, just copy datbase if local actions
    if (remoteActions.length > 0) {
      Logger.debug("syncData: No other devices found on WebDav, deleting remote actions");
      for (const action of remoteActions) {
        await webDavClient.deleteFile(`/actions/${action.basename}`);
      }
    }
    if (localActions.length === 0) {
      Logger.debug("syncData: No other devices found on WebDav, and no local actions - nothing to sync");
      return { synced: "unchanged", multi: false };
    }
    Logger.debug("syncData: No other devices found on WebDav, checking local actions to upload");
    for (const action of localActions) {
      const match = action.name.match(fileActionsRegexp);
      if (!match) {
        Logger.debug("syncData: Skipping invalid action file: ", action.name);
        continue;
      }
      const [, actionType, , , ,] = match;
      if (actionType === "query") {
        Logger.debug("syncData: No other devices found on WebDav, but local query action present - will upload database");
        copyDB = true;
      } else {
        const content = await action.text();
        const localImage4Action = localimages.find((li) => li.name === content);
        if (localImage4Action && localImage4Action.exists) {
          if (actionType === "copy") {
            Logger.debug("syncData: No other devices found on WebDav, but local image copy action present - will upload image: ", localImage4Action.name);
            await putRemoteFile(webDavClient, `/images/${localImage4Action.name}`, localImage4Action);
          } else if (actionType === "del") {
            Logger.debug("syncData: No other devices found on WebDav, but local image delete action present - will delete image: ", localImage4Action.name);
            await webDavClient.deleteFile(`/images/${localImage4Action.name}`);
          }
        }
      }
    }
    if (copyDB) {
      await putRemoteFile(webDavClient, `/databases/skis-manager-${myID}.db`, new File("file://" + db.databasePath));
      Logger.debug("syncData: Database copied to WebDav server");
    }

    await putWebDavDeviceLastSync({ webDavClient, deviceId: myID });
    if (!background) {
      showMessage({
        message: "Data synchronized with WebDav",
        type: "success",
        duration: 4000,
      });
    }
    return { synced: copyDB ? "changed" : "unchanged", multi: false };
  }

  Logger.debug("syncData: Other devices found on WebDav, checking for changes");

  // get date of last sync
  const lastSyncDate = remoteDevices.find((dev) => dev.id === myID)?.lastModified ?? new Date();
  const oldestDevice = remoteDevices.reduce((oldest, dev) => dev.lastModified < oldest.lastModified ? dev : oldest, remoteDevices[0]);
  Logger.debug("syncData: Last sync date: ", lastSyncDate);

  // delete remote actions older than oldest device last sync
  for (const action of remoteActions) {
    if (new Date(action.lastmod) <= oldestDevice.lastModified) {
      Logger.debug("syncData: Remote action older than oldest device last sync, deleting remote action: ", action.basename);
      await webDavClient.deleteFile(`/actions/${action.basename}`);
      remoteActions.splice(remoteActions.indexOf(action), 1);
    }
  }

  // Mise en place des actions à exécuter, triées par date
  const actionOrders: { remote: boolean, date: number, actionType: string, actionId: string, deviceId: string, name: string }[] = [];
  // Collecte des actions locales
  for (const action of localActions) {
    const match = action.name.match(fileActionsRegexp);
    if (!match) {
      Logger.debug("syncData: Skipping invalid action file: ", action.name);
      continue;
    }
    const [, actionType, actionId, timestamp, deviceId,] = match;
    actionOrders.push({ remote: false, date: Number(timestamp), actionType, actionId, deviceId, name: action.name });
  }
  // Collecte des actions distantes
  for (const action of remoteActions) {
    const match = action.basename.match(fileActionsRegexp);
    if (!match) {
      Logger.debug("syncData: Skipping invalid action file: ", action.basename);
      continue;
    }
    const [, actionType, actionId, timestamp, deviceId,] = match;
    if (deviceId === myID) {
      Logger.debug("syncData: Skipping remote action from this device: ", action.basename);
      continue;
    }
    if (new Date(timestamp) <= lastSyncDate) {
      Logger.debug("syncData: Skipping remote action older than last sync date: ", action.basename);
      continue;
    }
    actionOrders.push({ remote: true, date: Number(timestamp), actionType, actionId, deviceId, name: action.basename });
  }
  // Si aucune action à exécuter, on sort
  if (actionOrders.length === 0) {
    Logger.debug("syncData: No actions found to synchronize");
    return { synced: "unchanged", multi: true };
  }
  // Récupération de la liste des images distantes pour les actions de type "copy"
  const remoteImages: FileStat[] = (await getRemoteDirectoryContents(webDavClient, "/images/")).filter((item) => item.type === "file");
  // Tri des actions par date
  actionOrders.sort((a, b) => a.date - b.date);
  for (const action of actionOrders) {
    Logger.debug(`syncData: Action found: ${action.remote ? "R" : "L"}: ${action.name} @ ${new Date(action.date).toISOString()}`);
    if (action.remote) {
      // Execute remote action
      const content = await webDavClient.getFileContents(`/actions/${action.name}`, { format: "text" }) as string;
      if (action.actionType === "query") {
        Logger.debug("syncData: Executing remote query action: ", action.name);
        await execQuery(db, content);
      } else if (action.actionType === "copy") {
        if (remoteImages.find((ri) => ri.basename === content)) {
          // importer l'image distante
          Logger.debug("syncData: Executing remote image import action: ", action.name);
          await importRemoteFile(webDavClient, `/images/${content}`, imgStoreDir.uri + "/" + content);
          modified = true;
        }
        else {
          // image distante non trouvée, elle a du être supprimé après l'action
          Logger.debug("syncData: Remote image for copy action not found: ", content);
        }
      } else if (action.actionType === "del") {
        const localImage2Del = localimages.find((li) => li.name === content);
        if (localImage2Del && localImage2Del.exists) {
          Logger.debug("syncData: Executing remote image delete action: ", action.name);
          localImage2Del.delete();
          modified = true;
        }
        else {
          // image locale non trouvée, elle a du être supprimée après l'action
          Logger.debug("syncData: Local image for delete action not found: ", content);
        }
      }
      else {
        Logger.error("syncData: Unknown remote action type: ", action.actionType);
      }
    } else {
      // Put local action on WebDav
      const actionFile = localActions.find((la) => la.name === action.name);
      if (!actionFile || !actionFile.exists) {
        Logger.error("syncData: Local action file not found: ", action.name);
        continue;
      }
      if (action.actionType === "query") {
        copyDB = true;
        Logger.debug("syncData: Uploading local query action to WebDav: ", action.name);
        await putRemoteFile(webDavClient, `/actions/${action.name}`, actionFile);
        modified = true;
      } else if (action.actionType === "copy") {
        const content = await actionFile.text();
        const localImage2Copy = localimages.find((li) => li.name === content);
        if (localImage2Copy && localImage2Copy.exists) {
          Logger.debug("syncData: Uploading local image copy action to WebDav: ", action.name);
          await putRemoteFile(webDavClient, `/images/${localImage2Copy.name}`, localImage2Copy);
          await putRemoteFile(webDavClient, `/actions/${action.name}`, actionFile);
          modified = true;
        }
        else {
          Logger.debug("syncData: Local image for copy action not found: ", content);
        }
      }
      else if (action.actionType === "del") {
        const file2del = await actionFile.text();
        Logger.debug("syncData: Uploading local image delete action to WebDav: ", action.name);
        if (remoteImages.find((ri) => ri.basename === file2del)) {
          Logger.debug("syncData: Remote image found for delete action: ", file2del);
          await putRemoteFile(webDavClient, `/actions/${action.name}`, actionFile);
          modified = true;
        }
        else {
          Logger.debug("syncData: Remote image for delete action not found: ", file2del);
        }
      }
      else {
        Logger.error("syncData: Unknown local action type: ", action.actionType);
      }
    }
  }
  await clearActionsStore();
  if (copyDB) {
    await putRemoteFile(webDavClient, `/databases/skis-manager-${myID}.db`, new File("file://" + db.databasePath));
    Logger.debug("syncData: Database copied to WebDav server");
    modified = true;
  }
  await putWebDavDeviceLastSync({ webDavClient, deviceId: myID });
  if (!background) {
    showMessage({
      message: "Data synchronized with WebDav",
      type: "success",
      duration: 4000,
    });
  }
  return { synced: modified ? "changed" : "unchanged", multi: true };
}