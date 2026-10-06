import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '../api/types'

/** Keep the first (highest-priority) identity; never shuffle mention suggestions. */
export function collectMentionUsers(...groups: readonly (readonly ForumAPI.User[])[]): ForumAPI.User[] {
  const logins = new Set<string>()
  const ids = new Set<string>()
  return groups.flat().filter((user) => {
    if (typeof user?.login !== 'string' || !user.login || user.id == null || typeof user.username !== 'string' || !user.username)
      return false
    const login = user.login.toLocaleLowerCase()
    const id = String(user.id)
    if (logins.has(login) || ids.has(id))
      return false
    logins.add(login)
    ids.add(id)
    return true
  })
}

/** Only the untouched automatic mention is managed; user-authored mentions survive. */
export function setCommentReply(doc: JSONContent, previous: ForumAPI.User | undefined, target: ForumAPI.User | undefined): JSONContent {
  let hasTarget = false
  function visit(node: JSONContent): JSONContent | undefined {
    if (node.type === 'mention') {
      if (node.attrs?.replyTarget && previous && node.attrs.label === previous.login && String(node.attrs.id) === String(previous.id))
        return undefined
      if (target && String(node.attrs?.label).toLocaleLowerCase() === target.login.toLocaleLowerCase())
        hasTarget = true
    }
    if (!node.content)
      return { ...node }
    const content: JSONContent[] = []
    let removeSeparator = false
    for (const child of node.content) {
      const result = visit(child)
      if (!result) {
        removeSeparator = true
        continue
      }
      if (removeSeparator && result.type === 'text' && result.text?.startsWith(' ')) {
        result.text = result.text.slice(1)
        if (result.text)
          content.push(result)
      }
      else {
        content.push(result)
      }
      removeSeparator = false
    }
    return { ...node, content }
  }
  const result = visit(doc)!
  if (!target || hasTarget)
    return result
  const blocks = [...(result.content ?? [])]
  if (blocks[0]?.type !== 'paragraph')
    blocks.unshift({ type: 'paragraph' })
  blocks[0] = {
    ...blocks[0],
    content: [
      { type: 'mention', attrs: { id: target.id, label: target.login, replyTarget: true } },
      { type: 'text', text: ' ' },
      ...(blocks[0]?.content ?? []),
    ],
  }
  return { ...result, content: blocks }
}
