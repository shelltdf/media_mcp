<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { MediaItem } from "@/composables/useMediaLibrary";
import {
  type ConversionSettings,
  useConversionJob,
} from "@/composables/useConversionJob";
import { useLog } from "@/composables/useLog";
import { FILE_PICKER_ID_EXPORT } from "@/constants/filePickerIds";
import { replaceExtension } from "@/utils/replaceExtension";
import { probeDurationSec } from "@/utils/probeDurationSec";
import { formatHms } from "@/utils/formatDuration";

const { t } = useI18n();
const { log } = useLog();

const props = defineProps<{
  open: boolean;
  mediaItem: MediaItem | null;
}>();

const emit = defineEmits<{ "update:open": [value: boolean] }>();

type Step = "form" | "progress" | "done";

const step = ref<Step>("form");

const outputFormat = ref("mp4");
const includeVideo = ref(true);
const includeAudio = ref(true);
const videoCodec = ref("libx264");
const audioCodec = ref("aac");
const resolution = ref("source");
const videoBitrateK = ref(4500);
const audioBitrateK = ref(192);
const fpsEstimate = ref(30);

const includeSubtitle = ref(true);
const subtitleCodec = ref<"copy" | "mov_text" | "webvtt">("copy");
const includeDataStreams = ref(false);
const preserveMetadata = ref(true);

const outputFileName = ref("");
const outputChosen = ref(false);
const outputSaveHandle = ref<FileSystemFileHandle | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const durationSec = ref<number | null>(null);

const defaultOutName = computed(() => {
  const n = props.mediaItem?.name ?? "output";
  const base = n.replace(/\.[^.]+$/, "");
  return `${base}.${outputFormat.value}`;
});

const isAudioOnlyFormat = computed(() =>
  ["mp3", "aac", "wav"].includes(outputFormat.value),
);

const supportsSavePicker = computed(
  () => typeof window !== "undefined" && "showSaveFilePicker" in window,
);

const hasOutputChannel = computed(() => {
  if (isAudioOnlyFormat.value) return true;
  return includeVideo.value || includeAudio.value;
});

const canStart = computed(
  () =>
    outputChosen.value &&
    outputFileName.value.trim().length > 0 &&
    hasOutputChannel.value,
);

const hasSubtitleChannel = computed(() =>
  props.mediaItem?.channels.some((c) => c.kind === "subtitle") ?? false,
);

const settings = computed<ConversionSettings>(() => ({
  outputFormat: outputFormat.value,
  includeVideo: isAudioOnlyFormat.value ? false : includeVideo.value,
  includeAudio: isAudioOnlyFormat.value ? true : includeAudio.value,
  videoCodec: videoCodec.value,
  audioCodec: audioCodec.value,
  resolution: resolution.value,
  videoBitrateK: videoBitrateK.value,
  audioBitrateK: audioBitrateK.value,
  outputFileName: outputFileName.value.trim() || defaultOutName.value,
  durationSec: durationSec.value,
  fpsEstimate: fpsEstimate.value,
  includeSubtitle: isAudioOnlyFormat.value ? false : includeSubtitle.value,
  subtitleCodec: subtitleCodec.value,
  includeDataStreams: includeDataStreams.value,
  preserveMetadata: preserveMetadata.value,
}));

const { progressDetail, resetProgressUi, run } = useConversionJob(
  () => {
    step.value = "done";
    log(
      "info",
      t("convert.logDone", {
        name: outputFileName.value.trim() || defaultOutName.value,
      }),
    );
  },
  (msg) => {
    const text =
      msg === "ERR_NO_CHANNEL"
        ? t("convert.startNeedChannel")
        : t("convert.logError", { msg });
    log("error", text);
  },
);

