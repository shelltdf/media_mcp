import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/** 与 `@ffmpeg/core` 及 `@ffmpeg/ffmpeg` 内置常量一致 */
const CORE_VERSION = "0.12.6";
const CDN_ESM = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/**
 * 懒加载单例；首次会从 CDN 拉取 core js/wasm（约 30MB+ wasm，需网络）。
 * 生产环境可改为 `public/` 本地资源 + toBlobURL 以离线可用。
 */
export async function getLoadedFFmpeg(): Promise<FFmpeg> {
  if (instance?.loaded) return instance;
  if (loading) return loading;

  loading = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${CDN_ESM}/ffmpeg-core.js`,
        "text/javascript",
      ),
      wasmURL: await toBlobURL(
        `${CDN_ESM}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    instance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}
