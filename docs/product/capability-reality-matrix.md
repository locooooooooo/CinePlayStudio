# T06 Web/PC 能力真实性矩阵（准备稿）

> task_id: `T06`
> status: `prepared`
> snapshot_date: `2026-08-04`
> owner: 产品经理 + 架构负责人
> scope: 只准备 `0.2.0` 的能力边界、错误码、UI 状态、contract test 和脚本禁用规则；不启动 M1 工程实现。

## 0. 结论和使用规则

本文件是 T06 的准备包，不是产品能力完成证明，也不是发布验收单。当前控制面仍处于 M0 commit closeout：M0 submission commit 尚未完成控制面验证，M1 继续关闭。`T06-T09` 当前允许准备证据和验收约束，但不允许修改产品源码、IPC、项目存储、资产导入、渲染或 FFmpeg 实现。

本矩阵只采用仓库当前可读证据。源码中出现的组件、路由、依赖、fixture、fallback、示例 URL、模拟日志或旧包都不能单独形成 `release_verified`。本轮未执行产品运行、打包验收或外部用户验收，因此所有“源码可见”结论都保持为准备证据，不升级为运行或发布证据。

### 0.1 状态词典

| 状态               | 含义                                                                                 | 可否作为商业发布证据            |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------- |
| `source_observed`  | 能从当前源码或配置读到路径；本轮未以运行结果证明                                     | 否                              |
| `dev_verified`     | 在明确的 Web 开发环境中实际运行，并保存命令、fixture、结果和失败日志                 | 否，仍需 PC/发行验收            |
| `pc_m0_only`       | 只证明 M0 桌面壳、窗口或 app-info IPC 的边界，不证明业务能力                         | 否                              |
| `unsupported`      | 当前形态没有受支持实现，或该能力被本版本明确禁止                                     | 否；UI 必须明确不可用           |
| `mock`             | fixture、模拟器、fallback、演示日志、假成功或示例 URL                                | 否；不可伪装成成功交付          |
| `unknown`          | 当前证据不足，不能推断实现、平台或发行状态                                           | 否；必须写 `needs verification` |
| `release_verified` | 通过真实安装包、固定 commit、实际输入输出、失败/取消、安全和发行门禁，并有可复核证据 | 只有此状态可以                  |

约定：`Web`、`PC` 和 `release-evidence` 列均使用上述词典；`mock` 单独列出，因为它可能与某个可点击的 Web 路径同时存在。`source_observed` 不等于 `dev_verified`，`pc_m0_only` 不等于 `packaged_verified`。

## 1. 证据基线

| 证据                                                                                   | 当前可读事实                                                                                                                                                                       | 对 T06 的约束                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `docs/product/commercialization-task-board.md:124-132`                                 | T06 要盘点 Projects、Assets、Media、Exports、AI、Diagnostics，标记 Web/PC/unsupported/mock/release evidence，补齐错误码、UI 文案和 contract test；M0 关闭前不得进入源码和 IPC 实现 | 本文件只交付准备包                    |
| `docs/product/commercialization-plan.md:57-60,117-122,228-235,255-266`                 | 当前项目管理仍以 `localStorage` 为主；AI 有本地 fallback；Electron、FFmpeg/FFprobe 和导出是工程方向而非自动证明；`0.2.0` 要求所有按钮不再假成功                                    | 入口存在不等于真实能力                |
| `docs/pc-desktop-porting-technical-plan.md:8-67`                                       | 当前原型有浏览器存储、远程示例和模拟结果；`mock`、`dev_verified`、`packaged_verified`、`release_verified` 分层；MVP 不含真实多轨渲染、OSS、自动更新和任意 JavaScript 插件          | 不得把规划或模拟状态当成发行能力      |
| `docs/pc-desktop-porting-technical-plan.md:130-142,407-448`                            | Web/PC 应在适配器层分叉；Web 不支持能力应返回 `UNSUPPORTED_CAPABILITY`；目标 IPC 返回结构化 `Result` 和 `correlationId`                                                            | 错误码必须统一，UI 不解析异常文本     |
| `docs/pc-desktop-porting-technical-plan.md:455-492,630-719,745-803`                    | FFmpeg/FFprobe 应是受控任务；M0-M7 有明确门禁；没有 mock/fallback/dev-only 冒充 packaged/release verified                                                                          | release evidence 必须绑定真实任务和包 |
| `docs/orchestration/index.md:63-68`、`docs/orchestration/status.json:26`               | M1 project storage、asset import、renderer adapters、FFmpeg render、OSS、updater、plugin execution 均不得启动；M1 要等 verified M0-F submission commit 且 commit 经验证            | 本轮不能实现任何上述能力              |
| `docs/orchestration/sessions/commercialization-entry-gate-2026-08-04.md:54-89,154-158` | T06-T09 为 `blocked for engineering / prepare-only for evidence`；M0 submission commit 未验证；禁止修改产品源码、IPC、项目存储、资产导入或 FFmpeg 实现                             | 本矩阵不升级为 `ready`                |
| `README.md:11-19`                                                                      | README 只说明 Node、`npm install` 和 `npm run dev`，没有安装包、PC 业务能力或发行证据                                                                                              | README 不构成 release evidence        |

