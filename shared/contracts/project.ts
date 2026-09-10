import { z } from "zod";

export const CURRENT_PROJECT_SCHEMA_VERSION = 1 as const;

export const PROJECT_SCHEMA_ERROR_CODES = {
  DUPLICATE_ID: "DUPLICATE_ID",
  ASSET_REFERENCE_NOT_FOUND: "ASSET_REFERENCE_NOT_FOUND",
  TRACK_REFERENCE_NOT_FOUND: "TRACK_REFERENCE_NOT_FOUND",
  CLIP_TRACK_MISMATCH: "CLIP_TRACK_MISMATCH",
  CLIP_OUT_OF_RANGE: "CLIP_OUT_OF_RANGE",
  TIMELINE_SCENE_NOT_FOUND: "TIMELINE_SCENE_NOT_FOUND",
  SCHEMA_VERSION_UNSUPPORTED: "SCHEMA_VERSION_UNSUPPORTED",
} as const;

export type ProjectSchemaErrorCode =
  (typeof PROJECT_SCHEMA_ERROR_CODES)[keyof typeof PROJECT_SCHEMA_ERROR_CODES];

const idSchema = z
  .string()
  .min(1, "ID_REQUIRED")
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "ID_NOT_STABLE");

const nonEmptyNameSchema = z.string().trim().min(1, "NAME_REQUIRED");

const utcTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

function isValidUtcTimestamp(value: string): boolean {
  const match = utcTimestampPattern.exec(value);
  if (!match) {
    return false;
  }

  const [, year, month, day, hour, minute, second, milliseconds = ""] = match;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return false;
  }

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute) &&
    date.getUTCSeconds() === Number(second) &&
    date.getUTCMilliseconds() === Number(milliseconds.padEnd(3, "0") || 0)
  );
}

export const UtcTimestampSchema = z
  .string()
  .regex(utcTimestampPattern, "TIMESTAMP_NOT_UTC")
  .refine(isValidUtcTimestamp, "TIMESTAMP_INVALID");

const finiteNumberSchema = z.number().finite("NUMBER_NOT_FINITE");
const nonNegativeNumberSchema =
  finiteNumberSchema.nonnegative("NUMBER_NEGATIVE");
const nonNegativeIntegerSchema =
  nonNegativeNumberSchema.int("NUMBER_NOT_INTEGER");
const positiveSecondsSchema = finiteNumberSchema.positive(
  "DURATION_NOT_POSITIVE",
);

const MAX_TIMELINE_TIME_SECONDS = Number.MAX_SAFE_INTEGER;
const timelineTimeSchema = nonNegativeNumberSchema.max(
  MAX_TIMELINE_TIME_SECONDS,
  "TIME_OUT_OF_RANGE",
);
const clipDurationSchema = positiveSecondsSchema.max(
  MAX_TIMELINE_TIME_SECONDS,
  "TIME_OUT_OF_RANGE",
);

