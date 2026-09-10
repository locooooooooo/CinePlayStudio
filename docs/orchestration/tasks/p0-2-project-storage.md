# P0-2 Project Storage

⟦tag:v2|task|p0-2-project-storage⟧

- objective: 为 P0 通用剪辑器建立可验证的项目仓储协议，覆盖新建、打开、保存、重开、revision 和失败恢复语义
- product priority: P0
- state: technically verified
- parent roadmap: `docs/product/p0-general-editor-follow-up-roadmap-2026-08-05.md`
- product contract: `docs/product/p0-general-editor-product-contract-2026-08-04.md`
- schema dependency: `shared/contracts/project.ts`（只读，不得修改）
- planned owner: `[短工]#P0项目存储@P0`
- planned session: ⟦tag:v2|session|p0-2-project-storage-01⟧

## Dispatch Gate

本卡已完成技术实现。真实 worker `019fda43-ee20-7a33-b528-ff136317775a` 已返回正式回执，P0-2 文件锁已释放；用户接受和安装版重启仍不在本轮声明内。

## Planned Write Scope

只允许新建以下文件；实际派工时必须再次确认：

- `src/project/project-repository.ts`
- `src/project/project-repository.test.ts`
- `src/project/project-fixtures/**`

worker 不得修改 `shared/contracts/project.ts`、现有 `src/**`、UI、Electron/preload/IPC、package/lock、TypeScript/ESLint/Prettier/Vite 配置、docs、Git 或发布状态。

## Required Slice

- 通过只读 P0-1 schema 校验所有进入仓储的 `unknown` 文档。
- 定义不把 `revision`、`requestId`、`correlationId` 混入 ProjectDocument 的仓储快照/传输类型。
- 提供 create/open/save/reload 的明确结果和稳定错误分类。
- 保存采用单写者或显式 expected revision，旧 revision 完成事件不得覆盖新 revision。
- 通过注入的 storage port/failure fixture 证明原子保存失败时保留最后成功版本，并保留可恢复路径语义。
- 拒绝损坏文档、未知高版本、项目根之外路径和非法输入；不得静默创建空项目。
- 测试 deterministic round-trip、旧 revision、损坏输入、写入失败和恢复分支。

## Non-goals

- 不实现 UI、项目管理器、Electron IPC、原生文件对话框或真实安装版 smoke。
- 不实现真实素材复制、媒体探测、预览、FFmpeg、Export Job 或 P1 互动运行时。
- 不使用 `new Function`、`eval`、`vm` 或项目内容中的可执行脚本。
- 不修改 package、配置或 Git，不把内存 fake store 证据写成真实目录用户验收。

## Acceptance

- focused tests、typecheck、锁内 lint/format 和 `git diff --check` 通过，并列出精确命令与结果。
- 回执必须包含 `changedFiles`、`blockers`、`remainingRisk`、`rollbackPoint`、`nextAction`、evidence。
- 分别报告 implemented、tested、technically verified、user accepted、committed、pushed、published。
- 真实文件系统、安装版重启和用户接受保持 `not verified`，直到有独立 R0/U0 证据。

## Handoff

- changedFiles: `src/project/project-repository.ts`, `src/project/project-repository.test.ts`, `src/project/project-fixtures/**`
- blockers: none for the declared technical slice
- remainingRisk: real installed-app restart and user acceptance remain open
- rollbackPoint: remove only future files within the planned fence
- nextAction: PM has absorbed the callback; keep ICE-01 blocked and do not dispatch ICE-02 through ICE-09
