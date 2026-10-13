export type ForumImagePriority = 0 | 1 | 2

interface ImageJob {
  priority?: ForumImagePriority
  distance: number
  running: boolean
  start: () => void
  cancel: () => void
}

/** Bound requests and decoding together; yield speculative work to visible images. */
export function createForumImageScheduler(concurrency = 4) {
  const jobs = new Set<ImageJob>()
  let scheduled = false
  function schedule() {
    if (scheduled)
      return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      const classified = [...jobs].filter(job => job.priority !== undefined)
      const priority = Math.min(...classified.map(job => job.priority!))
      // Wait for new targets' initial observer results before admitting speculation.
      if (priority > 0 && classified.length !== jobs.size)
        return
      if (priority < 2) {
        for (const job of classified) {
          if (job.running && job.priority! > priority) {
            job.running = false
            job.cancel()
          }
        }
      }
      let slots = concurrency - classified.filter(job => job.running).length
      for (const job of classified.sort((a, b) => a.distance - b.distance)) {
        if (slots <= 0)
          break
        if (!job.running && job.priority === priority) {
          job.running = true
          slots--
          job.start()
        }
      }
    })
  }
  return {
    register(start: () => void, cancel: () => void) {
      const job: ImageJob = { distance: 0, running: false, start, cancel }
      jobs.add(job)
      return {
        update(priority: ForumImagePriority, distance: number) {
          job.priority = priority
          job.distance = distance
          schedule()
        },
        complete() {
          job.running = false
          jobs.delete(job)
          schedule()
        },
        remove() {
          jobs.delete(job)
          if (job.running)
            cancel()
          schedule()
        },
      }
    },
  }
}
