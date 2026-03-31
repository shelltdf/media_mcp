export type PreviewKind =
  | "video"
  | "audio"
  | "image"
  | "text"
  | "midi"
  | "none";

/** 根据 MIME 与扩展名判断预览方式（浏览器能力内） */
export function getPreviewKind(file: File): PreviewKind {
  const t = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("image/")) return "image";

  if (
    t.startsWith("text/") ||
    /\.(srt|vtt|ass|ssa|smi|stl|ttml|sbv|lrc)$/i.test(name)
  ) {
    return "text";
  }

  if (
    t === "audio/midi" ||
    t === "audio/x-midi" ||
    /\.mid(i)?$/i.test(name) ||
    /\.kar$/i.test(name)
  ) {
    return "midi";
  }

  return "none";
}
