import { app, BrowserWindow } from "electron";
import { registerAppInfoIpc } from "./app-info-ipc";
import { registerProjectIpc } from "./project-ipc";
import { createMainWindow } from "./window";

let mainWindow: BrowserWindow | null = null;
let trustedRendererUrl: string | null = null;
let unregisterAppInfoIpc: (() => void) | null = null;
let unregisterProjectIpc: (() => void) | null = null;

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
  });

  app
    .whenReady()
    .then(async () => {
      unregisterAppInfoIpc = registerAppInfoIpc({
        getMainWindow: () => mainWindow,
        getTrustedRendererUrl: () => trustedRendererUrl,
      });
      unregisterProjectIpc = registerProjectIpc({
        getMainWindow: () => mainWindow,
        getTrustedRendererUrl: () => trustedRendererUrl,
      });

      await openMainWindow();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          void openMainWindow().catch(handleShellFailure);
        }
      });
    })
    .catch(handleShellFailure);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("will-quit", () => {
    unregisterAppInfoIpc?.();
    unregisterAppInfoIpc = null;
    unregisterProjectIpc?.();
    unregisterProjectIpc = null;
  });
}

async function openMainWindow(): Promise<void> {
  const context = createMainWindow();
  mainWindow = context.window;
  trustedRendererUrl = context.trustedRendererUrl;

  context.window.once("closed", () => {
    if (mainWindow === context.window) {
      mainWindow = null;
      trustedRendererUrl = null;
    }
  });

  try {
    await context.ready;
  } catch (error: unknown) {
    if (!context.window.isDestroyed()) {
      context.window.destroy();
    }
    throw error;
  }
}

function handleShellFailure(error: unknown): void {
  console.error("Failed to initialize the desktop shell.", error);
  app.quit();
}
