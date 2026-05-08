/** Matches LC- prefix in locale labels */
const LC_PREFIX_REGEX = /^LC-/g

export function getForumLocaleLabelGetter() {
  const getLabel = (locale?: string | null | undefined) =>
    locale ? `LC-${locale}` : null

  const getLocale = (label?: string | null | undefined) =>
    label ? String(label).replace(LC_PREFIX_REGEX, '') : null

  const isLabel = (label?: string | null | undefined) =>
    label && String(label).startsWith('LC-')

  return {
    getLabel,
    getLocale,
    isLabel,
  }
}
