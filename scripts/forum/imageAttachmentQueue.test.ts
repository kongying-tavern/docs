/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_POLICY } from '../../src/components/forum/constants'
import {
  serializeUploadedAttachments,
  useImageAttachmentQueue,
  validateImageBatch,
} from '../../src/composables/useImageAttachmentQueue'

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
      prepare: async () => undefined,
      createId: () => `image-${nextId++}`,
      createPreviewUrl: (selected: File) => `blob:${selected.name}`,
      revokePreviewUrl: (url: string) => revoked.push(url),
    },
  }
}

test('uses one three-file, 6 MiB, five-format frontend policy', () => {
  assert.equal(IMAGE_UPLOAD_POLICY.MAX_COUNT, 3)
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

test('accepts exactly three files and rejects the fourth before insertion', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue(setup.options)
  assert.equal((await queue.addFiles([file('1.png'), file('2.png'), file('3.png')])).ok, true)
  assert.equal(queue.attachments.value.length, 3)

  const fourth = await queue.addFiles([file('4.png')])
  assert.equal(fourth.ok, false)
  assert.equal(fourth.ok ? '' : fourth.errors[0]?.code, 'count-exceeded')
  assert.equal(queue.attachments.value.length, 3)
  assert.equal(queue.attachments.value.some(item => item.file.name === '4.png'), false)
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

test('optional thumbhash failure leaves the selected file queued', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue({
    ...setup.options,
    prepare: async () => {
      throw new Error('decoder unavailable')
    },
  })

  assert.equal((await queue.addFiles([file('decode.png')])).ok, true)
  assert.equal(queue.attachments.value[0]?.status, 'queued')
  assert.equal(queue.attachments.value[0]?.thumbHash, undefined)
})

test('remove excludes an uploaded item from serialization and revokes once', async () => {
  const setup = queueOptions()
  const queue = useImageAttachmentQueue(setup.options)
  await queue.addFiles([file('keep.png'), file('remove.png')])
  await queue.uploadPending()

  const removedId = queue.attachments.value[1]!.id
  assert.deepEqual(serializeUploadedAttachments(queue.attachments.value).map(item => item.alt), ['keep.png', 'remove.png'])
  queue.remove(removedId)
  queue.remove(removedId)

  assert.deepEqual(queue.serializedAttachments.value.map(item => item.alt), ['keep.png'])
  assert.deepEqual(setup.revoked, ['blob:remove.png'])
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

  const completion = queue.uploadPending()
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

  const completion = queue.uploadPending()
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
