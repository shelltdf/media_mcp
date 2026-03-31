import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import { getPreviewKind } from "@/composables/previewKind";
import type { MediaItem } from "@/composables/useMediaLibrary";
import { runFfmpegExclusive } from "@/ffmpeg/ffmpegQueue";
import { FFMPEG_MAX_PREVIEW_BYTES } from "@/ffmpeg/limits";
import { buildPreviewBlob } from "@/ffmpeg/previewTranscode";

export type FfmpegPreviewStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "skipped_size"
  | "skipped_kind";

/**
 * 预览：后台 ffmpeg 生成 H.264+AAC / AAC，再作为 src；
 * loading 时返回 null（由界面显示等待）；失败或超限时用原始 blob。
 */
export function useFfmpegPreview(previewItem: Ref<MediaItem | null>) {
  const status = ref<FfmpegPreviewStatus>("idle");
  const blobUrl = ref<string | null>(null);

  let gen = 0;

  function revoke() {
    if (blobUrl.value) {
      try {
        URL.revokeObjectURL(blobUrl.value);
      } catch {
        /* ignore */
      }
      blobUrl.value = null;
    }
  }

  watch(
    previewItem,
    (item) => {
      const my = ++gen;
      revoke();
      if (!item) {
        status.value = "idle";
        return;
      }

      const kind = getPreviewKind(item.file);
      if (kind !== "video" && kind !== "audio") {
        status.value = "skipped_kind";
        return;
      }

      if (item.file.size > FFMPEG_MAX_PREVIEW_BYTES) {
        status.value = "skipped_size";
        return;
      }

      status.value = "loading";
      void runFfmpegExclusive((ff) => buildPreviewBlob(ff, item.file))
        .then((blob) => {
          if (my !== gen) return;
          blobUrl.value = URL.createObjectURL(blob);
          status.value = "ready";
        })
        .catch(() => {
          if (my !== gen) return;
          status.value = "error";
        });
    },
    { immediate: true },
  );

  /** loading 时为 null（不指向原始文件，避免先播浏览器再跳变） */
  const displayUrl: ComputedRef<string | null> = computed(() => {
    const item = previewItem.value;
    if (!item) return null;
    if (status.value === "ready" && blobUrl.value) return blobUrl.value;
    if (status.value === "loading") return null;
    return item.url;
  });

  return { status, displayUrl, blobUrl };
}
