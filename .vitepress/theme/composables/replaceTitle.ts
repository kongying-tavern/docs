/** Matches title text before the pipe separator */
const TITLE_BEFORE_PIPE_REGEX = /[^|]+/

export function replaceTitle(title: string) {
  if (import.meta.env.SSR)
    return

  const oldTitle = document.title

  if (oldTitle.includes('|')) {
    document.title = oldTitle.replace(TITLE_BEFORE_PIPE_REGEX, ` ${title.trim()}`)
  }
  else {
    document.title = title
  }
}
