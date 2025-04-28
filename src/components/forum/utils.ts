import type { UploadedUserFile } from '~/composables/useImageUpload'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { FORM_HASH } from './publish-topic-form/config'

export function transformLabelsToArray(labels: GITEE.IssueLabel[]) {
  const arr: string[] = []
  labels.map(val => arr.push(val.name))

  return arr
}

export function replaceAtMentions(text: string): string {
  const regex = /@([a-z0-9]+)(?=\s|$)/gi

  if (regex.exec(text) == null)
    return text

  return text.replaceAll(regex, (match, p1) => {
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

export function getRandomElements<T>(arr: T[], count: number): T[] {
  if (count >= arr.length) {
    return [...arr]
  }

  const copyArr = [...arr]
  const result: T[] = []

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * copyArr.length)
    result.push(copyArr[randomIndex])
    copyArr.splice(randomIndex, 1)
  }

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

export function convertMultipleToMarkdown(uploadedImages: UploadedUserFile[]) {
  return `\n${uploadedImages
    .map(({ url, thumbHash, alt }) => {
      return `![${alt}](${url})${thumbHash ? `{thumbhash:"${thumbHash.dataBase64}",width:"${thumbHash.width}",height:"${thumbHash.height}"}` : ''}`
    })
    .join('\n')}`
}

export function extractPlainText(input: string): string {
  if (!input)
    return ''

  // Step 1: Remove HTML tags but preserve line breaks (e.g., <br>, <p>, <div>)
  const htmlToNewline = input
    .replace(/<\s*(br|p|div|li|tr)[^>]*>/gi, '\n') // Replace specific tags with newline
    .replace(/<[^>]+>/g, '') // Remove other HTML tags
    .replace(/\n{2,}/g, '\n') // Normalize multiple newlines

  // Step 2: Decode HTML entities (e.g., &amp;, &lt;, &gt;)
  const htmlEntityDecode = htmlToNewline.replace(
    /&(#\d+|#x[\da-f]+|[a-z]+);/gi,
    (entity) => {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = entity
      return textarea.value
    },
  )

  // Step 3: Remove Markdown syntax while preserving line breaks
  const markdownToPlainText = htmlEntityDecode
    .replace(/([*_]{1,3}|~{2}|`{1,3}|#+|!\[|[\][()>])/g, '') // Remove Markdown special characters
    .replace(/\s*[-+*] /g, '') // Remove list markers
    .replace(/\n{2,}/g, '\n') // Normalize multiple newlines

  // Step 4: Sanitize to remove markdown plugin syntax
  const plaintextSanitized = sanitizeMarkdown(markdownToPlainText)

  return plaintextSanitized.trim()
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
  const segments = pathname.replace(/\/+$/, '').split('/')

  if (segments.length === 0 || (segments.length === 1 && segments[0] === ''))
    segments[0] = newSegment
  else
    segments[segments.length - 1] = newSegment

  const newPath = `/${segments.filter(Boolean).join('/')}`
  const newUrl = `${newPath}${search}${hash}`

  const method = replace ? 'replaceState' : 'pushState'
  history[method](null, '', newUrl)
}
