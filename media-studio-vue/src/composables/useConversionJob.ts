import { reactive, ref, type Ref } from "vue";
import { fetchFile } from "@ffmpeg/util";
import { runFfmpegExclusive } from "@/ffmpeg/ffmpegQueue";
import { buildFfmpegArgs } from "@/ffmpeg/buildFfmpegArgs";
import { virtualInputName } from "@/ffmpeg/virtualInputName";

/** 转换对话框收集的选项 */
export interface ConversionSettings {
  outputFormat: string;
  /** 是否输出视频轨（纯音频封装格式下由 UI 强制为 false） */
  includeVideo: boolean;
  includeAudio: boolean;
  videoCodec: string;
  audioCodec: string;
  resolution: string;
  videoBitrateK: number;
  audioBitrateK: number;
  outputFileName: string;
  /** 用于估算总帧数 */
  durationSec: number | null;
  /** 估算帧率，用于帧数/总帧数展示 */
  fpsEstimate: number;
  /** 输出内嵌字幕轨（视频封装） */
  includeSubtitle: boolean;
  /** 字幕编码：copy / mov_text(MP4) / webvtt(WebM) */
  subtitleCodec: "copy" | "mov_text" | "webvtt";
  /** 是否保留数据轨（时间码、附件等）；false 时 -dn */
  includeDataStreams: boolean;
  /** 是否复制容器元数据（章节、标签等，尽力而为） */
  preserveMetadata: boolean;
}

/** 执行转码时的输入与输出目标 */
export interface ConversionRunContext {
  inputFile: File;
  saveFileHandle: FileSystemFileHandle | null;
}

export interface ConversionProgressDetail {
  /** 0–100，保留两位小数 */
  percent: number;
  currentFrame: number | null;
  totalFrames: number | null;
  startedAt: number | null;
  elapsedSec: number;
  etaSec: number | null;
}

export interface ConversionJobState {
  running: Ref<boolean>;
  /** 与 progressDetail.percent 同步，便于旧模板绑定 */
  progress: Ref<number>;
  progressDetail: ConversionProgressDetail;
  error: Ref<string | null>;
  resetProgressUi: () => void;
  run: (
    settings: ConversionSettings,
    ctx: ConversionRunContext,
  ) => Promise<void>;
}

const FRAME_RE = /frame=\s*(\d+)/;

async function writeOutputFile(
  data: Uint8Array,
  downloadName: string,
  handle: FileSystemFileHandle | null,
): Promise<void> {
  if (handle) {
    const w = await handle.createWritable();
    await w.write(data);
    await w.close();
    return;
  }
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName;
  a.click();
  URL.revokeObjectURL(url);
}

export function useConversionJob(
  onComplete: () => void,
  onError: (msg: string) => void,
): ConversionJobState {
  const running = ref(false);
  const progress = ref(0);
  const error = ref<string | null>(null);

  const progressDetail = reactive<ConversionProgressDetail>({
    percent: 0,
    currentFrame: null,
    totalFrames: null,
    startedAt: null,
    elapsedSec: 0,
    etaSec: null,
  });

  let tickTimer: ReturnType<typeof setInterval> | null = null;

  function stopTick() {
    if (tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function resetProgressUi() {
    stopTick();
    progressDetail.percent = 0;
    progressDetail.currentFrame = null;
    progressDetail.totalFrames = null;
    progressDetail.startedAt = null;
    progressDetail.elapsedSec = 0;
    progressDetail.etaSec = null;
    progress.value = 0;
  }

  function startTick() {
    stopTick();
    tickTimer = setInterval(() => {
      if (progressDetail.startedAt == null) return;
      progressDetail.elapsedSec =
        (Date.now() - progressDetail.startedAt) / 1000;
      const p = progressDetail.percent / 100;
      if (p > 0.001 && p < 0.999) {
        progressDetail.etaSec =
          (progressDetail.elapsedSec / p) * (1 - p);
      } else {
        progressDetail.etaSec = null;
      }
    }, 200);
  }

  function validChannels(s: ConversionSettings): boolean {
    if (["mp3", "aac", "wav"].includes(s.outputFormat)) return true;
    return s.includeVideo || s.includeAudio;
  }

  async function run(
    settings: ConversionSettings,
    ctx: ConversionRunContext,
  ): Promise<void> {
    error.value = null;
    running.value = true;
    resetProgressUi();

    if (!validChannels(settings)) {
      running.value = false;
      onError("ERR_NO_CHANNEL");
      return;
    }

    const inName = virtualInputName(ctx.inputFile);
    const outName = `out.${settings.outputFormat}`;

    const onProg = (ev: { progress: number }) => {
      const pct = Math.min(100, Number((ev.progress * 100).toFixed(2)));
      progressDetail.percent = pct;
      progress.value = pct;
    };

    const onLog = (ev: { message: string }) => {
      const m = FRAME_RE.exec(ev.message);
      if (m) {
        progressDetail.currentFrame = parseInt(m[1]!, 10);
      }
    };

    try {
      const dur = settings.durationSec;
      const fps = settings.fpsEstimate > 0 ? settings.fpsEstimate : 30;
      progressDetail.totalFrames =
        dur != null && Number.isFinite(dur)
          ? Math.max(1, Math.round(dur * fps))
          : null;

      await runFfmpegExclusive(async (ffmpeg) => {
        ffmpeg.on("progress", onProg);
        ffmpeg.on("log", onLog);
        try {
          await ffmpeg.writeFile(inName, await fetchFile(ctx.inputFile));
          progressDetail.percent = 0;
          progress.value = 0;
          progressDetail.startedAt = Date.now();
          progressDetail.elapsedSec = 0;
          startTick();

          const args = buildFfmpegArgs(settings, inName, outName);
          const code = await ffmpeg.exec(args);
          if (code !== 0) {
            throw new Error(`ffmpeg exit code ${code}`);
          }

          const raw = await ffmpeg.readFile(outName);
          if (!(raw instanceof Uint8Array)) {
            throw new Error("Unexpected ffmpeg output (non-binary)");
          }
          await writeOutputFile(raw, settings.outputFileName, ctx.saveFileHandle);
        } finally {
          ffmpeg.off("progress", onProg);
          ffmpeg.off("log", onLog);
          try {
            await ffmpeg.deleteFile(inName);
          } catch {
            /* ignore */
          }
          try {
            await ffmpeg.deleteFile(outName);
          } catch {
            /* ignore */
          }
        }
      });

      progressDetail.percent = 100;
      progress.value = 100;
      progressDetail.etaSec = 0;
      stopTick();
      onComplete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      error.value = msg;
      onError(msg);
    } finally {
      stopTick();
      running.value = false;
    }
  }

  return { running, progress, progressDetail, error, resetProgressUi, run };
}
