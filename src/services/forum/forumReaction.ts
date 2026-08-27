import type { INTER_KNOT } from '@/apis/interknot.site/api'

export type ReactionState = INTER_KNOT.ReactionState | null
type ReactionData = NonNullable<INTER_KNOT.ReactionResponse['data']['reaction']>

export interface TopicReaction {
  data: ReactionData
  state: ReactionState
}

interface ReactionEnvironment {
  production: boolean
  origin: string
}

interface ReactionViewer {
  identity: string
  ready: boolean
  userId?: string
}

export function reactionEnvironmentForOrigin(origin: string): ReactionEnvironment {
  const url = new URL(origin)
  return {
    production: url.protocol === 'https:' && url.hostname === 'yuanshen.site',
    origin: url.origin,
  }
}

export function createEmptyReaction(resourceUrl: string): ReactionData {
  return {
    id: 0,
    url: resourceUrl,
    likeCount: 0,
    dislikeCount: 0,
    clickCount: 0,
    createdAt: '',
    lastUpdatedAt: '',
  }
}

export function applyReactionIntent(current: TopicReaction, requested: INTER_KNOT.ReactionState): TopicReaction {
  const state = current.state === requested ? null : requested
  let likeCount = current.data.likeCount
  let dislikeCount = current.data.dislikeCount

  if (current.state === 'like')
    likeCount = Math.max(likeCount - 1, 0)
  else if (current.state === 'dislike')
    dislikeCount = Math.max(dislikeCount - 1, 0)

  if (state === 'like')
    likeCount += 1
  else if (state === 'dislike')
    dislikeCount += 1

  return {
    data: { ...current.data, likeCount, dislikeCount },
    state,
  }
}

export function topicReactionResource(topicId: string, environment: ReactionEnvironment): string {
  const path = `${environment.production ? '/docs' : ''}/feedback/topic/${encodeURIComponent(topicId)}`
  return new URL(path, environment.production ? 'https://yuanshen.site' : environment.origin).href
}

export function resolveReactionViewer(authenticated: boolean, userId?: string | number): ReactionViewer {
  const id = userId === undefined || userId === null ? '' : String(userId)
  if (!authenticated)
    return { identity: 'guest', ready: true }
  return id
    ? { identity: `user:${id}`, ready: true, userId: id }
    : { identity: 'user:pending', ready: false }
}

export function reactionCacheIdentity(resourceUrl: string, viewerIdentity: string): string {
  return `${new URL(resourceUrl).href}|${viewerIdentity}`
}

export function normalizeReactionResponse(
  response: INTER_KNOT.ReactionResponse,
  resourceUrl: string,
): TopicReaction {
  return {
    data: response.data.reaction ?? createEmptyReaction(resourceUrl),
    state: response.data.state ?? null,
  }
}

export async function coordinateReactionMutation(options: {
  pending: Set<string>
  key: string
  current: TopicReaction
  requested: INTER_KNOT.ReactionState
  update: (value: TopicReaction) => void
  write: (action: INTER_KNOT.ReactionState | 'revoke') => Promise<void>
}): Promise<boolean> {
  if (options.pending.has(options.key))
    return false

  const previous = options.current
  const optimistic = applyReactionIntent(previous, options.requested)
  options.pending.add(options.key)
  options.update(optimistic)

  try {
    await options.write(optimistic.state ?? 'revoke')
    return true
  }
  catch (error) {
    options.update(previous)
    throw error
  }
  finally {
    options.pending.delete(options.key)
  }
}
