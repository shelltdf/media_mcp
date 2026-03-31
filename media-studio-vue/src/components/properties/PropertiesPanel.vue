<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useMediaMetadata } from "@/composables/useMediaMetadata";

const { t } = useI18n();
const { selectedItem } = useMediaLibrary();
const { meta } = useMediaMetadata(selectedItem);

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

const modifiedStr = computed(() => {
  const item = selectedItem.value;
  if (!item) return "—";
  try {
    return new Date(item.file.lastModified).toLocaleString();
  } catch {
    return "—";
  }
});
</script>

<template>
  <div class="properties-panel">
    <template v-if="!selectedItem">
      <p class="empty">{{ t("properties.empty") }}</p>
    </template>
    <template v-else>
      <dl class="props-dl">
        <dt>{{ t("properties.fileName") }}</dt>
        <dd class="break">{{ selectedItem.name }}</dd>

        <dt>{{ t("properties.mime") }}</dt>
        <dd>{{ selectedItem.file.type || "—" }}</dd>

        <dt>{{ t("properties.size") }}</dt>
        <dd>{{ formatBytes(selectedItem.file.size) }}</dd>

        <dt>{{ t("properties.modified") }}</dt>
        <dd>{{ modifiedStr }}</dd>

        <dt>{{ t("properties.duration") }}</dt>
        <dd>{{ formatTime(meta.durationSec) }}</dd>

        <template v-if="meta.videoWidth && meta.videoHeight">
          <dt>{{ t("properties.dimensions") }}</dt>
          <dd>{{ meta.videoWidth }} × {{ meta.videoHeight }}</dd>
        </template>

        <dt v-if="meta.error">{{ t("properties.metaError") }}</dt>
        <dd v-if="meta.error">{{ t("properties.metaErrorHint") }}</dd>
      </dl>

      <h4 class="ch-title">{{ t("properties.channels") }}</h4>
      <ul class="ch-list">
        <li v-for="ch in selectedItem.channels" :key="ch.id" class="ch-item">
          <span class="ch-kind">{{ t(`channelKind.${ch.kind}`) }}</span>
          <span class="ch-label">{{ ch.label }}</span>
          <code class="ch-id">{{ ch.id }}</code>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.properties-panel {
  font-size: 12px;
  color: var(--text);
  min-height: 0;
  overflow: auto;
}

.empty {
  margin: 0;
  color: var(--text-muted);
}

.props-dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  align-items: baseline;
}

.props-dl dt {
  margin: 0;
  color: var(--text-muted);
  font-weight: 600;
}

.props-dl dd {
  margin: 0;
  word-break: break-all;
}

.break {
  word-break: break-all;
}

.ch-title {
  margin: 10px 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.ch-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.ch-item {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 4px;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
}

.ch-kind {
  color: var(--accent);
  font-weight: 600;
}

.ch-label {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch-id {
  font-size: 10px;
  opacity: 0.75;
}
</style>
