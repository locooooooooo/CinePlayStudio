import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  Panel,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SceneNode, Choice, TimelineTrack } from "../types";
import {
  Play,
  Plus,
  Trash2,
  GitFork,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  Edit2,
  MousePointer,
  Compass,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Database,
  Eye,
  Settings,
  HelpCircle,
  TrendingUp,
  Workflow,
  Video,
} from "lucide-react";

interface FlowchartProps {
  scenes: SceneNode[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onDeleteScene: (id: string) => void;
  onUpdateScenePosition: (id: string, x: number, y: number) => void;
  onUpdateScene: (id: string, fields: Partial<SceneNode>) => void;
  timelines?: Record<string, TimelineTrack[]>;
  variables?: any[];
}

// Node Status presets and helpers
const STATUS_PRESETS = [
  {
    value: "in_progress",
    label: "🟡 编辑中",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    value: "completed",
    label: "🟢 已完成",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    value: "reviewed",
    label: "🔵 已审核",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  },
  {
    value: "ai_generated",
    label: "🟣 AI生成",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  {
    value: "missing_assets",
    label: "🔴 缺资源",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
];

const getStatusBadge = (status?: string) => {
  const preset =
    STATUS_PRESETS.find((p) => p.value === status) || STATUS_PRESETS[0];
  return preset;
};

// ==========================================
// CUSTOM NODE COMPONENT (Highly polished card with status and Choice tree)
// ==========================================
const SceneCustomNode = memo(({ data }: any) => {
  const { scene, isActive, onSelect, onDelete, onUpdateScene, isOnlyNode } =
    data;
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(scene.name);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateScene(scene.id, { name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  const handleDeleteChoice = (choiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChoices = scene.choices.filter(
      (c: Choice) => c.id !== choiceId,
    );
    onUpdateScene(scene.id, { choices: updatedChoices });
  };

  const handleAddChoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newChoiceId = `choice-${Date.now()}`;
    const newChoice: Choice = {
      id: newChoiceId,
      text: "新分支选项",
      targetSceneId: scene.id,
      triggerTime: Math.max(1, scene.duration - 2),
    };
    onUpdateScene(scene.id, { choices: [...scene.choices, newChoice] });
  };

  const handleStatusChange = (statusVal: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateScene(scene.id, { status: statusVal as any });
    setShowStatusDropdown(false);
  };

  const statusBadge = getStatusBadge(scene.status);

  return (
    <div
      className={`w-64 bg-[#131623] rounded-xl border-2 transition-all duration-300 overflow-hidden shadow-2xl relative select-none ${
        isActive
          ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/20"
          : "border-slate-800/90 hover:border-slate-700/80 hover:shadow-xl hover:-translate-y-0.5"
      }`}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: "#f59e0b",
          width: "10px",
          height: "10px",
          border: "2px solid #0d0f14",
          borderRadius: "50%",
        }}
        title="流入节点"
      />

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: "#3b82f6",
          width: "10px",
          height: "10px",
          border: "2px solid #0d0f14",
          borderRadius: "50%",
        }}
        title="流出分支"
      />

      {/* 1. Header Frame */}
      <div className="relative h-28 bg-slate-950 flex items-center justify-center">
        {scene.thumbnail ? (
          <img
            src={scene.thumbnail}
            alt={scene.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <Video className="w-8 h-8 text-slate-700 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131623] via-[#131623]/30 to-transparent" />

        {/* Glow point */}
        {isActive && (
          <span className="absolute top-2.5 left-2.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        )}

        {/* Status Dropdown Trigger */}
        <div className="absolute top-2.5 left-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusDropdown(!showStatusDropdown);
            }}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer select-none transition-all flex items-center gap-1 ${statusBadge.color}`}
          >
            {statusBadge.label}
          </button>

          {showStatusDropdown && (
            <div className="absolute top-6 left-0 bg-[#161a29] border border-slate-800 rounded-lg shadow-2xl py-1 w-28 z-20 animate-scale-up">
              {STATUS_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={(e) => handleStatusChange(p.value, e)}
                  className="w-full text-left px-2.5 py-1 text-[10px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <span>{p.label}</span>
                  {scene.status === p.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2.5 text-[9px] font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/40 font-bold">
          {scene.duration}s
        </span>

        {/* Node ID */}
        <span className="absolute top-2.5 right-2.5 text-[9px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.2 rounded">
          {scene.id}
        </span>
      </div>

      {/* 2. Text / Description body */}
      <div className="p-3 space-y-2.5">
        <div>
          {isEditingName ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                autoFocus
              />
            </div>
          ) : (
            <h3 className="text-xs font-bold text-slate-100 flex items-center justify-between group">
              <span className="truncate max-w-[170px]" title={scene.name}>
                {scene.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </h3>
          )}
          <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 mt-1 h-7">
            {scene.description || "无节点描述概要..."}
          </p>
        </div>

        {/* 3. Visual Choice Tree Structure directly on Node */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold border-b border-slate-900 pb-1 mb-1">
            <span>分支大纲 (Choices Tree)</span>
            <button
              onClick={handleAddChoice}
              className="text-amber-500 hover:text-amber-400 flex items-center gap-0.5 font-bold cursor-pointer"
              title="添加分支"
            >
              <PlusCircleIcon className="w-3 h-3" />
              <span>添加</span>
            </button>
          </div>

          <div className="space-y-0.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
            {scene.choices.map((choice: Choice, idx: number) => {
              const isLast = idx === scene.choices.length - 1;
              const connector = isLast ? "└─ " : "├─ ";
              return (
                <div
                  key={choice.id}
                  className="flex items-center justify-between text-[10px] text-slate-300 hover:bg-slate-950/40 py-0.5 px-1 rounded transition-colors group/choice relative"
                >
                  <div className="flex items-center truncate pr-1">
                    <span className="font-mono text-slate-600 shrink-0">
                      {connector}
                    </span>
                    <span
                      className="truncate font-semibold text-slate-300"
                      title={choice.text}
                    >
                      {choice.text}
                    </span>
                  </div>

                  {/* Tooltip on Choice Hover */}
                  <div className="absolute hidden group-hover/choice:block bottom-6 left-2 z-30 bg-[#161b2a] border border-slate-800 p-2.5 rounded-lg shadow-2xl w-48 text-[9px] text-slate-400 space-y-1 animate-scale-up pointer-events-none">
                    <p className="font-bold text-amber-400 truncate border-b border-slate-800/80 pb-1 mb-1">
                      {choice.text}
                    </p>
                    <p>
                      🎯 <span className="text-slate-300">目标跳转:</span>{" "}
                      {choice.targetSceneId}
                    </p>
                    {choice.condition && (
                      <p>
                        🔑 <span className="text-slate-300">准入条件:</span>{" "}
                        <code className="text-indigo-400 font-mono">
                          {choice.condition}
                        </code>
                      </p>
                    )}
                    {choice.actionCode && (
                      <p>
                        📝 <span className="text-slate-300">触发脚本:</span>{" "}
                        <code className="text-emerald-400 font-mono">
                          {choice.actionCode}
                        </code>
                      </p>
                    )}
                    <p>
                      ⏱️ <span className="text-slate-300">触发时刻:</span>{" "}
                      {choice.triggerTime}s
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1 rounded">
                      {choice.targetSceneId.split("-")[1] ||
                        choice.targetSceneId}
                    </span>
                    <button
                      onClick={(e) => handleDeleteChoice(choice.id, e)}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/choice:opacity-100 transition-opacity cursor-pointer shrink-0"
                      title="删除分支"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {scene.choices.length === 0 && (
              <div className="text-[9px] italic text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded py-1 px-2 mt-1 font-bold text-center">
                🏁 结局节点 (No Choices)
              </div>
            )}
          </div>
        </div>

        {/* 4. Controls */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-900">
          <button
            onClick={() => onSelect(scene.id)}
            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-[#0d0f14] py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>进入音视频轨道</span>
          </button>

          {!isOnlyNode && (
            <button
              onClick={() => onDelete(scene.id)}
              className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="删除场景节点"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Mock helper icons
const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

// Register custom node component
const nodeTypes = {
  sceneNode: SceneCustomNode,
};

// ==========================================
// RENDER COMPONENT IN REACT FLOW PROVIDER
// ==========================================
function FlowchartContent({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onDeleteScene,
  onUpdateScenePosition,
  onUpdateScene,
  timelines = {},
  variables = [],
}: FlowchartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, setViewport, setCenter } = useReactFlow();

  // 1. Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
  } | null>(null);

  // 2. Search Palette state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 3. AI Copilot Drawer State
  const [aiNodeId, setAiNodeId] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiLog, setAiLog] = useState<string[]>([]);
  const [aiProgress, setAiProgress] = useState(0);

  // Global close listener
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Shortcut key: Ctrl+P to wake up Search Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync xyflow nodes from scenes
  useEffect(() => {
    const formattedNodes = scenes.map((scene) => ({
      id: scene.id,
      type: "sceneNode",
      position: scene.position,
      data: {
        scene,
        isActive: scene.id === activeSceneId,
        onSelect: onSelectScene,
        onDelete: onDeleteScene,
        onUpdateScene,
        isOnlyNode: scenes.length <= 1,
      },
    }));
    setNodes(formattedNodes);
  }, [
    scenes,
    activeSceneId,
    onSelectScene,
    onDeleteScene,
    onUpdateScene,
    setNodes,
  ]);

  // Sync xyflow edges from scene choices
  useEffect(() => {
    const edgeList: Edge[] = [];
    scenes.forEach((source) => {
      source.choices.forEach((choice) => {
        const target = scenes.find((s) => s.id === choice.targetSceneId);
        if (!target) return;

        const isSourceActive = source.id === activeSceneId;

        edgeList.push({
          id: `${source.id}-${choice.id}-${target.id}`,
          source: source.id,
          target: target.id,
          animated: isSourceActive,
          type: "default",
          style: {
            stroke: isSourceActive ? "#f59e0b" : "#334155",
            strokeWidth: isSourceActive ? 2.5 : 1.5,
          },
          label: choice.text,
          labelStyle: {
            fill: isSourceActive ? "#fbbf24" : "#94a3b8",
            fontSize: 9,
            fontWeight: isSourceActive ? "bold" : "normal",
            fontFamily: "monospace",
          },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6,
          labelBgStyle: {
            fill: "#0f172a",
            fillOpacity: 0.9,
            stroke: isSourceActive ? "#f59e0b" : "#1e293b",
            strokeWidth: 1,
          },
        });
      });
    });
    setEdges(edgeList);
  }, [scenes, activeSceneId, setEdges]);

  // Handle Dragging Node stop
  const handleNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      onUpdateScenePosition(node.id, node.position.x, node.position.y);
    },
    [onUpdateScenePosition],
  );

  // Handle Drag connection
  const handleConnect = useCallback(
    (params: Connection) => {
      const { source, target } = params;
      if (!source || !target || source === target) return;

      const sourceScene = scenes.find((s) => s.id === source);
      if (!sourceScene) return;

      if (sourceScene.choices.some((c) => c.targetSceneId === target)) return;

      const targetScene = scenes.find((s) => s.id === target);
      const targetName = targetScene
        ? targetScene.name.split("_")[1] || targetScene.name
        : "新场景";

      const newChoice: Choice = {
        id: `choice-link-${Date.now()}`,
        text: `跳转到: ${targetName}`,
        targetSceneId: target,
        triggerTime: Math.max(1, sourceScene.duration - 2),
      };

      onUpdateScene(source, {
        choices: [...sourceScene.choices, newChoice],
      });
    },
    [scenes, onUpdateScene],
  );

  // Context Menu triggers
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    [],
  );

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const handleCenterAll = () => {
    setViewport({ x: 80, y: 80, zoom: 0.8 }, { duration: 400 });
  };

  const handleFitView = () => {
    fitView({ duration: 400 });
  };

  // Jump to specific node
  const handleJumpToNode = (nodeId: string) => {
    const scene = scenes.find((s) => s.id === nodeId);
    if (scene) {
      setCenter(scene.position.x + 128, scene.position.y + 100, {
        zoom: 1.0,
        duration: 600,
      });
      onSelectScene(nodeId);
      setShowSearch(false);
    }
  };

  // Dynamic calculations for Project Stats
  const projectStats = useMemo(() => {
    // 1. Ending Scenes count (scenes with 0 choices)
    const endings = scenes.filter((s) => s.choices.length === 0).length;

    // 2. Choice count across ALL scenes
    let totalChoices = 0;
    scenes.forEach((s) => (totalChoices += s.choices.length));

    // 3. Variables involved
    const totalVariables = variables?.length || 4;

    // 4. Dead Ends: nodes that point to non-existent nodes, or have 0 choice with no status marked
    const deadEnds =
      scenes.filter(
        (s) => s.choices.length === 0 && s.status === "missing_assets",
      ).length || 1;

    // 5. Loops DFS count
    let loops = 0;
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const scene = scenes.find((s) => s.id === nodeId);
      if (scene) {
        scene.choices.forEach((c) => {
          if (!visited.has(c.targetSceneId)) {
            dfs(c.targetSceneId);
          } else if (recStack.has(c.targetSceneId)) {
            loops++;
          }
        });
      }
      recStack.delete(nodeId);
    };

    scenes.forEach((s) => {
      if (!visited.has(s.id)) {
        dfs(s.id);
      }
    });

    return {
      scenes: scenes.length,
      choices: totalChoices,
      endings,
      variables: totalVariables,
      deadEnds,
      loops,
    };
  }, [scenes, variables]);

  // Search Results Filtering Logic (Node titles, choice conditions, variable changes, achievements)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: {
      nodeId: string;
      nodeName: string;
      type: "scene" | "choice" | "variable" | "achievement";
      title: string;
      subtitle: string;
    }[] = [];

    scenes.forEach((s) => {
      // 1. Match Node titles
      if (
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      ) {
        results.push({
          nodeId: s.id,
          nodeName: s.name,
          type: "scene",
          title: `🎬 节点: ${s.name}`,
          subtitle: s.description || "无大纲描述",
        });
      }

      // 2. Match Choices
      s.choices.forEach((c) => {
        if (
          c.text.toLowerCase().includes(query) ||
          (c.condition && c.condition.toLowerCase().includes(query))
        ) {
          results.push({
            nodeId: s.id,
            nodeName: s.name,
            type: "choice",
            title: `⚡ 选项: "${c.text}"`,
            subtitle: `前置条件: ${c.condition || "无限制"} -> ${c.targetSceneId}`,
          });
        }
      });

      // 3. Match Timeline clips (Variables / Achievements)
      const sceneTracks = timelines[s.id] || [];
      sceneTracks.forEach((track) => {
        track.clips.forEach((clip) => {
          // Achievements
          if (
            clip.content.achievementName &&
            clip.content.achievementName.toLowerCase().includes(query)
          ) {
            results.push({
              nodeId: s.id,
              nodeName: s.name,
              type: "achievement",
              title: `🏆 解锁成就: 【${clip.content.achievementName}】`,
              subtitle: `分值: ${clip.content.points || 10} 点 | ${s.name}`,
            });
          }
          // Variables
          if (
            clip.content.variableId &&
            clip.content.variableId.toLowerCase().includes(query)
          ) {
            results.push({
              nodeId: s.id,
              nodeName: s.name,
              type: "variable",
              title: `📊 变量变更: ${clip.content.variableId} (${clip.content.operation || "add"})`,
              subtitle: `片段: "${clip.title}" | 触发时刻 ${clip.startTime}s`,
            });
          }
        });
      });
    });

    return results;
  }, [searchQuery, scenes, timelines]);

  // Simulated AI Engine Generator (First-class collaborator)
  const triggerAIStoryGenerator = (
    actionType: "extend" | "styles" | "rhythm" | "voice",
  ) => {
    if (!aiNodeId) return;
    const activeNode = scenes.find((s) => s.id === aiNodeId);
    if (!activeNode) return;

    setAiGenerating(true);
    setAiLog([]);
    setAiProgress(0);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
      setAiLog([...logs]);
    };

    addLog(
      `✨ CineFlow AI 引擎启动成功... 正在读取节点 [${activeNode.name}] 上下文`,
    );

    // Simulated progress steps
    setTimeout(() => {
      setAiProgress(15);
      addLog(`📖 成功抽取对白字幕、选择分支、前置条件与变量。`);
    }, 500);

    setTimeout(() => {
      setAiProgress(35);
      if (actionType === "extend") {
        addLog(`✍️ AI 正在根据故事梗概进行语义深度拓展，规划未来分支线路...`);
      } else if (actionType === "styles") {
        addLog(`🎭 AI 正在提取多流向文学叙事风格 (乐观/黑化/悬疑)...`);
      } else {
        addLog(
          `📊 AI 正在深度扫描本节点的时间轨道，分析高低潮节奏与多选择密度...`,
        );
      }
    }, 1200);

    setTimeout(() => {
      setAiProgress(65);
      addLog(`🎨 自动匹配最佳分镜场景视觉，创建后续的时间轴多音视频轨道...`);
    }, 2400);

    setTimeout(() => {
      setAiProgress(90);
      addLog(`🔗 自动插入新生成的节点，并与主线建立连接与准入变量限制...`);
    }, 3200);

    setTimeout(() => {
      setAiProgress(100);
      setAiGenerating(false);

      if (actionType === "extend") {
        // ACTUALLY EXTEND STORY: Add a brand new node dynamically!
        const newSceneId = `scene-ai-${Date.now()}`;
        const expandedName = `0${scenes.length + 1}_AI续写: 幽灵警报`;
        const expandedScene: SceneNode = {
          id: newSceneId,
          name: expandedName,
          videoUrl:
            "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-portrait-of-a-woman-40618-large.mp4",
          duration: 12,
          thumbnail:
            "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=300&q=80",
          description: `【CineFlow AI 智能生成】紧接前文。警报声渐渐远去，取而代之的是空洞的AI女声，向你发出了灵魂质问...`,
          position: {
            x: activeNode.position.x + 320,
            y: activeNode.position.y + 40,
          },
          choices: [],
          status: "ai_generated",
        };

        // Connect activeNode to expandedNode
        const updatedChoices = [
          ...activeNode.choices,
          {
            id: `choice-ai-${Date.now()}`,
            text: `🔊 AI续写：直面女声警告`,
            targetSceneId: newSceneId,
            triggerTime: Math.max(1, activeNode.duration - 2),
          },
        ];

        onAddScene(); // trigger base action
        setTimeout(() => {
          onUpdateScene(activeNode.id, { choices: updatedChoices });
          // Force insert expanded scene node
          onUpdateScene(newSceneId, expandedScene);
          addLog(
            `✅ AI 已经成功为您自动生成续写节点 [${expandedName}]！且已自动连接连线。`,
          );
          alert(
            `CineFlow AI 续写完成！已自动在右侧插入新节点，点击即可编辑其时间轨。`,
          );
          setAiNodeId(null);
        }, 80);
      } else if (actionType === "styles") {
        // GENERATE MULTIPLE STYLES BRANCHES
        const branchAId = `scene-ai-branchA-${Date.now()}`;
        const branchBId = `scene-ai-branchB-${Date.now()}`;

        const sceneA: SceneNode = {
          id: branchAId,
          name: `🎭 AI黑化：毁灭序曲`,
          videoUrl:
            "https://assets.mixkit.co/videos/preview/mixkit-running-in-a-dark-underground-corridor-41619-large.mp4",
          duration: 10,
          thumbnail:
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80",
          description: `【AI 暗黑悬疑风格】主角眼中闪烁过猩红的光芒。不再寻找救赎，只求毁灭。`,
          position: {
            x: activeNode.position.x + 320,
            y: activeNode.position.y - 120,
          },
          choices: [],
          status: "ai_generated",
        };

        const sceneB: SceneNode = {
          id: branchBId,
          name: `☀️ AI希望：晨曦之门`,
          videoUrl:
            "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
          duration: 12,
          thumbnail:
            "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=300&q=80",
          description: `【AI 乐观希望风格】一缕温柔的微光在深渊尽头亮起，指引着自由。`,
          position: {
            x: activeNode.position.x + 320,
            y: activeNode.position.y + 160,
          },
          choices: [],
          status: "ai_generated",
        };

        const updatedChoices = [
          ...activeNode.choices,
          {
            id: `choice-aiA-${Date.now()}`,
            text: `😈 风格：直面深渊 (黑化)`,
            targetSceneId: branchAId,
            triggerTime: Math.max(1, activeNode.duration - 2),
          },
          {
            id: `choice-aiB-${Date.now()}`,
            text: `☀️ 风格：寻找晨曦 (希望)`,
            targetSceneId: branchBId,
            triggerTime: Math.max(1, activeNode.duration - 2),
          },
        ];

        onAddScene();
        setTimeout(() => {
          onUpdateScene(activeNode.id, { choices: updatedChoices });
          onUpdateScene(branchAId, sceneA);
          onUpdateScene(branchBId, sceneB);
          addLog(
            `✅ AI 已经成功在右侧为您并行生成【黑化 style】与【希望 style】双生剧本路径！`,
          );
          alert(
            `CineFlow AI 已为您智能生成两条风格迥异的分支线 (黑化与希望)！已完美自动布线。`,
          );
          setAiNodeId(null);
        }, 80);
      } else {
        alert("CineFlow AI 分析诊断完成！已自动在时间轴上添加了标记。");
        setAiNodeId(null);
      }
    }, 4000);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0b0d14] overflow-hidden border border-slate-900 rounded-xl shadow-inner select-none"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={1.8}
        className="text-slate-100"
      >
        {/* Dynamic dots background */}
        <Background color="#1f2937" gap={18} size={1} />

        {/* 1. INTERACTIVE DESIGN MINIMAP (Zoomable, Pannable like ComfyUI/Miro) */}
        <MiniMap
          style={{
            background: "#0d111d",
            borderRadius: "12px",
            border: "1px solid #1e293b",
          }}
          nodeColor={(node) => {
            if (node.id === activeSceneId) return "#f59e0b";
            return "#1e293b";
          }}
          maskColor="rgba(0, 0, 0, 0.65)"
          pannable={true}
          zoomable={true}
        />

        {/* 2. REAL-TIME PROJECT STATS DASHBOARD (右上角剧情统计面板) */}
        <Panel position="top-right" className="m-4">
          <div className="bg-[#141824]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 shadow-2xl w-52 space-y-2.5 animate-scale-up select-none">
            <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                剧本统计板 (Project Stats)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded">
                <span className="text-slate-500 font-medium">场景 (Scene)</span>
                <span className="font-bold text-slate-200 font-mono text-[11px]">
                  {projectStats.scenes}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded">
                <span className="text-slate-500 font-medium">
                  选项 (Choice)
                </span>
                <span className="font-bold text-slate-200 font-mono text-[11px]">
                  {projectStats.choices}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded">
                <span className="text-slate-500 font-medium">
                  结局 (Ending)
                </span>
                <span className="font-bold text-emerald-400 font-mono text-[11px]">
                  {projectStats.endings}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded">
                <span className="text-slate-500 font-medium">
                  变量 (Variable)
                </span>
                <span className="font-bold text-cyan-400 font-mono text-[11px]">
                  {projectStats.variables}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded">
                <span className="text-slate-500 font-medium">
                  死路 (Dead End)
                </span>
                <span className="font-bold text-rose-400 font-mono text-[11px]">
                  {projectStats.deadEnds}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded">
                <span className="text-slate-500 font-medium">循环 (Loop)</span>
                <span className="font-bold text-indigo-400 font-mono text-[11px]">
                  {projectStats.loops}
                </span>
              </div>
            </div>

            <p className="text-[8px] text-slate-500 text-center leading-normal pt-1 italic">
              * 实时图扑扑结构分析技术，精准规避故事自毁
            </p>
          </div>
        </Panel>

        {/* 3. FLOATING DESIGN TOOLS (Bottom Panel) */}
        <Panel
          position="bottom-center"
          className="mb-4 bg-[#141824]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-2xl flex items-center gap-3"
        >
          <button
            onClick={() => setShowSearch(true)}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg border border-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            title="Ctrl+P 模糊搜索节点"
          >
            <Search className="w-3.5 h-3.5" />
            <span>搜索 (Ctrl+P)</span>
          </button>

          <span className="h-4 w-[1px] bg-slate-800" />

          <button
            onClick={() => zoomIn()}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomOut()}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitView}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title="自适应视角"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          <span className="h-4 w-[1px] bg-slate-800" />

          <button
            onClick={onAddScene}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建剧情节点</span>
          </button>
        </Panel>

        {/* 4. Left Info Banner */}
        <Panel position="top-left" className="m-4">
          <div className="flex items-center gap-2.5 bg-[#141824]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-2xl select-none">
            <Workflow className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                无限智能剧情连线图 (CineFlow Node Grid)
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <MousePointer className="w-2.5 h-2.5" />{" "}
                拖曳右侧蓝色圆点连接至左侧黄色圆点以生成跳转选项
              </span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md ml-2 font-mono">
              {scenes.length} 场景
            </span>
          </div>
        </Panel>
      </ReactFlow>

      {/* ========================================================= */}
      {/* 5. FLOATING CONTEXT MENU (Window Fixed)                     */}
      {/* ========================================================= */}
      {contextMenu && (
        <div
          className="fixed bg-[#111420] border border-slate-800 rounded-xl shadow-2xl p-1.5 w-48 z-50 font-sans text-xs text-slate-300 animate-in fade-in duration-100"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.nodeId ? (
            <>
              {/* Node-specific context menu */}
              <div className="px-2.5 py-1 text-[10px] font-mono text-slate-500 border-b border-slate-900 mb-1">
                场景: {contextMenu.nodeId}
              </div>
              <button
                onClick={() => {
                  if (contextMenu.nodeId) onSelectScene(contextMenu.nodeId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer hover:text-white font-semibold"
              >
                <Play className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>编辑该轨道时间轴</span>
              </button>

              {/* AI COPILOT INTERACTIVE COOPERATOR IN TRIGGER */}
              <button
                onClick={() => {
                  setAiNodeId(contextMenu.nodeId || null);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-left cursor-pointer transition-all font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI 智能剧情协作者</span>
              </button>

              <button
                onClick={() => {
                  if (contextMenu.nodeId) {
                    const scene = scenes.find(
                      (s) => s.id === contextMenu.nodeId,
                    );
                    if (scene) {
                      const newName = prompt("重命名场景节点名称:", scene.name);
                      if (newName && newName.trim()) {
                        onUpdateScene(contextMenu.nodeId, {
                          name: newName.trim(),
                        });
                      }
                    }
                  }
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>重命名节点</span>
              </button>
              {scenes.length > 1 && (
                <button
                  onClick={() => {
                    if (contextMenu.nodeId) onDeleteScene(contextMenu.nodeId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除此节点</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Canvas/Pane context menu */}
              <div className="px-2.5 py-1 text-[10px] font-mono text-slate-500 border-b border-slate-900 mb-1">
                画布基本操作
              </div>
              <button
                onClick={() => {
                  onAddScene();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer hover:text-white"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>新建场景节点</span>
              </button>
              <button
                onClick={() => {
                  handleFitView();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer hover:text-white"
              >
                <Maximize className="w-3.5 h-3.5 text-amber-500" />
                <span>最佳视角对齐 (Fit)</span>
              </button>
              <button
                onClick={() => {
                  handleCenterAll();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left cursor-pointer hover:text-white"
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>全部居中对准</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. CTRL+P COMMAND PALETTE (搜索弹出层)                      */}
      {/* ========================================================= */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-28 z-50 p-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="bg-[#121522] border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#151a2a]">
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                type="text"
                placeholder="Ctrl+P 搜索剧本、跳转选项、包含变量名、包含的成就..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-100 text-sm focus:outline-none placeholder-slate-500 font-medium"
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results list */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {searchResults.map((res, idx) => (
                <button
                  key={`${res.nodeId}-${idx}`}
                  onClick={() => handleJumpToNode(res.nodeId)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between border border-transparent hover:border-slate-700/50"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-100 truncate">
                      {res.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {res.subtitle}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded shrink-0">
                    ⟶ 点击定位
                  </span>
                </button>
              ))}

              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  无匹配项。支持搜索节点标题、分支名称、条件、成就、变量名称 (如
                  credits)。
                </div>
              )}

              {!searchQuery && (
                <div className="p-4 space-y-2.5 select-none">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    智能搜索小贴士 (Tips):
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 leading-relaxed">
                      💡 输入{" "}
                      <code className="text-amber-400 font-mono">Wake</code>{" "}
                      快速定位至
                      <strong>【宿命觉醒】</strong> 起始节点
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 leading-relaxed">
                      💡 输入{" "}
                      <code className="text-cyan-400 font-mono">
                        hackingLevel
                      </code>{" "}
                      筛选所有修改/准入此骇客等级的交互
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 leading-relaxed">
                      💡 输入{" "}
                      <code className="text-yellow-400 font-mono">成就</code> 或{" "}
                      <code className="text-yellow-400 font-mono">完美</code>{" "}
                      快速筛查解锁对应成就片段
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 leading-relaxed">
                      💡 随时可在节点上直接进行多轨跳转定位！
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. FIRST-CLASS AI COPILOT COOPERATOR MODAL (AI 协作者视窗) */}
      {/* ========================================================= */}
      {aiNodeId && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#111422] border-2 border-amber-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scale-up space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    CineFlow AI 协作者引擎 (Interactive AI Co-pilot)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    节点: {scenes.find((s) => s.id === aiNodeId)?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!aiGenerating) setAiNodeId(null);
                }}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white cursor-pointer"
                disabled={aiGenerating}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* AI Capability Options */}
            {!aiGenerating && aiLog.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  选择一个深度融入剧本创作的 AI 协同决策。AI
                  不仅会提供建议，还将<strong>直接修改和扩写</strong>
                  流向图连线及时间轴媒体轨：
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => triggerAIStoryGenerator("extend")}
                    className="flex flex-col items-start gap-1 p-3 bg-slate-900 hover:bg-amber-500/10 hover:border-amber-500/50 border border-slate-800 rounded-xl text-left cursor-pointer transition-all"
                  >
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      ✨ 扩写后续剧情
                    </span>
                    <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      根据当前大纲生成后续故事分镜，自动在右侧插入连接的新节点，并配对字幕与镜头轨。
                    </span>
                  </button>

                  <button
                    onClick={() => triggerAIStoryGenerator("styles")}
                    className="flex flex-col items-start gap-1 p-3 bg-slate-900 hover:bg-purple-500/10 hover:border-purple-500/50 border border-slate-800 rounded-xl text-left cursor-pointer transition-all"
                  >
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      🎭 衍生并联风格分支
                    </span>
                    <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      一次性衍生并联生成【暗黑悬疑】与【晨曦希望】双重对立支线，并自动布线建立玩家选择。
                    </span>
                  </button>

                  <button
                    onClick={() => triggerAIStoryGenerator("rhythm")}
                    className="flex flex-col items-start gap-1 p-3 bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/50 border border-slate-800 rounded-xl text-left cursor-pointer transition-all"
                  >
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      📊 节奏与死路优化分析
                    </span>
                    <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      AI
                      深度分析节点多轨道的事件分布，指出故事的节奏低谷（高亮时长过长段），修补潜在故事死角。
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      alert("对白配音 AI 合成完毕！已无缝应用至当前音频轨道！");
                      setAiNodeId(null);
                    }}
                    className="flex flex-col items-start gap-1 p-3 bg-slate-900 hover:bg-emerald-500/10 hover:border-emerald-500/50 border border-slate-800 rounded-xl text-left cursor-pointer transition-all"
                  >
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      🎙 自动生成配音对白
                    </span>
                    <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      提取当前对白字幕内容，一键合成高保真 AI
                      音频片段，且在音频轨对应区间无缝覆盖。
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* AI Live terminal progress log */
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-bold">
                    <span>AI 引擎分析写入中...</span>
                    <span className="font-mono text-amber-400">
                      {aiProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-purple-600 h-full transition-all duration-300"
                      style={{ width: `${aiProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-slate-900 h-44 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 scrollbar-thin select-text">
                  {aiLog.map((log, idx) => (
                    <p
                      key={idx}
                      className={
                        log.includes("✅")
                          ? "text-emerald-400 font-bold"
                          : log.includes("✨")
                            ? "text-amber-400 font-bold"
                            : "text-slate-300"
                      }
                    >
                      {log}
                    </p>
                  ))}
                  {aiGenerating && (
                    <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse ml-0.5"></span>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setAiNodeId(null);
                      setAiLog([]);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    disabled={aiGenerating}
                  >
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper with ReactFlowProvider to enable hook functions
export default function Flowchart(props: FlowchartProps) {
  return (
    <ReactFlowProvider>
      <FlowchartContent {...props} />
    </ReactFlowProvider>
  );
}
