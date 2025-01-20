export const sanitizeMarkdown = (
  markdown: string | null | undefined,
): string => {
  return (markdown || '').replace(/<!--.*(?=-->)-->/giu, '')
}
