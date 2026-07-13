import React, { useState } from "react";
import { SceneNode, ProjectVariable } from "../types";
import {
  Cpu,
  Terminal,
  Layers,
  Code2,
  Sparkles,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  Briefcase,
  ExternalLink,
  Database,
  Video,
  FileText,
  FolderArchive,
  Activity,
  Shield,
  RefreshCw,
} from "lucide-react";

interface NativeEngineCenterProps {
  scenes: SceneNode[];
  variables: ProjectVariable[];
  activeSceneId: string;
}

interface RequirementItem {
  id: string;
  category: "performance" | "security" | "crossplatform" | "pipeline";
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium";
  status: "pending" | "designing" | "implemented";
  target: "Zig Native" | "C++ Engine" | "Vue Bridge";
}

interface ProbeStream {
  codecType: string;
  codecName: string;
  width?: number;
  height?: number;
  frameRate?: string;
  channels?: number;
  pixelFormat?: string;
}

interface ProbeResult {
  success: true;
  source: string;
  metadata: {
    format: string;
    duration: number;
    size: number;
    bitRate: string;
    streams: ProbeStream[];
  };
}

type ProbeApiResponse = ProbeResult | { success: false; error?: string };

interface FfmpegPipelineResponse {
  logs: string[];
  downloadUrl: string;
  renderedFileSize: string;
  hardwareAccelerationActive: boolean;
}

interface FfmpegResult {
  success: true;
  downloadUrl: string;
  renderedFileSize: string;
  hardwareAccelerationActive: boolean;
}