### 1.1 当前源码交叉证据

以下内容是只读盘点结果，用于限制矩阵，不代表本轮已经运行：

- `src/App.tsx:189-344,359-663` 使用多个 `localStorage` key 保存项目元数据和详情，支持浏览器内创建、切换、复制、删除、重命名和 JSON 导入；`src/components/ProjectManager.tsx:89-103,308-321` 使用 `FileReader` 和 Blob 下载。
- `src/components/AssetManager.tsx:257-340,1487-1513` 的导入函数名为 `handleFileUploadMock`，只根据扩展名登记元数据，并把用户文件替换成远程示例 URL；因此不能写成真实本地资产导入。
- `server.ts:748-825` 在 FFprobe 失败时返回 `ffprobe-emulator (Virtual Media Container)`；`server.ts:827-869` 返回模拟 FFmpeg 日志、临时路径和示例 `downloadUrl`；`src/components/NativeEngineCenter.tsx:498-535,547-602` 还会把请求失败转换成带 `success: true` 的本地 fallback。
- `src/components/NativeEngineCenter.tsx:626-650,1300-1390` 的 OSS 上传和公开 CDN URL 是前端定时器/日志模拟；`src/components/NativeEngineCenter.tsx:656-716` 与 `server.ts:871-1220` 暴露 DOCX/ZIP 路径，但本轮未执行其真实产物检查。
- `server.ts:439-746` 支持 Gemini、custom endpoint 和本地 fallback；`src/components/ScriptDecomposer.tsx:225-417` 在请求失败时生成 `mockResult`。这只能证明存在候选路径，不能证明 AI 质量、成本、隐私或发行可用性。
- `electron/preload/index.ts` 目前只暴露 `app.getInfo`；`electron/main/app-info-ipc.ts` 只注册 app-info channel，没有 Projects、Assets、Media、Exports、AI 或 Diagnostics 业务 IPC。桌面壳边界不能扩大成 PC 业务能力。
- `src/components/Player.tsx:95-103,227-247` 和 `src/components/AssetManager.tsx:628-639` 存在 `new Function` 条件、动作和插件编译路径；`src/types.ts:24` 与 `src/initialData.ts:192-256` 也保存 `actionCode`。这是脚本禁用边界的当前冲突，不能在本轮通过文档把它写成安全已验证。

## 2. 六大入口能力矩阵

“当前 Web/PC”描述的是当前仓库可读状态，不是目标架构承诺。凡是 `source_observed` 或 `mock` 的行，都必须先完成对应 contract test 才能进入后续 `dev_verified` 或 `packaged_verified`。

