import React, { useEffect, useRef, useState } from "react";
import {
  SceneNode,
  TimelineTrack,
  ProjectVariable,
  EditorPlugin,
} from "../types";
import {
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  Zap,
  Lock,
  RefreshCw,
  Layers,
  ArrowLeft,
  RotateCcw,
  Repeat,
} from "lucide-react";

interface PlayerProps {
  scene: SceneNode;
  tracks: TimelineTrack[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayToggle: () => void;
  onSelectScene: (sceneId: string) => void;
  variables: ProjectVariable[];
  onUpdateVariable: (name: string, value: any) => void;
  plugins: EditorPlugin[];
  isTransitioning: boolean;
  setIsTransitioning: (val: boolean) => void;
  isCinemaMode?: boolean;
  onExitCinemaMode?: () => void;
  isSingleNodePlayback?: boolean;
  onToggleSingleNodePlayback?: () => void;
}

export default function Player({
  scene,
  tracks,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayToggle,
  onSelectScene,
  variables,
  onUpdateVariable,
  plugins,
  isTransitioning,
  setIsTransitioning,
  isCinemaMode = false,
  onExitCinemaMode,
  isSingleNodePlayback = false,
  onToggleSingleNodePlayback,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local QTE states
  const [qteState, setQteState] = useState<{
    id: string;
    key: string;
    limit: number;
    startTime: number;
    resolved: boolean;
    success: boolean | null;
  } | null>(null);

  // Variables mapped as a quick key-value map for fast conditions evaluation
  const variablesMap = variables.reduce(
    (acc, v) => {
      acc[v.name] = v.value;
      return acc;
    },
    {} as Record<string, any>,
  );

  // Helper to evaluate string conditions like "hackingLevel >= 2"
  const evaluateCondition = (
    conditionStr?: string,
  ): { allowed: boolean; reason?: string } => {
    if (!conditionStr) return { allowed: true };
    try {
      // Safely evaluate simple conditions in the context of variables
      const func = new Function(
        ...Object.keys(variablesMap),
        `return ${conditionStr};`,
      );
      const result = func(...Object.values(variablesMap));
      return { allowed: !!result };
    } catch (err) {
      console.error("Condition evaluation error:", err);
      return { allowed: false, reason: "语法错误或变量未定义" };
    }
  };

  // Sync video play state with props
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or video error:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Sync video currentTime when timeline scrubs (within 0.3s deviation)
  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Active subtitles check
  const activeSubtitle = tracks
    .find((t) => t.type === "subtitle")
    ?.clips.find(
      (c) =>
        currentTime >= c.startTime && currentTime <= c.startTime + c.duration,
    );

  // Active choice triggers check
  // If we hit the trigger time of choices, we pause playback and display choice popup overlay
  const activeTriggerClip = tracks
    .find((t) => t.type === "trigger")
    ?.clips.find(
      (c) =>
        currentTime >= c.startTime && currentTime <= c.startTime + c.duration,
    );

  // If a choices overlay should show up, auto-pause the timeline
  useEffect(() => {
    if (activeTriggerClip && isPlaying) {
      if (isSingleNodePlayback) {
        return;
      }
      onPlayToggle(); // pause playback
    }
  }, [activeTriggerClip, isPlaying, isSingleNodePlayback]);

  // Active QTE plugin check in timeline
  const activeQteClip = tracks
    .find((t) => t.type === "plugin")
    ?.clips.find(
      (c) =>
        c.content?.pluginId === "p-qte" &&
        currentTime >= c.startTime &&
        currentTime <= c.startTime + c.duration,
    );

  // Manage QTE lifecycle
  useEffect(() => {
    if (activeQteClip && !isSingleNodePlayback) {
      const config = activeQteClip.content.pluginConfig || {
        keyTrigger: "SPACE",
        timeLimit: 1.5,
      };
      if (!qteState || qteState.id !== activeQteClip.id) {
        setQteState({
          id: activeQteClip.id,
          key: config.keyTrigger || "SPACE",
          limit: config.timeLimit || 1.5,
          startTime: activeQteClip.startTime,
          resolved: false,
          success: null,
        });
      }
    } else {
      setQteState(null);
    }
  }, [activeQteClip, isSingleNodePlayback]);

  // QTE Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!qteState || qteState.resolved) return;
      const keyUpper = e.key.toUpperCase();
      const triggerKey =
        qteState.key === "SPACE" ? " " : qteState.key.toUpperCase();

      if (keyUpper === triggerKey || e.key === triggerKey) {
        // Success!
        setQteState((prev) =>
          prev ? { ...prev, resolved: true, success: true } : null,
        );
        // Execute reward logic
        onUpdateVariable("hackingLevel", variablesMap["hackingLevel"] + 1);
        onUpdateVariable("credits", variablesMap["credits"] + 20);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [qteState, variablesMap]);

  // QTE Timer out check
  useEffect(() => {
    if (!qteState || qteState.resolved) return;
    const elapsed = currentTime - qteState.startTime;
    if (elapsed >= qteState.limit) {
      setQteState((prev) =>
        prev ? { ...prev, resolved: true, success: false } : null,
      );
    }
  }, [currentTime, qteState]);

  // Execute Choice action and shift Story node
  const handleChoiceClick = (targetSceneId: string, actionCode?: string) => {
    setIsTransitioning(true);

    // Evaluate custom script actions on choice
    if (actionCode) {
      try {
        // Simple evaluator sandbox for variable updates
        const executeAction = new Function(
          "variables",
          "onUpdateVariable",
          `
          const vars = { ...variables };
          ${actionCode}
          Object.keys(vars).forEach(key => {
            onUpdateVariable(key, vars[key]);
          });
        `,
        );
        executeAction(variablesMap, onUpdateVariable);
      } catch (err) {
        console.error("Choice action trigger failed to evaluate:", err);
      }
    }

    // Move to target scene node with smooth crossfade
    setTimeout(() => {
      onSelectScene(targetSceneId);
      setIsTransitioning(false);
    }, 600);
  };

  // Video timeupdate sync
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && isPlaying) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    if (isPlaying) {
      if (isSingleNodePlayback) {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          onTimeUpdate(0);
          videoRef.current.play().catch((err) => console.log(err));
        }
      } else {
        onPlayToggle(); // Pause at end of scene
      }
    }
  };

  // Check if HUD plugin is enabled
  const hudPlugin = plugins.find((p) => p.id === "p-stat-hud" && p.isActive);

  return (
    <div
      ref={containerRef}
      id="cinematic-interactive-player"
      onClick={() => {
        // If clicking background video in cinema mode, toggle play/pause
        if (isCinemaMode && !activeTriggerClip && !qteState) {
          onPlayToggle();
        }
      }}
      className={`relative w-full bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center select-none group transition-all duration-500 ${
        isCinemaMode
          ? "h-[75vh] border-amber-500/30 ring-4 ring-amber-500/5 shadow-amber-500/5 cursor-pointer"
          : "aspect-video"
      }`}
    >
      {/* 1. HTML5 Video Player */}
      <video
        ref={videoRef}
        src={scene.videoUrl}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={handleVideoEnded}
        muted
        playsInline
      />

      {/* Screen Grid overlay for cyber vibe */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* CINEMA IMMERSIVE HEADERS */}
      {isCinemaMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-5 flex items-center justify-between z-40 transition-all group-hover:translate-y-0 translate-y-[-10px] opacity-90 group-hover:opacity-100"
        >
          {/* Back Exit button */}
          <button
            onClick={onExitCinemaMode}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0d0f14] font-bold text-xs px-3 py-1.5 rounded-lg shadow-lg cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>退出沉浸放映</span>
          </button>

          {/* Central Live Variables Gauges */}
          <div className="flex items-center gap-5 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800 shadow-lg font-mono text-[11px]">
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3 font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>玩家变量数据包</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div>
                ⚡ 骇客等级:{" "}
                <span className="text-amber-400 font-bold">
                  {variablesMap.hackingLevel}
                </span>
              </div>
              <div>
                💳 信用点:{" "}
                <span className="text-emerald-400 font-bold">
                  {variablesMap.credits} CR
                </span>
              </div>
              <div>
                💾 记忆芯片:{" "}
                <span
                  className={
                    variablesMap.hasMemoryChip
                      ? "text-cyan-400 font-bold"
                      : "text-slate-500"
                  }
                >
                  {variablesMap.hasMemoryChip ? "已装载" : "缺失"}
                </span>
              </div>
              <div>
                🤖 AI状态:{" "}
                <span className="text-rose-400 font-bold uppercase">
                  {variablesMap.aiStatus || "offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Active scene label */}
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200">
            📽️ 互动放映中:{" "}
            <span className="text-amber-400 font-bold">{scene.name}</span>
          </div>
        </div>
      )}

      {/* 2. Custom Plugin Overlays: Variables Display HUD (Standard Mode Only) */}
      {hudPlugin && !isCinemaMode && !isTransitioning && (
        <div className="absolute top-4 left-4 z-40 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-center gap-4 text-[11px] text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 font-semibold text-amber-400">
            <Layers className="w-3.5 h-3.5" />
            <span>角色属性看板</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div>
              ⚡ 骇客等级:{" "}
              <span className="text-amber-400 font-bold">
                {variablesMap.hackingLevel}
              </span>
            </div>
            <div>
              💳 信用点:{" "}
              <span className="text-emerald-400 font-bold">
                {variablesMap.credits} CR
              </span>
            </div>
            <div>
              💾 记忆芯片:{" "}
              <span
                className={
                  variablesMap.hasMemoryChip
                    ? "text-cyan-400 font-bold"
                    : "text-slate-500"
                }
              >
                {variablesMap.hasMemoryChip ? "已装载" : "缺失"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Scene overlay label (Standard Mode Only) */}
      {!isCinemaMode && (
        <div className="absolute top-4 right-4 z-40 bg-black/60 px-2.5 py-1 rounded text-[10px] text-slate-400 font-mono flex items-center gap-1.5 border border-slate-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PREVIEW: {scene.name.split("_")[1]}</span>
        </div>
      )}

      {/* 3. Subtitles Overlay */}
      {activeSubtitle && !isTransitioning && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 text-center w-[85%] pointer-events-none">
          <div className="bg-black/75 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 inline-block shadow-2xl animate-scale-up">
            <p className="text-amber-400 font-bold text-sm tracking-wider md:text-lg">
              {activeSubtitle.content.text?.split(" / ")[0]}
            </p>
            <p className="text-slate-100 font-mono text-[11px] md:text-sm mt-1 opacity-90">
              {activeSubtitle.content.text?.split(" / ")[1]}
            </p>
          </div>
        </div>
      )}

      {/* 4. Interactive Branching Choices Overlay */}
      {activeTriggerClip &&
        !isPlaying &&
        !isTransitioning &&
        !isSingleNodePlayback && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in"
          >
            <Sparkles className="w-8 h-8 text-amber-500 animate-bounce mb-3" />
            <h2 className="text-lg font-bold text-slate-100 mb-1 tracking-wider">
              ⏱️ 关键时刻：作出决断
            </h2>
            <p className="text-xs text-slate-400 mb-6 max-w-md">
              剧情在此处产生分支。你的属性或过往决策（如是否获取记忆芯片）将影响选项是否解锁。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full">
              {(activeTriggerClip.content.choices || []).map((choice) => {
                const { allowed, reason } = evaluateCondition(choice.condition);

                return (
                  <button
                    key={choice.id}
                    disabled={!allowed}
                    onClick={() =>
                      handleChoiceClick(choice.targetSceneId, choice.actionCode)
                    }
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                      allowed
                        ? "bg-[#181d2c]/90 hover:bg-amber-500/15 border-slate-700 hover:border-amber-500 cursor-pointer text-slate-100 group shadow-lg hover:shadow-amber-500/5"
                        : "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-semibold text-xs truncate text-slate-200 group-hover:text-amber-400">
                        {choice.text}
                      </span>
                      {choice.condition && (
                        <span className="text-[9px] font-mono mt-1 text-amber-500/80">
                          🔑 需触发条件: {choice.condition}
                        </span>
                      )}
                    </div>

                    {allowed ? (
                      <div className="w-6 h-6 bg-amber-500/10 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <Zap className="w-3 h-3 text-amber-500 group-hover:text-slate-950" />
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center"
                        title={reason}
                      >
                        <Lock className="w-3 h-3 text-slate-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* 5. Quick-Time Event (QTE) Interactive Prompt Overlay */}
      {qteState &&
        !qteState.resolved &&
        !isTransitioning &&
        !isSingleNodePlayback && (
          <div className="absolute inset-0 z-50 bg-rose-950/20 backdrop-blur-[1px] flex flex-col items-center justify-center select-none pointer-events-none">
            <div className="bg-[#120a0d]/90 border-2 border-rose-500 px-6 py-4 rounded-full flex flex-col items-center justify-center text-center animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-auto shadow-[0_0_30px_rgba(244,63,94,0.3)]">
              <Zap className="w-6 h-6 text-rose-500 animate-pulse mb-1.5" />
              <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                ⚡ 快速反应事件 (QTE)
              </p>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5">
                按下 [{qteState.key}]
              </h3>
              <div className="w-24 bg-slate-900 h-1 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-75"
                  style={{
                    width: `${Math.max(0, 100 - ((currentTime - qteState.startTime) / qteState.limit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5">
                在 {qteState.limit}s 内反应 (提升骇客等级)
              </p>
            </div>
          </div>
        )}

      {/* QTE Resolution Notification */}
      {qteState && qteState.resolved && qteState.success !== null && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <span
            className={`px-4 py-2 rounded-full font-bold text-xs border flex items-center gap-1.5 shadow-lg ${
              qteState.success
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-400"
                : "bg-rose-950/90 border-rose-500 text-rose-400"
            }`}
          >
            {qteState.success
              ? "✓ 成功避开障碍！ (QTE Success)"
              : "✗ 遭受碰撞！防爆门未能激活 (QTE Failed)"}
          </span>
        </div>
      )}

      {/* 6. Transition Crossfade Screen */}
      <div
        className={`absolute inset-0 bg-[#0d0f14] z-50 pointer-events-none transition-opacity duration-500 flex flex-col items-center justify-center ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
      >
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-2" />
        <p className="text-xs font-mono text-slate-400">
          正在载入下一个场景时间轴分支...
        </p>
      </div>

      {/* 7. Hover Overlay Player Controls (for scrubbing preview in player) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between z-30"
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onPlayToggle}
            className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded-full text-slate-950 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
          <button
            onClick={() => onTimeUpdate(0)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-200 transition-colors cursor-pointer"
            title="重播本段"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleSingleNodePlayback}
            className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center ${
              isSingleNodePlayback
                ? "bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-md shadow-amber-500/25"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={
              isSingleNodePlayback
                ? "单节点循环播放：已开启 (不触发决策阻断)"
                : "单节点循环播放：已关闭 (触发决策阻断)"
            }
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isSingleNodePlayback && (
            <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
              🔂 单节点播放
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-300 bg-black/50 px-2 py-0.5 rounded border border-slate-800">
            时轴位置: {currentTime.toFixed(2)}s / {scene.duration}s
          </span>
        </div>
      </div>
    </div>
  );
}
