export function matchLanguages(
  languages: string[],
  acceptLanguages: readonly string[],
): string | null {
  const lang = acceptLanguages
    .map(userLang =>
      languages.find((currentLang) => {
        if (currentLang === userLang)
          return currentLang

        // Edge browser: case for ca-valencia
        if (currentLang === 'ca-valencia' && userLang === 'ca-Es-VALENCIA')
          return currentLang

        if (
          userLang.startsWith('es-')
          && userLang !== 'es-ES'
          && currentLang === 'es-419'
        ) {
          return currentLang
        }

        return currentLang.startsWith(userLang) ? currentLang : undefined
      }),
    )
    .filter(v => !!v)?.[0]
  if (lang)
    return lang

  const fallbackLang = acceptLanguages
    .map((userLang) => {
      userLang = userLang.split('-')[0]!
      return languages.find(lang => lang.startsWith(userLang))
    })
    .filter(v => !!v)[0]
  if (fallbackLang)
    return fallbackLang

  return null
}
