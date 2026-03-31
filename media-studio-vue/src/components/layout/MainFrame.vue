<script setup lang="ts">
import { onMounted, provide, ref } from "vue";
import { useI18n } from "vue-i18n";
import DockSide from "@/components/layout/DockSide.vue";
import Workspace from "@/components/workspace/Workspace.vue";
import TimelinePanel from "@/components/timeline/TimelinePanel.vue";
import MediaLibraryPanel from "@/components/media/MediaLibraryPanel.vue";
import PropertiesPanel from "@/components/properties/PropertiesPanel.vue";
import LogModal from "@/components/log/LogModal.vue";
import { useDockLayout } from "@/composables/useDockLayout";
import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { useTheme, type ThemeMode } from "@/composables/useTheme";

const { t, locale } = useI18n();
const { log, summary } = useLog();
const { setMode } = useTheme();
useMediaLibrary();

const {
  onResizeLeftStart,
  onResizeRightStart,
  onResizeBottomStart,
} = useDockLayout();

const mainRowRef = ref<HTMLElement | null>(null);
const mainBodyRef = ref<HTMLElement | null>(null);
provide("dockMainRowEl", mainRowRef);
provide("dockMainBodyEl", mainBodyRef);

const logOpen = ref(false);
const workspaceRef = ref<InstanceType<typeof Workspace> | null>(null);

function setLocale(code: "zh" | "en") {
  locale.value = code;
  localStorage.setItem("locale", code);
  log("info", `Language: ${code}`);
}

function applyThemeChoice(m: ThemeMode) {
  setMode(m);
  log("info", `Theme: ${m}`);
}

onMounted(() => {
  log("info", t("status.ready"));
});
</script>

<template>
  <div class="main-frame">
    <header class="title-bar">{{ t("app.title") }}</header>

    <nav class="menu-bar" aria-label="Main menu">
      <div class="menu-dropdown">
        <button type="button" class="menu-top">{{ t("menu.file") }}</button>
        <div class="menu-popup">
          <button type="button" @click="workspaceRef?.newProject()">
            {{ t("app.newProject") }}
          </button>
        </div>
      </div>
      <div class="menu-dropdown">
        <button type="button" class="menu-top">{{ t("menu.edit") }}</button>
      </div>
      <div class="menu-dropdown">
        <button type="button" class="menu-top">{{ t("menu.view") }}</button>
      </div>
      <div class="menu-dropdown">
        <button type="button" class="menu-top">{{ t("menu.language") }}</button>
        <div class="menu-popup">
          <button type="button" @click="setLocale('zh')">{{ t("menu.langZh") }}</button>
          <button type="button" @click="setLocale('en')">{{ t("menu.langEn") }}</button>
        </div>
      </div>
      <div class="menu-dropdown">
        <button type="button" class="menu-top">{{ t("menu.theme") }}</button>
        <div class="menu-popup">
          <button type="button" @click="applyThemeChoice('light')">
            {{ t("menu.themeLight") }}
          </button>
          <button type="button" @click="applyThemeChoice('dark')">
            {{ t("menu.themeDark") }}
          </button>
          <button type="button" @click="applyThemeChoice('system')">
            {{ t("menu.themeSystem") }}
          </button>
        </div>
      </div>
      <div class="menu-dropdown">
        <button type="button" class="menu-top">{{ t("menu.help") }}</button>
      </div>
    </nav>

    <div class="toolbar">
      <button type="button" class="tb-btn" :title="t('app.newProject')" @click="workspaceRef?.newProject()">
        <span class="tb-icon" aria-hidden="true">+</span>
      </button>
      <button type="button" class="tb-btn" :title="t('app.importMedia')" @click="workspaceRef?.importMedia()">
        <span class="tb-icon" aria-hidden="true">in</span>
      </button>
    </div>

    <div ref="mainBodyRef" class="main-body">
      <div ref="mainRowRef" class="main-row">
        <DockSide dock-id="left" title-key="app.mediaLibrary">
          <MediaLibraryPanel />
        </DockSide>
        <div
          class="dock-splitter dock-splitter--v"
          :title="t('dock.splitterVertical')"
          @mousedown="onResizeLeftStart"
        />
        <Workspace ref="workspaceRef" />
        <div
          class="dock-splitter dock-splitter--v"
          :title="t('dock.splitterVertical')"
          @mousedown="onResizeRightStart"
        />
        <DockSide dock-id="right" title-key="app.properties">
          <PropertiesPanel />
        </DockSide>
      </div>
      <div
        class="dock-splitter dock-splitter--h"
        :title="t('dock.splitterHorizontal')"
        @mousedown="onResizeBottomStart"
      />
      <DockSide dock-id="bottom" title-key="app.timeline">
        <TimelinePanel />
      </DockSide>
    </div>

    <button
      type="button"
      class="status-bar"
      :title="t('log.title')"
      @click="logOpen = true"
    >
      {{ summary || t("status.ready") }}
    </button>

    <LogModal v-model:open="logOpen" />
  </div>
</template>

<style scoped>
.main-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-workspace);
}

.title-bar {
  flex: 0 0 auto;
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg-title);
  border-bottom: 1px solid var(--border);
}

.menu-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--bg-menu);
  border-bottom: 1px solid var(--border);
  padding: 0 4px;
  font-size: 13px;
}

.menu-dropdown {
  position: relative;
}

.menu-dropdown:hover .menu-popup {
  display: flex;
}

.menu-top {
  border: none;
  background: transparent;
  color: var(--text);
  padding: 6px 10px;
}

.menu-top:hover {
  background: rgba(0, 120, 212, 0.12);
}

.menu-popup {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 50;
}

.menu-popup button {
  text-align: left;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text);
}

.menu-popup button:hover {
  background: var(--accent);
  color: #fff;
}

.theme-hint {
  margin-left: auto;
  align-self: center;
  font-size: 11px;
  color: var(--text-muted);
  padding-right: 8px;
}

.toolbar {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  padding: 4px 6px;
  background: var(--bg-toolbar);
  border-bottom: 1px solid var(--border);
}

.tb-btn {
  width: 28px;
  height: 24px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--bg-panel);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.tb-btn:hover {
  border-color: var(--accent);
}

.tb-icon {
  font-weight: 700;
  font-size: 12px;
}

.main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-row {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
}

.dock-splitter {
  flex: 0 0 auto;
  z-index: 2;
  background: var(--border);
  touch-action: none;
}

.dock-splitter--v {
  width: 5px;
  cursor: col-resize;
  margin-left: -2px;
  margin-right: -2px;
}

.dock-splitter--v:hover,
.dock-splitter--h:hover {
  background: var(--accent);
}

.dock-splitter--h {
  height: 5px;
  cursor: row-resize;
  margin-top: -2px;
  margin-bottom: -2px;
}

.muted {
  color: var(--text-muted);
  font-size: 12px;
  margin: 0;
}

.status-bar {
  flex: 0 0 auto;
  width: 100%;
  text-align: left;
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-top: 1px solid var(--border);
  background: var(--bg-status);
  color: #fff;
  cursor: pointer;
}

.status-bar:hover {
  filter: brightness(1.08);
}
</style>
