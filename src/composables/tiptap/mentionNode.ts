import { mergeAttributes } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import feedbackRepoMember from '~/_data/feedbackMemberList.json'
import TeamMember from '~/_data/teamMemberList.json'

const officialMember = [...feedbackRepoMember, ...TeamMember]

export const MentionNode = Mention.configure({
  HTMLAttributes: { class: 'mention' },
  renderHTML({ options, node }) {
    return [
      'a',
      mergeAttributes({ href: node.attrs.homepage, class: 'vp-link' }, options.HTMLAttributes),
      `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
    ]
  },
  renderText({ options, node }) {
    return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
  },
  suggestion: {
    items: ({ query }) => {
      return officialMember
        .filter(user => user.username.toLowerCase().startsWith(query.toLowerCase()))
        .map(user => ({ label: user.login, id: user.id, homepage: user.homepage }))
    },
  },
})