| 入口            | 当前 Web 分类                                                                                                                             | 当前 PC 分类                                                                                                                             | unsupported 边界                                                                                         | mock / fixture 判断                                                                                        | 当前 release-evidence                                                   | 后续验收焦点                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Projects**    | `source_observed`：浏览器 `localStorage` 多 key 项目列表、详情、自动保存、切换、复制、删除、重命名、JSON 导入/下载                        | `pc_m0_only`：有桌面壳和 app-info IPC；项目目录、`ProjectDocument`、save/flush/recovery/migration IPC 未暴露，业务 PC 能力 `unsupported` | 不承诺真实项目目录、相对路径、原子保存、恢复文件、旧/未来版本迁移、重启恢复或跨机器交接                  | 默认项目、`INITIAL_*` 数据和远程媒体 URL 是演示 fixture；浏览器存储 CRUD 不能证明文件可靠性                | `none / needs verification`；未有固定 commit 绑定的 Web/PC 项目验收记录 | Web/PC 合法 fixture 结果一致；revision、损坏、旧版、未来版、强制结束和 flush 均有确定结果         |
| **Assets**      | `mock`：浏览器选择/拖放可进入 `handleFileUploadMock`，但登记的是元数据并替换为远程示例资源，不是用户文件字节                              | `unsupported`：目标 `asset.importFiles` 等 IPC 尚未存在；没有证明项目内复制、hash、权限和回收区                                          | 不承诺本地字节复制、hash/MIME、项目根包含检查、符号链接防逃逸、移动项目重开、删除恢复或 1 GB 流式处理    | `handleFileUploadMock`、示例缩略图、Mixkit/SoundHelix/Unsplash/W3C URL 均只能标为 mock/fixture             | `none`；不得把“导入成功”日志或远程预览写成真实资产证据                  | 真实文件 bytes、中文/空格路径、非法路径、符号链接、重复资产、重开和大文件边界                     |
| **Media**       | `mock` / `source_observed`：Web 路由尝试 `ffprobe`，失败返回 emulator；FFmpeg 路由返回模拟日志和示例 URL；客户端失败也会 fallback success | `unsupported`：M1 renderer adapter、真实媒体任务、打包二进制、job/cancel IPC 尚未完成；不能从 Electron 依赖推导 PC 渲染可用              | 不承诺真实本地 probe、真实多轨渲染、GPU 编码、取消清理、磁盘不足行为、输出原子性或 seek/range            | `ffprobe-emulator`、`ffprobe-fallback-local`、`mockLogs`、`/tmp/...mp4` 和示例 `downloadUrl` 都明确是 mock | `none`；旧包、fixture、模拟日志和 `success: true` 不构成发行证据        | 真实本地输入的 probe、job 生命周期、失败/取消不留正式目标文件、打包 FFmpeg/FFprobe hash 和许可    |
| **Exports**     | `source_observed`：JSON/Blob 浏览器导出和 server DOCX/ZIP 路径可读；MP4/资源预览仍受 Media mock 影响；本轮未运行产物检查                  | `unsupported` / `pc_m0_only`：目标 `export.json/docx/zip` IPC 未暴露，M0 app-info 不代表导出能力                                         | 不承诺真实项目包闭环、稳定文件名、内容完整性、取消、磁盘不足清理、可重开或可交接安装包                   | ZIP 中的合成 launcher/log、服务器生成的演示日志和任何示例 URL 不得进入正式交付；`READY` 标签不是证据       | `none / needs verification`；响应存在不等于产物已验收                   | JSON 确定性、DOCX/ZIP 内容、无示例 URL、失败/取消清理、项目重开和 PC 安装版输出                   |
| **AI**          | `source_observed`：`/api/ai/parse-script` 可走 Gemini、custom endpoint 或本地 fallback；没有本轮真实调用证据                              | `unsupported`：没有 AI Main/Preload gateway；不得从 Web Express route 推导 PC AI 能力                                                    | 不承诺模型质量、成本、隐私、密钥托管、custom endpoint SSRF 防护、超时、重试、结构校验或发布一致性        | 无 key、请求异常和组件 `mockResult` 都是 fallback/mock；固定视频资产映射和“完美 AI”文案不能当模型证明      | `none / needs verification`；没有真实授权调用、输入输出和成本记录       | 无 key/网络/鉴权/超时、结构 schema、endpoint 安全、脱敏日志、fallback provenance 和 Web/PC 一致性 |
| **Diagnostics** | `source_observed` / `mock`：有浏览器 console、探测结果、架构审计、构建日志、OSS 日志和模拟终端；没有统一 health/error contract            | `pc_m0_only`：app-info IPC 可证明壳信息；`diagnostics.revealLogs/getHealthSummary` 未暴露，业务诊断 `unsupported`                        | 不承诺结构化 health summary、correlationId 串联、脱敏日志、可定位恢复动作、真实二进制/安装状态或外部上传 | OSS STS/分片日志、native build footprint、FFmpeg terminal success 和公开 CDN URL 是 mock/demo              | `none`；日志内容不能反向证明任务、安装包或发行状态                      | 诊断摘要、错误码、敏感信息脱敏、真实包路径/二进制 hash、可恢复动作和日志导出边界                  |

