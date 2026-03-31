<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { type DockSideId, useDockLayout } from "@/composables/useDockLayout";

const props = defineProps<{
  dockId: DockSideId;
  titleKey: "app.mediaLibrary" | "app.properties" | "app.timeline";
}>();

const { t } = useI18n();
const { dockLayout, toggleCollapse, toggleMaximize } = useDockLayout();

const mainRowEl = inject<Ref<HTMLElement | null> | undefined>("dockMainRowEl");
const mainBodyEl = inject<Ref<HTMLElement | null> | undefined>("dockMainBodyEl");

function isCollapsed(): boolean {
  if (props.dockId === "left") return dockLayout.leftCollapsed;
  if (props.dockId === "right") return dockLayout.rightCollapsed;
  return dockLayout.bottomCollapsed;
}

function onCollapseClick() {
  toggleCollapse(props.dockId);
}

function onMaximizeClick() {
  const row = mainRowEl?.value ?? null;
  const body = mainBodyEl?.value ?? null;
  toggleMaximize(props.dockId, row, body);
}

const maximized = computed(() =>
  props.dockId === "left"
    ? dockLayout.leftMaximized
    : props.dockId === "right"
      ? dockLayout.rightMaximized
      : dockLayout.bottomMaximized,
);

const displayStyle = computed(() => {
  if (props.dockId === "left") {
    return {
      width: `${dockLayout.leftPanelW}px`,
      minWidth: `${dockLayout.leftPanelW}px`,
    };
  }
  if (props.dockId === "right") {
    return {
      width: `${dockLayout.rightPanelW}px`,
      minWidth: `${dockLayout.rightPanelW}px`,
    };
  }
  return {
    height: `${dockLayout.bottomPanelH}px`,
    minHeight: `${dockLayout.bottomPanelH}px`,
  };
});

const edgeTitle = () =>
  isCollapsed() ? t("app.expand") : t("app.collapse");
</script>

