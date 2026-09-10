import { contextBridge, ipcRenderer } from "electron";
import {
  APP_INFO_CHANNEL,
  type AppInfo,
  type CinePlayStudioApi,
  isAppInfo,
} from "../../shared/contracts/app-info";
import { DESKTOP_PROJECT_CHANNELS, type ProjectApi } from "../../shared/contracts/desktop-project";

const appApi = Object.freeze({
  async getInfo(): Promise<AppInfo> {
    const result: unknown = await ipcRenderer.invoke(APP_INFO_CHANNEL);
    if (!isAppInfo(result)) {
      throw new Error("Invalid app info response.");
    }

    return Object.freeze({ ...result });
  },
});

const projectApi: ProjectApi = Object.freeze({
  chooseDirectory: () => ipcRenderer.invoke(DESKTOP_PROJECT_CHANNELS.open, { mode: "choose" }),
  create: (projectRoot, document) => ipcRenderer.invoke(DESKTOP_PROJECT_CHANNELS.create, { projectRoot, document }),
  open: (projectRoot) => ipcRenderer.invoke(DESKTOP_PROJECT_CHANNELS.open, { mode: "open", projectRoot }),
  save: (projectRoot, document, expectedRevision) => ipcRenderer.invoke(DESKTOP_PROJECT_CHANNELS.save, { projectRoot, document, expectedRevision }),
  importAsset: (projectRoot) => ipcRenderer.invoke(DESKTOP_PROJECT_CHANNELS.importAsset, { projectRoot }),
  exportMp4: (projectRoot, assetPath, durationSeconds) => ipcRenderer.invoke(DESKTOP_PROJECT_CHANNELS.exportMp4, { projectRoot, assetPath, durationSeconds }),
});

const cinePlayStudioApi: CinePlayStudioApi = Object.freeze({ app: appApi, project: projectApi });

contextBridge.exposeInMainWorld("cinePlayStudio", cinePlayStudioApi);