### 2.1 入口承诺分级

- **可继续作为 Web 原型观察项：** Projects 的浏览器存储 CRUD、JSON/Blob 导出、UI 预览和 AI 请求编排；它们只能进入 `source_observed` 或经实际命令后进入 `dev_verified`。
- **必须立刻标为 mock/unsupported：** Assets 真实文件导入、Media probe fallback、FFmpeg 渲染、OSS 上传、公开 CDN URL、native build success、插件热重载和任意脚本动作。
- **PC 只能保留 M0 壳证据：** `BrowserWindow` 安全设置、窗口导航/权限保护和 `app.getInfo` sender 校验可以作为 M0 壳证据；不能扩大为 Projects、Assets、Media、Exports、AI 或 Diagnostics 已接入。
- **所有入口当前 release evidence 均为 `none`：** `release_verified` 需要真实安装包和真实输入输出证据；本任务不产生该状态。

## 3. 统一 Result、错误码和 UI 状态文案

### 3.1 Result contract 草案

目标实现应使用可判别结果；UI 只按 `code` 和状态机选择文案，不解析异常字符串，不把 HTTP 200 或 JSON 中的 `success: true` 直接当作交付成功。

```ts
type CapabilityProvenance =
  | "live"
  | "fallback"
  | "mock"
  | "fixture"
  | "unknown";

type CapabilityResult<T> =
  | {
      ok: true;
      value: T;
      provenance: "live";
      correlationId: string;
    }
  | {
      ok: false;
      error: {
        code: ErrorCode;
        message: string;
        retryable: boolean;
        correlationId: string;
        details?: Record<string, unknown>;
      };
      provenance: Exclude<CapabilityProvenance, "live">;
    };
```

`mock`、`fixture` 和 `fallback` 可以用于开发诊断或明确标注的预览，但不能作为正式能力的 `ok: true` 交付结果。若产品仍需要展示它们，必须保留 provenance，并将 UI 状态设为 `mock` 或 `fallback`；导出、发布、付费试点等正式动作必须返回 `MOCK_RESULT_BLOCKED` 或 `RELEASE_EVIDENCE_MISSING`。

### 3.2 错误码表

