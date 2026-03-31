<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { MediaChannelKind } from "@/composables/mediaChannels";
import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useTimeline } from "@/composables/useTimeline";

const { t } = useI18n();
const { log } = useLog();
const { mediaItems } = useMediaLibrary();
const { addClipsFromMediaItem, clipsForKind } = useTimeline();

const DRAG_TYPE = "application/x-media-item-id";
const zoom = ref(50);

const trackKinds: MediaChannelKind[] = ["video", "audio", "subtitle", "data"];

function clipLabel(clip: { label: string; sourceName: string }) {
  return `${clip.sourceName} · ${clip.label}`;
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "copy";
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const id = e.dataTransfer?.getData(DRAG_TYPE);
  if (!id) return;
  const item = mediaItems.value.find((m) => m.id === id);
  if (!item) return;
  addClipsFromMediaItem(item);
  log(
    "info",
    t("timeline.droppedLog", {
      name: item.name,
      n: String(item.channels.length),
    }),
  );
}
</script>

<template>
  <div class="timeline-panel">
    <div class="timeline-head">
      <span>{{ t("app.timeline") }}</span>
      <label class="zoom">
        {{ t("app.zoom") }}
        <input v-model.number="zoom" type="range" min="10" max="100" />
        <span>{{ zoom }}%</span>
      </label>
    </div>

    <div
      class="timeline-tracks"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <p class="drop-hint">{{ t("timeline.dropHint") }}</p>
      <div
        v-for="kind in trackKinds"
        :key="kind"
        class="track-row"
      >
        <span class="track-label">{{ t(`channelKind.${kind}`) }}</span>
        <div
          class="track-lane"
          :style="{ width: zoom + '%' }"
          @dragover="onDragOver"
          @drop="onDrop"
        >
          <div
            v-for="c in clipsForKind(kind)"
            :key="c.id"
            class="clip-block"
            :data-kind="kind"
            :title="clipLabel(c)"
          >
            {{ clipLabel(c) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  flex: 1;
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text);
  flex: 0 0 auto;
}

.zoom {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.drop-hint {
  margin: 0 0 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.timeline-tracks {
  flex: 1;
  min-height: 120px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-height: 36px;
}

.track-label {
  flex: 0 0 52px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  align-self: center;
  text-align: right;
}

.track-lane {
  flex: 1;
  min-height: 32px;
  min-width: 200px;
  background: repeating-linear-gradient(
    90deg,
    var(--border),
    var(--border) 1px,
    transparent 1px,
    transparent 48px
  );
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 2px 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  align-content: flex-start;
}

.clip-block {
  max-width: 100%;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 2px;
  border: 1px solid var(--border);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clip-block[data-kind="video"] {
  background: rgba(0, 120, 212, 0.25);
}

.clip-block[data-kind="audio"] {
  background: rgba(46, 160, 67, 0.28);
}

.clip-block[data-kind="subtitle"] {
  background: rgba(200, 140, 0, 0.3);
}

.clip-block[data-kind="data"] {
  background: rgba(160, 80, 200, 0.25);
}
</style>
