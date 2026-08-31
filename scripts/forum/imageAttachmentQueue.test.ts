/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { useImageAttachmentQueue } from '../../src/composables/useImageAttachmentQueue'
import { serializeUploadedAttachments, validateImageBatch } from '../../src/services/forum/form/imageAttachment'
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_POLICY } from '../../src/services/forum/forumConfig'

function file(name: string, type = 'image/png', size = 16): File {
  return new File([new Uint8Array(size)], name, { type })
}

function uploaded(fileName: string): ForumAPI.Image {
  return {
    state: true,
    message: '',
    data: {
      id: fileName,
      link: `https://assets.example/${fileName}`,
      fileSize: 16,
      originName: fileName,
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function queueOptions(upload: (selected: File) => Promise<ForumAPI.Image> = selected => Promise.resolve(uploaded(selected.name))) {
  let nextId = 0
  const revoked: string[] = []
  return {
    revoked,
    options: {
      upload,
      optimize: async (selected: File) => selected,
      prepare: async () => undefined,
      createId: () => `image-${nextId++}`,
      createPreviewUrl: (selected: File) => `blob:${selected.name}`,
      revokePreviewUrl: (url: string) => revoked.push(url),
    },
  }
}

test('uses one four-file, 6 MiB, five-format frontend policy', () => {
  assert.equal(IMAGE_UPLOAD_POLICY.MAX_COUNT, 4)
  assert.equal(IMAGE_UPLOAD_POLICY.MAX_BYTES, 6 * 1024 * 1024)
  assert.equal(IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL, '6 MiB')
  assert.deepEqual(IMAGE_UPLOAD_POLICY.MIME_TYPES, [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
  ])
  assert.equal(IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_POLICY.MIME_TYPES.join(','))

  for (const type of IMAGE_UPLOAD_POLICY.MIME_TYPES)
    assert.deepEqual(validateImageBatch([file(`${type}.image`, type)]), [])
})

test('accepts exactly four files and rejects the fifth before insertion', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue(setup.options)
  assert.equal((await queue.addFiles([file('1.png'), file('2.png'), file('3.png'), file('4.png')])).ok, true)
  assert.equal(queue.attachments.value.length, 4)

  const fifth = await queue.addFiles([file('5.png')])
  assert.equal(fifth.ok, false)
  assert.equal(fifth.ok ? '' : fifth.errors[0]?.code, 'count-exceeded')
  assert.equal(queue.attachments.value.length, 4)
  assert.equal(queue.attachments.value.some(item => item.file.name === '5.png'), false)
})

test('rejects invalid type and size before either can enter uploading', async () => {
  const queue = useImageAttachmentQueue(queueOptions().options)
  const invalid = await queue.addFiles([
    file('vector.svg', 'image/svg+xml'),
    file('large.png', 'image/png', IMAGE_UPLOAD_POLICY.MAX_BYTES + 1),
  ])

  assert.equal(invalid.ok, false)
  assert.deepEqual(invalid.ok ? [] : invalid.errors.map(error => error.code), ['invalid-type', 'size-exceeded'])
  assert.deepEqual(queue.attachments.value, [])
  assert.equal(queue.isBusy.value, false)
})

test('optional thumbhash failure still uploads the selected file immediately', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue({
    ...setup.options,
    prepare: async () => {
      throw new Error('decoder unavailable')
    },
  })

  assert.equal((await queue.addFiles([file('decode.png')])).ok, true)
  assert.deepEqual(await queue.settleUploads(), { ok: true })
  assert.equal(queue.attachments.value[0]?.status, 'uploaded')
  assert.equal(queue.attachments.value[0]?.thumbHash, undefined)
})

test('selection starts one upload before submission settlement', async () => {
  const pending = deferred<ForumAPI.Image>()
  let uploadCalls = 0
  const queue = useImageAttachmentQueue(queueOptions(() => {
    uploadCalls++
    return pending.promise
  }).options)

  await queue.addFiles([file('immediate.png')])
  await Promise.resolve()
  assert.equal(uploadCalls, 1)
  assert.equal(queue.attachments.value[0]?.status, 'uploading')
  assert.deepEqual(queue.progress.value, { total: 1, settled: 0, failed: 0, uploading: 1 })

  const settlement = queue.settleUploads()
  pending.resolve(uploaded('immediate.png'))
  assert.deepEqual(await settlement, { ok: true })
  assert.equal(uploadCalls, 1)
  assert.deepEqual(queue.progress.value, { total: 1, settled: 1, failed: 0, uploading: 0 })
})

test('settlement joins all already-running uploads and keeps selection order', async () => {
  const uploads = new Map<string, ReturnType<typeof deferred<ForumAPI.Image>>>()
  const queue = useImageAttachmentQueue(queueOptions((selected) => {
    const pending = deferred<ForumAPI.Image>()
    uploads.set(selected.name, pending)
    return pending.promise
  }).options)

  await queue.addFiles([file('first.png'), file('second.png')])
  await Promise.resolve()
  const settlement = queue.settleUploads()
  uploads.get('second.png')!.resolve(uploaded('second.png'))
  uploads.get('first.png')!.resolve(uploaded('first.png'))

  assert.deepEqual(await settlement, { ok: true })
  assert.deepEqual(queue.serializedAttachments.value.map(item => item.alt), ['first.png', 'second.png'])
})

test('explicit retry starts exactly one new request', async () => {
  let uploadCalls = 0
  const queue = useImageAttachmentQueue(queueOptions(async (selected) => {
    uploadCalls++
    if (uploadCalls === 1)
      throw new Error('offline')
    return uploaded(selected.name)
  }).options)

  await queue.addFiles([file('retry.png')])
  assert.equal((await queue.settleUploads()).ok, false)
  const id = queue.attachments.value[0]!.id
  assert.deepEqual(await queue.retry(id), { ok: true })
  assert.equal(uploadCalls, 2)
  assert.equal(queue.attachments.value[0]?.status, 'uploaded')
})

test('optimizes once and reuses the prepared file when an upload is retried', async () => {
  const original = file('large.jpg', 'image/jpeg', 32)
  const compressed = file('large.jpg', 'image/jpeg', 16)
  const uploadedFiles: File[] = []
  let optimizeCalls = 0
  const setup = queueOptions(async (selected) => {
    uploadedFiles.push(selected)
    if (uploadedFiles.length === 1)
      throw new Error('offline')
    return uploaded(selected.name)
  })
  const queue = useImageAttachmentQueue({
    ...setup.options,
    optimize: async (selected) => {
      optimizeCalls++
      assert.equal(selected, original)
      return compressed
    },
  })

  await queue.addFiles([original])
  assert.equal((await queue.settleUploads()).ok, false)
  await queue.retry(queue.attachments.value[0]!.id)

  assert.equal(optimizeCalls, 1)
  assert.deepEqual(uploadedFiles, [compressed, compressed])
})

test('remove excludes an uploaded item from serialization and revokes once', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue(setup.options)
  await queue.addFiles([file('keep.png'), file('remove.png')])
  await queue.settleUploads()

  const removedId = queue.attachments.value[1]!.id
  assert.deepEqual(serializeUploadedAttachments(queue.attachments.value).map(item => item.alt), ['keep.png', 'remove.png'])
  queue.remove(removedId)
  queue.remove(removedId)

  assert.deepEqual(queue.serializedAttachments.value.map(item => item.alt), ['keep.png'])
  assert.deepEqual(setup.revoked, ['blob:remove.png'])
})

