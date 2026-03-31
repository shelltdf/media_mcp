<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { MediaChannel, MediaChannelDetailRow } from "@/composables/mediaChannels";
import { useFfmpegProbe } from "@/composables/useFfmpegProbe";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useMediaMetadata } from "@/composables/useMediaMetadata";

const { t } = useI18n();
const { selectedItem } = useMediaLibrary();
const { meta } = useMediaMetadata(selectedItem);
const { status: probeStatus, probe: ffmpegProbe } = useFfmpegProbe(selectedItem);

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

const muxedDurationSec = computed(() => {
  const p = ffmpegProbe.value;
  if (p?.durationSec != null && Number.isFinite(p.durationSec)) return p.durationSec;
  const m = meta.value;
  if (m.durationSec != null && Number.isFinite(m.durationSec)) return m.durationSec;
  return null;
});

function showMuxedDuration(ch: MediaChannel): boolean {
  return (
    (ch.kind === "video" || ch.kind === "audio") && muxedDurationSec.value != null
  );
}

function showVideoResolution(ch: MediaChannel): boolean {
  return ch.kind === "video" && dimensionsDisplay.value != null;
}

const durationDisplay = computed(() => {
  const p = ffmpegProbe.value;
  const m = meta.value;
  const sec = p?.durationSec ?? m.durationSec ?? null;
  return formatTime(sec);
});

const dimensionsDisplay = computed(() => {
  const p = ffmpegProbe.value;
  if (p?.videoWidth && p?.videoHeight) {
    return `${p.videoWidth} × ${p.videoHeight}`;
  }
  const m = meta.value;
  if (m.videoWidth && m.videoHeight) {
    return `${m.videoWidth} × ${m.videoHeight}`;
  }
  return null;
});

/** 通道卡片内：探针成功时用真实值覆盖「未知」占位文案 */
function detailRowDisplay(
  row: MediaChannelDetailRow,
  ch: MediaChannel,
): string {
  const p = ffmpegProbe.value;
  if (ch.kind === "audio") {
    if (
      row.valueKey === "channelDetail.sampleRateUnknown" &&
      p?.audioSampleRate != null
    ) {
      return `${p.audioSampleRate} Hz`;
    }
    if (
      row.valueKey === "channelDetail.channelLayoutUnknown" &&
      p?.audioChannelLayout
    ) {
      return p.audioChannelLayout;
    }
  }
  return t(row.valueKey, row.params ?? {});
}
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
        <dd>{{ durationDisplay }}</dd>

        <template v-if="dimensionsDisplay">
          <dt>{{ t("properties.dimensions") }}</dt>
          <dd>{{ dimensionsDisplay }}</dd>
        </template>

        <template v-if="probeStatus === 'loading'">
          <dt>{{ t("properties.ffmpegProbe") }}</dt>
          <dd>{{ t("properties.probeLoading") }}</dd>
        </template>
        <template v-else-if="probeStatus === 'skipped_size'">
          <dt>{{ t("properties.ffmpegProbe") }}</dt>
          <dd>{{ t("properties.probeSkippedSize") }}</dd>
        </template>
        <template v-else-if="probeStatus === 'error'">
          <dt>{{ t("properties.ffmpegProbe") }}</dt>
          <dd>{{ t("properties.probeError") }}</dd>
        </template>
        <template v-else-if="ffmpegProbe?.audioSampleRate">
          <dt>{{ t("channelDetail.dtSampleRate") }}</dt>
          <dd>{{ ffmpegProbe.audioSampleRate }} Hz</dd>
        </template>
        <template v-if="ffmpegProbe?.audioChannelLayout">
          <dt>{{ t("channelDetail.dtChannelLayout") }}</dt>
          <dd>{{ ffmpegProbe.audioChannelLayout }}</dd>
        </template>
        <template v-if="ffmpegProbe?.videoCodec">
          <dt>{{ t("properties.probeVideoCodec") }}</dt>
          <dd>{{ ffmpegProbe.videoCodec }}</dd>
        </template>
        <template v-if="ffmpegProbe?.audioCodec">
          <dt>{{ t("properties.probeAudioCodec") }}</dt>
          <dd>{{ ffmpegProbe.audioCodec }}</dd>
        </template>

        <dt v-if="meta.error">{{ t("properties.metaError") }}</dt>
        <dd v-if="meta.error">{{ t("properties.metaErrorHint") }}</dd>
      </dl>

      <h4 class="ch-title">{{ t("properties.channels") }}</h4>
      <div class="ch-cards">
        <section
          v-for="ch in selectedItem.channels"
          :key="ch.id"
          class="ch-card"
        >
          <header class="ch-card-head">
            <span class="ch-kind">{{ t(`channelKind.${ch.kind}`) }}</span>
            <span class="ch-label">{{ ch.label }}</span>
            <code class="ch-id">{{ ch.id }}</code>
          </header>
          <dl class="ch-detail-dl">
            <template
              v-for="(row, idx) in ch.detailRows"
              :key="`${ch.id}-row-${idx}`"
            >
              <dt>{{ t(row.labelKey) }}</dt>
              <dd>{{ detailRowDisplay(row, ch) }}</dd>
            </template>
            <template v-if="showMuxedDuration(ch)">
              <dt>{{ t("channelDetail.dtDuration") }}</dt>
              <dd>{{ formatTime(muxedDurationSec) }}</dd>
            </template>
            <template v-if="showVideoResolution(ch)">
              <dt>{{ t("channelDetail.dtResolution") }}</dt>
              <dd>{{ dimensionsDisplay }}</dd>
            </template>
          </dl>
        </section>
      </div>
      <p class="properties-footnote">{{ t("properties.ffmpegScopeNote") }}</p>
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

.ch-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ch-card {
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-workspace);
  overflow: hidden;
}

.ch-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--bg-toolbar);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
}

.ch-kind {
  color: var(--accent);
  font-weight: 700;
}

.ch-label {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--text);
}

.ch-id {
  font-size: 10px;
  opacity: 0.8;
}

.ch-detail-dl {
  margin: 0;
  padding: 6px 8px 8px;
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 4px 8px;
  align-items: start;
  font-size: 11px;
}

.ch-detail-dl dt {
  margin: 0;
  color: var(--text-muted);
  font-weight: 600;
  line-height: 1.35;
}

.ch-detail-dl dd {
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
  color: var(--text);
}

.properties-footnote {
  margin: 10px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  font-size: 10px;
  line-height: 1.45;
  color: var(--text-muted);
}
</style>
