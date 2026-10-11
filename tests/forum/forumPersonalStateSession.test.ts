import type { ForumPersonalState } from '../../src/forum/services/forumPersonalState'
import { PiniaColada, useQueryCache } from '@pinia/colada'
import { createPinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'
import { createSSRApp, effectScope, shallowReactive } from 'vue'
import { emptyForumPersonalState } from '../../src/forum/services/forumPersonalState'
import { forumKeys } from '../../src/forum/services/forumQueryContracts'

const mocks = vi.hoisted(() => ({
  generation: 0,
  auth: { isTokenValid: true, getSessionGeneration: (): number => 0 },
  userInfo: { info: { id: 'alice' } as { id: string } | undefined },
  load: vi.fn(),
  update: vi.fn(),
  recover: vi.fn(),
}))
vi.mock('../../src/forum/stores/auth/useUserAuth', () => ({ useUserAuthStore: () => mocks.auth }))
vi.mock('../../src/forum/stores/auth/useUserInfo', () => ({ useUserInfoStore: () => mocks.userInfo }))
vi.mock('../../src/forum/services/forumPersonalStateRepository', () => ({
  loadForumPersonalState: mocks.load,
  updateForumPersonalState: mocks.update,
  recoverForumPersonalState: mocks.recover,
}))

beforeEach(() => {
  vi.resetModules()
  mocks.generation = 0
  mocks.auth = shallowReactive({ isTokenValid: true, getSessionGeneration: () => mocks.generation })
  mocks.userInfo = shallowReactive({ info: { id: 'alice' } })
  mocks.load.mockReset().mockResolvedValue(emptyForumPersonalState())
  mocks.update.mockReset()
  mocks.recover.mockReset()
})

async function setup() {
  const { useForumPersonalState } = await import('../../src/forum/composables/data/useForumPersonalState')
  const scope = effectScope()
  const app = createSSRApp({ render: () => null })
    .use(createPinia())
    .use(PiniaColada, { queryOptions: { gcTime: 0 } })
  const personal = app.runWithContext(() => scope.run(() => useForumPersonalState())!)
  const cache = app.runWithContext(() => useQueryCache())
  return { personal, cache, dispose: () => scope.stop() }
}

test.each(['different account', 'same account with a replacement session'])('late account-A mutation is rejected after %s', async (change) => {
  let finish!: (state: ForumPersonalState) => void
  let started!: () => void
  const pending = new Promise<ForumPersonalState>(resolve => finish = resolve)
  const begun = new Promise<void>(resolve => started = resolve)
  mocks.update.mockImplementation(() => {
    started()
    return pending
  })
  const fixture = await setup()
  const savedA: ForumPersonalState = { ...emptyForumPersonalState(), followedTopics: [{
    topicId: 'IA',
    title: 'Account A topic',
    type: 'BUG',
    authorLogin: 'alice',
    recordedAt: '2026-10-12T00:00:00.000Z',
  }] }
  let operation: Promise<void> | undefined
  try {
    operation = fixture.personal.unfollow('IB')
    await begun
    expect(mocks.update.mock.calls[0][0]).toBe('alice')
    mocks.userInfo.info = { id: change === 'different account' ? 'bob' : 'alice' }
    mocks.generation++
    finish(savedA)
    await expect(operation).rejects.toThrow('session changed')
    expect(fixture.cache.getQueryData(forumKeys.personalState('bob'))).not.toEqual(savedA)
  }
  finally {
    finish(savedA)
    await operation?.catch(() => {})
    fixture.dispose()
  }
})

test('failed remote reads expose an error while the public state currently looks empty', async () => {
  // Characterization: UI must consume error instead of treating this as no records.
  const error = new Error('Corrupt remote state')
  mocks.load.mockRejectedValue(error)
  const fixture = await setup()
  try {
    await fixture.personal.refetch().catch(() => {})
    expect(fixture.personal.error.value).toBe(error)
    expect(fixture.personal.state.value).toEqual(emptyForumPersonalState())
  }
  finally {
    fixture.dispose()
  }
})

test('successful recovery updates the query and clears the previous read error', async () => {
  mocks.load.mockRejectedValue(new Error('Corrupt'))
  mocks.recover.mockResolvedValue({ state: emptyForumPersonalState(), backupGistId: 'backup' })
  const fixture = await setup()
  try {
    await fixture.personal.refetch().catch(() => {})
    expect(fixture.personal.error.value).toBeInstanceOf(Error)
    expect(await fixture.personal.recover({ gistId: 'source', raw: '{', mode: 'reset' })).toBe('backup')
    expect(fixture.personal.error.value).toBeNull()
    expect(fixture.personal.state.value).toEqual(emptyForumPersonalState())
  }
  finally {
    fixture.dispose()
  }
})

test('late recovery cannot update a replacement account session', async () => {
  let finish!: (result: { state: ForumPersonalState, backupGistId: string }) => void
  mocks.recover.mockImplementation(() => new Promise(resolve => finish = resolve))
  const fixture = await setup()
  try {
    const pending = fixture.personal.recover({ gistId: 'source', raw: '{', mode: 'reset' })
    await vi.waitFor(() => expect(mocks.recover).toHaveBeenCalledOnce())
    mocks.userInfo.info = { id: 'bob' }
    mocks.generation++
    const recovered: ForumPersonalState = { ...emptyForumPersonalState(), followedTopics: [{ topicId: 'IA', title: 'Alice recovery', type: 'BUG', authorLogin: 'alice', recordedAt: '2026-10-12T00:00:00.000Z' }] }
    finish({ state: recovered, backupGistId: 'backup' })
    await expect(pending).rejects.toThrow('session changed')
    expect(fixture.cache.getQueryData(forumKeys.personalState('bob'))).not.toEqual(recovered)
  }
  finally {
    fixture.dispose()
  }
})
