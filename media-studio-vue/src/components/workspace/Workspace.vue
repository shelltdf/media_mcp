<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getPreviewKind } from "@/composables/previewKind";
import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useImportMedia } from "@/composables/useImportMedia";
import { useTimeline } from "@/composables/useTimeline";
import { useFfmpegPreview } from "@/composables/useFfmpegPreview";

const PREVIEW_TRANSCODED_LS = "mediaStudioPreviewUseTranscoded";

function loadUseTranscodedPreview(): boolean {
  try {
    return localStorage.getItem(PREVIEW_TRANSCODED_LS) === "1";
  } catch {
    return false;
  }
}

const { t } = useI18n();
const { log } = useLog();
const { clear, previewItem, previewKind } = useMediaLibrary();
/** 默认关闭：浏览器直解，点击播放易出声；开启则用 ffmpeg 转码（兼容编码） */
const useTranscodedPreview = ref(loadUseTranscodedPreview());
watch(useTranscodedPreview, (v) => {
  try {
    localStorage.setItem(PREVIEW_TRANSCODED_LS, v ? "1" : "0");
  } catch {
    /* ignore */
  }
});

const ffmpegPv = useFfmpegPreview(previewItem, useTranscodedPreview);
const { status: ffmpegPreviewStatus, displayUrl: ffmpegDisplayUrl } =
  toRefs(ffmpegPv);

const soundGateDismissed = ref(false);
watch(previewItem, () => {
  soundGateDismissed.value = false;
});

const showSoundUnlockGate = computed(
  () =>
    useTranscodedPreview.value &&
    ffmpegPreviewStatus.value === "ready" &&
    !soundGateDismissed.value &&
    (previewKind.value === "video" || previewKind.value === "audio"),
);

function onSoundUnlockClick() {
  soundGateDismissed.value = true;
  void nextTick(() => {
    applyPreviewAudioPolicy(videoRef.value ?? audioRef.value);
    const v = videoRef.value;
    const a = audioRef.value;
    if (v) void v.play().catch(() => {});
    if (a) void a.play().catch(() => {});
  });
}
const { importMedia } = useImportMedia();
const { clearClips } = useTimeline();

const previewText = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const audioRef = ref<HTMLAudioElement | null>(null);

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

function applyPreviewAudioPolicy(
  el: HTMLVideoElement | HTMLAudioElement | null,
): void {
  if (!el) return;
  el.muted = false;
  el.defaultMuted = false;
  el.volume = 1;
}

/** 元数据就绪时设置默认音量/非静音，不调用 play()（预览不自动播放） */
function onVideoLoadedMeta() {
  applyPreviewAudioPolicy(videoRef.value);
}

function onAudioLoadedMeta() {
  applyPreviewAudioPolicy(audioRef.value);
}

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
        <label v-if="ffmpegDisplayUrl" class="preview-mode-bar">
          <input v-model="useTranscodedPreview" type="checkbox" />
          <span>{{ t("app.previewUseTranscoded") }}</span>
        </label>
        <p
          v-if="ffmpegPreviewStatus === 'loading'"
          class="preview-ffmpeg-msg"
        >
          {{ t("app.previewFfmpegLoading") }}
        </p>
        <template v-else-if="ffmpegDisplayUrl">
          <div
            class="preview-media-wrap"
            :class="{ 'is-gated': showSoundUnlockGate }"
          >
            <video
              :key="`${previewItem.id}-${useTranscodedPreview}-${ffmpegPreviewStatus}`"
              ref="videoRef"
              class="preview-media"
              controls
              playsinline
              :muted="false"
              :src="ffmpegDisplayUrl"
              @loadedmetadata="onVideoLoadedMeta"
            />
            <div
              v-if="showSoundUnlockGate"
              class="preview-sound-gate"
              @click.stop="onSoundUnlockClick"
            >
              <button type="button" class="preview-sound-gate-btn">
                {{ t("app.previewClickForSound") }}
              </button>
              <p class="preview-sound-gate-hint">
                {{ t("app.previewSoundGateHint") }}
              </p>
            </div>
          </div>
          <span class="preview-caption">{{ previewItem.name }}</span>
          <p v-if="useTranscodedPreview" class="preview-sound-hint">
            {{ t("app.previewSoundHintFfmpeg") }}
          </p>
          <p v-else class="preview-sound-hint">
            {{ t("app.previewSoundHint") }}
          </p>
        </template>
      </template>
      <template v-else-if="previewKind === 'audio'">
        <label v-if="ffmpegDisplayUrl" class="preview-mode-bar">
          <input v-model="useTranscodedPreview" type="checkbox" />
          <span>{{ t("app.previewUseTranscoded") }}</span>
        </label>
        <p
          v-if="ffmpegPreviewStatus === 'loading'"
          class="preview-ffmpeg-msg"
        >
          {{ t("app.previewFfmpegLoading") }}
        </p>
        <template v-else-if="ffmpegDisplayUrl">
          <div
            class="preview-media-wrap preview-media-wrap--audio"
            :class="{ 'is-gated': showSoundUnlockGate }"
          >
            <audio
              :key="`${previewItem.id}-${useTranscodedPreview}-${ffmpegPreviewStatus}`"
              ref="audioRef"
              class="preview-audio"
              controls
              :muted="false"
              :src="ffmpegDisplayUrl"
              @loadedmetadata="onAudioLoadedMeta"
            />
            <div
              v-if="showSoundUnlockGate"
              class="preview-sound-gate"
              @click.stop="onSoundUnlockClick"
            >
              <button type="button" class="preview-sound-gate-btn">
                {{ t("app.previewClickForSound") }}
              </button>
              <p class="preview-sound-gate-hint">
                {{ t("app.previewSoundGateHint") }}
              </p>
            </div>
          </div>
          <span class="preview-caption">{{ previewItem.name }}</span>
          <p v-if="useTranscodedPreview" class="preview-sound-hint">
            {{ t("app.previewSoundHintFfmpeg") }}
          </p>
          <p v-else class="preview-sound-hint">
            {{ t("app.previewSoundHint") }}
          </p>
        </template>
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

.preview-mode-bar {
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted, #aaa);
  cursor: pointer;
  user-select: none;
}

.preview-mode-bar input {
  cursor: pointer;
}

.preview-label {
  font-size: 13px;
}

.preview-hint {
  font-size: 12px;
  color: var(--text-muted, #888);
}

.preview-media-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  flex: 1;
  min-height: 80px;
}

.preview-media-wrap.is-gated .preview-media,
.preview-media-wrap.is-gated .preview-audio {
  pointer-events: none;
}

.preview-media-wrap--audio {
  min-height: auto;
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

.preview-sound-hint {
  margin: 0;
  max-width: 420px;
  font-size: 10px;
  line-height: 1.35;
  color: var(--text-muted, #888);
  text-align: center;
}

.preview-ffmpeg-msg {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  color: var(--text-muted, #aaa);
  text-align: center;
}

.preview-sound-gate {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.72);
  z-index: 2;
}

.preview-sound-gate-btn {
  cursor: pointer;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--accent, #3a7);
  border: none;
  border-radius: 6px;
}

.preview-sound-gate-btn:hover {
  filter: brightness(1.08);
}

.preview-sound-gate-hint {
  margin: 0;
  max-width: 280px;
  font-size: 10px;
  line-height: 1.35;
  color: #ccc;
  text-align: center;
}
</style>
