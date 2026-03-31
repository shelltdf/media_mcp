import { reactive } from "vue";

const LIMITS = {
  left: { min: 160, max: 560 },
  right: { min: 160, max: 560 },
  bottom: { min: 96, max: 420 },
} as const;

export type DockSideId = "left" | "right" | "bottom";

export const dockLayout = reactive({
  leftPanelW: 220,
  rightPanelW: 260,
  /** 底部 Dock 显示区（标题+内容）总高度近似控制 */
  bottomPanelH: 160,
  leftCollapsed: false,
  rightCollapsed: false,
  bottomCollapsed: false,
  leftMaximized: false,
  rightMaximized: false,
  bottomMaximized: false,
  _stashLeft: 220,
  _stashRight: 260,
  _stashBottom: 160,
});

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function useDockLayout() {
  function toggleCollapse(id: DockSideId) {
    if (id === "left") dockLayout.leftCollapsed = !dockLayout.leftCollapsed;
    else if (id === "right") dockLayout.rightCollapsed = !dockLayout.rightCollapsed;
    else dockLayout.bottomCollapsed = !dockLayout.bottomCollapsed;
  }

  function toggleMaximize(
    id: DockSideId,
    mainRowEl: HTMLElement | null,
    mainBodyEl: HTMLElement | null,
  ) {
    if (id === "left") {
      if (dockLayout.leftMaximized) {
        dockLayout.leftPanelW = dockLayout._stashLeft;
        dockLayout.leftMaximized = false;
      } else if (mainRowEl) {
        dockLayout._stashLeft = dockLayout.leftPanelW;
        const w = mainRowEl.clientWidth;
        dockLayout.leftPanelW = clamp(
          Math.floor(w * 0.45),
          LIMITS.left.min,
          LIMITS.left.max,
        );
        dockLayout.leftMaximized = true;
      }
    } else if (id === "right") {
      if (dockLayout.rightMaximized) {
        dockLayout.rightPanelW = dockLayout._stashRight;
        dockLayout.rightMaximized = false;
      } else if (mainRowEl) {
        dockLayout._stashRight = dockLayout.rightPanelW;
        const w = mainRowEl.clientWidth;
        dockLayout.rightPanelW = clamp(
          Math.floor(w * 0.45),
          LIMITS.right.min,
          LIMITS.right.max,
        );
        dockLayout.rightMaximized = true;
      }
    } else {
      if (dockLayout.bottomMaximized) {
        dockLayout.bottomPanelH = dockLayout._stashBottom;
        dockLayout.bottomMaximized = false;
      } else if (mainBodyEl) {
        dockLayout._stashBottom = dockLayout.bottomPanelH;
        const h = mainBodyEl.clientHeight;
        dockLayout.bottomPanelH = clamp(
          Math.floor(h * 0.62),
          LIMITS.bottom.min,
          LIMITS.bottom.max,
        );
        dockLayout.bottomMaximized = true;
      }
    }
  }

  function cancelMaxOnManualResize(id: DockSideId) {
    if (id === "left" && dockLayout.leftMaximized) dockLayout.leftMaximized = false;
    if (id === "right" && dockLayout.rightMaximized)
      dockLayout.rightMaximized = false;
    if (id === "bottom" && dockLayout.bottomMaximized)
      dockLayout.bottomMaximized = false;
  }

  function onResizeLeftStart(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = dockLayout.leftPanelW;
    function move(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      dockLayout.leftPanelW = clamp(
        startW + dx,
        LIMITS.left.min,
        LIMITS.left.max,
      );
      cancelMaxOnManualResize("left");
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  function onResizeRightStart(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = dockLayout.rightPanelW;
    function move(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      dockLayout.rightPanelW = clamp(
        startW - dx,
        LIMITS.right.min,
        LIMITS.right.max,
      );
      cancelMaxOnManualResize("right");
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  function onResizeBottomStart(e: MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = dockLayout.bottomPanelH;
    function move(ev: MouseEvent) {
      const dy = ev.clientY - startY;
      dockLayout.bottomPanelH = clamp(
        startH - dy,
        LIMITS.bottom.min,
        LIMITS.bottom.max,
      );
      cancelMaxOnManualResize("bottom");
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  return {
    dockLayout,
    LIMITS,
    toggleCollapse,
    toggleMaximize,
    onResizeLeftStart,
    onResizeRightStart,
    onResizeBottomStart,
  };
}