const framesText = computed(() => {
  const c = progressDetail.currentFrame;
  const tf = progressDetail.totalFrames;
  if (c == null && tf == null) return t("convert.progressFramesIdle");
  if (c != null && tf == null)
    return t("convert.progressFramesPartial", { cur: c });
  if (c != null && tf != null)
    return t("convert.progressFrames", { cur: c, total: tf });
  return t("convert.progressFramesIdle");
});

const startTimeText = computed(() =>
  progressDetail.startedAt == null
    ? t("convert.timeUnknown")
    : new Date(progressDetail.startedAt).toLocaleString(),
);

const elapsedText = computed(() => formatHms(progressDetail.elapsedSec));

const etaText = computed(() =>
  progressDetail.etaSec == null || !Number.isFinite(progressDetail.etaSec)
    ? t("convert.timeUnknown")
    : formatHms(progressDetail.etaSec),
);

function saveTypesForFormat(fmt: string): FilePickerAcceptType[] {
  const table: Record<string, FilePickerAcceptType> = {
    mp4: { description: "MP4", accept: { "video/mp4": [".mp4"] } },
    webm: { description: "WebM", accept: { "video/webm": [".webm"] } },
    mkv: { description: "MKV", accept: { "video/x-matroska": [".mkv"] } },
    mp3: { description: "MP3", accept: { "audio/mpeg": [".mp3"] } },
    aac: { description: "AAC", accept: { "audio/aac": [".aac", ".m4a"] } },
    wav: { description: "WAV", accept: { "audio/wav": [".wav"] } },
  };
  const one = table[fmt];
  return one ? [one] : [{ description: "Media", accept: { "*/*": [".*"] } }];
}

function acceptAttrForFormat(fmt: string): string {
  const table: Record<string, string> = {
    mp4: ".mp4,video/mp4",
    webm: ".webm,video/webm",
    mkv: ".mkv",
    mp3: ".mp3",
    aac: ".aac,.m4a",
    wav: ".wav",
  };
  return table[fmt] ?? "";
}

