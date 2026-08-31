import type { ForumRoute } from '~/services/forum/forumRoute'
import { nextTick } from 'vue'
import { enableTransitions } from '../shared'

type SharedRoute = Extract<ForumRoute, { name: 'topic' } | { name: 'user' }>

export function resolveForumSharedRoute(current: ForumRoute, target: ForumRoute): SharedRoute | null {
  if (target.name === 'user')
    return target
  if (target.name === 'topic')
    return target
  if (current.name === 'topic' || current.name === 'user')
    return current
  return null
}

export async function transitionForumRoute(
  current: ForumRoute | null,
  target: ForumRoute,
  update: () => void,
): Promise<void> {
  if (!current || !enableTransitions()) {
    update()
    return
  }

  const sharedRoute = resolveForumSharedRoute(current, target)
  const isBack = Object.hasOwn(window.history.state ?? {}, 'scrollPosition')
  const sharedElements = sharedRoute ? findSharedElements(sharedRoute, current) : []
  const newElements: HTMLElement[] = []
  for (const { element, name } of sharedElements)
    element.style.setProperty('view-transition-name', name)
  document.documentElement.dataset.forumTransition = isBack ? 'back' : 'forward'

  const transition = document.startViewTransition(async () => {
    update()
    await nextTick()

    window.scrollTo(0, isBack ? Number(window.history.state?.scrollPosition ?? 0) : 0)
    if (sharedRoute && sharedElements.length) {
      for (const { element, name } of findSharedElements(sharedRoute, target)) {
        if (!sharedElements.some(source => source.name === name))
          continue
        element.style.setProperty('view-transition-name', name)
        newElements.push(element)
      }
    }
  })

  await transition.updateCallbackDone
  void transition.finished.finally(() => {
    for (const { element } of sharedElements)
      element.style.removeProperty('view-transition-name')
    for (const element of newElements)
      element.style.removeProperty('view-transition-name')
    delete document.documentElement.dataset.forumTransition
  })
}

function findSharedElements(shared: SharedRoute, page: ForumRoute): { element: HTMLElement, name: string }[] {
  if (shared.name === 'user') {
    const root = findUserRoot(shared.username, page)
    if (!root)
      return []
    return [
      { element: root.querySelector<HTMLElement>('.avatar-image'), name: 'forum-user-avatar' },
      { element: root.matches('[data-forum-user-name]') ? root : root.querySelector<HTMLElement>('[data-forum-user-name]'), name: 'forum-user-name' },
    ].filter((item): item is { element: HTMLElement, name: string } => Boolean(item.element))
  }

  const root = findTopicRoot(shared.topicId, page)
  if (!root)
    return []
  return ['author', 'login', 'type', 'title', 'content', 'image'].flatMap((role) => {
    const element = root.querySelector<HTMLElement>(`[data-forum-shared-topic="${role}"]`)
    return element ? [{ element, name: `forum-topic-${role}` }] : []
  })
}

function findTopicRoot(topicId: string, page: ForumRoute): HTMLElement | null {
  const isRoute = page.name === 'topic' && topicId === page.topicId
  return document.querySelector<HTMLElement>(`[${isRoute ? 'data-forum-route-topic' : 'data-forum-topic'}="${CSS.escape(topicId)}"]`)
}

function findUserRoot(username: string, page: ForumRoute): HTMLElement | null {
  if (page.name === 'user' && username === page.username)
    return document.querySelector<HTMLElement>(`[data-forum-user-profile="${CSS.escape(username)}"]`)

  const focused = document.activeElement?.closest<HTMLElement>(`[data-forum-user="${CSS.escape(username)}"]`)
  if (focused)
    return focused
  return [...document.querySelectorAll<HTMLElement>(`[data-forum-user="${CSS.escape(username)}"]`)]
    .find(element => element.getBoundingClientRect().bottom > 0 && element.getBoundingClientRect().top < window.innerHeight)
    ?? null
}
