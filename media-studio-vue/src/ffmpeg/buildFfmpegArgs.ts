import type { ConversionSettings } from "@/composables/useConversionJob";

function addVideoCodecArgs(args: string[], settings: ConversionSettings): void {
  if (settings.videoCodec === "copy") {
    args.push("-c:v", "copy");
  } else if (settings.videoCodec === "libx264") {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      `${settings.videoBitrateK}k`,
    );
  } else if (settings.videoCodec === "libvpx-vp9") {
    args.push("-c:v", "libvpx-vp9", "-b:v", `${settings.videoBitrateK}k`);
  }
}

function addAudioCodecArgs(args: string[], settings: ConversionSettings): void {
  if (settings.audioCodec === "copy") {
    args.push("-c:a", "copy");
  } else if (settings.audioCodec === "aac") {
    args.push("-c:a", "aac", "-b:a", `${settings.audioBitrateK}k`);
  } else if (settings.audioCodec === "libopus") {
    args.push("-c:a", "libopus", "-b:a", `${settings.audioBitrateK}k`);
  }
}

/**
 * 字幕 / 数据轨 / 元数据（-sn -c:s -dn -map_metadata）
 * 纯音频导出（mp3/aac/wav）仅处理数据轨与元数据。
 */
function appendStreamFlags(
  args: string[],
  settings: ConversionSettings,
  fmt: string,
): void {
  const audioOnlyFmt = fmt === "mp3" || fmt === "aac" || fmt === "wav";
  if (audioOnlyFmt) {
    if (!settings.includeDataStreams) {
      args.push("-dn");
    }
    if (settings.preserveMetadata) {
      args.push("-map_metadata", "0");
    }
    return;
  }

  if (!settings.includeSubtitle) {
    args.push("-sn");
  } else if (settings.subtitleCodec === "copy") {
    args.push("-c:s", "copy");
  } else if (settings.subtitleCodec === "mov_text") {
    args.push("-c:s", "mov_text");
  } else {
    args.push("-c:s", "webvtt");
  }

  if (!settings.includeDataStreams) {
    args.push("-dn");
  }
  if (settings.preserveMetadata) {
    args.push("-map_metadata", "0");
  }
}

/** 根据 UI 选项生成 ffmpeg 参数（不含 -nostdin/-y，库会自动加） */
export function buildFfmpegArgs(
  settings: ConversionSettings,
  inputVirtualName: string,
  outputVirtualName: string,
): string[] {
  const fmt = settings.outputFormat;
  const audioOnlyContainer = fmt === "mp3" || fmt === "aac" || fmt === "wav";

  if (audioOnlyContainer) {
    const args: string[] = ["-i", inputVirtualName, "-vn"];
    if (fmt === "mp3") {
      args.push(
        "-c:a",
        "libmp3lame",
        "-b:a",
        `${settings.audioBitrateK}k`,
      );
    } else if (fmt === "wav") {
      args.push("-c:a", "pcm_s16le");
    } else {
      args.push(
        "-c:a",
        "aac",
        "-b:a",
        `${settings.audioBitrateK}k`,
      );
    }
    appendStreamFlags(args, settings, fmt);
    args.push(outputVirtualName);
    return args;
  }

  const wantVideo = settings.includeVideo;
  const wantAudio = settings.includeAudio;

  if (!wantVideo && !wantAudio) {
    throw new Error("ERR_NO_CHANNEL");
  }

  const args: string[] = ["-i", inputVirtualName];

  if (!wantVideo && wantAudio) {
    args.push("-vn");
    addAudioCodecArgs(args, settings);
    appendStreamFlags(args, settings, fmt);
    args.push(outputVirtualName);
    return args;
  }

  if (wantVideo && !wantAudio) {
    if (settings.resolution !== "source" && settings.videoCodec !== "copy") {
      const [w, h] = settings.resolution.split("x");
      args.push("-vf", `scale=${w}:${h}`);
    }
    args.push("-an");
    addVideoCodecArgs(args, settings);
    appendStreamFlags(args, settings, fmt);
    args.push(outputVirtualName);
    return args;
  }

  if (settings.resolution !== "source" && settings.videoCodec !== "copy") {
    const [w, h] = settings.resolution.split("x");
    args.push("-vf", `scale=${w}:${h}`);
  }
  addVideoCodecArgs(args, settings);
  addAudioCodecArgs(args, settings);
  appendStreamFlags(args, settings, fmt);
  args.push(outputVirtualName);
  return args;
}
