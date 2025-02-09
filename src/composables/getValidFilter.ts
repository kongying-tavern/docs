import { filterSet, type FilterType } from '~/stores/useForumData'

export function getValidFilter(value?: string): FilterType | null {
  if (import.meta.env.SSR) return null
  const filter = value || location.hash.slice(1)
  return filterSet.has(filter) ? (filter as FilterType) : null
}
