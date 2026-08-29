import type { ForumPersonalState } from './forumPersonalState'
import { gists, GiteeAPIError } from '@/apis/forum/gitee'
import { decodeForumPersonalState, emptyForumPersonalState, serializeForumPersonalState } from './forumPersonalState'

const GIST_ID_KEY_PREFIX = 'forum-personal-gist:'
let writeQueue = Promise.resolve()

function gistStorageKey(userId: string): string {
  return `${GIST_ID_KEY_PREFIX}${userId}`
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
  const key = gistStorageKey(userId)
  const cachedId = localStorage.getItem(key)
  if (cachedId) {
    try {
      const gist = await gists.getGist(cachedId)
      if (isForumStateGist(gist))
        return gist
      localStorage.removeItem(key)
    }
    catch (error) {
      if (!(error instanceof GiteeAPIError) || error.state !== 404)
        throw error
      localStorage.removeItem(key)
    }
  }

  const summary = (await gists.listGists()).find(isForumStateGist)
  if (!summary)
    return null

  const gist = await gists.getGist(String(summary.id))
  localStorage.setItem(key, String(gist.id))
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
    localStorage.setItem(gistStorageKey(userId), String(saved.id))
    return next
  }

  if (navigator.locks)
    return navigator.locks.request(`forum-personal-state:${userId}`, task)

  const queued = writeQueue.then(task, task)
  writeQueue = queued.then(() => undefined, () => undefined)
  return queued
}