| ErrorCode                     | 触发条件                                                               | retryable | UI 状态与文案规则                                                         |
| ----------------------------- | ---------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| `UNSUPPORTED_CAPABILITY`      | 当前平台或版本没有该能力                                               | 否        | `当前平台不支持此能力。请查看支持范围。` 不显示示例结果，不创建产物       |
| `MOCK_RESULT_BLOCKED`         | 结果来自 mock/fixture/fallback，却请求正式交付                         | 否        | `当前只有演示结果，不能作为交付或发布证据。`                              |
| `RELEASE_EVIDENCE_MISSING`    | 真实结果存在，但缺少固定 commit、包、输入输出或发行记录                | 否        | `结果尚未完成发行验收，暂不能标记为可发布。`                              |
| `INVALID_INPUT`               | 缺少必填字段、空输入或类型不符                                         | 否        | `输入不完整，请检查标记项。` 保留字段级 details                           |
| `SCHEMA_INVALID`              | 项目、资产、任务或 AI 输出不符合 schema                                | 否        | `数据格式无法识别，未覆盖原文件。` 提供导入/恢复入口                      |
| `PROJECT_NOT_OPEN`            | 没有已打开项目却调用项目能力                                           | 否        | `请先打开项目。`                                                          |
| `PROJECT_SAVE_FAILED`         | 保存、flush、原子替换或恢复文件失败                                    | 条件      | `保存失败，已保留最近一次成功版本。` 不显示“已保存”                       |
| `PROJECT_VERSION_UNSUPPORTED` | 未来版本或未登记迁移版本                                               | 否        | `项目版本暂不支持，原文件未被覆盖。`                                      |
| `PATH_OUTSIDE_PROJECT`        | 路径越过项目根、绝对/UNC/设备路径或符号链接逃逸                        | 否        | `文件路径超出当前项目范围，操作已拒绝。`                                  |
| `ASSET_IMPORT_FAILED`         | 文件不可读、类型/大小不支持或复制/hash 失败                            | 条件      | `资产未导入，请检查文件和项目权限。` 不用远程示例替代                     |
| `ASSET_NOT_FOUND`             | 资产 ID 或受控相对路径不存在                                           | 否        | `找不到资产，项目内容未被替换。`                                          |
| `MEDIA_PROBE_FAILED`          | 真实 probe 失败或二进制不可用                                          | 条件      | `媒体探测失败，未使用模拟数据替代。`                                      |
| `MEDIA_RENDER_FAILED`         | 真实渲染任务失败                                                       | 条件      | `渲染失败，正式输出未生成或已清理。` 提供 job/correlationId               |
| `JOB_CANCELLED`               | 用户取消或任务被安全终止                                               | 否        | `任务已取消，未生成正式目标文件。`                                        |
| `EXPORT_FAILED`               | JSON/DOCX/ZIP 或项目包生成失败                                         | 条件      | `导出失败，未留下可交付产物。`                                            |
| `DISK_SPACE_INSUFFICIENT`     | 预计空间不足或写入中途不足                                             | 否        | `磁盘空间不足，原项目和正式输出未覆盖。`                                  |
| `AI_UNAVAILABLE`              | 无 key、网络不可达、超时或服务不可用                                   | 条件      | `AI 服务当前不可用。可选择明确标注的本地候选解析，但不能称为 AI 已验证。` |
| `AI_AUTH_FAILED`              | key 无效、权限不足或配额拒绝                                           | 否        | `AI 鉴权失败，请检查配置；不会显示模拟成功。`                             |
| `AI_ENDPOINT_REJECTED`        | custom endpoint 不满足 HTTPS、host allowlist、响应 schema 或 SSRF 规则 | 否        | `自定义 AI 地址未通过安全检查。`                                          |
| `DIAGNOSTICS_UNAVAILABLE`     | 当前平台没有日志/健康摘要/诊断入口                                     | 否        | `当前平台没有可用诊断入口。` 不伪造健康状态                               |
| `IPC_SENDER_REJECTED`         | sender、frame、origin 或窗口不可信                                     | 否        | `桌面请求来源未通过安全校验。` 记录 correlationId，不回传 stack           |
| `IPC_PAYLOAD_INVALID`         | IPC payload schema 校验失败                                            | 否        | `桌面请求格式无效，操作未执行。`                                          |
| `SCRIPT_EXECUTION_DISABLED`   | 检测到任意 JS、脚本文件、代码字符串或未登记操作码                      | 否        | `脚本执行已禁用；请使用受控的声明式操作。`                                |

### 3.3 UI 状态文案规则

