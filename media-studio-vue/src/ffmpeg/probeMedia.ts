import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { virtualInputName } from "@/ffmpeg/virtualInputName";

export interface FfmpegProbeResult {
  durationSec: number | null;
  videoWidth: number | null;
  videoHeight: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  audioSampleRate: number | null;
  /** 如 stereo、mono、5.1 */
  audioChannelLayout: string | null;
}

function parseDurationSec(text: string): number | null {
  const m = text.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  const sec = parseFloat(m[3]!);
  return h * 3600 + min * 60 + sec;
}

/** 从 ffmpeg -i 输出中解析流信息（不同版本略有差异，尽量宽松） */
export function parseFfmpegInfoLog(log: string): FfmpegProbeResult {
  const out: FfmpegProbeResult = {
    durationSec: parseDurationSec(log),
    videoWidth: null,
    videoHeight: null,
    videoCodec: null,
    audioCodec: null,
    audioSampleRate: null,
    audioChannelLayout: null,
  };

  const lines = log.split(/\r?\n/);
  for (const line of lines) {
    if (/Stream\s+#\d+:\d+/.test(line) && /Video:/.test(line)) {
      const codecM = line.match(/Video:\s*([^,(]+)/);
      if (codecM) out.videoCodec = codecM[1]!.trim().split(/\s+/)[0] ?? null;

      const dimM = line.match(/(\d{2,})x(\d{2,})/);
      if (dimM) {
        out.videoWidth = parseInt(dimM[1]!, 10);
        out.videoHeight = parseInt(dimM[2]!, 10);
      }
    }
    if (/Stream\s+#\d+:\d+/.test(line) && /Audio:/.test(line)) {
      const codecM = line.match(/Audio:\s*([^,(]+)/);
      if (codecM && !out.audioCodec) {
        out.audioCodec = codecM[1]!.trim().split(/\s+/)[0] ?? null;
      }

      /* 常见：48000 Hz；部分版本为 44100, stereo 无 Hz */
      if (out.audioSampleRate == null) {
        const hzM = line.match(/(\d+)\s*Hz/i);
        if (hzM) out.audioSampleRate = parseInt(hzM[1]!, 10);
      }
      /* 例：pcm_s16le, 44100, stereo（无 Hz 字样） */
      if (out.audioSampleRate == null && /Audio:/.test(line)) {
        const m = line.match(
          /,\s*(\d{4,6})\s*,\s*(mono|stereo|quad|fltp|s16\b|s32\b)/i,
        );
        if (m) out.audioSampleRate = parseInt(m[1]!, 10);
      }

      if (!out.audioChannelLayout) {
        const layoutM = line.match(
          /(?:Hz,\s*|,\s*)(mono|stereo|quad|4\.0|5\.1|7\.1|unknown)\b/i,
        );
        if (layoutM) out.audioChannelLayout = layoutM[1]!.toLowerCase();
      }
    }
  }

  return out;
}

/**
 * 将文件写入 MEMFS 并执行一次空输出，从日志解析容器与流信息。
 */
export async function probeMediaFile(
  ffmpeg: FFmpeg,
  file: File,
): Promise<FfmpegProbeResult> {
  const name = virtualInputName(file);
  const lines: string[] = [];
  const onLog = ({ message }: { message: string }) => {
    lines.push(message);
  };
  ffmpeg.on("log", onLog);
  try {
    await ffmpeg.writeFile(name, await fetchFile(file));
    try {
      await ffmpeg.exec(
        ["-hide_banner", "-i", name, "-f", "null", "-"],
        180000,
      );
    } catch {
      /* 无输出或错误退出时仍可能已打印 Input/Stream */
    }
  } finally {
    ffmpeg.off("log", onLog);
    try {
      await ffmpeg.deleteFile(name);
    } catch {
      /* ignore */
    }
  }
  return parseFfmpegInfoLog(lines.join("\n"));
}
