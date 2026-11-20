export function getLangPath(localeIndex: string) {
  return localeIndex === 'root' ? '/' : `/${localeIndex}/`
}

export function getLangCode(lang: string) {
  return lang.split('-')[0].toLowerCase()
}