const RuntimeChoiceSchema = z.object({
  id: idSchema,
  text: nonEmptyNameSchema,
  targetSceneId: idSchema,
  triggerTime: timelineTimeSchema,
  condition: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*\s*(===|!==|>=|<=|>|<)\s*(true|false|-?\d+(?:\.\d+)?|"[^"]*"|'[^']*')$/).optional(),
  actionCode: z.string().regex(/^variables\.[A-Za-z_][A-Za-z0-9_]*\s*(=|\+=|-=)\s*(true|false|-?\d+(?:\.\d+)?|"[^"]*"|'[^']*')$/).optional(),
}).strict();

const ClipContentSchema = z.object({
  videoUrl: z.string().optional(),
  text: z.string().optional(),
  choices: z.array(RuntimeChoiceSchema).optional(),
  variableId: idSchema.optional(),
  operation: z.enum(["set", "add", "sub"]).optional(),
  value: z.union([z.boolean(), z.number().finite(), z.string()]).optional(),
}).strict();

export const ProjectRelativePathSchema = z
  .string()
  .min(1, "ASSET_PATH_REQUIRED")
  .refine((value) => !value.includes("\\"), "ASSET_PATH_NOT_POSIX")
  .refine((value) => !value.startsWith("/"), "ASSET_PATH_ABSOLUTE")
  .refine((value) => !/^[A-Za-z]:/.test(value), "ASSET_PATH_ABSOLUTE")
  .refine(
    (value) => value.split("/").every((segment) => segment !== ""),
    "ASSET_PATH_NOT_NORMALIZED",
  )
  .refine(
    (value) =>
      value.split("/").every((segment) => segment !== "." && segment !== ".."),
    "ASSET_PATH_TRAVERSAL",
  );

const SchemaVersionSchema = z
  .number()
  .finite("SCHEMA_VERSION_NOT_FINITE")
  .int("SCHEMA_VERSION_NOT_INTEGER")
  .refine(
    (value) => value === CURRENT_PROJECT_SCHEMA_VERSION,
    PROJECT_SCHEMA_ERROR_CODES.SCHEMA_VERSION_UNSUPPORTED,
  );

export const AssetSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
    type: z.enum(["video", "audio", "image", "document"]),
    path: ProjectRelativePathSchema,
    sizeBytes: nonNegativeIntegerSchema,
    durationSeconds: nonNegativeNumberSchema,
    availability: z.enum(["available", "missing", "unauthorized"]),
  })
  .strict();

export const ClipSchema = z
  .object({
    id: idSchema,
    title: nonEmptyNameSchema,
    assetId: idSchema.optional(),
    trackId: idSchema,
    startTime: timelineTimeSchema,
    duration: clipDurationSchema,
    content: ClipContentSchema.optional(),
  })
  .strict()
  .superRefine((clip, context) => {
    if (clip.startTime + clip.duration > MAX_TIMELINE_TIME_SECONDS) {
      context.addIssue({
        code: "custom",
        path: ["duration"],
        message: PROJECT_SCHEMA_ERROR_CODES.CLIP_OUT_OF_RANGE,
      });
    }
  });

export const TrackSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
    type: z.enum([
      "video",
      "audio",
      "subtitle",
      "trigger",
      "plugin",
      "choice",
      "variable",
      "achievement",
      "camera",
      "effect",
      "bgm",
    ]),
    clips: z.array(ClipSchema),
    muted: z.boolean().optional(),
    locked: z.boolean().optional(),
  })
  .strict()
  .superRefine((track, context) => {
    let previousClipStart: number | undefined;
    for (const [clipIndex, clip] of track.clips.entries()) {
      if (
        previousClipStart !== undefined &&
        clip.startTime < previousClipStart
      ) {
        context.addIssue({
          code: "custom",
          path: ["clips", clipIndex, "startTime"],
          message: "CLIPS_NOT_ORDERED",
        });
      }
      previousClipStart = clip.startTime;
    }
  });

// Persisted timelines are the ADR-0002 record of track arrays. Playhead and
// selection are runtime/view state and are intentionally outside this model.
export const TimelineSchema = z.record(idSchema, z.array(TrackSchema));
export const TimelineTrackSchema = TrackSchema;
export const TimelineClipSchema = ClipSchema;

const SceneNodeSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
    duration: nonNegativeNumberSchema,
  })
  .strict();

const ProjectVariableSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
    type: z.enum(["boolean", "number", "string"]),
    value: z.union([z.boolean(), z.number().finite(), z.string()]),
  })
  .strict();

const AssetFolderSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
    parentId: idSchema.nullable(),
  })
  .strict();

const AssetTagSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
  })
  .strict();

export const PluginDescriptorSchema = z
  .object({
    id: idSchema,
    name: nonEmptyNameSchema,
    version: nonEmptyNameSchema,
    description: z.string(),
    execution: z.literal("static"),
  })
  .strict();

const ProjectSettingsSchema = z
  .object({
    timeUnit: z.literal("seconds"),
  })
  .strict();

