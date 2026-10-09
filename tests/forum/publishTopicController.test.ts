import type { PublishTopicPresentation } from '~/forum/components/form/composables/usePublishTopicController'
import type { FeedbackFormVariant } from '~/forum/services/form/feedbackFormExperiment'
import type { UploadImageAttachmentsResult } from '~/forum/services/form/imageAttachment'
import type { TopicFormData } from '~/forum/services/form/validation'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { effectScope, reactive, ref, shallowRef } from 'vue'
import { usePublishTopicController } from '~/forum/components/form/composables/usePublishTopicController'

const mocks = vi.hoisted(() => ({
  drafts: new Map<string, unknown>(),
  exitHandlers: new Map<string, (event: BeforeUnloadEvent) => void>(),
  hashHandler: undefined as undefined | ((hash: string) => unknown),
  state: undefined as unknown,
  formSubmit: undefined as unknown,
  userInfo: undefined as unknown as { info?: { login: string }, refreshUserInfo: () => Promise<void> },
}))

// The composable runs outside a component instance, where the real hook only warns.
vi.mock('vue', async importOriginal => ({
  ...await importOriginal<typeof import('vue')>(),
  onBeforeUnmount() {},
}))
vi.mock('@vueuse/core', async importOriginal => ({
  ...await importOriginal<typeof import('@vueuse/core')>(),
  useEventListener: (event: string, handler: (event: BeforeUnloadEvent) => void) => mocks.exitHandlers.set(event, handler),
}))
vi.mock('@/hooks/useLocalized', async () => {
  const { ref } = await import('vue')
  return { useLocalized: () => ({ message: ref({ forum: { publish: { feedbackForm: {} } } }) }) }
})
vi.mock('~/forum/api/gitee', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/api/gitee')>(),
  isPhoneBindingRequiredError: () => false,
}))
vi.mock('~/forum/components/utils/submitFormUi', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/components/utils/submitFormUi')>(),
  formatImageAttachmentError: () => '',
}))
vi.mock('~/forum/composables/data/useForumQueries', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/composables/data/useForumQueries')>(),
  useForumTopicQuery: () => ({ data: ref(undefined), error: ref(null), isLoading: ref(false) }),
}))
vi.mock('~/forum/hooks/useHashChecker', () => ({ useHashChecker: (_hash: unknown, handler: (hash: string) => unknown) => mocks.hashHandler = handler }))
vi.mock('~/forum/services/form/topicDraft', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/services/form/topicDraft')>(),
  readTopicDraft: (type: TopicFormData['type']) => mocks.drafts.get(type),
  readSavedTopicDrafts: () => [...mocks.drafts.values()],
}))
vi.mock('~/forum/services/forumTopicQuote', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/services/forumTopicQuote')>(),
  isQuotableTopicType: () => true,
  readQuotedTopicRequest: () => undefined,
  clearQuotedTopicRequest: () => {},
}))
vi.mock('~/forum/services/loginIntent', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/services/loginIntent')>(),
  rememberLoginIntent: () => {},
}))
vi.mock('~/forum/stores/auth/useUserAuth', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/stores/auth/useUserAuth')>(),
  useUserAuthStore: () => ({ isTokenValid: true }),
}))
vi.mock('~/forum/stores/auth/useUserInfo', async importOriginal => ({
  ...await importOriginal<typeof import('~/forum/stores/auth/useUserInfo')>(),
  useUserInfoStore: () => mocks.userInfo,
}))
// The real telemetry tree imports Vue components, which this Node-only suite cannot load.
vi.mock('~/services/telemetry', () => ({ OpsEvents: {}, reportError() {}, trackOp() {} }))
vi.mock('~/services/telemetry/toast', () => ({ toast: { loading() {}, success() {}, error() {}, dismiss() {} } }))
vi.mock('~/forum/components/form/composables/useFormState', () => ({ useFormState: () => mocks.state }))
vi.mock('~/forum/components/form/composables/useFormSubmit', () => ({ useFormSubmit: () => mocks.formSubmit }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

function runtime(options: { settleUploads?: () => Promise<UploadImageAttachmentsResult>, presentation?: PublishTopicPresentation, cleanupError?: Error, variant?: FeedbackFormVariant | (() => FeedbackFormVariant), accountReady?: Promise<void> } = {}) {
  const drafts = new Map<TopicFormData['type'], TopicFormData>([
    ['BUG', { type: 'BUG', title: '', text: 'BUG content', tags: ['PLATFORM_PC'] }],
    ['FEAT', { type: 'FEAT', title: 'Feature title', text: 'FEAT content', tags: ['PLATFORM_PC'] }],
  ])
  const formData = shallowRef(drafts.get('BUG')!)
  const isOpen = ref(true)
  const submitLoading = ref(false)
  const submission = deferred<{ ok: true, topic: { id: string } }>()
  const validation = deferred<{ valid: boolean, errors: Record<string, string> }>()
  const resetTypes: TopicFormData['type'][] = []
  const initializedTypes: TopicFormData['type'][] = []
  let submitCalls = 0
  const setFormType = (type: TopicFormData['type']) => formData.value = drafts.get(type)!
  const queue = { attachments: ref([]), retry: async () => ({ ok: true }), serializedAttachments: ref([]), settleUploads: options.settleUploads ?? (async () => ({ ok: true })) }
  const savedDrafts: Array<{ type: string, text: string }> = []
  const userInfo = reactive<{ info?: { login: string }, refreshUserInfo: () => Promise<void> }>({
    info: options.accountReady ? undefined : { login: 'alice' },
    refreshUserInfo: async () => {
      await options.accountReady
      userInfo.info = { login: 'alice' }
    },
  })
  const state = {
    formData,
    isOpen,
    formTabs: ref([]),
    tabList: ref(['BUG', 'FEAT']),
    nextTab: ref(undefined),
    hasPermission: ref(false),
    isDirty: ref(false),
    savedAttachments: ref([]),
    setFormType,
    switchTab: () => setFormType('FEAT'),
    openForm: (type?: TopicFormData['type']) => {
      if (type)
        setFormType(type)
      isOpen.value = true
    },
    closeForm: () => isOpen.value = false,
    initFormData: (type = formData.value.type) => {
      if (options.cleanupError)
        throw options.cleanupError
      initializedTypes.push(type)
      const draft = { type, title: '', text: '', tags: [] }
      drafts.set(type, draft)
      if (formData.value.type === type)
        formData.value = draft
    },
    validate: () => validation.promise,
    setQuotedTopic: () => {},
    setPrivate: (isPrivate: boolean) => formData.value = { ...formData.value, isPrivate },
    saveDraft: (_images: unknown, type = formData.value.type) => savedDrafts.push({ type, text: drafts.get(type)!.text }),
    discardDraft: () => {},
    deleteDraft: () => {},
  }
  const noop = () => {}
  mocks.drafts = drafts as unknown as Map<string, unknown>
  mocks.exitHandlers.clear()
  mocks.hashHandler = undefined
  mocks.state = state
  mocks.userInfo = userInfo
  mocks.formSubmit = {
    submitLoading,
    attachments: ref([]),
    serializedAttachments: ref([]),
    progress: ref({ total: 0, settled: 0 }),
    handleSubmit: async () => {
      submitCalls++
      submitLoading.value = true
      try {
        return await submission.promise
      }
      finally {
        submitLoading.value = false
      }
    },
    reset: (type = formData.value.type) => resetTypes.push(type),
    getQueue: () => queue,
    addFiles: noop,
    remove: noop,
    retry: noop,
    restore: noop,
    settleUploads: noop,
  }
  vi.stubGlobal('window', { location: { href: 'http://localhost/forum' }, history: {} })
  const scope = effectScope()
  const controller = scope.run(() => usePublishTopicController(() => options.presentation ?? null, undefined, () => typeof options.variant === 'function' ? options.variant() : options.variant ?? 'compact'))!
  return { controller, drafts, formData, state, savedDrafts, exit: (event: string, payload = new Event(event, { cancelable: true })) => mocks.exitHandlers.get(event)!(payload as BeforeUnloadEvent), isOpen, validation, submission, resetTypes, initializedTypes, hash: (hash: string) => mocks.hashHandler!(hash), submitCalls: () => submitCalls, dispose: () => scope.stop() }
}

test('validation and publication lock hash entries, reopening and every form-type action', async () => {
  const setup = runtime()
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    setup.controller.actions.selectInitialType('FEAT')
    setup.controller.actions.setFormType('FEAT')
    setup.controller.actions.switchTab()
    setup.hash('PUBLISH-TOPIC-FEAT')
    assert.equal(setup.formData.value.type, 'BUG')
    assert.equal(setup.controller.submission.finalIsDisabled.value, true)
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(setup.isOpen.value, false)
    setup.controller.actions.handleOpenChange(true)
    setup.hash('PUBLISH-TOPIC-FEAT')
    setup.hash('PUBLISH-TOPIC-DRAFT-FEAT')
    setup.controller.actions.selectInitialType('FEAT')
    await setup.controller.actions.handleFormSubmit()
    assert.equal(setup.formData.value.type, 'BUG')
    assert.equal(setup.isOpen.value, false)
    assert.equal(setup.submitCalls(), 1)
    setup.submission.resolve({ ok: true, topic: { id: 'I123' } })
    await sending
    assert.equal(setup.drafts.get('FEAT')!.text, 'FEAT content')
    setup.controller.actions.setFormType('FEAT')
    assert.equal(setup.formData.value.type, 'FEAT')
  }
  finally { setup.dispose() }
})

test('success clears the submitted type even if permissions change the current form during the request', async () => {
  const setup = runtime()
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(setup.submitCalls(), 1)
    // Simulate a form-state permission watcher, which bypasses UI entry guards.
    setup.formData.value = setup.drafts.get('FEAT')!
    setup.submission.resolve({ ok: true, topic: { id: 'I123' } })
    await sending
    assert.deepEqual(setup.initializedTypes, ['BUG'])
    assert.deepEqual(setup.resetTypes, ['BUG'])
    assert.equal(setup.formData.value.text, 'FEAT content')
    assert.equal(setup.drafts.get('BUG')!.text, '')
  }
  finally { setup.dispose() }
})

