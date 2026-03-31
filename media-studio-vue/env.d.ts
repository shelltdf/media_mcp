/// <reference types="vite/client" />

/** Partial File System Access API for showSaveFilePicker */
interface FilePickerAcceptType {
  description: string;
  accept: Record<string, string[]>;
}

interface Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: FilePickerAcceptType[];
  }) => Promise<FileSystemFileHandle>;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
