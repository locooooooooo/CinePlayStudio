# ADR-0002：唯一规范项目模型

- 状态：Accepted
- 日期：2026-07-13
- 决策阶段：M0-A
- 影响阶段：M2、M3、M4

## Context

当前原型在内部状态、播放器导出、服务端 ZIP 和浏览器存储中存在多种项目 JSON 形态。字段命名、时间表示、资产信息和时间轴结构不一致，使导入、保存、备份、发布和迁移可能各自演进并产生静默数据丢失。

TypeScript 类型只能约束编译期代码，不能证明磁盘文件、旧浏览器数据、IPC payload 或导入包在运行时有效。桌面版还需要识别旧版本、未来版本和损坏文件，并在拒绝写入时保留恢复路径。

## Decision

`shared/contracts/project.ts` 中的 Zod schema 是规范项目模型的运行时事实来源，TypeScript 类型从 schema 推导；若受工具限制必须手写类型，则用同步测试证明二者一致。

规范根对象名为 `ProjectDocument`，至少包含以下字段：

```ts
interface ProjectDocument {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  scenes: SceneNode[];
  timelines: Record<string, TimelineTrack[]>;
  assets: MediaAsset[];
  variables: ProjectVariable[];
  folders: AssetFolder[];
  tags: AssetTag[];
  pluginDescriptors: PluginDescriptor[];
  settings: ProjectSettings;
}
```

模型遵守以下不变量：

- `schemaVersion` 从整数 `1` 开始。
- 时间统一保存为 ISO 8601 UTC 字符串，不混用本地时间、epoch 或展示文本。
- 所有项目内实体 ID 在各自约束域内唯一，导入和迁移时检测冲突。
- 文件大小等可计算值使用基础数值单位，例如 `sizeBytes: number`，不保存 `"18.4 MB"` 等展示字符串。
- 资产位置使用项目根目录下的 POSIX 风格相对路径。
- `pluginDescriptors` 只包含静态、不可执行的描述数据；MVP schema 不接收脚本源码或函数字符串。
- 保存 revision、IPC `requestId` 和 `correlationId` 属于传输或保存协调元数据，不混入 `ProjectDocument`，除非后续 ADR 明确改变持久化协议。

内部保存、项目备份导入和 ZIP 项目 manifest 都必须读取或产生 `ProjectDocument`。面向播放器的 `PublishedProjectManifest` 可以是独立模型，但只能由经过测试的显式转换器从 `ProjectDocument` 生成；组件和服务不能自行拼装另一种项目 JSON。

所有外部输入先以 `unknown` 接收并在边界校验。当前原型和旧 Web 数据通过独立 legacy importer 转换，不能让 legacy 字段渗入规范模型。导入前保留原始输入，以便迁移失败时诊断和恢复。

版本迁移只允许按 `N -> N+1` 顺序执行。未知的更高版本必须只读打开或拒绝打开，绝不能按当前版本覆盖保存。迁移失败返回稳定错误码和恢复位置，不能静默生成空项目。

## Consequences

- 保存、恢复、导入、发布和测试围绕一个数据契约，字段变更必须显式版本化。
- 运行时校验会增加打开和保存时的 CPU 成本；项目规模扩大后需要测量解析与序列化耗时，不能跳过校验换取表面性能。
- legacy 数据需要一次性边界适配器和固定 fixtures，但核心组件无需长期兼容多套字段。
- 发布模型与编辑模型可以独立演进，但转换过程成为必须测试的有损边界。
- schema 变更需要迁移、fixture 和兼容性说明，不能只修改 TypeScript interface。

## Rejected Alternatives

### 保留多种项目 JSON，由各功能按需转换

拒绝。转换会分散在组件、服务端和导出逻辑中，难以证明无字段丢失，也会扩大回归面。

### 只使用 TypeScript interface，不做运行时校验

拒绝。磁盘、IPC、浏览器存储和导入文件都不受编译器保护。

### 使用无版本 schema 或一次跨多版本迁移

拒绝。无法稳定识别兼容范围，也难以为每一步建立可重复、可回滚的迁移证据。

### 直接把编辑模型作为播放器发布格式

拒绝。编辑状态与运行时发布需求不同。隐式共用会泄漏编辑器内部字段，并阻止发布格式独立优化。

### 接受未知字段并在保存时原样透传

拒绝作为默认行为。它会掩盖拼写错误和未声明数据。未来兼容必须通过明确版本和迁移策略实现。

## Verification Implications

本 ADR 在 M0 只形成决策证据，不提前实现 M2。

- 为每个 `schemaVersion` 提供有效、边界、损坏和恶意输入 fixtures。
- schema 测试必须覆盖重复 ID、非法 UTC 时间、非数值大小、绝对资产路径、未知可执行插件字段和缺失必填字段。
- 每个迁移步骤必须有固定输入/输出测试，并验证顺序执行和幂等性。
- 更高未知版本必须验证为只读或明确拒绝，且原文件内容不被覆盖。
- legacy importer 必须保留原始输入，并证明相同输入得到确定性结果；失败不能生成空项目。
- `ProjectDocument -> PublishedProjectManifest` 必须有字段映射测试和明确的有损字段清单。
- 保存前后 round-trip 测试必须证明规范数据不丢失，展示格式不会写回持久模型。
- 使用固定大型项目 fixture 测量校验与序列化；若 Renderer 出现超过 50 ms 的 long task，应调整快照或 Worker 策略，而不是关闭 schema 校验。
