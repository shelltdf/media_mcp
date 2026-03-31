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
 * 预览：`useTranscodedPreview === false` 时直接用浏览器解码 `blob:`（易在用户点击播放时出声）；
 * 为 `true` 时用 ffmpeg 转 H.264/AAC（兼容性好，但转码完成往往在「用户手势」之后，自动带声播放常被拦截）。
 */
export function useFfmpegPreview(
  previewItem: Ref<MediaItem | null>,
  useTranscodedPreview: Ref<boolean>,
) {
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
    [previewItem, useTranscodedPreview],
    ([item, useTc]) => {
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

      if (!useTc) {
        status.value = "idle";
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

  /** 浏览器模式：始终为源 blob URL；转码模式：loading 为 null，就绪为转码 blob，否则回退源 URL */
  const displayUrl: ComputedRef<string | null> = computed(() => {
    const item = previewItem.value;
    if (!item) return null;
    if (!useTranscodedPreview.value) return item.url;
    if (status.value === "ready" && blobUrl.value) return blobUrl.value;
    if (status.value === "loading") return null;
    return item.url;
  });

  return { status, displayUrl, blobUrl };
}
