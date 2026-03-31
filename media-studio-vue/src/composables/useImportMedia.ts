import { useLog } from "@/composables/useLog";
import { useMediaLibrary } from "@/composables/useMediaLibrary";
import { MEDIA_FILE_ACCEPT } from "@/composables/mediaAccept";

export function useImportMedia() {
  const { log } = useLog();
  const { add } = useMediaLibrary();

  function importMedia() {
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