test('failed validation releases the entry lock without starting a publication', async () => {
  const setup = runtime()
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    setup.validation.resolve({ valid: false, errors: { text: 'Required' } })
    await sending
    setup.controller.actions.selectInitialType('FEAT')
    assert.equal(setup.formData.value.type, 'FEAT')
    assert.equal(setup.submitCalls(), 0)
  }
  finally { setup.dispose() }
})

test('page exit preserves text even while manual save is waiting for uploads', async () => {
  const uploads = deferred<UploadImageAttachmentsResult>()
  const setup = runtime({ settleUploads: () => uploads.promise })
  try {
    setup.state.isDirty.value = true
    const saving = setup.controller.actions.saveDraft()
    await Promise.resolve()
    setup.drafts.get('BUG')!.text = 'Latest edit before exit'
    setup.exit('pagehide')
    assert.deepEqual(setup.savedDrafts, [{ type: 'BUG', text: 'Latest edit before exit' }])
    uploads.resolve({ ok: true })
    assert.equal(await saving, false)
    assert.equal(setup.savedDrafts.length, 1)
  }
  finally { setup.dispose() }
})

test('unexpected submission rejection waits for closing and releases the form for retry', async () => {
  const closing = deferred<void>()
  const setup = runtime({ presentation: { focusValidation() {}, focusUploadFailure() {}, settleSend: () => closing.promise } })
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    setup.submission.reject(new Error('Unexpected upload failure'))
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(setup.controller.submission.finalIsDisabled.value, true)
    closing.resolve()
    await sending
    assert.equal(setup.isOpen.value, true)
    assert.equal(setup.controller.submission.finalIsDisabled.value, false)
    assert.equal(setup.controller.submission.submissionPhase.value, 'failed')
    assert.equal(setup.formData.value.text, 'BUG content')
    setup.controller.actions.setFormType('FEAT')
    assert.equal(setup.formData.value.type, 'FEAT')
  }
  finally { setup.dispose() }
})

