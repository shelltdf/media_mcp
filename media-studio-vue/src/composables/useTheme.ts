import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

export type ThemeMode = "light" | "dark" | "system";

const storageKey = "media-studio-theme-mode";

function resolveDark(mode: ThemeMode): boolean {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return mode === "dark";
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute(
    "data-theme",
    resolveDark(mode) ? "dark" : "light",
  );
}

export function useTheme(): {
  mode: Ref<ThemeMode>;
  setMode: (m: ThemeMode) => void;
} {
  const stored =
    typeof localStorage !== "undefined"
      ? (localStorage.getItem(storageKey) as ThemeMode | null)
      : null;
  const mode = ref<ThemeMode>(
    stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system",
  );

  let mql: MediaQueryList | null = null;

  function onSchemeChange() {
    if (mode.value === "system") applyTheme("system");
  }

  onMounted(() => {
    applyTheme(mode.value);
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", onSchemeChange);
  });

  onUnmounted(() => {
    mql?.removeEventListener("change", onSchemeChange);
  });

  watch(
    mode,
    (m) => {
      localStorage.setItem(storageKey, m);
      applyTheme(m);
    },
    { flush: "post" },
  );

  function setMode(m: ThemeMode) {
    mode.value = m;
  }

  return { mode, setMode };
}
