import type ForumAPI from '../../src/forum/api/types'
import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { ref } from 'vue'
import { useImageAttachmentQueue } from '../../src/forum/composables/view/useImageAttachmentQueue'
import { createDefaultTopicDraft, readTopicDraft, restoreTopicDraft, writeTopicDraft } from '../../src/forum/services/form/topicDraft'
import { submitTopicFormTransaction } from '../../src/forum/services/form/topicFormTransaction'
import { addTagToModel, removeTagFromModel } from '../../src/forum/services/form/topicTagModel'
import { createTopicDraftSchema, getAllowedTopicTypes } from '../../src/forum/services/form/validation'
import { VALIDATION_LIMITS } from '../../src/forum/services/forumConfig'

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

test('rich Topic validation measures visible content instead of serialized JSON', () => {
  const schema = createTopicDraftSchema({ canPublishAnnouncement: false })
  const richText = (text: string) => JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', ...(text ? { content: [{ type: 'text', text, marks: [{ type: 'bold' }] }] } : {}) }] })
  assert.equal(schema.safeParse({ ...validDraft(), text: richText('') }).success, false)
  assert.equal(schema.safeParse({ ...validDraft(), text: richText('Valid content') }).success, true)
  assert.equal(schema.safeParse({ ...validDraft(), text: richText('x'.repeat(VALIDATION_LIMITS.CONTENT.MAX_LENGTH + 1)) }).success, false)
})

for (const { name, patch, valid } of [
  { name: 'title maximum', patch: { title: 'x'.repeat(VALIDATION_LIMITS.TITLE.MAX_LENGTH) }, valid: true },
  { name: 'title above maximum', patch: { title: 'x'.repeat(VALIDATION_LIMITS.TITLE.MAX_LENGTH + 1) }, valid: false },
  { name: 'whitespace title', patch: { title: '   ' }, valid: false },
  { name: 'content minimum', patch: { text: 'x'.repeat(VALIDATION_LIMITS.CONTENT.MIN_LENGTH) }, valid: true },
  { name: 'content below minimum', patch: { text: 'x'.repeat(VALIDATION_LIMITS.CONTENT.MIN_LENGTH - 1) }, valid: false },
  { name: 'content maximum', patch: { text: 'x'.repeat(VALIDATION_LIMITS.CONTENT.MAX_LENGTH) }, valid: true },
  { name: 'content above maximum', patch: { text: 'x'.repeat(VALIDATION_LIMITS.CONTENT.MAX_LENGTH + 1) }, valid: false },
  { name: 'tag count maximum', patch: { tags: Array.from({ length: VALIDATION_LIMITS.TAGS.MAX_COUNT }, (_, i) => `tag-${i}`) }, valid: true },
  { name: 'tag count above maximum', patch: { tags: Array.from({ length: VALIDATION_LIMITS.TAGS.MAX_COUNT + 1 }, (_, i) => `tag-${i}`) }, valid: false },
  { name: 'tag length maximum', patch: { tags: ['x'.repeat(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH)] }, valid: true },
  { name: 'tag length above maximum', patch: { tags: ['x'.repeat(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH + 1)] }, valid: false },
]) {
  test(`Topic validation boundary: ${name}`, () => {
    assert.equal(createTopicDraftSchema({ canPublishAnnouncement: false }).safeParse({ ...validDraft('FEAT'), ...patch }).success, valid)
  })
}

test('schema and draft restore keep one validated quoted Topic without locking the form type', () => {
  const reference = { id: 'ICROD8', type: 'BUG' as const }
  const schema = createTopicDraftSchema({ canPublishAnnouncement: false })

  assert.equal(schema.safeParse({ ...validDraft('FEAT'), quotedTopic: reference }).success, true)
  assert.equal(schema.safeParse({ ...validDraft('BUG'), quotedTopic: { id: '../bad', type: 'BUG' } }).success, false)
  assert.equal(schema.safeParse({ ...validDraft('FEAT'), quotedTopic: { id: 'ICROD8', type: 'ANN' } }).success, false)
  assert.deepEqual(restoreTopicDraft({ ...validDraft('FEAT'), quotedTopic: reference }), {
    ...validDraft('FEAT'),
    tags: [],
    quotedTopic: reference,
  })
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

test('default/reset drafts and tag arrays are fresh and storage restore ignores invalid attachments', () => {
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

test('draft storage preserves uploaded image metadata per type and excludes transient files and unsafe URLs', () => {
  const storage = new Map<string, string>()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } })
  try {
    const image = { src: 'https://assets.example/saved.png', alt: 'saved.png', thumbHash: 'hash', width: 120, height: 80 }
    const draft = restoreTopicDraft({
      ...validDraft('FEAT'),
      attachments: [image, { src: 'blob:temporary', alt: 'pending.png' }, { src: 'javascript:alert(1)' }, { ...image, file: new File(['image'], 'private.png'), previewUrl: 'blob:private' }],
    })
    assert.deepEqual(draft.attachments, [image, image])
    writeTopicDraft('FEAT', draft)
    assert.deepEqual(readTopicDraft('FEAT').attachments, [image, image])
    assert.equal(readTopicDraft('BUG').attachments, undefined)
    assert.equal([...storage.values()].some(value => value.includes('private') || value.includes('blob:')), false)
    writeTopicDraft('FEAT', { ...draft, attachments: [] })
    assert.equal(readTopicDraft('FEAT').attachments, undefined)
  }
  finally {
    if (previous)
      Object.defineProperty(globalThis, 'localStorage', previous)
    else
      Reflect.deleteProperty(globalThis, 'localStorage')
  }
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

test('transaction passes the quoted Topic through independently of the selected form type', async () => {
  const reference = { id: 'ICROD8', type: 'BUG' as const }
  let submitted: ForumAPI.CreateTopicOption | undefined
  const result = await submitTopicFormTransaction({
    draft: { ...validDraft('FEAT'), quotedTopic: reference },
    canPublishAnnouncement: false,
    settleUploads: async () => ({ ok: true }),
    getUploadedAttachments: () => [],
    submitTopic: async (draft) => {
      submitted = draft
      return topic()
    },
  })

  assert.equal(result.ok, true)
  assert.equal(submitted?.type, 'FEAT')
  assert.deepEqual(submitted?.quotedTopic, reference)
})

test('privacy survives draft storage and validation and is passed to the publication', async () => {
  const restored = restoreTopicDraft({ ...validDraft('FEAT'), isPrivate: true })
  assert.equal(restored.isPrivate, true)
  assert.equal(restoreTopicDraft({ ...validDraft('FEAT'), isPrivate: 'true' }).isPrivate, undefined)
  assert.equal(createTopicDraftSchema({ canPublishAnnouncement: false }).safeParse({ ...validDraft('FEAT'), isPrivate: 'true' }).success, false)
  for (const isPrivate of [true, false]) {
    let submitted: ForumAPI.CreateTopicOption | undefined
    const result = await submitTopicFormTransaction({
      draft: { ...restored, isPrivate },
      canPublishAnnouncement: false,
      settleUploads: async () => ({ ok: true }),
      getUploadedAttachments: () => [],
      submitTopic: async (draft) => {
        submitted = draft
        return topic()
      },
    })
    assert.equal(result.ok, true)
    assert.equal(submitted?.isPrivate, isPrivate)
  }
})
