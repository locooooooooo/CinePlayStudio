# ICE-03 声明式互动 Runtime

> 状态：planned_not_dispatched
>
> 目标里程碑：E4 L1 创作与互动 Runtime
>
> 上游依赖：ICE-01 verified。

## 目标

用同一套受限条件、动作、变量和存档模型驱动编辑器预览与未来 Web/PC/Android Runtime，移除对任意 JavaScript 执行的产品依赖。

## 范围

- 条件 AST、动作 opcode、变量类型、场景跳转、选择可见性与错误定位。
- 可重放 evaluator、初始状态、选择序列 fixture 和 RuntimeState 存档 schema。
- 编辑器预览与 Runtime Core 的共享测试向量。

## 非目标

- 插件执行、用户脚本、动态 import、DSL 扩展市场或任意自定义逻辑。
- 时间线多轨、媒体渲染、具体 Android/PC 宿主。

## 验收

1. 相同项目、初始状态与选择序列在预览和 Runtime fixture 中得到相同场景/变量结果。
2. 无效变量、非法比较、目标场景缺失和不兼容存档返回稳定错误码。
3. 项目、AI 返回与用户输入不能注入 JS、shell 或 Host API。
4. 每条 opcode 有正反 fixture、单元测试和可定位诊断。
5. 旧的任意执行路径不再构成正式 Runtime 能力。

## 停止条件

任一条件或动作仍依赖 `eval`、`new Function`、字符串拼接脚本或未验证动态执行时，E4 blocked。
