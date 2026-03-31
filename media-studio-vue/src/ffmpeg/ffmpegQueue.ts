import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { getLoadedFFmpeg } from "@/ffmpeg/loadFFmpeg";

/**
 * 同一页面仅一个 FFmpeg 实例；探针 / 预览转码 / 转换任务必须串行，避免 MEMFS 与 worker 状态冲突。
 */
let chain: Promise<unknown> = Promise.resolve();

export function runFfmpegExclusive<T>(
  fn: (ffmpeg: FFmpeg) => Promise<T>,
): Promise<T> {
  const next = chain.then(() => getLoadedFFmpeg().then(fn));
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
