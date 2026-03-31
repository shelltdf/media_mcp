import { getPreviewKind } from "@/composables/previewKind";

/** 媒体文件内可编辑/可上屏的逻辑通道（浏览器内无法完整解复用时的启发式模型） */
export type MediaChannelKind = "video" | "audio" | "subtitle" | "data";

export interface MediaChannel {
  id: string;
  kind: MediaChannelKind;
  /** 展示用短标签（英文技术名，界面层可再本地化） */
  label: string;
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

/** 根据 MIME/扩展名推断「可能存在的」通道列表（占位：真实多路轨需容器解析） */
export function inferMediaChannels(file: File): MediaChannel[] {
  const name = file.name;
  const e = ext(name);
  if (e === ".mka") {
    return [{ id: "a0", kind: "audio", label: "Audio 1 (Matroska)" }];
  }
  const pk = getPreviewKind(file);

  if (pk === "video") {
    const ch: MediaChannel[] = [
      { id: "v0", kind: "video", label: "Video 1" },
      { id: "a0", kind: "audio", label: "Audio 1" },
    ];
    if (/\.(mkv|mp4|mov|m4v|webm)$/i.test(name)) {
      ch.push({
        id: "s0",
        kind: "subtitle",
        label: "Subtitle (embedded)",
      });
    }
    return ch;
  }

  if (pk === "audio") {
    return [{ id: "a0", kind: "audio", label: "Audio 1" }];
  }

  if (pk === "image") {
    return [{ id: "v0", kind: "video", label: "Still / Image" }];
  }

  if (pk === "text") {
    return [{ id: "s0", kind: "subtitle", label: "Subtitle / Text" }];
  }

  if (pk === "midi") {
    return [{ id: "d0", kind: "data", label: "MIDI" }];
  }

  if (
    e === ".mka" ||
    e === ".aac" ||
    e === ".m4a" ||
    file.type.startsWith("audio/")
  ) {
    return [{ id: "a0", kind: "audio", label: "Audio 1" }];
  }

  return [{ id: "d0", kind: "data", label: "Data" }];
}
