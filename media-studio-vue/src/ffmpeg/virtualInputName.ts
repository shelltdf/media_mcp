/** MEMFS 虚拟输入文件名（与扩展名一致便于 ffmpeg 识别容器） */
export function virtualInputName(file: File): string {
  const m = file.name.match(/(\.[^.]+)$/);
  const ext = m ? m[1] : ".bin";
  return `input${ext}`;
}
