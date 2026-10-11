import type { ForumPersonalState } from './forumPersonalState'
import { gists, GiteeAPIError } from '~/forum/api/gitee'
import { decodeForumPersonalState, emptyForumPersonalState, serializeForumPersonalState } from './forumPersonalState'

const GIST_ID_KEY_PREFIX = 'forum-personal-gist:'
let writeQueue = Promise.resolve()

function gistStorageKey(userId: string): string {
  return `${GIST_ID_KEY_PREFIX}${userId}`
}

function cachedGistId(userId: string): string | null {
  try {
    return localStorage.getItem(gistStorageKey(userId))
  }
  catch {
    return null
  }
}

function cacheGistId(userId: string, id: string | null): void {
  try {
    const key = gistStorageKey(userId)
    if (id === null)
      localStorage.removeItem(key)
    else
      localStorage.setItem(key, id)
  }
  catch {
    // This optional locator cache must not affect remote read/write outcomes.
  }
}

function isForumStateGist(gist: gists.GiteeGist): boolean {
  // A missing state file is damaged data, not permission to create a replacement.
  return gist.description === gists.FORUM_STATE_GIST_DESCRIPTION
}

function gistContent(gist: gists.GiteeGist): string | undefined {
  return gist.files[gists.FORUM_STATE_GIST_FILE]?.content
}

export class ForumPersonalStateCorruptionError extends Error {
  constructor(public readonly gistId: string, reason: string) {
    super(`Forum personal state gist ${gistId} is invalid. ${reason}`)
    this.name = 'ForumPersonalStateCorruptionError'
  }
}

export class ForumPersonalStateConflictError extends Error {
  constructor(public readonly gistIds: string[]) {
    super('Multiple forum personal state gists were found. No state was overwritten.')
    this.name = 'ForumPersonalStateConflictError'
  }
}

export function readForumStateGist(gist: gists.GiteeGist): ForumPersonalState {
  if (gist.truncated)
    throw new Error('The forum personal state gist response is incomplete.')
  const result = decodeForumPersonalState(gistContent(gist))
  if (!result.ok)
    throw new ForumPersonalStateCorruptionError(String(gist.id), result.reason)
  return result.state
}

export interface ForumPersonalStateWriteContext extends gists.GistRequestOptions {
  assertCurrent?: () => void
}

async function findForumStateGist(userId: string, context: ForumPersonalStateWriteContext = {}): Promise<gists.GiteeGist | null> {
  const options = { expectedSessionGeneration: context.expectedSessionGeneration }
  const cachedId = cachedGistId(userId)
  if (cachedId) {
    try {
      const gist = await gists.getGist(cachedId, options)
      context.assertCurrent?.()
      if (isForumStateGist(gist))
        return gist
      cacheGistId(userId, null)
    }
    catch (error) {
      if (!(error instanceof GiteeAPIError) || error.state !== 404)
        throw error
      cacheGistId(userId, null)
    }
  }

  const candidates = new Map<string, gists.GiteeGist>()
  for (let page = 1; ; page++) {
    const summaries = await gists.listGists({ ...options, page })
    context.assertCurrent?.()
    for (const summary of summaries.filter(isForumStateGist))
      candidates.set(String(summary.id), summary)
    if (candidates.size > 1)
      throw new ForumPersonalStateConflictError([...candidates.keys()])
    if (summaries.length < 100)
      break
  }
  const summary = candidates.values().next().value
  if (!summary)
    return null

  const gist = await gists.getGist(String(summary.id), options)
  context.assertCurrent?.()
  if (!isForumStateGist(gist))
    throw new Error('The forum personal state gist changed during discovery.')
  cacheGistId(userId, String(gist.id))
  return gist
}

export async function loadForumPersonalState(userId: string, context: ForumPersonalStateWriteContext = {}): Promise<ForumPersonalState> {
  context.assertCurrent?.()
  const gist = await findForumStateGist(userId, context)
  return gist ? readForumStateGist(gist) : emptyForumPersonalState()
}

export async function updateForumPersonalState(
  userId: string,
  update: (state: ForumPersonalState) => ForumPersonalState,
  context: ForumPersonalStateWriteContext = {},
): Promise<ForumPersonalState> {
  const task = async () => {
    context.assertCurrent?.()
    const gist = await findForumStateGist(userId, context)
    context.assertCurrent?.()
    const next = update(gist ? readForumStateGist(gist) : emptyForumPersonalState())
    const content = serializeForumPersonalState(next)
    const options = { expectedSessionGeneration: context.expectedSessionGeneration }
    const saved = gist
      ? await gists.updateForumStateGist(String(gist.id), content, options)
      : await gists.createForumStateGist(content, options)
    context.assertCurrent?.()
    cacheGistId(userId, String(saved.id))
    return next
  }

  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request(`forum-personal-state:${userId}`, task)

  const queued = writeQueue.then(task, task)
  writeQueue = queued.then(() => undefined, () => undefined)
  return queued
}
