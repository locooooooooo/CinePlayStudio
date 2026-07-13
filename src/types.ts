export interface SceneNode {
  id: string;
  name: string;
  videoUrl: string;
  duration: number;
  thumbnail: string;
  description: string;
  choices: Choice[];
  position: { x: number; y: number };
  status?:
    | "completed"
    | "in_progress"
    | "reviewed"
    | "ai_generated"
    | "missing_assets";
}

export interface Choice {
  id: string;
  text: string;
  targetSceneId: string;
  triggerTime: number; // When to pause and show this choice (in seconds)
  condition?: string; // e.g. "hasGoldenKey === true"
  actionCode?: string; // Custom script to run when selected (e.g., "variables.gold += 10")
}

export interface TimelineClip {
  id: string;
  title: string;
  startTime: number; // in seconds from scene start
  duration: number; // in seconds
  color: string; // Tailwind background color class
  content: {
    videoUrl?: string; // For video source clips
    text?: string; // For subtitles
    volume?: number; // For audio (0 to 100)
    pluginId?: string; // For plugin-driven overlays
    pluginConfig?: any; // Configuration passed to the plugin
    choices?: Choice[]; // For choices trigger track
    variableId?: string; // For variable triggers
    operation?: string; // e.g. 'set' | 'add' | 'sub'
    value?: any; // value to change variable
    loop?: boolean; // loop audio/BGM
    preset?: string; // camera preset
    duration?: number; // camera custom duration transition
    achievementName?: string; // achievement title
    points?: number; // achievement unlock points
    effectType?: string; // glitch, vhs, bloom, bw
    intensity?: string; // low, medium, high
  };
}

export interface TimelineTrack {
  id: string;
  name: string;
  type:
    | "video"
    | "audio"
    | "subtitle"
    | "trigger"
    | "plugin"
    | "choice"
    | "variable"
    | "achievement"
    | "camera"
    | "effect"
    | "bgm";
  clips: TimelineClip[];
  muted?: boolean;
  locked?: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: "video" | "audio" | "image" | "document";
  url: string;
  duration: number; // in seconds, 0 for images and documents
  thumbnail: string;
  size: string;
  category: string;
  tags?: string[];
  folderId?: string;
}

export interface EditorPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  code: string; // JavaScript implementation string
  isActive: boolean;
  type: "widget" | "overlay" | "logic";
  registeredTrackType?: string;
  iconName: string;
}

export interface ProjectVariable {
  id: string;
  name: string;
  type: "boolean" | "number" | "string";
  value: any;
}
