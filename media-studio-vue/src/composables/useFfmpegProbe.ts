import { ref, watch, type Ref } from "vue";
import type { MediaItem } from "@/composables/useMediaLibrary";
import { runFfmpegExclusive } from "@/ffmpeg/ffmpegQueue";
import { FFMPEG_MAX_PROBE_BYTES } from "@/ffmpeg/limits";
import {
  type FfmpegProbeResult,
  probeMediaFile,
} from "@/ffmpeg/probeMedia";

export type FfmpegProbeStatus =
  | "idle"
  | "loading"
  | "done"
  | "error"
  | "skipped_size";

export function useFfmpegProbe(selectedItem: Ref<MediaItem | null>) {
  const status = ref<FfmpegProbeStatus>("idle");
  const probe = ref<FfmpegProbeResult | null>(null);

  let gen = 0;

  watch(
    selectedItem,
    (item) => {
      const my = ++gen;
      probe.value = null;
      if (!item) {
        status.value = "idle";
        return;
      }
      if (item.file.size > FFMPEG_MAX_PROBE_BYTES) {
        status.value = "skipped_size";
        return;
      }

      status.value = "loading";
      void runFfmpegExclusive((ff) => probeMediaFile(ff, item.file))
        .then((r) => {
          if (my !== gen) return;
          probe.value = r;
          status.value = "done";
        })
        .catch(() => {
          if (my !== gen) return;
          status.value = "error";
        });
    },
    { immediate: true },
  );

  return { status, probe };
}
