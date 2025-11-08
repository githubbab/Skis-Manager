import { Buffer } from "buffer";
import { AuthType, createClient, FileStat, WebDAVClient } from "webdav";
import { imgStoreDir } from "./DataManager";
import { File } from "expo-file-system";
import { Logger } from "./ToolsBox";


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

async function importRemoteFile(client: WebDAVClient, remotePath: string, localPath: string): Promise<void> {
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

export async function importAllRemoteImages(client: WebDAVClient): Promise<void> {
  Logger.debug("Importing all remote images from WebDav server");
  const remoteImages: FileStat[] = (await getRemoteDirectoryContents(client, "/images/")).filter((item) => item.type === "file");

  for (const image of remoteImages) {
    const localPath = `${imgStoreDir.uri}/${image.basename}`;
    Logger.debug("Importing remote image: ", image.basename, " to ", localPath);

    await importRemoteFile(client, "/images/" + image.basename, localPath);
  }
}

async function getRemoteDirectoryContents(client: WebDAVClient, path: string): Promise<FileStat[]> {
  const contentsRaw = await client.getDirectoryContents(path);
  const contents: FileStat[] = Array.isArray(contentsRaw)
    ? contentsRaw
    : (contentsRaw.data as FileStat[]);
  return contents;
}