<template>
  <!-- 左侧：[ 缘条 | 显示区 ] -->
  <div
    v-if="dockId === 'left'"
    class="dock-side dock-side--left"
    :class="{ collapsed: isCollapsed() }"
  >
    <div class="dock-edge dock-edge--vertical" :title="edgeTitle()">
      <button
        type="button"
        class="dock-edge-btn dock-edge-btn--vertical"
        :aria-expanded="!isCollapsed()"
        @click="onCollapseClick"
      >
        {{ t(titleKey) }}
      </button>
    </div>
    <div
      v-show="!isCollapsed()"
      class="dock-display"
      :style="displayStyle"
    >
      <div class="dock-panel-title">
        <span class="dock-title-text">{{ t(titleKey) }}</span>
        <span class="dock-title-actions">
          <button
            type="button"
            class="dock-title-btn"
            :title="t('dock.collapse')"
            @click="onCollapseClick"
          >
            {{ t("dock.collapseShort") }}
          </button>
          <button
            type="button"
            class="dock-title-btn"
            :title="maximized ? t('dock.restore') : t('dock.maximize')"
            @click="onMaximizeClick"
          >
            {{ maximized ? t("dock.restoreShort") : t("dock.maximizeShort") }}
          </button>
        </span>
      </div>
      <div class="dock-panel-body">
        <slot />
      </div>
    </div>
  </div>

  <!-- 右侧：[ 显示区 | 缘条 ] -->
  <div
    v-else-if="dockId === 'right'"
    class="dock-side dock-side--right"
    :class="{ collapsed: isCollapsed() }"
  >
    <div
      v-show="!isCollapsed()"
      class="dock-display"
      :style="displayStyle"
    >
      <div class="dock-panel-title">
        <span class="dock-title-text">{{ t(titleKey) }}</span>
        <span class="dock-title-actions">
          <button
            type="button"
            class="dock-title-btn"
            :title="t('dock.collapse')"
            @click="onCollapseClick"
          >
            {{ t("dock.collapseShort") }}
          </button>
          <button
            type="button"
            class="dock-title-btn"
            :title="maximized ? t('dock.restore') : t('dock.maximize')"
            @click="onMaximizeClick"
          >
            {{ maximized ? t("dock.restoreShort") : t("dock.maximizeShort") }}
          </button>
        </span>
      </div>
      <div class="dock-panel-body">
        <slot />
      </div>
    </div>
    <div class="dock-edge dock-edge--vertical" :title="edgeTitle()">
      <button
        type="button"
        class="dock-edge-btn dock-edge-btn--vertical"
        :aria-expanded="!isCollapsed()"
        @click="onCollapseClick"
      >
        {{ t(titleKey) }}
      </button>
    </div>
  </div>

  <!-- 底部 -->
  <div
    v-else
    class="dock-side dock-side--bottom"
    :class="{ collapsed: isCollapsed() }"
  >
    <div
      v-show="!isCollapsed()"
      class="dock-display dock-display--bottom"
      :style="displayStyle"
    >
      <div class="dock-panel-title">
        <span class="dock-title-text">{{ t(titleKey) }}</span>
        <span class="dock-title-actions">
          <button
            type="button"
            class="dock-title-btn"
            :title="t('dock.collapse')"
            @click="onCollapseClick"
          >
            {{ t("dock.collapseShort") }}
          </button>
          <button
            type="button"
            class="dock-title-btn"
            :title="maximized ? t('dock.restore') : t('dock.maximize')"
            @click="onMaximizeClick"
          >
            {{ maximized ? t("dock.restoreShort") : t("dock.maximizeShort") }}
          </button>
        </span>
      </div>
      <div class="dock-panel-body dock-panel-body--bottom">
        <slot />
      </div>
    </div>
    <div class="dock-edge dock-edge--bottom" :title="edgeTitle()">
      <button
        type="button"
        class="dock-edge-btn dock-edge-btn--bottom"
        :aria-expanded="!isCollapsed()"
        @click="onCollapseClick"
      >
        {{ t(titleKey) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.dock-side {
  display: flex;
  align-items: stretch;
  min-height: 0;
  background: var(--bg-panel);
  border-color: var(--border);
  border-style: solid;
  border-width: 0;
}

.dock-side--left,
.dock-side--right {
  flex-direction: row;
  flex: 0 0 auto;
}

.dock-side--left {
  border-right-width: 1px;
}

.dock-side--right {
  border-left-width: 1px;
}

.dock-side--bottom {
  flex-direction: column;
  flex: 0 0 auto;
  border-top-width: 1px;
  max-height: none;
}

.dock-edge--vertical {
  flex: 0 0 auto;
  width: 28px;
  min-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  background: var(--bg-toolbar);
  border-color: var(--border);
  border-style: solid;
  border-width: 0;
}

.dock-side--left .dock-edge--vertical {
  border-right-width: 1px;
}

.dock-side--right .dock-edge--vertical {
  border-left-width: 1px;
}

.dock-edge-btn--vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  max-height: 120px;
}

.dock-edge--bottom {
  flex: 0 0 auto;
  width: 100%;
  min-height: 28px;
  height: 28px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 2px 6px;
  background: var(--bg-toolbar);
  border-color: var(--border);
  border-style: solid;
  border-width: 0;
  border-top-width: 1px;
}

.dock-edge-btn {
  border: 1px solid var(--border);
  background: var(--bg-panel);
  color: var(--text);
  padding: 6px 2px;
  border-radius: 2px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-edge-btn--bottom {
  writing-mode: horizontal-tb;
  transform: none;
  padding: 2px 10px;
  max-height: none;
  max-width: 160px;
}

.dock-display {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dock-display--bottom {
  width: 100% !important;
  max-width: none;
  min-height: 96px;
  flex: 0 0 auto;
}

.dock-side.collapsed .dock-display {
  display: none !important;
}

.dock-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-toolbar);
  flex: 0 0 auto;
  min-height: 28px;
}

.dock-title-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dock-title-actions {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
}

.dock-title-btn {
  min-width: 22px;
  height: 22px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 1;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--bg-panel);
  color: var(--text);
  cursor: pointer;
}

.dock-title-btn:hover {
  border-color: var(--accent);
  background: rgba(0, 120, 212, 0.12);
}

.dock-panel-body {
  flex: 1;
  overflow: auto;
  padding: 8px;
  min-height: 0;
}

.dock-panel-body--bottom {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 8px;
  background: var(--timeline-bg);
}
</style>
