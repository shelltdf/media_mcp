<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getPreviewKind } from "@/composables/previewKind";
import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useImportMedia } from "@/composables/useImportMedia";
import { useTimeline } from "@/composables/useTimeline";

const { t } = useI18n();
const { log } = useLog();
const { clear, previewItem, previewKind } = useMediaLibrary();
const { importMedia } = useImportMedia();
const { clearClips } = useTimeline();

const previewText = ref("");

watch(
  previewItem,
  async (item) => {
    previewText.value = "";
    if (!item) return;
    if (getPreviewKind(item.file) === "text") {
      try {
        previewText.value = await item.file.text();
      } catch {
        previewText.value = t("app.previewTextError");
      }
    }
  },
  { immediate: true },
);

function newProject() {
  clear();
  clearClips();
  log("info", "New project (placeholder).");
}

defineExpose({ importMedia, newProject });
</script>

<template>
  <div class="workspace">
    <div class="preview">
      <template v-if="!previewItem">
        <span class="preview-label">{{ t("app.preview") }}</span>
        <span class="preview-hint">{{ t("app.previewEmptyHint") }}</span>
      </template>
      <template v-else-if="previewKind === 'video'">
        <video
          class="preview-media"
          controls
          playsinline
          :src="previewItem.url"
        />
        <span class="preview-caption">{{ previewItem.name }}</span>
      </template>
      <template v-else-if="previewKind === 'audio'">
        <audio class="preview-audio" controls :src="previewItem.url" />
        <span class="preview-caption">{{ previewItem.name }}</span>
      </template>
      <template v-else-if="previewKind === 'image'">
        <img
          class="preview-img"
          :src="previewItem.url"
          :alt="previewItem.name"
        />
        <span class="preview-caption">{{ previewItem.name }}</span>
      </template>
      <template v-else-if="previewKind === 'text'">
        <pre class="preview-text">{{ previewText }}</pre>
        <span class="preview-caption">{{ previewItem.name }}</span>
      </template>
      <template v-else-if="previewKind === 'midi'">
        <span class="preview-label">{{ t("app.previewMidiHint") }}</span>
        <span class="preview-caption">{{ previewItem.name }}</span>
      </template>
      <template v-else>
        <span class="preview-label">{{ t("app.previewUnsupported") }}</span>
        <span class="preview-caption">{{ previewItem.name }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--bg-workspace);
}

.preview {
  flex: 1;
  min-height: 120px;
  background: var(--preview-bg);
  color: #888;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  min-height: 0;
}

.preview-label {
  font-size: 13px;
}

.preview-hint {
  font-size: 12px;
  color: var(--text-muted, #888);
}

.preview-media {
  max-width: 100%;
  max-height: calc(100% - 28px);
  flex: 1;
  min-height: 80px;
  background: #000;
}

.preview-audio {
  width: 100%;
  max-width: 400px;
}

.preview-img {
  max-width: 100%;
  max-height: calc(100% - 36px);
  flex: 1;
  min-height: 60px;
  object-fit: contain;
}

.preview-text {
  align-self: stretch;
  flex: 1;
  min-height: 80px;
  margin: 0;
  padding: 8px;
  overflow: auto;
  text-align: left;
  font-size: 11px;
  line-height: 1.4;
  color: #ccc;
  background: #0d0d0d;
  border: 1px solid var(--border);
  border-radius: 2px;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-caption {
  font-size: 11px;
  color: #aaa;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
