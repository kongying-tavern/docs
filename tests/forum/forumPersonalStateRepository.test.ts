import type { GiteeGist } from '../../src/forum/api/gitee/gists'
import type { ForumPersonalState } from '../../src/forum/services/forumPersonalState'
import { beforeEach, expect, test, vi } from 'vitest'
import { clearApiCache } from '../../src/forum/api/gitee'
import { FORUM_STATE_BACKUP_DESCRIPTION, FORUM_STATE_BACKUP_FILE, FORUM_STATE_GIST_DESCRIPTION, FORUM_STATE_GIST_FILE } from '../../src/forum/api/gitee/gists'
import { emptyForumPersonalState, setFollowedTopic, toggleFollowedTopic } from '../../src/forum/services/forumPersonalState'
import { ForumPersonalStateConflictError, ForumPersonalStateCorruptionError, loadForumPersonalState, recoverForumPersonalState, updateForumPersonalState } from '../../src/forum/services/forumPersonalStateRepository'

const aliceKey = 'forum-personal-gist:alice'
const topicA = { topicId: 'IA', title: 'Topic A', type: 'BUG' as const, authorLogin: 'alice', recordedAt: '2026-10-12T00:00:00.000Z' }
const topicB = { ...topicA, topicId: 'IB', title: 'Topic B' }
let remote: Map<string, GiteeGist>
let values: Map<string, string>
let calls: Array<{ method: string, endpoint: string, page: number }>
let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
let detailStatus: number | undefined
let afterRead: (() => Promise<void>) | undefined
let afterList: (() => Promise<void>) | undefined
let listFailurePage: number | undefined
let backupFailure: boolean
let patchFailure: boolean
let afterBackup: (() => void) | undefined

function stateGist(id = 'existing', state = emptyForumPersonalState()): GiteeGist {
  return { id, description: FORUM_STATE_GIST_DESCRIPTION, public: false, files: { [FORUM_STATE_GIST_FILE]: { content: JSON.stringify(state) } } }
}

function seed(state = emptyForumPersonalState()): void {
  remote.set('existing', stateGist('existing', state))
  values.set(aliceKey, 'existing')
}

function savedState(): ForumPersonalState {
  return JSON.parse(remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content!) as ForumPersonalState
}

function twoReaders(): () => Promise<void> {
  let count = 0
  let release!: () => void
  const ready = new Promise<void>(resolve => release = resolve)
  return async () => {
    if (++count === 2)
      release()
    await ready
  }
}

beforeEach(() => {
  clearApiCache()
  remote = new Map()
  values = new Map()
  calls = []
  detailStatus = undefined
  afterRead = undefined
  afterList = undefined
  listFailurePage = undefined
  backupFailure = false
  patchFailure = false
  afterBackup = undefined
  storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('navigator', {})
  // Exercise the actual provider, request client, response parsing and repository.
  // The in-memory server is only the HTTP boundary; no real account is touched.
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    const url = new URL(request.url)
    const endpoint = url.pathname.replace(/^\/api\/v5\//, '')
    const page = Number(url.searchParams.get('page') ?? 1)
    calls.push({ method: request.method, endpoint, page })
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (request.method === 'GET' && endpoint === 'gists') {
      if (page === listFailurePage)
        return reply({ message: 'Forbidden' }, 403)
      const perPage = Number(url.searchParams.get('per_page') ?? 20)
      const snapshot = [...remote.values()].slice((page - 1) * perPage, page * perPage)
      await afterList?.()
      return reply(snapshot)
    }
    const id = endpoint.startsWith('gists/') ? endpoint.slice(6) : ''
    if (request.method === 'GET' && id) {
      if (detailStatus)
        return reply({ message: 'Detail read failed' }, detailStatus)
      const snapshot = remote.get(id) ? structuredClone(remote.get(id)!) : null
      await afterRead?.()
      return snapshot ? reply(snapshot) : reply({ message: 'Not found' }, 404)
    }
    if ((request.method === 'POST' && endpoint === 'gists') || (request.method === 'PATCH' && id)) {
      const payload = await request.json() as Pick<GiteeGist, 'description' | 'files' | 'public'>
      if (payload.description === FORUM_STATE_BACKUP_DESCRIPTION && backupFailure)
        return reply({ message: 'Backup failed' }, 403)
      if (request.method === 'PATCH' && patchFailure)
        return reply({ message: 'Update failed' }, 403)
      const target = id || `created-${remote.size + 1}`
      const gist: GiteeGist = { id: target, ...payload }
      remote.set(target, gist)
      if (payload.description === FORUM_STATE_BACKUP_DESCRIPTION)
        afterBackup?.()
      return reply(gist, request.method === 'POST' ? 201 : 200)
    }
    throw new Error(`Unexpected audit request: ${request.method} ${endpoint}`)
  })
})