| UI state             | 进入条件                                                     | 统一显示规则                                                                  |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `idle`               | 尚未执行                                                     | `等待操作`；不暗示后端或发行能力已就绪                                        |
| `loading`            | 已发出真实请求且有 job/correlationId                         | `处理中...`，允许取消时必须可见取消入口                                       |
| `success`            | 仅真实 `provenance: live` 结果，并通过当前环境 contract test | `已完成`；同时显示产物或可复核 ID，不显示虚构版本/大小                        |
| `error`              | 任一结构化错误                                               | 显示稳定 code、简短原因和恢复动作；不把 stack、路径、key 或异常原文直接给用户 |
| `unsupported`        | `UNSUPPORTED_CAPABILITY`                                     | 明确平台和版本边界；禁用继续导出/发布按钮                                     |
| `mock`               | fixture、emulator、模拟日志或示例 URL                        | 固定显示 `演示结果，仅供预览；不能作为交付或发布证据`                         |
| `fallback`           | 本地 fallback 被使用                                         | 固定显示 `已使用本地回退；真实服务结果尚未验证`，不显示正式成功               |
| `needs_verification` | 源码/响应存在但缺测试、包或用户证据                          | `结果待验收`；不能升级 `release_verified`                                     |
| `cancelled`          | 用户或系统取消                                               | `已取消，未生成正式产物`；不得保留残缺正式目标                                |
| `blocked`            | M0/M1、权限、安全或外部证据阻断                              | `当前闸门未开放` 或对应错误码；不提供假成功替代路径                           |

以下文案不得用于真实产品状态：`READY`、`SDK ACTIVE`、`探测数据成功`、`FFmpeg 实时管线渲染成功`、`STS SECURE`、`核心静态库构建就绪`，除非它们同时拥有真实 provenance、当前环境证据和匹配的 release-evidence。源码中的这些标签当前只能按 UI/demo 文案处理。

## 4. Unsupported 清单和脚本执行禁用边界

### 4.1 当前明确 unsupported 或关闭的能力

- M1 项目目录、规范 `ProjectDocument`、保存协调器、迁移、恢复、资产复制、`cinePlayStudio://`、媒体 job、真实 FFmpeg render、OSS、updater 和插件执行均保持关闭。
- Web 不得把浏览器 `localStorage` 宣称为付费项目的真实目录保存；不得把 FileReader 后的元数据登记宣称为本地资产导入。
- 任何 probe/render 失败不得返回模拟 metadata、模拟日志、示例 URL 或 `success: true` 作为正式结果。
- 任何 Web/PC 入口未有实际 adapter/IPC contract 和相应测试时，必须返回 `UNSUPPORTED_CAPABILITY` 或 `needs_verification`，不能根据 UI 按钮、依赖包或旧包推断支持。
- OSS、自动更新、云协作、运行时发布授权和批量/云渲染不属于当前 T06 可开启范围。

### 4.2 脚本执行安全边界

**默认策略：拒绝任意脚本执行。** 项目、资产、AI 返回、导入文件、插件描述、选择动作和导出包都视为不可信输入。

禁止进入产品能力的路径：

- `eval`、`new Function`、`vm`、动态 import 执行用户字符串或项目字符串。
- `actionCode`、`pluginCode`、JS/TS/MJS/CJS/BAT/CMD/PS1/SH 文件的自动编译、热重载或运行。
- 从项目或 AI 输出拼接 shell 参数、调用任意命令、自动运行生成的 launcher，或把脚本写入导出包后宣称可交付。
- 以“沙箱”“虚拟机”“插件”“QTE”或“native bridge”名称绕过上述限制。
- 当前源码中的 `src/components/Player.tsx:95-103,227-247`、`src/components/AssetManager.tsx:628-639` 和 `src/types.ts:24` 相关路径，在后续工程实现前必须先被拒绝、移除或迁移；本轮不修改它们。

允许的后续方向仅限于：

- 使用 schema 校验的声明式操作码，例如 `setVariable`、`addVariable`、`gotoScene`，每个操作码有固定参数类型、白名单和可回放测试。
- 条件使用受限的表达式解析器或已审查的 typed evaluator，不执行任意 JavaScript。
- FFmpeg/FFprobe 只可作为固定 allowlist 的受控子进程；命令参数由 typed contract 生成，使用 `shell: false`，不接受用户命令字符串，并单独记录 job、超时、取消和输出路径。
- 未经单独安全和发行验收，导出包不得自动启动任何 `.bat`、`.cmd`、`.js` 或其他脚本。