test('animation rejection does not turn a successful publication into failure', async () => {
  const setup = runtime({ presentation: { focusValidation() {}, focusUploadFailure() {}, settleSend: async () => {
    throw new Error('Animation interrupted')
  } } })
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    setup.submission.resolve({ ok: true, topic: { id: 'I123' } })
    await sending
    assert.equal(setup.controller.submission.submissionPhase.value, 'succeeded')
    assert.equal(setup.controller.submission.finalIsDisabled.value, false)
    assert.deepEqual(setup.initializedTypes, ['BUG'])
  }
  finally { setup.dispose() }
})

test('storage cleanup failure after publication retains success and does not reopen for retry', async () => {
  const setup = runtime({ cleanupError: new Error('Storage unavailable') })
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    setup.submission.resolve({ ok: true, topic: { id: 'I123' } })
    await sending
    assert.equal(setup.controller.submission.submissionPhase.value, 'succeeded')
    assert.equal(setup.controller.submission.finalIsDisabled.value, false)
    assert.equal(setup.isOpen.value, false)
    assert.equal(setup.submitCalls(), 1)
  }
  finally { setup.dispose() }
})

test('legacy form has no draft resume, save, close prompt or page-exit persistence', async () => {
  const setup = runtime({ variant: 'legacy' })
  try {
    setup.isOpen.value = false
    setup.hash('PUBLISH-TOPIC-DRAFT-FEAT')
    assert.equal(setup.isOpen.value, false)
    assert.equal(setup.formData.value.type, 'BUG')
    assert.equal(await setup.controller.actions.saveDraft(), false)
    setup.state.isDirty.value = true
    setup.exit('pagehide')
    setup.exit('beforeunload')
    assert.deepEqual(setup.savedDrafts, [])
    setup.isOpen.value = true
    await setup.controller.actions.handleClose()
    assert.equal(setup.isOpen.value, false)
    assert.equal(setup.controller.form.draftPromptOpen.value, false)
    assert.equal(setup.controller.form.autoSaveEnabled.value, false)
  }
  finally { setup.dispose() }
})

