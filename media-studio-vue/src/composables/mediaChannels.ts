import { getPreviewKind } from "@/composables/previewKind";

/** 媒体文件内可编辑/可上屏的逻辑通道（浏览器内无法完整解复用时的启发式模型） */
export type MediaChannelKind = "video" | "audio" | "subtitle" | "data";

/** 属性面板中单行「标签 → 值」，值为 i18n key + 可选插值 */
export interface MediaChannelDetailRow {
  labelKey: string;
  valueKey: string;
  params?: Record<string, string>;
}

export interface MediaChannel {
  id: string;
  kind: MediaChannelKind;
  /** 展示用短标签（英文技术名，界面层可再本地化） */
  label: string;
  /** 推断详情（多行），供属性面板展示 */
  detailRows: MediaChannelDetailRow[];
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function mimeOrDash(file: File): string {
  return file.type?.trim() ? file.type : "—";
}

/** 根据 MIME/扩展名推断「可能存在的」通道列表（占位：真实多路轨需容器解析） */
export function inferMediaChannels(file: File): MediaChannel[] {
  const name = file.name;
  const e = ext(name);
  const mime = mimeOrDash(file);

  if (e === ".mka") {
    return [
      {
        id: "a0",
        kind: "audio",
        label: "Audio 1 (Matroska)",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.aRolePrimaryMka",
          },
          {
            labelKey: "channelDetail.dtCodec",
            valueKey: "channelDetail.codecFromMime",
            params: { mime },
          },
          {
            labelKey: "channelDetail.dtContainer",
            valueKey: "channelDetail.containerMka",
          },
          {
            labelKey: "channelDetail.dtStream",
            valueKey: "channelDetail.streamIndex",
            params: { n: "0" },
          },
          {
            labelKey: "channelDetail.dtLanguage",
            valueKey: "channelDetail.langUndetermined",
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteNoDemux",
          },
        ],
      },
    ];
  }

  const pk = getPreviewKind(file);

  if (pk === "video") {
    const video: MediaChannel = {
      id: "v0",
      kind: "video",
      label: "Video 1",
      detailRows: [
        {
          labelKey: "channelDetail.dtRole",
          valueKey: "channelDetail.vRolePrimary",
        },
        {
          labelKey: "channelDetail.dtCodec",
          valueKey: "channelDetail.codecVideoHint",
          params: { mime, ext: e || "—" },
        },
        {
          labelKey: "channelDetail.dtStream",
          valueKey: "channelDetail.streamIndex",
          params: { n: "0" },
        },
        {
          labelKey: "channelDetail.dtLanguage",
          valueKey: "channelDetail.langUndetermined",
        },
        {
          labelKey: "channelDetail.dtTiming",
          valueKey: "channelDetail.timingMuxed",
        },
        {
          labelKey: "channelDetail.dtPixelAspect",
          valueKey: "channelDetail.pixelAspectUnknown",
        },
        {
          labelKey: "channelDetail.dtNotes",
          valueKey: "channelDetail.noteNoDemux",
        },
      ],
    };

    const audio: MediaChannel = {
      id: "a0",
      kind: "audio",
      label: "Audio 1",
      detailRows: [
        {
          labelKey: "channelDetail.dtRole",
          valueKey: "channelDetail.aRoleMuxed",
        },
        {
          labelKey: "channelDetail.dtCodec",
          valueKey: "channelDetail.codecAudioHint",
          params: { mime, ext: e || "—" },
        },
        {
          labelKey: "channelDetail.dtStream",
          valueKey: "channelDetail.streamIndex",
          params: { n: "1" },
        },
        {
          labelKey: "channelDetail.dtLanguage",
          valueKey: "channelDetail.langUndetermined",
        },
        {
          labelKey: "channelDetail.dtSampleRate",
          valueKey: "channelDetail.sampleRateUnknown",
        },
        {
          labelKey: "channelDetail.dtChannelLayout",
          valueKey: "channelDetail.channelLayoutUnknown",
        },
        {
          labelKey: "channelDetail.dtNotes",
          valueKey: "channelDetail.noteNoDemux",
        },
      ],
    };

    const ch: MediaChannel[] = [video, audio];

    if (/\.(mkv|mp4|mov|m4v|webm)$/i.test(name)) {
      ch.push({
        id: "s0",
        kind: "subtitle",
        label: "Subtitle (embedded)",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.sRoleEmbedded",
          },
          {
            labelKey: "channelDetail.dtFormat",
            valueKey: "channelDetail.sFormatUnknown",
          },
          {
            labelKey: "channelDetail.dtStream",
            valueKey: "channelDetail.streamIndex",
            params: { n: "2" },
          },
          {
            labelKey: "channelDetail.dtLanguage",
            valueKey: "channelDetail.langUndetermined",
          },
          {
            labelKey: "channelDetail.dtEncoding",
            valueKey: "channelDetail.textEncodingUnknown",
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteSubtitleGuess",
          },
        ],
      });
    }
    return ch;
  }

  if (pk === "audio") {
    return [
      {
        id: "a0",
        kind: "audio",
        label: "Audio 1",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.aRolePrimary",
          },
          {
            labelKey: "channelDetail.dtCodec",
            valueKey: "channelDetail.codecFromMime",
            params: { mime },
          },
          {
            labelKey: "channelDetail.dtStream",
            valueKey: "channelDetail.streamIndex",
            params: { n: "0" },
          },
          {
            labelKey: "channelDetail.dtLanguage",
            valueKey: "channelDetail.langUndetermined",
          },
          {
            labelKey: "channelDetail.dtSampleRate",
            valueKey: "channelDetail.sampleRateUnknown",
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteNoDemux",
          },
        ],
      },
    ];
  }

  if (pk === "image") {
    return [
      {
        id: "v0",
        kind: "video",
        label: "Still / Image",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.vRoleStill",
          },
          {
            labelKey: "channelDetail.dtCodec",
            valueKey: "channelDetail.codecImageHint",
            params: { mime, ext: e || "—" },
          },
          {
            labelKey: "channelDetail.dtStream",
            valueKey: "channelDetail.streamIndex",
            params: { n: "0" },
          },
          {
            labelKey: "channelDetail.dtColor",
            valueKey: "channelDetail.colorInfoUnknown",
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteStillImage",
          },
        ],
      },
    ];
  }

  if (pk === "text") {
    return [
      {
        id: "s0",
        kind: "subtitle",
        label: "Subtitle / Text",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.sRoleExternalFile",
          },
          {
            labelKey: "channelDetail.dtFormat",
            valueKey: "channelDetail.sFormatFromExt",
            params: { ext: e || "—" },
          },
          {
            labelKey: "channelDetail.dtEncoding",
            valueKey: "channelDetail.textEncodingUtf8Assume",
          },
          {
            labelKey: "channelDetail.dtLanguage",
            valueKey: "channelDetail.langUndetermined",
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteTextSubtitle",
          },
        ],
      },
    ];
  }

  if (pk === "midi") {
    return [
      {
        id: "d0",
        kind: "data",
        label: "MIDI",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.dRoleMidi",
          },
          {
            labelKey: "channelDetail.dtFormat",
            valueKey: "channelDetail.dFormatMidi",
          },
          {
            labelKey: "channelDetail.dtStream",
            valueKey: "channelDetail.streamIndex",
            params: { n: "0" },
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteMidi",
          },
        ],
      },
    ];
  }

  if (
    e === ".aac" ||
    e === ".m4a" ||
    file.type.startsWith("audio/")
  ) {
    return [
      {
        id: "a0",
        kind: "audio",
        label: "Audio 1",
        detailRows: [
          {
            labelKey: "channelDetail.dtRole",
            valueKey: "channelDetail.aRolePrimary",
          },
          {
            labelKey: "channelDetail.dtCodec",
            valueKey: "channelDetail.codecFromMime",
            params: { mime },
          },
          {
            labelKey: "channelDetail.dtStream",
            valueKey: "channelDetail.streamIndex",
            params: { n: "0" },
          },
          {
            labelKey: "channelDetail.dtNotes",
            valueKey: "channelDetail.noteNoDemux",
          },
        ],
      },
    ];
  }

  return [
    {
      id: "d0",
      kind: "data",
      label: "Data",
      detailRows: [
        {
          labelKey: "channelDetail.dtRole",
          valueKey: "channelDetail.dRoleGeneric",
        },
        {
          labelKey: "channelDetail.dtCodec",
          valueKey: "channelDetail.codecFromMime",
          params: { mime },
        },
        {
          labelKey: "channelDetail.dtStream",
          valueKey: "channelDetail.streamIndex",
          params: { n: "0" },
        },
        {
          labelKey: "channelDetail.dtNotes",
          valueKey: "channelDetail.noteUnknownKind",
        },
      ],
    },
  ];
}
