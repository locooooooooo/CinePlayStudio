import React, { useState, useRef, useEffect } from "react";
import { MediaAsset, EditorPlugin, ProjectVariable } from "../types";
import {
  Play,
  Plus,
  Trash2,
  FolderPlus,
  ToggleLeft,
  ToggleRight,
  Code,
  PlayCircle,
  Eye,
  Check,
  AlertTriangle,
  Layers,
  Database,
  Folder,
  FolderOpen,
  Tag,
  ChevronRight,
  ChevronDown,
  Search,
  MoreVertical,
  Copy,
  Edit,
  X,
  Download,
  Info,
  Sparkles,
  Move,
  FileText,
  Music,
  Film,
  Image as ImageIcon,
  HelpCircle,
  Archive,
  CheckSquare,
  Square,
  Repeat,
  RefreshCw,
  LayoutGrid,
  List,
  Columns,
  Maximize2,
} from "lucide-react";

interface AssetManagerProps {
  assets: MediaAsset[];
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (id: string) => void;
  onUpdateAsset: (asset: MediaAsset) => void;
  plugins: EditorPlugin[];
  onUpdatePlugin: (plugin: EditorPlugin) => void;
  onAddPlugin: (plugin: EditorPlugin) => void;
  variables: ProjectVariable[];
  onAddVariable: (variable: ProjectVariable) => void;
  onDeleteVariable: (id: string) => void;
  onUpdateVariableValue: (id: string, value: any) => void;
}

