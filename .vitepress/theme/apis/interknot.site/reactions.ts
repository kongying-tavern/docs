import type { INTER_KNOT } from './api'
import { fetcher } from '.'

export interface ReactionQuery {
  userId?: string
  url: string
}

export async function getPageReaction(query: ReactionQuery): Promise<INTER_KNOT.ReactionResponse | null> {
  if (import.meta.env.SSR)
    return null

  return fetcher
    .get('reactions', {
      searchParams: {
        userId: query.userId,
        url: query.url,
      },
      cache: 'no-store',
    })
    .json<INTER_KNOT.ReactionResponse>()
}

export async function setPageReaction(action: 'like' | 'dislike' | 'revoke', query: ReactionQuery): Promise<INTER_KNOT.ReactionResponse | null> {
  if (import.meta.env.SSR)
    return null

  return fetcher
    .get('reactions/add', {
      searchParams: {
        action,
        userId: query.userId,
        url: query.url,
      },
      cache: 'no-store',
      retry: 0,
    })
    .json<INTER_KNOT.ReactionResponse>()
}
