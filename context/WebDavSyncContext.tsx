import { createContext, useContext, useEffect, useState } from "react";
import { AuthType, createClient, FileStat, WebDAVClient } from "webdav";
import SettingsContext from "./SettingsContext";
import { syncData } from "@/hooks/SyncWebDav";
import { useSQLiteContext } from "expo-sqlite";

export interface WebDavSyncContextType {
  webDavSyncMode: 'none' | 'mono' | 'multi' | 'wait';
  updateWebDavSyncMode: (mode: 'none' | 'mono' | 'multi' | 'wait', webDavSyncDevices?: { id: string, fileStat: FileStat | null }[]) => void;
  webDavLastSync?: number;
  webDavStatus?: "synced" | "syncing" | "error" | "disabled" | "never";
  updateWebDavStatus: (status: "synced" | "syncing" | "error" | "disabled" | "never", error?: string) => void;
  webDavError?: string;
  webDavSyncDevices?: { id: string, fileStat: FileStat | null }[];
}

const WebDavSyncContext = createContext<WebDavSyncContextType | null>(null);

async function getRemoteDirectoryContents(client: any, path: string): Promise<FileStat[]> {
  const contentsRaw = await client.getDirectoryContents(path);
  const contents: FileStat[] = Array.isArray(contentsRaw)
    ? contentsRaw
    : (contentsRaw.data as FileStat[]);
  return contents;
}


export const WebDavSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const [webDavSyncMode, setWebDavSyncMode] = useState<'none' | 'mono' | 'multi' | 'wait'>('none');
  const [webDavLastSync, setWebDavLastSync] = useState<number>(0);
  const [webDavStatus, setWebDavStatus] = useState<"synced" | "syncing" | "error" | "disabled" | "never">("disabled");
  const [webDavError, setWebDavError] = useState<string>("");
  const [webDavSyncDevices, setWebDavSyncDevices] = useState<{ id: string, fileStat: FileStat | null }[]>([]);
  let interval: any = null;

  // Get WebDav settings from SettingsContext
  const { webDavSyncEnabled, webDavUrl, webDavUser, webDavPassword, webDavSyncPeriod } = useContext(SettingsContext)!;
  const db = useSQLiteContext();
  if (!db) {
    throw new Error("Database not initialized");
  }

  // Update WebDav settings if they change
  useEffect(() => {
    if (webDavSyncEnabled) {
      console.debug("WebDav sync is enabled");
      setWebDavSyncMode('wait');
      setWebDavSyncDevices([]);
      setWebDavStatus("never");
      interval = setInterval(async () => {
        await syncData({ db: db, webDavUrl, webDavUser, webDavPassword, webDavSyncMode, webDavStatus, updateWebDavStatus, updateWebDavSyncMode });
      }, webDavSyncPeriod * 1000);
    }
    else {
      console.debug("WebDav sync is disabled");
      setWebDavSyncMode('none');
      setWebDavSyncDevices([]);
      setWebDavStatus("disabled");
      if (interval) clearInterval(interval);
    }
  }, [webDavSyncEnabled]);

  const updateWebDavStatus = (status: "synced" | "syncing" | "error" | "disabled" | "never", error?: string) => {
    setWebDavStatus(status);
    if (status === "synced") {
      setWebDavLastSync(new Date().getTime());
    } else if (status === "error" && error) {
      setWebDavError(error);
    }
  }

  const updateWebDavSyncMode = (mode: 'none' | 'mono' | 'multi' | 'wait', webDavSyncDevices?: { id: string, fileStat: FileStat | null }[]) => {
    setWebDavSyncMode(mode);
    if (webDavSyncDevices && mode !== 'none') {
      setWebDavSyncDevices(webDavSyncDevices);
    } else {
      setWebDavSyncDevices([]);
    }
  }

  // Create WebDav client
  const context: WebDavSyncContextType = {
    webDavSyncMode,
    updateWebDavSyncMode,
    webDavLastSync,
    webDavStatus,
    updateWebDavStatus,
    webDavError,
    webDavSyncDevices,
  };

  return (
    <WebDavSyncContext.Provider value={context}>
      {children}
    </WebDavSyncContext.Provider>
  );
}

export default WebDavSyncContext;