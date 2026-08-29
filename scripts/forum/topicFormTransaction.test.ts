/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { ref } from 'vue'
import { useImageAttachmentQueue } from '../../src/composables/useImageAttachmentQueue'
import { createDefaultTopicDraft, restoreTopicDraft } from '../../src/services/forum/form/topicDraft'
import { submitTopicFormTransaction } from '../../src/services/forum/form/topicFormTransaction'
import { addTagToModel, removeTagFromModel } from '../../src/services/forum/form/topicTagModel'
import { createTopicDraftSchema, getAllowedTopicTypes } from '../../src/services/forum/form/validation'

function validDraft(type: 'BUG' | 'FEAT' | 'ANN' = 'BUG') {
  return {
    type,
    title: type === 'BUG' ? '' : 'Title',
    text: 'Valid content',
    tags: type === 'BUG' ? ['CATA-DOCS'] : [],
  } as const
}

function topic(): ForumAPI.Topic {
  return { id: 'I123' } as ForumAPI.Topic
}

test('schema matches BUG, FEAT, and permission-gated ANN semantics', () => {
  const regular = createTopicDraftSchema({ canPublishAnnouncement: false })
  const manager = createTopicDraftSchema({ canPublishAnnouncement: true })

  assert.equal(regular.safeParse(validDraft('BUG')).success, true)
  assert.equal(regular.safeParse({ ...validDraft('BUG'), tags: [] }).success, false)
  assert.equal(regular.safeParse(validDraft('FEAT')).success, true)
  assert.equal(regular.safeParse({ ...validDraft('FEAT'), title: '' }).success, false)
  assert.equal(regular.safeParse(validDraft('ANN')).success, false)
  assert.equal(manager.safeParse(validDraft('ANN')).success, true)
  assert.deepEqual(getAllowedTopicTypes(false), ['BUG', 'FEAT'])
  assert.deepEqual(getAllowedTopicTypes(true), ['BUG', 'FEAT', 'ANN'])
})

test('schema normalizes untouched fields before reporting localized business errors', () => {
  const result = createTopicDraftSchema({
    canPublishAnnouncement: false,
    messages: {
      contentRequired: 'localized content',
      tagsRequired: 'localized tags',
    },
  }).safeParse({ type: 'BUG' })

  assert.equal(result.success, false)
  assert.deepEqual(result.success ? [] : result.error.issues.map(issue => issue.message), [
    'localized content',
    'localized tags',
  ])
})

test('default/reset drafts and tag arrays are fresh and storage restore ignores attachments', () => {
  const first = createDefaultTopicDraft()
  const second = createDefaultTopicDraft()
  assert.notEqual(first, second)
  assert.notEqual(first.tags, second.tags)

  const restored = restoreTopicDraft({
    type: 'FEAT',
    title: 'Saved',
    text: 'Saved content',
    tags: ['CATA-DOCS'],
    attachments: [{ secret: 'not persisted' }],
  })
  assert.deepEqual(restored, {
    type: 'FEAT',
    title: 'Saved',
    text: 'Saved content',
    tags: ['CATA-DOCS'],
  })
})

test('tag mutations follow the current model after reset', () => {
  const tags = ref(['OLD'])
  removeTagFromModel(tags, 'OLD')
  addTagToModel(tags, 'FIRST', 5)
  tags.value = []
  addTagToModel(tags, 'AFTER-RESET', 5)
  assert.deepEqual(tags.value, ['AFTER-RESET'])
})

test('upload failure prevents Topic mutation and preserves draft state', async () => {
  const draft = { ...validDraft('BUG'), tags: [...validDraft('BUG').tags] }
  const before = structuredClone(draft)
  let mutationCalls = 0

  const result = await submitTopicFormTransaction({
    draft,
    canPublishAnnouncement: false,
    settleUploads: async () => ({ ok: false, errors: [{ code: 'upload-failed', fileName: 'image.png' }] }),
    getUploadedAttachments: () => [],
    submitTopic: async () => {
      mutationCalls++
      return topic()
    },
  })

  assert.deepEqual(result, {
    ok: false,
    stage: 'upload',
    errors: [{ code: 'upload-failed', fileName: 'image.png' }],
  })
  assert.equal(mutationCalls, 0)
  assert.deepEqual(draft, before)
})

