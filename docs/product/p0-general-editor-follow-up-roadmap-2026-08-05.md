# 通用剪辑器 P0 后续推进路线

- 日期：2026-08-05
- 状态：当前推进基线
- 适用范围：CinePlayStudio 通用剪辑器 P0
- 产品主线：项目 -> 素材 -> 时间轴 -> 剪辑 -> 预览 -> 输出
- P1 边界：结构化互动项目、分支运行时、插件执行和 AI 剧本拆解不进入本路线的当前实现名额

## 1. 当前事实

| 事项                 | 当前状态                                    | 证据与限制                                                                               |
| -------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| M0 桌面底座          | technically verified                        | `a80d91b` 在 `main`；质量、构建、Windows 打包和 packaged FFprobe 证据已由控制面吸收      |
| P0-1 Schema          | implemented / tested / technically verified | Zod ProjectDocument、P0 对象、fixtures 和 8 个 focused tests；未用户验收、未提交、未推送 |
| P0-2 Project Storage | draft-ready / not dispatched                | 后续 task/session 卡已整理；源码锁未开启                                                 |
| P0 全链路            | blocked                                     | 真实项目目录、素材复制、预览、Export Job、FFmpeg、IPC 和 U0 尚未形成证据                 |

本文件不把 fixture、源码测试或派工回执升级为真实用户闭环，也不覆盖现有工作树中的无关 dirty 文件。

## 2. 后续切片顺序

### P0-2 Project Storage

目标是让规范 `ProjectDocument` 通过一个可验证的项目仓储完成新建、打开、保存、重开和失败恢复。

- 任务卡：`docs/orchestration/tasks/p0-2-project-storage.md`
- 会话卡：`docs/orchestration/sessions/p0-2-project-storage-01.md`
- 当前状态：`draft-ready / not dispatched`
- 允许实现：新建 `src/project/**` 存储核心和测试；只读依赖 P0-1 schema
- 必须证明：round-trip、单写者/revision 顺序、旧 revision 拒绝、保存失败保留最后成功版本、损坏/高版本错误分类、项目根路径边界
- 不得声称：真实安装版目录保存、Electron IPC、用户重启验收；这些需要后续集成证据

### P0-3 Assets

在 P0-2 仓储协议稳定后，定义真实视频、音频、图片和字幕的复制/登记、取消、缺失与重新绑定。必须区分真实文件、受控引用、缺失和未授权状态，禁止远程示例 URL 作为成功结果。

### P0-4 Timeline

补齐轨道和片段的放置、移动、裁剪、删除、锁定、静音、播放头和取消语义；所有写回都必须经过 P0-1 schema 与 P0-2 保存协议。

### P0-5 Preview

只验证当前 revision 的真实媒体预览、播放、暂停、seek 和失败显示，不把组件存在或远程媒体 URL当作 R0。

### P0-6 Export

先冻结一个真实支持格式，再实现可见 Job、进度、取消、失败清理和真实输出检查。FFmpeg、进程归属和安装版证据在该切片单独开放。

### P0-7 Integration

最后串联新建、导入、剪辑、预览、保存重开和真实输出，分别记录 Web/PC、开发版/安装版、R0/U0 证据。任何一环缺失，P0 仍为 blocked。

## 3. 文档事实源

1. 执行状态：`docs/orchestration/index.md`、`current-dispatch-shortlist.md`、`status.json`
2. 当前任务：对应 `docs/orchestration/tasks/**` 和 `sessions/**`
3. 产品对象和非目标：`docs/product/p0-general-editor-product-contract-2026-08-04.md`
4. 全链路验收：`docs/product/p0-general-editor-acceptance-matrix-2026-08-04.md`
5. 版本发布边界：`docs/releases/index.md` 及对应版本卡

冲突时，执行状态优先于路线图；路线图不能覆盖控制面，也不能把计划写成完成。

## 4. 状态口径

- `implemented`：源码切片存在。
- `tested`：声明范围内的自动化测试通过。
- `technically verified`：PM 独立复核了 fenced diff 和可复现命令。
- `user accepted`：目标用户在真实任务中完成并确认结果。
- `committed / pushed / published`：分别需要对应 Git、远端和发布证据。

当前只允许把 P0-1 标记到 `technically verified`；不得把它扩展成 P0 全链路或用户验收。

## 5. 下一步

先评审 P0-2 task/session 草案；明确派工后才建立 active file lock 和真实会话。未明确派工前，保持源码、IPC、真实素材、FFmpeg 和 P1 互动能力关闭。
