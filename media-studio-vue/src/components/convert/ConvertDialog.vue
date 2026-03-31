<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { MediaItem } from "@/composables/useMediaLibrary";
import {
  type ConversionSettings,
  useConversionJob,
} from "@/composables/useConversionJob";
import { useLog } from "@/composables/useLog";

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
const videoCodec = ref("libx264");
const audioCodec = ref("aac");
const resolution = ref("source");
const videoBitrateK = ref(4500);
const audioBitrateK = ref(192);
const outputFileName = ref("");
/** 用户已通过系统「另存为」或文件选择指定过输出名 */
const outputChosen = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const defaultOutName = computed(() => {
  const n = props.mediaItem?.name ?? "output";
  const base = n.replace(/\.[^.]+$/, "");
  return `${base}.${outputFormat.value}`;
});

const supportsSavePicker = computed(
  () => typeof window !== "undefined" && "showSaveFilePicker" in window,
);

const canStart = computed(
  () => outputChosen.value && outputFileName.value.trim().length > 0,
);

const settings = computed<ConversionSettings>(() => ({
  outputFormat: outputFormat.value,
  videoCodec: videoCodec.value,
  audioCodec: audioCodec.value,
  resolution: resolution.value,
  videoBitrateK: videoBitrateK.value,
  audioBitrateK: audioBitrateK.value,
  outputFileName: outputFileName.value.trim() || defaultOutName.value,
}));

const { progress, run } = useConversionJob(
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
    log("error", t("convert.logError", { msg }));
  },
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
        suggestedName: suggested,
        types: saveTypesForFormat(outputFormat.value),
      });
      outputFileName.value = handle.name;
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
    outputFileName.value = f.name;
    outputChosen.value = true;
  }
  el.value = "";
}

watch(
  () => props.open,
  (o) => {
    if (o) {
      step.value = "form";
      outputFileName.value = "";
      outputChosen.value = false;
      progress.value = 0;
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
  progress.value = 0;
  void run(settings.value);
}

function doneClose() {
  close();
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
        <p class="convert-demo">{{ t("convert.demoNote") }}</p>

        <template v-if="step === 'form'">
          <div class="convert-form">
            <label class="convert-field">
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
            <label class="convert-field">
              <span>{{ t("convert.videoCodec") }}</span>
              <select v-model="videoCodec">
                <option value="copy">{{ t("convert.codecCopy") }}</option>
                <option value="libx264">H.264 (libx264)</option>
                <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
              </select>
            </label>
            <label class="convert-field">
              <span>{{ t("convert.audioCodec") }}</span>
              <select v-model="audioCodec">
                <option value="copy">{{ t("convert.codecCopy") }}</option>
                <option value="aac">AAC</option>
                <option value="libopus">Opus</option>
              </select>
            </label>
            <label class="convert-field">
              <span>{{ t("convert.resolution") }}</span>
              <select v-model="resolution">
                <option value="source">{{ t("convert.resSource") }}</option>
                <option value="1920x1080">1920×1080</option>
                <option value="1280x720">1280×720</option>
                <option value="854x480">854×480</option>
              </select>
            </label>
            <label class="convert-field">
              <span>{{ t("convert.videoBitrate") }}</span>
              <input
                v-model.number="videoBitrateK"
                type="number"
                min="100"
                max="50000"
                step="100"
              />
              <span class="unit">kbps</span>
            </label>
            <label class="convert-field">
              <span>{{ t("convert.audioBitrate") }}</span>
              <input
                v-model.number="audioBitrateK"
                type="number"
                min="32"
                max="512"
                step="32"
              />
              <span class="unit">kbps</span>
            </label>
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
              :title="canStart ? undefined : t('convert.startNeedPick')"
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
                :style="{ width: progress + '%' }"
              />
            </div>
            <p class="convert-progress-pct">{{ progress }}%</p>
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
  min-width: min(420px, 100%);
  max-width: 480px;
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

.convert-source,
.convert-demo {
  margin: 8px 14px;
  font-size: 12px;
  color: var(--text-muted, #aaa);
}

.convert-demo {
  color: #c90;
  font-size: 11px;
}

.convert-form {
  padding: 8px 14px 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
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

.btn-secondary {
  background: transparent;
  color: inherit;
}

.convert-progress-wrap {
  padding: 24px 14px 20px;
  text-align: center;
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
  transition: width 0.08s linear;
}

.convert-progress-pct {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
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
