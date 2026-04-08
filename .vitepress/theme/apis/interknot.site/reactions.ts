import type { INTER_KNOT } from './api'
import { fetcher } from '.'

export async function getPageReaction(options?: { userId?: string, url?: string }): Promise<INTER_KNOT.ReactionResponse | null> {
  if (import.meta.env.SSR)
    return null
  return fetcher
    .get('reactions', {
      searchParams: {
        ...(options?.userId ? { userId: options.userId } : {}),
        ...(options?.url ? { url: options.url } : {}),
      },
    })
    .json()
}

export async function setPageReaction(action: 'like' | 'dislike' | 'revoke', options?: { userId?: string, url?: string }): Promise<INTER_KNOT.ReactionResponse | null> {
  if (import.meta.env.SSR)
    return null
  return fetcher
    .get('reactions/add', {
      searchParams: {
        action,
        ...(options?.userId ? { userId: options.userId } : {}),
        ...(options?.url ? { url: options.url } : {}),
      },
    })
    .json()
}
