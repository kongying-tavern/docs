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
  return gist.description === gists.FORUM_STATE_GIST_DESCRIPTION
    && Boolean(gist.files[gists.FORUM_STATE_GIST_FILE])
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

export function readForumStateGist(gist: gists.GiteeGist): ForumPersonalState {
  const result = decodeForumPersonalState(gistContent(gist))
  if (!result.ok)
    throw new ForumPersonalStateCorruptionError(String(gist.id), result.reason)
  return result.state
}

async function findForumStateGist(userId: string): Promise<gists.GiteeGist | null> {
  const cachedId = cachedGistId(userId)
  if (cachedId) {
    try {
      const gist = await gists.getGist(cachedId)
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

  const summary = (await gists.listGists()).find(isForumStateGist)
  if (!summary)
    return null

  const gist = await gists.getGist(String(summary.id))
  cacheGistId(userId, String(gist.id))
  return gist
}

export async function loadForumPersonalState(userId: string): Promise<ForumPersonalState> {
  const gist = await findForumStateGist(userId)
  return gist ? readForumStateGist(gist) : emptyForumPersonalState()
}

export async function updateForumPersonalState(
  userId: string,
  update: (state: ForumPersonalState) => ForumPersonalState,
): Promise<ForumPersonalState> {
  const task = async () => {
    const gist = await findForumStateGist(userId)
    const next = update(gist ? readForumStateGist(gist) : emptyForumPersonalState())
    const content = serializeForumPersonalState(next)
    const saved = gist
      ? await gists.updateForumStateGist(String(gist.id), content)
      : await gists.createForumStateGist(content)
    cacheGistId(userId, String(saved.id))
    return next
  }

  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request(`forum-personal-state:${userId}`, task)

  const queued = writeQueue.then(task, task)
  writeQueue = queued.then(() => undefined, () => undefined)
  return queued
}
