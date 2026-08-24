import { mergeAttributes } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import feedbackRepoMember from '~/_data/feedbackMemberList.json'
import TeamMember from '~/_data/teamMemberList.json'

const officialMember = [...feedbackRepoMember.data, ...TeamMember.data]

/** Matches a persisted Gitee login. */
const MENTION_LOGIN_REGEX = /^[\dA-Z][\w-]{0,63}$/i

export const MentionNode = Mention.configure({
  HTMLAttributes: { class: 'mention' },
  renderHTML({ options, node }) {
    const displayName = node.attrs.label || node.attrs.id || 'Unknown'
    const char = options.suggestion?.char || '@'
    const login = MENTION_LOGIN_REGEX.test(String(displayName))
      ? String(displayName)
      : null
    return [
      login ? 'a' : 'span',
      mergeAttributes(login
        ? { href: `https://gitee.com/${encodeURIComponent(login)}`, class: 'vp-link', rel: 'noopener noreferrer', target: '_blank' }
        : { class: 'mention' }, options.HTMLAttributes),
      `${char}${displayName}`,
    ]
  },
  renderText({ options, node }) {
    const displayName = node.attrs.label || node.attrs.id || 'Unknown'
    const char = options.suggestion?.char || '@'
    return `${char}${displayName}`
  },
  suggestion: {
    char: '@',
    items: ({ query }) => {
      return officialMember
        .filter(user => user.username.toLowerCase().startsWith(query.toLowerCase()))
        .map(user => ({ label: user.login, id: user.id }))
    },
  },
})
