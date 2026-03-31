# 物理规格：media-studio-vue

## 构建与运行

- **Node**：建议 LTS 20+。
- **包管理**：npm（`package-lock.json`）。
- **开发**：`npm run dev` 或 `dev.py`，默认 `http://localhost:5173`。
- **生产构建**：`npm run build`，输出 `media-studio-vue/dist/`。

## 界面行为（与实现对齐）

- **SDI**：单主窗口布局；无 MDI 子窗口。
- **菜单**：含「多语言」「主题」；主题默认 **跟随系统**，可选浅色/深色。
- **状态栏**：可点击打开 Log；Log 为纯文本 + 全文复制。
- **Dock**：左/右侧可折叠（纵缘条）；**底部时间线** 为 Dock（显示区在上、横缘条贴窗口最下，可折叠）。主行顺序：左 Dock | **分割条** | **客户区（仅预览）** | **分割条** | 右 Dock；**主客户区容器** 下为 **横向分割条** | 底部 Dock。各 Dock **标题栏** 提供 **折叠**、**最大化/还原**；**分割条** 拖动调整左右 Dock 宽度与底部 Dock 高度（`useDockLayout.ts`）。语义见 `detailed-design-ui-shell.md` 与 `.cursor/rules/window-gui-documentation.mdc`。

## 日志 API（前端）

- `log(level, message)`：`info` | `warn` | `error`（及可选 `debug`）。
- 所有级别进入同一 Log 流；状态栏显示最近一条。

## 占位行为

- 「导入媒体」（工具栏与 **媒体库** 内按钮）：`input[type=file]` `multiple`，`accept` 由 `src/composables/mediaAccept.ts` 定义（含 `audio/*`、`video/*`、`image/*` 及视频/音频/图片/MIDI/字幕等扩展名）。导入后为每条素材保留 `File` 与 `URL.createObjectURL`（`useMediaLibrary`），清空项目时 `revokeObjectURL`。
- **媒体库 · 转换为**：右键「转换为…」打开 `ConvertDialog.vue`。**输出格式** 与 **输出文件名后缀** 联动（`replaceExtension` / `watch outputFormat`）。**视频**、**音频** 分组：各组可勾选是否输出（`includeVideo` / `includeAudio`）；纯音频封装（mp3/aac/wav）仅音频组有效。**字幕** 分组：`includeSubtitle`、字幕编码（`copy` / `mov_text` / `webvtt`），对应 `-c:s` 或 `-sn`。**其他信息**：`includeDataStreams`（`-dn` 丢弃数据轨）、`preserveMetadata`（`-map_metadata 0`）。`buildFfmpegArgs` 组装 `-vn`/`-an`、音视频编码与上述流标志。**输出路径** 须通过 **「选择保存位置」**（优先 `showSaveFilePicker`，不支持时退化为文件选择器）指定文件名，并可编辑文本框微调。**开始转换** 后由 `useConversionJob` 调用 **ffmpeg.wasm** 转码；进度展示 **两位小数百分比**、从日志解析的 **当前帧**、按 **时长×估算帧率** 的 **总帧数**（`probeDurationSec` + `fpsEstimate`）、**开始时间**、**已用时间**、**预计剩余**（由进度比与已用时间推算）。完成后写入 **File System Access** 句柄或触发下载，并进入 **完成** 提示页与日志。预览区视频 **不强制静音**，尝试自动 `play()`；若浏览器拦截无用户手势的自动播放，用户可通过控件播放以听到声音。
- **媒体库交互**：**单击** 选中素材 → 右侧 **属性** Dock（`PropertiesPanel.vue`）展示文件名、MIME、大小、修改时间、可选 **时长/分辨率**（音视频由 `useMediaMetadata` 异步探测）、以及 **推断通道列表**（`mediaChannels.ts` / `inferMediaChannels`）；每条通道含 **`detailRows`**（角色、编码线索、流序号、语言、说明等键值，见 `channelDetail.*` i18n），并在音视频可探测时于通道块内追加 **可探测时长/分辨率**。**双击** 同时选中并设为当前 **预览** 目标；客户区 **预览** 根据 `previewKind.ts` 使用 `<video>` / `<audio>` / `<img>` / 文本 `<pre>` 等。**右键菜单**（`MediaLibraryPanel.vue`）：预览、**原始导出**（本地下载）、复制文件名、删除（`removeMediaItem` + 时间线上去除关联片段）。
- **拖拽到时间线**：自媒体库列表 **拖拽** 至时间线区域，`useTimeline` 按素材的 **通道**（视频 / 音频 / 字幕 / 数据）各生成一条 **片段**，显示在对应 **轨行**（`TimelinePanel.vue` 四行：video / audio / subtitle / data）。同素材可多次拖入以重复添加片段。
- **时间线**：位于 **底部 Dock**；含轨行、片段块、缩放滑块占位。

## 错误与边界

- 不支持的文件类型：日志 **warn**，不崩溃。
- 构建失败：非零退出码（npm / test 脚本约定）。