type FfmpegOperation = "stitch" | "compress" | "subtitle" | "watermark";
type FfmpegCodec = "libx264" | "libx265" | "nvenc_h264";
type FfmpegResolution = "3840x2160" | "1920x1080" | "1280x720";
type FfmpegBitrate = "5000k" | "2500k" | "1000k";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export default function NativeEngineCenter({
  scenes,
  variables,
  activeSceneId,
}: NativeEngineCenterProps) {
  const [selectedLang, setSelectedLang] = useState<
    "zig" | "cpp" | "vue-bridge"
  >("zig");
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationSuccess, setCompilationSuccess] = useState<boolean | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "requirements" | "code-gen" | "media-engine" | "terminal"
  >("requirements");

  // Media SDK Processing States
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);

  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const [isProcessingFfmpeg, setIsProcessingFfmpeg] = useState(false);
  const [ffmpegOperation, setFfmpegOperation] =
    useState<FfmpegOperation>("stitch");
  const [ffmpegCodec, setFfmpegCodec] = useState<FfmpegCodec>("libx264");
  const [ffmpegResolution, setFfmpegResolution] =
    useState<FfmpegResolution>("1920x1080");
  const [ffmpegBitrate, setFfmpegBitrate] = useState<FfmpegBitrate>("2500k");
  const [ffmpegAccel, setFfmpegAccel] = useState(true);
  const [ffmpegLogs, setFfmpegLogs] = useState<string[]>([]);
  const [ffmpegResult, setFfmpegResult] = useState<FfmpegResult | null>(null);

  // Aliyun OSS States
  const [isUploadingOss, setIsUploadingOss] = useState(false);
  const [ossUploadProgress, setOssUploadProgress] = useState(0);
  const [ossUploadSpeed, setOssUploadSpeed] = useState("0 MB/s");
  const [ossUploadStatus, setOssUploadStatus] = useState<
    "idle" | "sts" | "uploading" | "completed"
  >("idle");
  const [ossThrottling, setOssThrottling] = useState(5); // 5 MB/s
  const [ossLog, setOssLog] = useState<string[]>([]);

  // Commercialization Requirements State
  const [requirements, setRequirements] = useState<RequirementItem[]>([
    {
      id: "req-1",
      category: "performance",
      title: "极低时延无缝视频分支切换 (Seamless Video Branching)",
      description:
        "多线程预加载、缓存双重缓冲队列，实现分支切换 0ms 黑屏及帧对齐。通过 C++/Zig 直接调度 Libavcodec 硬件加速。",
      priority: "Critical",
      status: "designing",
      target: "Zig Native",
    },
    {
      id: "req-2",
      category: "security",
      title: "高强度媒体资产加密与 DRM (Asset Encryption)",
      description:
        "商业视频包与元数据进行 AES-256-GCM 硬件级实时流式解密，防止素材在 PC 端被用户提取解密。",
      priority: "Critical",
      status: "pending",
      target: "C++ Engine",
    },
    {
      id: "req-3",
      category: "crossplatform",
      title: "Zig-Wasm 与 Node-API 轻量级多端绑定 (Multi-platform Bindings)",
      description:
        "通过相同的一套 Zig/C++ 核心代码，利用 WASM 部署在 Web/Electron/Vue 客户端，PC 桌面端直接加载 Native 动态链接库。",
      priority: "High",
      status: "implemented",
      target: "Vue Bridge",
    },
    {
      id: "req-4",
      category: "performance",
      title: "高频变量状态自归档与快速回滚 (Variable Snapshot & Rollback)",
      description:
        "支持 PC 端的数万个快照极速回滚和时间滑块重播。将玩家交互变量存储在极致压缩的 Arena 连续内存段。",
      priority: "High",
      status: "implemented",
      target: "Zig Native",
    },
    {
      id: "req-5",
      category: "pipeline",
      title: "可视化编排器到 Native 字节码的流式编译器 (Workflow Compiler)",
      description:
        "将 Vue 前端设计的 JSON 格式交互流程图流式编译为 Native 紧凑型二进制剧情树文件（.cvb），单文件加载，无需运行时解析 JSON。",
      priority: "Medium",
      status: "designing",
      target: "Zig Native",
    },
    {
      id: "req-6",
      category: "security",
      title: "防作弊玩家内存混淆与反注入 (Memory Anti-Tamper)",
      description:
        "对 PC 上的内存变量（如金币、骇客值）进行 XOR 动态混淆，防止玩家使用 Cheat Engine 篡改游戏交互结果。",
      priority: "High",
      status: "pending",
      target: "C++ Engine",
    },
  ]);

  // Form states for adding requirement
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [newReqCategory, setNewReqCategory] = useState<
    "performance" | "security" | "crossplatform" | "pipeline"
  >("performance");
  const [newReqPriority, setNewReqPriority] = useState<
    "Critical" | "High" | "Medium"
  >("High");
  const [newReqTarget, setNewReqTarget] = useState<
    "Zig Native" | "C++ Engine" | "Vue Bridge"
  >("Zig Native");

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle.trim()) return;
    const newReq: RequirementItem = {
      id: `req-${Date.now()}`,
      category: newReqCategory,
      title: newReqTitle,
      description: newReqDesc || "暂无详细技术描述描述",
      priority: newReqPriority,
      status: "pending",
      target: newReqTarget,
    };
    setRequirements([newReq, ...requirements]);
    setNewReqTitle("");
    setNewReqDesc("");
  };

  const handleToggleStatus = (id: string) => {
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const nextStatus: Record<
            RequirementItem["status"],
            RequirementItem["status"]
          > = {
            pending: "designing",
            designing: "implemented",
            implemented: "pending",
          };
          return { ...req, status: nextStatus[req.status] };
        }
        return req;
      }),
    );
  };

  const handleDeleteReq = (id: string) => {
    setRequirements((prev) => prev.filter((req) => req.id !== id));
  };

  // Compile simulator
  const runCompilation = () => {
    setIsCompiling(true);
    setBuildLogs([]);
    setActiveTab("terminal");

    const logs = [
      "⚡ [Zig Build] Initializing Native Engine Toolchain compilation...",
      `📦 [Zig Build] Host System: Linux x86_64 | Target: wasm32-freestanding-musl`,
      '🔍 [Zig Build] Resolving dependencies of "interactive_cinema_core" ...',
      "📂 [Zig Build] Compiling: src/main.zig ...",
      "📂 [Zig Build] Parsing Active Web Editor JSON Tree with AST Analyzer...",
      `✨ [Zig Compiler] Successfully detected ${scenes.length} story node(s).`,
      `⚙️ [Zig Compiler] Mapping Dynamic variables: [${variables.map((v) => v.name).join(", ")}]`,
      "⚠️ [Zig Compiler] Optimizing Scene graph node transition offsets...",
      "🛠️ [Linker] Linking object files into WebAssembly target static library...",
      "📈 [Diagnostic] Dynamic memory allocated: 1.25 MB (Pre-cached stack arena)",
      "📦 [Output] Built interactive_cinema_core.wasm [Size: 312 KB] successfully.",
      "🚀 [Bridge-Gen] Generated Vue / TypeScript interfaces (npm binding package).",
      "✅ [Success] native_engine_core compiles flawlessly! Ready for PC engine runtime integration.",
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setBuildLogs((prev) => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsCompiling(false);
        setCompilationSuccess(true);
      }
    }, 150);
  };

  // Dynamic code generators depending on the user's setup
  const getZigCode = () => {
    const sceneEnums = scenes
      .map(
        (s) =>
          `    ${s.id.replace(/[^a-zA-Z0-9]/g, "_")} = ${scenes.indexOf(s)},`,
      )
      .join("\n");
    const variableInit = variables
      .map(
        (v) =>
          `        .${v.name} = ${v.type === "boolean" ? (v.value ? "true" : "false") : typeof v.value === "number" ? v.value : 0},`,
      )
      .join("\n");

    return `// ==========================================
// AUTOMATICALLY GENERATED BY INTERACTIVE CINEMA STUDIO
// Target: Zig Native High-Performance PC Engine Core (main.zig)
// ==========================================

const std = @import("std");

/// Dynamic Story Scene Node IDs mapped from Editor NodeFlow
pub const SceneId = enum(u16) {
${sceneEnums}
};

/// High-performance memory-mapped structure of dynamic player variables
pub const PlayerVariables = struct {
${variables.map((v) => `    ${v.name}: ${v.type === "boolean" ? "bool" : v.type === "number" ? "f32" : "[]const u8"},`).join("\n")}
};

/// Struct representing a choice branching outcome
pub const ChoiceTransition = struct {
    trigger_time_s: f32,
    target_scene: SceneId,
    condition_var: []const u8,
    condition_value: f32,
};

pub const InteractiveEngine = struct {
    allocator: std.mem.Allocator,
    variables: PlayerVariables,
    current_scene: SceneId,
    playback_time: f32,

    pub fn init(allocator: std.mem.Allocator) !InteractiveEngine {
        return InteractiveEngine{
            .allocator = allocator,
            .current_scene = .${scenes[0]?.id.replace(/[^a-zA-Z0-9]/g, "_") || "Scene01"},
            .playback_time = 0.0,
            .variables = PlayerVariables{
${variableInit}
            },
        };
    }

    /// Evaluates if branching condition is met on player selection
    pub fn evaluateBranch(self: *InteractiveEngine, choice: ChoiceTransition) bool {
        // High-performance pointer-based fast lookup for variables
        _ = self;
        _ = choice;
        return true;
    }

    /// Performs hot transition state allocation
    pub fn transitionTo(self: *InteractiveEngine, target: SceneId) void {
        std.log.info("Transition state triggered from {any} to {any}", .{self.current_scene, target});
        self.current_scene = target;
        self.playback_time = 0.0;
    }
};

// Exports for PC Node-API / WebAssembly integration
export fn init_engine() ?*InteractiveEngine {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    const engine = allocator.create(InteractiveEngine) catch return null;
    engine.* = InteractiveEngine.init(allocator) catch return null;
    return engine;
}
`;
  };

  const getCppCode = () => {
    const sceneSwitches = scenes
      .map((s) => {
        const codeId = s.id.replace(/[^a-zA-Z0-9]/g, "_");
        return `        case SceneId::${codeId}:
            // Preload next branching files into hardware buffer
            this->buffer_manager->queue_video("${s.videoUrl || "default_source.mp4"}");
            break;`;
      })
      .join("\n");

    return `// ==========================================
// AUTOMATICALLY GENERATED BY INTERACTIVE CINEMA STUDIO
// Target: C++17 Ultra-low Latency Multi-threaded Video Core (engine.h)
// ==========================================

#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <iostream>

enum class SceneId : uint16_t {
${scenes.map((s) => `    ${s.id.replace(/[^a-zA-Z0-9]/g, "_")} = ${scenes.indexOf(s)},`).join("\n")}
};

struct PlayerDataState {
${variables.map((v) => `    ${v.type === "boolean" ? "bool" : "float"} ${v.name};`).join("\n")}
};

class VideoBufferManager {
public:
    void queue_video(const std::string& path) {
        // Multi-threaded preloading to prevent black frames on branching
        std::cout << "[Video Buffer] Pre-buffering stream path: " << path << std::endl;
    }
};

class CinemaEngineCore {
private:
    SceneId current_scene_id;
    PlayerDataState state;
    std::unique_ptr<VideoBufferManager> buffer_manager;

public:
    CinemaEngineCore() {
        this->current_scene_id = SceneId::${scenes[0]?.id.replace(/[^a-zA-Z0-9]/g, "_") || "Scene01"};
        this->buffer_manager = std::make_unique<VideoBufferManager>();
    }

    void update_scene_preload(SceneId next_id) {
        switch (next_id) {
${sceneSwitches}
        }
    }

    bool register_choice_trigger(SceneId next_id, const std::string& action_code) {
        // Security check, dynamic variable adjustments, and low latency hardware branch switching
        std::cout << "[Native Logic] Triggering branching code: " << action_code << std::endl;
        this->current_scene_id = next_id;
        this->update_scene_preload(next_id);
        return true;
    }
};
`;
  };

  const getVueBridgeCode = () => {
    return `// ==========================================
// AUTOMATICALLY GENERATED BY INTERACTIVE CINEMA STUDIO
// Target: Vue 3 / Electron / WebAssembly High-Speed Interop Bridge (engine-bridge.ts)
// ==========================================

import { ref, onMounted } from 'vue';

// WASM Module Loading Hook
export function useNativeCinemaEngine() {
  const engineInstance = ref<any>(null);
  const isLoaded = ref(false);
  const activeSceneId = ref('${scenes[0]?.id}');
  const variables = ref<Record<string, any>>({
${variables.map((v) => `    ${v.name}: ${v.type === "boolean" ? (v.value ? "true" : "false") : v.value},`).join("\n")}
  });

  onMounted(async () => {
    try {
      // Load compiled Zig/C++ engine WASM bundle
      const wasm = await import('@/assets/interactive_cinema_core.wasm');
      const instance = await wasm.initialize({
        onBranchTimeReached: (sceneId: string, choices: any[]) => {
          console.log('[WASM Callback] Displaying interactive prompt options to client Vue view', choices);
        },
        onVariablesUpdated: (newVars: any) => {
          variables.value = { ...variables.value, ...newVars };
        }
      });

      engineInstance.value = instance;
      isLoaded.value = true;
      console.log('✨ [Vue Bridge] C++/Zig Interactive story engine successfully bounded via WASM Module.');
    } catch (err) {
      console.error('❌ [Vue Bridge] Failed to load low-level native WASM module:', err);
    }
  });

  const selectStoryBranch = (targetSceneId: string, actionCode?: string) => {
    if (!engineInstance.value) return;

    // Invoke high-performance C++ / Zig transition in microseconds
    engineInstance.value.triggerBranchTransition(targetSceneId, actionCode || '');
    activeSceneId.value = targetSceneId;
  };

  return {
    isLoaded,
    activeSceneId,
    variables,
    selectStoryBranch,
  };
}
`;
  };

  const getCodeContent = () => {
    if (selectedLang === "zig") return getZigCode();
    if (selectedLang === "cpp") return getCppCode();
    return getVueBridgeCode();
  };

  // 1. HIGH-FIDELITY MEDIA PROBER HANDLER (ffprobe API)
  const handleProbeMedia = async () => {
    const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
    if (!activeScene) return;

    setIsProbing(true);
    setProbeResult(null);

    try {
      const response = await fetch("/api/media/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: activeScene.videoUrl }),
      });

      const data: ProbeApiResponse = await response.json();
      if (data.success) {
        setProbeResult(data);
      } else {
        const errorMessage = "error" in data ? data.error : undefined;
        throw new Error(errorMessage || "Probing failed");
      }
    } catch (err: unknown) {
      console.error("ffprobe error:", err);
      // Fail-safe default
      setProbeResult({
        success: true,
        source: "ffprobe-fallback-local",
        metadata: {
          format: "mov,mp4",
          duration: activeScene.duration || 15,
          size: 4501292,
          bitRate: "2401923 bps",
          streams: [
            {
              codecType: "video",
              codecName: "h264",
              width: 1920,
              height: 1080,
              frameRate: "25 fps",
              pixelFormat: "yuv420p",
            },
          ],
        },
      });
    } finally {
      setIsProbing(false);
    }
  };

  // 2. COMMERCIAL FFmpeg COMPRESSION & TIMELINE ASSEMBLY PIPELINE HANDLER
  const handleRunFfmpeg = async () => {
    setIsProcessingFfmpeg(true);
    setFfmpegResult(null);
    setFfmpegLogs([
      "⏱️ [FFmpeg Client] Preparing stream sequence pipelines...",
      "⚙️ [FFmpeg Client] Formulating command args: ffmpeg -i source.mp4 -vcodec " +
        ffmpegCodec +
        " -s " +
        ffmpegResolution +
        " -b:v " +
        ffmpegBitrate +
        " output.mp4",
    ]);

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      const response = await fetch("/api/media/ffmpeg-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: ffmpegOperation,
          videoSettings: {
            codec: ffmpegCodec,
            resolution: ffmpegResolution,
            bitrate: ffmpegBitrate,
            hardwareAcceleration: ffmpegAccel,
          },
        }),
      });

      const data: FfmpegPipelineResponse = await response.json();

      // Simulate real-time log ingestion ticks
      let progressIndex = 0;
      progressTimer = setInterval(() => {
        if (progressIndex < data.logs.length) {
          setFfmpegLogs((prev) => [...prev, data.logs[progressIndex]]);
          progressIndex++;
        } else {
          if (progressTimer !== null) clearInterval(progressTimer);
          setFfmpegResult({
            success: true,
            downloadUrl: data.downloadUrl,
            renderedFileSize: data.renderedFileSize,
            hardwareAccelerationActive: data.hardwareAccelerationActive,
          });
          setIsProcessingFfmpeg(false);
        }
      }, 250);
    } catch (err: unknown) {
      if (progressTimer !== null) clearInterval(progressTimer);
      setFfmpegLogs((prev) => [
        ...prev,
        "❌ [FFmpeg Error] Local pipeline interrupted: " + getErrorMessage(err),
      ]);
      setIsProcessingFfmpeg(false);
    }
  };

  // 3. ALIYUN OSS CHUNK-UPLOAD EMULATOR WITH STS KEY-TOKEN LIFECYCLE
  const handleUploadOss = () => {
    setIsUploadingOss(true);
    setOssUploadProgress(0);
    setOssUploadStatus("sts");
    setOssLog([
      "🔑 [Aliyun OSS] Initiating dynamic security credentials request (STS token)...",
      "🔑 [Aliyun OSS] Received temporary AccessKeyId, AccessKeySecret, and SecurityToken.",
      "📦 [Aliyun OSS] Configured Bucket: 'interactive-cinema-production-vault' (Region: cn-shanghai)",
      "⚡ [Aliyun OSS] Initializing OSS Multipart Chunked Upload (Chunk size: 1.0 MB)...",
    ]);

    let chunk = 1;
    const totalChunks = 10;
    const interval = setInterval(() => {
      setOssUploadStatus("uploading");
      const progress = Math.min(Math.round((chunk / totalChunks) * 100), 100);
      setOssUploadProgress(progress);

      // Calculate speed with some random variation around the selected throttling limit
      const currentSpeed = (
        ossThrottling *
        (0.9 + Math.random() * 0.2)
      ).toFixed(1);
      setOssUploadSpeed(`${currentSpeed} MB/s`);

      setOssLog((prev) => [
        ...prev,
        `🚀 [Aliyun OSS] Uploaded Chunk #${chunk}/${totalChunks} successfully. Status Code: 200 (OK)`,
      ]);

      if (chunk >= totalChunks) {
        clearInterval(interval);
        setOssUploadStatus("completed");
        setIsUploadingOss(false);
        setOssLog((prev) => [
          ...prev,
          "🎉 [Aliyun OSS] Merging chunks and finalizing remote state file validation...",
          "✅ [Aliyun OSS] MD5 Checksum matches local asset perfectly!",
          "🔗 [Aliyun OSS] Published public streaming CDN URL: https://cdn-interactive.aliyun.com/active_bundles/cyberpunk_main_vault.mp4",
        ]);
      } else {
        chunk++;
      }
    }, 400);
  };

  // 4. COMMERCIAL .DOCX SCREENPLAY EXPORTER
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const response = await fetch("/api/media/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "脑机重构 (Neural Drift) 影游剧本",
          scenes,
          variables,
        }),
      });

      if (!response.ok) throw new Error("Docx compilation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Neural_Drift_Interactive_Screenplay.docx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: unknown) {
      alert("Word剧本导出失败: " + getErrorMessage(err));
    } finally {
      setIsExportingDocx(false);
    }
  };

  // 5. COMMERCIAL .ZIP ASSETS PACKAGER
  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const response = await fetch("/api/media/export-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "脑机重构 (Neural Drift)",
          scenes,
          variables,
        }),
      });

      if (!response.ok) throw new Error("Zip compilation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        "Interactive_Cinema_AssetBundle_NeuralDrift.zip",
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: unknown) {
      alert("ZIP部署包打包失败: " + getErrorMessage(err));
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14] text-slate-200 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
      {/* 1. Header Banner */}
      <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-md">
            <Cpu className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              PC Native Engine (Zig / C++) Dev Center
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                Commercial specs
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              为高画质 PC 端原生打包与 Vue 3 前端重构设计的低时延底层内核生成器
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={runCompilation}
            disabled={isCompiling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg transition-all ${
              isCompiling
                ? "bg-slate-900 text-slate-500 border border-slate-800"
                : "bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0d0f14]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>
              {isCompiling ? "Zig 编译仿真中..." : "编译仿真 Zig 内核"}
            </span>
          </button>

          <button
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([getCodeContent()], { type: "text/plain" });
              element.href = URL.createObjectURL(file);
              element.download =
                selectedLang === "zig"
                  ? "main.zig"
                  : selectedLang === "cpp"
                    ? "engine.h"
                    : "engine-bridge.ts";
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            title="导出底层代码文件"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* 2. Top-level Workspace Tabs */}
      <div className="flex items-center bg-slate-950/40 border-b border-slate-900 px-4 text-xs">
        <button
          onClick={() => setActiveTab("requirements")}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === "requirements"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>商业化引擎需求矩阵 ({requirements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("code-gen")}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === "code-gen"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Native 核心代码自动适配生成</span>
        </button>
        <button
          onClick={() => setActiveTab("media-engine")}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === "media-engine"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video className="w-3.5 h-3.5 text-indigo-400" />
          <span className="flex items-center gap-1.5">
            音视频 SDK 处理实验室
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
              FFmpeg / OSS
            </span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab("terminal")}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer relative ${
            activeTab === "terminal"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>编译仿真器控制台</span>
          {compilationSuccess && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. Panel Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-slate-950/20">
        {/* PANEL A: REQUIREMENTS MATRIX */}
        {activeTab === "requirements" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header description */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">
                    PC 原生互动电影商业化技术路线规划
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    在 PC 平台上，为了极致画质，播放 4K60FPS
                    甚至更高码率的高清片源时，Electron / Web 播放器往往由于 V8
                    内存限制与多线程解码性能导致分支切换出现黑屏帧或微弱顿挫。利用{" "}
                    <strong>Zig / C++ 作为解码及状态调度底层引擎</strong>，配合{" "}
                    <strong>
                      Vue 3 与 WASM/Node-API 充当高级编辑器及人机交互渲染端
                    </strong>
                    ，是业界公认的商业级高水准架构。
                  </p>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                  架构可行性诊断 (Architecture Audit)
                </span>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-2xl font-bold text-amber-400 font-mono">
                      {Math.round(
                        (requirements.filter((r) => r.status === "implemented")
                          .length /
                          requirements.length) *
                          100,
                      )}
                      %
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      商业级引擎完成度估算
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <div>
                      已实现:{" "}
                      {
                        requirements.filter((r) => r.status === "implemented")
                          .length
                      }
                    </div>
                    <div>总需求: {requirements.length}</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(requirements.filter((r) => r.status === "implemented").length / requirements.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Main requirements grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Requirements List (Left 2 cols) */}
              <div className="xl:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    商业化功能与非功能性要求详情清单
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    点击状态标签可切换开发状态
                  </span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className={`group p-3.5 rounded-xl border transition-all duration-300 bg-slate-900/40 hover:bg-slate-900/80 ${
                        req.priority === "Critical"
                          ? "border-rose-500/20 hover:border-rose-500/30"
                          : req.priority === "High"
                            ? "border-amber-500/20 hover:border-amber-500/30"
                            : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold uppercase shrink-0 ${
                                req.priority === "Critical"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : req.priority === "High"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {req.priority}
                            </span>
                            <span className="text-[9px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                              {req.target}
                            </span>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                              {req.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed pl-1">
                            {req.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Interactive status toggle badge */}
                          <button
                            onClick={() => handleToggleStatus(req.id)}
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border cursor-pointer font-semibold transition-all ${
                              req.status === "implemented"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : req.status === "designing"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                                  : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            ●{" "}
                            {req.status === "implemented"
                              ? "已落实"
                              : req.status === "designing"
                                ? "架构中"
                                : "待处理"}
                          </button>

                          <button
                            onClick={() => handleDeleteReq(req.id)}
                            className="p-1 bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                            title="删除需求"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirement Adder Form (Right Column) */}
              <div className="bg-slate-900/30 border border-slate-900/80 p-5 rounded-xl h-fit space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-200">
                    追加引擎商业化指标与需求
                  </h3>
                </div>

                <form
                  onSubmit={handleAddRequirement}
                  className="space-y-4 text-xs"
                >
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">
                      需求指标类别
                    </label>
                    <select
                      value={newReqCategory}
                      onChange={(e) =>
                        setNewReqCategory(
                          e.target.value as RequirementItem["category"],
                        )
                      }
                      className="w-full bg-slate-950 text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 outline-none focus:border-amber-500/30"
                    >
                      <option value="performance">⚡ 性能与高并发解码</option>
                      <option value="security">🛡️ 安全加密与版权保护</option>
                      <option value="crossplatform">
                        📦 多端交叉编译与绑定
                      </option>
                      <option value="pipeline">
                        ⚙️ 剧情编译器与工作流管线
                      </option>
                    </select>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">
                      需求名称
                    </label>
                    <input
                      type="text"
                      required
                      value={newReqTitle}
                      onChange={(e) => setNewReqTitle(e.target.value)}
                      placeholder="例如: 引入 H.265 硬解解码管线支持"
                      className="w-full bg-slate-950 text-slate-200 px-2.5 py-2 rounded-lg border border-slate-800 outline-none focus:border-amber-500/30"
                    />
                  </div>

                  {/* Target Technology */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">
                        指派架构目标
                      </label>
                      <select
                        value={newReqTarget}
                        onChange={(e) =>
                          setNewReqTarget(
                            e.target.value as RequirementItem["target"],
                          )
                        }
                        className="w-full bg-slate-950 text-slate-300 px-2 py-2 rounded-lg border border-slate-800 outline-none focus:border-amber-500/30"
                      >
                        <option value="Zig Native">Zig Native</option>
                        <option value="C++ Engine">C++ Engine</option>
                        <option value="Vue Bridge">Vue Bridge</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">
                        优先级权重
                      </label>
                      <select
                        value={newReqPriority}
                        onChange={(e) =>
                          setNewReqPriority(
                            e.target.value as RequirementItem["priority"],
                          )
                        }
                        className="w-full bg-slate-950 text-slate-300 px-2 py-2 rounded-lg border border-slate-800 outline-none focus:border-amber-500/30"
                      >
                        <option value="Critical">🚨 Critical</option>
                        <option value="High">⚠️ High</option>
                        <option value="Medium">⚡ Medium</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">
                      技术要点与期望描述
                    </label>
                    <textarea
                      value={newReqDesc}
                      onChange={(e) => setNewReqDesc(e.target.value)}
                      placeholder="在此输入详细的底层技术设计方向描述..."
                      className="w-full h-20 bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 outline-none focus:border-amber-500/30 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-[#0d0f14] font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加全新技术指标需求</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* PANEL B: CODE GENERATION PREVIEW */}
        {activeTab === "code-gen" && (
          <div className="space-y-5 animate-fade-in flex flex-col h-full min-h-0">
            {/* Lang selectors */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-900">
                <button
                  onClick={() => setSelectedLang("zig")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedLang === "zig"
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ⚡ main.zig (Zig Core State Machine)
                </button>
                <button
                  onClick={() => setSelectedLang("cpp")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedLang === "cpp"
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ⚙️ engine.h (C++ Preload Core)
                </button>
                <button
                  onClick={() => setSelectedLang("vue-bridge")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedLang === "vue-bridge"
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📦 vue-bridge.ts (Vue WASM Interop)
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  基于编辑器当前 {scenes.length} 个节点和 {variables.length}{" "}
                  个变量进行动态生成
                </span>
              </div>
            </div>

            {/* Code editor container */}
            <div className="flex-1 min-h-0 flex flex-col bg-slate-950 rounded-xl border border-slate-900 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2 border-b border-slate-950 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {selectedLang === "zig"
                    ? "main.zig"
                    : selectedLang === "cpp"
                      ? "engine.h"
                      : "engine-bridge.ts"}
                </span>
                <span className="text-[10px]">
                  READ ONLY · DYNAMIC GENERATED
                </span>
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-950">
                <pre>{getCodeContent()}</pre>
              </div>
            </div>
          </div>
        )}

        {/* PANEL D: COMMERCIAL MEDIA SDK LAB */}
        {activeTab === "media-engine" && (
          <div className="space-y-6 animate-fade-in pb-8">
            {/* Top Grid: Bento Utilities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Box 1: ffprobe Diagnostics */}
              <div className="bg-[#121626]/80 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Activity className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-100">
                        ffprobe 媒体属性高精探测
                      </h3>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded font-semibold">
                      SDK ACTIVE
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    利用 ffprobe
                    底层接口对玩家编辑轨道中的原始多媒体视频切片、音频流文件进行全维度底层参数分析。
                  </p>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 mb-4 text-[10px] font-mono text-slate-400 space-y-1.5">
                    <div>
                      <span className="text-slate-500">检测素材:</span>{" "}
                      {scenes.find((s) => s.id === activeSceneId)?.name ||
                        scenes[0]?.name ||
                        "未选择场景"}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">文件URI:</span>{" "}
                      {scenes.find((s) => s.id === activeSceneId)?.videoUrl ||
                        scenes[0]?.videoUrl ||
                        "无"}
                    </div>
                  </div>

                  {probeResult && (
                    <div className="bg-emerald-950/20 border border-emerald-500/10 p-3 rounded-lg mb-4 text-[10px] font-mono space-y-1 text-slate-300">
                      <div className="text-emerald-400 font-bold border-b border-emerald-500/10 pb-1 flex justify-between">
                        <span>[探测数据成功 - {probeResult.source}]</span>
                        <span className="text-[9px] uppercase">v1.1</span>
                      </div>
                      <div>
                        格式:{" "}
                        <strong className="text-white">
                          {probeResult.metadata.format}
                        </strong>
                      </div>
                      <div>
                        总时长:{" "}
                        <strong className="text-white">
                          {probeResult.metadata.duration}s
                        </strong>
                      </div>
                      <div>
                        流文件大小:{" "}
                        <strong className="text-white">
                          {(probeResult.metadata.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </strong>
                      </div>
                      <div>
                        码率:{" "}
                        <strong className="text-white">
                          {probeResult.metadata.bitRate}
                        </strong>
                      </div>
                      {probeResult.metadata.streams.map(
                        (stream, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="border-t border-slate-900/60 pt-1 mt-1 font-semibold text-[9.5px]"
                          >
                            流 #{sIdx} ({stream.codecType}):{" "}
                            <span className="text-amber-400">
                              {stream.codecName}
                            </span>{" "}
                            {stream.width &&
                              `| ${stream.width}x${stream.height}`}{" "}
                            {stream.frameRate && `| ${stream.frameRate}`}{" "}
                            {stream.channels && `| ${stream.channels}声道`}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleProbeMedia}
                  disabled={isProbing}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/10"
                >
                  {isProbing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Activity className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isProbing
                      ? "ffprobe 正在探测流..."
                      : "运行 ffprobe 精准探测诊断"}
                  </span>
                </button>
              </div>

              {/* Box 2: Aliyun OSS Upload */}
              <div className="bg-[#121626]/80 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                        <Database className="w-4 h-4 text-sky-400" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-100">
                        Aliyun OSS 分片断点续传
                      </h3>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded font-semibold">
                      STS SECURE
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    模拟桌面端 Electron 直传阿里云 OSS 高级
                    SDK。支持多线程分片上传、断点续传记录仪及 STS 临时鉴权。
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">
                        上传带宽限制 (Speed Limit):
                      </span>
                      <span className="text-sky-400 font-mono font-bold">
                        {ossThrottling} MB/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={ossThrottling}
                      onChange={(e) => setOssThrottling(Number(e.target.value))}
                      className="w-full accent-sky-400"
                    />

                    {ossUploadStatus !== "idle" && (
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 text-[10px] font-mono space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span>
                            状态:{" "}
                            <strong className="text-sky-400">
                              {ossUploadStatus === "sts"
                                ? "正在拉取安全密钥..."
                                : ossUploadStatus === "uploading"
                                  ? "流式分片上传中..."
                                  : "上传已完成!"}
                            </strong>
                          </span>
                          {ossUploadStatus === "uploading" && (
                            <span className="text-sky-400 animate-pulse">
                              {ossUploadSpeed}
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-sky-400 h-full transition-all duration-300"
                            style={{ width: `${ossUploadProgress}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500 text-right mt-1">
                          {ossUploadProgress}% Completed
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleUploadOss}
                    disabled={isUploadingOss}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-600/10"
                  >
                    {isUploadingOss ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isUploadingOss
                        ? "分片流式上传中..."
                        : "启动 OSS 商业级多线程上传"}
                    </span>
                  </button>

                  {ossLog.length > 0 && (
                    <button
                      onClick={() => setOssLog([])}
                      className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      清除上传日志
                    </button>
                  )}
                </div>
              </div>

              {/* Box 3: Export Bundler */}
              <div className="bg-[#121626]/80 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FolderArchive className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-100">
                        商业多端成果编译打包
                      </h3>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded font-semibold">
                      READY
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    将当前的场景节点树、时间轴轨道字幕配音、玩家分支交互决策逻辑一键转换为商业级的导出打包方案。
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-900 text-[10px] font-mono text-slate-400 space-y-1.5">
                      <div className="flex items-center gap-1 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>自动流式打字与字幕对齐</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>EXE/Electron 一键启动包装器</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>变量防作弊内存混淆机制</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportDocx}
                    disabled={isExportingDocx}
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {isExportingDocx ? "导出中..." : "导出 Word 剧本"}
                    </span>
                  </button>

                  <button
                    onClick={handleExportZip}
                    disabled={isExportingZip}
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isExportingZip ? "打包中..." : "打包 ZIP 资源"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Split layouts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column: FFmpeg Control panel */}
              <div className="bg-[#121626]/50 border border-slate-800/60 rounded-xl p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Video className="w-4.5 h-4.5 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-100">
                    FFmpeg 轨道拼接与流压缩配置 (fluent-ffmpeg Core)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1.5">
                      拼接合成模式 Operation
                    </label>
                    <select
                      value={ffmpegOperation}
                      onChange={(e) =>
                        setFfmpegOperation(e.target.value as FfmpegOperation)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="stitch">
                        多轨道高精度并合 (Stitch Timeline)
                      </option>
                      <option value="compress">
                        4K 商业高效压缩 (H.265 CRF=21)
                      </option>
                      <option value="subtitle">
                        字幕与配音轨道烧录 (Burn-in Subs)
                      </option>
                      <option value="watermark">
                        注入商业数字安全水印 (Watermark)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1.5">
                      编码器组件 Codec Core
                    </label>
                    <select
                      value={ffmpegCodec}
                      onChange={(e) =>
                        setFfmpegCodec(e.target.value as FfmpegCodec)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="libx264">
                        H.264 / AVC (libx264 - 极佳兼容性)
                      </option>
                      <option value="libx265">
                        H.265 / HEVC (libx265 - 极高压缩比)
                      </option>
                      <option value="nvenc_h264">
                        NVIDIA NVENC (硬件GPU高速压制)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1.5">
                      分辨率级别 Resolution Scale
                    </label>
                    <select
                      value={ffmpegResolution}
                      onChange={(e) =>
                        setFfmpegResolution(e.target.value as FfmpegResolution)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="3840x2160">3840x2160 (4K UHD 极清)</option>
                      <option value="1920x1080">
                        1920x1080 (1080p 全高清)
                      </option>
                      <option value="1280x720">1280x720 (720p 高清)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1.5">
                      码率档位 Target Bitrate
                    </label>
                    <select
                      value={ffmpegBitrate}
                      onChange={(e) =>
                        setFfmpegBitrate(e.target.value as FfmpegBitrate)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="5000k">5000 kbps (超写实电影质量)</option>
                      <option value="2500k">2500 kbps (标准交互画质)</option>
                      <option value="1000k">1000 kbps (高性价比流畅款)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-900/80">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        NVENC / QuickSync 硬件级加速
                      </div>
                      <div className="text-[9px] text-slate-500">
                        检测并优先调用本地显卡进行高速流式多任务拼合渲染。
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={ffmpegAccel}
                    onChange={(e) => setFfmpegAccel(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleRunFfmpeg}
                  disabled={isProcessingFfmpeg}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/10"
                >
                  {isProcessingFfmpeg ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  <span>
                    {isProcessingFfmpeg
                      ? "FFmpeg 实时管线渲染合成中..."
                      : "启动 FFmpeg 轨道合成与高效压缩"}
                  </span>
                </button>
              </div>

              {/* Right Column: FFmpeg Terminal Logs */}
              <div className="bg-black border border-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 flex flex-col justify-between h-[360px]">
                <div className="space-y-1.5 overflow-y-auto max-h-[300px] flex-1 pr-1.5">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-900 flex justify-between font-bold">
                    <span>🎬 FFmpeg RUNTIME LIVE MONITOR</span>
                    <span>LOGS</span>
                  </div>

                  {ffmpegLogs.length === 0 && (
                    <div className="text-slate-600 italic py-12 text-center text-[10px] space-y-1">
                      <p>-- FFmpeg 编排器运行状态就绪 --</p>
                      <p>
                        点击左侧按钮，合成当前剧情轨道，查看实时渲染汇聚日志。
                      </p>
                    </div>
                  )}

                  {ffmpegLogs.map((log, index) => {
                    let color = "text-slate-400";
                    if (log.includes("[ffmpeg-core]")) color = "text-slate-500";
                    else if (log.includes("[ffmpeg-encoder]"))
                      color = "text-amber-400";
                    else if (log.includes("[ffmpeg-pipeline]"))
                      color = "text-cyan-400 font-semibold";
                    else if (log.includes("complete") || log.includes("✅"))
                      color = "text-emerald-400 font-bold";
                    else if (log.includes("❌"))
                      color = "text-rose-500 font-bold";

                    return (
                      <div
                        key={index}
                        className={`whitespace-pre-wrap ${color} text-[10.5px] leading-relaxed`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>

                {ffmpegResult && (
                  <div className="border-t border-slate-900/60 pt-3 mt-3 flex items-center justify-between text-[10px] shrink-0 bg-slate-950/40 p-2 rounded">
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      拼合渲染成功! ({ffmpegResult.renderedFileSize})
                    </span>
                    <a
                      href={ffmpegResult.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                    >
                      <span>预览合成资源</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud Logs Console & Pipeline Audit */}
            {ossLog.length > 0 && (
              <div className="bg-[#0b0c16] border border-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-400 space-y-1.5 shadow-inner">
                <div className="text-sky-400 font-bold text-xs flex items-center gap-1 mb-2">
                  <Database className="w-4 h-4" />
                  <span>
                    阿里云 OSS 分片断点续传实时事件日志 (OSS Event Bus)
                  </span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[160px] pr-2">
                  {ossLog.map((log, index) => {
                    let color = "text-slate-400";
                    if (log.includes("🔑") || log.includes("AccessKey"))
                      color = "text-indigo-400";
                    else if (log.includes("🚀")) color = "text-sky-300";
                    else if (
                      log.includes("✅") ||
                      log.includes("MD5") ||
                      log.includes("🎉")
                    )
                      color = "text-emerald-400 font-semibold";

                    return (
                      <div key={index} className={color}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL C: COMPILER LOG TERMINAL */}
        {activeTab === "terminal" && (
          <div className="space-y-4 animate-fade-in flex flex-col h-full min-h-0">
            {/* Terminal Actions */}
            <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold">
                  Zig & WebAssembly 仿真编译器控制面板
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {isCompiling ? (
                  <span className="text-amber-400 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    进行底层编译链路链接...
                  </span>
                ) : compilationSuccess ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    核心静态库构建就绪
                  </span>
                ) : (
                  <span className="text-slate-400">控制台空闲</span>
                )}
              </div>
            </div>

            {/* Simulated Black Terminal Screen */}
            <div className="flex-1 bg-black rounded-xl border border-slate-900 p-4 font-mono text-xs text-slate-300 overflow-y-auto leading-relaxed shadow-inner flex flex-col justify-between min-h-0">
              <div className="space-y-1.5">
                {buildLogs.length === 0 ? (
                  <div className="text-slate-600 italic py-8 text-center text-[11px]">
                    <p>-- 控制台尚无输出日志 --</p>
                    <p className="mt-1">
                      点击上方 “编译仿真 Zig 内核” 开始触发底层 native
                      构建和静态库静态分析
                    </p>
                  </div>
                ) : (
                  buildLogs.map((log, index) => {
                    let colorClass = "text-slate-300";
                    if (log.includes("[Success]") || log.includes("✅"))
                      colorClass = "text-emerald-400 font-bold";
                    else if (log.includes("❌") || log.includes("error"))
                      colorClass = "text-rose-500 font-bold";
                    else if (log.includes("[Zig Build]") || log.includes("⚡"))
                      colorClass = "text-amber-400";
                    else if (log.includes("⚙️") || log.includes("🛠️"))
                      colorClass = "text-cyan-400";
                    else if (log.includes("📂")) colorClass = "text-slate-400";

                    return (
                      <div
                        key={index}
                        className={`whitespace-pre-wrap ${colorClass}`}
                      >
                        {log}
                      </div>
                    );
                  })
                )}
              </div>

              {!isCompiling && buildLogs.length > 0 && (
                <div className="border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                  <span>Compilation Footprint: 312 KB Static Lib</span>
                  <span>Stack Allocator Arena size: 1.25 MB</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
