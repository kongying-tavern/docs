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

test('form wiring keeps one submission and starts bounded closing before awaiting the network', () => {
  const submitSource = readFileSync(new URL('../../src/components/forum/form/composables/useFormSubmit.ts', import.meta.url), 'utf8')
  const formSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue', import.meta.url), 'utf8')
  const styleSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.scss', import.meta.url), 'utf8')

  assert.match(submitSource, /if \(activeSubmission\)\s+return activeSubmission/)
  assert.match(formSource, /const closeCompletion = closeAfterSend\(\)\s+const result = await submitForm/)
  assert.match(formSource, /const SEND_MOTION_MS = 260/)
  assert.match(styleSource, /prefers-reduced-motion: reduce/)
})

test('quote actions follow comments and the quote card lives inside the body input', () => {
  const footerSource = readFileSync(new URL('../../src/components/forum/list/ForumTopicFooter.vue', import.meta.url), 'utf8')
  const listTopicSource = readFileSync(new URL('../../src/components/forum/list/ForumTopic.vue', import.meta.url), 'utf8')
  const contentSource = readFileSync(new URL('../../src/components/forum/form/ForumFormContent.vue', import.meta.url), 'utf8')
  const inputSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumContentInputBox.vue', import.meta.url), 'utf8')
  const formSource = readFileSync(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue', import.meta.url), 'utf8')
  const cardSource = readFileSync(new URL('../../src/components/forum/topic/ForumQuotedTopicCard.vue', import.meta.url), 'utf8')
  const quoteSource = readFileSync(new URL('../../src/components/forum/topic/ForumQuotedTopic.vue', import.meta.url), 'utf8')
  const quoteButtonSource = readFileSync(new URL('../../src/components/forum/topic/ForumQuoteTopicButton.vue', import.meta.url), 'utf8')
  const detailSource = readFileSync(new URL('../../src/components/forum/topic/ForumTopicPage.vue', import.meta.url), 'utf8')
  const detailFooterSource = readFileSync(new URL('../../src/components/forum/topic/ForumTopicFooter.vue', import.meta.url), 'utf8')
  const transitionSource = readFileSync(new URL('../../.vitepress/theme/lib/forumViewTransition.ts', import.meta.url), 'utf8')
  const animationSource = readFileSync(new URL('../../.vitepress/theme/styles/animation.css', import.meta.url), 'utf8')
  const imageSource = readFileSync(new URL('../../src/components/forum/ui/ForumImage.vue', import.meta.url), 'utf8')

  const commentActionIndex = footerSource.indexOf('@click="handleCommentClick"')
  const quoteActionIndex = footerSource.indexOf('<ForumQuoteTopicButton')
  assert.ok(commentActionIndex >= 0 && quoteActionIndex > commentActionIndex)

  const bodyFieldIndex = contentSource.indexOf('name="text"')
  const afterContentSlotIndex = contentSource.indexOf('<slot name="after-content"')
  const desktopUploadIndex = contentSource.indexOf('class="desktop-upload-field')
  assert.ok(bodyFieldIndex >= 0 && afterContentSlotIndex > bodyFieldIndex)
  assert.ok(desktopUploadIndex < 0 || afterContentSlotIndex < desktopUploadIndex)
  assert.match(contentSource, /<ForumContentInputBox[\s\S]*<template #after-editor>[\s\S]*<slot name="after-content"/)
  assert.match(inputSource, /<div class="editor min-h-inherit relative">[\s\S]*<slot name="after-editor" \/>/)
  assert.doesNotMatch(inputSource, /\{\{ textLimit \}\}/)
  assert.match(formSource, /<template #after-content>[\s\S]*<ForumQuotedTopicCard/)
  assert.match(formSource, /if \(!isQuotableTopicType\(quotedTopic\.type\)\) \{[\s\S]*setQuotedTopic\(undefined\)/)
  assert.doesNotMatch(formSource, /removeQuotedTopic/)
  assert.match(cardSource, /border: 1px solid transparent/)
  assert.match(cardSource, /\.quoted-topic-card:hover,[\s\S]*border-color: var\(--vp-c-border\)/)
  assert.match(cardSource, /background: var\(--vp-c-bg-soft\)/)
  assert.match(cardSource, /\.quoted-topic-card--readonly \{[\s\S]*color-mix\(/)
  assert.doesNotMatch(cardSource, /box-shadow:/)
  assert.match(quoteSource, /data-forum-shared-topic="quote"/)
  assert.match(quoteButtonSource, /v-if="isQuotableTopicType\(topic\.type\)"/)
  assert.match(transitionSource, /'content', 'image', 'quote'/)
  assert.match(animationSource, /::view-transition-group\(forum-topic-quote\)/)
  assert.ok(detailFooterSource.indexOf('<ForumQuoteTopicButton') < detailFooterSource.indexOf('<ForumCopyLinkButton'))
  assert.match(footerSource, /topic-info-list flex gap-3/)
  assert.match(detailFooterSource, /class="flex gap-3"/)
  assert.match(formSource, /:interactive="false"/)
  assert.match(cardSource, /:preview-enabled="interactive"/)
  assert.match(listTopicSource, /<ForumQuotedTopic[\s\S]*:compact="isCompactMode"/)
  assert.match(quoteSource, /:compact="compact"/)
  assert.match(cardSource, /compact \? 'line-clamp-2' : 'line-clamp-5'/)
  assert.match(cardSource, /!props\.compact && shouldShowQuotedTopicImageBelow/)
  assert.match(cardSource, /\.quoted-topic-card--compact \.quote-side-media \{\s+width: 72px/)
  assert.doesNotMatch(cardSource, /message\.forum\.topic\.quote\.quoted|ForumTopicTypeBadge|message\.forum\.topic\.status|emit\('remove'\)/)
  assert.match(cardSource, /line-clamp-5/)
  assert.match(cardSource, /layout="thumbnail"/)
  assert.match(cardSource, /:max-display="4"/)
  assert.match(cardSource, /aspect-ratio: 1/)
  assert.match(detailSource, /<ForumImage[\s\S]*:images="topicImages"/)
  assert.match(imageSource, /planForumImageGrid\([\s\S]*adaptiveAspect\.value/)
  assert.match(imageSource, /props\.layout === 'auto' && availableImages\.value\.length > 1/)
  assert.match(imageSource, /!isAdaptiveGrid && actualLayout === 'triple' \? tripleGridClasses/)
  assert.match(imageSource, /actualLayout === 'thumbnail' \? 'h-full'/)
  assert.match(imageSource, /:is="previewEnabled \? 'button' : 'div'"/)
  assert.doesNotMatch(imageSource, /\.grid > div:hover/)
  assert.match(imageSource, /openAt\(previewIndexFor\(sourceIndex\)/)
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
