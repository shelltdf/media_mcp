<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useImportMedia } from "@/composables/useImportMedia";
import { useTimeline } from "@/composables/useTimeline";
import ConvertDialog from "@/components/convert/ConvertDialog.vue";
import { FILE_PICKER_ID_EXPORT } from "@/constants/filePickerIds";

const { t } = useI18n();
const { log } = useLog();
const {
  mediaItems,
  previewItemId,
  selectedItemId,
  setPreview,
  setSelected,
  removeMediaItem,
} = useMediaLibrary();
const { importMedia } = useImportMedia();
const { removeClipsForMediaItem } = useTimeline();

const DRAG_TYPE = "application/x-media-item-id";

const menuOpen = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const contextItemId = ref<string | null>(null);
const menuRoot = ref<HTMLElement | null>(null);

const convertOpen = ref(false);
const convertItemId = ref<string | null>(null);

let docDownHandler: ((e: MouseEvent) => void) | null = null;
let keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

function unbindDocClose() {
  if (docDownHandler) {
    document.removeEventListener("mousedown", docDownHandler, true);
    docDownHandler = null;
  }
  if (keyDownHandler) {
    document.removeEventListener("keydown", keyDownHandler);
    keyDownHandler = null;
  }
}

function closeMenu() {
  menuOpen.value = false;
  contextItemId.value = null;
  unbindDocClose();
}

watch(menuOpen, (open) => {
  if (!open) unbindDocClose();
});

watch(convertOpen, (open) => {
  if (!open) convertItemId.value = null;
});

onUnmounted(() => {
  unbindDocClose();
});

function onClickRow(id: string) {
  if (menuOpen.value) closeMenu();
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

function onContextMenu(e: MouseEvent, id: string) {
  e.preventDefault();
  setSelected(id);
  contextItemId.value = id;
  menuX.value = e.clientX;
  menuY.value = e.clientY;
  menuOpen.value = true;
  nextTick(() => {
    const el = menuRoot.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = menuX.value;
    let y = menuY.value;
    if (x + rect.width > vw) x = Math.max(8, vw - rect.width - 8);
    if (y + rect.height > vh) y = Math.max(8, vh - rect.height - 8);
    menuX.value = x;
    menuY.value = y;

    docDownHandler = (ev: MouseEvent) => {
      if (menuRoot.value?.contains(ev.target as Node)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", docDownHandler, true);
    keyDownHandler = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", keyDownHandler);
  });
}

function contextItem() {
  const id = contextItemId.value;
  if (!id) return null;
  return mediaItems.value.find((m) => m.id === id) ?? null;
}

function actionPreview() {
  const id = contextItemId.value;
  if (!id) return;
  setPreview(id);
  log("info", t("mediaLibrary.ctxLogPreview", { name: contextItem()?.name ?? "" }));
  closeMenu();
}

async function actionExport() {
  const item = contextItem();
  if (!item) return;
  const savePicker = window.showSaveFilePicker;
  if (typeof savePicker === "function") {
    try {
      const handle = await savePicker({
        id: FILE_PICKER_ID_EXPORT,
        suggestedName: item.name,
      });
      const res = await fetch(item.url);
      const buf = await res.arrayBuffer();
      const w = await handle.createWritable();
      await w.write(new Uint8Array(buf));
      await w.close();
      log("info", t("mediaLibrary.ctxLogExport", { name: item.name }));
      closeMenu();
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        closeMenu();
        return;
      }
    }
  }
  const a = document.createElement("a");
  a.href = item.url;
  a.download = item.name;
  a.rel = "noopener";
  a.click();
  log("info", t("mediaLibrary.ctxLogExport", { name: item.name }));
  closeMenu();
}

function actionConvertTo() {
  const id = contextItemId.value;
  if (!id) return;
  convertItemId.value = id;
  convertOpen.value = true;
  closeMenu();
}

const convertMediaItem = computed(() => {
  const id = convertItemId.value;
  if (!id) return null;
  return mediaItems.value.find((m) => m.id === id) ?? null;
});

function actionDelete() {
  const id = contextItemId.value;
  const name = contextItem()?.name ?? "";
  if (!id) return;
  removeClipsForMediaItem(id);
  removeMediaItem(id);
  log("info", t("mediaLibrary.ctxLogDelete", { name }));
  closeMenu();
}

function actionCopyName() {
  const item = contextItem();
  if (!item) return;
  void navigator.clipboard.writeText(item.name).then(
    () => {
      log("info", t("mediaLibrary.ctxLogCopyName", { name: item.name }));
    },
    () => {
      log("warn", t("mediaLibrary.ctxLogCopyFail"));
    },
  );
  closeMenu();
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
        @contextmenu="onContextMenu($event, item.id)"
      >
        {{ item.name }}
      </li>
      <li v-if="!mediaItems.length" class="muted">—</li>
    </ul>

    <Teleport to="body">
      <div
        v-if="menuOpen"
        ref="menuRoot"
        class="ctx-menu"
        role="menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @contextmenu.prevent
      >
        <button type="button" role="menuitem" class="ctx-item" @click="actionPreview">
          {{ t("mediaLibrary.ctxPreview") }}
        </button>
        <button type="button" role="menuitem" class="ctx-item" @click="actionExport">
          {{ t("mediaLibrary.ctxExport") }}
        </button>
        <button type="button" role="menuitem" class="ctx-item" @click="actionConvertTo">
          {{ t("mediaLibrary.ctxConvert") }}
        </button>
        <button type="button" role="menuitem" class="ctx-item" @click="actionCopyName">
          {{ t("mediaLibrary.ctxCopyName") }}
        </button>
        <div class="ctx-sep" role="separator" />
        <button type="button" role="menuitem" class="ctx-item ctx-item--danger" @click="actionDelete">
          {{ t("mediaLibrary.ctxDelete") }}
        </button>
      </div>
    </Teleport>

    <ConvertDialog v-model:open="convertOpen" :media-item="convertMediaItem" />
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

<style>
/* Teleport 到 body，非 scoped，避免被父级裁切 */
.ctx-menu {
  position: fixed;
  z-index: 2000;
  min-width: 160px;
  padding: 4px 0;
  background: var(--bg-panel, #2d2d2d);
  border: 1px solid var(--border, #555);
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

.ctx-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 14px;
  font-size: 12px;
  border: none;
  background: transparent;
  color: var(--text, #e8e8e8);
  cursor: pointer;
}

.ctx-item:hover {
  background: var(--accent, #0078d4);
  color: #fff;
}

.ctx-item--danger:hover {
  background: #c42b1c;
  color: #fff;
}

.ctx-sep {
  height: 1px;
  margin: 4px 8px;
  background: var(--border, #555);
}
</style>
