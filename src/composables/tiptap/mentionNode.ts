import type { SuggestionOptions } from '@tiptap/suggestion'
import type { ForumEditorSuggestionItem } from './forumSuggestionRenderer'
import { mergeAttributes } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import { PluginKey } from '@tiptap/pm/state'
import feedbackRepoMember from '~/_data/feedbackMemberList.json'
import TeamMember from '~/_data/teamMemberList.json'
import { getForumMentionHref } from '~/services/forum/forumLinkPolicy'

const officialMember = [...new Map(
  [...feedbackRepoMember.data, ...TeamMember.data]
    .map(member => [member.login.toLocaleLowerCase(), member]),
).values()]
const mentionPluginKey = new PluginKey('forumMention')

export function createMentionNode(render?: SuggestionOptions<ForumEditorSuggestionItem>['render']) {
  return Mention.configure({
    HTMLAttributes: { class: 'mention' },
    renderHTML({ options, node }) {
      const displayName = node.attrs.label || node.attrs.id || 'Unknown'
      const char = options.suggestion?.char || '@'
      const href = getForumMentionHref(String(displayName))
      return [
        href ? 'a' : 'span',
        mergeAttributes(href
          ? { href, class: 'vp-link', rel: 'noopener noreferrer', target: '_blank' }
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
      pluginKey: mentionPluginKey,
      items: ({ query }) => {
        const normalized = query.toLocaleLowerCase()
        return officialMember
          .filter(user => user.username.toLocaleLowerCase().includes(normalized)
            || user.login.toLocaleLowerCase().includes(normalized))
          .slice(0, 6)
          .map(user => ({
            kind: 'user' as const,
            id: user.id,
            label: user.login,
            description: user.username,
            avatar: user.avatar,
          }))
      },
      ...(render ? { render } : {}),
    },
  })
}

export const MentionNode = createMentionNode()
