import React, { useState, useRef } from "react";
import {
  Folder,
  Plus,
  Trash2,
  Copy,
  Edit3,
  X,
  Clock,
  Download,
  Upload,
  Search,
  Check,
  Film,
  Sparkles,
} from "lucide-react";

interface ProjectMeta {
  id: string;
  name: string;
  lastModified: number;
  sceneCount: number;
  thumbnail?: string;
}

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  onSelectProject: (projectId: string) => void;
  onImportProject: (projectJSON: string) => void;
  allProjectsMeta: ProjectMeta[];
  onCreateProject: (type: "blank" | "template") => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDuplicateProject: (id: string) => void;
}

export default function ProjectManager({
  isOpen,
  onClose,
  currentProjectId,
  onSelectProject,
  onImportProject,
  allProjectsMeta,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
}: ProjectManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredProjects = allProjectsMeta.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleStartRename = (e: React.MouseEvent, p: ProjectMeta) => {
    e.stopPropagation();
    setEditingProjectId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRenameProject(id, editName.trim());
    }
    setEditingProjectId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        // Validate if it is valid JSON
        JSON.parse(content);
        onImportProject(content);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        alert("无效的 JSON 项目文件，请检查文件格式。");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#111422] border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-scale-up overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#15192b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Folder className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                项目管理器 (Project Dashboard)
              </h3>
              <p className="text-[11px] text-slate-400">
                类似剪映工作台，支持项目的新建、备份、副本复制与本地实时存储
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= ACTIONS BAR ================= */}
        <div className="px-6 py-3 bg-[#131627] border-b border-slate-800/60 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCreateProject("blank")}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-[#0d0f14] font-bold text-xs py-2 px-4 rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建空白项目</span>
            </button>
            <button
              onClick={() => onCreateProject("template")}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-indigo-100 font-bold text-xs py-2 px-4 rounded-lg shadow-md transition-all cursor-pointer border border-indigo-500/30"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>创建赛博庞克示例</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>导入项目文件 (JSON)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Search box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索项目名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* ================= PROJECTS GRID ================= */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0c0e1a]">
          {filteredProjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
                <Folder className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-300 font-medium">
                未找到任何项目
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                您可以点击左上角的“新建空白项目”或“导入项目文件”，开启您的互动多轨故事设计。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const isCurrent = project.id === currentProjectId;
                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (!isCurrent) onSelectProject(project.id);
                    }}
                    className={`bg-[#121629] border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group relative flex flex-col justify-between ${
                      isCurrent
                        ? "border-amber-500 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)] bg-[#171a2e]"
                        : "border-slate-800/80 hover:border-slate-700 hover:bg-[#151930]"
                    }`}
                  >
                    {/* Project Preview Banner */}
                    <div className="relative h-28 bg-slate-950 overflow-hidden shrink-0">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-slate-600">
                          <Film className="w-10 h-10 opacity-30" />
                        </div>
                      )}

                      {/* Status indicator */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {isCurrent ? (
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                            当前编辑
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-950/80 backdrop-blur-sm text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">
                            本地项目
                          </span>
                        )}
                      </div>

                      {/* Scenes trigger indicator */}
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-300 font-mono border border-slate-800/60">
                        {project.sceneCount} 个分支节点
                      </div>
                    </div>

                    {/* Project Information */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div className="mb-2">
                        {editingProjectId === project.id ? (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              autoFocus
                              className="bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-slate-100 font-medium focus:outline-none w-full"
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveRename(e, project.id);
                                if (e.key === "Escape")
                                  setEditingProjectId(null);
                              }}
                            />
                            <button
                              onClick={(e) => handleSaveRename(e, project.id)}
                              className="p-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded shrink-0 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                              {project.name}
                            </h4>
                            <button
                              onClick={(e) => handleStartRename(e, project)}
                              className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shrink-0"
                              title="重命名项目"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info and action metadata */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(project.lastModified)}</span>
                        </div>

                        {/* Right-aligned operation suite */}
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onDuplicateProject(project.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title="复制项目副本"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              // We can trigger an export download directly
                              const fullDetailKey = `cineflow_project_detail_${project.id}`;
                              const detail =
                                localStorage.getItem(fullDetailKey);
                              if (detail) {
                                const blob = new Blob([detail], {
                                  type: "application/json",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${project.name}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title="备份导出此项目"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `确定要彻底删除项目“${project.name}”吗？此操作无法撤销。`,
                                )
                              ) {
                                onDeleteProject(project.id);
                              }
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            title="删除项目"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-[#131627] flex items-center justify-between text-[11px] text-slate-500">
          <span>总计: {allProjectsMeta.length} 个本地工作站项目</span>
          <span>自动保存：所有更改均在微秒级即刻写回本地缓存</span>
        </div>
      </div>
    </div>
  );
}