const ProjectDocumentShape = {
  schemaVersion: SchemaVersionSchema,
  id: idSchema,
  name: nonEmptyNameSchema,
  createdAt: UtcTimestampSchema,
  modifiedAt: UtcTimestampSchema,
  scenes: z.array(SceneNodeSchema),
  timelines: TimelineSchema,
  assets: z.array(AssetSchema),
  variables: z.array(ProjectVariableSchema),
  folders: z.array(AssetFolderSchema),
  tags: z.array(AssetTagSchema),
  pluginDescriptors: z.array(PluginDescriptorSchema),
  settings: ProjectSettingsSchema,
};

function addDuplicateIdIssues(
  values: ReadonlyArray<{ id: string }>,
  path: PropertyKey[],
  context: z.RefinementCtx,
): void {
  const firstIndexById = new Map<string, number>();
  for (const [index, value] of values.entries()) {
    const firstIndex = firstIndexById.get(value.id);
    if (firstIndex !== undefined) {
      context.addIssue({
        code: "custom",
        path: [...path, index, "id"],
        message: `${PROJECT_SCHEMA_ERROR_CODES.DUPLICATE_ID}:${value.id}:first=${firstIndex}`,
      });
      continue;
    }
    firstIndexById.set(value.id, index);
  }
}

export const ProjectDocumentSchema = z
  .object(ProjectDocumentShape)
  .strict()
  .superRefine((document, context) => {
    addDuplicateIdIssues(document.scenes, ["scenes"], context);
    addDuplicateIdIssues(document.assets, ["assets"], context);
    addDuplicateIdIssues(document.variables, ["variables"], context);
    addDuplicateIdIssues(document.folders, ["folders"], context);
    addDuplicateIdIssues(document.tags, ["tags"], context);
    addDuplicateIdIssues(
      document.pluginDescriptors,
      ["pluginDescriptors"],
      context,
    );

    const scenesById = new Map<string, { index: number; duration: number }>();
    for (const [sceneIndex, scene] of document.scenes.entries()) {
      if (!scenesById.has(scene.id)) {
        scenesById.set(scene.id, {
          index: sceneIndex,
          duration: scene.duration,
        });
      }
    }

    const assetsById = new Set(document.assets.map((asset) => asset.id));
    const tracksById = new Map<
      string,
      { timelineId: string; trackIndex: number }
    >();
    const clipsById = new Map<
      string,
      { timelineId: string; trackIndex: number; clipIndex: number }
    >();

    for (const [timelineId, tracks] of Object.entries(document.timelines)) {
      const scene = scenesById.get(timelineId);
      if (!scene) {
        context.addIssue({
          code: "custom",
          path: ["timelines", timelineId],
          message: PROJECT_SCHEMA_ERROR_CODES.TIMELINE_SCENE_NOT_FOUND,
        });
      }

      for (const [trackIndex, track] of tracks.entries()) {
        const previousTrack = tracksById.get(track.id);
        if (previousTrack) {
          context.addIssue({
            code: "custom",
            path: ["timelines", timelineId, trackIndex, "id"],
            message: `${PROJECT_SCHEMA_ERROR_CODES.DUPLICATE_ID}:${track.id}:first=${previousTrack.timelineId}.${previousTrack.trackIndex}`,
          });
        } else {
          tracksById.set(track.id, { timelineId, trackIndex });
        }
      }
    }

    for (const [timelineId, tracks] of Object.entries(document.timelines)) {
      const scene = scenesById.get(timelineId);
      for (const [trackIndex, track] of tracks.entries()) {
        for (const [clipIndex, clip] of track.clips.entries()) {
          const previousClip = clipsById.get(clip.id);
          if (previousClip) {
            context.addIssue({
              code: "custom",
              path: ["timelines", timelineId, trackIndex, clipIndex, "id"],
              message: `${PROJECT_SCHEMA_ERROR_CODES.DUPLICATE_ID}:${clip.id}:first=${previousClip.timelineId}.${previousClip.trackIndex}.${previousClip.clipIndex}`,
            });
          } else {
            clipsById.set(clip.id, { timelineId, trackIndex, clipIndex });
          }

          if (clip.assetId && !assetsById.has(clip.assetId)) {
            context.addIssue({
              code: "custom",
              path: ["timelines", timelineId, trackIndex, clipIndex, "assetId"],
              message: PROJECT_SCHEMA_ERROR_CODES.ASSET_REFERENCE_NOT_FOUND,
            });
          }

          if (["video", "audio", "bgm"].includes(track.type) && !clip.assetId) {
            context.addIssue({
              code: "custom",
              path: ["timelines", timelineId, trackIndex, clipIndex, "assetId"],
              message: PROJECT_SCHEMA_ERROR_CODES.ASSET_REFERENCE_NOT_FOUND,
            });
          }

          const trackReference = tracksById.get(clip.trackId);
          if (!trackReference) {
            context.addIssue({
              code: "custom",
              path: ["timelines", timelineId, trackIndex, clipIndex, "trackId"],
              message: PROJECT_SCHEMA_ERROR_CODES.TRACK_REFERENCE_NOT_FOUND,
            });
          } else if (
            trackReference.timelineId !== timelineId ||
            trackReference.trackIndex !== trackIndex
          ) {
            context.addIssue({
              code: "custom",
              path: ["timelines", timelineId, trackIndex, clipIndex, "trackId"],
              message: PROJECT_SCHEMA_ERROR_CODES.CLIP_TRACK_MISMATCH,
            });
          }

          if (scene && clip.startTime + clip.duration > scene.duration) {
            context.addIssue({
              code: "custom",
              path: [
                "timelines",
                timelineId,
                trackIndex,
                clipIndex,
                "duration",
              ],
              message: PROJECT_SCHEMA_ERROR_CODES.CLIP_OUT_OF_RANGE,
            });
          }
        }
      }
    }
  });

