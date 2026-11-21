export function ensureStartingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function removeQueryParam(param: string) {
  const urlObj = new URL(location.href)
  urlObj.searchParams.delete(param)
  const url = urlObj.toString()
  window.history.replaceState({}, '', url)
  return url
}
