import {
  app,
  ipcMain,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from "electron";
import { fileURLToPath } from "node:url";
import {
  APP_INFO_CHANNEL,
  type AppInfo,
  toDesktopPlatform,
} from "../../shared/contracts/app-info";

export interface AppInfoIpcContext {
  getMainWindow(): BrowserWindow | null;
  getTrustedRendererUrl(): string | null;
}

export function registerAppInfoIpc(context: AppInfoIpcContext): () => void {
  ipcMain.handle(APP_INFO_CHANNEL, (event): AppInfo => {
    assertTrustedSender(event, context);

    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: toDesktopPlatform(process.platform),
      packaged: app.isPackaged,
    };
  });

  return () => {
    ipcMain.removeHandler(APP_INFO_CHANNEL);
  };
}

export function assertTrustedSender(
  event: IpcMainInvokeEvent,
  context: AppInfoIpcContext,
): void {
  const mainWindow = context.getMainWindow();
  const trustedRendererUrl = context.getTrustedRendererUrl();
  if (!mainWindow || mainWindow.isDestroyed() || !trustedRendererUrl) {
    throw new Error("IPC sender rejected: main window is unavailable.");
  }

  if (
    event.sender !== mainWindow.webContents ||
    event.senderFrame !== mainWindow.webContents.mainFrame ||
    !hasTrustedRendererOrigin(event.senderFrame.url, trustedRendererUrl)
  ) {
    throw new Error("IPC sender rejected.");
  }
}

function hasTrustedRendererOrigin(
  senderUrl: string,
  trustedRendererUrl: string,
): boolean {
  try {
    const sender = new URL(senderUrl);
    const trusted = new URL(trustedRendererUrl);

    if (trusted.protocol === "file:") {
      return (
        sender.protocol === "file:" &&
        fileURLToPath(sender) === fileURLToPath(trusted)
      );
    }

    return sender.origin === trusted.origin;
  } catch {
    return false;
  }
}
