# ICE-06 Web Runtime 构建

> 状态：planned_not_dispatched
>
> 目标里程碑：E5 Web Build
>
> 上游依赖：ICE-03、ICE-04、ICE-05 verified。

## 目标

从已验证的项目 revision 生成一个可部署的 Web 互动包，并在支持的浏览器中以同一 Runtime 运行双路径、存档和媒体加载。

## 范围

- Build Manifest、资源枚举/hash、Runtime 版本、目标兼容性与静态输出目录。
- Web Runtime 启动、选择、变量、最小存档、错误页和诊断导出。
- Chrome/Edge 支持矩阵、静态托管 smoke、构建取消/失败清理。

## 非目标

- 内容社区、CDN 运营、付费墙、观众账号、任意托管商支持。
- Android/PC Player、动态热更新、云端素材下载。

## 验收

1. 构建只接受 verified project revision，产物含 manifest、Runtime、资源与 hash 结果。
2. 静态包在支持浏览器中可完成新开局、双路径、存档恢复与缺失资源错误处理。
3. 同一选择序列与编辑器/Runtime fixture 的场景和变量结果一致。
4. 构建失败、取消、hash 不匹配或 Runtime 不兼容时不产生可发布假产物。
5. 目标产物、执行命令、浏览器版本、SHA256 和残余限制独立落档。

## 停止条件

若 Web 包依赖开发服务器、编辑器进程、未打包本地路径或示例远程资源，E5 blocked。