export default function AssetManager({
  assets,
  onAddAsset,
  onDeleteAsset,
  onUpdateAsset,
  plugins,
  onUpdatePlugin,
  onAddPlugin,
  variables,
  onAddVariable,
  onDeleteVariable,
  onUpdateVariableValue,
}: AssetManagerProps) {
  // Tabs: assets | plugins | variables
  const [activeTab, setActiveTab] = useState<
    "assets" | "plugins" | "variables"
  >("assets");
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(
    plugins[0]?.id || null,
  );
  const [pluginCode, setPluginCode] = useState<string>(plugins[0]?.code || "");
  const [pluginConsoleLogs, setPluginConsoleLogs] = useState<string[]>([
    "[System] 插件引擎初始化成功。",
    "[System] QTE动作插件在特定帧启动。",
    "[File System] 商业级文件管理服务已就绪。支持右键操作，多文件拖入，批量管理和标签分类。",
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // New variable states
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState<"boolean" | "number" | "string">(
    "number",
  );
  const [newVarVal, setNewVarVal] = useState<string>("0");

  const selectedPlugin = plugins.find((p) => p.id === selectedPluginId);

  // -------------------------------------------------------------
  // ADVANCED FILE SYSTEM STATE (PERSISTED IN LOCAL STORAGE)
  // -------------------------------------------------------------
  const [folders, setFolders] = useState<{ id: string; name: string }[]>(() => {
    const saved = localStorage.getItem("cineflow_folders");
    if (saved) return JSON.parse(saved);
    return [
      { id: "f-1", name: "🎥 场景主视轨" },
      { id: "f-2", name: "🎵 背景环境音" },
      { id: "f-3", name: "💾 机密大纲文档" },
      { id: "f-4", name: "⚡ HUD插件脚本" },
    ];
  });

  const [customTags, setCustomTags] = useState<
    { name: string; color: string }[]
  >(() => {
    const saved = localStorage.getItem("cineflow_tags");
    if (saved) return JSON.parse(saved);
    return [
      {
        name: "核心剧情",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      },
      {
        name: "警报特效",
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      },
      {
        name: "HUD变量",
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      },
      {
        name: "机密文档",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
    ];
  });

  // UI Interactive States
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all"); // 'all', 'video', 'audio', 'document', 'image', or 'f-xxx'
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "folder">("none");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [dragEnterCount, setDragEnterCount] = useState(0);

  // View modes and zoom size settings (满足用户: 当前文件需要支持不同视图，缩小，预览，大图等等排布方式)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "split">("grid");
  const [zoomSize, setZoomSize] = useState<"sm" | "md" | "lg">("md"); // sm: 缩小, md: 中等, lg: 大图
  const [activePreviewAssetId, setActivePreviewAssetId] = useState<
    string | null
  >(null);
  const [sidebarRenameValue, setSidebarRenameValue] = useState<string>("");

  // Suppress standard ResizeObserver loop warnings in iframe preview
  useEffect(() => {
    const handleResizeError = (e: ErrorEvent) => {
      if (
        e.message &&
        (e.message.includes("ResizeObserver loop completed") ||
          e.message.includes("ResizeObserver loop limit exceeded"))
      ) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("error", handleResizeError);
    return () => window.removeEventListener("error", handleResizeError);
  }, []);

  // Context Menu and Modals State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    assetId: string;
  } | null>(null);
  const [activeModal, setActiveModal] = useState<{
    type: "rename" | "details" | "preview" | "create-folder" | "create-tag";
    assetId?: string;
    folderId?: string;
  } | null>(null);

  // Inputs for Modals
  const [modalInputName, setModalInputName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("cineflow_folders", JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem("cineflow_tags", JSON.stringify(customTags));
  }, [customTags]);

  // Global listener to close context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // On-the-fly metadata enricher to ensure all assets have tags and folder IDs
  const getEnrichedAssets = (): MediaAsset[] => {
    return assets.map((asset) => {
      const enriched = { ...asset };
      if (!enriched.tags) {
        if (asset.id === "a-vid-1") enriched.tags = ["核心剧情"];
        else if (asset.id === "a-vid-2")
          enriched.tags = ["核心剧情", "HUD变量"];
        else if (asset.id === "a-vid-3") enriched.tags = ["核心剧情"];
        else if (asset.id === "a-vid-4") enriched.tags = ["核心剧情"];
        else if (asset.id === "a-aud-1") enriched.tags = ["环境音效"];
        else if (asset.id === "a-aud-2") enriched.tags = ["警报特效"];
        else if (asset.id === "a-aud-3") enriched.tags = ["环境音效"];
        else enriched.tags = [];
      }
      if (!enriched.folderId) {
        if (asset.type === "video") enriched.folderId = "f-1";
        else if (asset.type === "audio") enriched.folderId = "f-2";
        else if (asset.type === "image") enriched.folderId = "f-4";
        else enriched.folderId = "f-3";
      }
      return enriched;
    });
  };

  const enrichedAssets = getEnrichedAssets();

  // -------------------------------------------------------------
  // DRAG AND DROP FILE IMPORT LOGIC
  // -------------------------------------------------------------
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragEnterCount((prev) => prev + 1);
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragEnterCount((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setIsDraggingOver(false);
        return 0;
      }
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDragEnterCount(0);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUploadMock(e.dataTransfer.files);
    }
  };

  const handleFileUploadMock = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const name = file.name;
      const extension = name.split(".").pop()?.toLowerCase() || "";

      let type: "video" | "audio" | "image" | "document" = "document";
      if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
        type = "video";
      } else if (["mp3", "wav", "aac", "ogg", "flac"].includes(extension)) {
        type = "audio";
      } else if (
        ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(extension)
      ) {
        type = "image";
      }

      const isVideo = type === "video";
      const isAudio = type === "audio";
      const isImage = type === "image";
      const isDoc = type === "document";

      let thumbnail =
        "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&q=80";
      if (isVideo) {
        thumbnail =
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&q=80";
      } else if (isAudio) {
        thumbnail =
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80";
      } else if (isImage) {
        thumbnail =
          "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80";
      }

      // Resolve proper target folder based on current selection or default
      let targetFolderId = "f-1";
      if (
        selectedFolderId &&
        !["all", "video", "audio", "document", "image"].includes(
          selectedFolderId,
        )
      ) {
        targetFolderId = selectedFolderId;
      } else {
        if (isVideo) targetFolderId = "f-1";
        else if (isAudio) targetFolderId = "f-2";
        else if (isDoc) targetFolderId = "f-3";
        else targetFolderId = "f-4";
      }

      const newAsset: MediaAsset = {
        id: `a-uploaded-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        type,
        url: isVideo
          ? "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4"
          : isAudio
            ? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            : isImage
              ? "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80"
              : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        duration: isVideo ? 15 : isAudio ? 45 : 0,
        thumbnail,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        category: "User Import",
        tags: [],
        folderId: targetFolderId,
      };

      onAddAsset(newAsset);
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[File System] 成功导入媒体资产: "${file.name}" (类型: ${type.toUpperCase()}, 大小: ${newAsset.size})`,
      ]);
    });
  };

  // -------------------------------------------------------------
  // FILTERING AND SORTING
  // -------------------------------------------------------------
  const filteredAssets = enrichedAssets.filter((asset) => {
    // 1. Sidebar filter
    if (selectedFolderId !== "all") {
      if (["video", "audio", "document", "image"].includes(selectedFolderId)) {
        if (asset.type !== selectedFolderId) return false;
      } else {
        // specific folder
        if (asset.folderId !== selectedFolderId) return false;
      }
    }
    // 2. Tag filter
    if (selectedTag) {
      if (!asset.tags || !asset.tags.includes(selectedTag)) return false;
    }
    // 3. Search query
    if (searchQuery.trim()) {
      if (!asset.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
    }
    return true;
  });

  // Find active preview asset for split view or detail cards (Declared after filteredAssets to ensure valid scope)
  const activePreviewAsset =
    enrichedAssets.find((a) => a.id === activePreviewAssetId) ||
    filteredAssets[0];

  // Sync rename input value in live sidebar panel
  useEffect(() => {
    if (activePreviewAsset) {
      setSidebarRenameValue(activePreviewAsset.name);
    } else {
      setSidebarRenameValue("");
    }
  }, [activePreviewAsset?.id]);

  const handleSidebarRenameSave = () => {
    if (
      activePreviewAsset &&
      sidebarRenameValue.trim() &&
      sidebarRenameValue !== activePreviewAsset.name
    ) {
      onUpdateAsset({ ...activePreviewAsset, name: sidebarRenameValue.trim() });
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[Quick Edit] 实时重命名成功: "${activePreviewAsset.name}" -> "${sidebarRenameValue.trim()}"`,
      ]);
    }
  };

  const handleSidebarToggleTag = (tag: string) => {
    if (activePreviewAsset) {
      let currentTags = activePreviewAsset.tags
        ? [...activePreviewAsset.tags]
        : [];
      if (currentTags.includes(tag)) {
        currentTags = currentTags.filter((t) => t !== tag);
      } else {
        currentTags.push(tag);
      }
      onUpdateAsset({ ...activePreviewAsset, tags: currentTags });
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[Quick Edit] 变更了 "${activePreviewAsset.name}" 的标签: [${tag}]`,
      ]);
    }
  };

  // -------------------------------------------------------------
  // CONTEXT MENU ACTIONS
  // -------------------------------------------------------------
  const handleContextMenu = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      assetId,
    });
  };

  const handleOpenRenameModal = (assetId: string) => {
    const asset = enrichedAssets.find((a) => a.id === assetId);
    if (asset) {
      setModalInputName(asset.name);
      setActiveModal({ type: "rename", assetId });
    }
  };

  const handleRenameAsset = () => {
    if (!activeModal?.assetId || !modalInputName.trim()) return;
    const asset = enrichedAssets.find((a) => a.id === activeModal.assetId);
    if (asset) {
      const updated = { ...asset, name: modalInputName.trim() };
      onUpdateAsset(updated);
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[File System] 成功将资产重命名为: "${updated.name}"`,
      ]);
    }
    setActiveModal(null);
  };

  const handleToggleTagOnAsset = (assetId: string, tagName: string) => {
    const asset = enrichedAssets.find((a) => a.id === assetId);
    if (asset) {
      let currentTags = asset.tags ? [...asset.tags] : [];
      if (currentTags.includes(tagName)) {
        currentTags = currentTags.filter((t) => t !== tagName);
      } else {
        currentTags.push(tagName);
      }
      onUpdateAsset({ ...asset, tags: currentTags });
    }
  };

  const handleMoveToFolder = (assetId: string, folderId: string) => {
    const asset = enrichedAssets.find((a) => a.id === assetId);
    if (asset) {
      onUpdateAsset({ ...asset, folderId });
      const f = folders.find((fol) => fol.id === folderId);
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[File System] 已移动资产 "${asset.name}" 到目录 [${f ? f.name : "根目录"}]`,
      ]);
    }
  };

  const handleCopyAssetUrl = (assetId: string) => {
    const asset = enrichedAssets.find((a) => a.id === assetId);
    if (asset) {
      navigator.clipboard.writeText(asset.url);
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[File System] 复制链接成功: ${asset.url}`,
      ]);
      alert(`已复制 [${asset.name}] 资源网络链接！`);
    }
  };

  // -------------------------------------------------------------
  // BATCH OPERATIONS
  // -------------------------------------------------------------
  const handleSelectAssetToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAssetIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBatchDelete = () => {
    if (selectedAssetIds.length === 0) return;
    if (
      window.confirm(
        `确认批量删除已选中的 ${selectedAssetIds.length} 个资产文件吗？`,
      )
    ) {
      selectedAssetIds.forEach((id) => onDeleteAsset(id));
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[File System] 批量删除了 ${selectedAssetIds.length} 个媒体资产`,
      ]);
      setSelectedAssetIds([]);
    }
  };

  const handleBatchMove = (folderId: string) => {
    if (selectedAssetIds.length === 0) return;
    selectedAssetIds.forEach((id) => {
      const asset = enrichedAssets.find((a) => a.id === id);
      if (asset) {
        onUpdateAsset({ ...asset, folderId });
      }
    });
    const f = folders.find((fol) => fol.id === folderId);
    setPluginConsoleLogs((prev) => [
      ...prev,
      `[File System] 批量移动了 ${selectedAssetIds.length} 个资产到目录 [${f ? f.name : "未知"}]`,
    ]);
    setSelectedAssetIds([]);
  };

  const handleBatchAddTag = (tagName: string) => {
    if (selectedAssetIds.length === 0) return;
    selectedAssetIds.forEach((id) => {
      const asset = enrichedAssets.find((a) => a.id === id);
      if (asset) {
        let currentTags = asset.tags ? [...asset.tags] : [];
        if (!currentTags.includes(tagName)) {
          currentTags.push(tagName);
          onUpdateAsset({ ...asset, tags: currentTags });
        }
      }
    });
    setPluginConsoleLogs((prev) => [
      ...prev,
      `[File System] 批量为 ${selectedAssetIds.length} 个文件标记了 [${tagName}]`,
    ]);
    setSelectedAssetIds([]);
  };

  const handleBatchRename = () => {
    if (selectedAssetIds.length === 0) return;
    const prefix = window.prompt(
      "请输入批量重命名文件前缀 (例如: cyber_):",
      "cyber_",
    );
    if (prefix === null) return;
    selectedAssetIds.forEach((id, idx) => {
      const asset = enrichedAssets.find((a) => a.id === id);
      if (asset) {
        onUpdateAsset({ ...asset, name: `${prefix}${asset.name}` });
      }
    });
    setPluginConsoleLogs((prev) => [
      ...prev,
      `[File System] 批量重命名了 ${selectedAssetIds.length} 个文件`,
    ]);
    setSelectedAssetIds([]);
  };

  // -------------------------------------------------------------
  // FOLDER & TAGS DEFINITION MANAGEMENT
  // -------------------------------------------------------------
  const handleCreateFolderSubmit = () => {
    if (!modalInputName.trim()) return;
    const newId = `f-custom-${Date.now()}`;
    const newFolder = { id: newId, name: `📁 ${modalInputName.trim()}` };
    setFolders((prev) => [...prev, newFolder]);
    setPluginConsoleLogs((prev) => [
      ...prev,
      `[File System] 新建自定义目录: "${newFolder.name}"`,
    ]);
    setModalInputName("");
    setActiveModal(null);
  };

  const handleCreateTagSubmit = () => {
    if (!newTagName.trim()) return;
    const tagExists = customTags.some(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase(),
    );
    if (tagExists) {
      alert("该标签已被注册！");
      return;
    }
    const newTag = { name: newTagName.trim(), color: newTagColor };
    setCustomTags((prev) => [...prev, newTag]);
    setPluginConsoleLogs((prev) => [
      ...prev,
      `[File System] 成功注册全局标签: [${newTag.name}]`,
    ]);
    setNewTagName("");
    setActiveModal(null);
  };

  const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm("确定要删除此文件夹吗？其中的文件会被移动到根目录下。")
    ) {
      // Unlink assets in folder
      enrichedAssets.forEach((asset) => {
        if (asset.folderId === folderId) {
          onUpdateAsset({ ...asset, folderId: "f-1" }); // fallback
        }
      });
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId("all");
      }
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[File System] 删除了文件夹 ID: ${folderId}`,
      ]);
    }
  };

  // Compile / Save modified plugin code
  const handleSavePluginCode = () => {
    if (!selectedPlugin) return;
    try {
      new Function(pluginCode);
      const updatedPlugin: EditorPlugin = {
        ...selectedPlugin,
        code: pluginCode,
      };
      onUpdatePlugin(updatedPlugin);
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[Plugin compiler] ✓ 插件 "${selectedPlugin.name}" 代码热重载成功！语法验证通过。`,
      ]);
    } catch (err: any) {
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[Plugin compiler] ✗ 插件编译失败: ${err.message}`,
      ]);
    }
  };

  const selectPluginForEdit = (id: string) => {
    setSelectedPluginId(id);
    const p = plugins.find((plug) => plug.id === id);
    if (p) {
      setPluginCode(p.code);
    }
  };

  const handleTogglePlugin = (id: string) => {
    const plug = plugins.find((p) => p.id === id);
    if (plug) {
      const updated = { ...plug, isActive: !plug.isActive };
      onUpdatePlugin(updated);
      setPluginConsoleLogs((prev) => [
        ...prev,
        `[PluginManager] 插件 "${plug.name}" 已被${updated.isActive ? "「启用」" : "「禁用」"}`,
      ]);
    }
  };

  const handleCreateNewPlugin = () => {
    const newId = `p-custom-${Date.now()}`;
    const newPlugin: EditorPlugin = {
      id: newId,
      name: `自定义特效插件_${plugins.length + 1}`,
      description:
        "由交互设计者自定义开发的着色器、HUD扩展或者剧本逻辑分析钩子。",
      version: "1.0.0",
      author: "LocalDeveloper",
      isActive: true,
      type: "overlay",
      iconName: "Code",
      code: `// Custom Plugin Sandbox Template
function onRender(variables) {
  console.log("Current state evaluated in sandbox:", variables);
  return {
    customElement: "div",
    cssClass: "border-2 border-amber-500 animate-pulse bg-slate-950/20"
  };
}`,
    };
    onAddPlugin(newPlugin);
    selectPluginForEdit(newId);
    setPluginConsoleLogs((prev) => [
      ...prev,
      `[PluginManager] 成功加载空插件模板: "${newPlugin.name}"`,
    ]);
  };

  const handleAddVarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim()) return;
    if (
      variables.some(
        (v) => v.name.toLowerCase() === newVarName.trim().toLowerCase(),
      )
    ) {
      alert("已存在同名全局变量！");
      return;
    }
    let parsedValue: any = newVarVal;
    if (newVarType === "boolean") {
      parsedValue = newVarVal === "true";
    } else if (newVarType === "number") {
      parsedValue = parseFloat(newVarVal) || 0;
    }

    const newVar: ProjectVariable = {
      id: `v-custom-${Date.now()}`,
      name: newVarName.trim(),
      type: newVarType,
      value: parsedValue,
    };
    onAddVariable(newVar);
    setNewVarName("");
    setNewVarVal("0");
  };

  // Helper file icons mapper
  const getFileIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Film className="w-4 h-4 text-sky-400" />;
      case "audio":
        return <Music className="w-4 h-4 text-emerald-400" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-pink-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-400" />;
    }
  };

  const getLargeFileIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Film className="w-7 h-7 text-sky-400" />;
      case "audio":
        return <Music className="w-7 h-7 text-emerald-400" />;
      case "image":
        return <ImageIcon className="w-7 h-7 text-pink-400" />;
      default:
        return <FileText className="w-7 h-7 text-amber-400" />;
    }
  };

  // Grid columns class based on zoom size
  const getGridColsClass = (zoom: "sm" | "md" | "lg") => {
    if (zoom === "sm")
      return "grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2";
    if (zoom === "lg")
      return "grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-4";
    return "grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3";
  };

  // Render file in Grid mode
  const renderGridItem = (asset: MediaAsset, zoom: "sm" | "md" | "lg") => {
    const isSelected = selectedAssetIds.includes(asset.id);
    const isActive =
      activePreviewAssetId === asset.id ||
      (!activePreviewAssetId && filteredAssets[0]?.id === asset.id);

    if (zoom === "sm") {
      return (
        <div
          key={asset.id}
          id={`asset-card-${asset.id}`}
          onContextMenu={(e) => handleContextMenu(e, asset.id)}
          onDoubleClick={() =>
            setActiveModal({ type: "preview", assetId: asset.id })
          }
          onClick={() => setActivePreviewAssetId(asset.id)}
          className={`bg-[#121623]/80 border rounded-lg px-2 py-1.5 flex items-center gap-2 hover:border-slate-700 transition-all group relative cursor-pointer text-left h-9 overflow-hidden ${
            isSelected
              ? "border-amber-500 bg-[#21211e]/80 shadow-[0_0_8px_rgba(245,158,11,0.08)]"
              : isActive
                ? "border-blue-500/80 bg-[#161d30]"
                : "border-slate-800/80 hover:bg-[#181d2d]"
          }`}
        >
          {/* Checkbox selector inside flat list */}
          <div
            onClick={(e) => handleSelectAssetToggle(asset.id, e)}
            className={`cursor-pointer shrink-0 transition-all ${
              isSelected ? "block" : "hidden group-hover:block"
            }`}
          >
            {isSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            )}
          </div>

          {/* Tiny File Icon */}
          <div className="shrink-0 flex items-center justify-center">
            {getFileIcon(asset.type)}
          </div>

          {/* Name & Size info */}
          <div className="min-w-0 flex-1 leading-none">
            <p
              className="text-[9.5px] font-semibold text-slate-200 truncate"
              title={asset.name}
            >
              {asset.name}
            </p>
            <span className="text-[7.5px] font-mono text-slate-500 block leading-none mt-0.5">
              {asset.size}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, asset.id);
            }}
            className="p-0.5 text-slate-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      );
    }

    if (zoom === "md") {
      return (
        <div
          key={asset.id}
          id={`asset-card-${asset.id}`}
          onContextMenu={(e) => handleContextMenu(e, asset.id)}
          onDoubleClick={() =>
            setActiveModal({ type: "preview", assetId: asset.id })
          }
          onClick={() => setActivePreviewAssetId(asset.id)}
          className={`bg-[#131724]/90 border rounded-lg overflow-hidden flex flex-col hover:border-slate-600 transition-all group relative cursor-pointer aspect-[1/1.08] ${
            isSelected
              ? "border-amber-500 bg-[#21211e]/80 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
              : isActive
                ? "border-blue-500 bg-[#161d30]"
                : "border-slate-800 hover:bg-[#181d2d]"
          }`}
        >
          {/* Top 68% Thumbnail */}
          <div className="relative w-full h-[68%] bg-slate-950 overflow-hidden shrink-0">
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-cover opacity-65 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
              referrerPolicy="no-referrer"
            />

            <div
              onClick={(e) => handleSelectAssetToggle(asset.id, e)}
              className="absolute top-1.5 left-1.5 z-10 p-0.5 cursor-pointer bg-black/50 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>

            <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm px-1 py-0.2 rounded text-[7px] font-bold text-slate-300 font-mono flex items-center gap-0.5 border border-slate-800/60">
              <span className="w-1 h-1 rounded-full bg-amber-500"></span>
              <span>{asset.type.toUpperCase()}</span>
              {asset.duration > 0 && <span>| {asset.duration}s</span>}
            </div>
          </div>

          {/* Bottom 32% Label area */}
          <div className="p-1.5 min-w-0 h-[32%] flex flex-col justify-center bg-[#0d101a]/30">
            <h4
              className="text-[9.5px] font-bold text-slate-200 truncate flex items-center gap-1"
              title={asset.name}
            >
              {getFileIcon(asset.type)}
              <span className="truncate">{asset.name}</span>
            </h4>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[7.5px] font-mono text-slate-500">
                {asset.size}
              </span>
              {asset.category && (
                <span className="text-[7px] text-slate-500 bg-slate-900/60 px-1 py-0.2 rounded-sm border border-slate-800/20 scale-90 origin-right">
                  {asset.category}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, asset.id);
            }}
            className="absolute top-1.5 right-1.5 p-1 bg-black/40 text-slate-400 hover:text-white rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      );
    }

    const isLarge = true;
    return (
      <div
        key={asset.id}
        id={`asset-card-${asset.id}`}
        onContextMenu={(e) => handleContextMenu(e, asset.id)}
        onDoubleClick={() =>
          setActiveModal({ type: "preview", assetId: asset.id })
        }
        onClick={() => setActivePreviewAssetId(asset.id)}
        className={`bg-[#131724]/90 border rounded-lg overflow-hidden flex flex-col hover:border-slate-600 transition-all group relative cursor-pointer aspect-[1/1.12] ${
          isSelected
            ? "border-amber-500 bg-[#21211e]/80 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
            : isActive
              ? "border-blue-500 bg-[#161d30]"
              : "border-slate-800 hover:bg-[#181d2d]"
        }`}
      >
        <div className="relative w-full h-[64%] bg-slate-950 overflow-hidden shrink-0">
          <img
            src={asset.thumbnail}
            alt={asset.name}
            className="w-full h-full object-cover opacity-65 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
            referrerPolicy="no-referrer"
          />

          <div
            onClick={(e) => handleSelectAssetToggle(asset.id, e)}
            className="absolute top-1.5 left-1.5 z-10 p-0.5 cursor-pointer bg-black/50 rounded backdrop-blur-sm"
          >
            {isSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm px-1 py-0.2 rounded text-[7.5px] font-bold text-slate-300 font-mono flex items-center gap-1 border border-slate-800">
            <span className="w-1 h-1 rounded-full bg-amber-500"></span>
            <span>{asset.type.toUpperCase()}</span>
            {asset.duration > 0 && <span>| {asset.duration}s</span>}
          </div>
        </div>

        <div className="p-2 min-w-0 h-[36%] flex flex-col justify-between bg-[#0d101a]/40">
          <div>
            <h4
              className="text-[10.5px] font-bold text-slate-100 truncate flex items-center gap-1.5"
              title={asset.name}
            >
              {getFileIcon(asset.type)}
              <span className="truncate">{asset.name}</span>
            </h4>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-mono text-slate-500">
                {asset.size}
              </span>
              {asset.category && (
                <span className="text-[8px] text-slate-600 bg-slate-900 px-1 py-0.2 rounded-sm border border-slate-800/40">
                  {asset.category}
                </span>
              )}
            </div>
          </div>

          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {asset.tags.slice(0, 2).map((tag) => {
                const config = customTags.find((ct) => ct.name === tag);
                return (
                  <span
                    key={tag}
                    className={`text-[7px] px-1 rounded-sm border leading-none py-0.5 ${
                      config
                        ? config.color
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, asset.id);
          }}
          className="absolute top-1.5 right-1.5 p-1 bg-black/40 text-slate-400 hover:text-white rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Render file in List / Row mode
  const renderListItem = (asset: MediaAsset, zoom: "sm" | "md" | "lg") => {
    const isSelected = selectedAssetIds.includes(asset.id);
    const isActive =
      activePreviewAssetId === asset.id ||
      (!activePreviewAssetId && filteredAssets[0]?.id === asset.id);
    const isCompact = zoom === "sm";

    return (
      <div
        key={asset.id}
        onContextMenu={(e) => handleContextMenu(e, asset.id)}
        onDoubleClick={() =>
          setActiveModal({ type: "preview", assetId: asset.id })
        }
        onClick={() => setActivePreviewAssetId(asset.id)}
        className={`border-b border-slate-900/40 p-1.5 flex items-center justify-between hover:bg-[#141928] transition-colors group relative cursor-pointer gap-3 ${
          isSelected
            ? "bg-[#1c1d22]"
            : isActive
              ? "bg-[#151c2e] border-l-2 border-l-blue-500"
              : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            onClick={(e) => handleSelectAssetToggle(asset.id, e)}
            className="cursor-pointer shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            )}
          </div>

          {!isCompact && (
            <div className="relative w-8 h-6.5 bg-slate-950 rounded border border-slate-900/60 overflow-hidden shrink-0">
              <img
                src={asset.thumbnail}
                alt={asset.name}
                className="w-full h-full object-cover opacity-75"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            {getFileIcon(asset.type)}
            <span
              className="text-[10px] font-semibold text-slate-200 truncate"
              title={asset.name}
            >
              {asset.name}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 max-w-[150px] truncate flex-1 justify-start">
          {asset.tags &&
            asset.tags.slice(0, 2).map((tag) => {
              const config = customTags.find((ct) => ct.name === tag);
              return (
                <span
                  key={tag}
                  className={`text-[7px] px-1 rounded-sm border ${
                    config
                      ? config.color
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {tag}
                </span>
              );
            })}
        </div>

        <div className="w-14 shrink-0 text-[8.5px] font-mono text-slate-500 text-right uppercase">
          {asset.type}
        </div>

        <div className="w-12 shrink-0 text-[8.5px] font-mono text-slate-500 text-right">
          {asset.duration > 0 ? `${asset.duration}s` : "静态"}
        </div>

        <div className="w-14 shrink-0 text-[8.5px] font-mono text-slate-500 text-right">
          {asset.size}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, asset.id);
          }}
          className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div
      id="assets-plugin-system-workspace"
      className="flex flex-col h-full bg-[#11141e] border border-slate-800 rounded-xl overflow-hidden select-none relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ================= DRAG & DROP IMPORT CONTAINER OVERLAY ================= */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#121624]/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-amber-500 rounded-xl m-1.5 animate-pulse transition-all pointer-events-none">
          <div className="bg-amber-500/10 p-5 rounded-full border border-amber-500/20 mb-4 animate-bounce">
            <FolderPlus className="w-12 h-12 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 tracking-wide">
            释放以导入到当前工作目录
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] text-center leading-relaxed">
            支持拖入视频、音频、图片或纯文本文档，系统将自动进行分轨分类识别。
          </p>
        </div>
      )}

      {/* 1. Panel Header Tabs */}
      <div className="flex border-b border-slate-800 bg-[#151a27] p-1.5 gap-1 shrink-0 z-10">
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === "assets"
              ? "bg-[#1e2538] text-amber-400 border border-slate-700/60 shadow-inner"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          媒体库与资产 (Media)
        </button>
        <button
          onClick={() => setActiveTab("plugins")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === "plugins"
              ? "bg-[#1e2538] text-amber-400 border border-slate-700/60 shadow-inner"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          自定义插件系统 (Plugins)
        </button>
        <button
          onClick={() => setActiveTab("variables")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === "variables"
              ? "bg-[#1e2538] text-amber-400 border border-slate-700/60 shadow-inner"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          剧情变量 (Vars)
        </button>
      </div>

      {/* 2. Scrollable Body Contents */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col min-h-0">
        {/* ================= TAB 1: UPGRADED COMMERCIAL FILE MANAGER ================= */}
        {activeTab === "assets" && (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            {/* SEARCH AND FILTERS TOOLBAR */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索资产文件名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 p-0.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Sidebar toggle */}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isSidebarExpanded
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                }`}
                title={isSidebarExpanded ? "收起导航侧边栏" : "展开导航侧边栏"}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              {/* Group selection dropdown */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] rounded-lg px-2 py-2 outline-none cursor-pointer focus:border-amber-500/50"
                title="资产分组视图"
              >
                <option value="none">🗂️ 无分组</option>
                <option value="type">📂 依类型</option>
                <option value="folder">📁 依目录</option>
              </select>
            </div>

            {/* SPLIT PANE WORKSPACE */}
            <div className="flex-1 flex min-h-0 gap-3">
              {/* SIDEBAR: FOLDERS AND TAGS Badges */}
              {isSidebarExpanded && (
                <div className="w-32 shrink-0 border-r border-slate-800/60 pr-2.5 flex flex-col gap-4 overflow-y-auto select-none">
                  {/* Category 1: Standard Directories */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        工作目录
                      </span>
                      <button
                        onClick={() => {
                          setModalInputName("");
                          setActiveModal({ type: "create-folder" });
                        }}
                        className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                        title="新建物理文件夹"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-0.5 text-[11px] font-medium text-slate-400">
                      <button
                        onClick={() => {
                          setSelectedFolderId("all");
                          setSelectedTag(null);
                        }}
                        className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-all cursor-pointer ${
                          selectedFolderId === "all" && !selectedTag
                            ? "bg-[#1e2538] text-amber-400 font-semibold"
                            : "hover:bg-slate-900 hover:text-slate-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Archive className="w-3 h-3 shrink-0" />
                          <span>根目录 (All)</span>
                        </span>
                        <span className="text-[9px] font-mono opacity-60">
                          {enrichedAssets.length}
                        </span>
                      </button>

                      {folders.map((f) => {
                        const count = enrichedAssets.filter(
                          (a) => a.folderId === f.id,
                        ).length;
                        const isSel = selectedFolderId === f.id;
                        return (
                          <div
                            key={f.id}
                            className={`group w-full flex items-center justify-between rounded transition-all cursor-pointer ${
                              isSel
                                ? "bg-[#1e2538] text-amber-400 font-semibold"
                                : "hover:bg-slate-900 hover:text-slate-200"
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedFolderId(f.id);
                                setSelectedTag(null);
                              }}
                              className="flex-1 flex items-center gap-1.5 py-1 px-1.5 text-left min-w-0"
                            >
                              <Folder className="w-3 h-3 shrink-0 text-amber-500/80" />
                              <span className="truncate">
                                {f.name.replace(
                                  /^[^a-zA-Z0-9\u4e00-\u9fa5]+/,
                                  "",
                                )}
                              </span>
                            </button>

                            <div className="flex items-center pr-1 shrink-0">
                              {/* Delete custom folder (f-1/f-2/f-3/f-4 are system defaults) */}
                              {!["f-1", "f-2", "f-3", "f-4"].includes(f.id) ? (
                                <button
                                  onClick={(e) => handleDeleteFolder(f.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity rounded shrink-0 mr-1"
                                  title="删除空文件夹"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              ) : null}
                              <span className="text-[9px] font-mono opacity-60 group-hover:hidden">
                                {count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 2: Quick Media Filters */}
                  <div>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                      格式分类
                    </span>
                    <div className="space-y-0.5 text-[11px] font-medium text-slate-400">
                      {[
                        { id: "video", name: "🎥 视频格式", label: "video" },
                        { id: "audio", name: "🎵 音频格式", label: "audio" },
                        {
                          id: "document",
                          name: "📄 脚本/文档",
                          label: "document",
                        },
                        { id: "image", name: "🖼️ UI贴图", label: "image" },
                      ].map((type) => {
                        const count = enrichedAssets.filter(
                          (a) => a.type === type.label,
                        ).length;
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setSelectedFolderId(type.label);
                              setSelectedTag(null);
                            }}
                            className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-all cursor-pointer ${
                              selectedFolderId === type.label
                                ? "bg-[#1e2538] text-amber-400 font-semibold"
                                : "hover:bg-slate-900 hover:text-slate-200"
                            }`}
                          >
                            <span>{type.name}</span>
                            <span className="text-[9px] font-mono opacity-60">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 3: Global Tags Explorer */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        专属标签 (Tag)
                      </span>
                      <button
                        onClick={() => {
                          setNewTagName("");
                          setActiveModal({ type: "create-tag" });
                        }}
                        className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                        title="新增标签定义"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1 overflow-y-auto pr-1">
                      {customTags.map((t) => {
                        const count = enrichedAssets.filter(
                          (a) => a.tags && a.tags.includes(t.name),
                        ).length;
                        const isSel = selectedTag === t.name;
                        return (
                          <button
                            key={t.name}
                            onClick={() =>
                              setSelectedTag(isSel ? null : t.name)
                            }
                            className={`w-full flex items-center justify-between px-1.5 py-0.8 rounded text-[10px] border transition-all cursor-pointer ${
                              isSel
                                ? "border-amber-500/50 bg-[#251e18] text-amber-400 font-bold"
                                : "border-slate-800/40 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-current text-slate-300"></span>
                              <span className="truncate">{t.name}</span>
                            </span>
                            <span className="text-[8px] font-mono bg-black/30 px-1 py-0.2 rounded shrink-0">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* MAIN FILE LIST / CONTAINER */}
              <div className="flex-1 flex flex-col min-h-0 relative bg-[#0a0c13] rounded-lg border border-slate-900 p-2">
                {/* Drag-and-drop Trigger / Uploader Button header with Layout and Zoom Controls */}
                <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-900 mb-2 shrink-0 gap-2">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400/80 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      /
                      {selectedFolderId === "all"
                        ? "root"
                        : folders
                            .find((f) => f.id === selectedFolderId)
                            ?.name.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, "") ||
                          selectedFolderId}{" "}
                      目录内 ({filteredAssets.length} 项)
                    </span>
                  </div>

                  {/* Layout & Zooming Controls (满足用户: 支持不同视图，缩小，预览，大图排布) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Zoom / Card Sizing (缩小 | 默认 | 大图) */}
                    <div className="flex items-center bg-[#0d0f17] border border-slate-800 rounded px-1.5 py-0.5 gap-1.5">
                      <span className="text-[8.5px] font-bold text-slate-500 font-mono">
                        排布尺寸:
                      </span>
                      <div className="flex items-center gap-0.5">
                        {(["sm", "md", "lg"] as const).map((sz) => {
                          const labels = { sm: "缩小", md: "中等", lg: "大图" };
                          const isSel = zoomSize === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setZoomSize(sz)}
                              className={`text-[8.5px] px-1 py-0.2 rounded transition-colors cursor-pointer font-medium ${
                                isSel
                                  ? "bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {labels[sz]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* View Layout Selection (网格大图 | 详细列表 | 侧栏分栏) */}
                    <div className="flex items-center bg-[#0d0f17] border border-slate-800 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          viewMode === "grid"
                            ? "bg-[#1d2336] text-amber-400"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                        title="大图/网格视图 (Grid View)"
                      >
                        <LayoutGrid className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          viewMode === "list"
                            ? "bg-[#1d2336] text-amber-400"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                        title="详细列表视图 (List View)"
                      >
                        <List className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("split")}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          viewMode === "split"
                            ? "bg-[#1d2336] text-amber-400"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                        title="侧栏实时预览视图 (Detail Preview Split-View)"
                      >
                        <Columns className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[9px] flex items-center gap-1 bg-[#1e253c] hover:bg-[#252e4a] text-amber-400 border border-slate-700/60 px-2 py-1 rounded cursor-pointer transition-all font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      导入资产
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) handleFileUploadMock(e.target.files);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Empty illustrative placeholder state */}
                {filteredAssets.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-slate-500">
                    <FolderPlus className="w-10 h-10 text-slate-700 animate-pulse mb-3" />
                    <h5 className="text-[11px] font-bold text-slate-400">
                      此目录文件夹或标签内暂无媒体
                    </h5>
                    <p className="text-[9px] text-slate-500 mt-1 max-w-[160px] leading-relaxed">
                      拖拽文件到这里导入，或者点击右上角「导入资产」来注册新音画。
                    </p>
                  </div>
                ) : (
                  /* FLEXIBLE MULTI-LAYOUT WORKSPACE Container */
                  <div className="flex-1 flex min-h-0 overflow-hidden relative">
                    {/* Left File List Panel */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 h-full min-h-0">
                      {/* Render according to grouping */}
                      {groupBy === "none" ? (
                        /* FLAT LAYOUTS (No Grouping) */
                        viewMode === "list" ? (
                          <div className="border border-slate-900 bg-[#07090f] rounded-lg divide-y divide-slate-900/60 overflow-hidden">
                            {filteredAssets.map((asset) =>
                              renderListItem(asset, zoomSize),
                            )}
                          </div>
                        ) : (
                          <div className={getGridColsClass(zoomSize)}>
                            {filteredAssets.map((asset) =>
                              renderGridItem(asset, zoomSize),
                            )}
                          </div>
                        )
                      ) : (
                        /* GROUPED LAYOUTS */
                        <div className="space-y-4">
                          {Array.from(
                            new Set(
                              groupBy === "type"
                                ? filteredAssets.map((a) => a.type)
                                : filteredAssets.map(
                                    (a) => a.folderId || "f-1",
                                  ),
                            ),
                          ).map((groupKey) => {
                            const groupItems = filteredAssets.filter((a) =>
                              groupBy === "type"
                                ? a.type === groupKey
                                : (a.folderId || "f-1") === groupKey,
                            );

                            let groupName = "未知文件夹";
                            if (groupBy === "type") {
                              groupName =
                                groupKey === "video"
                                  ? "🎥 视频文件"
                                  : groupKey === "audio"
                                    ? "🎵 音频文件"
                                    : groupKey === "image"
                                      ? "🖼️ 图片文件"
                                      : "📄 脚本/文档";
                            } else {
                              const found = folders.find(
                                (f) => f.id === groupKey,
                              );
                              groupName = found
                                ? found.name
                                : "📁 未分类/根目录";
                            }

                            return (
                              <div key={groupKey} className="space-y-1.5">
                                <div className="flex items-center gap-1.5 py-1 px-1.5 bg-[#171c2b] rounded border border-slate-800">
                                  <ChevronRight className="w-3 h-3 text-amber-500" />
                                  <span className="text-[10px] font-bold text-slate-300">
                                    {groupName} ({groupItems.length} 项)
                                  </span>
                                </div>

                                {viewMode === "list" ? (
                                  <div className="border border-slate-900 bg-[#07090f] rounded-lg divide-y divide-slate-900/40 pl-2 overflow-hidden">
                                    {groupItems.map((asset) =>
                                      renderListItem(asset, zoomSize),
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className={`${getGridColsClass(zoomSize)} pl-2`}
                                  >
                                    {groupItems.map((asset) =>
                                      renderGridItem(asset, zoomSize),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Live Preview Sidebar Panel (In split view mode) */}
                    {viewMode === "split" && activePreviewAsset && (
                      <div className="w-64 shrink-0 bg-[#0d0f17] border-l border-slate-900 p-2.5 flex flex-col gap-2.5 overflow-y-auto h-full min-h-0 text-[10.5px]">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-900 shrink-0">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            💡 侧栏即时预览
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveModal({
                                type: "preview",
                                assetId: activePreviewAsset.id,
                              })
                            }
                            className="text-amber-400 hover:text-white flex items-center gap-0.5 text-[9px] font-semibold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            <Maximize2 className="w-2.5 h-2.5" />
                            全屏
                          </button>
                        </div>

                        {/* Embedded Live Player depending on media type */}
                        <div className="rounded-lg bg-black border border-slate-900 overflow-hidden flex flex-col items-center justify-center p-1 relative min-h-[90px] shrink-0">
                          {activePreviewAsset.type === "video" ? (
                            <video
                              src={activePreviewAsset.url}
                              controls
                              muted
                              autoPlay
                              loop
                              className="w-full h-24 object-contain"
                            />
                          ) : activePreviewAsset.type === "audio" ? (
                            <div className="w-full py-2 px-1 flex flex-col items-center justify-center text-center gap-1.5">
                              <div className="w-10 h-10 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                <Music className="w-4.5 h-4.5 text-emerald-400" />
                              </div>
                              <audio
                                src={activePreviewAsset.url}
                                controls
                                className="w-full h-7 scale-90"
                              />
                            </div>
                          ) : activePreviewAsset.type === "image" ? (
                            <img
                              src={activePreviewAsset.url}
                              alt={activePreviewAsset.name}
                              className="w-full h-24 object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="p-2 font-mono text-[8.5px] text-emerald-400 bg-slate-950 rounded w-full h-24 overflow-y-auto whitespace-pre leading-snug">
                              {activePreviewAsset.name.includes("Spec")
                                ? `=== DIRECTIVE SPEC ===\nClassification: Secure\n\n1. Executive timelines synced\n2. QTE branch engine online\n3. Local persistence active`
                                : `=== CINEFLOW DOC ===\nIngest Name: ${activePreviewAsset.name}\nSize: ${activePreviewAsset.size}\n\nThis is a CineFlow registered document resource.`}
                            </div>
                          )}
                        </div>

                        {/* Quick rename input */}
                        <div className="bg-[#090b10] border border-slate-900 p-2 rounded-lg space-y-1 shrink-0">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>资源重命名:</span>
                            <span className="text-[7.5px] font-mono text-slate-600 bg-black/30 px-1 rounded">
                              QUICK EDIT
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={sidebarRenameValue}
                              onChange={(e) =>
                                setSidebarRenameValue(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSidebarRenameSave();
                              }}
                              className="bg-slate-950 border border-slate-800 text-slate-200 text-[10px] px-1.5 py-1 rounded outline-none flex-1 font-mono focus:border-amber-500/50"
                            />
                            <button
                              type="button"
                              onClick={handleSidebarRenameSave}
                              className="bg-[#1e253c] text-amber-400 hover:bg-[#252e4a] border border-slate-800 px-1.5 rounded text-[8.5px] font-bold cursor-pointer transition-colors"
                            >
                              保存
                            </button>
                          </div>
                        </div>

                        {/* Detailed Spec Attributes */}
                        <div className="grid grid-cols-2 gap-1.5 text-[8.5px] font-mono text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-900 shrink-0">
                          <div>
                            <span className="text-slate-600 block">
                              大小 Size
                            </span>
                            <span className="text-slate-300 font-bold">
                              {activePreviewAsset.size}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 block">
                              类型 Type
                            </span>
                            <span className="text-slate-300 font-bold uppercase">
                              {activePreviewAsset.type}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 block">
                              时值 Duration
                            </span>
                            <span className="text-slate-300 font-bold">
                              {activePreviewAsset.duration > 0
                                ? `${activePreviewAsset.duration}s`
                                : "静态"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 block">
                              类别 Class
                            </span>
                            <span className="text-slate-300 font-bold truncate block">
                              {activePreviewAsset.category || "User Import"}
                            </span>
                          </div>
                        </div>

                        {/* Quick Tags Assignment */}
                        <div className="space-y-1 bg-[#090b10] border border-slate-900 p-2 rounded-lg shrink-0">
                          <span className="text-[8.5px] font-bold text-slate-500 uppercase block">
                            快捷指派标签:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customTags.map((tag) => {
                              const hasTag =
                                activePreviewAsset.tags &&
                                activePreviewAsset.tags.includes(tag.name);
                              return (
                                <button
                                  key={tag.name}
                                  type="button"
                                  onClick={() =>
                                    handleSidebarToggleTag(tag.name)
                                  }
                                  className={`text-[8px] px-1.5 py-0.5 rounded-sm border transition-all cursor-pointer ${
                                    hasTag
                                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold"
                                      : "bg-slate-950 text-slate-500 border-slate-900 hover:border-slate-800 hover:text-slate-300"
                                  }`}
                                >
                                  {tag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyAssetUrl(activePreviewAsset.id)
                          }
                          className="w-full mt-auto bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 py-1 rounded text-[8.5px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          复制网络静态路径
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= BATCH ACTION FLOAT DOCK TOOLBAR ================= */}
                {selectedAssetIds.length > 0 && (
                  <div className="absolute bottom-2 left-2 right-2 z-40 bg-slate-900/95 border border-slate-700 p-2 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 shadow-xl animate-slide-up select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <span className="text-[10.5px] font-bold text-slate-100">
                        已选择{" "}
                        <span className="text-amber-400 font-mono">
                          {selectedAssetIds.length}
                        </span>{" "}
                        项
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      {/* Batch Move Dropdown selector */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBatchMove(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-1.2 outline-none cursor-pointer"
                      >
                        <option value="">📁 移至目录...</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, "")}
                          </option>
                        ))}
                      </select>

                      {/* Batch Tag Dropdown selector */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBatchAddTag(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-1.2 outline-none cursor-pointer"
                      >
                        <option value="">🏷️ 打标签...</option>
                        {customTags.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      {/* Rename action */}
                      <button
                        onClick={handleBatchRename}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9.5px] font-semibold py-1 px-2 rounded cursor-pointer transition-colors"
                        title="统一追加前缀"
                      >
                        批量命名
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={handleBatchDelete}
                        className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[9.5px] font-semibold py-1 px-2 rounded cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        删除
                      </button>

                      {/* Cancel selection */}
                      <button
                        onClick={() => setSelectedAssetIds([])}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="取消选择"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CUSTOM PLUGIN SYSTEM ================= */}
        {activeTab === "plugins" && (
          <div className="flex flex-col gap-4 h-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Side: Plugin selector */}
              <div className="md:col-span-5 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    插槽微服务/插件列表
                  </span>
                  <button
                    onClick={handleCreateNewPlugin}
                    className="text-[9px] bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-[#0d0f14] py-0.5 px-1.5 rounded border border-amber-500/30 font-semibold cursor-pointer transition-all"
                  >
                    + 空白插件
                  </button>
                </div>

                {plugins.map((p) => {
                  const isEditing = selectedPluginId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => selectPluginForEdit(p.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isEditing
                          ? "bg-[#1d243a] border-amber-500 shadow-md"
                          : "bg-[#151925] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Code
                            className={`w-3.5 h-3.5 ${p.isActive ? "text-amber-400 animate-pulse" : "text-slate-500"}`}
                          />
                          <h4 className="text-xs font-semibold text-slate-100 truncate">
                            {p.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {p.description}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePlugin(p.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                        title={p.isActive ? "禁用" : "启用"}
                      >
                        {p.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Right Side: JavaScript compiler editor */}
              <div className="md:col-span-7 flex flex-col gap-2 bg-[#0c0e15] border border-slate-800 p-3.5 rounded-xl">
                {selectedPlugin ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">
                          🛠️ 编辑插件:{" "}
                          <span className="text-amber-400">
                            {selectedPlugin.name}
                          </span>
                        </h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          类库作者: {selectedPlugin.author} | 版本: v
                          {selectedPlugin.version}
                        </p>
                      </div>
                      <button
                        onClick={handleSavePluginCode}
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1 px-2.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        热重载/保存 (Compile)
                      </button>
                    </div>

                    <div className="relative mt-1">
                      <span className="absolute top-2 right-3 text-[9px] font-mono text-slate-600 bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
                        JAVASCRIPT
                      </span>
                      <textarea
                        value={pluginCode}
                        onChange={(e) => setPluginCode(e.target.value)}
                        className="w-full h-44 bg-[#0a0c12] text-slate-300 font-mono text-[10.5px] p-3 rounded-lg border border-slate-800 focus:border-amber-500/50 outline-none leading-relaxed resize-none shadow-inner"
                        spellCheck="false"
                      />
                    </div>
                  </>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs italic">
                    请选择左侧插件进行逻辑开发
                  </div>
                )}
              </div>
            </div>

            {/* Live Plugin Console logger */}
            <div className="bg-[#090b10] border border-slate-900 rounded-lg p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-amber-500" />
                插槽虚拟机运行沙箱控制台 (Live Plugin Logs Console)
              </span>
              <div className="h-20 overflow-y-auto font-mono text-[10px] text-emerald-400/90 leading-normal space-y-1 bg-slate-950/40 p-2 rounded-md border border-slate-800/40">
                {pluginConsoleLogs.map((log, i) => (
                  <div key={i} className="truncate select-text">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PLOT VARIABLES EDITOR ================= */}
        {activeTab === "variables" && (
          <div className="space-y-4">
            {/* New Variable Form */}
            <form
              onSubmit={handleAddVarSubmit}
              className="bg-[#161b28] border border-slate-800 p-3 rounded-xl flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  变量识别名 (Variable Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. keyCollected"
                  value={newVarName}
                  onChange={(e) =>
                    setNewVarName(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
                  }
                  className="w-full bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-800 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="w-32">
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  类型 (Type)
                </label>
                <select
                  value={newVarType}
                  onChange={(e) => {
                    const t = e.target.value as "boolean" | "number" | "string";
                    setNewVarType(t);
                    setNewVarVal(
                      t === "boolean" ? "false" : t === "number" ? "0" : "",
                    );
                  }}
                  className="w-full bg-slate-950 text-slate-200 text-xs px-2 py-1.5 rounded border border-slate-800 outline-none"
                >
                  <option value="number">Number (数值)</option>
                  <option value="boolean">Boolean (布尔)</option>
                  <option value="string">String (字符串)</option>
                </select>
              </div>

              <div className="w-32">
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  初始默认值 (Default Value)
                </label>
                {newVarType === "boolean" ? (
                  <select
                    value={newVarVal}
                    onChange={(e) => setNewVarVal(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs px-2 py-1.5 rounded border border-slate-800 outline-none"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type={newVarType === "number" ? "number" : "text"}
                    placeholder="Value"
                    value={newVarVal}
                    onChange={(e) => setNewVarVal(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-800 focus:border-amber-500 outline-none"
                  />
                )}
              </div>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-1.5 px-3.5 rounded flex items-center gap-1 cursor-pointer transition-colors h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                新增属性
              </button>
            </form>

            {/* List current variables */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                活动全局变量列表 (用于分支流向条件判断)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {variables.map((v) => (
                  <div
                    key={v.id}
                    className="bg-[#171c2a] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-700 transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-mono text-amber-500/80 bg-amber-500/5 px-1 py-0.2 rounded border border-amber-500/10">
                        {v.type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-1.5 truncate">
                        {v.name}
                      </h4>

                      {/* Live Modifier */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400">
                          当前值:
                        </span>
                        {v.type === "boolean" ? (
                          <button
                            onClick={() =>
                              onUpdateVariableValue(v.id, !v.value)
                            }
                            className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors font-mono ${
                              v.value
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {v.value.toString()}
                          </button>
                        ) : (
                          <input
                            type={v.type === "number" ? "number" : "text"}
                            value={v.value}
                            onChange={(e) => {
                              const val =
                                v.type === "number"
                                  ? parseFloat(e.target.value) || 0
                                  : e.target.value;
                              onUpdateVariableValue(v.id, val);
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 text-slate-200 text-[10px] px-1 py-0.5 rounded focus:border-amber-500 outline-none font-mono"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteVariable(v.id)}
                      className="p-1 bg-slate-900/60 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer shrink-0"
                      title="删除变量"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= RIGHT CLICK CUSTOM CONTEXT MENU ================= */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 bg-[#121623]/95 border border-slate-700/80 p-1 rounded-xl shadow-2xl backdrop-blur-md w-48 text-[11px] font-semibold text-slate-300 flex flex-col space-y-0.5 animate-scale-up select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {/* Menu Title / Quick Name */}
          <div className="px-2.5 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-800">
            资产控制工具箱
          </div>

          {/* Interactive play preview */}
          <button
            onClick={() => {
              setActiveModal({ type: "preview", assetId: contextMenu.assetId });
              setContextMenu(null);
            }}
            className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-amber-500" />
            <span>即时预览 (Preview)</span>
          </button>

          {/* View Details */}
          <button
            onClick={() => {
              setActiveModal({ type: "details", assetId: contextMenu.assetId });
              setContextMenu(null);
            }}
            className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center gap-2"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>查看详细元数据</span>
          </button>

          {/* Rename */}
          <button
            onClick={() => {
              handleOpenRenameModal(contextMenu.assetId);
              setContextMenu(null);
            }}
            className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center gap-2"
          >
            <Edit className="w-3.5 h-3.5 text-indigo-400" />
            <span>重命名 (Rename)</span>
          </button>

          {/* Copy URL */}
          <button
            onClick={() => {
              handleCopyAssetUrl(contextMenu.assetId);
              setContextMenu(null);
            }}
            className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>复制静态网络链接</span>
          </button>

          {/* Submenu for folders migration */}
          <div className="border-t border-slate-800 my-1"></div>
          <div className="px-2.5 py-1 text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">
            📁 移动至物理目录
          </div>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                handleMoveToFolder(contextMenu.assetId, f.id);
                setContextMenu(null);
              }}
              className="w-full text-left py-1.2 px-2.5 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 pl-4 truncate text-[10px]"
            >
              <Folder className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {f.name.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, "")}
              </span>
            </button>
          ))}

          {/* Submenu for tag assignment */}
          <div className="border-t border-slate-800 my-1"></div>
          <div className="px-2.5 py-1 text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">
            🏷️ 附带剧情标签
          </div>
          {customTags.map((t) => {
            const asset = enrichedAssets.find(
              (a) => a.id === contextMenu.assetId,
            );
            const hasTag = asset?.tags && asset.tags.includes(t.name);
            return (
              <button
                key={t.name}
                onClick={() => {
                  handleToggleTagOnAsset(contextMenu.assetId, t.name);
                  setContextMenu(null);
                }}
                className="w-full text-left py-1.2 px-2.5 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-colors flex items-center justify-between text-[10px]"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current text-slate-300"></span>
                  <span>{t.name}</span>
                </span>
                {hasTag && <Check className="w-3 h-3 text-amber-500" />}
              </button>
            );
          })}

          <div className="border-t border-slate-800 my-1"></div>

          {/* Delete Asset */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "确定删除此媒体资产文件吗？删除后正在使用的剪辑可能会报错。",
                )
              ) {
                onDeleteAsset(contextMenu.assetId);
                setPluginConsoleLogs((prev) => [
                  ...prev,
                  `[File System] 删除了资产: ${contextMenu.assetId}`,
                ]);
              }
              setContextMenu(null);
            }}
            className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-rose-950 hover:text-rose-400 text-rose-500 cursor-pointer transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>删除文件 (Delete)</span>
          </button>
        </div>
      )}

      {/* ================= SYSTEM MODALS ================= */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-[#121625] border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-scale-up text-xs text-slate-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                {activeModal.type === "rename" && "✏️ 重新命名媒体资产"}
                {activeModal.type === "create-folder" && "📁 新建物理工作目录"}
                {activeModal.type === "create-tag" && "🏷️ 注册全新剧情标签"}
                {activeModal.type === "details" && "👁️ 详细元数据分析面板"}
                {activeModal.type === "preview" && "▶️ 媒体资产即时预览"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* RENAME MODAL */}
              {activeModal.type === "rename" && (
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">
                    请输入新的资产文件名:
                  </label>
                  <input
                    type="text"
                    value={modalInputName}
                    onChange={(e) => setModalInputName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-lg focus:border-amber-500 focus:outline-none font-mono"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={handleRenameAsset}
                      className="bg-amber-500 hover:bg-amber-600 font-bold text-[#0d0f14] px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      保存重命名
                    </button>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* CREATE FOLDER MODAL */}
              {activeModal.type === "create-folder" && (
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">
                    新文件夹名称 (支持中英文/emoji):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 🛸 CG特效剪辑"
                    value={modalInputName}
                    onChange={(e) => setModalInputName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={handleCreateFolderSubmit}
                      className="bg-amber-500 hover:bg-amber-600 font-bold text-[#0d0f14] px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      创建文件夹
                    </button>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* CREATE TAG MODAL */}
              {activeModal.type === "create-tag" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      标签名字 (例如: CG动画, 重要线索):
                    </label>
                    <input
                      type="text"
                      placeholder="机密分支"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      选择视觉配色:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          color: "bg-red-500/20 text-red-400 border-red-500/30",
                          label: "绯红 (Cyber Red)",
                        },
                        {
                          color:
                            "bg-amber-500/20 text-amber-400 border-amber-500/30",
                          label: "琥珀 (Amber Yellow)",
                        },
                        {
                          color:
                            "bg-purple-500/20 text-purple-400 border-purple-500/30",
                          label: "魅紫 (Neon Purple)",
                        },
                        {
                          color:
                            "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                          label: "晶绿 (Hacker Green)",
                        },
                        {
                          color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
                          label: "冰蓝 (Ice Blue)",
                        },
                        {
                          color:
                            "bg-pink-500/20 text-pink-400 border-pink-500/30",
                          label: "霓虹粉 (Neon Pink)",
                        },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setNewTagColor(item.color)}
                          className={`p-2 rounded border text-left flex items-center gap-1.5 text-[10px] transition-all cursor-pointer ${
                            newTagColor === item.color
                              ? "border-amber-500 bg-slate-950 font-bold"
                              : "border-slate-800 bg-slate-900 text-slate-400"
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${item.color.split(" ")[0]}`}
                          ></span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={handleCreateTagSubmit}
                      className="bg-amber-500 hover:bg-amber-600 font-bold text-[#0d0f14] px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      注册新标签
                    </button>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW DETAILS METADATA */}
              {activeModal.type === "details" &&
                (() => {
                  const asset = enrichedAssets.find(
                    (a) => a.id === activeModal.assetId,
                  );
                  if (!asset) return null;
                  const isVid = asset.type === "video";
                  const isAud = asset.type === "audio";
                  return (
                    <div className="space-y-2 select-text font-mono text-[11px] leading-relaxed">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-1">
                        <div className="text-slate-500 text-[10px]">
                          识别码 (UUID)
                        </div>
                        <div className="text-slate-300 text-[10px] truncate bg-slate-900 p-1 rounded select-all">
                          {asset.id}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 mt-2">
                        <div>
                          <span className="text-slate-500 block">静态类型</span>
                          <span className="text-slate-200 font-bold">
                            {asset.type.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">文件大小</span>
                          <span className="text-slate-200 font-bold">
                            {asset.size}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">播放时值</span>
                          <span className="text-slate-200 font-bold">
                            {asset.duration > 0
                              ? `${asset.duration} 秒`
                              : "无时轴/静态"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">编码格式</span>
                          <span className="text-slate-200 font-bold">
                            {isVid
                              ? "H.264 / AAC"
                              : isAud
                                ? "PCM Audio"
                                : "UTF-8 String"}
                          </span>
                        </div>
                        {isVid && (
                          <>
                            <div>
                              <span className="text-slate-500 block">
                                分辨率
                              </span>
                              <span className="text-slate-200 font-bold">
                                1920 x 1080 (HD)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">
                                目标码率
                              </span>
                              <span className="text-slate-200 font-bold">
                                12 Mbps
                              </span>
                            </div>
                          </>
                        )}
                        {isAud && (
                          <>
                            <div>
                              <span className="text-slate-500 block">
                                采样率
                              </span>
                              <span className="text-slate-200 font-bold">
                                48.0 kHz
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">
                                音轨声道
                              </span>
                              <span className="text-slate-200 font-bold">
                                立体双声道 (Stereo)
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 mt-2">
                        <span className="text-slate-500 block">
                          网络地址 (URL Path)
                        </span>
                        <span className="text-amber-400 select-all truncate block text-[10px]">
                          {asset.url}
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 mt-5">
                        <button
                          onClick={() => handleCopyAssetUrl(asset.id)}
                          className="bg-amber-500 hover:bg-amber-600 font-bold text-[#0d0f14] px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          复制链接并关闭
                        </button>
                        <button
                          onClick={() => setActiveModal(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          返回
                        </button>
                      </div>
                    </div>
                  );
                })()}

              {/* PLAYBACK PREVIEWER */}
              {activeModal.type === "preview" &&
                (() => {
                  const asset = enrichedAssets.find(
                    (a) => a.id === activeModal.assetId,
                  );
                  if (!asset) return null;
                  const isVid = asset.type === "video";
                  const isAud = asset.type === "audio";
                  const isImg = asset.type === "image";
                  const isDoc = asset.type === "document";

                  // Render dynamic simulated doc content for documents
                  const getSimulatedDocContent = () => {
                    if (asset.name.includes("Spec")) {
                      return `[SECURITY LEVEL: SPECIALIST SECURED]
===================================================
CYBERFLOW INTERACTIVE STORY ENGINE v1.2.4
===================================================
1. EXECUTIVE SUMMARY:
   This interactive drama station empowers cinematic storytellers
   to design condition-based non-linear branching content.

2. CORE PLATFORM ARCHITECTURE:
   - High precision frame-level sync timeline
   - Multitasking JavaScript plugin container
   - Reactive Node Graph Flow engine
   - Persisted project storage

3. SYSTEM HEALTH SUMMARY:
   Integrity: OPTIMAL
   Database sync: COMPLETED (LOCAL STORAGE EMULATOR)`;
                    } else if (asset.name.includes("Algorithm")) {
                      return `// TERMINAL SYSTEM BYPASS DECRYPTOR v2.4
// INTRUDER DEVIATION DETECTED
function runByPassDecryptionChain(streamRef) {
  const cipher = "ANTIGRAVITY_GEMINI_STATION_KEY";
  let matrix = new Uint32Array(streamRef.length);
  for (let idx = 0; idx < streamRef.length; idx++) {
    matrix[idx] = streamRef[idx] ^ cipher.charCodeAt(idx % cipher.length);
  }
  return String.fromCharCode.apply(null, matrix);
}
console.log("Exploit signature loaded. Port inject sector: 0x7FFA21C");`;
                    } else {
                      return `========= CINEFLOW SECURED DOSSIER DATA =========
File Ingest Name: ${asset.name}
Asset UUID: ${asset.id}
Format Class: VIRTUAL DOCUMENTS RESOURCE

This document is compiled successfully and bound to CineFlow runtime.
You can drag and drop this resource onto timeline nodes, or assign
its variables to lock and key decision branches.`;
                    }
                  };

                  return (
                    <div className="space-y-4">
                      {/* Real Video playback */}
                      {isVid && (
                        <div className="bg-black rounded-lg overflow-hidden border border-slate-800">
                          <video
                            src={asset.url}
                            controls
                            autoPlay
                            className="w-full h-auto max-h-56 object-contain"
                          />
                        </div>
                      )}

                      {/* Real Audio playback with CD visualizer */}
                      {isAud && (
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-900 flex flex-col items-center justify-center space-y-4 text-center">
                          <div className="relative">
                            <div className="w-24 h-24 bg-slate-900 rounded-full border-4 border-slate-800 flex items-center justify-center animate-[spin_6s_linear_infinite] shadow-xl">
                              <div className="w-8 h-8 bg-amber-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                                <Music className="w-3.5 h-3.5 text-slate-950" />
                              </div>
                            </div>
                            <div className="absolute top-0 -right-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-mono px-1 py-0.2 rounded-full animate-pulse">
                              LIVE SFX
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[11px] font-bold text-slate-200">
                              {asset.name}
                            </h4>
                            <span className="text-[9px] text-slate-500 font-mono">
                              音轨时长: {asset.duration}秒
                            </span>
                          </div>

                          <audio
                            src={asset.url}
                            controls
                            className="w-full h-10 mt-2"
                          />
                        </div>
                      )}

                      {/* Real Image */}
                      {isImg && (
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 max-h-56 overflow-hidden flex items-center justify-center">
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-auto max-h-48 object-contain rounded"
                          />
                        </div>
                      )}

                      {/* Document virtual reader */}
                      {isDoc && (
                        <div className="bg-slate-950 p-4.5 rounded-lg border border-slate-900 font-mono text-[9.5px] text-emerald-400 select-text overflow-y-auto h-48 leading-relaxed whitespace-pre shadow-inner border-t-2 border-t-emerald-600">
                          {getSimulatedDocContent()}
                        </div>
                      )}

                      {/* Detail footnote */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
                        <span>大小: {asset.size}</span>
                        <span>分类: {asset.category}</span>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 border-t border-slate-900 pt-3">
                        <button
                          onClick={() => setActiveModal(null)}
                          className="bg-amber-500 hover:bg-amber-600 font-bold text-[#0d0f14] px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          完成预览
                        </button>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
