# ICE-08 Android Player Alpha

> 状态：planned_not_dispatched
>
> 目标里程碑：E7 Android Alpha
>
> 上游依赖：ICE-06、ICE-07 verified，以及目标 Android 支持矩阵和签名方案获批准。

## 目标

用同一 Web Runtime 和 Build Manifest 生成受控 Android Player Alpha，验证固定设备范围内的媒体播放、选择、存档、全屏、返回键和音频焦点。

## 范围

- Android Host Adapter、离线资源、存档、音频焦点、返回键、全屏、最小诊断导出。
- APK/AAB 构建、签名职责、固定 Android 版本/设备 smoke。
- 与 Web/PC 共用的 Runtime 一致性测试向量。

## 非目标

- 全机型支持、后台下载、商店发布、热更新、云存档、原生重写 Runtime。
- 未验证设备上的性能或硬件编码承诺。

## 验收

1. 支持矩阵内的设备可安装并离线完成新开局、双路径、存档恢复和错误处理。
2. 返回键、全屏、音频焦点和应用前后台的行为有明确策略与测试记录。
3. Web/PC/Android 对同一选择序列得到相同互动状态。
4. APK/AAB、签名、设备、系统版本、构建 hash 与已知限制可追溯。

## 停止条件

Web Runtime 兼容、PC Player 或固定设备 smoke 任一不成立时，不扩展 Android 机型或申请公开发布。
