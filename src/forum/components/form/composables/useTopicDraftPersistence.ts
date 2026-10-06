import type { useImageAttachmentQueue } from '~/forum/composables/view/useImageAttachmentQueue'
import type { ImageAttachmentError } from '~/forum/services/form/imageAttachment'
import type { TopicFormData } from '~/forum/services/form/validation'
import { onScopeDispose, reactive } from 'vue'

type TopicType = TopicFormData['type']
type DraftQueue = Pick<ReturnType<typeof useImageAttachmentQueue>, 'attachments' | 'serializedAttachments' | 'settleUploads' | 'retry'>

interface DraftSaveState {
  enabled: boolean
  status: 'saved' | 'saving' | 'error'
  savedAt: number
  error: string
}

interface SaveRuntime {
  timer?: ReturnType<typeof setTimeout>
  active?: Promise<boolean>
  retryFailed: boolean
  resetEditor: boolean
}

/** Owns per-type save tasks and invalidates their writeback when a draft is reset. */
export function useTopicDraftPersistence(options: {
  getQueue: (type: TopicType) => DraftQueue
  persist: (attachments: NonNullable<TopicFormData['attachments']>, type: TopicType, reset: boolean) => void
  uploadError: (errors: ImageAttachmentError[]) => string
  storageError: () => string
}) {
  const states = reactive(new Map<TopicType, DraftSaveState>())
  const runtimes = new Map<TopicType, SaveRuntime>()
  let disposed = false

  function state(type: TopicType): DraftSaveState {
    if (!states.has(type))
      states.set(type, { enabled: false, status: 'saved', savedAt: 0, error: '' })
    return states.get(type)!
  }

  function runtime(type: TopicType): SaveRuntime {
    if (!runtimes.has(type))
      runtimes.set(type, { retryFailed: false, resetEditor: false })
    return runtimes.get(type)!
  }

  function activate(type: TopicType): void {
    const current = state(type)
    current.enabled = true
    current.savedAt = 0
  }

  function cancel(type: TopicType): void {
    clearTimeout(runtimes.get(type)?.timer)
    runtimes.delete(type)
    const current = states.get(type)
    if (current) {
      current.status = 'saved'
      current.error = ''
    }
  }

  function stop(type: TopicType): void {
    cancel(type)
    states.delete(type)
  }

  function flush(type: TopicType, manual = false): Promise<boolean> {
    if (disposed)
      return Promise.resolve(false)
    const task = runtime(type)
    clearTimeout(task.timer)
    task.timer = undefined
    task.retryFailed ||= manual
    task.resetEditor ||= manual
    if (task.active)
      return task.active

    const current = state(type)
    current.status = 'saving'
    current.error = ''
    const isCurrent = () => !disposed && runtimes.get(type) === task

    // Defer execution so every caller can join the task before it settles.
    task.active = Promise.resolve().then(async () => {
      try {
        if (!isCurrent())
          return false
        const queue = options.getQueue(type)
        const retryFailed = async () => {
          task.retryFailed = false
          await Promise.all(queue.attachments.value.filter(image => image.status === 'failed').map(image => queue.retry(image.id)))
        }
        if (task.retryFailed)
          await retryFailed()
        if (!isCurrent())
          return false
        let result = await queue.settleUploads()
        if (!isCurrent())
          return false
        // A manual save may join an autosave already waiting for uploads.
        if (!result.ok && task.retryFailed) {
          await retryFailed()
          if (!isCurrent())
            return false
          result = await queue.settleUploads()
          if (!isCurrent())
            return false
        }
        if (!result.ok) {
          current.error = options.uploadError(result.errors)
          current.status = 'error'
          return false
        }
        // Read the latest working draft and attachments for this type at commit time.
        options.persist(queue.serializedAttachments.value, type, task.resetEditor)
        clearTimeout(task.timer)
        task.timer = undefined
        current.enabled ||= task.resetEditor
        current.status = 'saved'
        current.savedAt = Date.now()
        return true
      }
      catch {
        if (isCurrent()) {
          current.error = options.storageError()
          current.status = 'error'
        }
        return false
      }
      finally {
        task.active = undefined
        task.retryFailed = false
        task.resetEditor = false
      }
    })
    return task.active
  }

  function schedule(type: TopicType): void {
    if (disposed || !state(type).enabled)
      return
    const task = runtime(type)
    if (task.active)
      return
    clearTimeout(task.timer)
    state(type).status = 'saving'
    task.timer = setTimeout(() => void flush(type), 500)
  }

  /** Page exit cannot await uploads; retain the latest text and uploaded attachments. */
  function saveSnapshot(type: TopicType): void {
    if (disposed)
      return
    cancel(type)
    const current = state(type)
    try {
      options.persist(options.getQueue(type).serializedAttachments.value, type, false)
      current.savedAt = Date.now()
    }
    catch {
      current.error = options.storageError()
      current.status = 'error'
    }
  }

  onScopeDispose(() => {
    disposed = true
    for (const task of runtimes.values())
      clearTimeout(task.timer)
    runtimes.clear()
  })

  return { states, activate, cancel, stop, flush: (type: TopicType) => flush(type), save: (type: TopicType) => flush(type, true), schedule, saveSnapshot }
}
