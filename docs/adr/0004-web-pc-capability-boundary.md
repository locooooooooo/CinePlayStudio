# ADR-0004：Web/PC 只在能力适配器层分叉

- 状态：Accepted
- 日期：2026-07-13
- 决策阶段：M0-A
- 影响阶段：M1 及后续全部能力阶段

## Context

GameEditor 要保留现有 React 编辑体验，同时增加 Windows 桌面能力。Web 与 PC 在项目持久化、本地文件授权、媒体子进程、日志、密钥和下载方式上天然不同。如果组件直接判断 `window.gameEditor`、调用 `ipcRenderer` 或按环境拼接 `/api/*`，业务 UI 会形成两套分支，安全校验、错误语义和测试覆盖也会逐步漂移。

强制 Web 与 PC 支持完全相同的底层能力同样不可行。浏览器不能获得 Electron Main 的文件系统和子进程权限，PC 也不应为了复用 Web 路径而通过本地 Express 代理项目文件。

## Decision

React 组件和应用服务只依赖注入的 `AppCapabilities` 接口：

```ts
interface AppCapabilities {
  projects: ProjectRepository;
  assets: AssetRepository;
  media: MediaGateway;
  exports: ExportGateway;
  ai: AiGateway;
  diagnostics: DiagnosticsGateway;
}
```

环境选择只发生在应用 composition root。组件不直接访问 `window.gameEditor`、`ipcRenderer`、Node API、`localStorage` 或桌面专用 `/api/*`，也不通过零散的 `isElectron` 条件改变业务语义。

能力实现边界如下：

| 能力        | Web adapter                                         | PC adapter                             | 共同契约                                |
| ----------- | --------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| Projects    | 保留受控的浏览器存储与显式文件导入/导出             | Preload/IPC 调用 Main 管理用户项目目录 | `ProjectDocument`、revision、稳定错误码 |
| Assets      | 使用浏览器 File/Blob 能力；不承诺持久本地路径所有权 | Main 校验授权后流式复制到项目目录      | 资产元数据、Job 状态、取消语义          |
| Media       | 浏览器原生媒体能力或受控 Web 服务                   | Main 管理的 FFprobe/后续 FFmpeg 子进程 | probe/result schema、进度和错误模型     |
| Exports     | Blob download 或受控 HTTP 服务                      | Main 中的文件与归档 Job                | 显式格式、进度、取消、完成结果          |
| AI          | 受控 HTTP 服务                                      | Main `AiGateway`，密钥不进入 Renderer  | 请求/响应 schema、超时、错误码          |
| Diagnostics | 浏览器安全范围内的诊断信息                          | Main 结构化日志与受控诊断入口          | 脱敏规则、correlationId                 |

Electron 实现只通过窄、类型化的 Preload API 跨越 Renderer/Main 边界；不暴露通用 `ipcRenderer`。Main 必须对 sender、输入和返回值重新校验，不能信任 Preload 或 Renderer 已完成校验。

Web adapter 通过浏览器存储、`fetch` 和 Blob download 实现其可支持的能力。Express 只保留明确的 Web/AI 服务职责，不承担桌面项目文件代理。

某环境不支持的能力必须返回结构化 `UNSUPPORTED_CAPABILITY`。UI 可以据此禁用入口或显示真实限制，但 adapter 不能返回 mock 成功、示例 URL 或模拟日志冒充完成。能力是否可用与执行结果分开表达。

所有 adapter 共享契约、错误码和领域语义；它们可以采用不同 I/O 实现，但不能各自定义第二套项目模型。PC 独有安全信息（绝对路径、密钥、环境变量和子进程句柄）不得进入共同 Renderer 契约。

## Consequences

- 绝大多数 React 组件和业务状态可以在 Web/PC 间复用，环境差异集中在可测试的边界。
- 新增能力时必须同时声明 Web、PC 或 unsupported 行为，不能依赖调用失败后猜测环境。
- 需要维护 adapter contract tests 和两个 composition root 的启动测试。
- Web 不能获得桌面文件系统和媒体子进程能力；PC 也不会为了伪造能力对等而返回模拟成功。
- IPC、HTTP 和浏览器存储的技术细节不会扩散到组件，后续替换实现的影响面更小。

## Rejected Alternatives

### 在每个组件中使用 `isElectron` 或 `window.gameEditor`

拒绝。环境分支会散落在 UI，难以统一错误、加载、取消和测试语义。

### PC 继续通过本地 Express 读写所有项目文件

拒绝。它增加端口、鉴权、路径暴露和生命周期问题，也绕开 Electron Main 的窗口与 sender 授权边界。

### Preload 暴露通用 `ipcRenderer` 或 Node 文件 API

拒绝。通用桥接会使 Renderer 获得无法审计的能力，破坏窄接口和纵深校验。

### 为保持完全一致而把 PC 能力降级为 Web 能力

拒绝。桌面版需要可靠项目目录、大文件流式 I/O、日志和媒体进程；共同契约不等于共同底层实现。

### Web 不支持时返回模拟成功

拒绝。模拟日志、示例下载 URL 或空操作会制造错误验收证据，并可能导致用户数据丢失。

### PC 上移除 Web 版并重写 React UI

拒绝。现有产品价值集中在 React UI 和编辑交互，框架重写不产生桌面能力收益。

## Verification Implications

本 ADR 在 M0 只形成决策证据，不提前实现 M1 capability adapters。

- 为每个 capability 建立共享 contract tests，并分别运行 Web adapter 与 PC adapter；unsupported 是明确的合格结果，不是异常遗漏。
- 静态检查 React 组件，禁止新增 `window.gameEditor`、`ipcRenderer`、Node API、直接 `localStorage` 和桌面专用 fetch 分支。
- PC 集成测试必须证明 Renderer 没有 Node 全局，Preload 不暴露通用 IPC，未知 channel、非法 payload 和未知 sender 被拒绝并记录。
- Web 测试必须证明 unsupported 能力返回 `UNSUPPORTED_CAPABILITY`，不会生成模拟日志、示例 URL 或假完成状态。
- 同一 `ProjectDocument` fixture 在两个 adapter 边界使用同一 schema；错误码与取消、进度和完成语义保持一致。
- dev 和 packaged 模式都必须通过 composition root 启动当前 React UI；packaged 证据不能由 Web/dev 证据替代。
- Express 路由审计必须证明桌面项目文件没有经 HTTP 暴露，AI/Web 服务职责有明确清单。
