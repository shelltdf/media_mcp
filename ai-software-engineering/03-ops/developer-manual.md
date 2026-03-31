# 开发维护说明

## 仓库结构

- `ai-software-engineering/`：四阶段文档（概念/逻辑/物理/运维）。
- `media-studio-vue/`：Vue 3 + Vite 实现（**不在**文档目录内）。

## 命令（实现目录内）

| 操作 | 命令 |
|------|------|
| 安装依赖 | `npm install` |
| 开发服务 | `npm run dev` |
| 构建 | `npm run build` |
| 预览构建 | `npm run preview` |
| 测试 | `npm run test` |

## 仓库根 Python 入口

在项目根目录：`build.py`、`test.py`、`run.py`、`publish.py`、`dev.py`（封装 npm，便于统一入口）。

## 依赖与许可证

- 生产依赖归集见仓库根 `THIRD_PARTY_LICENSES.md`；更新 `dependencies` 时请同步该文件。

## 文件对话框位置（导入 / 导出）

- 在支持 **File System Access API** 的浏览器（如 Chromium）中，`showOpenFilePicker` / `showSaveFilePicker` 传入不同的稳定 **`id`**（见 `media-studio-vue/src/constants/filePickerIds.ts`：`media-studio-import` 与 `media-studio-export`），便于浏览器**分别**记忆「上次打开目录」与「上次另存目录」。
- 不支持该 API 时，导入仍回退为 `<input type="file">`，原始导出回退为带 `download` 的 `<a>`（由浏览器下载设置决定路径，应用无法区分记忆）。

## 转换（ffmpeg.wasm）

- 实现位于 `media-studio-vue/src/ffmpeg/`（加载）与 `useConversionJob.ts`（写文件 → `exec` → 读出并保存）。
- **探针**（`probeMedia.ts` / `useFfmpegProbe`）与 **预览转码**（`previewTranscode.ts` / `useFfmpegPreview`）与 **转换为** 共用 **`ffmpegQueue.ts` 串行队列**，避免同一 FFmpeg 实例并行 `exec` 冲突。
- **首次**执行转换时会从 CDN（`cdn.jsdelivr.net` 上 `@ffmpeg/core` 与锁定的 `0.12.6` 一致）下载 **ffmpeg-core.wasm**（体积较大，约数十 MB），需 **可用网络**；后续在同一会话内复用已加载实例。
- 若需离线或内网部署，可将 `ffmpeg-core.js` / `ffmpeg-core.wasm` 拷入 `public/ffmpeg/` 并修改 `loadFFmpeg.ts` 中的 URL 为本地路径后再用 `toBlobURL` 加载。
