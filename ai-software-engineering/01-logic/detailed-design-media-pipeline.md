# 详细设计：音视频处理管线（浏览器内）

## 现状概要

当前实现以 **ffmpeg.wasm**（`@ffmpeg/ffmpeg`、`@ffmpeg/core`、`@ffmpeg/util`）在浏览器内完成 **探针**、**预览转码** 与 **右键「转换为…」** 导出；三类任务与 **时间线/客户区** 共享 **同一 FFmpeg 实例**，并通过 **`ffmpegQueue.ts` 串行队列** 互斥执行，避免并行 `exec` 冲突。

权威字段、对话框选项与边界条件见 `02-physical/media-studio-vue/spec.md` 与源码映射 `mapping.md`。

## 数据流（导入 → 内存）

1. **导入**：`input[type=file]` / File System Access，`accept` 由 `mediaAccept.ts` 约束。
2. **内存表示**：`useMediaLibrary` 为每条素材保留 `File` 与 `URL.createObjectURL`；清空项目时 `revokeObjectURL`。
3. **通道推断**：`mediaChannels.ts`（`inferMediaChannels`）为列表/属性/时间线提供 **视频 / 音频 / 字幕 / 数据** 通道视图；可与探针结果合并展示。

## 探针（属性面板）

- **入口**：`useFfmpegProbe` + `probeMedia.ts`；超大文件可跳过（见界面提示与日志）。
- **用途**：为属性面板提供时长、分辨率、编码、采样率等，供 **ffmpeg 探针** 行展示；与 `useMediaMetadata` 浏览器侧信息 **优先合并**。

## 预览转码（客户区）

- **入口**：`useFfmpegPreview` + `previewTranscode.ts`；用户可通过选项 **启用/禁用 FFmpeg 转码预览**（禁用则尽量用浏览器直接解码 blob URL）。
- **队列**：经 `ffmpegQueue.ts` 入队；完成后在客户区用 `<video>` / `<audio>` 等展示（见 `previewKind.ts` 与非音视频类型分支）。

## 转换（导出）

- **入口**：媒体库右键「转换为…」→ `ConvertDialog.vue`；参数组装 `buildFfmpegArgs.ts`；执行 `useConversionJob.ts`。
- **输出**：优先 File System Access **句柄** 写入；否则触发下载。首次运行需从 CDN 加载 wasm 核心（需网络）；可改为本地 `public/ffmpeg/`（见 `developer-manual.md`）。

## 时间线（占位编排）

- **拖拽**：自媒体库拖到时间线 → `useTimeline` 按通道生成 **片段**，`TimelinePanel.vue` 多轨展示。
- **与解码关系**：时间线当前为 **编排与展示**；重放/合成导出等后续迭代再扩展，仍通过明确 TS 接口与 UI 解耦（与 `system-design.md` 一致）。

## 后续可选扩展（未锁定）

- **WebCodecs / Web Audio**：按格式与性能补充或替代部分路径。
- **桌面壳**：Electron / Tauri 等便于调用本地 FFmpeg；程序间接口见 `interface-design.md`。
