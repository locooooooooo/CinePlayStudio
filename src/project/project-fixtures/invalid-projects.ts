import { cloneValidProjectDocument } from "./valid-project";

type FixtureRecord = Record<string, unknown>;

function cloneAsRecord(): FixtureRecord {
  return cloneValidProjectDocument() as unknown as FixtureRecord;
}

function firstAsset(project: FixtureRecord): FixtureRecord {
  return (project.assets as Array<FixtureRecord>)[0];
}

function firstClip(project: FixtureRecord): FixtureRecord {
  const timelines = project.timelines as Record<string, Array<FixtureRecord>>;
  return (timelines["timeline-main"][0].clips as Array<FixtureRecord>)[0];
}

export const invalidProjectFixtures = {
  missingRequiredField: (() => {
    const project = cloneAsRecord();
    delete project.name;
    return project;
  })(),
  missingAssetReference: (() => {
    const project = cloneAsRecord();
    firstClip(project).assetId = "asset-missing";
    return project;
  })(),
  missingTrackReference: (() => {
    const project = cloneAsRecord();
    firstClip(project).trackId = "track-missing";
    return project;
  })(),
  outOfRangeClipTiming: (() => {
    const project = cloneAsRecord();
    firstClip(project).startTime = 10;
    firstClip(project).duration = 3;
    return project;
  })(),
  unknownTimelineKey: (() => {
    const project = cloneAsRecord();
    const timelines = project.timelines as Record<string, Array<FixtureRecord>>;
    timelines["scene-missing"] = timelines["timeline-main"];
    delete timelines["timeline-main"];
    return project;
  })(),
  absoluteAssetPath: (() => {
    const project = cloneAsRecord();
    firstAsset(project).path = "/outside/video.mp4";
    return project;
  })(),
  traversalAssetPath: (() => {
    const project = cloneAsRecord();
    firstAsset(project).path = "../outside/video.mp4";
    return project;
  })(),
  unsupportedHigherSchemaVersion: (() => {
    const project = cloneAsRecord();
    project.schemaVersion = 2;
    return project;
  })(),
} as const;
