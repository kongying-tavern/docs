import type { TopicFormData } from '../../src/forum/services/form/validation'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { useForm } from 'vee-validate'
import * as Vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import * as draftStorage from '../../src/forum/services/form/topicDraft'

async function setup(draftsEnabled = true) {
  const storage = new Map<string, string>()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } })
  draftStorage.writeTopicDraft('BUG', { type: 'BUG', title: '', text: 'stored compact draft', tags: [] })
  let form!: ReturnType<typeof useForm<TopicFormData>>
  let resets = 0
  let storageFails = false
  const dependencies: Record<string, unknown> = {
    'vue': Vue,
    'vee-validate': { useForm: (options: Parameters<typeof useForm<TopicFormData>>[0]) => {
      form = useForm<TopicFormData>(options)
      const reset = form.resetForm
      return { ...form, resetForm: (...args: Parameters<typeof reset>) => {
        resets++
        reset(...args)
      } }
    } },
    '@/hooks/useLocalized': { useLocalized: () => ({ message: Vue.ref({}) }) },
    '~/forum/composables/auth/useRuleChecks': { useRuleChecks: () => ({ hasAnyPermissions: () => Vue.ref(false) }) },
    '~/forum/services/form/topicDraft': { ...draftStorage, writeTopicDraft: (...args: Parameters<typeof draftStorage.writeTopicDraft>) => {
      if (storageFails)
        throw new Error('Storage full')
      draftStorage.writeTopicDraft(...args)
    } },
    '~/forum/services/form/validation': { createTopicFormSchema: () => undefined, getAllowedTopicTypes: () => ['BUG', 'FEAT'] },
    '../publish-topic-form/config': { getFormTabsConfig: () => [] },
  }
  const source = readFileSync(new URL('../../src/forum/components/form/composables/useFormState.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} as typeof import('../../src/forum/components/form/composables/useFormState') }
  runInNewContext(code, { module, exports: module.exports, require: (name: string) => dependencies[name] })
  let state!: ReturnType<typeof module.exports.useFormState>
  const app = Vue.createSSRApp({ setup() {
    state = module.exports.useFormState(() => draftsEnabled)
    return () => null
  } })
  await renderToString(app)
  return {
    state,
    form,
    resets: () => resets,
    failStorage: () => storageFails = true,
    dispose: () => {
      if (previous)
        Object.defineProperty(globalThis, 'localStorage', previous)
      else
        Reflect.deleteProperty(globalThis, 'localStorage')
    },
  }
}

test('saving updates the complete baseline without resetting the active editor during autosave', async () => {
  const fixture = await setup()
  try {
    fixture.form.setFieldValue('text', 'latest edit')
    const before = fixture.resets()
    fixture.state.saveDraft([{ src: 'https://example.com/bug.png' }], 'BUG', false)
    assert.equal(fixture.resets(), before)
    assert.equal(fixture.state.isDirty.value, false)
    assert.deepEqual(fixture.state.savedAttachments.value, [{ src: 'https://example.com/bug.png' }])
    fixture.state.setFormType('FEAT')
    fixture.form.setFieldValue('text', 'feature edit')
    fixture.state.saveDraft([{ src: 'https://example.com/feature.png' }], 'FEAT', false)
    fixture.state.setFormType('BUG', false)
    assert.equal(fixture.state.formData.value.text, 'latest edit')
    assert.deepEqual(fixture.state.savedAttachments.value, [{ src: 'https://example.com/bug.png' }])
    fixture.state.initFormData('FEAT')
    assert.deepEqual(fixture.state.savedAttachments.value, [{ src: 'https://example.com/bug.png' }])
    fixture.state.deleteDraft()
    assert.equal(fixture.state.savedAttachments.value.length, 0)
  }
  finally { fixture.dispose() }
})

test('storage failure leaves the saved text and attachment baseline unchanged', async () => {
  const fixture = await setup()
  try {
    fixture.state.saveDraft([{ src: 'https://example.com/saved.png' }], 'BUG', false)
    fixture.form.setFieldValue('text', 'unsaved edit')
    fixture.failStorage()
    assert.throws(() => fixture.state.saveDraft([{ src: 'https://example.com/new.png' }], 'BUG', false))
    assert.equal(fixture.state.isDirty.value, true)
    assert.equal(fixture.state.formData.value.text, 'unsaved edit')
    assert.deepEqual(fixture.state.savedAttachments.value, [{ src: 'https://example.com/saved.png' }])
    assert.throws(() => fixture.state.initFormData('BUG'))
    assert.equal(fixture.state.formData.value.text, 'unsaved edit')
    assert.deepEqual(fixture.state.savedAttachments.value, [{ src: 'https://example.com/saved.png' }])
  }
  finally { fixture.dispose() }
})

test('legacy form neither restores nor overwrites compact drafts', async () => {
  const fixture = await setup(false)
  try {
    assert.equal(fixture.state.formData.value.text, '')
    fixture.form.setFieldValue('text', 'legacy edit')
    fixture.state.saveDraft()
    fixture.state.initFormData()
    assert.equal(draftStorage.readTopicDraft('BUG').text, 'stored compact draft')
    fixture.state.deleteDraft()
    assert.equal(draftStorage.readTopicDraft('BUG').text, 'stored compact draft')
  }
  finally { fixture.dispose() }
})

test('privacy changes are dirty, survive saves and tab switching, and reset after success', async () => {
  const fixture = await setup()
  try {
    assert.equal(fixture.state.isDirty.value, false)
    fixture.state.setPrivate(true)
    assert.equal(fixture.state.isDirty.value, true)
    fixture.state.saveDraft([], 'BUG', false)
    assert.equal(fixture.state.isDirty.value, false)
    assert.equal(draftStorage.readTopicDraft('BUG').isPrivate, true)
    fixture.state.setFormType('FEAT', false)
    assert.equal(fixture.state.formData.value.isPrivate, undefined)
    fixture.state.setFormType('BUG', false)
    assert.equal(fixture.state.formData.value.isPrivate, true)
    fixture.state.setPrivate(false)
    assert.equal(fixture.state.isDirty.value, true)
    fixture.state.discardDraft()
    assert.equal(fixture.state.formData.value.isPrivate, true)
    fixture.state.initFormData()
    assert.equal(fixture.state.formData.value.isPrivate, undefined)
  }
  finally { fixture.dispose() }
})
