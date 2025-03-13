import type { INTER_KNOT } from './api'
import { fetcher } from '.'

export async function getPageReaction(userId?: string): Promise<INTER_KNOT.ReactionResponse | null> {
  if (import.meta.env.SSR)
    return null
  return fetcher
    .get('reactions', {
      searchParams: {
        ...(userId ? { userId } : {}),
      },
    })
    .json()
}

export async function setPageReaction(action: 'like' | 'dislike' | 'revoke', userId?: string): Promise<INTER_KNOT.ReactionResponse | null> {
  if (import.meta.env.SSR)
    return null
  return fetcher
    .get('reactions/add', {
      searchParams: {
        action,
        ...(userId ? { userId } : {}),
      },
    })
    .json()
}
