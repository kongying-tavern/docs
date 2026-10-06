import type { ImageAttachment, UploadImageAttachmentsResult } from '../../src/forum/services/form/imageAttachment'
import type { TopicFormData } from '../../src/forum/services/form/validation'
import assert from 'node:assert/strict'
import test from 'node:test'
import { computed, effectScope, ref } from 'vue'
import { useTopicDraftPersistence } from '../../src/forum/components/form/composables/useTopicDraftPersistence'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => resolve = done)
  return { promise, resolve }
}

function setup() {
  const uploads = deferred<UploadImageAttachmentsResult>()
  const attachments = ref<ImageAttachment[]>([])
  const images = ref<NonNullable<TopicFormData['attachments']>>([])
  const drafts = new Map([
    ['BUG', 'original bug'],
    ['FEAT', 'original feature'],
  ])
  const writes: Array<{ type: string, text: string, reset: boolean, images: typeof images.value }> = []
  let settlements = 0
  let retries = 0
  let storageFails = false
  const queue = {
    attachments,
    serializedAttachments: computed(() => images.value),
    settleUploads: () => {
      settlements++
      return uploads.promise
    },
    retry: async () => {
      retries++
      attachments.value = []
      return { ok: true as const }
    },
  }
  const scope = effectScope()
  const persistence = scope.run(() => useTopicDraftPersistence({
    getQueue: () => queue,
    persist: (savedImages, type, reset) => {
      if (storageFails)
        throw new Error('Storage full')
      writes.push({ type, text: drafts.get(type)!, reset, images: savedImages.map(image => ({ ...image })) })
    },
    uploadError: errors => errors.map(error => error.code).join(','),
    storageError: () => 'Storage failed',
  }))!
  return { persistence, scope, uploads, attachments, images, drafts, writes, queue, settlements: () => settlements, retries: () => retries, failStorage: () => storageFails = true }
}

test('manual save joins autosave, commits latest values for its original type, and persists once', async () => {
  const fixture = setup()
  try {
    fixture.persistence.activate('BUG')
    const automatic = fixture.persistence.flush('BUG')
    await Promise.resolve()
    const manual = fixture.persistence.save('BUG')
    assert.equal(automatic, manual)
    fixture.drafts.set('BUG', 'edited during upload')
    fixture.drafts.set('FEAT', 'editing another type')
    fixture.images.value = [{ src: 'https://example.com/image.png' }]
    fixture.uploads.resolve({ ok: true })
    assert.equal(await automatic, true)
    assert.deepEqual(fixture.writes, [{ type: 'BUG', text: 'edited during upload', reset: true, images: [{ src: 'https://example.com/image.png' }] }])
    assert.equal(fixture.settlements(), 1)
    assert.equal(fixture.persistence.states.get('BUG')?.status, 'saved')
    assert.equal(fixture.persistence.states.has('FEAT'), false)
  }
  finally { fixture.scope.stop() }
})

test('autosave preserves editor state and manual save retries failed images', async () => {
  const fixture = setup()
  try {
    fixture.attachments.value = [{ id: 'failed', selectionIndex: 0, previewUrl: '', status: 'failed' }]
    fixture.uploads.resolve({ ok: true })
    assert.equal(await fixture.persistence.save('BUG'), true)
    assert.equal(fixture.retries(), 1)
    assert.equal(fixture.persistence.states.get('BUG')?.enabled, true)
    assert.equal(await fixture.persistence.flush('BUG'), true)
    assert.deepEqual(fixture.writes.map(write => write.reset), [true, false])
  }
  finally { fixture.scope.stop() }
})

test('manual save joining an upload failure retries inside the same save task', async () => {
  const fixture = setup()
  try {
    const failed = deferred<UploadImageAttachmentsResult>()
    fixture.queue.settleUploads = () => failed.promise
    const automatic = fixture.persistence.flush('BUG')
    await Promise.resolve()
    const manual = fixture.persistence.save('BUG')
    fixture.attachments.value = [{ id: 'failed', selectionIndex: 0, previewUrl: '', status: 'failed' }]
    fixture.queue.settleUploads = async () => ({ ok: true })
    failed.resolve({ ok: false, errors: [{ code: 'upload-failed', fileName: 'image' }] })
    assert.equal(await manual, true)
    assert.equal(await automatic, true)
    assert.equal(fixture.retries(), 1)
    assert.equal(fixture.writes.length, 1)
  }
  finally { fixture.scope.stop() }
})

