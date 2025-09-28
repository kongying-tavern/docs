import { mergeAttributes } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import feedbackRepoMember from '~/_data/feedbackMemberList.json'
import TeamMember from '~/_data/teamMemberList.json'

const officialMember = [...feedbackRepoMember.data, ...TeamMember.data]

export const MentionNode = Mention.configure({
  HTMLAttributes: { class: 'mention' },
  renderHTML({ options, node }) {
    const displayName = node.attrs.label || node.attrs.id || 'Unknown'
    const char = options.suggestion?.char || '@'
    return [
      'a',
      mergeAttributes({ href: node.attrs.homepage, class: 'vp-link' }, options.HTMLAttributes),
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
        .map(user => ({ label: user.login, id: user.id, homepage: user.homepage }))
    },
  },
})
