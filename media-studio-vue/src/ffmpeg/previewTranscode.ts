import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { getPreviewKind } from "@/composables/previewKind";
import { virtualInputName } from "@/ffmpeg/virtualInputName";

const OUT_VIDEO = "preview_ffmpeg.mp4";
const OUT_AUDIO = "preview_ffmpeg.m4a";

/**
 * 将素材转为浏览器友好格式，用于预览（与原始 blob URL 相比更易出声、兼容编码）。
 * 长文件耗时较久；失败时由调用方回退到原始 URL。
 */
export async function buildPreviewBlob(
  ffmpeg: FFmpeg,
  file: File,
): Promise<Blob> {
  const inName = virtualInputName(file);
  const kind = getPreviewKind(file);

  await ffmpeg.writeFile(inName, await fetchFile(file));

  try {
    if (kind === "video") {
      const vCode = await ffmpeg.exec(
        [
          "-i",
          inName,
          "-vf",
          "scale=1280:-2",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          "-y",
          OUT_VIDEO,
        ],
        600000,
      );
      if (vCode !== 0) {
        throw new Error(`preview video ffmpeg code ${vCode}`);
      }
      const raw = await ffmpeg.readFile(OUT_VIDEO);
      if (!(raw instanceof Uint8Array)) {
        throw new Error("preview read");
      }
      return new Blob([raw], { type: "video/mp4" });
    }

    if (kind === "audio") {
      const aCode = await ffmpeg.exec(
        [
          "-i",
          inName,
          "-vn",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-y",
          OUT_AUDIO,
        ],
        600000,
      );
      if (aCode !== 0) {
        throw new Error(`preview audio ffmpeg code ${aCode}`);
      }
      const raw = await ffmpeg.readFile(OUT_AUDIO);
      if (!(raw instanceof Uint8Array)) {
        throw new Error("preview read");
      }
      return new Blob([raw], { type: "audio/mp4" });
    }

    throw new Error("preview kind not supported");
  } finally {
    try {
      await ffmpeg.deleteFile(inName);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(OUT_VIDEO);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(OUT_AUDIO);
    } catch {
      /* ignore */
    }
  }
}
