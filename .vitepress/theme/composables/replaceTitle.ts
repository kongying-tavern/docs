export function replaceTitle(title: string) {
  if (import.meta.env.SSR)
    return

  const oldTitle = document.title

  if (oldTitle.includes('|')) {
    document.title = oldTitle.replace(/[^|]+/, ` ${title.trim()}`)
  }
  else {
    document.title = title
  }
}
