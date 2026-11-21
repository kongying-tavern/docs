import type ForumAPI from '@/src/forum/api/types.d.ts'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { effectScope } from 'vue'
import { useCommentComposer } from '@/src/forum/components/comment/composables/useCommentComposer.ts'

type UploadImpl = (file: File, options?: { signal?: AbortSignal }) => Promise<ForumAPI.Image>

const mocks = vi.hoisted(() => ({
  upload: (async () => {
    throw new Error('upload not configured')
  }) as UploadImpl,
  revoked: [] as string[],
}))

vi.mock('@vueuse/core', async importOriginal => ({
  ...await importOriginal<typeof import('@vueuse/core')>(),
  useEventListener() {},
}))
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  const { loadTestMessages } = await import('../../shared/support/i18n.ts')
  const i18n = actual.createI18n({ legacy: false, locale: 'zh', messages: { zh: loadTestMessages('zh') } })
  return { ...actual, useI18n: () => i18n.global }
})
vi.mock('@/src/forum/composables/data/useForumMutations.ts', async () => {
  const { ref } = await import('vue')
  return { useForumCommentMutations: () => ({ creatingComment: ref(false) }) }
})
vi.mock('@/src/forum/composables/data/useForumPersonalState.ts', () => ({ useForumPersonalState: () => ({}) }))
vi.mock('@/src/forum/hooks/useLogin.ts', () => ({ default: () => ({ logout() {}, redirectAuth() {} }) }))
vi.mock('@/src/forum/stores/auth/useUserAuth.ts', () => ({ useUserAuthStore: () => ({}) }))
vi.mock('@/src/forum/stores/auth/useUserInfo.ts', () => ({ useUserInfoStore: () => ({}) }))
// The real toast module renders a Vue component, which this Node-only suite cannot load.
vi.mock('@/src/services/telemetry/toast.ts', () => ({ toast: { warning() {}, error() {}, success() {}, loading() {}, dismiss() {} } }))
vi.mock('@/src/forum/composables/view/useImageAttachmentQueue.ts', async (importOriginal) => {
  const { useImageAttachmentQueue } = await importOriginal<typeof import('@/src/forum/composables/view/useImageAttachmentQueue.ts')>()
  return {
    useImageAttachmentQueue: () => useImageAttachmentQueue({
      upload: (file, uploadOptions) => mocks.upload(file, uploadOptions),
      optimize: async file => file,
      createPreviewUrl: () => 'blob:comment-image',
      revokePreviewUrl: url => mocks.revoked.push(url),
    }),
  }
})

test('disposing the comment composer cancels its upload and releases local image previews', async () => {
  let signal: AbortSignal | undefined
  let resolve!: (image: ForumAPI.Image) => void
  const pending = new Promise<ForumAPI.Image>((done) => {
    resolve = done
  })
  mocks.revoked.length = 0
  mocks.upload = async (_file, options) => {
    signal = options?.signal
    return pending
  }

  const scope = effectScope()
  const composer = scope.run(() => useCommentComposer({ repo: 'Feedback', topicId: '123' }, () => {}))!
  await composer.addFiles([new File(['image'], 'comment.png', { type: 'image/png' })])
  await Promise.resolve()
  assert.equal(signal?.aborted, false)
  assert.equal(composer.queue.attachments.value.length, 1)
  scope.stop()
  assert.equal(signal?.aborted, true)
  assert.deepEqual(mocks.revoked, ['blob:comment-image'])
  assert.deepEqual(composer.queue.attachments.value, [])
  resolve({ state: true, message: '', data: { id: 'late', link: 'https://assets.example/late', fileSize: 1, originName: 'late' } })
  await composer.queue.settleUploads()
  assert.deepEqual(composer.queue.serializedAttachments.value, [])
})
