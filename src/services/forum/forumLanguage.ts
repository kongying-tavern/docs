export function canonicalizeLanguage(language?: string | null): string | null {
  if (!language)
    return null
  try {
    return Intl.getCanonicalLocales(language)[0] ?? null
  }
  catch {
    return null
  }
}

export function areLanguagesEquivalent(first?: string | null, second?: string | null): boolean {
  const firstLanguage = canonicalizeLanguage(first)
  const secondLanguage = canonicalizeLanguage(second)
  if (!firstLanguage || !secondLanguage)
    return false
  if (firstLanguage === secondLanguage)
    return true

  const firstLocale = new Intl.Locale(firstLanguage).maximize()
  const secondLocale = new Intl.Locale(secondLanguage).maximize()
  return firstLocale.language === secondLocale.language && firstLocale.script === secondLocale.script
}
