/** 用 video/audio 元素探测时长（秒），失败返回 null */
export function probeDurationSec(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const t = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    const isVideo =
      t.startsWith("video/") ||
      /\.(mp4|webm|mkv|mov|avi|m4v|ogv)$/i.test(name);
    const isAudio =
      t.startsWith("audio/") || /\.(mp3|wav|ogg|opus|m4a|aac|flac)$/i.test(name);

    if (!isVideo && !isAudio) {
      resolve(null);
      return;
    }

    const el = document.createElement(isVideo ? "video" : "audio");
    el.preload = "metadata";
    el.muted = true;
    const url = URL.createObjectURL(file);

    const done = (d: number | null) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      resolve(d);
    };

    el.onloadedmetadata = () => {
      const d = el.duration;
      done(Number.isFinite(d) && !Number.isNaN(d) ? d : null);
    };
    el.onerror = () => done(null);
    el.src = url;
  });
}
