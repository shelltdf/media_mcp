import { ref, type Ref } from "vue";
import type { MediaChannelKind } from "@/composables/mediaChannels";
import type { MediaItem } from "@/composables/useMediaLibrary";

export interface TimelineClip {
  id: string;
  mediaItemId: string;
  channelId: string;
  channelKind: MediaChannelKind;
  /** 片段标签（通常与通道 label 一致） */
  label: string;
  /** 媒体文件名（便于在时间线上辨认） */
  sourceName: string;
}

const clips: Ref<TimelineClip[]> = ref([]);

export function useTimeline() {
  function addClipsFromMediaItem(item: MediaItem) {
    const next: TimelineClip[] = item.channels.map((ch) => ({
      id: crypto.randomUUID(),
      mediaItemId: item.id,
      channelId: ch.id,
      channelKind: ch.kind,
      label: ch.label,
      sourceName: item.name,
    }));
    clips.value = [...clips.value, ...next];
  }

  function clearClips() {
    clips.value = [];
  }

  function clipsForKind(kind: MediaChannelKind): TimelineClip[] {
    return clips.value.filter((c) => c.channelKind === kind);
  }

  return {
    clips,
    addClipsFromMediaItem,
    clearClips,
    clipsForKind,
  };
}
