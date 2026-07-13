import React, { useRef, useState, useEffect } from "react";
import { TimelineTrack, TimelineClip } from "../types";
import {
  Play,
  Pause,
  Square,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Plus,
  Scissors,
  Trash2,
  Repeat,
  Film,
  Music,
  Type,
  Zap,
  Database,
  Trophy,
  Camera,
  Sparkles,
  Cpu,
  GitFork,
  Sliders,
} from "lucide-react";

interface TimelineProps {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number; // in seconds
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onPlayToggle: () => void;
  onStop: () => void;
  selectedClipId: string | null;
  onSelectClip: (clipId: string, trackId: string) => void;
  onUpdateClipTiming: (
    trackId: string,
    clipId: string,
    startTime: number,
    duration: number,
  ) => void;
  onAddClip: (trackId: string) => void;
  onDeleteClip: (trackId: string, clipId: string) => void;
  isSingleNodePlayback?: boolean;
  onToggleSingleNodePlayback?: () => void;
}

export default function Timeline({
  tracks,
  currentTime,
  duration,
  isPlaying,
  onTimeChange,
  onPlayToggle,
  onStop,
  selectedClipId,
  onSelectClip,
  onUpdateClipTiming,
  onAddClip,
  onDeleteClip,
  isSingleNodePlayback = false,
  onToggleSingleNodePlayback,
}: TimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(20); // Pixels per second (zoom level)
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // States for clip dragging and resizing
  const [activeDrag, setActiveDrag] = useState<{
    trackId: string;
    clip: TimelineClip;
    initialMouseX: number;
    initialStartTime: number;
    mode: "move" | "resize-start" | "resize-end";
  } | null>(null);

  // Local buffered coordinates for high-performance 60 FPS dragging without app-wide lag
  const [localDragClip, setLocalDragClip] = useState<{
    clipId: string;
    trackId: string;
    startTime: number;
    duration: number;
  } | null>(null);

  const localDragClipRef = useRef<{
    clipId: string;
    trackId: string;
    startTime: number;
    duration: number;
  } | null>(null);

  // Zoom controls (10px/sec to 100px/sec)
  const handleZoomIn = () => setZoom((z) => Math.min(100, z + 5));
  const handleZoomOut = () => setZoom((z) => Math.max(10, z - 5));

  // Time format helper: returns "00:04.25"
  const formatTimecode = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    const ms = Math.floor((secs % 1) * 100)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}.${ms}`;
  };

  // Scrubber events
  const handleRulerInteraction = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    let targetTime = clickX / zoom;
    targetTime = Math.max(0, Math.min(duration, targetTime));
    onTimeChange(targetTime);
  };

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleRulerInteraction(e);
  };

  // Track global movements for dragging/resizing clips or playhead scrubbing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isScrubbing && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        let targetTime = mouseX / zoom;
        targetTime = Math.max(0, Math.min(duration, targetTime));
        onTimeChange(targetTime);
      } else if (activeDrag) {
        const deltaX = e.clientX - activeDrag.initialMouseX;
        const deltaTime = deltaX / zoom;

        let newStartTime = activeDrag.clip.startTime;
        let newDuration = activeDrag.clip.duration;

        if (activeDrag.mode === "move") {
          newStartTime = Math.max(
            0,
            Math.min(
              duration - activeDrag.clip.duration,
              activeDrag.initialStartTime + deltaTime,
            ),
          );
        } else if (activeDrag.mode === "resize-end") {
          newDuration = Math.max(
            0.5,
            Math.min(
              duration - activeDrag.clip.startTime,
              activeDrag.clip.duration + deltaTime,
            ),
          );
        } else if (activeDrag.mode === "resize-start") {
          const possibleStart = activeDrag.initialStartTime + deltaTime;
          const possibleEnd =
            activeDrag.clip.startTime + activeDrag.clip.duration;

          if (possibleStart >= 0 && possibleStart <= possibleEnd - 0.5) {
            newStartTime = possibleStart;
            newDuration = possibleEnd - possibleStart;
          }
        }

        // Apply magnetic snapping to seconds ticks if within 0.15s
        const snapThreshold = 0.15;
        const nearestStartTick = Math.round(newStartTime);
        if (Math.abs(newStartTime - nearestStartTick) < snapThreshold) {
          newStartTime = nearestStartTick;
        }

        const bufferedTiming = {
          clipId: activeDrag.clip.id,
          trackId: activeDrag.trackId,
          startTime: newStartTime,
          duration: newDuration,
        };
        localDragClipRef.current = bufferedTiming;
        setLocalDragClip(bufferedTiming);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsScrubbing(false);
      if (activeDrag && localDragClipRef.current) {
        const { trackId, clipId, startTime, duration } =
          localDragClipRef.current;
        onUpdateClipTiming(trackId, clipId, startTime, duration);
      }
      setActiveDrag(null);
      setLocalDragClip(null);
      localDragClipRef.current = null;
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isScrubbing, activeDrag, zoom, duration, onUpdateClipTiming]);

  // Initiate drag operation
  const startClipDrag = (
    e: React.MouseEvent,
    trackId: string,
    clip: TimelineClip,
    mode: "move" | "resize-start" | "resize-end",
  ) => {
    e.stopPropagation();
    onSelectClip(clip.id, trackId);
    setActiveDrag({
      trackId,
      clip,
      initialMouseX: e.clientX,
      initialStartTime: clip.startTime,
      mode,
    });
  };

  // Generate ruler tick marks
  const renderRulerTicks = () => {
    const ticks: React.ReactNode[] = [];
    const step = duration > 30 ? 5 : 1; // Major ticks every 5s or 1s depending on scene length

    for (let s = 0; s <= duration; s += step) {
      const left = s * zoom;
      ticks.push(
        <div
          key={`tick-${s}`}
          className="absolute top-0 h-full flex flex-col justify-between"
          style={{ left: `${left}px` }}
        >
          <div className="h-2.5 w-[1px] bg-slate-500"></div>
          <span
            className="text-[9px] font-mono text-slate-400 select-none pb-0.5"
            style={{ transform: "translateX(-50%)" }}
          >
            {s}s
          </span>
        </div>,
      );

      // Add minor sub-seconds ticks
      if (step === 1 || zoom > 30) {
        for (let sub = 1; sub < 10; sub++) {
          const subLeft = (s + sub * 0.1) * zoom;
          if (subLeft < duration * zoom) {
            ticks.push(
              <div
                key={`sub-${s}-${sub}`}
                className="absolute top-0 h-1.5 w-[1px] bg-slate-700"
                style={{ left: `${subLeft}px` }}
              ></div>,
            );
          }
        }
      }
    }
    return ticks;
  };

  const getTrackIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "audio":
        return <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case "bgm":
        return <Music className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
      case "subtitle":
        return <Type className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case "trigger":
      case "choice":
        return <GitFork className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "variable":
        return <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case "achievement":
        return (
          <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-pulse" />
        );
      case "camera":
        return <Camera className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case "effect":
        return <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />;
      case "plugin":
        return <Cpu className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div
      id="timeline-workstation"
      className="flex flex-col h-full bg-[#121620] border border-slate-800 rounded-xl overflow-hidden select-none"
    >
      {/* 1. Control Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#171c2a] border-b border-slate-800">
        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayToggle}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isPlaying
                ? "bg-amber-500 text-[#0d0f14] shadow-md shadow-amber-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>

          <button
            onClick={onStop}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all cursor-pointer"
            title="停止"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSingleNodePlayback}
            className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold ${
              isSingleNodePlayback
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            }`}
            title={
              isSingleNodePlayback
                ? "单节点播放已开启 (循环且屏蔽分支阻断)"
                : "开启单节点播放 (循环且屏蔽分支阻断)"
            }
          >
            <Repeat
              className={`w-3.5 h-3.5 ${isSingleNodePlayback ? "animate-spin-slow" : ""}`}
            />
            <span>单节点播放</span>
          </button>

          {/* Time Code Displays */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-xs font-mono font-bold text-amber-400">
              {formatTimecode(currentTime)}
            </span>
            <span className="text-slate-600 text-xs font-mono">/</span>
            <span className="text-xs font-mono text-slate-400">
              {formatTimecode(duration)}
            </span>
          </div>
        </div>

        {/* Dynamic Tip */}
        <div className="hidden md:flex items-center text-[10px] text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-full">
          💡 双击轨道空白处可新增片段 | 拖拽片段边缘可伸缩时长 |
          支持按秒磁吸定位
        </div>

        {/* View/Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
            title="缩小时间轴"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            {Math.round(zoom)}px/s
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
            title="放大时间轴"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Timeline Workspace with Side Panel and Tracks */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Track Headers (Static Side rail) */}
        <div className="w-48 border-r border-slate-800 bg-[#161a29]/60 shrink-0 flex flex-col pt-9">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-14 border-b border-slate-800 flex items-center justify-between px-3 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getTrackIcon(track.type)}
                <span
                  className="text-[11px] font-semibold text-slate-200 truncate"
                  title={track.name}
                >
                  {track.name}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                {/* Track specific mute buttons */}
                {track.type === "audio" && (
                  <button className="p-0.5 text-slate-400 hover:text-indigo-400 rounded cursor-pointer">
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
                <button className="p-0.5 text-slate-400 hover:text-amber-400 rounded cursor-pointer">
                  <Unlock className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onAddClip(track.id)}
                  className="p-0.5 text-slate-400 hover:text-emerald-400 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="新增空白片段"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Scrollable Tracks & Ruler */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#0e111a] flex flex-col">
          {/* Scrollable Track Body Container */}
          <div
            className="relative flex-1"
            style={{ width: `${duration * zoom + 120}px` }}
          >
            {/* Top Ruler Header (Click/Scrub to set time) */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-9 w-full bg-[#131724]/90 border-b border-slate-800 relative cursor-col-resize overflow-hidden"
            >
              {renderRulerTicks()}
            </div>

            {/* Scrolling Tracks Block */}
            <div className="relative">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onDoubleClick={() => onAddClip(track.id)}
                  className="h-14 border-b border-slate-800 relative bg-slate-900/10 hover:bg-slate-900/30 transition-colors"
                >
                  {/* Track Clips Container */}
                  {track.clips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const isBeingDragged =
                      localDragClip && localDragClip.clipId === clip.id;
                    const clipLeft =
                      (isBeingDragged
                        ? localDragClip!.startTime
                        : clip.startTime) * zoom;
                    const clipWidth =
                      (isBeingDragged
                        ? localDragClip!.duration
                        : clip.duration) * zoom;

                    return (
                      <div
                        key={clip.id}
                        onMouseDown={(e) =>
                          startClipDrag(e, track.id, clip, "move")
                        }
                        className={`absolute top-1.5 bottom-1.5 rounded-md border-2 px-2 py-1 flex items-center justify-between select-none cursor-grab active:cursor-grabbing transition-all ${clip.color} ${
                          isSelected
                            ? "shadow-[0_0_12px_rgba(245,158,11,0.25)] border-amber-400 ring-2 ring-amber-400/20 z-20"
                            : "border-white/10 z-10"
                        }`}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                        }}
                      >
                        {/* LEFT Resize Handle */}
                        <div
                          onMouseDown={(e) =>
                            startClipDrag(e, track.id, clip, "resize-start")
                          }
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200/20 hover:bg-white/40 cursor-ew-resize rounded-l-md transition-colors"
                        />

                        {/* Title text */}
                        <span className="text-[10px] font-medium truncate pointer-events-none pr-1 select-none text-slate-100 flex items-center gap-1">
                          {clip.title}
                        </span>

                        {/* Delete action indicator on selected clip */}
                        {isSelected && (
                          <button
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onDeleteClip(track.id, clip.id);
                            }}
                            className="p-0.5 bg-black/40 hover:bg-rose-500 rounded text-rose-300 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="删除片段"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {/* RIGHT Resize Handle */}
                        <div
                          onMouseDown={(e) =>
                            startClipDrag(e, track.id, clip, "resize-end")
                          }
                          className="absolute right-0 top-0 bottom-0 w-1.5 bg-slate-200/20 hover:bg-white/40 cursor-ew-resize rounded-r-md transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Glowing Vertical Playhead Marker */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] pointer-events-none z-30 transition-transform duration-75"
              style={{
                transform: `translateX(${currentTime * zoom}px)`,
              }}
            >
              {/* Playhead Cap */}
              <div className="absolute top-0 -translate-x-1/2 w-4 h-4 bg-amber-500 rounded-b-md border border-amber-600 shadow-md">
                <div className="w-1 h-2 mx-auto bg-slate-900 rounded-sm mt-0.5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
