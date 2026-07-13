import { app, BrowserWindow, type Session } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PRODUCTION_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "manifest-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join("; ");

const LOCAL_RENDERER_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const configuredSessions = new WeakSet<Session>();

export interface MainWindowContext {
  readonly window: BrowserWindow;
  readonly trustedRendererUrl: string;
  readonly ready: Promise<void>;
}

export function createMainWindow(): MainWindowContext {
  const preloadPath = path.join(__dirname, "../preload/index.cjs");
  const rendererUrl = resolveRendererUrl();
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: "#111111",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      navigateOnDragDrop: false,
      devTools: !app.isPackaged,
    },
  });

  configureSession(window.webContents.session);
  installNavigationGuards(window);

  window.once("ready-to-show", () => {
    if (!window.isDestroyed()) {
      window.show();
    }
  });

  const ready = app.isPackaged
    ? window.loadFile(fileURLToPath(rendererUrl))
    : window.loadURL(rendererUrl);

  return { window, trustedRendererUrl: rendererUrl, ready };
}

function configureSession(electronSession: Session): void {
  if (configuredSessions.has(electronSession)) {
    return;
  }

  configuredSessions.add(electronSession);
  electronSession.setPermissionCheckHandler(() => false);
  electronSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    },
  );

  if (app.isPackaged) {
    electronSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [PRODUCTION_CONTENT_SECURITY_POLICY],
        },
      });
    });
  }
}

function installNavigationGuards(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  window.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  window.webContents.on("will-redirect", (event) => {
    event.preventDefault();
  });

  window.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
}

function resolveRendererUrl(): string {
  if (app.isPackaged) {
    return pathToFileURL(
      path.join(app.getAppPath(), "dist/renderer/index.html"),
    ).href;
  }

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (!rendererUrl) {
    throw new Error("ELECTRON_RENDERER_URL is required in development mode.");
  }

  const parsedUrl = new URL(rendererUrl);
  if (
    parsedUrl.protocol !== "http:" ||
    !LOCAL_RENDERER_HOSTS.has(parsedUrl.hostname) ||
    parsedUrl.username !== "" ||
    parsedUrl.password !== ""
  ) {
    throw new Error(
      "Development renderer URL must use HTTP on a loopback host.",
    );
  }

  parsedUrl.hash = "";
  return parsedUrl.href;
}
