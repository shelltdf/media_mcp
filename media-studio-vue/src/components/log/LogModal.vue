<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useLog } from "@/composables/useLog";

const { t } = useI18n();
const { fullText } = useLog();

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const text = computed(() => fullText.value || t("log.empty"));

function close() {
  emit("update:open", false);
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(text.value);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="log-backdrop"
      role="presentation"
      @click.self="close"
    >
      <div class="log-dialog" role="dialog" aria-modal="true">
        <header class="log-header">
          <h2>{{ t("log.title") }}</h2>
          <div class="log-actions">
            <button type="button" @click="copyAll">{{ t("log.copyAll") }}</button>
            <button type="button" @click="close">{{ t("log.close") }}</button>
          </div>
        </header>
        <pre class="log-body" readonly>{{ text }}</pre>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.log-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.log-dialog {
  background: var(--bg-workspace);
  color: var(--text);
  border: 1px solid var(--border);
  min-width: min(640px, 95vw);
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.log-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.log-actions {
  display: flex;
  gap: 0.5rem;
}

.log-body {
  margin: 0;
  padding: 0.75rem;
  flex: 1;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
}
</style>
