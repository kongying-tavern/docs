import { FORM_HASH } from './form/publish-topic-form/form-config'

/** Matches @username mentions in text */
const AT_MENTION_USERNAME_REGEX = /@([a-z0-9]+)(?=\s|$)/gi

/** Matches trailing slashes in paths */
const TRAILING_SLASHES_REGEX = /\/+$/

export function transformLabelsToArray(labels: GITEE.IssueLabel[]) {
  const arr: string[] = []
  labels.map(val => arr.push(val.name))

  return arr
}

export function replaceAtMentions(text: string): string {
  if (AT_MENTION_USERNAME_REGEX.exec(text) == null)
    return text

  return text.replaceAll(AT_MENTION_USERNAME_REGEX, (_match, p1) => {
    return `<a class="vp-link" href="https://gitee.com/${encodeURIComponent(p1)}" target="${p1}">@${p1}</a>`
  })
}

export function setPageTitle(newTitle: string, prefix?: string): void {
  if (import.meta.env.SSR)
    return
  const title = document.title.split('|')
  document.title = `${prefix ? `${prefix} -` : ''} ${newTitle} | ${title[1]}`
}

interface DataNode {
  text: string
  link?: string
  items?: DataNode[]
}

interface FlattenedNode {
  text: string
  link: string
  tag: string
}

export function flattenWithTags(
  nodes: DataNode[],
  topLevelText?: string,
): FlattenedNode[] {
  const result: FlattenedNode[] = []

  nodes.forEach((node) => {
    const currentTopLevelText = topLevelText || node.text

    if (node.link) {
      result.push({
        text: node.text,
        link: node.link,
        tag: currentTopLevelText,
      })
    }
    if (node.items) {
      result.push(...flattenWithTags(node.items, currentTopLevelText))
    }
  })

  return result
}

export function getPageHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight,
  )
}

export function publishTopic() {
  const currentHash = location.hash.slice(1)
  let targetHash = FORM_HASH

  if (location.hash && ['FEAT', 'BUG', 'ANN'].includes(currentHash)) {
    targetHash = `${targetHash}-${currentHash}`
  }

  location.hash = targetHash
}

export function updateLastPathSegment(newSegment: string, replace = true) {
  if (!newSegment)
    return

  const { pathname, search, hash } = window.location
  const segments = pathname.replace(TRAILING_SLASHES_REGEX, '').split('/')

  if (segments.length === 0 || (segments.length === 1 && segments[0] === ''))
    segments[0] = newSegment
  else
    segments[segments.length - 1] = newSegment

  const newPath = `/${segments.filter(Boolean).join('/')}`
  const newUrl = `${newPath}${search}${hash}`

  const method = replace ? 'replaceState' : 'pushState'
  history[method](null, '', newUrl)
}
