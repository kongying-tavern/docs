import type ForumAPI from '~/forum/api/types'

export interface CachedImageUploadOptions {
  signal?: AbortSignal
  originalFile?: File
}

interface PendingUpload {
  controller: AbortController
  promise: Promise<ForumAPI.Image>
  consumers: number
  settled: boolean
}

export function createImageUploadCache(
  upload: (file: File, options: { signal?: AbortSignal }) => Promise<ForumAPI.Image>,
) {
  // Page-session cache: retain metadata only, never selected files or bytes.
  const completed = new Map<string, ForumAPI.Image>()
  const pending = new Map<string, PendingUpload>()

  function join(key: string, task: PendingUpload, signal?: AbortSignal): Promise<ForumAPI.Image> {
    return new Promise((resolve, reject) => {
      task.consumers++
      let released = false
      const release = () => {
        if (released)
          return
        released = true
        signal?.removeEventListener('abort', abort)
        task.consumers--
        if (!task.consumers && !task.settled) {
          if (pending.get(key) === task)
            pending.delete(key)
          task.controller.abort()
        }
      }
      function abort() {
        release()
        reject(signal?.reason ?? new DOMException('Image upload cancelled.', 'AbortError'))
      }
      signal?.addEventListener('abort', abort, { once: true })
      if (signal?.aborted) {
        abort()
        return
      }
      task.promise.then((result) => {
        if (!released) {
          release()
          resolve(result)
        }
      }, (error) => {
        if (!released) {
          release()
          reject(error)
        }
      })
    })
  }

  return async (file: File, options: CachedImageUploadOptions = {}): Promise<ForumAPI.Image> => {
    options.signal?.throwIfAborted()
    const original = options.originalFile ?? file
    // An unavailable digest must not prevent an otherwise supported upload.
    if (!globalThis.crypto?.subtle)
      return upload(file, options)
    const digest = await crypto.subtle.digest('SHA-256', await original.arrayBuffer())
    options.signal?.throwIfAborted()
    const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const cached = completed.get(key)
    if (cached)
      return { ...cached, data: cached.data ? { ...cached.data } : undefined }

    let task = pending.get(key)
    if (!task) {
      const controller = new AbortController()
      const created: PendingUpload = {
        controller,
        consumers: 0,
        settled: false,
        promise: Promise.resolve().then(() => upload(file, { signal: controller.signal })),
      }
      created.promise = created.promise.then((result) => {
        // A late response to a cancelled request must not populate the cache.
        if (!controller.signal.aborted && result.state && result.data?.link)
          completed.set(key, { ...result, data: { ...result.data } })
        return result
      }).finally(() => {
        created.settled = true
        if (pending.get(key) === created)
          pending.delete(key)
      })
      pending.set(key, created)
      task = created
    }
    return join(key, task, options.signal)
  }
}