test('serialization keeps original dimensions, not the thumbhash canvas size', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue({
    ...setup.options,
    prepare: async () => ({
      dataBase64: 'dGVzdA==',
      dataUrl: 'data:image/png;base64,dGVzdA==',
      width: 100,
      height: 50,
      originalWidth: 4000,
      originalHeight: 2000,
    }),
  })
  await queue.addFiles([file('poster.png')])
  await queue.settleUploads()

  const [serialized] = serializeUploadedAttachments(queue.attachments.value)
  assert.deepEqual(
    { width: serialized?.width, height: serialized?.height },
    { width: 4000, height: 2000 },
  )
})

test('async upload completion cannot change selection order', async () => {
  const uploads = new Map<string, ReturnType<typeof deferred<ForumAPI.Image>>>()
  const setup = queueOptions((selected) => {
    const pending = deferred<ForumAPI.Image>()
    uploads.set(selected.name, pending)
    return pending.promise
  })
  const queue = useImageAttachmentQueue(setup.options)
  await queue.addFiles([file('first.png'), file('second.png'), file('third.png')])

  const completion = queue.settleUploads()
  await Promise.resolve()
  uploads.get('third.png')!.resolve(uploaded('third.png'))
  uploads.get('first.png')!.resolve(uploaded('first.png'))
  uploads.get('second.png')!.resolve(uploaded('second.png'))
  assert.deepEqual(await completion, { ok: true })
  assert.deepEqual(queue.serializedAttachments.value.map(item => item.alt), ['first.png', 'second.png', 'third.png'])
})

test('remove during upload ignores late completion and cannot resurrect the item', async () => {
  const pending = deferred<ForumAPI.Image>()
  const setup = queueOptions(() => pending.promise)
  const queue = useImageAttachmentQueue(setup.options)
  await queue.addFiles([file('late.png')])
  const id = queue.attachments.value[0]!.id

  const completion = queue.settleUploads()
  await Promise.resolve()
  queue.remove(id)
  pending.resolve(uploaded('late.png'))

  assert.deepEqual(await completion, { ok: true })
  assert.deepEqual(queue.attachments.value, [])
  assert.deepEqual(queue.serializedAttachments.value, [])
  assert.deepEqual(setup.revoked, ['blob:late.png'])
})

test('reset revokes remaining previews and replaces the queue array', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue(setup.options)
  await queue.addFiles([file('draft.png')])
  const previous = queue.attachments.value
  queue.reset()

  assert.notEqual(queue.attachments.value, previous)
  assert.deepEqual(queue.attachments.value, [])
  assert.deepEqual(setup.revoked, ['blob:draft.png'])
})
