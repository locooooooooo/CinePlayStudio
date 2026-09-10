import React, { useState, useEffect, useRef } from "react";
import {
  INITIAL_SCENES,
  INITIAL_TIMELINES_BY_SCENE,
  INITIAL_ASSETS,
  INITIAL_PLUGINS,
  INITIAL_VARIABLES,
} from "./initialData";
import {
  SceneNode,
  TimelineTrack,
  MediaAsset,
  EditorPlugin,
  ProjectVariable,
  TimelineClip,
  Choice,
} from "./types";
import Flowchart from "./components/Flowchart";
import Timeline from "./components/Timeline";
import Player from "./components/Player";
import AssetManager from "./components/AssetManager";
import Inspector from "./components/Inspector";
import NativeEngineCenter from "./components/NativeEngineCenter";
import ScriptDecomposer from "./components/ScriptDecomposer";
import ProjectManager from "./components/ProjectManager";
import type { ProjectDocument as CanonicalProjectDocument } from "../shared/contracts/project";

import {
  Sparkles,
  Download,
  HelpCircle,
  GitBranch,
  Monitor,
  Layout,
  RefreshCw,
  Cpu,
  Flame,
  CheckCircle,
  X,
  Film,
  FolderOpen,
  Cloud,
  Edit3,
  Check,
  AlertCircle,
} from "lucide-react";

interface ProjectMeta {
  id: string;
  name: string;
  lastModified: number;
  sceneCount: number;
  thumbnail?: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  lastModified: number;
  scenes: SceneNode[];
  timelines: Record<string, TimelineTrack[]>;
  assets: MediaAsset[];
  plugins: EditorPlugin[];
  variables: ProjectVariable[];
}

interface ImportedScene extends SceneNode {
  timelineTracks?: TimelineTrack[];
}

interface ImportedProject {
  projectName?: string;
  name?: string;
  scenes?: ImportedScene[];
  timelines?: Record<string, TimelineTrack[]>;
  timelineTracks?: Record<string, TimelineTrack[]>;
  assets?: MediaAsset[];
  plugins?: EditorPlugin[];
  variables?: ProjectVariable[];
  globalVariables?: ProjectVariable[];
}

interface ParsedVariable {
  id?: string;
  name: string;
  type: string;
  value: unknown;
}

interface ParsedScene {
  id: string;
  name: string;
  videoUrl: string;
  duration?: number;
  thumbnail?: string;
  description?: string;
  position?: SceneNode["position"];
  choices?: Choice[];
}

interface ParsedTimelineClip {
  id: string;
  title: string;
  startTime: number;
  duration: number;
  color?: string;
  content?: TimelineClip["content"];
}

interface ParsedTimelineTrack {
  id: string;
  name: string;
  type: TimelineTrack["type"];
  clips: ParsedTimelineClip[];
}

interface ParsedScriptData {
  projectName: string;
  variables: ParsedVariable[];
  scenes: ParsedScene[];
  timelines: Array<{ sceneId: string; tracks: ParsedTimelineTrack[] }>;
}

