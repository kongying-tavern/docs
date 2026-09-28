/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('topic menu only reports confirmed updates as success and keeps pending dialogs open', async () => {
  const [manager, tagsDialog, statusDialog] = await Promise.all([
    readFile(new URL('../../src/forum/composables/state/useTopicManager.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/forum/components/topic/ForumTopicTagsEditorDialog.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/forum/components/topic/ForumTopicStatusDialog.vue', import.meta.url), 'utf8'),
  ])

  const update = manager.slice(manager.indexOf('async function update('), manager.indexOf('const toggleCloseTopic'))
  assert.match(update, /if \(outcome\.status === 'unknown'\) \{[\s\S]*?toast\.error\([\s\S]*?return false/)
  assert.match(update, /if \(outcome\.status === 'partial'\) \{[\s\S]*?toast\.warning\([\s\S]*?return false/)
  assert.match(update, /toast\.success\(successMessage\)/)
  assert.doesNotMatch(update, /notifySuccess/)
  assert.match(tagsDialog, /if \(result\)\s+open\.value = false/)
  assert.match(statusDialog, /if \(!result\)\s+return/)
})