export const ProjectSchema = ProjectDocumentSchema;

export const ExportSchema = z
  .object({
    id: idSchema,
    format: z.enum(["mp4", "webm", "gif"]),
    inputRevision: idSchema,
    status: z.enum(["queued", "running", "completed", "cancelled", "failed"]),
    progress: z.number().finite().min(0).max(1),
    outputPath: ProjectRelativePathSchema.nullable(),
    errorCode: z.string().trim().min(1).nullable(),
  })
  .strict()
  .superRefine((job, context) => {
    if (job.status === "completed" && job.outputPath === null) {
      context.addIssue({
        code: "custom",
        path: ["outputPath"],
        message: "EXPORT_OUTPUT_REQUIRED",
      });
    }
    if (job.status !== "completed" && job.outputPath !== null) {
      context.addIssue({
        code: "custom",
        path: ["outputPath"],
        message: "EXPORT_OUTPUT_NOT_ALLOWED",
      });
    }
    if (job.status === "failed" && job.errorCode === null) {
      context.addIssue({
        code: "custom",
        path: ["errorCode"],
        message: "EXPORT_ERROR_REQUIRED",
      });
    }
    if (job.status !== "failed" && job.errorCode !== null) {
      context.addIssue({
        code: "custom",
        path: ["errorCode"],
        message: "EXPORT_ERROR_NOT_ALLOWED",
      });
    }
  });

export type ProjectDocument = z.infer<typeof ProjectDocumentSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type TimelineTrack = z.infer<typeof TimelineTrackSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type TimelineClip = z.infer<typeof TimelineClipSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type Export = z.infer<typeof ExportSchema>;

export type ProjectDocumentParseResult =
  | { success: true; data: ProjectDocument }
  | { success: false; error: z.ZodError };

export function parseProjectDocument(input: unknown): ProjectDocument {
  return ProjectDocumentSchema.parse(input);
}

export function safeParseProjectDocument(
  input: unknown,
): ProjectDocumentParseResult {
  return ProjectDocumentSchema.safeParse(input);
}
