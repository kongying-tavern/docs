/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { ref } from 'vue'
import { createDefaultTopicDraft, restoreTopicDraft } from '../../src/components/forum/form/composables/topicDraft'
import { submitTopicFormTransaction } from '../../src/components/forum/form/composables/topicFormTransaction'
import { addTagToModel, removeTagFromModel } from '../../src/components/forum/form/composables/topicTagModel'
import { createTopicDraftSchema, getAllowedTopicTypes } from '../../src/components/forum/utils/validation'
import { useImageAttachmentQueue } from '../../src/composables/useImageAttachmentQueue'

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
    uploadPending: async () => ({ ok: false, errors: [{ message: 'upload failed' }] }),
    getUploadedAttachments: () => [],
    submitTopic: async () => {
      mutationCalls++
      return topic()
    },
  })

  assert.deepEqual(result, { ok: false, stage: 'upload', error: new Error('upload failed') })
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
    uploadPending: queue.uploadPending,
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
