import type ForumAPI from '@/apis/forum/api'

import { filterSet } from '~/stores/useForumData'

export function getValidFilter(value?: string): ForumAPI.FilterBy | null {
  if (import.meta.env.SSR)
    return null
  const filter = value || location.hash.slice(1)
  return filterSet.has(filter) ? (filter as ForumAPI.FilterBy) : null
}
