import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { buildUserProfileForm } from '../../src/forum/api/gitee/userProfile'
import { applyUserProfilePatch, settleUserProfilePatch, syncUserProfileDraft } from '../../src/forum/services/forumUserProfileOptimistic'

test('profile update clears bio without overwriting unspecified profile fields', () => {
  const body = buildUserProfileForm({ bio: '' })
  assert.deepEqual([...body.entries()], [['bio', '']])
})

test('profile update maps display name and ignores unsupported fields', () => {
  const body = buildUserProfileForm({ username: '新昵称', bio: '多行\n简介', email: 'ignored' } as Parameters<typeof buildUserProfileForm>[0])
  assert.deepEqual([...body.entries()], [['name', '新昵称'], ['bio', '多行\n简介']])
})

const user = { id: 1, login: 'alice', username: 'Alice', bio: 'Saved bio' }

test('profile inputs adopt changes saved in another editor without creating a dirty draft', () => {
  const baseline = { username: user.username, bio: user.bio }
  const draft = { ...baseline }
  syncUserProfileDraft(draft, baseline, { ...user, bio: 'Updated in settings' }, ['username', 'bio'])
  assert.equal(draft.bio, 'Updated in settings')
  assert.deepEqual(draft, baseline)
})

test('profile input synchronization keeps local edits while updating untouched fields and the baseline', () => {
  const baseline = { username: user.username, bio: user.bio }
  const draft = { ...baseline, bio: 'Unsaved local edit' }
  syncUserProfileDraft(draft, baseline, { ...user, username: 'New name', bio: 'Saved elsewhere' }, ['username', 'bio'])
  assert.deepEqual(draft, { username: 'New name', bio: 'Unsaved local edit' })
  assert.deepEqual(baseline, { username: 'New name', bio: 'Saved elsewhere' })
  syncUserProfileDraft(draft, baseline, { ...user, bio: '' }, ['bio'])
  assert.equal(draft.bio, 'Unsaved local edit')
  assert.equal(baseline.bio, '')
})

test('optimistic profile changes immediately and failed changes restore saved values', () => {
  const patch = { bio: '' }
  const optimistic = applyUserProfilePatch(user, patch)
  assert.equal(optimistic.bio, '')
  assert.equal(user.bio, 'Saved bio')
  assert.deepEqual(settleUserProfilePatch(optimistic, optimistic, user, patch), user)
})

test('profile settlement preserves newer edits and fields not included in the request', () => {
  const patch = { bio: 'First edit' }
  const optimistic = applyUserProfilePatch(user, patch)
  const current = { ...optimistic, bio: 'Later edit', username: 'New name' }
  assert.deepEqual(settleUserProfilePatch(current, optimistic, user, patch), current)
  assert.deepEqual(settleUserProfilePatch(current, optimistic, { ...user, bio: 'Server first edit' }, patch), current)
})

test('successful profile settlement adopts server values only for submitted fields', () => {
  const patch = { bio: 'Draft' }
  const optimistic = applyUserProfilePatch(user, patch)
  assert.deepEqual(
    settleUserProfilePatch(optimistic, optimistic, { ...user, bio: 'Normalized draft', username: 'Stale name' }, patch),
    { ...user, bio: 'Normalized draft' },
  )
})