test('loading an absent remote state does not create a gist', async () => {
  expect(await loadForumPersonalState('alice')).toEqual(emptyForumPersonalState())
  expect(remote.size).toBe(0)
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('a stale cached ID is discarded and the real gist is rediscovered', async () => {
  seed({ ...emptyForumPersonalState(), followedTopics: [topicA] })
  values.set(aliceKey, 'deleted')
  expect((await loadForumPersonalState('alice')).followedTopics).toEqual([topicA])
  expect(values.get(aliceKey)).toBe('existing')
})

test('an unrelated cached gist is preserved and replaced only as a local pointer', async () => {
  seed({ ...emptyForumPersonalState(), followedTopics: [topicA] })
  const unrelated = { ...stateGist('unrelated'), description: 'Unrelated gist' }
  remote.set('unrelated', unrelated)
  values.set(aliceKey, 'unrelated')
  expect((await loadForumPersonalState('alice')).followedTopics).toEqual([topicA])
  expect(values.get(aliceKey)).toBe('existing')
  expect(remote.get('unrelated')).toEqual(unrelated)
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('a forbidden detail read must not create or overwrite remote state', async () => {
  seed()
  detailStatus = 403
  await expect(updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicA))).rejects.toMatchObject({ state: 403 })
  expect(remote.size).toBe(1)
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test.each([
  ['invalid JSON', '{'],
  ['empty file', ''],
  ['missing file content', undefined],
  ['future version', JSON.stringify({ version: 2, followedTopics: [], recentParticipated: [] })],
  ['one invalid entry', JSON.stringify({ version: 1, followedTopics: [topicA, { title: 'invalid' }], recentParticipated: [] })],
])('remote %s is preserved verbatim and blocks destructive writes', async (_name, content) => {
  seed()
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = content
  await expect(updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicB))).rejects.toBeInstanceOf(ForumPersonalStateCorruptionError)
  expect(remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content).toBe(content)
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('fallback queue preserves two simultaneous updates within one repository instance', async () => {
  seed()
  await Promise.all([
    updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicA)),
    updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicB)),
  ])
  expect(savedState().followedTopics.map(topic => topic.topicId).sort()).toEqual(['IA', 'IB'])
})

test('retrying a follow intent is idempotent instead of cancelling the follow', async () => {
  seed()
  const follow = () => updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))
  await follow()
  await follow()
  expect(savedState().followedTopics).toEqual([topicA])
})

test('a queued mutation from an expired context never sends HTTP', async () => {
  seed()
  let valid = true
  const context = { assertCurrent: () => {
    if (!valid)
      throw new Error('Session changed')
  } }
  const first = updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))
  const second = updateForumPersonalState('alice', state => setFollowedTopic(state, topicB, true), context)
  valid = false
  await first
  await expect(second).rejects.toThrow('Session changed')
  expect(savedState().followedTopics).toEqual([topicA])
  expect(calls.filter(call => call.method === 'PATCH')).toHaveLength(1)
})

// Confirmed defects: remove .fails one at a time during the planned fixes.
test('local cache read failure must not block remote discovery', async () => {
  seed({ ...emptyForumPersonalState(), followedTopics: [topicA] })
  storage.getItem = () => {
    throw new DOMException('Storage blocked', 'SecurityError')
  }
  expect((await loadForumPersonalState('alice')).followedTopics).toEqual([topicA])
})

test('local cache write failure must not turn a successful discovery into a read failure', async () => {
  seed({ ...emptyForumPersonalState(), followedTopics: [topicA] })
  values.clear()
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  expect((await loadForumPersonalState('alice')).followedTopics).toEqual([topicA])
})