export default function App() {
  // Core Application States
  const [scenes, setScenes] = useState<SceneNode[]>([]);
  const [timelines, setTimelines] = useState<Record<string, TimelineTrack[]>>(
    {},
  );
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [plugins, setPlugins] = useState<EditorPlugin[]>([]);
  const [variables, setVariables] = useState<ProjectVariable[]>([]);
  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [projectRevision, setProjectRevision] = useState<string | null>(null);

  // Project Management States
  const [projectName, setProjectName] = useState<string>("赛步影游剧本");
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [projectsMeta, setProjectsMeta] = useState<ProjectMeta[]>([]);
  const [showProjectManager, setShowProjectManager] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [isEditingProjectName, setIsEditingProjectName] =
    useState<boolean>(false);
  const [tempProjectName, setTempProjectName] = useState<string>("");

  // Project Switch Guard
  const isSwitchingProjectRef = useRef<boolean>(false);

  const [activeSceneId, setActiveSceneId] = useState<string>("scene-1");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSingleNodePlayback, setIsSingleNodePlayback] =
    useState<boolean>(false);

  // Focus and details
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Visual state managers
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showScriptDecomposer, setShowScriptDecomposer] =
    useState<boolean>(false);
  const [workspaceLayout, setWorkspaceLayout] = useState<
    | "standard"
    | "flow-focus"
    | "timeline-focus"
    | "cinema-preview"
    | "native-engine"
  >("standard");

  const activeScene = scenes.find((s) => s.id === activeSceneId) ||
    scenes[0] || {
      id: "scene-1",
      name: "01_宿命觉醒 (Wake Up)",
      videoUrl:
        "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
      duration: 15,
      thumbnail:
        "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80",
      description: "",
      position: { x: 80, y: 150 },
      choices: [],
    };
  const activeTracks = timelines[activeScene.id] || [];

  const buildCanonicalDocument = (): CanonicalProjectDocument => {
    const now = new Date().toISOString();
    const persistedAssets = assets
      .filter((asset) => asset.projectPath)
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        path: asset.projectPath!,
        sizeBytes: asset.sizeBytes ?? 0,
        durationSeconds: asset.duration,
        availability: asset.availability ?? "available",
      }));
    const persistedTimelines = Object.fromEntries(
      (Object.entries(timelines) as [string, TimelineTrack[]][]).map(([sceneId, tracks]) => [
        sceneId,
        tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            id: clip.id,
            title: clip.title,
            trackId: track.id,
            startTime: clip.startTime,
            duration: clip.duration,
            assetId: typeof clip.content.videoUrl === "string" && persistedAssets[0]
              ? persistedAssets[0].id
              : undefined,
            content: {
              text: clip.content.text,
              choices: clip.content.choices,
              variableId: clip.content.variableId,
              operation: clip.content.operation as "set" | "add" | "sub" | undefined,
              value: clip.content.value,
            },
          })),
        })),
      ]),
    );
    return {
      schemaVersion: 1,
      id: currentProjectId || `project-${Date.now()}`,
      name: projectName,
      createdAt: now,
      modifiedAt: now,
      scenes: scenes.map((scene) => ({ id: scene.id, name: scene.name, duration: scene.duration })),
      timelines: persistedTimelines,
      assets: persistedAssets,
      variables,
      folders: [],
      tags: [],
      pluginDescriptors: plugins.filter((plugin) => plugin.isActive).map((plugin) => ({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        execution: "static" as const,
      })),
      settings: { timeUnit: "seconds" as const },
    };
  };

  const hydrateCanonicalDocument = (document: CanonicalProjectDocument, root: string) => {
    const assetById = new Map(document.assets.map((asset) => [asset.id, asset]));
    const toUrl = (relativePath: string) => new URL(relativePath, `file:///${root.replaceAll("\\", "/")}/`).href;
    const hydratedAssets: MediaAsset[] = document.assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      url: toUrl(asset.path),
      duration: asset.durationSeconds,
      thumbnail: "",
      size: `${(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
      sizeBytes: asset.sizeBytes,
      category: "Project Asset",
      projectPath: asset.path,
      availability: asset.availability,
    }));
    const hydratedScenes: SceneNode[] = document.scenes.map((scene) => {
      const sceneTracks = document.timelines[scene.id] || [];
      const firstVideoClip = sceneTracks.find((track) => track.type === "video")?.clips[0];
      const videoAsset = firstVideoClip?.assetId ? assetById.get(firstVideoClip.assetId) : undefined;
      const triggerClip = sceneTracks.find((track) => track.type === "trigger")?.clips[0];
      return {
        id: scene.id,
        name: scene.name,
        videoUrl: videoAsset ? toUrl(videoAsset.path) : "",
        duration: scene.duration,
        thumbnail: "",
        description: "",
        position: { x: 100, y: 150 },
        choices: triggerClip?.content?.choices || [],
      };
    });
    const hydratedTimelines = Object.fromEntries(
      Object.entries(document.timelines).map(([sceneId, tracks]) => [
        sceneId,
        tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            id: clip.id,
            title: clip.title,
            startTime: clip.startTime,
            duration: clip.duration,
            color: "bg-emerald-600/30 border-emerald-500 text-emerald-300",
            content: clip.content || {},
          })),
        })),
      ]),
    ) as Record<string, TimelineTrack[]>;
    setScenes(hydratedScenes);
    setTimelines(hydratedTimelines);
    setAssets(hydratedAssets);
    setVariables(document.variables);
    setPlugins([]);
    setProjectName(document.name);
    setCurrentProjectId(document.id);
    if (hydratedScenes[0]) setActiveSceneId(hydratedScenes[0].id);
  };

  const handleChooseProjectDirectory = async () => {
    const api = window.gameEditor?.project;
    if (!api) {
      setSaveStatus("error");
      return;
    }
    try {
      const selectedRoot = await api.chooseDirectory();
      if (!selectedRoot) return;
      const document = buildCanonicalDocument();
      let snapshot;
      try {
        snapshot = await api.create(selectedRoot, document);
      } catch {
        snapshot = await api.open(selectedRoot);
        hydrateCanonicalDocument(snapshot.document, selectedRoot);
      }
      setProjectRoot(snapshot.projectRoot);
      setProjectRevision(snapshot.revision);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Project directory operation failed", error);
      setSaveStatus("error");
    }
  };

  const handleImportRealAsset = async (): Promise<MediaAsset | null> => {
    if (!projectRoot || !window.gameEditor?.project) return null;
    try {
      const imported = await window.gameEditor.project.importAsset(projectRoot);
      if (!imported) return null;
      const asset: MediaAsset = {
        id: `asset-${Date.now()}`,
        name: imported.name,
        type: imported.type,
        url: new URL(imported.path, "file:///" + projectRoot.replaceAll("\\", "/") + "/").href,
        duration: imported.durationSeconds,
        thumbnail: "",
        size: `${(imported.sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        sizeBytes: imported.sizeBytes,
        category: "User Import",
        projectPath: imported.path,
        availability: "available",
      };
      handleAddAsset(asset);
      return asset;
    } catch (error) {
      console.error("Real asset import failed", error);
      setSaveStatus("error");
      return null;
    }
  };

  const handleExportCurrentSceneMp4 = async () => {
    const asset = assets.find((item) => item.type === "video" && item.projectPath);
    if (!projectRoot || !asset?.projectPath || !window.gameEditor?.project) {
      setSaveStatus("error");
      alert("请先连接项目目录，并导入一条本地视频素材。");
      return;
    }
    try {
      const result = await window.gameEditor.project.exportMp4(
        projectRoot,
        asset.projectPath,
        activeScene.duration,
      );
      alert(`已生成 MP4: ${result.outputPath}`);
    } catch (error) {
      console.error("MP4 export failed", error);
      setSaveStatus("error");
      alert("MP4 导出失败，请检查素材编码和磁盘空间。");
    }
  };

  // 1a. Load initial project list & active project detail on mount
  useEffect(() => {
    let metaList: ProjectMeta[] = [];
    try {
      const storedMeta = localStorage.getItem("cineflow_projects_meta");
      if (storedMeta) {
        metaList = JSON.parse(storedMeta);
      }
    } catch (e) {
      console.error(e);
    }

    if (metaList.length === 0) {
      // Create default project on very first boot
      const defaultId = "project-default";
      const defaultProject = {
        id: defaultId,
        name: "赛博幻想：时空节点剧情剧本 (默认示例)",
        lastModified: Date.now(),
        scenes: INITIAL_SCENES,
        timelines: INITIAL_TIMELINES_BY_SCENE,
        assets: INITIAL_ASSETS,
        plugins: INITIAL_PLUGINS,
        variables: INITIAL_VARIABLES,
      };

      const defaultMeta = {
        id: defaultId,
        name: defaultProject.name,
        lastModified: defaultProject.lastModified,
        sceneCount: INITIAL_SCENES.length,
        thumbnail: INITIAL_SCENES[0]?.thumbnail || "",
      };

      metaList = [defaultMeta];
      localStorage.setItem("cineflow_projects_meta", JSON.stringify(metaList));
      localStorage.setItem(
        `cineflow_project_detail_${defaultId}`,
        JSON.stringify(defaultProject),
      );
      localStorage.setItem("cineflow_active_project_id", defaultId);

      setProjectsMeta(metaList);
      setCurrentProjectId(defaultId);
      setProjectName(defaultProject.name);
      setScenes(INITIAL_SCENES);
      setTimelines(INITIAL_TIMELINES_BY_SCENE);
      setAssets(INITIAL_ASSETS);
      setPlugins(INITIAL_PLUGINS);
      setVariables(INITIAL_VARIABLES);
      if (INITIAL_SCENES.length > 0) {
        setActiveSceneId(INITIAL_SCENES[0].id);
      }
    } else {
      let activeId =
        localStorage.getItem("cineflow_active_project_id") || metaList[0].id;
      if (!metaList.some((p) => p.id === activeId)) {
        activeId = metaList[0].id;
      }

      setProjectsMeta(metaList);
      setCurrentProjectId(activeId);
      isSwitchingProjectRef.current = true;
      try {
        const detailsStr = localStorage.getItem(
          `cineflow_project_detail_${activeId}`,
        );
        if (detailsStr) {
          const details = JSON.parse(detailsStr);
          setProjectName(details.name || "未命名项目");
          setScenes(details.scenes || []);
          setTimelines(details.timelines || {});
          setAssets(details.assets || []);
          setPlugins(details.plugins || []);
          setVariables(details.variables || []);
          if (details.scenes && details.scenes.length > 0) {
            setActiveSceneId(details.scenes[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => {
        isSwitchingProjectRef.current = false;
      }, 150);
    }
  }, []);

  // 1b. Auto save current project whenever core states update (debounced)
  useEffect(() => {
    // Guard against running auto-save while hydrating/switching projects or when empty
    if (
      !currentProjectId ||
      isSwitchingProjectRef.current ||
      scenes.length === 0
    )
      return;

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const updatedProject = {
          id: currentProjectId,
          name: projectName,
          lastModified: Date.now(),
          scenes,
          timelines,
          assets,
          plugins,
          variables,
        };

        // 1. Save detail JSON
        localStorage.setItem(
          `cineflow_project_detail_${currentProjectId}`,
          JSON.stringify(updatedProject),
        );

        // 2. Update list meta
        setProjectsMeta((prevMeta) => {
          const firstScene = scenes[0];
          let found = false;
          const updatedMeta = prevMeta.map((p) => {
            if (p.id === currentProjectId) {
              found = true;
              return {
                ...p,
                name: projectName,
                lastModified: updatedProject.lastModified,
                sceneCount: scenes.length,
                thumbnail: firstScene?.thumbnail || "",
              };
            }
            return p;
          });

          if (!found) {
            updatedMeta.push({
              id: currentProjectId,
              name: projectName,
              lastModified: updatedProject.lastModified,
              sceneCount: scenes.length,
              thumbnail: firstScene?.thumbnail || "",
            });
          }

          localStorage.setItem(
            "cineflow_projects_meta",
            JSON.stringify(updatedMeta),
          );
          return updatedMeta;
        });

        setSaveStatus("saved");
        if (projectRoot && projectRevision && window.gameEditor?.project) {
          try {
            const snapshot = await window.gameEditor.project.save(
              projectRoot,
              buildCanonicalDocument(),
              projectRevision,
            );
            setProjectRevision(snapshot.revision);
          } catch (error) {
            console.error("User directory save failed", error);
            setSaveStatus("error");
          }
        }
      } catch (err) {
        console.error("Failed auto-saving cineflow project:", err);
        setSaveStatus("error");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    scenes,
    timelines,
    assets,
    plugins,
    variables,
    projectName,
    currentProjectId,
    projectRoot,
    projectRevision,
  ]);

  // Project selectors and handlers
  const handleSelectProject = (projectId: string) => {
    setIsPlaying(false);
    isSwitchingProjectRef.current = true;
    setCurrentProjectId(projectId);
    localStorage.setItem("cineflow_active_project_id", projectId);

    // Load detail
    try {
      const detailsStr = localStorage.getItem(
        `cineflow_project_detail_${projectId}`,
      );
      if (detailsStr) {
        const details = JSON.parse(detailsStr);
        setProjectName(details.name || "未命名项目");
        setScenes(details.scenes || []);
        setTimelines(details.timelines || {});
        setAssets(details.assets || []);
        setPlugins(details.plugins || []);
        setVariables(details.variables || []);

        if (details.scenes && details.scenes.length > 0) {
          setActiveSceneId(details.scenes[0].id);
        } else {
          setActiveSceneId("");
        }
      }
    } catch (e) {
      console.error("Error loading project detail:", e);
    }

    // Reset playhead selection state
    setCurrentTime(0);
    setSelectedClipId(null);
    setSelectedTrackId(null);

    // Allow auto-save after states settle
    setTimeout(() => {
      isSwitchingProjectRef.current = false;
    }, 150);
  };

  const handleCreateProject = (type: "blank" | "template") => {
    const newId = `project-${Date.now()}`;
    let newProject: ProjectDocument;

    if (type === "blank") {
      const blankSceneId = `scene-1`;
      newProject = {
        id: newId,
        name: `未命名项目_${projectsMeta.length + 1}`,
        lastModified: Date.now(),
        scenes: [
          {
            id: blankSceneId,
            name: "01_起始场景 (Start)",
            videoUrl:
              "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
            duration: 15,
            thumbnail:
              "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80",
            description: "初始空白分支场景。双击此处在右侧配置属性。",
            position: { x: 80, y: 150 },
            choices: [],
          },
        ],
        timelines: {
          [blankSceneId]: [
            {
              id: `t-vid-${blankSceneId}`,
              name: "🎥 视频分镜 (Video)",
              type: "video",
              clips: [],
            },
            {
              id: `t-aud-${blankSceneId}`,
              name: "🔊 动作音效 (SFX)",
              type: "audio",
              clips: [],
            },
            {
              id: `t-bgm-${blankSceneId}`,
              name: "🎵 背景音乐 (BGM)",
              type: "bgm",
              clips: [],
            },
            {
              id: `t-sub-${blankSceneId}`,
              name: "💬 对白字幕 (Subtitle)",
              type: "subtitle",
              clips: [],
            },
            {
              id: `t-trig-${blankSceneId}`,
              name: "⚡ 分支决断 (Choice)",
              type: "trigger",
              clips: [],
            },
            {
              id: `t-var-${blankSceneId}`,
              name: "📊 变量操作 (Variable)",
              type: "variable",
              clips: [],
            },
            {
              id: `t-ach-${blankSceneId}`,
              name: "🏆 成就解锁 (Achievement)",
              type: "achievement",
              clips: [],
            },
            {
              id: `t-cam-${blankSceneId}`,
              name: "📹 镜头控制 (Camera)",
              type: "camera",
              clips: [],
            },
            {
              id: `t-eff-${blankSceneId}`,
              name: "✨ 屏幕特效 (Effect)",
              type: "effect",
              clips: [],
            },
          ],
        },
        assets: INITIAL_ASSETS,
        plugins: INITIAL_PLUGINS,
        variables: [],
      };
    } else {
      newProject = {
        id: newId,
        name: `赛博幻想剧情_${projectsMeta.length + 1}`,
        lastModified: Date.now(),
        scenes: INITIAL_SCENES,
        timelines: INITIAL_TIMELINES_BY_SCENE,
        assets: INITIAL_ASSETS,
        plugins: INITIAL_PLUGINS,
        variables: INITIAL_VARIABLES,
      };
    }

    localStorage.setItem(
      `cineflow_project_detail_${newId}`,
      JSON.stringify(newProject),
    );

    const newMeta = {
      id: newId,
      name: newProject.name,
      lastModified: newProject.lastModified,
      sceneCount: newProject.scenes.length,
      thumbnail: newProject.scenes[0]?.thumbnail || "",
    };

    const updatedMeta = [...projectsMeta, newMeta];
    localStorage.setItem("cineflow_projects_meta", JSON.stringify(updatedMeta));
    setProjectsMeta(updatedMeta);

    handleSelectProject(newId);
    setShowProjectManager(false);
  };

  const handleDeleteProject = (projectIdToDelete: string) => {
    localStorage.removeItem(`cineflow_project_detail_${projectIdToDelete}`);
    const updatedMeta = projectsMeta.filter((p) => p.id !== projectIdToDelete);

    if (updatedMeta.length === 0) {
      localStorage.setItem("cineflow_projects_meta", JSON.stringify([]));
      setProjectsMeta([]);
      window.location.reload();
      return;
    }

    localStorage.setItem("cineflow_projects_meta", JSON.stringify(updatedMeta));
    setProjectsMeta(updatedMeta);

    if (currentProjectId === projectIdToDelete) {
      handleSelectProject(updatedMeta[0].id);
    }
  };

  const handleDuplicateProject = (projectIdToDuplicate: string) => {
    try {
      const detailsStr = localStorage.getItem(
        `cineflow_project_detail_${projectIdToDuplicate}`,
      );
      if (detailsStr) {
        const details = JSON.parse(detailsStr);
        const newId = `project-${Date.now()}`;
        const duplicatedProject = {
          ...details,
          id: newId,
          name: `${details.name} (副本)`,
          lastModified: Date.now(),
        };

        localStorage.setItem(
          `cineflow_project_detail_${newId}`,
          JSON.stringify(duplicatedProject),
        );

        const newMeta = {
          id: newId,
          name: duplicatedProject.name,
          lastModified: duplicatedProject.lastModified,
          sceneCount: duplicatedProject.scenes.length,
          thumbnail: duplicatedProject.scenes[0]?.thumbnail || "",
        };

        const updatedMeta = [...projectsMeta, newMeta];
        localStorage.setItem(
          "cineflow_projects_meta",
          JSON.stringify(updatedMeta),
        );
        setProjectsMeta(updatedMeta);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameProjectMeta = (idToRename: string, newName: string) => {
    if (idToRename === currentProjectId) {
      setProjectName(newName);
    } else {
      try {
        const detailsStr = localStorage.getItem(
          `cineflow_project_detail_${idToRename}`,
        );
        if (detailsStr) {
          const details = JSON.parse(detailsStr);
          details.name = newName;
          details.lastModified = Date.now();
          localStorage.setItem(
            `cineflow_project_detail_${idToRename}`,
            JSON.stringify(details),
          );
        }
      } catch (e) {
        console.error(e);
      }
    }

    setProjectsMeta((prev) => {
      const updated = prev.map((p) =>
        p.id === idToRename
          ? { ...p, name: newName, lastModified: Date.now() }
          : p,
      );
      localStorage.setItem("cineflow_projects_meta", JSON.stringify(updated));
      return updated;
    });
  };

  const handleImportProject = (projectJSON: string) => {
    try {
      const data: ImportedProject = JSON.parse(projectJSON);
      const newId = `project-${Date.now()}`;

      const newProject = {
        id: newId,
        name: data.projectName || data.name || "导入的电影剧本",
        lastModified: Date.now(),
        scenes: data.scenes || [],
        timelines: data.timelines || data.timelineTracks || {},
        assets: data.assets || INITIAL_ASSETS,
        plugins: data.plugins || INITIAL_PLUGINS,
        variables: data.variables || data.globalVariables || [],
      };

      if (
        data.scenes &&
        data.scenes.length > 0 &&
        Object.keys(newProject.timelines).length === 0
      ) {
        const parsedTimelines: Record<string, TimelineTrack[]> = {};
        data.scenes.forEach((sc) => {
          if (sc.timelineTracks) {
            parsedTimelines[sc.id] = sc.timelineTracks;
          }
        });
        newProject.timelines = parsedTimelines;
      }

      localStorage.setItem(
        `cineflow_project_detail_${newId}`,
        JSON.stringify(newProject),
      );

      const newMeta = {
        id: newId,
        name: newProject.name,
        lastModified: newProject.lastModified,
        sceneCount: newProject.scenes.length,
        thumbnail: newProject.scenes[0]?.thumbnail || "",
      };

      const updatedMeta = [...projectsMeta, newMeta];
      localStorage.setItem(
        "cineflow_projects_meta",
        JSON.stringify(updatedMeta),
      );
      setProjectsMeta(updatedMeta);

      handleSelectProject(newId);
      setShowProjectManager(false);
      alert("项目文件导入成功！已自动加载。");
    } catch {
      alert("导入失败，请确保 JSON 文件包含标准的 CineFlow 工作站属性。");
    }
  };

  // 1c. Playhead animation frame tick logic (highly responsive and precise)
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const update = () => {
      if (isPlaying) {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= activeScene.duration) {
            if (isSingleNodePlayback) {
              return 0;
            } else {
              setIsPlaying(false);
              return activeScene.duration;
            }
          }
          return next;
        });

        lastTime = now;
      }
      animId = requestAnimationFrame(update);
    };

    if (isPlaying) {
      lastTime = performance.now();
      animId = requestAnimationFrame(update);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, activeScene.duration, isSingleNodePlayback]);

  // 2. Scene select / switch branch handler
  const handleSelectScene = (sceneId: string) => {
    setIsPlaying(false);
    setActiveSceneId(sceneId);
    setCurrentTime(0);
    setSelectedClipId(null);
    setSelectedTrackId(null);
  };

  // 3. Drag-and-update scene positions in Flowchart
  const handleUpdateScenePosition = (id: string, x: number, y: number) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, position: { x, y } } : s)),
    );
  };

  // 4. Create new storyline scene node
  const handleAddScene = () => {
    const newId = `scene-${Date.now()}`;
    const newScene: SceneNode = {
      id: newId,
      name: `新建剧情节点_${scenes.length + 1}`,
      videoUrl:
        "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
      duration: 15,
      thumbnail:
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80",
      description: "在此双击编辑场景概述。可配置多条条件驱动的支线。",
      position: { x: 300, y: 150 },
      choices: [],
    };

    const defaultTracks: TimelineTrack[] = [
      {
        id: `t-vid-${newId}`,
        name: "🎥 视频分镜 (Video)",
        type: "video",
        clips: [],
      },
      {
        id: `t-aud-${newId}`,
        name: "🔊 动作音效 (SFX)",
        type: "audio",
        clips: [],
      },
      {
        id: `t-bgm-${newId}`,
        name: "🎵 背景音乐 (BGM)",
        type: "bgm",
        clips: [],
      },
      {
        id: `t-sub-${newId}`,
        name: "💬 对白字幕 (Subtitle)",
        type: "subtitle",
        clips: [],
      },
      {
        id: `t-trig-${newId}`,
        name: "⚡ 分支决断 (Choice)",
        type: "trigger",
        clips: [],
      },
      {
        id: `t-var-${newId}`,
        name: "📊 变量操作 (Variable)",
        type: "variable",
        clips: [],
      },
      {
        id: `t-ach-${newId}`,
        name: "🏆 成就解锁 (Achievement)",
        type: "achievement",
        clips: [],
      },
      {
        id: `t-cam-${newId}`,
        name: "📹 镜头控制 (Camera)",
        type: "camera",
        clips: [],
      },
      {
        id: `t-eff-${newId}`,
        name: "✨ 屏幕特效 (Effect)",
        type: "effect",
        clips: [],
      },
    ];

    setScenes((prev) => [...prev, newScene]);
    setTimelines((prev) => ({
      ...prev,
      [newId]: defaultTracks,
    }));
    handleSelectScene(newId);
  };

  // 5. Delete scene node
  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    setScenes((prev) => prev.filter((s) => s.id !== id));
    // Remove references in choices
    setScenes((prev) =>
      prev.map((s) => ({
        ...s,
        choices: s.choices.filter((c) => c.targetSceneId !== id),
      })),
    );
    // Cleanup timelines
    const updatedTimelines = { ...timelines };
    delete updatedTimelines[id];
    setTimelines(updatedTimelines);

    // Switch active scene if needed
    if (activeSceneId === id) {
      const remaining = scenes.filter((s) => s.id !== id);
      handleSelectScene(remaining[0].id);
    }
  };

  // 6. Manage timeline clips drag/move/resize timings
  const handleUpdateClipTiming = (
    trackId: string,
    clipId: string,
    startTime: number,
    duration: number,
  ) => {
    setTimelines((prev) => {
      const currentSceneTracks = prev[activeSceneId] || [];
      const updatedSceneTracks = currentSceneTracks.map((track) => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          clips: track.clips.map((clip) =>
            clip.id === clipId ? { ...clip, startTime, duration } : clip,
          ),
        };
      });

      return {
        ...prev,
        [activeSceneId]: updatedSceneTracks,
      };
    });
  };

  // 7. Click Timeline slot to add blank clips
  const handleAddClip = (trackId: string) => {
    const track = activeTracks.find((t) => t.id === trackId);
    if (!track) return;

    const newId = `clip-added-${Date.now()}`;
    let title = "新片段";
    let color = "bg-blue-600/30 text-blue-300 border-blue-500";
    let content: TimelineClip["content"] = {};

    if (track.type === "subtitle") {
      title = "双语字幕内容";
      color =
        "bg-purple-600/30 hover:bg-purple-600/40 border-purple-500 text-purple-300";
      content = { text: "点击在右侧编辑字幕内容 / Double click to edit" };
    } else if (track.type === "trigger" || track.type === "choice") {
      title = "抉择交互分支触发点";
      color =
        "bg-amber-600/30 hover:bg-amber-600/40 border-amber-500 text-amber-300";
      content = { choices: [] };
    } else if (track.type === "plugin") {
      title = "QTE: 快速反应事件 (SPACE)";
      color =
        "bg-rose-600/30 hover:bg-rose-600/40 border-rose-500 text-rose-300";
      content = {
        pluginId: "p-qte",
        pluginConfig: { keyTrigger: "SPACE", timeLimit: 1.5 },
      };
    } else if (track.type === "audio") {
      title = "音效_Cyber_Sfx.wav";
      color =
        "bg-indigo-600/30 hover:bg-indigo-600/40 border-indigo-500 text-indigo-300";
      content = { volume: 85 };
    } else if (track.type === "bgm") {
      title = "背景音乐_Ambient.mp3";
      color =
        "bg-teal-600/30 hover:bg-teal-600/40 border-teal-500 text-teal-300";
      content = { volume: 70, loop: true };
    } else if (track.type === "video") {
      title = "视频分镜_Clip.mp4";
      color =
        "bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500 text-emerald-300";
      content = { videoUrl: "a-vid-1" };
    } else if (track.type === "variable") {
      title = "变量操作: credits += 50";
      color =
        "bg-cyan-600/30 hover:bg-cyan-600/40 border-cyan-500 text-cyan-300";
      content = { variableId: "v3", operation: "add", value: 50 };
    } else if (track.type === "achievement") {
      title = "解锁成就: 【初出茅庐】";
      color =
        "bg-yellow-600/30 hover:bg-yellow-600/40 border-yellow-500 text-yellow-300";
      content = { achievementName: "初出茅庐", points: 10 };
    } else if (track.type === "camera") {
      title = "镜头控制: 特写镜头(Zoom-In)";
      color = "bg-sky-600/30 hover:bg-sky-600/40 border-sky-500 text-sky-300";
      content = { preset: "zoom-in", duration: 2.0 };
    } else if (track.type === "effect") {
      title = "视觉特效: Glitch故障抖动";
      color =
        "bg-fuchsia-600/30 hover:bg-fuchsia-600/40 border-fuchsia-500 text-fuchsia-300";
      content = { effectType: "glitch", intensity: "medium" };
    }

    const newClip: TimelineClip = {
      id: newId,
      title,
      startTime: Math.max(0, currentTime),
      duration: 3,
      color,
      content,
    };

    setTimelines((prev) => {
      const currentSceneTracks = prev[activeSceneId] || [];
      const updatedSceneTracks = currentSceneTracks.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          clips: [...t.clips, newClip],
        };
      });
      return {
        ...prev,
        [activeSceneId]: updatedSceneTracks,
      };
    });

    setSelectedClipId(newId);
    setSelectedTrackId(trackId);
  };

  const handleDeleteClip = (trackId: string, clipId: string) => {
    setTimelines((prev) => {
      const currentSceneTracks = prev[activeSceneId] || [];
      const updatedSceneTracks = currentSceneTracks.map((track) => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          clips: track.clips.filter((c) => c.id !== clipId),
        };
      });
      return {
        ...prev,
        [activeSceneId]: updatedSceneTracks,
      };
    });

    if (selectedClipId === clipId) {
      setSelectedClipId(null);
      setSelectedTrackId(null);
    }
  };

  const handleSelectClip = (clipId: string, trackId: string) => {
    setSelectedClipId(clipId);
    setSelectedTrackId(trackId);
  };

  // 8. Update selected clip content from Inspector
  const handleUpdateClipContent = (
    trackId: string,
    clipId: string,
    updatedContent: TimelineClip["content"],
  ) => {
    setTimelines((prev) => {
      const currentSceneTracks = prev[activeSceneId] || [];
      const updatedSceneTracks = currentSceneTracks.map((track) => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          clips: track.clips.map((clip) =>
            clip.id === clipId ? { ...clip, content: updatedContent } : clip,
          ),
        };
      });

      // Also sync active scene decisions list with choice triggers clips inside timeline
      const activeTrack = currentSceneTracks.find((t) => t.id === trackId);
      let syncedScenes = scenes;
      if (activeTrack && activeTrack.type === "trigger") {
        syncedScenes = scenes.map((s) => {
          if (s.id !== activeSceneId) return s;
          return {
            ...s,
            choices: updatedContent.choices || [],
          };
        });
        setScenes(syncedScenes);
      }

      return {
        ...prev,
        [activeSceneId]: updatedSceneTracks,
      };
    });
  };

  const handleUpdateClipTitle = (
    trackId: string,
    clipId: string,
    title: string,
  ) => {
    setTimelines((prev) => {
      const currentSceneTracks = prev[activeSceneId] || [];
      return {
        ...prev,
        [activeSceneId]: currentSceneTracks.map((track) => {
          if (track.id !== trackId) return track;
          return {
            ...track,
            clips: track.clips.map((clip) =>
              clip.id === clipId ? { ...clip, title } : clip,
            ),
          };
        }),
      };
    });
  };

  // Get selected clip data reference for Inspector
  const getSelectedClipRef = (): TimelineClip | null => {
    if (!selectedClipId || !selectedTrackId) return null;
    const track = activeTracks.find((t) => t.id === selectedTrackId);
    return track?.clips.find((c) => c.id === selectedClipId) || null;
  };

  // Update scene properties
  const handleUpdateScene = (
    sceneId: string,
    updatedFields: Partial<SceneNode>,
  ) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, ...updatedFields } : s)),
    );
  };

  // 9. Asset management callbacks
  const handleAddAsset = (newAsset: MediaAsset) => {
    setAssets((prev) => [...prev, newAsset]);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateAsset = (updatedAsset: MediaAsset) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)),
    );
  };

  // 10. Plugin system updates
  const handleUpdatePlugin = (updated: EditorPlugin) => {
    setPlugins((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddPlugin = (newPlugin: EditorPlugin) => {
    setPlugins((prev) => [...prev, newPlugin]);
  };

  // 11. Project variable updates
  const handleAddVariable = (newVar: ProjectVariable) => {
    setVariables((prev) => [...prev, newVar]);
  };

  const handleDeleteVariable = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateVariableValue = (
    id: string,
    value: ProjectVariable["value"],
  ) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, value } : v)),
    );
  };

  const handleUpdateVariableByName = (
    name: string,
    value: ProjectVariable["value"],
  ) => {
    setVariables((prev) =>
      prev.map((v) => (v.name === name ? { ...v, value } : v)),
    );
  };

  // 12. Full Project Export format
  const generateProjectJSON = () => {
    const projectSchema = {
      projectName: projectName,
      version: "CineFlow-1.0.0",
      globalVariables: variables,
      plugins: plugins.filter((p) => p.isActive),
      scenes: scenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        duration: scene.duration,
        videoUrl: scene.videoUrl,
        choices: scene.choices,
        timelineTracks: timelines[scene.id] || [],
      })),
    };
    return JSON.stringify(projectSchema, null, 2);
  };

  const handleApplyParsedData = (parsedData: ParsedScriptData) => {
    // 1. Update Project Variables
    const newVars = parsedData.variables.map((v, index) => ({
      id: v.id || `v-ai-${index}`,
      name: v.name,
      type: v.type as "boolean" | "number" | "string",
      value:
        v.type === "number"
          ? Number(v.value)
          : v.type === "boolean"
            ? v.value === "true" || v.value === true
            : String(v.value),
    }));
    setVariables(newVars);

    // 2. Update Scenes List
    const newScenes = parsedData.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      videoUrl: scene.videoUrl,
      duration: scene.duration || 15,
      thumbnail:
        scene.thumbnail ||
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80",
      description: scene.description || "",
      position: scene.position || { x: 100, y: 150 },
      choices: scene.choices || [],
    }));
    setScenes(newScenes);

    // 3. Update Timelines Map
    const newTimelines: Record<string, TimelineTrack[]> = {};
    parsedData.timelines.forEach((tData) => {
      newTimelines[tData.sceneId] = tData.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        type: track.type,
        clips: track.clips.map((clip) => ({
          id: clip.id,
          title: clip.title,
          startTime: clip.startTime,
          duration: clip.duration,
          color:
            clip.color ||
            (track.type === "video"
              ? "bg-emerald-600/30 text-emerald-300 border-emerald-500"
              : track.type === "audio"
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500"
                : track.type === "subtitle"
                  ? "bg-purple-600/30 text-purple-300 border-purple-500"
                  : track.type === "trigger"
                    ? "bg-amber-600/30 text-amber-300 border-amber-500"
                    : "bg-blue-600/30 text-blue-300 border-blue-500"),
          content: clip.content || {},
        })),
      }));
    });

    // Ensure all scenes have default timelines if not explicitly parsed
    newScenes.forEach((sc) => {
      if (!newTimelines[sc.id]) {
        newTimelines[sc.id] = [
          {
            id: `t-vid-${sc.id}`,
            name: "🎥 视频轨道 (Video)",
            type: "video",
            clips: [],
          },
          {
            id: `t-aud-${sc.id}`,
            name: "🔊 音频轨道 (Audio)",
            type: "audio",
            clips: [],
          },
          {
            id: `t-sub-${sc.id}`,
            name: "💬 字幕轨道 (Subtitle)",
            type: "subtitle",
            clips: [],
          },
          {
            id: `t-trig-${sc.id}`,
            name: "⚡ 交互决断 (Choices)",
            type: "trigger",
            clips: [],
          },
        ];
      }
    });

    setTimelines(newTimelines);

    // Select the first parsed scene as active scene
    if (newScenes.length > 0) {
      handleSelectScene(newScenes[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 font-sans flex flex-col overflow-hidden antialiased">
      {/* ================= HEADER BAR ================= */}
      <header className="h-14 bg-[#111420] border-b border-slate-800 flex items-center justify-between px-5 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <Flame className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xs font-extrabold tracking-wide text-slate-100 flex items-center gap-1.5">
                <span>CineFlow</span>
                <span className="text-[8px] uppercase font-mono px-1 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">
                  Studio
                </span>
              </h1>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800"></div>

          <button
            onClick={() => void handleChooseProjectDirectory()}
            className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg cursor-pointer"
            title="选择用户目录并保存真实项目文件"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {projectRoot ? "项目目录已连接" : "连接项目目录"}
          </button>

          {/* Project Hub button & editable Project Title block */}
          <div className="flex items-center gap-3 bg-[#0c0e18] px-3 py-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowProjectManager(true)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 transition-colors cursor-pointer mr-1"
              title="打开项目管理器"
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-[11px]">项目库</span>
            </button>

            <div className="h-4 w-px bg-slate-800"></div>

            {/* Editable Project Name */}
            <div className="flex items-center min-w-0">
              {isEditingProjectName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempProjectName}
                    onChange={(e) => setTempProjectName(e.target.value)}
                    onBlur={() => {
                      if (tempProjectName.trim()) {
                        setProjectName(tempProjectName.trim());
                      }
                      setIsEditingProjectName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (tempProjectName.trim()) {
                          setProjectName(tempProjectName.trim());
                        }
                        setIsEditingProjectName(false);
                      } else if (e.key === "Escape") {
                        setIsEditingProjectName(false);
                      }
                    }}
                    className="bg-slate-950 border border-amber-500/50 rounded px-1.5 py-0.5 text-[11px] text-slate-100 font-bold focus:outline-none w-32"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (tempProjectName.trim()) {
                        setProjectName(tempProjectName.trim());
                      }
                      setIsEditingProjectName(false);
                    }}
                    className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/title">
                  <span
                    onClick={() => {
                      setTempProjectName(projectName);
                      setIsEditingProjectName(true);
                    }}
                    className="text-[11px] font-extrabold text-slate-300 truncate max-w-[150px] cursor-pointer hover:text-amber-400 transition-colors"
                    title="双击或点击图标重命名项目"
                  >
                    {projectName}
                  </span>
                  <button
                    onClick={() => {
                      setTempProjectName(projectName);
                      setIsEditingProjectName(true);
                    }}
                    className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-slate-300 transition-all p-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-800"></div>

            {/* Autosave badge feedback */}
            <div className="flex items-center shrink-0">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500/80 font-medium font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                  <span>正在自动保存...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500/80 font-mono">
                  <Cloud className="w-3 h-3 text-emerald-500" />
                  <span>已保存</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-[10px] text-rose-500 font-mono">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span>保存失败</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Workspace views toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setWorkspaceLayout("standard")}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer flex items-center gap-1 ${
              workspaceLayout === "standard"
                ? "bg-slate-800 text-amber-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layout className="w-3 h-3" />
            标准工作台
          </button>
          <button
            onClick={() => setWorkspaceLayout("flow-focus")}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer flex items-center gap-1 ${
              workspaceLayout === "flow-focus"
                ? "bg-slate-800 text-amber-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitBranch className="w-3 h-3" />
            全景流向大纲
          </button>
          <button
            onClick={() => setWorkspaceLayout("timeline-focus")}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer flex items-center gap-1 ${
              workspaceLayout === "timeline-focus"
                ? "bg-slate-800 text-amber-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-3 h-3" />
            轨道剪辑聚焦
          </button>
          <button
            onClick={() => setWorkspaceLayout("cinema-preview")}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer flex items-center gap-1 ${
              workspaceLayout === "cinema-preview"
                ? "bg-slate-800 text-amber-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="隐藏所有编辑器组件，以沉浸式玩家视角预览此互动电影"
          >
            <Film className="w-3 h-3 text-amber-500" />
            影院沉浸试播
          </button>
          <button
            onClick={() => setWorkspaceLayout("native-engine")}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer flex items-center gap-1 ${
              workspaceLayout === "native-engine"
                ? "bg-slate-800 text-amber-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="查看 Zig/C++ 原生 PC 底层引擎生成，整理商业化性能与安全需求"
          >
            <Cpu className="w-3 h-3 text-amber-500" />
            PC 原生引擎 & 商业化需求
          </button>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>系统架构与API</span>
          </button>

          <button
            onClick={() => setShowScriptDecomposer(true)}
            className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/5"
            title="一键将纯文本剧本利用大模型（如DeepSeek / Gemini）拆分为场景和时间轴"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>AI 剧本一键拆分剧情</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0d0f14] font-bold text-xs px-3 py-1.5 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出交互剧本 (JSON)</span>
          </button>
        </div>
      </header>

      {/* ================= WORKSPACE PANELS ================= */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0 bg-[#07090e]">
        {workspaceLayout === "native-engine" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <NativeEngineCenter
              scenes={scenes}
              variables={variables}
              activeSceneId={activeSceneId}
            />
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: ASSETS & PLUGINS (Shown in standard/timeline modes) */}
            {!["flow-focus", "cinema-preview"].includes(workspaceLayout) && (
              <div className="w-80 flex flex-col shrink-0 min-h-0">
                <AssetManager
                  assets={assets}
                  onAddAsset={handleAddAsset}
                  onImportRealAsset={handleImportRealAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onUpdateAsset={handleUpdateAsset}
                  plugins={plugins}
                  onUpdatePlugin={handleUpdatePlugin}
                  onAddPlugin={handleAddPlugin}
                  variables={variables}
                  onAddVariable={handleAddVariable}
                  onDeleteVariable={handleDeleteVariable}
                  onUpdateVariableValue={handleUpdateVariableValue}
                />
              </div>
            )}

            {/* MIDDLE COMBINED CORE COLUMNS */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* TOP HALF: NODEFLOW & PLAYER */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
                {/* Outline Graph (Flexibly size-bound based on layout focus) */}
                <div
                  className={`min-h-[220px] ${
                    workspaceLayout === "flow-focus"
                      ? "md:col-span-12"
                      : ["timeline-focus", "cinema-preview"].includes(
                            workspaceLayout,
                          )
                        ? "hidden"
                        : "md:col-span-6"
                  }`}
                >
                  <Flowchart
                    scenes={scenes}
                    activeSceneId={activeSceneId}
                    onSelectScene={handleSelectScene}
                    onAddScene={handleAddScene}
                    onDeleteScene={handleDeleteScene}
                    onUpdateScenePosition={handleUpdateScenePosition}
                    onUpdateScene={handleUpdateScene}
                    timelines={timelines}
                    variables={variables}
                  />
                </div>

                {/* Interactive Cinema Player */}
                {workspaceLayout !== "flow-focus" && (
                  <div
                    className={`${
                      ["timeline-focus", "cinema-preview"].includes(
                        workspaceLayout,
                      )
                        ? "md:col-span-12"
                        : "md:col-span-6"
                    } flex items-center justify-center min-h-[220px]`}
                  >
                    <Player
                      scene={activeScene}
                      tracks={activeTracks}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      onTimeUpdate={setCurrentTime}
                      onPlayToggle={() => setIsPlaying(!isPlaying)}
                      onSelectScene={handleSelectScene}
                      variables={variables}
                      onUpdateVariable={handleUpdateVariableByName}
                      plugins={plugins}
                      isTransitioning={isTransitioning}
                      setIsTransitioning={setIsTransitioning}
                      isCinemaMode={workspaceLayout === "cinema-preview"}
                      onExitCinemaMode={() => setWorkspaceLayout("standard")}
                      isSingleNodePlayback={isSingleNodePlayback}
                      onToggleSingleNodePlayback={() =>
                        setIsSingleNodePlayback(!isSingleNodePlayback)
                      }
                    />
                  </div>
                )}
              </div>

              {/* BOTTOM HALF: MULTI-TRACK TIMELINE CHANNELS (Standard & timeline modes) */}
              {!["flow-focus", "cinema-preview"].includes(workspaceLayout) && (
                <div className="h-64 shrink-0">
                  <Timeline
                    tracks={activeTracks}
                    currentTime={currentTime}
                    duration={activeScene.duration}
                    isPlaying={isPlaying}
                    onTimeChange={setCurrentTime}
                    onPlayToggle={() => setIsPlaying(!isPlaying)}
                    onStop={() => {
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    selectedClipId={selectedClipId}
                    onSelectClip={handleSelectClip}
                    onUpdateClipTiming={handleUpdateClipTiming}
                    onAddClip={handleAddClip}
                    onDeleteClip={handleDeleteClip}
                    isSingleNodePlayback={isSingleNodePlayback}
                    onToggleSingleNodePlayback={() =>
                      setIsSingleNodePlayback(!isSingleNodePlayback)
                    }
                  />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: INSPECTOR & PROPERTIES */}
            {!["flow-focus", "cinema-preview"].includes(workspaceLayout) && (
              <div className="w-80 flex flex-col shrink-0 min-h-0">
                <Inspector
                  selectedClip={getSelectedClipRef()}
                  selectedTrackId={selectedTrackId}
                  activeScene={activeScene}
                  allScenes={scenes}
                  onUpdateClipContent={handleUpdateClipContent}
                  onUpdateClipTitle={handleUpdateClipTitle}
                  onUpdateScene={handleUpdateScene}
                  allAssets={assets}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= MODAL: EXPORT CODE ================= */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121625] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-100">
                  一键打包导出：交互式影游数据包
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              该 JSON
              已深度绑定剧情流向图（NodeFlow）、全局属性、玩家前置条件判定（Condition），以及多轨道微服务插件参数。
              可无缝对接客户端 Vue-CinePlayer 或者 Electron 进行离线打包播放。
            </p>

            <div className="relative">
              <span className="absolute top-2.5 right-3 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                JSON SCHEME READY
              </span>
              <pre className="h-64 overflow-auto bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300 leading-normal select-text">
                {generateProjectJSON()}
              </pre>
            </div>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => void handleExportCurrentSceneMp4()}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs py-2 px-5 rounded-lg shadow-md cursor-pointer transition-all"
                title="用项目目录中的本地视频导出当前场景 MP4"
              >
                导出当前场景 MP4
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateProjectJSON());
                  alert("交互剧本配置已成功复制到剪贴板！");
                }}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0d0f14] font-bold text-xs py-2 px-5 rounded-lg shadow-md cursor-pointer transition-all"
              >
                复制数据包
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: HELP & API DOCUMENTATION ================= */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121625] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-scale-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-100">
                  影游编辑器：多轨插件系统架构与 SDK
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  1. 多轨道时间轴设计 (Interactive Multi-track Timeline)
                </h4>
                <p className="text-slate-400">
                  工作站共分配 5 个核心交互通道。<strong>视频轨/音频轨</strong>
                  控制媒体流基础；<strong>字幕轨</strong>控制多语言渲染；
                  <strong>交互决断轨</strong>
                  控制在特定帧暂停并拉起全景条件分支；<strong>插件轨</strong>
                  可通过沙箱 JavaScript 动态生成微游戏、QTE
                  连击按键或者属性看板。
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  2. 自定义插件注册系统与 API (Custom Plugins System & API)
                </h4>
                <p className="text-slate-400">
                  你可以通过左下角的插件面板，编写微服务脚本并将其编译到工作站中。系统原生提供{" "}
                  <code>editorAPI</code> 和 <code>variables</code> 暴露接口。
                </p>
                <pre className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 mt-2 font-mono text-[9.5px] text-emerald-400">
                  {`// 1. 注册新音画复合通道轨道
editorAPI.registerTrackType(trackName);

// 2. 在播放器中执行变量属性回调
updateVariable(variableName, (currentVal) => { ... });

// 3. 系统原生消息总线通知
editorAPI.notify(messageString);`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  3. 属性驱动故事判定条件 (Variable-Driven Branching)
                </h4>
                <p className="text-slate-400">
                  对于任意交互选项（Choice），可在 Inspector 中输入 JavaScript
                  验证表达式：
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded p-2.5 mt-1 text-[10px] font-mono text-amber-500">
                  hackingLevel &gt;= 2 && hasMemoryChip === true
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  当变量不满足条件时，播放器会在触发点自动对该选项加锁（Lock
                  state）并拒绝触发，引导玩家去其它剧情节点探索。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-amber-500 hover:bg-amber-600 text-[#0d0f14] font-bold text-xs py-2 px-5 rounded-lg shadow-md cursor-pointer transition-colors"
              >
                理解并进入编辑器
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Decomposer Modal Overlay */}
      {showScriptDecomposer && (
        <ScriptDecomposer
          onClose={() => setShowScriptDecomposer(false)}
          onApplyParsedData={handleApplyParsedData}
        />
      )}

      {/* Project Manager Modal Overlay */}
      {showProjectManager && (
        <ProjectManager
          isOpen={showProjectManager}
          onClose={() => setShowProjectManager(false)}
          currentProjectId={currentProjectId}
          onSelectProject={handleSelectProject}
          onImportProject={handleImportProject}
          allProjectsMeta={projectsMeta}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProjectMeta}
          onDuplicateProject={handleDuplicateProject}
        />
      )}
    </div>
  );
}
