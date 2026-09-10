import { validProjectDocument } from "./valid-project";

function cloneProject(): Record<string, unknown> {
  return structuredClone(validProjectDocument) as unknown as Record<
    string,
    unknown
  >;
}

function firstAsset(project: Record<string, unknown>): Record<string, unknown> {
  return (project.assets as Array<Record<string, unknown>>)[0];
}

function firstClip(project: Record<string, unknown>): Record<string, unknown> {
  const timelines = project.timelines as Record<
    string,
    Array<Record<string, unknown>>
  >;
  const tracks = Object.values(timelines)[0];
  return (tracks[0].clips as Array<Record<string, unknown>>)[0];
}

export const invalidProjectFixtures = {
  missingRequiredField: (() => {
    const project = cloneProject();
    delete project.name;
    return project;
  })(),
  duplicateAssetId: (() => {
    const project = cloneProject();
    const assets = project.assets as Array<Record<string, unknown>>;
    assets.push({ ...assets[0], name: "Duplicate Asset" });
    return project;
  })(),
  missingAssetReference: (() => {
    const project = cloneProject();
    firstClip(project).assetId = "asset-missing";
    return project;
  })(),
  missingTrackReference: (() => {
    const project = cloneProject();
    firstClip(project).trackId = "track-missing";
    return project;
  })(),
  outOfRangeClipTiming: (() => {
    const project = cloneProject();
    firstClip(project).startTime = 10;
    firstClip(project).duration = 3;
    return project;
  })(),
  unknownTimelineKey: (() => {
    const project = cloneProject();
    const timelines = project.timelines as Record<
      string,
      Array<Record<string, unknown>>
    >;
    timelines["scene-missing"] = timelines["timeline-main"];
    delete timelines["timeline-main"];
    return project;
  })(),
  missingSceneDuration: (() => {
    const project = cloneProject();
    const scenes = project.scenes as Array<Record<string, unknown>>;
    delete scenes[0].duration;
    return project;
  })(),
  absoluteAssetPath: (() => {
    const project = cloneProject();
    firstAsset(project).path = "/outside/video.mp4";
    return project;
  })(),
  traversalAssetPath: (() => {
    const project = cloneProject();
    firstAsset(project).path = "../outside/video.mp4";
    return project;
  })(),
  invalidSize: (() => {
    const project = cloneProject();
    firstAsset(project).sizeBytes = Number.NaN;
    return project;
  })(),
  invalidTimestamp: (() => {
    const project = cloneProject();
    project.createdAt = "2026-02-30T00:00:00Z";
    return project;
  })(),
  unsupportedHigherSchemaVersion: (() => {
    const project = cloneProject();
    project.schemaVersion = 2;
    return project;
  })(),
  executablePluginField: (() => {
    const project = cloneProject();
    const plugins = project.pluginDescriptors as Array<Record<string, unknown>>;
    plugins[0].code = "return execute();";
    return project;
  })(),
} as const;
