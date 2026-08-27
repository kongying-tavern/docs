import type { SuggestionOptions } from '@tiptap/suggestion'
import type { ForumEditorSuggestionItem } from './forumSuggestionRenderer'
import type ForumAPI from '@/apis/forum/api'
import { mergeAttributes } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import { PluginKey } from '@tiptap/pm/state'
import { getForumSearchSuggestions } from '~/services/forum/forumSearchSuggestions'

const topicReferencePluginKey = new PluginKey('forumTopicReference')

export function createTopicReferenceNode(
  getTopics: () => readonly ForumAPI.Topic[],
  render?: SuggestionOptions<ForumEditorSuggestionItem>['render'],
) {
  return Mention.extend({
    name: 'topicReference',
    renderMarkdown: node => `#${String(node.attrs?.id || '')}`,
  }).configure({
    HTMLAttributes: { class: 'forum-topic-reference' },
    renderHTML({ options, node }) {
      const id = String(node.attrs.id || '')
      return ['span', mergeAttributes(options.HTMLAttributes, { title: node.attrs.label || id }), `#${id}`]
    },
    renderText: ({ node }) => `#${String(node.attrs.id || '')}`,
    suggestion: {
      char: '#',
      pluginKey: topicReferencePluginKey,
      items: ({ query }) => {
        const topics = [...getTopics()]
        const matches = query ? getForumSearchSuggestions(topics, query).map(item => item.topic) : topics.slice(0, 5)
        return matches.map(topic => ({
          kind: 'topic' as const,
          id: topic.id,
          label: topic.title,
          description: `#${topic.id}`,
          topicType: topic.type,
        }))
      },
      ...(render ? { render } : {}),
    },
  })
}