遇到代码字符串或未登记操作码，统一返回 `SCRIPT_EXECUTION_DISABLED`，不尝试语法验证、不保存、不执行、不生成“已成功”日志。

## 5. Contract test 清单（只准备，不在本任务执行）

所有测试必须记录：环境、固定 commit、输入 fixture hash、结果、错误码、correlationId、产物路径和失败后清理状态。下表是验收清单，不是已经通过的测试报告。

| ID          | contract test                | 固定输入/边界                                                           | 失败判定                                                                     |
| ----------- | ---------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `T06-CT-01` | 入口完整性                   | 六大入口、每个按钮/菜单、capability id 和平台标签清单                   | 存在未分类入口、按钮宣称的能力没有 contract 或 UI 状态没有映射               |
| `T06-CT-02` | Result 形状                  | success、error、unsupported、mock、fallback 各一 fixture                | 缺 `ok`、`provenance`、`correlationId`、稳定 code，或 UI 解析异常文本        |
| `T06-CT-03` | mock 禁止假成功              | emulator、fallback、示例 URL、演示日志 fixture                          | mock 被标为真实 success、可发布或生成正式交付记录                            |
| `T06-CT-04` | unknown fail-closed          | 未登记 capability、未知平台和缺少 release record                        | 自动猜测支持、返回示例数据或升级为 `release_verified`                        |
| `T06-CT-05` | Web Projects 基线            | 浏览器新建/打开/切换/复制/删除/JSON 导入导出 fixture                    | reload 后状态丢失未报告、非法 JSON 被接受、导出不确定或覆盖原数据            |
| `T06-CT-06` | Project schema/version       | 损坏 JSON、重复 ID、旧版 N、未来版 N+1、空项目                          | 没有 `SCHEMA_INVALID`/`PROJECT_VERSION_UNSUPPORTED`，或错误路径覆盖原文件    |
| `T06-CT-07` | PC project IPC               | 不可信 sender/frame/origin、非法 payload、关闭窗口                      | 没有 `IPC_SENDER_REJECTED`/`IPC_PAYLOAD_INVALID`，或 Main 执行了未授权操作   |
| `T06-CT-08` | save/flush/recovery          | 连续 revision、切换/退出 flush、写入中断、恢复文件                      | UI 先显示已保存、旧 revision 覆盖新 revision、正式文件被损坏覆盖             |
| `T06-CT-09` | Web Assets real bytes        | 一个视频、音频、图片、文档及实际 bytes/hash/MIME                        | 只保存文件名/大小，替换为远程示例 URL，或错误仍记录导入成功                  |
| `T06-CT-10` | Asset path containment       | 中文、空格、超长、`..`、绝对/UNC/设备路径、junction/symlink             | 路径越界、符号链接逃逸或项目外删除未返回 `PATH_OUTSIDE_PROJECT`              |
| `T06-CT-11` | Asset reopen/move            | 项目移动、重开、重复资产、只读文件和 1 GB 流式 fixture                  | 依赖绝对路径、整包读入内存、重开丢失或删除不可恢复                           |
| `T06-CT-12` | Media probe provenance       | 可读本地媒体、损坏媒体、缺失二进制、网络 URL                            | 失败变成 emulator/fallback success，或没有真实 source/hash                   |
| `T06-CT-13` | Media job lifecycle          | start/progress/complete/error/cancel/restart fixture                    | job 状态跳跃、重复完成、取消无效、错误没有稳定 code                          |
| `T06-CT-14` | Render output cleanup        | 字幕/音频/中文路径、损坏输入、磁盘不足、取消                            | 失败/取消留下正式目标文件、返回示例 URL或虚构文件大小                        |
| `T06-CT-15` | Export JSON determinism      | 同一项目两次 JSON 导出、排序、版本字段和相对路径                        | 内容不稳定、含绝对路径/代码/示例 URL或无法再次导入                           |
| `T06-CT-16` | DOCX/ZIP artifact            | 实际项目、空资产、中文路径、损坏输入、取消                              | 只验证 HTTP 200；产物不能打开、内容缺失或无错误清理                          |
| `T06-CT-17` | Export no launcher execution | 含 `.bat`/`.cmd`/`.js` 的项目和生成包                                   | 自动运行脚本，或把 synthetic launcher/log 当正式运行时证据                   |
| `T06-CT-18` | AI unavailable/fallback      | 无 key、无网络、超时、429、无效返回、schema 损坏                        | fallback 被标为已验证 AI、无 provenance、输出无 schema 错误                  |
| `T06-CT-19` | AI endpoint security         | 非 HTTPS、内网/环回、重定向、超时、恶意响应和超大输入                   | SSRF、key 泄漏、无 allowlist 请求或把 custom endpoint 失败当成功             |
| `T06-CT-20` | Diagnostics redaction        | API key、完整剧本、绝对路径、异常 stack、correlationId                  | 日志泄漏敏感数据、UI 暴露 stack或没有可定位错误码                            |
| `T06-CT-21` | Script rejection scan        | `eval`、`new Function`、`vm`、actionCode、pluginCode 和脚本文件 fixture | 任意代码被编译/执行/保存，或未返回 `SCRIPT_EXECUTION_DISABLED`               |
| `T06-CT-22` | Controlled child process     | 仅 allowlist FFmpeg/FFprobe、参数注入、超时和 shell 设置                | shell 拼接、任意命令、用户参数越界、子进程无法取消                           |
| `T06-CT-23` | Web/PC fixture parity        | 同一 schema、同一媒体元数据和同一导出内容                               | 两形态字段、错误码、失败/取消语义不一致                                      |
| `T06-CT-24` | Release evidence gate        | 固定 commit、实际安装包 hash、安装/启动/核心旅程、失败清理和日志        | 只凭源码、fixture、旧包、截图、模拟日志或作者现场操作标为 `release_verified` |

