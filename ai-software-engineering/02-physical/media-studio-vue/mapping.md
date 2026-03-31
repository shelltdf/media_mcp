# 模型元素 → 源码映射

| 元素 | 路径 |
|------|------|
| 应用入口 | `media-studio-vue/src/main.ts` |
| 根组件 | `media-studio-vue/src/App.vue` |
| SDI 主框架 | `media-studio-vue/src/components/layout/MainFrame.vue` |
| 日志与状态栏 | `media-studio-vue/src/composables/useLog.ts`、`components/layout/StatusBar.vue` |
| 主题 | `media-studio-vue/src/composables/useTheme.ts` |
| 国际化 | `media-studio-vue/src/locales/*`、`vue-i18n`（`main.ts`） |
| 媒体列表状态 | `media-studio-vue/src/composables/useMediaLibrary.ts` |
| 导入与 accept 列表 | `media-studio-vue/src/composables/useImportMedia.ts`、`mediaAccept.ts` |
| 预览类型判定 | `media-studio-vue/src/composables/previewKind.ts` |
| 媒体库面板 | `media-studio-vue/src/components/media/MediaLibraryPanel.vue` |
| 属性面板 | `media-studio-vue/src/components/properties/PropertiesPanel.vue` |
| 通道推断 | `media-studio-vue/src/composables/mediaChannels.ts` |
| 媒体元数据（时长等） | `media-studio-vue/src/composables/useMediaMetadata.ts` |
| 时间线状态 | `media-studio-vue/src/composables/useTimeline.ts` |
| Dock 缘条/面板（左/右/底） | `media-studio-vue/src/components/layout/DockSide.vue` |
| Dock 尺寸/折叠/最大化与分割条事件 | `media-studio-vue/src/composables/useDockLayout.ts` |
| 主框架内分割条 | `media-studio-vue/src/components/layout/MainFrame.vue`（`dock-splitter`） |
| 时间线 Dock 内容 | `media-studio-vue/src/components/timeline/TimelinePanel.vue` |
| 客户区（预览） | `media-studio-vue/src/components/workspace/Workspace.vue` |
