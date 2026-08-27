import type { Extensions } from '@tiptap/core'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type ForumAPI from '@/apis/forum/api'
import type { ForumEditorSuggestionItem } from '~/composables/tiptap/forumSuggestionRenderer'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { EmojiNode } from '~/composables/tiptap/emojiNode'
import { createLinkExtension } from '~/composables/tiptap/linkConfig'
import { createMentionNode, MentionNode } from '~/composables/tiptap/mentionNode'
import { createTopicReferenceNode } from '~/composables/tiptap/topicReferenceNode'
import { getForumDocumentTitle } from './forumDocumentLinkIndex'
import { isAllowedForumHref, shortenForumAutoLink } from './forumLinkPolicy'

export function createForumContentExtensions(options: { openLinks?: boolean } = {}): Extensions {
  return [
    StarterKit.configure({ link: false }),
    EmojiNode,
    MentionNode,
    createLinkExtension({ openOnClick: options.openLinks }),
  ]
}

export function createForumTopicEditorExtensions(
  options: {
    documentLinks?: Readonly<Record<string, string>>
    getTopics?: () => readonly ForumAPI.Topic[]
    suggestionRender?: SuggestionOptions<ForumEditorSuggestionItem>['render']
  } = {},
): Extensions {
  const documentLinks = options.documentLinks ?? {}
  const topicLink = createLinkExtension().extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        documentTitle: {
          default: null,
          parseHTML: () => null,
          renderHTML: (attributes) => {
            const href = String(attributes.href || '')
            const title = getForumDocumentTitle(href, documentLinks)
            if (title) {
              return {
                'aria-label': title,
                'class': 'vp-link forum-document-link forum-document-link--editor',
                'data-link-display': title,
              }
            }
            const display = shortenForumAutoLink(href)
            return display !== href
              ? {
                  'aria-label': href,
                  'class': 'vp-link forum-external-link--editor',
                  'data-link-display': display,
                  'title': href,
                }
              : {}
          },
        },
      }
    },
    parseMarkdown: (token, helpers) => token.raw === token.href && isAllowedForumHref(token.href)
      ? helpers.applyMark('link', helpers.parseInline(token.tokens || []), { href: token.href })
      : helpers.createTextNode(token.raw || token.text || ''),
    renderMarkdown: node => String(node.attrs?.href || ''),
  })
  const topicMention = createMentionNode(options.suggestionRender).extend({
    renderMarkdown: node => `@${String(node.attrs?.label || node.attrs?.id || '')}`,
  })

  return [
    StarterKit.configure({ heading: false, link: false }),
    topicLink,
    topicMention,
    createTopicReferenceNode(options.getTopics ?? (() => []), options.suggestionRender),
    Markdown,
  ]
}
