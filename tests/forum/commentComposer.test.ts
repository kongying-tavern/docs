import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '../../src/forum/api/types'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { collectMentionUsers, setCommentReply } from '../../src/forum/services/commentComposer'
import { decodeCommentBody, encodeCommentBody } from '../../src/forum/services/forumContentCodec'

const first: ForumAPI.User = { id: 1, login: 'first', username: 'First' }
const second: ForumAPI.User = { id: 2, login: 'second', username: 'Second' }
const initial: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Keep this text' }] }] }

test('mention candidates keep priorities and deduplicate both login and ID', () => {
  assert.deepEqual(collectMentionUsers([first], [{ ...first, id: 3, login: 'FIRST' }, second], [{ ...second, login: 'renamed' }]), [first, second])
})

test('changing a reply preserves text and user-authored mentions', () => {
  const original = { ...initial, content: [{ type: 'paragraph', content: [...initial.content![0]!.content!, { type: 'mention', attrs: { id: 3, label: 'manual' } }] }] }
  const reply = setCommentReply(original, undefined, first)
  const changed = setCommentReply(reply, first, second)
  const mentions = changed.content![0]!.content!.filter(node => node.type === 'mention')
  assert.deepEqual(mentions.map(node => node.attrs?.label), ['second', 'manual'])
  assert.ok(changed.content![0]!.content!.some(node => node.text === 'Keep this text'))
  assert.deepEqual(original.content![0]!.content!.map(node => node.attrs?.label).filter(Boolean), ['manual'])
})

test('canceling a reply only removes its untouched automatic mention', () => {
  const reply = setCommentReply(initial, undefined, first)
  assert.equal(setCommentReply(reply, first, undefined).content![0]!.content!.filter(node => node.type === 'mention').length, 0)
  reply.content![0]!.content![0]!.attrs!.label = 'edited'
  assert.equal(setCommentReply(reply, first, undefined).content![0]!.content![0]!.attrs!.label, 'edited')
})

test('replying twice does not duplicate an existing manual mention', () => {
  const doc: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: 1, label: 'first' } }] }] }
  assert.deepEqual(setCommentReply(doc, undefined, first), doc)
  assert.deepEqual(setCommentReply(doc, first, undefined), doc)
})

test('automatic reply metadata survives the existing comment codec', () => {
  const doc = setCommentReply(initial, undefined, first)
  const decoded = decodeCommentBody(encodeCommentBody(doc))
  assert.equal(decoded.content.kind, 'tiptap')
})

test('switching and canceling replies does not accumulate automatic separators', () => {
  const changed = setCommentReply(setCommentReply(initial, undefined, first), first, second)
  assert.deepEqual(setCommentReply(changed, second, undefined), initial)
})