test('reload warns for dirty legacy and compact drafts and allows clean forms', () => {
  for (const variant of ['legacy', 'compact'] as const) {
    const setup = runtime({ variant })
    try {
      setup.state.isDirty.value = true
      const dirty = new Event('beforeunload', { cancelable: true })
      setup.exit('beforeunload', dirty)
      assert.equal(dirty.defaultPrevented, true)
      assert.equal(setup.savedDrafts.length, variant === 'compact' ? 1 : 0)
      setup.state.isDirty.value = false
      const clean = new Event('beforeunload', { cancelable: true })
      setup.exit('beforeunload', clean)
      assert.equal(clean.defaultPrevented, false)
    }
    finally { setup.dispose() }
  }
})

test('reload warns while publication validation is pending even without dirty input', async () => {
  const setup = runtime()
  try {
    const sending = setup.controller.actions.handleFormSubmit()
    const unload = new Event('beforeunload', { cancelable: true })
    setup.exit('beforeunload', unload)
    assert.equal(unload.defaultPrevented, true)
    setup.validation.resolve({ valid: false, errors: {} })
    await sending
  }
  finally { setup.dispose() }
})

test('cold draft links wait for account rollout and resume only the compact form', async () => {
  for (const compact of [true, false]) {
    const account = deferred<void>()
    let assigned: FeedbackFormVariant = 'legacy'
    const setup = runtime({ accountReady: account.promise, variant: () => assigned })
    try {
      setup.isOpen.value = false
      setup.hash('PUBLISH-TOPIC-DRAFT-FEAT')
      assert.equal(setup.isOpen.value, false)
      assigned = compact ? 'compact' : 'legacy'
      account.resolve()
      await new Promise<void>(resolve => setImmediate(resolve))
      assert.equal(setup.isOpen.value, compact)
      assert.equal(setup.controller.form.editingSavedDraft.value, compact)
      assert.equal(setup.formData.value.type, compact ? 'FEAT' : 'BUG')
    }
    finally { setup.dispose() }
  }
})

