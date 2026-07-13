import { contextBridge, ipcRenderer } from "electron";
import {
  APP_INFO_CHANNEL,
  type AppInfo,
  type GameEditorApi,
  isAppInfo,
} from "../../shared/contracts/app-info";

const appApi = Object.freeze({
  async getInfo(): Promise<AppInfo> {
    const result: unknown = await ipcRenderer.invoke(APP_INFO_CHANNEL);
    if (!isAppInfo(result)) {
      throw new Error("Invalid app info response.");
    }

    return Object.freeze({ ...result });
  },
});

const gameEditorApi: GameEditorApi = Object.freeze({ app: appApi });

contextBridge.exposeInMainWorld("gameEditor", gameEditorApi);