test('local cache failure after remote commit must not report that commit as failed', async () => {
  seed()
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  const outcome = await updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicA)).then(
    state => ({ ok: true, state }),
    () => ({ ok: false }),
  )
  expect(savedState().followedTopics).toEqual([topicA])
  expect(outcome.ok).toBe(true)
})

test('a committed follow remains readable when the local cache cannot be persisted', async () => {
  seed()
  storage.setItem = () => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  }
  await expect(updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicA))).resolves.toMatchObject({ followedTopics: [topicA] })
  expect(savedState().followedTopics).toEqual([topicA])
  expect((await loadForumPersonalState('alice')).followedTopics).toEqual([topicA])
})

test('failed cache eviction still permits rediscovery of a deleted cached gist', async () => {
  seed({ ...emptyForumPersonalState(), followedTopics: [topicA] })
  values.set(aliceKey, 'deleted')
  storage.removeItem = () => {
    throw new DOMException('Storage blocked', 'SecurityError')
  }
  expect((await loadForumPersonalState('alice')).followedTopics).toEqual([topicA])
})

test('a gist beyond page one must be discovered rather than duplicated', async () => {
  for (let index = 0; index < 100; index++)
    remote.set(`other-${index}`, { ...stateGist(`other-${index}`), description: 'Unrelated gist' })
  remote.set('existing', stateGist('existing', { ...emptyForumPersonalState(), followedTopics: [topicA] }))
  const next = await updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicB))
  expect(next.followedTopics.map(topic => topic.topicId).sort()).toEqual(['IA', 'IB'])
  expect(remote.size).toBe(101)
  expect(calls.some(call => call.endpoint === 'gists' && call.page === 2)).toBe(true)
})

test('a full first page followed by a failed second page must not cause creation', async () => {
  for (let index = 0; index < 100; index++)
    remote.set(`other-${index}`, { ...stateGist(`other-${index}`), description: 'Unrelated gist' })
  listFailurePage = 2
  await expect(updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))).rejects.toMatchObject({ state: 403 })
  expect(remote.size).toBe(100)
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('duplicate candidates block updates while preserving both source gists', async () => {
  remote.set('first', stateGist('first', { ...emptyForumPersonalState(), followedTopics: [topicA] }))
  remote.set('second', stateGist('second', { ...emptyForumPersonalState(), followedTopics: [topicB] }))
  const original = structuredClone([...remote.values()])
  await expect(updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))).rejects.toBeInstanceOf(ForumPersonalStateConflictError)
  expect([...remote.values()]).toEqual(original)
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('a cached gist is read directly without traversing the account list', async () => {
  seed()
  await loadForumPersonalState('alice')
  expect(calls).toEqual([{ method: 'GET', endpoint: 'gists/existing', page: 1 }])
})

test('a missing state file is preserved instead of silently creating a replacement gist', async () => {
  seed()
  remote.get('existing')!.files = {}
  await expect(updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))).rejects.toBeInstanceOf(ForumPersonalStateCorruptionError)
  expect(remote.size).toBe(1)
  expect(remote.get('existing')!.files).toEqual({})
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('a truncated response cannot authorize destructive writes', async () => {
  seed()
  remote.get('existing')!.truncated = true
  await expect(updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))).rejects.toThrow('incomplete')
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('an invalid list response cannot be treated as an absent personal state', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify([{ id: 'bad', description: 'Kongying Forum State', public: false }]), { headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', fetch)
  await expect(updateForumPersonalState('alice', state => setFollowedTopic(state, topicA, true))).rejects.toThrow('Invalid Gitee response')
  expect(fetch).toHaveBeenCalledOnce()
})

test.each(['repair', 'reset'] as const)('explicit %s saves a private verbatim backup before replacing corrupted state', async (mode) => {
  seed()
  const raw = JSON.stringify({ version: 1, followedTopics: [topicA, { invalid: true }], recentParticipated: [] })
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = raw
  const result = await recoverForumPersonalState('alice', { gistId: 'existing', raw, mode })
  const backup = remote.get(result.backupGistId)!
  expect(backup.description).toBe(FORUM_STATE_BACKUP_DESCRIPTION)
  expect(backup.public).toBe(false)
  expect(JSON.parse(backup.files[FORUM_STATE_BACKUP_FILE].content!)).toMatchObject({ version: 1, sourceGistId: 'existing', files: { [FORUM_STATE_GIST_FILE]: { content: raw } } })
  expect(savedState().followedTopics).toEqual(mode === 'repair' ? [topicA] : [])
  expect(calls.filter(call => call.method !== 'GET').map(call => call.method)).toEqual(['POST', 'PATCH'])
})

