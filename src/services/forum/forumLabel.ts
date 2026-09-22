export const CATEGORY_LABEL_PREFIX = 'CATA-'

export function isCategoryLabel(label: string): boolean {
  return label.startsWith(CATEGORY_LABEL_PREFIX)
}
