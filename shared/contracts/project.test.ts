import { describe, expect, it } from "vitest";
import {
  AssetSchema,
  ExportSchema,
  PROJECT_SCHEMA_ERROR_CODES,
  ProjectDocumentSchema,
  ProjectRelativePathSchema,
  TimelineSchema,
  safeParseProjectDocument,
} from "./project";
import { invalidProjectFixtures } from "./project-fixtures/invalid-projects";
import {
  validExportJob,
  validProjectDocument,
} from "./project-fixtures/valid-project";

describe("canonical project document schema", () => {
  it("accepts the deterministic P0 project fixture and infers the root model", () => {
    const result = safeParseProjectDocument(validProjectDocument);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schemaVersion).toBe(1);
      expect(result.data.timelines["timeline-main"][0].clips[0].assetId).toBe(
        "asset-video",
      );
    }
  });

  it("requires stable IDs, UTC timestamps, numeric byte sizes, and required fields", () => {
    expect(
      ProjectDocumentSchema.safeParse(
        invalidProjectFixtures.missingRequiredField,
      ).success,
    ).toBe(false);
    expect(
      ProjectDocumentSchema.safeParse(invalidProjectFixtures.invalidTimestamp)
        .success,
    ).toBe(false);
    expect(
      ProjectDocumentSchema.safeParse(invalidProjectFixtures.invalidSize)
        .success,
    ).toBe(false);
    expect(
      ProjectDocumentSchema.safeParse(
        invalidProjectFixtures.missingSceneDuration,
      ).success,
    ).toBe(false);
    expect(
      AssetSchema.safeParse({
        id: "not stable/id",
        name: "Asset",
        type: "video",
        path: "media/video.mp4",
        sizeBytes: 1,
        durationSeconds: 1,
        availability: "available",
      }).success,
    ).toBe(false);
  });

  it("accepts only normalized project-relative POSIX asset paths", () => {
    expect(ProjectRelativePathSchema.safeParse("media/video.mp4").success).toBe(
      true,
    );
    for (const path of [
      "/outside/video.mp4",
      "C:/outside/video.mp4",
      "C:outside/video.mp4",
      "../outside/video.mp4",
      "media/../video.mp4",
      "media\\video.mp4",
    ]) {
      expect(ProjectRelativePathSchema.safeParse(path).success).toBe(false);
    }
    expect(
      ProjectDocumentSchema.safeParse(invalidProjectFixtures.absoluteAssetPath)
        .success,
    ).toBe(false);
    expect(
      ProjectDocumentSchema.safeParse(invalidProjectFixtures.traversalAssetPath)
        .success,
    ).toBe(false);
  });

  it("rejects missing references and clip timing outside the timeline", () => {
    const missingAsset = ProjectDocumentSchema.safeParse(
      invalidProjectFixtures.missingAssetReference,
    );
    const missingTrack = ProjectDocumentSchema.safeParse(
      invalidProjectFixtures.missingTrackReference,
    );
    const outOfRange = ProjectDocumentSchema.safeParse(
      invalidProjectFixtures.outOfRangeClipTiming,
    );
    const unknownTimeline = ProjectDocumentSchema.safeParse(
      invalidProjectFixtures.unknownTimelineKey,
    );

    expect(missingAsset.success).toBe(false);
    expect(missingTrack.success).toBe(false);
    expect(outOfRange.success).toBe(false);
    expect(unknownTimeline.success).toBe(false);
    if (!missingAsset.success) {
      expect(
        missingAsset.error.issues.some(
          (issue) =>
            issue.message ===
            PROJECT_SCHEMA_ERROR_CODES.ASSET_REFERENCE_NOT_FOUND,
        ),
      ).toBe(true);
    }
    if (!missingTrack.success) {
      expect(
        missingTrack.error.issues.some(
          (issue) =>
            issue.message ===
            PROJECT_SCHEMA_ERROR_CODES.TRACK_REFERENCE_NOT_FOUND,
        ),
      ).toBe(true);
    }
    if (!outOfRange.success) {
      expect(
        outOfRange.error.issues.some(
          (issue) =>
            issue.message === PROJECT_SCHEMA_ERROR_CODES.CLIP_OUT_OF_RANGE,
        ),
      ).toBe(true);
    }
    if (!unknownTimeline.success) {
      expect(
        unknownTimeline.error.issues.some(
          (issue) =>
            issue.message ===
            PROJECT_SCHEMA_ERROR_CODES.TIMELINE_SCENE_NOT_FOUND,
        ),
      ).toBe(true);
    }
  });

  it("rejects duplicate IDs and unsupported higher schema versions", () => {
    const duplicate = ProjectDocumentSchema.safeParse(
      invalidProjectFixtures.duplicateAssetId,
    );
    const unsupported = ProjectDocumentSchema.safeParse(
      invalidProjectFixtures.unsupportedHigherSchemaVersion,
    );

    expect(duplicate.success).toBe(false);
    expect(unsupported.success).toBe(false);
    if (!duplicate.success) {
      expect(
        duplicate.error.issues.some((issue) =>
          issue.message.startsWith(PROJECT_SCHEMA_ERROR_CODES.DUPLICATE_ID),
        ),
      ).toBe(true);
    }
    if (!unsupported.success) {
      expect(
        unsupported.error.issues.some(
          (issue) =>
            issue.message ===
            PROJECT_SCHEMA_ERROR_CODES.SCHEMA_VERSION_UNSUPPORTED,
        ),
      ).toBe(true);
    }
  });

  it("keeps plugin descriptors static and rejects executable fields", () => {
    expect(
      ProjectDocumentSchema.safeParse(
        invalidProjectFixtures.executablePluginField,
      ).success,
    ).toBe(false);
    const plugin = validProjectDocument.pluginDescriptors[0];
    expect(plugin.execution).toBe("static");
    expect("code" in plugin).toBe(false);
  });

  it("uses the canonical record-of-track-arrays timeline shape", () => {
    expect(
      TimelineSchema.safeParse(validProjectDocument.timelines).success,
    ).toBe(true);
    expect(Array.isArray(validProjectDocument.timelines)).toBe(false);
    expect(
      ProjectDocumentSchema.safeParse({
        ...validProjectDocument,
        timelines: { "timeline-main": { tracks: [] } },
      }).success,
    ).toBe(false);
  });

  it("accepts the restricted condition and action DSL used by interactive choices", () => {
    const project = structuredClone(validProjectDocument);
    project.timelines["timeline-main"].push({
      id: "track-choice",
      name: "Choice",
      type: "choice",
      clips: [
        {
          id: "clip-choice",
          title: "Choice point",
          trackId: "track-choice",
          startTime: 8,
          duration: 1,
          content: {
            choices: [
              {
                id: "choice-ask",
                text: "Ask first",
                targetSceneId: "timeline-main",
                triggerTime: 8,
                condition: "hasKey === true",
                actionCode: "variables.credits += 10",
              },
            ],
          },
        },
      ],
    });

    expect(ProjectDocumentSchema.safeParse(project).success).toBe(true);
  });

  it("validates export states without claiming a result for failure or cancellation", () => {
    expect(ExportSchema.safeParse(validExportJob).success).toBe(true);
    expect(
      ExportSchema.safeParse({
        ...validExportJob,
        status: "failed",
        outputPath: null,
        errorCode: "JOB_FAILED",
        progress: 0.4,
      }).success,
    ).toBe(true);
    expect(
      ExportSchema.safeParse({
        ...validExportJob,
        status: "cancelled",
        outputPath: "exports/false-success.mp4",
        errorCode: null,
      }).success,
    ).toBe(false);
  });
});
