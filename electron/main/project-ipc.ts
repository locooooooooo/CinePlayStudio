import { app, dialog, ipcMain, type BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ProjectRepository, type ProjectRepositoryResult, type ProjectSnapshot, type ProjectStoragePort } from "../../src/project/project-repository";
import { safeParseProjectDocument, type ProjectDocument } from "../../shared/contracts/project";
import { DESKTOP_PROJECT_CHANNELS, type ProjectSnapshotPayload } from "../../shared/contracts/desktop-project";
import { assertTrustedSender, type AppInfoIpcContext } from "./app-info-ipc";

const storage: ProjectStoragePort = {
  ensureDirectory: (directoryPath) => fs.mkdir(directoryPath, { recursive: true }).then(() => undefined),
  exists: async (filePath) => fs.access(filePath).then(() => true).catch(() => false),
  readFile: (filePath) => fs.readFile(filePath, "utf8"),
  writeFile: (filePath, content) => fs.writeFile(filePath, content, "utf8"),
  copyFile: (source, destination) => fs.copyFile(source, destination).then(() => undefined),
  rename: (source, destination) => fs.rename(source, destination),
  removeFile: (filePath) => fs.rm(filePath, { force: true }),
};

const repository = new ProjectRepository(storage);

export function registerProjectIpc(context: AppInfoIpcContext): () => void {
  ipcMain.handle(DESKTOP_PROJECT_CHANNELS.open, async (event, request: unknown) => {
    assertTrustedSender(event, context);
    const input = record(request);
    if (input.mode === "choose") return chooseDirectory(context.getMainWindow());
    const projectRoot = requiredString(input.projectRoot, "projectRoot");
    return toPayload(await repository.open(normalizeRoot(projectRoot)), normalizeRoot(projectRoot));
  });

  ipcMain.handle(DESKTOP_PROJECT_CHANNELS.create, async (event, request: unknown) => {
    assertTrustedSender(event, context);
    const input = record(request);
    const projectRoot = normalizeRoot(requiredString(input.projectRoot, "projectRoot"));
    const document = parseDocument(input.document);
    return toPayload(await repository.create(projectRoot, document), projectRoot);
  });

  ipcMain.handle(DESKTOP_PROJECT_CHANNELS.save, async (event, request: unknown) => {
    assertTrustedSender(event, context);
    const input = record(request);
    const projectRoot = normalizeRoot(requiredString(input.projectRoot, "projectRoot"));
    const document = parseDocument(input.document);
    const expectedRevision = requiredString(input.expectedRevision, "expectedRevision");
    return toPayload(await repository.save(projectRoot, document, expectedRevision), projectRoot);
  });

  ipcMain.handle(DESKTOP_PROJECT_CHANNELS.importAsset, async (event, request: unknown) => {
    assertTrustedSender(event, context);
    const projectRoot = normalizeRoot(requiredString(record(request).projectRoot, "projectRoot"));
    const selection = await dialog.showOpenDialog(context.getMainWindow() ?? undefined, {
      title: "导入本地素材",
      properties: ["openFile"],
      filters: [{ name: "媒体文件", extensions: ["mp4", "mov", "mkv", "webm", "mp3", "wav", "m4a", "png", "jpg", "jpeg", "webp"] }],
    });
    if (selection.canceled || selection.filePaths.length !== 1) return null;

    const sourcePath = selection.filePaths[0];
    const type = mediaTypeFor(sourcePath);
    const assetDirectory = path.join(projectRoot, "assets");
    await fs.mkdir(assetDirectory, { recursive: true });
    const targetName = `${randomUUID()}-${path.basename(sourcePath)}`;
    const targetPath = path.join(assetDirectory, targetName);
    await fs.copyFile(sourcePath, targetPath);
    const stat = await fs.stat(targetPath);
    return { path: `assets/${targetName}`, name: path.basename(sourcePath), sizeBytes: stat.size, durationSeconds: 0, type };
  });

  ipcMain.handle(DESKTOP_PROJECT_CHANNELS.exportMp4, async (event, request: unknown) => {
    assertTrustedSender(event, context);
    const input = record(request);
    const projectRoot = normalizeRoot(requiredString(input.projectRoot, "projectRoot"));
    const assetPath = resolveWithin(projectRoot, requiredString(input.assetPath, "assetPath"));
    const durationSeconds = Number(input.durationSeconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("durationSeconds must be positive.");
    const exportDirectory = path.join(projectRoot, "exports");
    await fs.mkdir(exportDirectory, { recursive: true });
    const outputPath = path.join(exportDirectory, `preview-${Date.now()}.mp4`);
    await runFfmpeg(assetPath, durationSeconds, outputPath);
    const outputStat = await fs.stat(outputPath);
    if (outputStat.size < 1024) throw new Error("FFmpeg did not produce a valid MP4 output.");
    return { outputPath };
  });

  return () => {
    for (const channel of Object.values(DESKTOP_PROJECT_CHANNELS)) ipcMain.removeHandler(channel);
  };
}

function chooseDirectory(parent: BrowserWindow | null): Promise<string | null> {
  return dialog.showOpenDialog(parent ?? undefined, { title: "选择影游项目目录", properties: ["openDirectory", "createDirectory"] })
    .then((result) => result.canceled || result.filePaths.length !== 1 ? null : result.filePaths[0]);
}

function toPayload(result: ProjectRepositoryResult<ProjectSnapshot>, projectRoot: string): ProjectSnapshotPayload {
  if (result.ok === false) throw Object.assign(new Error(result.message), { code: result.code });
  return { ...result.value, projectRoot };
}

function parseDocument(value: unknown): ProjectDocument {
  const parsed = safeParseProjectDocument(value);
  if (!parsed.success) throw new Error("The project document is invalid.");
  return parsed.data;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Invalid IPC request.");
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} is required.`);
  return value;
}

function normalizeRoot(value: string): string { return path.resolve(value); }

function resolveWithin(root: string, relativePath: string): string {
  const candidate = path.resolve(root, relativePath);
  if (path.relative(root, candidate).startsWith("..") || path.isAbsolute(path.relative(root, candidate))) throw new Error("Path is outside the selected project directory.");
  return candidate;
}

function mediaTypeFor(filePath: string): "video" | "audio" | "image" {
  const extension = path.extname(filePath).toLowerCase();
  if ([".mp3", ".wav", ".m4a"].includes(extension)) return "audio";
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return "image";
  return "video";
}

function runFfmpeg(inputPath: string, durationSeconds: number, outputPath: string): Promise<void> {
  const binaryPath = app.isPackaged
    ? path.join(process.resourcesPath, "bin", "ffmpeg.exe")
    : path.join(app.getAppPath(), "build-resources", "bin", "win32-x64", "ffmpeg.exe");
  const args = ["-y", "-i", inputPath, "-t", durationSeconds.toString(), "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart", outputPath];
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-2000) || `FFmpeg exited with ${code}.`)));
  });
}
