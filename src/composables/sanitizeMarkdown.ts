export const sanitizeMarkdown = (
  markdown: string | null | undefined,
): string => {
  return (markdown || '')
    .replaceAll(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\s*\)/g, '')
    .replace(/<!--.*(?=-->)-->/giu, '')
    .replace(/\{define:[^}]*\}.*?\{\/define\}/giu, '')
    .replace(/\{color:[^}]*\}(.*?)\{\/color\}/giu, '$1')
}