test('cold openings initialize their entry after account rollout without losing explicit targets', async () => {
  for (const entry of ['hash', 'button', 'target'] as const) {
    const account = deferred<void>()
    let assigned: FeedbackFormVariant = 'legacy'
    const setup = runtime({ accountReady: account.promise, variant: () => assigned })
    try {
      setup.isOpen.value = false
      if (entry === 'button')
        setup.controller.actions.handleOpenChange(true)
      else
        setup.hash(entry === 'target' ? 'PUBLISH-TOPIC-FEAT' : 'PUBLISH-TOPIC')
      assigned = 'compact'
      account.resolve()
      await new Promise<void>(resolve => setImmediate(resolve))
      setup.controller.actions.initializeEntryPage()
      assert.equal(setup.controller.form.entryPage.value, entry === 'target' ? 'form' : 'types')
      assert.equal(setup.formData.value.type, entry === 'target' ? 'FEAT' : 'BUG')
    }
    finally { setup.dispose() }
  }
})

test('the legacy form opens straight into the form while the compact form starts on the type chooser', () => {
  for (const variant of ['legacy', 'compact'] as const) {
    const setup = runtime({ variant })
    try {
      setup.isOpen.value = false
      setup.hash('PUBLISH-TOPIC')
      assert.equal(setup.isOpen.value, true)
      assert.equal(setup.controller.form.entryPage.value, variant === 'legacy' ? 'form' : 'types')
      assert.equal(setup.controller.form.choosingType.value, variant === 'compact')
      assert.equal(setup.formData.value.type, 'BUG')
      setup.isOpen.value = false
      setup.controller.actions.handleOpenChange(true)
      assert.equal(setup.controller.form.entryPage.value, variant === 'legacy' ? 'form' : 'types')
    }
    finally { setup.dispose() }
  }
})

test('create more is offered only after success on a new opening within five minutes', async () => {
  let now = 1000
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  const setup = runtime()
  try {
    assert.equal(setup.controller.form.showCreateMore.value, false)
    const sending = setup.controller.actions.handleFormSubmit()
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    setup.submission.resolve({ ok: true, topic: { id: 'I123' } })
    await sending
    setup.controller.actions.handleOpenChange(true)
    assert.equal(setup.controller.form.showCreateMore.value, true)
    now += 5 * 60_000
    assert.equal(setup.controller.form.showCreateMore.value, true, 'do not remove the switch while editing')
    await setup.controller.actions.handleClose()
    setup.controller.actions.handleOpenChange(true)
    assert.equal(setup.controller.form.showCreateMore.value, false)
  }
  finally { setup.dispose() }
})

test('failed publication does not offer create more and privacy cannot change during submission', async () => {
  const setup = runtime()
  try {
    setup.controller.actions.setPrivate(true)
    assert.equal(setup.formData.value.isPrivate, true)
    const sending = setup.controller.actions.handleFormSubmit()
    setup.controller.actions.setPrivate(false)
    assert.equal(setup.formData.value.isPrivate, true)
    setup.validation.resolve({ valid: true, errors: {} })
    await new Promise<void>(resolve => setImmediate(resolve))
    setup.submission.reject(new Error('Rejected'))
    await sending
    assert.equal(setup.controller.form.showCreateMore.value, false)
    assert.equal(setup.formData.value.isPrivate, true)
  }
  finally { setup.dispose() }
})
