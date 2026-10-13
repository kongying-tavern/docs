import type { InjectionKey } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { inject, provide, shallowReactive, watch } from 'vue'

interface SummarySnapshot {
  raw: string
  override?: string
  locale: string
  html: string
}
interface TopicPresentation {
  expanded: Map<string, boolean>
  getSummary: (id: string) => SummarySnapshot | undefined
  rememberSummary: (id: string, snapshot: SummarySnapshot) => void
}
const presentationKey: InjectionKey<TopicPresentation> = Symbol('forum-topic-presentation')

/** List-owned plain data survives window remounts without retaining component instances. */
export function provideForumTopicPresentation(topics: () => ForumAPI.Topic[]): void {
  // Cache recent rendered summaries, rather than another full copy of every
  // body in a very long list. Expansion flags are small, identity-owned state.
  const summaries = new Map<string, SummarySnapshot>()
  const state: TopicPresentation = {
    expanded: shallowReactive(new Map()),
    getSummary(id) {
      const snapshot = summaries.get(id)
      if (snapshot) {
        summaries.delete(id)
        summaries.set(id, snapshot)
      }
      return snapshot
    },
    rememberSummary(id, snapshot) {
      summaries.delete(id)
      summaries.set(id, snapshot)
      if (summaries.size > 128)
        summaries.delete(summaries.keys().next().value!)
    },
  }
  provide(presentationKey, state)
  watch(() => topics().map(topic => [topic.id, topic.contentRaw] as const), (rows, previous) => {
    const current = new Map(rows)
    const old = new Map(previous)
    for (const id of new Set([...state.expanded.keys(), ...summaries.keys()])) {
      if (!current.has(id) || current.get(id) !== old.get(id)) {
        state.expanded.delete(id)
        summaries.delete(id)
      }
    }
  })
}

export function useForumTopicPresentation() {
  return inject(presentationKey, undefined)
}
