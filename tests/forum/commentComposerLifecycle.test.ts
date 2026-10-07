import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { test } from 'vitest'
import * as Vue from 'vue'
import { useImageAttachmentQueue } from '../../src/forum/composables/view/useImageAttachmentQueue'

test('disposing the comment composer cancels its upload and releases local image previews', async () => {
  let signal: AbortSignal | undefined
  let resolve!: (image: ForumAPI.Image) => void
  const pending = new Promise<ForumAPI.Image>((done) => {
    resolve = done
  })
  const revoked: string[] = []
  const dependencies: Record<string, unknown> = {
    'vue': Vue,
    '@vueuse/core': { useEventListener() {} },
    '@/hooks/useLocalized': { useLocalized: () => ({ message: Vue.ref({}) }) },
    '~/apis/interknot.site/upload': { uploadImg() {} },
    '~/forum/api/gitee': {},
    '~/forum/composables/data/useForumMutations': { useForumCommentMutations: () => ({ creatingComment: Vue.ref(false) }) },
    '~/forum/composables/data/useForumPersonalState': { useForumPersonalState: () => ({}) },
    '~/forum/composables/view/calculateThumbHashForFile': {},
    '~/forum/composables/view/useImageAttachmentQueue': {
      useImageAttachmentQueue: () => useImageAttachmentQueue({
        upload: async (_file, options) => {
          signal = options?.signal
          return pending
        },
        optimize: async file => file,
        createPreviewUrl: () => 'blob:comment-image',
        revokePreviewUrl: url => revoked.push(url),
      }),
    },
    '~/forum/hooks/useLogin': { default: () => ({}) },
    '~/forum/services/commentTransaction': {},
    '~/forum/services/form/validation': {},
    '~/forum/services/forumConfig': { VALIDATION_LIMITS: { CONTENT: { MAX_LENGTH: 2000 } } },
    '~/forum/stores/auth/useUserAuth': { useUserAuthStore: () => ({}) },
    '~/forum/stores/auth/useUserInfo': { useUserInfoStore: () => ({}) },
    '~/services/telemetry': {},
    '~/services/telemetry/pageAlert': {},
    '~/services/telemetry/toast': {},
    '~/utils/formatMessage': {},
    '../../utils/submitFormUi': {},
  }
  const source = readFileSync(new URL('../../src/forum/components/comment/composables/useCommentComposer.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} as typeof import('../../src/forum/components/comment/composables/useCommentComposer') }
  runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected composer dependency: ${name}`)
      return dependencies[name]
    },
  })
  const scope = Vue.effectScope()
  const composer = scope.run(() => module.exports.useCommentComposer({ repo: 'Feedback', topicId: '123' }, () => {}))!
  await composer.addFiles([new File(['image'], 'comment.png', { type: 'image/png' })])
  await Promise.resolve()
  assert.equal(signal?.aborted, false)
  assert.equal(composer.queue.attachments.value.length, 1)
  scope.stop()
  assert.equal(signal?.aborted, true)
  assert.deepEqual(revoked, ['blob:comment-image'])
  assert.deepEqual(composer.queue.attachments.value, [])
  resolve({ state: true, message: '', data: { id: 'late', link: 'https://assets.example/late', fileSize: 1, originName: 'late' } })
  await composer.queue.settleUploads()
  assert.deepEqual(composer.queue.serializedAttachments.value, [])
})
