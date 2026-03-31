import { FILE_PICKER_ID_IMPORT } from "@/constants/filePickerIds";
import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import {
  getMediaPickerTypesForOpen,
  MEDIA_FILE_ACCEPT,
} from "@/composables/mediaAccept";

export function useImportMedia() {
  const { log } = useLog();
  const { add } = useMediaLibrary();

  function importMedia() {
    void importMediaAsync();
  }

  async function importMediaAsync() {
    const openPicker = window.showOpenFilePicker;
    if (typeof openPicker === "function") {
      try {
        const handles = await openPicker({
          multiple: true,
          id: FILE_PICKER_ID_IMPORT,
          types: getMediaPickerTypesForOpen(),
        });
        for (const h of handles) {
          const f = await h.getFile();
          add(f);
          log("info", `Imported: ${f.name} (${f.type || "unknown type"})`);
        }
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        log("warn", `Open file picker fallback: ${String(e)}`);
      }
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = MEDIA_FILE_ACCEPT;
    input.multiple = true;
    input.onchange = () => {
      const files = input.files;
      if (!files?.length) return;
      for (let i = 0; i < files.length; i++) {
        const f = files[i]!;
        add(f);
        log("info", `Imported: ${f.name} (${f.type || "unknown type"})`);
      }
    };
    input.click();
  }

  return { importMedia, accept: MEDIA_FILE_ACCEPT };
}
