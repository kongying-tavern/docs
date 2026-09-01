import type { ForumRoute } from '~/services/forum/forumRoute'
import { nextTick } from 'vue'
import { enableTransitions } from '../shared'

type SharedRoute = Extract<ForumRoute, { name: 'topic' } | { name: 'user' }>

const BLOG_POST_PATH_REGEX = /\/blog\/posts\/([^/?#]+)/
const FORUM_PATH_REGEX = /(?:^|\/)feedback(?:\/|$)/

export function resolveForumSharedRoute(current: ForumRoute, target: ForumRoute): SharedRoute | null {
  if (target.name === 'user')
    return target
  if (target.name === 'topic')
    return target
  if (current.name === 'topic' || current.name === 'user')
    return current
  return null
}

export function resolveForumScroll(state: unknown): { isBack: boolean, top: number } {
  if (!state || typeof state !== 'object' || !Object.hasOwn(state, 'scrollPosition'))
    return { isBack: false, top: 0 }

  const top = Number((state as { scrollPosition?: unknown }).scrollPosition)
  return { isBack: true, top: Number.isFinite(top) ? Math.max(0, top) : 0 }
}

export async function transitionForumRoute(
  current: ForumRoute | null,
  target: ForumRoute,
  update: () => void,
): Promise<void> {
  const scroll = resolveForumScroll(window.history.state)
  const staysOnUser = current?.name === 'user'
    && target.name === 'user'
    && current.username === target.username
  if (!current || staysOnUser || !enableTransitions()) {
    update()
    await nextTick()
    await nextTick()
    window.scrollTo(0, scroll.top)
    return
  }

  if (target.name === 'topic')
    await import('~/components/forum/topic/ForumTopicPage.vue')

  const sharedRoute = resolveForumSharedRoute(current, target)
  const sharedElements = sharedRoute ? findSharedElements(sharedRoute, current) : []
  const newElements: HTMLElement[] = []
  for (const { element, name } of sharedElements)
    element.style.setProperty('view-transition-name', name)
  document.documentElement.dataset.forumTransition = scroll.isBack ? 'back' : 'forward'

  const transition = document.startViewTransition(async () => {
    update()
    await nextTick()
    await nextTick()

    for (const { element } of sharedElements)
      element.style.removeProperty('view-transition-name')

    window.scrollTo(0, scroll.top)
    if (sharedRoute && sharedElements.length) {
      for (const { element, name } of findSharedElements(sharedRoute, target)) {
        if (!sharedElements.some(source => source.name === name))
          continue
        element.style.setProperty('view-transition-name', name)
        newElements.push(element)
      }
    }
  })

  const cleanup = () => {
    for (const { element } of sharedElements)
      element.style.removeProperty('view-transition-name')
    for (const element of newElements)
      element.style.removeProperty('view-transition-name')
    delete document.documentElement.dataset.forumTransition
  }
  void transition.finished.then(cleanup, cleanup)
  await transition.updateCallbackDone
}

export async function transitionForumBlog(
  currentPath: string,
  targetPath: string,
  update: () => void | Promise<void>,
): Promise<void> {
  const scroll = resolveForumScroll(window.history.state)
  const currentSlug = blogPostSlug(currentPath)
  const targetSlug = blogPostSlug(targetPath)
  const slug = targetSlug ?? currentSlug
  if (
    !slug
    || !((currentSlug && isForumPath(targetPath)) || (targetSlug && isForumPath(currentPath)))
    || !enableTransitions()
  ) {
    await update()
    await nextTick()
    window.scrollTo(0, scroll.top)
    return
  }

  const source = findBlogElements(slug, Boolean(currentSlug))
  const targetElements: HTMLElement[] = []
  for (const { element, name } of source)
    element.style.setProperty('view-transition-name', name)
  document.documentElement.dataset.forumTransition = targetSlug ? 'forward' : 'back'

  const transition = document.startViewTransition(async () => {
    await update()
    await nextTick()
    window.scrollTo(0, scroll.top)
    for (const { element, name } of findBlogElements(slug, Boolean(targetSlug))) {
      if (!source.some(item => item.name === name))
        continue
      element.style.setProperty('view-transition-name', name)
      targetElements.push(element)
    }
  })

  const cleanup = () => {
    for (const { element } of source)
      element.style.removeProperty('view-transition-name')
    for (const element of targetElements)
      element.style.removeProperty('view-transition-name')
    delete document.documentElement.dataset.forumTransition
  }
  void transition.finished.then(cleanup, cleanup)
  await transition.updateCallbackDone
}

export function isForumToBlogNavigation(currentPath: string, targetPath: string): boolean {
  return isForumPath(currentPath) && Boolean(blogPostSlug(targetPath))
}

function findSharedElements(shared: SharedRoute, page: ForumRoute): { element: HTMLElement, name: string }[] {
  if (shared.name === 'user') {
    const root = findUserRoot(shared.username, page)
    if (!root)
      return []
    return [
      { element: findUserElement(shared.username, root, '.avatar-image, [data-forum-user-avatar], img'), name: 'forum-user-avatar' },
      { element: findUserElement(shared.username, root, '[data-forum-user-name]'), name: 'forum-user-name' },
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

function findUserElement(username: string, root: HTMLElement, selector: string): HTMLElement | null {
  const roots = [root, ...document.querySelectorAll<HTMLElement>(`[data-forum-user="${CSS.escape(username)}"]`)]
  for (const candidate of roots) {
    const element = candidate.matches(selector) ? candidate : candidate.querySelector<HTMLElement>(selector)
    if (element && element.getBoundingClientRect().bottom > 0 && element.getBoundingClientRect().top < window.innerHeight)
      return element
  }
  return null
}

function blogPostSlug(path: string): string | null {
  return path.match(BLOG_POST_PATH_REGEX)?.[1] ?? null
}

function isForumPath(path: string): boolean {
  return FORUM_PATH_REGEX.test(new URL(path, 'https://example.com').pathname)
}

function findBlogElements(slug: string, isPost: boolean): { element: HTMLElement, name: string }[] {
  const root = document.querySelector<HTMLElement>(
    `[${isPost ? 'data-forum-blog-post' : 'data-forum-blog'}="${CSS.escape(slug)}"]`,
  )
  if (!root)
    return []
  return ['cover', 'title'].flatMap((role) => {
    const element = root.querySelector<HTMLElement>(`[data-forum-shared-blog="${role}"]`)
    return element ? [{ element, name: `forum-blog-${role}` }] : []
  })
}