async function pickOutput() {
  const suggested = defaultOutName.value;
  const savePicker = window.showSaveFilePicker;
  if (supportsSavePicker.value && savePicker) {
    try {
      const handle = await savePicker({
        id: FILE_PICKER_ID_EXPORT,
        suggestedName: suggested,
        types: saveTypesForFormat(outputFormat.value),
      });
      outputFileName.value = handle.name;
      outputSaveHandle.value = handle;
      outputChosen.value = true;
      return;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  fileInputRef.value?.click();
}

function onOutputFileChosen(ev: Event) {
  const el = ev.target as HTMLInputElement;
  const f = el.files?.[0];
  if (f) {
    outputFileName.value = replaceExtension(f.name, outputFormat.value);
    outputSaveHandle.value = null;
    outputChosen.value = true;
  }
  el.value = "";
}

watch(
  () => [props.open, props.mediaItem?.id] as const,
  async ([open]) => {
    if (open && props.mediaItem) {
      durationSec.value = await probeDurationSec(props.mediaItem.file);
    } else {
      durationSec.value = null;
    }
  },
);

watch(outputFormat, (fmt, prev) => {
  if (["mp3", "aac", "wav"].includes(fmt)) {
    includeVideo.value = false;
    includeAudio.value = true;
  } else if (prev && ["mp3", "aac", "wav"].includes(prev)) {
    includeVideo.value = true;
    includeAudio.value = true;
  }
  if (outputFileName.value.trim()) {
    outputFileName.value = replaceExtension(outputFileName.value, fmt);
  }
});

watch(
  () => props.open,
  (o) => {
    if (o) {
      step.value = "form";
      outputFileName.value = "";
      outputChosen.value = false;
      outputSaveHandle.value = null;
      includeSubtitle.value = true;
      subtitleCodec.value = "copy";
      includeDataStreams.value = false;
      preserveMetadata.value = true;
      resetProgressUi();
    }
  },
);

function close() {
  emit("update:open", false);
  step.value = "form";
}

function startConvert() {
  if (!props.mediaItem || !canStart.value) return;
  step.value = "progress";
  resetProgressUi();
  void run(settings.value, {
    inputFile: props.mediaItem.file,
    saveFileHandle: outputSaveHandle.value,
  });
}

function doneClose() {
  close();
}

function startButtonTitle(): string | undefined {
  if (!outputChosen.value || !outputFileName.value.trim())
    return t("convert.startNeedPick");
  if (!hasOutputChannel.value) return t("convert.startNeedChannel");
  return undefined;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && mediaItem"
      class="convert-backdrop"
      role="presentation"
      @click.self="step === 'form' ? close() : null"
    >
      <div
        class="convert-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="t('convert.title')"
      >
        <header class="convert-head">
          <h2>{{ t("convert.title") }}</h2>
          <button
            v-if="step === 'form'"
            type="button"
            class="convert-close"
            @click="close"
          >
            ×
          </button>
        </header>

        <p class="convert-source">
          {{ t("convert.source") }}：<strong>{{ mediaItem.name }}</strong>
        </p>

        <template v-if="step === 'form'">
          <div class="convert-form">
            <label class="convert-field convert-field--full">
              <span>{{ t("convert.outputFormat") }}</span>
              <select v-model="outputFormat">
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mkv">MKV</option>
                <option value="mp3">MP3</option>
                <option value="aac">AAC</option>
                <option value="wav">WAV</option>
              </select>
            </label>

            <div v-if="!isAudioOnlyFormat" class="convert-group">
              <div class="convert-group-head">
                <span class="convert-group-title">{{
                  t("convert.groupVideo")
                }}</span>
                <label class="convert-toggle">
                  <input v-model="includeVideo" type="checkbox" />
                  {{ t("convert.enableVideo") }}
                </label>
              </div>
              <div
                class="convert-group-body"
                :class="{ 'is-disabled': !includeVideo }"
              >
                <label class="convert-field">
                  <span>{{ t("convert.videoCodec") }}</span>
                  <select
                    v-model="videoCodec"
                    :disabled="!includeVideo"
                  >
                    <option value="copy">{{ t("convert.codecCopy") }}</option>
                    <option value="libx264">H.264 (libx264)</option>
                    <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
                  </select>
                </label>
                <label class="convert-field">
                  <span>{{ t("convert.resolution") }}</span>
                  <select
                    v-model="resolution"
                    :disabled="!includeVideo"
                  >
                    <option value="source">{{ t("convert.resSource") }}</option>
                    <option value="1920x1080">1920×1080</option>
                    <option value="1280x720">1280×720</option>
                    <option value="854x480">854×480</option>
                  </select>
                </label>
                <label class="convert-field convert-field--full">
                  <span>{{ t("convert.videoBitrate") }}</span>
                  <input
                    v-model.number="videoBitrateK"
                    type="number"
                    min="100"
                    max="50000"
                    step="100"
                    :disabled="!includeVideo"
                  />
                  <span class="unit">kbps</span>
                </label>
                <label class="convert-field convert-field--full">
                  <span>{{ t("convert.fpsHint") }}</span>
                  <input
                    v-model.number="fpsEstimate"
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    :disabled="!includeVideo"
                  />
                </label>
              </div>
            </div>

            <div class="convert-group">
              <div class="convert-group-head">
                <span class="convert-group-title">{{
                  t("convert.groupAudio")
                }}</span>
                <label v-if="!isAudioOnlyFormat" class="convert-toggle">
                  <input v-model="includeAudio" type="checkbox" />
                  {{ t("convert.enableAudio") }}
                </label>
              </div>
              <div
                class="convert-group-body"
                :class="{
                  'is-disabled': !isAudioOnlyFormat && !includeAudio,
                }"
              >
                <label
                  class="convert-field"
                  :class="{ 'convert-field--full': isAudioOnlyFormat }"
                >
                  <span>{{ t("convert.audioCodec") }}</span>
                  <select
                    v-model="audioCodec"
                    :disabled="!isAudioOnlyFormat && !includeAudio"
                  >
                    <option value="copy">{{ t("convert.codecCopy") }}</option>
                    <option value="aac">AAC</option>
                    <option value="libopus">Opus</option>
                  </select>
                </label>
                <label
                  class="convert-field"
                  :class="{ 'convert-field--full': isAudioOnlyFormat }"
                >
                  <span>{{ t("convert.audioBitrate") }}</span>
                  <input
                    v-model.number="audioBitrateK"
                    type="number"
                    min="32"
                    max="512"
                    step="32"
                    :disabled="!isAudioOnlyFormat && !includeAudio"
                  />
                  <span class="unit">kbps</span>
                </label>
              </div>
            </div>

            <div v-if="!isAudioOnlyFormat" class="convert-group">
              <div class="convert-group-head">
                <span class="convert-group-title">{{
                  t("convert.groupSubtitle")
                }}</span>
                <label class="convert-toggle">
                  <input v-model="includeSubtitle" type="checkbox" />
                  {{ t("convert.enableSubtitle") }}
                </label>
              </div>
              <div
                class="convert-group-body"
                :class="{ 'is-disabled': !includeSubtitle }"
              >
                <label class="convert-field convert-field--full">
                  <span>{{ t("convert.subtitleCodec") }}</span>
                  <select
                    v-model="subtitleCodec"
                    :disabled="!includeSubtitle"
                  >
                    <option value="copy">{{ t("convert.codecCopy") }}</option>
                    <option value="mov_text">mov_text（MP4 等）</option>
                    <option value="webvtt">WebVTT（WebM）</option>
                  </select>
                </label>
                <p class="convert-group-note">
                  {{
                    hasSubtitleChannel
                      ? t("convert.subtitleHintDetected")
                      : t("convert.subtitleHintGuess")
                  }}
                </p>
              </div>
            </div>

            <div class="convert-group">
              <div class="convert-group-head">
                <span class="convert-group-title">{{
                  t("convert.groupOther")
                }}</span>
              </div>
              <div class="convert-group-body convert-group-body--stack">
                <label class="convert-toggle convert-field--full">
                  <input v-model="includeDataStreams" type="checkbox" />
                  {{ t("convert.includeDataStreams") }}
                </label>
                <label class="convert-toggle convert-field--full">
                  <input v-model="preserveMetadata" type="checkbox" />
                  {{ t("convert.preserveMetadata") }}
                </label>
                <p class="convert-group-note">{{ t("convert.otherHint") }}</p>
              </div>
            </div>

            <div class="convert-field convert-field--full convert-field--path">
              <span>{{ t("convert.outputPath") }}</span>
              <p class="convert-path-hint">
                {{
                  supportsSavePicker
                    ? t("convert.pickOutputHint")
                    : t("convert.pickOutputFallback")
                }}
              </p>
              <div class="convert-path-row">
                <input
                  v-model="outputFileName"
                  type="text"
                  class="convert-path-input"
                  :placeholder="defaultOutName"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="btn-secondary convert-pick-btn"
                  @click="pickOutput"
                >
                  {{ t("convert.pickOutput") }}
                </button>
              </div>
              <input
                ref="fileInputRef"
                type="file"
                class="convert-file-fallback"
                :accept="acceptAttrForFormat(outputFormat)"
                @change="onOutputFileChosen"
              />
            </div>
          </div>
          <footer class="convert-actions">
            <button type="button" class="btn-secondary" @click="close">
              {{ t("convert.cancel") }}
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="!canStart"
              :title="startButtonTitle()"
              @click="startConvert"
            >
              {{ t("convert.start") }}
            </button>
          </footer>
        </template>

        <template v-else-if="step === 'progress'">
          <div class="convert-progress-wrap">
            <p>{{ t("convert.running") }}</p>
            <div class="convert-progress-bar">
              <div
                class="convert-progress-fill"
                :style="{
                  width: Math.min(100, progressDetail.percent) + '%',
                }"
              />
            </div>
            <p class="convert-progress-pct">
              {{
                t("convert.progressPercent", {
                  n: progressDetail.percent.toFixed(2),
                })
              }}
            </p>
            <p class="convert-progress-line">{{ framesText }}</p>
            <div class="convert-progress-meta">
              <span>{{ t("convert.progressStart", { t: startTimeText }) }}</span>
              <span>{{ t("convert.progressElapsed", { t: elapsedText }) }}</span>
              <span>{{ t("convert.progressEta", { t: etaText }) }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="convert-done">
            <p>{{ t("convert.finished") }}</p>
            <button type="button" class="btn-primary" @click="doneClose">
              {{ t("convert.ok") }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.convert-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.convert-dialog {
  background: var(--bg-panel, #2d2d2d);
  color: var(--text, #eee);
  border: 1px solid var(--border, #555);
  border-radius: 6px;
  min-width: min(440px, 100%);
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.convert-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border, #555);
}

.convert-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.convert-close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
}

.convert-close:hover {
  opacity: 1;
}

.convert-source {
  margin: 8px 14px;
  font-size: 12px;
  color: var(--text-muted, #aaa);
}

.convert-form {
  padding: 8px 14px 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}

.convert-group {
  grid-column: 1 / -1;
  border: 1px solid var(--border, #444);
  border-radius: 4px;
  padding: 8px 10px;
  background: var(--bg-workspace, #1a1a1a);
}

.convert-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.convert-group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted, #aaa);
}

.convert-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
}

.convert-group-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}

.convert-group-body.is-disabled {
  opacity: 0.45;
  pointer-events: none;
}

.convert-group-body--stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: 1 / -1;
}

.convert-group-note {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-muted, #888);
  font-weight: normal;
}

.convert-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.convert-field--full {
  grid-column: 1 / -1;
}

.convert-field--path {
  gap: 6px;
}

.convert-path-hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.35;
  color: var(--text-muted, #888);
  font-weight: normal;
}

.convert-path-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.convert-path-input {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid var(--border, #555);
  border-radius: 3px;
  background: var(--bg-workspace, #1e1e1e);
  color: inherit;
}

.convert-pick-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.convert-file-fallback {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.convert-field span:first-child {
  color: var(--text-muted, #aaa);
  font-weight: 600;
}

.convert-field input,
.convert-field select {
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid var(--border, #555);
  border-radius: 3px;
  background: var(--bg-workspace, #1e1e1e);
  color: inherit;
}

.convert-field .unit {
  font-size: 10px;
  color: var(--text-muted, #888);
  margin-top: 2px;
}

.convert-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--border, #555);
}

.btn-primary,
.btn-secondary {
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid var(--border, #555);
}

.btn-primary {
  background: var(--accent, #0078d4);
  color: #fff;
  border-color: transparent;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: inherit;
}

.convert-progress-wrap {
  padding: 20px 14px 20px;
  text-align: left;
}

.convert-progress-wrap > p:first-child {
  text-align: center;
  margin: 0 0 8px;
}

.convert-progress-bar {
  height: 10px;
  background: var(--bg-workspace, #111);
  border-radius: 5px;
  overflow: hidden;
  margin: 12px 0 8px;
  border: 1px solid var(--border, #555);
}

.convert-progress-fill {
  height: 100%;
  background: var(--accent, #0078d4);
  transition: width 0.12s linear;
}

.convert-progress-pct {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.convert-progress-line {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--text-muted, #ccc);
  font-variant-numeric: tabular-nums;
}

.convert-progress-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted, #aaa);
  line-height: 1.45;
}

.convert-done {
  padding: 24px 14px;
  text-align: center;
}

.convert-done p {
  margin: 0 0 16px;
  font-size: 14px;
}
</style>
