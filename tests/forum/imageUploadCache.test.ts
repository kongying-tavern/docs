import type ForumAPI from '../../src/forum/api/types'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createImageUploadCache } from '../../src/apis/interknot.site/imageUploadCache'

function image(name: string, bytes = 'same image', type = 'image/png') {
  return new File([bytes], name, { type })
}

function response(id = 'uploaded'): ForumAPI.Image {
  return { state: true, message: '', data: { id, link: `https://assets.example/${id}`, fileSize: 10, originName: id } }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

test('identical bytes with different filenames join one pending upload and reuse its success later', async () => {
  const pending = deferred<ForumAPI.Image>()
  const started = deferred<void>()
  let calls = 0
  const upload = createImageUploadCache(async () => {
    calls++
    started.resolve()
    return pending.promise
  })
  const first = upload(image('first.png'))
  const second = upload(image('renamed.png'))
  await started.promise
  pending.resolve(response())
  assert.deepEqual(await Promise.all([first, second]), [response(), response()])
  assert.deepEqual(await upload(image('selected-again.png')), response())
  assert.equal(calls, 1)
})

test('same filename and size with different bytes is not a duplicate', async () => {
  let calls = 0
  const upload = createImageUploadCache(async () => response(String(++calls)))
  const first = await upload(image('same.png', 'one'))
  const second = await upload(image('same.png', 'two'))
  assert.notEqual(first.data?.link, second.data?.link)
  assert.equal(calls, 2)
})

test('identity uses original bytes before lossy compression regardless of file metadata', async () => {
  let calls = 0
  const upload = createImageUploadCache(async () => response(String(++calls)))
  const compressed = image('compressed.png', 'same compressed output')
  const first = await upload(compressed, { originalFile: image('source.png', 'original one') })
  const second = await upload(compressed, { originalFile: image('source.png', 'original two') })
  const reused = await upload(image('another-output.png'), { originalFile: image('renamed.png', 'original one') })
  const otherType = await upload(image('source.webp', 'original one', 'image/webp'))
  assert.notEqual(first.data?.link, second.data?.link)
  assert.equal(reused.data?.link, first.data?.link)
  assert.equal(otherType.data?.link, first.data?.link)
  assert.equal(calls, 2)
})

test('network and business failures are not cached and explicit retries remain possible', async () => {
  let calls = 0
  const upload = createImageUploadCache(async () => {
    calls++
    if (calls === 1)
      throw new Error('offline')
    if (calls === 2)
      return { state: false, message: 'rejected' }
    return response()
  })
  await assert.rejects(upload(image('test.png')), /offline/)
  assert.equal((await upload(image('test.png'))).state, false)
  assert.deepEqual(await upload(image('test.png')), response())
  assert.equal(calls, 3)
})

test('cancelling one duplicate does not abort the request still needed by another attachment', async () => {
  const pending = deferred<ForumAPI.Image>()
  const firstStarted = deferred<void>()
  let sharedSignal: AbortSignal | undefined
  let calls = 0
  const upload = createImageUploadCache(async (_file, { signal }) => {
    calls++
    sharedSignal = signal
    firstStarted.resolve()
    return pending.promise
  })
  const firstController = new AbortController()
  const secondController = new AbortController()
  const first = upload(image('one.png'), { signal: firstController.signal })
  const rejected = assert.rejects(first, { name: 'AbortError' })
  await firstStarted.promise
  const second = upload(image('two.png'), { signal: secondController.signal })
  // Wait for the second digest/join without releasing the shared transport.
  const original = secondController.signal.addEventListener.bind(secondController.signal)
  const joined = deferred<void>()
  secondController.signal.addEventListener = (...args: Parameters<AbortSignal['addEventListener']>) => {
    original(...args)
    joined.resolve()
  }
  await joined.promise
  firstController.abort()
  await rejected
  assert.equal(sharedSignal?.aborted, false)
  pending.resolve(response())
  assert.deepEqual(await second, response())
  assert.equal(calls, 1)
})

test('cancelling all consumers aborts the shared request; a late response cannot overwrite its replacement', async () => {
  const firstPending = deferred<ForumAPI.Image>()
  const secondPending = deferred<ForumAPI.Image>()
  const started = deferred<void>()
  const signals: AbortSignal[] = []
  const upload = createImageUploadCache(async (_file, { signal }) => {
    signals.push(signal!)
    started.resolve()
    return signals.length === 1 ? firstPending.promise : secondPending.promise
  })
  const controller = new AbortController()
  const cancelled = upload(image('cancel.png'), { signal: controller.signal })
  const rejected = assert.rejects(cancelled, { name: 'AbortError' })
  await started.promise
  controller.abort()
  await rejected
  assert.equal(signals[0].aborted, true)
  const replacement = upload(image('retry.png'))
  firstPending.resolve(response('cancelled-response'))
  secondPending.resolve(response('replacement'))
  assert.equal((await replacement).data?.id, 'replacement')
  assert.equal((await upload(image('again.png'))).data?.id, 'replacement')
  assert.equal(signals.length, 2)
})

test('an already cancelled selection sends no upload request, even when a cached result exists', async () => {
  let calls = 0
  const upload = createImageUploadCache(async () => {
    calls++
    return response()
  })
  await upload(image('cached.png'))
  await assert.rejects(upload(image('cancelled.png'), { signal: AbortSignal.abort() }), { name: 'AbortError' })
  assert.equal(calls, 1)
})

test('changing returned cached metadata does not affect a later reused result', async () => {
  const upload = createImageUploadCache(async () => response())
  await upload(image('initial.png'))
  const reused = await upload(image('second.png'))
  reused.data!.link = 'changed'
  assert.equal((await upload(image('third.png'))).data?.link, response().data?.link)
})
