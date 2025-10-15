import { Buffer } from "buffer";
import { SQLiteDatabase } from "expo-sqlite";
import { showMessage } from "react-native-flash-message";
import { AuthType, createClient, FileStat, WebDAVClient } from "webdav";
import { cancelConcatQueries, execQuery, startConcatQueries } from "./DataManager";
import { imgStoreDir, actionsStoreDir } from "./DataManager";
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
  const regexp = /^.[a-z]+-([0-9]*)-.+$/;
  // get remote devices
  const remoteDevices = await getWebDavDevices(webDavClient);
  // check if local data has changed since last sync
  const localimages: File[] = imgStoreDir.list().filter((item) => item instanceof File);
  const localActions: File[] = actionsStoreDir.list().filter((item) => item instanceof File);
  const remoteImages: FileStat[] = (await getRemoteDirectoryContents(webDavClient, "/images/")).filter((item) => item.type === "file");
  const remoteActions: FileStat[] = (await getRemoteDirectoryContents(webDavClient, "/actions/")).filter((item) => item.type === "file");
  const localImagesNotInRemote = localimages.filter((item) => !remoteImages.map((ri) => ri.basename).includes(item.name));
  if (localImagesNotInRemote.length > 0) {
    Logger.debug("syncData: Found local images not in remote: ", localImagesNotInRemote.map((li) => li.name));
  }
  const localActionsNotInRemote = localActions.filter((item) => !remoteActions.map((ri) => ri.basename).includes(item.name));
  if (localActionsNotInRemote.length > 0) {
    Logger.debug("syncData: Found local actions not in remote: ", localActionsNotInRemote.map((la) => la.name));
  }


  // if no other remote devices, upload local data and exit
  if (remoteDevices.length === 0 || (remoteDevices.length === 1 && remoteDevices[0].id === myID)) {
    Logger.debug("syncData: No other devices found on WebDav, skipping sync and uploading local data");
    try {
      // upload database if it has changed or if any query actions are present
      if (localActionsNotInRemote.find((action) => action.name.startsWith("query_"))) {
        await putRemoteFile(webDavClient, `/databases/skis-manager-${myID}.db`, new File("file://" + db.databasePath));
        Logger.debug("syncData: Database copied to WebDav server");
        modified = true;
      }
      if (localImagesNotInRemote.length > 0) {
        Logger.debug("syncData: Uploading new images to WebDav server");
        for (const image of localImagesNotInRemote) {
          await putRemoteFile(webDavClient, `/images/${image.name}`, image);
          modified = true;
        }
      }
      if (localActionsNotInRemote.length > 0) {
        Logger.debug("syncData: Uploading new actions to WebDav server");
        for (const action of localActionsNotInRemote) {
          await putRemoteFile(webDavClient, `/actions/${action.name}`, action);
          modified = true;
        }
      }
      await putWebDavDeviceLastSync({ webDavClient, deviceId: myID });
    } catch (error) {
      Logger.error("syncData: Error uploading local data: ", error);
      return { synced: "error", multi: false, error: error instanceof Error ? error.message : String(error) };
    }
    if (!background) {
      showMessage({
        message: "Data synchronized with WebDav",
        type: "success",
        duration: 4000,
      });
    }
    return { synced: modified ? "changed" : "unchanged", multi: false };
  }
  // if other remote devices are present, check for changes
  const remoteImagesNotInLocal = remoteImages.filter((item) => !localimages.map((li) => li.name).includes(item.basename));
  if (remoteImagesNotInLocal.length > 0) {
    Logger.debug("syncData: Found remote images not in local: ", remoteImagesNotInLocal.map((ri) => ri.basename));
  }
  const remoteActionsNotInLocal = remoteActions.filter((item) => !localActions.map((li) => li.name).includes(item.basename));
  if (remoteActionsNotInLocal.length > 0) {
    Logger.debug("syncData: Found remote actions not in local: ", remoteActionsNotInLocal.map((ra) => ra.basename));
  }
  // check if local database has changed since last sync
  if (localImagesNotInRemote.length === 0 && localActionsNotInRemote.length === 0 && remoteImagesNotInLocal.length === 0 && remoteActionsNotInLocal.length === 0) {
    Logger.debug("syncData: No changes detected between local and remote stores, skipping sync");
    await putWebDavDeviceLastSync({ webDavClient, deviceId: myID });
    return { synced: "unchanged", multi: true };
  }
  // if changes are detected, sort actions in chronological order
  const actionOrders: { remote: boolean, date: number, actionType: string, actionId: string, deviceId: string, name: string }[] = [];
  const valideFilesRegexp = /^(del|copy|query)_([^_]+)_([0-9]{10,})_([a-zA-Z0-9]{4})\.(sql|file)$/;
  for (const action of localActionsNotInRemote) {
    const match = action.name.match(valideFilesRegexp);
    if (!match) {
      Logger.debug("syncData: Skipping invalid action file: ", action.name);
      continue;
    }
    const [, actionType, actionId, timestamp, deviceId,] = match;
    actionOrders.push({ remote: false, date: Number(timestamp), actionType, actionId, deviceId, name: action.name });
  }
  for (const action of remoteActionsNotInLocal) {
    const match = action.basename.match(valideFilesRegexp);
    if (!match) {
      Logger.debug("syncData: Skipping invalid action file: ", action.basename);
      continue;
    }
    const [, actionType, actionId, timestamp, deviceId,] = match;
    actionOrders.push({ remote: true, date: Number(timestamp), actionType, actionId, deviceId, name: action.basename });
  }
  actionOrders.sort((a, b) => a.date - b.date);
  // remove duplicate actions (same actionId) keeping the last one
  const actionOrdersReduced: typeof actionOrders = [];
  for (const action of actionOrders) {
    const index = actionOrdersReduced.findIndex((a) => a.actionId === action.actionId);
    if (index !== -1) {
      actionOrdersReduced.splice(index, 1);
    }
    actionOrdersReduced.push(action);
  }
  Logger.debug(`syncData: ${actionOrders.length} actions found, ${actionOrdersReduced.length} unique actions to process`);
  // execute actions in order
  startConcatQueries();
  for (const actionOrder of actionOrdersReduced) {
    Logger.debug(`syncData: Processing action: ${actionOrder.remote ? "R" : "L"}: ${actionOrder.name} @ ${new Date(actionOrder.date).toISOString()}`);
    // If remote action, fetch content and execute
    if (actionOrder.remote) {
      const content = await webDavClient.getFileContents(`/actions/${actionOrder.name}`, { format: "text" }) as string;
      // if query, execute it
      if (actionOrder.actionType === "query") {
        try {
          await execQuery(db, content, "webdav-sync");
          await importRemoteFile(webDavClient, `/actions/${actionOrder.name}`, actionsStoreDir.uri + actionOrder.name);
          modified = true;
          copyDB = true;
        } catch (error) {
          Logger.error("syncData: Error executing remote query action: ", actionOrder.name, error);
          if (!background) {
            showMessage({
              message: "Error executing remote query action: " + actionOrder.name,
              description: error instanceof Error ? error.message : String(error),
              type: "danger",
              duration: 10000,
            });
          }
          cancelConcatQueries();
          return { synced: "error", multi: true, error: error instanceof Error ? error.message : String(error) };
        }
      }
      else {
        // if image action, execute it
        try {
          // if delete action, delete local image if exists
          if (actionOrder.actionType === "del") {
            // delete local image if exists
            if (localimages.map((li) => li.name).includes(content)) {
              const localImage2Del = localimages.find((li) => li.name === content);
              if (localImage2Del && localImage2Del.exists) {
                localImage2Del.delete();
                modified = true;
              }
            }
            // remove from localImagesNotInRemote if present
            if (localImagesNotInRemote.map((li) => li.name).includes(content)) {
              localImagesNotInRemote.splice(localImagesNotInRemote.findIndex((li) => li.name === content), 1);
            }
          }
          else {
            const file2copy = new File(imgStoreDir.uri + actionOrder.name);
            if (remoteImages.map((ri) => ri.basename).includes(content)) {
              const localImage2Copy = localimages.find((li) => li.name === content);
              if (localImage2Copy && localImage2Copy.exists) {
                if (localImage2Copy.size === (remoteImages.find((ri) => ri.basename === content)?.size || 0)) {
                  continue;
                }
              }
              const remoteImage2Copy = remoteImages.find((ri) => ri.basename === content);
              if (remoteImage2Copy) {
                await importRemoteFile(webDavClient, `/images/${remoteImage2Copy.basename}`, imgStoreDir.uri + remoteImage2Copy.basename);
                modified = true;
              }
            }
          }
        } catch (error) {
          Logger.error("syncData: Error executing remote image action: ", actionOrder.name, error);
          if (!background) {
            showMessage({
              message: "Error executing remote image action: " + actionOrder.name,
              description: error instanceof Error ? error.message : String(error),
              type: "danger",
              duration: 10000,
            });
          }
          cancelConcatQueries();
          return { synced: "error", multi: true, error: error instanceof Error ? error.message : String(error) };
        }
      }
    }
    else {
      // if local action, upload it
      const actionFile = new File(actionsStoreDir.uri + actionOrder.name);
      try {
        await putRemoteFile(webDavClient, `/actions/${actionFile.name}`, actionFile);
        modified = true;
        if (actionOrder.actionType === "del") {
          const content = await actionFile.text();
          if (remoteImages.map((ri) => ri.basename).includes(content)) {
            await webDavClient.deleteFile(`/images/${content}`);
            modified = true;
          }
          if (remoteImagesNotInLocal.map((ra) => ra.basename).includes(content)) {
            remoteImagesNotInLocal.splice(remoteImagesNotInLocal.findIndex((ra) => ra.basename === content), 1);
            modified = true;
          }
        }
        else if (actionOrder.actionType === "copy") {
          const content = await actionFile.text();
          const localImage2Copy = localimages.find((li) => li.name === content);
          if (localImage2Copy) {
            await putRemoteFile(webDavClient, `/images/${content}`, localImage2Copy);
            modified = true;
          }
        }
        else if (actionOrder.actionType === "query") {
          copyDB = true;
        }
      } catch (error) {
        Logger.error("syncData: Error uploading local action file: ", actionFile.name, error);
        if (!background) {
          showMessage({
            message: "Error uploading local action file: " + actionFile.name,
            description: error instanceof Error ? error.message : String(error),
            type: "danger",
            duration: 10000,
          });
        }
        cancelConcatQueries();
        return { synced: "error", multi: true, error: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  cancelConcatQueries();
  if (copyDB) {
    try {
      await putRemoteFile(webDavClient, `/databases/skis-manager-${myID}.db`, new File("file://" + db.databasePath));
      Logger.debug("syncData: Database copied to WebDav server");
      modified = true;
    } catch (error) {
      Logger.error("syncData: Error uploading database file: ", error);
      if (!background) {
        showMessage({
          message: "Error uploading database file",
          description: error instanceof Error ? error.message : String(error),
          type: "danger",
          duration: 10000,
        });
      }
      return { synced: "error", multi: true, error: error instanceof Error ? error.message : String(error) };
    }
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



