import { computed, ref, type ComputedRef, type Ref } from "vue";
import { getPreviewKind, type PreviewKind } from "@/composables/previewKind";
import {
  inferMediaChannels,
  type MediaChannel,
} from "@/composables/mediaChannels";

export interface MediaItem {
  id: string;
  name: string;
  file: File;
  /** `URL.createObjectURL(file)`，在 remove/clear 时 revoke */
  url: string;
  /** 启发式推断的媒体内通道（视频轨、音轨、字幕轨等） */
  channels: MediaChannel[];
}

const mediaItems: Ref<MediaItem[]> = ref([]);
const previewItemId: Ref<string | null> = ref(null);
const selectedItemId: Ref<string | null> = ref(null);

function revokeItemUrl(item: MediaItem) {
  try {
    URL.revokeObjectURL(item.url);
  } catch {
    /* ignore */
  }
}

export function useMediaLibrary() {
  const previewItem: ComputedRef<MediaItem | null> = computed(() => {
    const id = previewItemId.value;
    if (!id) return null;
    return mediaItems.value.find((m) => m.id === id) ?? null;
  });

  const selectedItem: ComputedRef<MediaItem | null> = computed(() => {
    const id = selectedItemId.value;
    if (!id) return null;
    return mediaItems.value.find((m) => m.id === id) ?? null;
  });

  const previewKind: ComputedRef<PreviewKind> = computed(() => {
    const item = previewItem.value;
    if (!item) return "none";
    return getPreviewKind(item.file);
  });

  function setPreview(id: string | null) {
    previewItemId.value = id;
  }

  function setSelected(id: string | null) {
    selectedItemId.value = id;
  }

  function add(file: File) {
    const url = URL.createObjectURL(file);
    const item: MediaItem = {
      id: crypto.randomUUID(),
      name: file.name,
      file,
      url,
      channels: inferMediaChannels(file),
    };
    mediaItems.value = [...mediaItems.value, item];
  }

  function clear() {
    for (const item of mediaItems.value) {
      revokeItemUrl(item);
    }
    mediaItems.value = [];
    previewItemId.value = null;
    selectedItemId.value = null;
  }

  /** 删除单条素材并释放对象 URL；若当前预览/选中指向该项则清空 */
  function removeMediaItem(id: string) {
    const item = mediaItems.value.find((m) => m.id === id);
    if (!item) return;
    revokeItemUrl(item);
    mediaItems.value = mediaItems.value.filter((m) => m.id !== id);
    if (previewItemId.value === id) previewItemId.value = null;
    if (selectedItemId.value === id) selectedItemId.value = null;
  }

  return {
    mediaItems,
    previewItemId,
    selectedItemId,
    previewItem,
    selectedItem,
    previewKind,
    setPreview,
    setSelected,
    add,
    clear,
    removeMediaItem,
  };
}
