import type { SuggestionOptions } from '@tiptap/suggestion'
import type { ForumEditorSuggestionItem } from './forumSuggestionRenderer'
import type ForumAPI from '~/forum/api/types'
import { InputRule, mergeAttributes, PasteRule } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import { PluginKey } from '@tiptap/pm/state'
import { TOPIC_ID_PATTERN } from '~/forum/services/forumTopicQuote'
import { getTopicReferenceSuggestions, normalizeTopicReferenceId } from '~/forum/services/forumTopicReferenceSuggestions'

const topicReferencePluginKey = new PluginKey('forumTopicReference')

export function createTopicReferenceNode(
  getTopics: () => readonly ForumAPI.Topic[],
  render?: SuggestionOptions<ForumEditorSuggestionItem>['render'],
) {
  return Mention.extend({
    name: 'topicReference',
    addInputRules() {
      return [new InputRule({
        // Wait for a delimiter so a six-character prefix is never converted early.
        find: new RegExp(`(?<![\\p{L}\\p{N}_.+/#&=?:%-])#(${TOPIC_ID_PATTERN})([\\s，。；：！？,;!?])$`, 'iu'),
        handler: ({ range, match, chain, state }) => {
          if (state.doc.resolve(range.from).marks().some(mark => mark.type.name === 'link'))
            return null
          chain().insertContentAt(range, [
            { type: this.name, attrs: { id: match[1].toUpperCase() } },
            { type: 'text', text: match[2] },
          ]).run()
        },
      })]
    },
    addPasteRules() {
      return [new PasteRule({
        find: new RegExp(`(?<![\\p{L}\\p{N}_.+/#&=?:%-])#(${TOPIC_ID_PATTERN})(?![\\p{L}\\p{N}_-])`, 'giu'),
        handler: ({ range, match, chain, state }) => {
          const marks = state.doc.resolve(range.from).marks()
          if (marks.some(mark => mark.type.name === 'code' || mark.type.name === 'link'))
            return
          chain().insertContentAt(range, { type: this.name, attrs: { id: match[1].toUpperCase() } }).run()
        },
      })]
    },
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
      allow: ({ editor, state, range }) => {
        const position = state.doc.resolve(range.from)
        const parent = position.parent
        return editor.isEditable && !parent.type.spec.code
          && !position.marks().some(mark => mark.type.name === 'code' || mark.type.name === 'link')
          && Boolean(parent.type.contentMatch.matchType(editor.schema.nodes.topicReference))
      },
      items: ({ query }) => {
        const matches = getTopicReferenceSuggestions(getTopics(), query)
        const items: ForumEditorSuggestionItem[] = matches.map(topic => ({
          kind: 'topic' as const,
          id: topic.id,
          label: topic.title,
          description: `#${topic.id}`,
          topicType: topic.type,
        }))
        const id = normalizeTopicReferenceId(query)
        if (id && !matches.some(topic => String(topic.id).toUpperCase() === id))
          items.push({ kind: 'topic', id, label: `#${id}`, manual: true })
        return items
      },
      ...(render ? { render } : {}),
    },
  })
}
