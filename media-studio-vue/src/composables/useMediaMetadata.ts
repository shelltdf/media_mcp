import { ref, watch, type Ref } from "vue";
import type { MediaItem } from "@/composables/useMediaLibrary";

export interface MediaMetadataInfo {
  durationSec: number | null;
  videoWidth: number | null;
  videoHeight: number | null;
  error: string | null;
}

/**
 * 对选中媒体异步探测时长与分辨率（浏览器可解析时）。
 */
export function useMediaMetadata(selectedItem: Ref<MediaItem | null>) {
  const meta = ref<MediaMetadataInfo>({
    durationSec: null,
    videoWidth: null,
    videoHeight: null,
    error: null,
  });

  watch(
    selectedItem,
    (item) => {
      meta.value = {
        durationSec: null,
        videoWidth: null,
        videoHeight: null,
        error: null,
      };
      if (!item) return;

      const t = item.file.type.toLowerCase();
      const name = item.name.toLowerCase();
      const isVideo =
        t.startsWith("video/") ||
        /\.(mp4|webm|mkv|mov|avi|m4v|ogv)$/i.test(name);
      const isAudio = t.startsWith("audio/") || /\.(mp3|wav|ogg|opus|m4a|aac|flac)$/i.test(name);

      if (!isVideo && !isAudio) {
        return;
      }

      const el = document.createElement(isVideo ? "video" : "audio");
      el.preload = "metadata";
      el.muted = true;
      const url = item.url;

      const cleanup = () => {
        el.removeAttribute("src");
        el.load();
      };

      el.onloadedmetadata = () => {
        const d = el.duration;
        meta.value.durationSec =
          Number.isFinite(d) && !Number.isNaN(d) ? d : null;
        if (isVideo && el instanceof HTMLVideoElement) {
          meta.value.videoWidth = el.videoWidth || null;
          meta.value.videoHeight = el.videoHeight || null;
        }
        cleanup();
      };

      el.onerror = () => {
        meta.value.error = "metadata";
        cleanup();
      };

      el.src = url;
    },
    { immediate: true },
  );

  return { meta };
}
