# P0 General Editor Dispatch Round

> round: `p0-general-editor-dispatch-2026-08-04`
> owner: `大管家`
> state: `absorbed_prepare_only`
> workspace: `D:\CinePlayStudio`

## Objective

推进通用剪辑器 P0，先冻结产品契约、验收证据和工程就绪边界。结构化互动项目只作为后续增强，不占用本轮 P0 工程实现名额。

## Control Gate

- 当前控制面：`M0 commit closeout`
- 当前 dispatch state：`standby`
- M1 工程实现：保持关闭
- 本轮允许：产品文档、验收矩阵、就绪分析和未来派工边界
- 本轮禁止：源码、IPC、项目存储、真实素材导入、FFmpeg 输出、插件执行、Git、凭证和外部发布

## Long-Worker Lanes

| lane       | worker                                                           | scope                                   | allowed write                                                           | state                   |
| ---------- | ---------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- | ----------------------- |
| contract   | `019fccc6-2115-79e1-bee2-ec3c3f1b2319` / P0 产品契约长工（恢复） | P0 产品对象、用户旅程、非目标和错误语义 | `docs/product/p0-general-editor-product-contract-2026-08-04.md`         | `absorbed_prepare_only` |
| acceptance | `019fccc2-f2e6-7062-a0b2-76e41f7d3f5b` / P0 验收矩阵长工         | P0 验收矩阵和证据等级                   | `docs/product/p0-general-editor-acceptance-matrix-2026-08-04.md`        | `absorbed_prepare_only` |
| readiness  | `019fccc6-2115-79e1-bee2-ec541c8708fb` / P0 工程就绪长工（恢复） | M0/M1 真值、源码围栏和派工阻塞          | `docs/orchestration/sessions/p0-general-editor-readiness-2026-08-04.md` | `absorbed_prepare_only` |

## Callback Contract

每个长工必须回执 `changedFiles`、`blockers`、`remainingRisk`、`rollbackPoint`、`nextAction`，并区分产品定义、源码事实、运行验证和用户接受。任何证据不足都保持 `prepare-only` 或 `blocked`，不得升级为 `verified` 或 `accepted`。

## Recovery Record

- 首轮 `multi_agent_v1` 三个 agent 均因外部服务 `503 Service Unavailable` 退出，未产生文件，未记为完成。
- 首轮本地 Codex 会话中，产品契约和工程就绪进入 `systemError`；验收矩阵会话完成后，使用恢复会话重新派发前两条 lane。
- 恢复会话均在隔离 worktree 完成；大管家审阅后只吸收三份指定文档，未吸收任何源码、配置、Git 或发布状态。

## Absorbed Callback

- contract: changedFiles 为指定契约文档；blockers 无；remainingRisk 为 schema、资产导入、真实媒体处理和导出仍未实现/验证；nextAction 为评审契约后再创建 P0-1 任务卡和文件锁。
- acceptance: changedFiles 为指定验收矩阵；blockers 为 M1 关闭、无真实目录/资产复制、无媒体 Job/FFmpeg、无 e2e 和未执行运行/用户验收；nextAction 为 M0 提交验证后按矩阵建立真实 fixture 和垂直切片。
- readiness: changedFiles 为指定就绪 session card；blockers 为 M0 提交和提交后验证；remainingRisk 为人类桌面验收、跨 lane 契约、大文件流式和真实媒体行为；nextAction 为 M0 验证后只开启一个有明确文件锁的候选 lane。

## Next Gate

三份回执已经吸收进本卡和产品 P0 dashboard；只有 M0 提交并完成提交验证，才重新评估是否允许开启 P0 的源码实现派工。当前不宣称 P0 已实现、已测试、已接受或已发布。
