import React from "react";
import { TimelineClip, SceneNode, Choice, MediaAsset } from "../types";
import {
  Settings,
  Info,
  Type,
  Clock,
  Trash2,
  GitBranch,
  Edit3,
  Video,
  ChevronDown,
  ChevronRight,
  Database,
  Camera,
  Sparkles,
  Volume2,
  Code,
} from "lucide-react";

type PluginConfigValue = string | number | boolean;

interface InspectorProps {
  selectedClip: TimelineClip | null;
  selectedTrackId: string | null;
  activeScene: SceneNode;
  allScenes: SceneNode[];
  onUpdateClipContent: (
    trackId: string,
    clipId: string,
    updatedContent: TimelineClip["content"],
  ) => void;
  onUpdateClipTitle: (trackId: string, clipId: string, title: string) => void;
  onUpdateScene?: (sceneId: string, updatedFields: Partial<SceneNode>) => void;
  allAssets?: MediaAsset[];
}

export default function Inspector({
  selectedClip,
  selectedTrackId,
  activeScene,
  allScenes,
  onUpdateClipContent,
  onUpdateClipTitle,
  onUpdateScene,
  allAssets = [],
}: InspectorProps) {
  // Collapsible accordion section states
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    basic: true,
    media: true,
    choice: true,
    variables: true,
    audio: true,
    camera: true,
    events: true,
    debug: false,
  });

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubtitleTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (!selectedClip || !selectedTrackId) return;
    onUpdateClipContent(selectedTrackId, selectedClip.id, {
      ...selectedClip.content,
      text: e.target.value,
    });
    // Sync title
    const truncated =
      e.target.value.substring(0, 20) +
      (e.target.value.length > 20 ? "..." : "");
    onUpdateClipTitle(
      selectedTrackId,
      selectedClip.id,
      truncated || "对白字幕",
    );
  };

  const handlePluginConfigChange = (key: string, value: PluginConfigValue) => {
    if (!selectedClip || !selectedTrackId) return;
    const currentConfig = selectedClip.content.pluginConfig || {};
    onUpdateClipContent(selectedTrackId, selectedClip.id, {
      ...selectedClip.content,
      pluginConfig: {
        ...currentConfig,
        [key]: value,
      },
    });
  };

  // Trigger choices editors
  const handleUpdateChoice = (
    index: number,
    updatedFields: Partial<Choice>,
  ) => {
    if (!selectedClip || !selectedTrackId) return;
    const choicesList = [...(selectedClip.content.choices || [])];
    choicesList[index] = {
      ...choicesList[index],
      ...updatedFields,
    };
    onUpdateClipContent(selectedTrackId, selectedClip.id, {
      ...selectedClip.content,
      choices: choicesList,
    });
  };

  const handleAddNewChoice = () => {
    if (!selectedClip || !selectedTrackId) return;
    const choicesList = [...(selectedClip.content.choices || [])];
    const newChoice: Choice = {
      id: `choice-added-${Date.now()}`,
      text: "新互动选项选项...",
      targetSceneId:
        allScenes.find((s) => s.id !== activeScene.id)?.id || activeScene.id,
      triggerTime: selectedClip.startTime,
    };
    choicesList.push(newChoice);
    onUpdateClipContent(selectedTrackId, selectedClip.id, {
      ...selectedClip.content,
      choices: choicesList,
    });
  };

  const handleDeleteChoice = (index: number) => {
    if (!selectedClip || !selectedTrackId) return;
    const choicesList = [...(selectedClip.content.choices || [])];
    choicesList.splice(index, 1);
    onUpdateClipContent(selectedTrackId, selectedClip.id, {
      ...selectedClip.content,
      choices: choicesList,
    });
  };

  // Direct content editors
  const handleDirectPropertyChange = <
    Key extends keyof TimelineClip["content"],
  >(
    key: Key,
    value: TimelineClip["content"][Key],
  ) => {
    if (!selectedClip || !selectedTrackId) return;
    onUpdateClipContent(selectedTrackId, selectedClip.id, {
      ...selectedClip.content,
      [key]: value,
    });
  };

  const handleClipTitleEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClip || !selectedTrackId) return;
    onUpdateClipTitle(selectedTrackId, selectedClip.id, e.target.value);
  };

  // Accordion Header Renderer
  const renderSectionHeader = (
    key: string,
    label: string,
    icon: React.ReactNode,
    count?: number,
  ) => {
    const isExpanded = expanded[key];
    return (
      <button
        onClick={() => toggleSection(key)}
        className="w-full flex items-center justify-between py-2 px-3 bg-[#161a29] border border-slate-800/80 rounded-lg text-[11px] font-bold text-slate-200 hover:text-white transition-all cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
          {count !== undefined && count > 0 && (
            <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/20 font-bold font-mono">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-300">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
          )}
        </div>
      </button>
    );
  };

  // Variables list options
  const fallbackVariables = [
    "hackingLevel",
    "credits",
    "hasMemoryChip",
    "aiStatus",
    "playerSanity",
    "gold",
  ];

  return (
    <div
      id="inspector-property-panel"
      className="flex flex-col h-full bg-[#11141e] border border-slate-800 rounded-xl overflow-hidden select-none"
    >
      {/* Panel Header */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#151a27] border-b border-slate-800 shrink-0">
        <Settings className="w-4 h-4 text-amber-500 animate-[spin_5s_linear_infinite]" />
        <span className="text-xs font-bold text-slate-200">
          属性观察与高级配置 (Inspector)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedClip ? (
          /* ========================================================= */
          /* SECTION A: CLIP IS SELECTED                               */
          /* ========================================================= */
          <div className="space-y-2.5 animate-fade-in">
            {/* Header info */}
            <div className="px-1.5 py-1">
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                片段:{" "}
                {selectedTrackId?.split("-")[1]?.toUpperCase() ||
                  "Timeline Clip"}
              </span>
              <h3 className="text-xs font-bold text-slate-100 truncate mt-2">
                {selectedClip.title}
              </h3>
            </div>

            {/* 1. ▼ Basic (基础) */}
            <div className="space-y-1.5">
              {renderSectionHeader(
                "basic",
                "Basic / 基础属性",
                <Info className="w-3.5 h-3.5 text-slate-400" />,
              )}
              {expanded.basic && (
                <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                      片段显示名称
                    </label>
                    <input
                      type="text"
                      value={selectedClip.title}
                      onChange={handleClipTitleEdit}
                      className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded border border-slate-800 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[9px] text-slate-500 mb-0.5">
                        起始时刻 (Start)
                      </span>
                      <div className="text-xs font-mono font-medium text-slate-200 bg-slate-950/80 px-2 py-1 rounded border border-slate-900">
                        {selectedClip.startTime.toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 mb-0.5">
                        持续时长 (Duration)
                      </span>
                      <div className="text-xs font-mono font-medium text-slate-200 bg-slate-950/80 px-2 py-1 rounded border border-slate-900">
                        {selectedClip.duration.toFixed(2)}s
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. ▼ Media (媒体) - Relevant if subtitle, video etc. */}
            {(selectedTrackId?.includes("sub") ||
              selectedTrackId?.includes("vid") ||
              selectedClip.content.videoUrl !== undefined ||
              selectedClip.content.text !== undefined) && (
              <div className="space-y-1.5">
                {renderSectionHeader(
                  "media",
                  "Media / 媒体资源",
                  <Video className="w-3.5 h-3.5 text-emerald-400" />,
                )}
                {expanded.media && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-2.5 animate-fade-in">
                    {/* Video clip asset selection */}
                    {selectedClip.content.videoUrl !== undefined && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-semibold">
                          切换视频轨道资源
                        </label>
                        <select
                          value={selectedClip.content.videoUrl || ""}
                          onChange={(e) =>
                            handleDirectPropertyChange(
                              "videoUrl",
                              e.target.value,
                            )
                          }
                          className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                        >
                          {allAssets
                            .filter((a) => a.type === "video")
                            .map((asset) => (
                              <option key={asset.id} value={asset.id}>
                                {asset.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Subtitle track specific editors */}
                    {selectedClip.content.text !== undefined && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Type className="w-3.5 h-3.5 text-purple-400" />
                          对白字幕文本
                        </label>
                        <textarea
                          value={selectedClip.content.text || ""}
                          onChange={handleSubtitleTextChange}
                          placeholder="输入中文 / 英文 对白文本..."
                          className="w-full h-18 bg-slate-950 text-slate-200 text-xs p-2 rounded border border-slate-800 focus:border-amber-500/40 outline-none leading-relaxed resize-none shadow-inner"
                        />
                        <p className="text-[9px] text-slate-500 leading-normal">
                          * 提示: 换行或使用 "/" 可分离中英文。
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. ▼ Choice (分支选项) - Only if choice/trigger tracks */}
            {(selectedTrackId?.includes("trig") ||
              selectedTrackId?.includes("choice") ||
              selectedClip.content.choices !== undefined) && (
              <div className="space-y-1.5">
                {renderSectionHeader(
                  "choice",
                  "Choice / 交互决断分支",
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />,
                  (selectedClip.content.choices || []).length,
                )}
                {expanded.choice && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-semibold">
                        分镜暂停时间: {selectedClip.startTime.toFixed(2)}s
                      </span>
                      <button
                        onClick={handleAddNewChoice}
                        className="text-[9px] bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 py-0.5 px-2 rounded cursor-pointer transition-colors"
                      >
                        + 增加选项
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5">
                      {(selectedClip.content.choices || []).map((choice, i) => (
                        <div
                          key={choice.id}
                          className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 space-y-2 relative"
                        >
                          <button
                            onClick={() => handleDeleteChoice(i)}
                            className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                            title="删除选项"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5 font-semibold">
                              选项文本
                            </label>
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) =>
                                handleUpdateChoice(i, { text: e.target.value })
                              }
                              className="w-[85%] bg-slate-950 text-slate-100 text-[11px] px-2 py-1 rounded border border-slate-800 outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-0.5">
                                目标跳转节点
                              </label>
                              <select
                                value={choice.targetSceneId}
                                onChange={(e) =>
                                  handleUpdateChoice(i, {
                                    targetSceneId: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-950 text-slate-200 text-[10px] p-1 rounded border border-slate-800 outline-none"
                              >
                                {allScenes.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name.split("_")[1] || s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-500 mb-0.5">
                                触发前置条件
                              </label>
                              <input
                                type="text"
                                placeholder="hasMemoryChip === true"
                                value={choice.condition || ""}
                                onChange={(e) =>
                                  handleUpdateChoice(i, {
                                    condition: e.target.value || undefined,
                                  })
                                }
                                className="w-full bg-slate-950 text-slate-200 text-[10px] p-1 rounded border border-slate-800 outline-none font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">
                              点击动作脚本
                            </label>
                            <input
                              type="text"
                              placeholder="variables.credits += 10;"
                              value={choice.actionCode || ""}
                              onChange={(e) =>
                                handleUpdateChoice(i, {
                                  actionCode: e.target.value || undefined,
                                })
                              }
                              className="w-full bg-slate-950 text-slate-200 text-[10px] p-1 rounded border border-slate-800 outline-none font-mono"
                            />
                          </div>
                        </div>
                      ))}
                      {(selectedClip.content.choices || []).length === 0 && (
                        <div className="text-center py-3 text-[10px] text-slate-500 italic">
                          暂无选项，双击空白处或右上角可快速添加。
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. ▼ Variables (变量操作) - If variable track */}
            {(selectedTrackId?.includes("var") ||
              selectedClip.content.variableId !== undefined) && (
              <div className="space-y-1.5">
                {renderSectionHeader(
                  "variables",
                  "Variables / 变量触发器",
                  <Database className="w-3.5 h-3.5 text-cyan-400" />,
                )}
                {expanded.variables && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                        关联剧情变量
                      </label>
                      <select
                        value={selectedClip.content.variableId || "v3"}
                        onChange={(e) =>
                          handleDirectPropertyChange(
                            "variableId",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                      >
                        {fallbackVariables.map((v, idx) => (
                          <option key={v} value={`v${idx + 1}`}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                          变更类型
                        </label>
                        <select
                          value={selectedClip.content.operation || "add"}
                          onChange={(e) =>
                            handleDirectPropertyChange(
                              "operation",
                              e.target.value,
                            )
                          }
                          className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                        >
                          <option value="set">Assign (=)</option>
                          <option value="add">Add (+)</option>
                          <option value="sub">Subtract (-)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                          操作数值
                        </label>
                        <input
                          type="text"
                          value={
                            selectedClip.content.value !== undefined
                              ? selectedClip.content.value
                              : 50
                          }
                          onChange={(e) =>
                            handleDirectPropertyChange(
                              "value",
                              isNaN(Number(e.target.value))
                                ? e.target.value
                                : Number(e.target.value),
                            )
                          }
                          className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. ▼ Audio (音频/BGM) - If audio/bgm tracks */}
            {(selectedTrackId?.includes("aud") ||
              selectedTrackId?.includes("bgm") ||
              selectedClip.content.volume !== undefined) && (
              <div className="space-y-1.5">
                {renderSectionHeader(
                  "audio",
                  "Audio / 音效背景声",
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />,
                )}
                {expanded.audio && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold">音量强度 (Volume)</span>
                        <span className="font-mono text-indigo-400">
                          {selectedClip.content.volume ?? 80}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedClip.content.volume ?? 80}
                        onChange={(e) =>
                          handleDirectPropertyChange(
                            "volume",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="audio-loop"
                        checked={selectedClip.content.loop ?? false}
                        onChange={(e) =>
                          handleDirectPropertyChange("loop", e.target.checked)
                        }
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-950"
                      />
                      <label
                        htmlFor="audio-loop"
                        className="text-[10px] text-slate-300 select-none cursor-pointer font-semibold"
                      >
                        开启背景音乐无缝循环 (Loop BGM)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. ▼ Camera (镜头控制) */}
            {(selectedTrackId?.includes("cam") ||
              selectedClip.content.preset !== undefined) && (
              <div className="space-y-1.5">
                {renderSectionHeader(
                  "camera",
                  "Camera / 镜头特效控制",
                  <Camera className="w-3.5 h-3.5 text-sky-400" />,
                )}
                {expanded.camera && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                        镜头推进微动作
                      </label>
                      <select
                        value={selectedClip.content.preset || "zoom-in"}
                        onChange={(e) =>
                          handleDirectPropertyChange("preset", e.target.value)
                        }
                        className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                      >
                        <option value="zoom-in">近景拉近 (Zoom-In 2x)</option>
                        <option value="zoom-out">
                          全景拉远 (Zoom-Out 0.5x)
                        </option>
                        <option value="pan-left">向左横移 (Pan Left)</option>
                        <option value="pan-right">向右横移 (Pan Right)</option>
                        <option value="shake">镜头震颤 (Shake Dynamic)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                        镜头缓动过渡时长
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedClip.content.duration ?? 2.0}
                        onChange={(e) =>
                          handleDirectPropertyChange(
                            "duration",
                            parseFloat(e.target.value) || 2.0,
                          )
                        }
                        className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. ▼ Events (成就/特效/其它) */}
            {(selectedTrackId?.includes("ach") ||
              selectedTrackId?.includes("eff") ||
              selectedTrackId?.includes("plug") ||
              selectedClip.content.achievementName !== undefined ||
              selectedClip.content.effectType !== undefined ||
              selectedClip.content.pluginId !== undefined) && (
              <div className="space-y-1.5">
                {renderSectionHeader(
                  "events",
                  "Events / 成就与渲染事件",
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />,
                )}
                {expanded.events && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                    {/* Achievement track item editing */}
                    {selectedClip.content.achievementName !== undefined && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                            解锁成就大类
                          </label>
                          <input
                            type="text"
                            value={selectedClip.content.achievementName}
                            onChange={(e) =>
                              handleDirectPropertyChange(
                                "achievementName",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-950 text-slate-100 text-xs p-1.5 rounded border border-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                            成就分值 (Steam points)
                          </label>
                          <input
                            type="number"
                            value={selectedClip.content.points ?? 10}
                            onChange={(e) =>
                              handleDirectPropertyChange(
                                "points",
                                parseInt(e.target.value) || 10,
                              )
                            }
                            className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Effect style item editing */}
                    {selectedClip.content.effectType !== undefined && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                            屏幕特效滤镜
                          </label>
                          <select
                            value={selectedClip.content.effectType}
                            onChange={(e) =>
                              handleDirectPropertyChange(
                                "effectType",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                          >
                            <option value="glitch">Glitch 故障风抖动</option>
                            <option value="vhs">VHS 复古旧磁带</option>
                            <option value="bloom">Bloom 炫白过曝</option>
                            <option value="bw">B&W 绝望黑白电影</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                            特效振幅/强度
                          </label>
                          <select
                            value={selectedClip.content.intensity || "medium"}
                            onChange={(e) =>
                              handleDirectPropertyChange(
                                "intensity",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                          >
                            <option value="low">微弱 (Low)</option>
                            <option value="medium">中等 (Medium)</option>
                            <option value="high">强劲 (High)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* QTE script editor */}
                    {selectedClip.content.pluginId === "p-qte" && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                            触发按键
                          </label>
                          <select
                            value={
                              selectedClip.content.pluginConfig?.keyTrigger ||
                              "SPACE"
                            }
                            onChange={(e) =>
                              handlePluginConfigChange(
                                "keyTrigger",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none"
                          >
                            <option value="SPACE">空格键 (SPACE)</option>
                            <option value="W">按键「W」</option>
                            <option value="A">按键「A」</option>
                            <option value="S">按键「S」</option>
                            <option value="D">按键「D」</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                            限定极速宽容时长
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={
                              selectedClip.content.pluginConfig?.timeLimit ||
                              1.5
                            }
                            onChange={(e) =>
                              handlePluginConfigChange(
                                "timeLimit",
                                parseFloat(e.target.value) || 1.5,
                              )
                            }
                            className="w-full bg-slate-950 text-slate-200 text-xs p-1.5 rounded border border-slate-800 outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 8. ▼ Debug (代码原始对象) */}
            <div className="space-y-1.5">
              {renderSectionHeader(
                "debug",
                "Debug / JSON 原始节点",
                <Code className="w-3.5 h-3.5 text-slate-500" />,
              )}
              {expanded.debug && (
                <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 animate-fade-in">
                  <pre className="text-[9px] font-mono text-slate-400 leading-normal max-h-48 overflow-auto select-text">
                    {JSON.stringify(selectedClip, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* SECTION B: SCENE SETTINGS (NO ACTIVE CLIP)                */
          /* ========================================================= */
          <div className="space-y-2.5 animate-fade-in">
            {/* Header info */}
            <div className="px-1.5 py-1">
              <span className="text-[9px] font-bold text-slate-400 bg-slate-800/40 border border-slate-800 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                全局: 当前剧情节点配置
              </span>
              <h3 className="text-xs font-bold text-slate-100 mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                {activeScene.name}
              </h3>
            </div>

            {/* 1. ▼ Basic (基础) */}
            <div className="space-y-1.5">
              {renderSectionHeader(
                "basic",
                "Basic / 节点基础大纲",
                <Info className="w-3.5 h-3.5 text-slate-400" />,
              )}
              {expanded.basic && (
                <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-amber-500" />
                      场景节点标题名称
                    </label>
                    <input
                      type="text"
                      value={activeScene.name}
                      onChange={(e) =>
                        onUpdateScene?.(activeScene.id, {
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <Info className="w-3 h-3 text-amber-500" />
                      剧情梗概与剧情描述
                    </label>
                    <textarea
                      value={activeScene.description || ""}
                      onChange={(e) =>
                        onUpdateScene?.(activeScene.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="在此输入故事主分支或支线的说明文字..."
                      className="w-full h-20 bg-slate-950 text-slate-200 text-xs p-2 rounded-lg border border-slate-800 outline-none leading-relaxed resize-none shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. ▼ Media (媒体) */}
            <div className="space-y-1.5">
              {renderSectionHeader(
                "media",
                "Media / 分镜渲染关联",
                <Video className="w-3.5 h-3.5 text-emerald-400" />,
              )}
              {expanded.media && (
                <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      分镜最大播放时间 (秒)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={activeScene.duration}
                      onChange={(e) =>
                        onUpdateScene?.(activeScene.id, {
                          duration: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded border border-slate-800 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <Video className="w-3 h-3 text-amber-500" />
                      底层播放主视频资源
                    </label>
                    <select
                      value={activeScene.videoUrl}
                      onChange={(e) =>
                        onUpdateScene?.(activeScene.id, {
                          videoUrl: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-slate-200 text-xs px-2 py-1.5 rounded border border-slate-800 outline-none mb-1.5"
                    >
                      <option value="">-- 自定义直连 URL --</option>
                      {allAssets
                        .filter((a) => a.type === "video")
                        .map((asset) => (
                          <option key={asset.id} value={asset.url}>
                            {asset.name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      value={activeScene.videoUrl}
                      onChange={(e) =>
                        onUpdateScene?.(activeScene.id, {
                          videoUrl: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-900 outline-none font-mono truncate"
                      placeholder="外部 MP4 静态链接地址..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. ▼ Choice (分支选项) */}
            <div className="space-y-1.5">
              {renderSectionHeader(
                "choice",
                "Choice / 下级驱动分支",
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />,
                activeScene.choices.length,
              )}
              {expanded.choice && (
                <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 space-y-2 animate-fade-in">
                  {activeScene.choices.map((c) => {
                    const target = allScenes.find(
                      (s) => s.id === c.targetSceneId,
                    );
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-[10px] bg-slate-900/60 p-2 rounded border border-slate-800/50"
                      >
                        <div className="min-w-0 pr-1.5">
                          <p className="font-bold text-slate-200 truncate">
                            {c.text}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                            时间点: {c.triggerTime}s
                          </p>
                        </div>
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10 shrink-0 font-medium">
                          ⟶ {target?.name.split("_")[1] || "未知分支"}
                        </span>
                      </div>
                    );
                  })}
                  {activeScene.choices.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-rose-400 italic font-semibold">
                      🏁 这是一个终局节点（Ending），无后续分支！
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. ▼ Debug (原始配置) */}
            <div className="space-y-1.5">
              {renderSectionHeader(
                "debug",
                "Debug / JSON 场景配置",
                <Code className="w-3.5 h-3.5 text-slate-500" />,
              )}
              {expanded.debug && (
                <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2 animate-fade-in">
                  <pre className="text-[9px] font-mono text-slate-400 leading-normal max-h-48 overflow-auto select-text">
                    {JSON.stringify(activeScene, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
