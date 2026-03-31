import {
  computed,
  inject,
  provide,
  ref,
  type InjectionKey,
  type Ref,
} from "vue";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  t: string;
  level: LogLevel;
  message: string;
}

export interface LogApi {
  entries: Ref<LogEntry[]>;
  log: (level: LogLevel, message: string) => void;
  summary: Ref<string>;
  fullText: Ref<string>;
}

const LogKey: InjectionKey<LogApi> = Symbol("media-studio-log");

function createLog(): LogApi {
  const entries = ref<LogEntry[]>([]);

  function log(level: LogLevel, message: string) {
    entries.value = [
      ...entries.value,
      { t: new Date().toISOString(), level, message },
    ];
  }

  const summary = computed(
    () => entries.value[entries.value.length - 1]?.message ?? "",
  );

  const fullText = computed(() =>
    entries.value
      .map((e) => `[${e.t}] [${e.level}] ${e.message}`)
      .join("\n"),
  );

  return { entries, log, summary, fullText };
}

export function provideLog(): LogApi {
  const api = createLog();
  provide(LogKey, api);
  return api;
}

export function useLog(): LogApi {
  const api = inject(LogKey);
  if (!api) {
    throw new Error("useLog() requires provideLog() in ancestor");
  }
  return api;
}
