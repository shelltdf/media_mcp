/** 将文件名后缀替换为指定扩展名（不含点） */
export function replaceExtension(filename: string, extWithoutDot: string): string {
  const t = extWithoutDot.replace(/^\./, "");
  const base = filename.replace(/\.[^./\\]+$/u, "");
  return `${base}.${t}`;
}
