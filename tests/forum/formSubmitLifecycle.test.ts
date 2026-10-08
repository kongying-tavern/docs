import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { computed } from 'vue'
import { useFormSubmit } from '~/forum/components/form/composables/useFormSubmit'

const mocks = vi.hoisted(() => ({
  failRestore: true,
  failTransaction: true,
  transactionCalls: 0,
}))

// The composable runs outside a component instance, where the real hook only warns.
vi.mock('vue', async importOriginal => ({
  ...await importOriginal<typeof import('vue')>(),
  onBeforeUnmount() {},
}))
vi.mock('~/apis/interknot.site/upload', () => ({ uploadImg() {} }))
vi.mock('~/forum/composables/data/useSubmitTopic', () => ({ useSubmitTopic: () => ({ submitData() {} }) }))
vi.mock('~/forum/composables/view/calculateThumbHashForFile', () => ({ calculateThumbHashForFile() {} }))
vi.mock('~/forum/composables/view/useImageAttachmentQueue', () => ({
  useImageAttachmentQueue: () => ({
    restore() {
      if (mocks.failRestore)
        throw new Error('Draft storage unavailable')
    },
  }),
}))
vi.mock('~/forum/services/form/topicDraft', () => ({ readTopicDraft: () => ({ attachments: [] }) }))
vi.mock('~/forum/services/form/topicFormTransaction', () => ({
  submitTopicFormTransaction: async () => {
    mocks.transactionCalls++
    if (mocks.failTransaction)
      throw new Error('Upload interrupted')
    return { ok: true, topic: { id: 'I123' } }
  },
}))

test('queue initialization and transaction rejection both release the submission lock', async () => {
  const submit = useFormSubmit(computed(() => 'BUG'))
  const draft = { type: 'BUG' as const, title: '', text: 'Working draft', tags: ['PLATFORM_PC'] }
  await assert.rejects(submit.handleSubmit(draft, false), /Draft storage unavailable/)
  assert.equal(submit.submitLoading.value, false)
  assert.equal(mocks.transactionCalls, 0)
  mocks.failRestore = false
  await assert.rejects(submit.handleSubmit(draft, false), /Upload interrupted/)
  assert.equal(submit.submitLoading.value, false)
  mocks.failTransaction = false
  const first = submit.handleSubmit(draft, false)
  const joined = submit.handleSubmit(draft, false)
  const [result, shared] = await Promise.all([first, joined])
  assert.equal(result.ok, true)
  assert.equal(shared, result)
  assert.equal(mocks.transactionCalls, 2)
  assert.equal(submit.submitLoading.value, false)
})
