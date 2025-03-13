export function sanitizeMarkdown(markdown: string | null | undefined): string {
  return (markdown || '')
    // 删除标准图片语法
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    .replaceAll(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\s*\)/g, '')
    // 删除带有 {key:value} 的图片标签
    .replaceAll(/!\[(.*?)\]\((.*?)\)\{[^}]*\}/g, '')
    // 删除HTML注释
    .replace(/<!--.*(?=-->)-->/gu, '')
    // 删除自定义定义标签
    .replace(/\{define:[^}]*\}.*?\{\/define\}/giu, '')
    // 删除颜色标签并保留其中内容
    .replace(/\{color:[^}]*\}(.*?)\{\/color\}/giu, '$1')
}
