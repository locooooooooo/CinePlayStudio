import type { ProjectDocument } from "../project";

export const validProjectDocument: ProjectDocument = {
  schemaVersion: 1,
  id: "project-demo",
  name: "Demo Edit",
  createdAt: "2026-08-04T00:00:00Z",
  modifiedAt: "2026-08-04T00:01:00.123Z",
  scenes: [
    {
      id: "timeline-main",
      name: "Main Scene",
      duration: 12,
    },
  ],
  timelines: {
    "timeline-main": [
      {
        id: "track-video",
        name: "Video 1",
        type: "video",
        muted: false,
        locked: false,
        clips: [
          {
            id: "clip-intro",
            title: "Intro Video",
            assetId: "asset-video",
            trackId: "track-video",
            startTime: 0,
            duration: 8,
          },
        ],
      },
    ],
  },
  assets: [
    {
      id: "asset-video",
      name: "Intro Video",
      type: "video",
      path: "media/intro.mp4",
      sizeBytes: 1840000,
      durationSeconds: 8,
      availability: "available",
    },
  ],
  variables: [],
  folders: [],
  tags: [],
  pluginDescriptors: [
    {
      id: "plugin-static-overlay",
      name: "Static Overlay",
      version: "1.0.0",
      description:
        "A non-executable descriptor reserved for future P1 support.",
      execution: "static",
    },
  ],
  settings: { timeUnit: "seconds" },
};

export const validExportJob = {
  id: "export-1",
  format: "mp4" as const,
  inputRevision: "revision-1",
  status: "completed" as const,
  progress: 1,
  outputPath: "exports/demo.mp4",
  errorCode: null,
};
