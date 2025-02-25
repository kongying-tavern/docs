export function sanitizeMarkdown(markdown: string | null | undefined): string {
  return (markdown || '')
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    .replaceAll(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\s*\)/g, '')
    .replace(/<!--.*(?=-->)-->/gu, '')
    .replace(/\{define:[^}]*\}.*?\{\/define\}/giu, '')
    .replace(/\{color:[^}]*\}(.*?)\{\/color\}/giu, '$1')
}
