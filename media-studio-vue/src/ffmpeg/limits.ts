/** 超过则跳过 ffmpeg 探针（避免内存与耗时） */
export const FFMPEG_MAX_PROBE_BYTES = 450 * 1024 * 1024;

/** 超过则跳过 ffmpeg 预览转码，仍用浏览器直接播放原 blob */
export const FFMPEG_MAX_PREVIEW_BYTES = 250 * 1024 * 1024;
