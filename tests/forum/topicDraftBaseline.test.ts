import type { TopicFormData } from '~/forum/services/form/validation'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useFormState } from '~/forum/components/form/composables/useFormState'
import * as draftStorage from '~/forum/services/form/topicDraft'

const mocks = vi.hoisted(() => ({
  resets: 0,
  form: undefined as undefined | ReturnType<typeof import('vee-validate').useForm<TopicFormData>>,
}))

vi.mock('vee-validate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vee-validate')>()
  return {
    ...actual,
    useForm: (options: Parameters<typeof actual.useForm<TopicFormData>>[0]) => {
      const form = actual.useForm<TopicFormData>(options)
      mocks.form = form
      const reset = form.resetForm
      return {
        ...form,
        resetForm: (...args: Parameters<typeof reset>) => {
          mocks.resets++
          reset(...args)
        },
      }
    },
  }
})
vi.mock('@/hooks/useLocalized', async () => {
  const { ref } = await import('vue')
  return { useLocalized: () => ({ message: ref({}) }) }
})
vi.mock('~/forum/composables/auth/useRuleChecks', async () => {
  const { ref } = await import('vue')
  return { useRuleChecks: () => ({ hasAnyPermissions: () => ref(false) }) }
})
vi.mock('~/forum/services/form/validation', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/services/form/validation')>(),
  createTopicFormSchema: () => undefined,
  getAllowedTopicTypes: () => ['BUG', 'FEAT'],
}))
vi.mock('~/forum/components/form/publish-topic-form/form-config', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/components/form/publish-topic-form/form-config')>(),
  getFormTabsConfig: () => [],
}))

async function setup(draftsEnabled = true) {
  const storage = new Map<string, string>()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  let storageFails = false
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (storageFails)
        throw new Error('Storage full')
      storage.set(key, value)
    },
    removeItem: (key: string) => storage.delete(key),
  } })
  mocks.resets = 0
  mocks.form = undefined
  draftStorage.writeTopicDraft('BUG', { type: 'BUG', title: '', text: 'stored compact draft', tags: [] })

  let state!: ReturnType<typeof useFormState>
  const app = createSSRApp({ setup() {
    state = useFormState(() => draftsEnabled)
    return () => null
  } })
  await renderToString(app)
  return {
    state,
    form: mocks.form!,
    resets: () => mocks.resets,
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
