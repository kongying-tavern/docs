/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { useImageAttachmentQueue } from '../../src/composables/useImageAttachmentQueue'
import {
  submitCommentTransaction,
} from '../../src/services/forum/commentTransaction'
import { decodeCommentBody, encodeCommentBody } from '../../src/services/forum/forumContentCodec'

function doc(text: string): JSONContent {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text }],
    }],
  }
}

function comment(id = 'comment-1'): ForumAPI.Comment {
  return {
    id,
    content: { text: 'Comment' },
  } as ForumAPI.Comment
}

function uploaded(name: string): ForumAPI.Image {
  return {
    state: true,
    message: '',
    data: {
      id: name,
      link: `https://assets.example/${name}`,
      fileSize: 4,
      originName: name,
    },
  }
}

function queue(upload: (file: File) => Promise<ForumAPI.Image> = file => Promise.resolve(uploaded(file.name))) {
  let id = 0
  return useImageAttachmentQueue({
    upload,
    prepare: async () => undefined,
    createId: () => `image-${id++}`,
    createPreviewUrl: file => `blob:${file.name}`,
    revokePreviewUrl: () => {},
  })
}

test('legacy plain Comment content remains readable through the codec', () => {
  const body = encodeCommentBody('legacy plain comment')
  assert.equal(body, 'legacy plain comment')
  assert.deepEqual(decodeCommentBody(body).content, {
    kind: 'plain',
    text: 'legacy plain comment',
  })
})

test('Tiptap Comment JSON keeps ordered attachments', () => {
  const body = encodeCommentBody(doc('hello'), [
    { src: 'https://assets.example/first.png', alt: 'first' },
    { src: 'https://assets.example/second.png', alt: 'second' },
  ])
  const decoded = decodeCommentBody(body)

  assert.equal(decoded.content.kind, 'tiptap')
  assert.deepEqual(decoded.attachments?.map(image => image.alt), ['first', 'second'])
})

test('upload failure prevents the Comment API call', async () => {
  let apiCalls = 0
  const result = await submitCommentTransaction({
    content: doc('hello'),
    plainText: 'hello',
    validate: () => undefined,
    settleUploads: async () => ({ ok: false, errors: [{ code: 'upload-failed', fileName: 'image.png' }] }),
    getUploadedAttachments: () => [],
    postComment: async () => {
      apiCalls++
      return comment()
    },
  })

  assert.deepEqual(result, {
    ok: false,
    stage: 'upload',
    errors: [{ code: 'upload-failed', fileName: 'image.png' }],
  })
  assert.equal(apiCalls, 0)
})

test('Comment API failure retains editor content and uploaded attachments', async () => {
  const attachments = queue()
  const editor = doc('retain me')
  await attachments.addFiles([new File(['test'], 'retain.png', { type: 'image/png' })])
  let successCalls = 0

  const result = await submitCommentTransaction({
    content: editor,
    plainText: 'retain me',
    validate: () => undefined,
    settleUploads: attachments.settleUploads,
    getUploadedAttachments: () => attachments.serializedAttachments.value,
    postComment: async () => {
      throw new Error('comment failed')
    },
    onSuccess: () => successCalls++,
  })

  assert.equal(result.ok, false)
  assert.equal(result.ok ? '' : result.stage, 'comment')
  assert.equal(successCalls, 0)
  assert.deepEqual(editor, doc('retain me'))
  assert.equal(attachments.attachments.value[0]?.status, 'uploaded')
  assert.equal(attachments.serializedAttachments.value.length, 1)
})

test('success clears exactly once and exposes the direct mutation result', async () => {
  const attachments = queue()
  await attachments.addFiles([new File(['test'], 'clear.png', { type: 'image/png' })])
  const returned = comment('direct-result')
  let editor: JSONContent = doc('clear me')
  let clears = 0
  let emitted: ForumAPI.Comment | undefined

  const result = await submitCommentTransaction({
    content: editor,
    plainText: 'clear me',
    validate: () => undefined,
    settleUploads: attachments.settleUploads,
    getUploadedAttachments: () => attachments.serializedAttachments.value,
    postComment: async (body) => {
      assert.equal(decodeCommentBody(body).attachments?.[0]?.alt, 'clear.png')
      return returned
    },
    onSuccess: (created) => {
      emitted = created
      editor = doc('')
      attachments.reset()
      clears++
    },
  })

  assert.deepEqual(result, { ok: true, comment: returned })
  assert.equal(emitted, returned)
  assert.equal(clears, 1)
  assert.deepEqual(editor, doc(''))
  assert.deepEqual(attachments.attachments.value, [])
})

test('create/delete mutations invalidate comments, Topic detail, and list counts without shadow state', async () => {
  const commentState = await readFile(new URL('../../src/components/forum/comment/composables/useCommentAreaState.ts', import.meta.url), 'utf8')
  const deleteAction = await readFile(new URL('../../src/components/forum/comment/ForumCommentFooter.vue', import.meta.url), 'utf8')
  const mutations = await readFile(new URL('../../src/composables/forum/useForumMutations.ts', import.meta.url), 'utf8')

  assert.match(commentState, /useForumCommentsQuery/)
  assert.equal(commentState.includes('userSubmittedComment'), false)
  assert.match(deleteAction, /forumMutations\.deleteComment/)
  assert.match(mutations, /invalidate\('createComment'/)
  assert.match(mutations, /invalidate\('deleteComment'/)
  assert.match(mutations, /forumKeys\.topicLists\(\)/)
  assert.match(mutations, /forumKeys\.topic\(topicId\)/)
  assert.match(mutations, /forumKeys\.comments\(topicId\)/)
})
