interface Subscriber {
  datetime: () => number
  update: (now: number) => void
  due: number
}

const subscribers = new Set<Subscriber>()
let timeout: ReturnType<typeof setTimeout> | undefined

function schedule(): void {
  clearTimeout(timeout)
  timeout = undefined
  if (!subscribers.size || document.hidden)
    return
  const due = Math.min(...[...subscribers].map(subscriber => subscriber.due))
  timeout = setTimeout(tick, Math.max(0, due - Date.now()))
}

function tick(): void {
  const now = Date.now()
  for (const subscriber of subscribers) {
    if (subscriber.due <= now) {
      subscriber.update(now)
      subscriber.due = now + (Math.abs(now - subscriber.datetime()) < 60_000 ? 1000 : 60_000)
    }
  }
  schedule()
}

function visibilityChanged(): void {
  if (!document.hidden) {
    for (const subscriber of subscribers)
      subscriber.due = 0
    tick()
  }
  else {
    schedule()
  }
}

/** One client clock; callers unsubscribe while unmounted or deactivated. */
export function subscribeRelativeTime(datetime: () => number, update: (now: number) => void): () => void {
  const subscriber: Subscriber = { datetime, update, due: 0 }
  if (!subscribers.size)
    document.addEventListener('visibilitychange', visibilityChanged)
  subscribers.add(subscriber)
  tick()
  return () => {
    subscribers.delete(subscriber)
    if (!subscribers.size)
      document.removeEventListener('visibilitychange', visibilityChanged)
    schedule()
  }
}
