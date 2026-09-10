import type { ProjectDocument } from "./project";

export const DESKTOP_PROJECT_CHANNELS = {
  create: "project:create",
  open: "project:open",
  save: "project:save",
  importAsset: "project:import-asset",
  exportMp4: "project:export-mp4",
} as const;

export interface ProjectSnapshotPayload {
  document: ProjectDocument;
  revision: string;
  recoveryPath: string;
  projectRoot: string;
}

export interface ProjectApi {
  chooseDirectory(): Promise<string | null>;
  create(projectRoot: string, document: ProjectDocument): Promise<ProjectSnapshotPayload>;
  open(projectRoot: string): Promise<ProjectSnapshotPayload>;
  save(projectRoot: string, document: ProjectDocument, expectedRevision: string): Promise<ProjectSnapshotPayload>;
  importAsset(projectRoot: string): Promise<{ path: string; name: string; sizeBytes: number; durationSeconds: number; type: "video" | "audio" | "image" } | null>;
  exportMp4(projectRoot: string, assetPath: string, durationSeconds: number): Promise<{ outputPath: string }>;
}

export interface DesktopProjectError {
  code: string;
  message: string;
}