## 6. Release evidence 进入条件

### 6.1 证据层级

1. **源码证据：** 只能证明路径存在或边界已定义，状态为 `source_observed`。
2. **Web 开发证据：** 必须实际运行合法 fixture、失败 fixture 和恢复动作，状态最多为 `dev_verified`。
3. **PC 打包证据：** 必须绑定 commit、安装包 hash、安装启动、业务 IPC、真实本地输入输出、错误/取消/清理和安全门禁，才能讨论 `packaged_verified`。
4. **发行证据：** 必须有目标版本的固定包、可复核构建信息、支持机器实际运行、完整核心旅程、无 mock/fallback 假成功、发行约束和遗留风险记录，才能是 `release_verified`。
5. **商业/用户证据：** 真实外部用户独立完成和付费/交付另行验收；技术证据不能替代用户接受。

### 6.2 本轮明确没有的证据

- 没有 M0 submission commit 的控制面验证；不能从 M0 既有结果或旧包推导 T06 业务能力。
- 没有本矩阵对应的 Web 运行测试、PC 安装包验收、真实媒体导出检查或 artifact hash 记录。
- 没有真实外部用户、设计合作、付费试点、付款或独立交付证据。
- 没有任何入口可标 `release_verified`；所有入口当前 release-evidence 均为 `none / needs verification`。

## 7. T06 准备阶段验收边界

本文件在准备阶段的验收条件：

- 六大入口均有 Web、PC、unsupported、mock、release-evidence 分类，并明确了不确定项。
- 统一 Result、错误码和 UI 状态文案规则已定义；失败、取消、mock、fallback 和 unsupported 不得显示假成功。
- contract test 清单覆盖项目、资产、媒体、导出、AI、诊断、IPC、安全、脚本和 release evidence。
- 脚本执行禁用边界已写明，当前源码冲突已列为后续工程阻断，而不是被文档掩盖。
- M0 submission commit 未验证、M1 工程实现保持关闭；本任务只准备验收边界。

本文件不宣称以下事项已完成：产品源码/IPC 实现、真实项目目录、真实资产导入、真实媒体渲染、打包验收、release_verified、外部用户验收、商业试点或付费结论。
