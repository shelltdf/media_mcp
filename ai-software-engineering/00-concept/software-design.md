# 软件设计

## 总体结构

- **交付物**：`media-studio-vue` — 基于 **Vue 3 + Vite** 的 Web 壳（浏览器内呈现 Windows 风格主框架）；音视频管线以 **可插拔模块** 形式挂载于客户区与时间线区域。
- **与文档边界**：实现代码位于仓库内 `media-studio-vue/`（不在 `ai-software-engineering/` 下）。

## 模块划分（逻辑）

| 模块 | 职责 |
|------|------|
| 主框架 | 菜单栏、工具栏、状态栏、主题与语言 |
| 客户区 | 预览与时间线/合成占位（后续接解码与合成引擎） |
| Dock | 媒体库、属性面板；缘条 + 显示区 |
| 日志 | 统一日志流；状态栏摘要 + Log 弹窗纯文本与复制 |
| 国际化 | 中文 / 英文切换 |
| 主题 | 跟随系统 `prefers-color-scheme`，可选浅色/深色覆盖 |

## 与物理层关系

对外行为与目录映射以 `ai-software-engineering/02-physical/media-studio-vue/spec.md` 为准。