test('failed backup prevents any replacement of corrupted data', async () => {
  seed()
  const raw = '{'
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = raw
  backupFailure = true
  await expect(recoverForumPersonalState('alice', { gistId: 'existing', raw, mode: 'reset' })).rejects.toMatchObject({ state: 403 })
  expect(remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content).toBe(raw)
  expect(remote.size).toBe(1)
  expect(calls.some(call => call.method === 'PATCH')).toBe(false)
})

test.each(['changed', 'session'] as const)('a %s change during backup prevents recovery and retains the backup', async (change) => {
  seed()
  const raw = '{'
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = raw
  let current = true
  afterBackup = () => {
    if (change === 'changed')
      remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = 'changed'
    else
      current = false
  }
  await expect(recoverForumPersonalState('alice', { gistId: 'existing', raw, mode: 'reset' }, { assertCurrent: () => {
    if (!current)
      throw new Error('Session changed')
  } })).rejects.toThrow()
  expect(calls.some(call => call.method === 'PATCH')).toBe(false)
  expect(remote.size).toBe(2)
})

test('a failed replacement retains both the original and the completed backup', async () => {
  seed()
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = '{'
  patchFailure = true
  await expect(recoverForumPersonalState('alice', { gistId: 'existing', raw: '{', mode: 'reset' })).rejects.toMatchObject({ state: 403 })
  expect(remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content).toBe('{')
  expect([...remote.values()].filter(gist => gist.description === FORUM_STATE_BACKUP_DESCRIPTION)).toHaveLength(1)
})

test.each([
  ['future version', JSON.stringify({ version: 2 }), false],
  ['valid state', JSON.stringify(emptyForumPersonalState()), false],
  ['truncated state', '{', true],
])('%s cannot be reset through corruption recovery', async (_name, raw, truncated) => {
  seed()
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = raw
  remote.get('existing')!.truncated = truncated
  await expect(recoverForumPersonalState('alice', { gistId: 'existing', raw, mode: 'reset' })).rejects.toThrow()
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('empty salvage requires an explicit reset instead of calling it a repair', async () => {
  seed()
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = '{'
  await expect(recoverForumPersonalState('alice', { gistId: 'existing', raw: '{', mode: 'repair' })).rejects.toThrow('explicit reset')
  expect(calls.every(call => call.method === 'GET')).toBe(true)
})

test('raw personal data is available for recovery but absent from serialized errors', async () => {
  seed()
  remote.get('existing')!.files[FORUM_STATE_GIST_FILE].content = '{private'
  const error = await loadForumPersonalState('alice').catch(error => error)
  expect(error.raw).toBe('{private')
  expect(JSON.stringify(error)).not.toContain('private')
})

test.fails('two independent clients must not silently lose one of their committed updates', { timeout: 3000 }, async () => {
  seed()
  // Separate module instances model independent browser queues sharing one server.
  vi.resetModules()
  const otherClient = await import('../../src/forum/services/forumPersonalStateRepository')
  afterRead = twoReaders()
  const outcomes = await Promise.allSettled([
    updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicA)),
    otherClient.updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicB)),
  ])
  expect(outcomes.every(outcome => outcome.status === 'fulfilled')).toBe(true)
  expect(savedState().followedTopics.map(topic => topic.topicId).sort()).toEqual(['IA', 'IB'])
})

test('two first-time clients currently create two independent state gists', { timeout: 3000 }, async () => {
  vi.resetModules()
  const otherClient = await import('../../src/forum/services/forumPersonalStateRepository')
  afterList = twoReaders()
  await Promise.all([
    updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicA)),
    otherClient.updateForumPersonalState('alice', state => toggleFollowedTopic(state, topicB)),
  ])
  expect(remote.size).toBe(2)
  expect([...remote.values()].map(gist => JSON.parse(gist.files[FORUM_STATE_GIST_FILE].content!).followedTopics[0].topicId).sort()).toEqual(['IA', 'IB'])
})
