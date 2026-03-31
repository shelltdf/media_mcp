/**
 * HTML `<input type="file" accept="...">` 取值。
 * 使用 audio/* / video/* / image/* 覆盖浏览器能识别的常见 MIME，
 * 并补充扩展名（含无统一 MIME 或各浏览器不一致的格式）。
 */
const MIME_GROUPS = ["audio/*", "video/*", "image/*"] as const;

/** 视频（容器/编码多样，扩展名为主） */
const VIDEO_EXT = [
  ".mp4",
  ".m4v",
  ".mov",
  ".qt",
  ".avi",
  ".mkv",
  ".webm",
  ".wmv",
  ".flv",
  ".f4v",
  ".ogv",
  ".3gp",
  ".3g2",
  ".mpg",
  ".mpeg",
  ".m2v",
  ".mp2",
  ".mpv",
  ".ts",
  ".m2ts",
  ".mts",
  ".vob",
  ".asf",
  ".divx",
  ".mxf",
  ".nut",
  ".rm",
  ".rmvb",
  ".y4m",
  ".wtv",
] as const;

/** 音频 */
const AUDIO_EXT = [
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".m4a",
  ".ogg",
  ".oga",
  ".opus",
  ".wma",
  ".aiff",
  ".aif",
  ".ape",
  ".ac3",
  ".eac3",
  ".dts",
  ".tta",
  ".mpc",
  ".spx",
  ".dsf",
  ".dff",
  ".wv",
] as const;

/** 图片 */
const IMAGE_EXT = [
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif",
  ".svg",
  ".ico",
  ".heic",
  ".heif",
  ".avif",
  ".raw",
  ".cr2",
  ".nef",
  ".dng",
  ".psd",
] as const;

/** MIDI */
const MIDI_EXT = [".mid", ".midi", ".kar", ".rmi", ".xmf", ".mxmf"] as const;

/** 字幕与文本轨道（不含泛用 .txt，避免与任意文本文档混淆） */
const SUBTITLE_EXT = [
  ".srt",
  ".vtt",
  ".ass",
  ".ssa",
  ".sub",
  ".smi",
  ".stl",
  ".ttml",
  ".dfxp",
  ".mks",
  ".sup",
  ".idx",
  ".sbv",
  ".lrc",
] as const;

const ALL_EXT = [
  ...VIDEO_EXT,
  ...AUDIO_EXT,
  ...IMAGE_EXT,
  ...MIDI_EXT,
  ...SUBTITLE_EXT,
];

export const MEDIA_FILE_ACCEPT = [...MIME_GROUPS, ...ALL_EXT].join(",");