test('failed Topic creation retains uploaded metadata and retry does not upload twice', async () => {
  let uploadCalls = 0
  let submitCalls = 0
  let successCalls = 0
  const queue = useImageAttachmentQueue({
    createId: () => 'image-1',
    createPreviewUrl: () => 'blob:image-1',
    revokePreviewUrl: () => {},
    prepare: async () => undefined,
    upload: async (selected) => {
      uploadCalls++
      return {
        state: true,
        message: '',
        data: {
          id: selected.name,
          link: `https://assets.example/${selected.name}`,
          fileSize: selected.size,
          originName: selected.name,
        },
      }
    },
  })
  await queue.addFiles([new File(['image'], 'retry.png', { type: 'image/png' })])

  const options = {
    draft: validDraft('BUG'),
    canPublishAnnouncement: false,
    settleUploads: queue.settleUploads,
    getUploadedAttachments: () => queue.serializedAttachments.value,
    submitTopic: async () => {
      submitCalls++
      if (submitCalls === 1)
        throw new Error('topic failed')
      return topic()
    },
    onSuccess: () => successCalls++,
  }

  const failed = await submitTopicFormTransaction(options)
  assert.equal(failed.ok, false)
  assert.equal(failed.ok ? '' : failed.stage, 'topic')
  assert.equal(queue.attachments.value[0]?.status, 'uploaded')
  assert.equal(queue.serializedAttachments.value.length, 1)
  assert.equal(uploadCalls, 1)
  assert.equal(successCalls, 0)

  const retried = await submitTopicFormTransaction(options)
  assert.equal(retried.ok, true)
  assert.equal(uploadCalls, 1)
  assert.equal(submitCalls, 2)
  assert.equal(successCalls, 1)
})

test('transaction reports upload before publishing and never publishes after upload failure', async () => {
  const stages: string[] = []
  const result = await submitTopicFormTransaction({
    draft: validDraft('BUG'),
    canPublishAnnouncement: false,
    settleUploads: async () => ({ ok: true }),
    getUploadedAttachments: () => [],
    submitTopic: async () => topic(),
    onStage: stage => stages.push(stage),
  })

  assert.equal(result.ok, true)
  assert.deepEqual(stages, ['uploading', 'publishing'])

  stages.length = 0
  await submitTopicFormTransaction({
    draft: validDraft('BUG'),
    canPublishAnnouncement: false,
    settleUploads: async () => ({ ok: false, errors: [{ code: 'upload-failed', fileName: 'offline.png' }] }),
    getUploadedAttachments: () => [],
    submitTopic: async () => topic(),
    onStage: stage => stages.push(stage),
  })
  assert.deepEqual(stages, ['uploading'])
})

test('form wiring keeps one submission and starts bounded closing before awaiting the network', () => {
  const submitSource = readFileSync(new URL('../../src/components/forum/form/composables/useFormSubmit.ts', import.meta.url), 'utf8')
  const formSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.scss', import.meta.url), 'utf8')

  assert.match(submitSource, /if \(activeSubmission\)\s+return activeSubmission/)
  assert.match(formSource, /const closeCompletion = closeAfterSend\(\)\s+const result = await submitForm/)
  assert.match(formSource, /const SEND_MOTION_MS = 260/)
  assert.match(styleSource, /prefers-reduced-motion: reduce/)
})

test('desktop form motion moves the content surface without moving the action bar', () => {
  const configSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/config.ts', import.meta.url), 'utf8')
  const formSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.scss', import.meta.url), 'utf8')

  assert.match(configSource, /TRANSITION_DURATION = 480/)
  assert.match(formSource, /:class="\{ 'animate-switching': inSwitchTabTransition \}"/)
  assert.match(formSource, /<div class="form-motion-surface flex flex-col">[\s\S]*<ForumFormActions/)
  assert.match(formSource, /<\/div>\s+<ForumFormActionBar/)
  assert.match(styleSource, /--forum-form-enter-offset: 48px/)
  assert.match(styleSource, /--forum-form-switch-offset: 24px/)
  assert.match(styleSource, /@starting-style[\s\S]*\.form-container\.paper\[data-state='open'\] \.form-motion-surface/)
  assert.match(styleSource, /\.form-container\.paper\[data-state='closed'\] \{\s+animation: forum-form-presence-exit/)
  assert.match(styleSource, /\.form-container\.paper\.animate-switching \.form-motion-surface/)
  assert.match(styleSource, /@keyframes forum-form-content-switch[\s\S]*opacity: 0\.65/)
  assert.doesNotMatch(styleSource, /animate-switching[^,{]*\.action-bar/)
})

test('drafts persist only after confirmation or an unexpected page exit', () => {
  const stateSource = readFileSync(new URL('../../src/components/forum/form/composables/useFormState.ts', import.meta.url), 'utf8')
  const formSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue', import.meta.url), 'utf8')

  assert.doesNotMatch(stateSource, /watch\(formData/)
  assert.match(stateSource, /function saveDraft\(\)[\s\S]*writeTopicDraft\(type, draft\)/)
  assert.match(formSource, /if \(!isDirty\.value\) \{\s+closeForm\(\)/)
  assert.match(formSource, /draftPromptOpen\.value = true/)
  assert.match(formSource, /function keepDraft\(\)[\s\S]*saveDraft\(\)[\s\S]*closeForm\(\)/)
  assert.match(formSource, /function discardCurrentDraft\(\)[\s\S]*discardDraft\(\)[\s\S]*closeForm\(\)/)
  assert.match(formSource, /useEventListener\('pagehide', saveDirtyDraft\)/)
  assert.match(formSource, /@click="discardCurrentDraft"/)
  assert.match(formSource, /@click="keepDraft"/)
})