for (const action of ['stop', 'cancel', 'dispose'] as const) {
  test(`${action} prevents a late save from restoring a deleted, published or discarded draft`, async () => {
    const fixture = setup()
    try {
      fixture.persistence.activate('BUG')
      const pending = fixture.persistence.flush('BUG')
      await Promise.resolve()
      if (action === 'dispose')
        fixture.scope.stop()
      else
        fixture.persistence[action]('BUG')
      fixture.uploads.resolve({ ok: true })
      assert.equal(await pending, false)
      assert.equal(fixture.writes.length, 0)
      if (action === 'cancel')
        assert.equal(fixture.persistence.states.get('BUG')?.enabled, true)
      if (action === 'stop')
        assert.equal(fixture.persistence.states.has('BUG'), false)
    }
    finally { fixture.scope.stop() }
  })
}

test('a replaced save task cannot clear or settle its successor', async () => {
  const fixture = setup()
  try {
    const old = fixture.persistence.flush('BUG')
    await Promise.resolve()
    fixture.persistence.stop('BUG')
    const newUploads = deferred<UploadImageAttachmentsResult>()
    fixture.queue.settleUploads = () => newUploads.promise
    const next = fixture.persistence.save('BUG')
    await Promise.resolve()
    fixture.uploads.resolve({ ok: true })
    assert.equal(await old, false)
    assert.equal(fixture.persistence.flush('BUG'), next)
    newUploads.resolve({ ok: true })
    assert.equal(await next, true)
    assert.equal(fixture.writes.length, 1)
  }
  finally { fixture.scope.stop() }
})

test('upload and storage failures retain drafts and do not report a saved baseline', async () => {
  for (const failure of ['upload', 'storage']) {
    const fixture = setup()
    try {
      if (failure === 'storage')
        fixture.failStorage()
      fixture.uploads.resolve(failure === 'upload'
        ? { ok: false, errors: [{ code: 'upload-failed', fileName: 'image' }] }
        : { ok: true })
      assert.equal(await fixture.persistence.save('BUG'), false)
      assert.equal(fixture.writes.length, 0)
      assert.equal(fixture.drafts.get('BUG'), 'original bug')
      assert.equal(fixture.persistence.states.get('BUG')?.status, 'error')
      assert.equal(fixture.persistence.states.get('BUG')?.savedAt, 0)
    }
    finally { fixture.scope.stop() }
  }
})

test('page exit persists immediately and invalidates a waiting asynchronous save', async () => {
  const fixture = setup()
  try {
    const pending = fixture.persistence.flush('BUG')
    await Promise.resolve()
    fixture.drafts.set('BUG', 'last edit before exit')
    fixture.persistence.saveSnapshot('BUG')
    fixture.uploads.resolve({ ok: true })
    assert.equal(await pending, false)
    assert.deepEqual(fixture.writes.map(write => write.text), ['last edit before exit'])
  }
  finally { fixture.scope.stop() }
})

test('debounced saves commit once and stopping clears pending timers', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const fixture = setup()
  try {
    fixture.uploads.resolve({ ok: true })
    fixture.persistence.activate('BUG')
    fixture.persistence.schedule('BUG')
    context.mock.timers.tick(400)
    fixture.persistence.schedule('BUG')
    context.mock.timers.tick(400)
    assert.equal(fixture.settlements(), 0)
    context.mock.timers.tick(100)
    assert.equal(await fixture.persistence.flush('BUG'), true)
    assert.equal(fixture.writes.length, 1)
    fixture.persistence.schedule('BUG')
    fixture.persistence.stop('BUG')
    context.mock.timers.tick(500)
    await Promise.resolve()
    assert.equal(fixture.writes.length, 1)
  }
  finally { fixture.scope.stop() }
})
