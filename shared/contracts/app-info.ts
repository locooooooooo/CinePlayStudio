export const APP_INFO_CHANNEL = "app:get-info" as const;

export type DesktopPlatform = "win32" | "darwin" | "linux" | "other";

export interface AppInfo {
  readonly name: string;
  readonly version: string;
  readonly platform: DesktopPlatform;
  readonly packaged: boolean;
}

export interface AppInfoApi {
  getInfo(): Promise<AppInfo>;
}

export interface GameEditorApi {
  readonly app: AppInfoApi;
}

export function isAppInfo(value: unknown): value is AppInfo {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.length === 4 &&
    keys.every(
      (key) =>
        key === "name" ||
        key === "version" ||
        key === "platform" ||
        key === "packaged",
    ) &&
    typeof value.name === "string" &&
    typeof value.version === "string" &&
    isDesktopPlatform(value.platform) &&
    typeof value.packaged === "boolean"
  );
}

export function toDesktopPlatform(platform: string): DesktopPlatform {
  if (platform === "win32" || platform === "darwin" || platform === "linux") {
    return platform;
  }

  return "other";
}

function isDesktopPlatform(value: unknown): value is DesktopPlatform {
  return (
    value === "win32" ||
    value === "darwin" ||
    value === "linux" ||
    value === "other"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
