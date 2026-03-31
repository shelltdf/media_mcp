import { ref, type Ref } from "vue";

/** 转换对话框收集的选项（后续可对接 ffmpeg / 后端） */
export interface ConversionSettings {
  outputFormat: string;
  videoCodec: string;
  audioCodec: string;
  resolution: string;
  videoBitrateK: number;
  audioBitrateK: number;
  outputFileName: string;
}

export interface ConversionJobState {
  running: Ref<boolean>;
  progress: Ref<number>;
  error: Ref<string | null>;
  run: (settings: ConversionSettings) => Promise<void>;
}

/**
 * 当前为 **演示用** 异步进度（未调用真实编码器）。
 * 接入 ffmpeg.wasm 或后端时，在 `run` 内替换为真实进度回调。
 */
export function useConversionJob(
  onComplete: () => void,
  onError: (msg: string) => void,
): ConversionJobState {
  const running = ref(false);
  const progress = ref(0);
  const error = ref<string | null>(null);

  async function run(_settings: ConversionSettings) {
    error.value = null;
    running.value = true;
    progress.value = 0;
    try {
      const total = 100;
      const stepMs = 42;
      for (let p = 0; p <= total; p++) {
        progress.value = p;
        await new Promise((r) => setTimeout(r, stepMs));
      }
      progress.value = 100;
      onComplete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      error.value = msg;
      onError(msg);
    } finally {
      running.value = false;
    }
  }

  return { running, progress, error, run };
}
