import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { test } from 'vitest'
import * as Vue from 'vue'

test('queue initialization and transaction rejection both release the submission lock', async () => {
  let failRestore = true
  let failTransaction = true
  let transactionCalls = 0
  const dependencies: Record<string, unknown> = {
    'vue': { ...Vue, onBeforeUnmount() {} },
    '~/apis/interknot.site/upload': { uploadImg() {} },
    '~/forum/composables/data/useSubmitTopic': { useSubmitTopic: () => ({ submitData() {} }) },
    '~/forum/composables/view/calculateThumbHashForFile': { calculateThumbHashForFile() {} },
    '~/forum/composables/view/useImageAttachmentQueue': {
      useImageAttachmentQueue: () => ({
        restore() {
          if (failRestore)
            throw new Error('Draft storage unavailable')
        },
      }),
    },
    '~/forum/services/form/topicDraft': { readTopicDraft: () => ({ attachments: [] }) },
    '~/forum/services/form/topicFormTransaction': {
      submitTopicFormTransaction: async () => {
        transactionCalls++
        if (failTransaction)
          throw new Error('Upload interrupted')
        return { ok: true, topic: { id: 'I123' } }
      },
    },
  }
  const source = readFileSync(new URL('../../src/forum/components/form/composables/useFormSubmit.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} as typeof import('../../src/forum/components/form/composables/useFormSubmit') }
  runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected submission dependency: ${name}`)
      return dependencies[name]
    },
  })
  const submit = module.exports.useFormSubmit(Vue.computed(() => 'BUG'))
  const draft = { type: 'BUG' as const, title: '', text: 'Working draft', tags: ['PLATFORM_PC'] }
  await assert.rejects(submit.handleSubmit(draft, false), /Draft storage unavailable/)
  assert.equal(submit.submitLoading.value, false)
  assert.equal(transactionCalls, 0)
  failRestore = false
  await assert.rejects(submit.handleSubmit(draft, false), /Upload interrupted/)
  assert.equal(submit.submitLoading.value, false)
  failTransaction = false
  const first = submit.handleSubmit(draft, false)
  const joined = submit.handleSubmit(draft, false)
  const [result, shared] = await Promise.all([first, joined])
  assert.equal(result.ok, true)
  assert.equal(shared, result)
  assert.equal(transactionCalls, 2)
  assert.equal(submit.submitLoading.value, false)
})
