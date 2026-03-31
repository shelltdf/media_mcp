<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useImportMedia } from "@/composables/useImportMedia";

const { t } = useI18n();
const { mediaItems, previewItemId, selectedItemId, setPreview, setSelected } =
  useMediaLibrary();
const { importMedia } = useImportMedia();

const DRAG_TYPE = "application/x-media-item-id";

function onClickRow(id: string) {
  setSelected(id);
}

function onDblClick(id: string) {
  setSelected(id);
  setPreview(id);
}

function onDragStart(e: DragEvent, itemId: string) {
  e.dataTransfer?.setData(DRAG_TYPE, itemId);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "copy";
  }
}
</script>

<template>
  <div class="media-library">
    <button
      type="button"
      class="import-btn"
      :title="t('app.importMediaHint')"
      @click="importMedia"
    >
      {{ t("app.importMedia") }}
    </button>
    <p class="import-hint" aria-hidden="true">{{ t("app.importMediaHint") }}</p>
    <ul class="media-list">
      <li
        v-for="item in mediaItems"
        :key="item.id"
        class="media-row"
        :class="{
          selected: item.id === selectedItemId,
          previewing: item.id === previewItemId,
        }"
        :title="t('mediaLibrary.rowHint')"
        draggable="true"
        @click="onClickRow(item.id)"
        @dblclick="onDblClick(item.id)"
        @dragstart="onDragStart($event, item.id)"
      >
        {{ item.name }}
      </li>
      <li v-if="!mediaItems.length" class="muted">—</li>
    </ul>
  </div>
</template>

<style scoped>
.media-library {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.import-btn {
  flex: 0 0 auto;
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--bg-toolbar);
  color: var(--text);
}

.import-btn:hover {
  border-color: var(--accent);
  background: var(--bg-panel);
}

.import-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--text-muted);
}

.media-list {
  margin: 0;
  padding-left: 1rem;
  font-size: 12px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.media-row {
  cursor: grab;
  padding: 2px 0;
  border-radius: 2px;
  margin-left: -4px;
  padding-left: 4px;
}

.media-row:active {
  cursor: grabbing;
}

.media-row:hover {
  background: rgba(0, 120, 212, 0.12);
}

.media-row.selected {
  background: rgba(0, 120, 212, 0.22);
  font-weight: 600;
}

.media-row.previewing:not(.selected) {
  box-shadow: inset 2px 0 0 var(--accent);
}

.muted {
  color: var(--text-muted);
}
</style>
