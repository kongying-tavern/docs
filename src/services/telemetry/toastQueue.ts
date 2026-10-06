type ToastId = string | number

/** Only mounted notifications start Sonner's lifetime; waiting entries have no timer. */
export function createToastQueue() {
  let active: ToastId | undefined
  const waiting = new Map<ToastId, () => void>()

  function next() {
    if (active !== undefined)
      return
    const entry = waiting.entries().next().value
    if (!entry)
      return
    waiting.delete(entry[0])
    active = entry[0]
    entry[1]()
  }

  return {
    enqueue(id: ToastId, show: () => void) {
      if (active === id) {
        show()
        return
      }
      waiting.set(id, show)
      next()
    },
    finish(id: ToastId) {
      waiting.delete(id)
      if (active === id) {
        active = undefined
        next()
      }
    },
    clear() {
      active = undefined
      waiting.clear()
    },
    flush() {
      const entries = [...waiting.values()]
      active = undefined
      waiting.clear()
      entries.forEach(show => show())
    },
  }
}
