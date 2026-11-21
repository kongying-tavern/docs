import type { Extensions } from '@tiptap/core'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import type { ForumEditorSuggestionItem } from '@/src/forum/tiptap/forumSuggestionRenderer.ts'
import StarterKit from '@tiptap/starter-kit'
import { EmojiNode } from '@/src/forum/tiptap/emojiNode.ts'
import { createLinkExtension } from '@/src/forum/tiptap/linkConfig.ts'
import { createMentionNode, MentionNode } from '@/src/forum/tiptap/mentionNode.ts'
import { createTopicReferenceNode } from '@/src/forum/tiptap/topicReferenceNode.ts'
import { getForumDocumentTitle } from './forumDocumentLinkIndex.ts'
import { shortenForumAutoLink } from './forumLinkPolicy.ts'

export function createForumContentExtensions(options: {
  openLinks?: boolean
  getTopics?: () => readonly ForumAPI.Topic[]
  getMentionUsers?: () => readonly ForumAPI.User[]
  suggestionRender?: SuggestionOptions<ForumEditorSuggestionItem>['render']
  mentionSuggestionRender?: SuggestionOptions<ForumEditorSuggestionItem>['render']
} = {}): Extensions {
  return [
    StarterKit.configure({ link: false }),
    EmojiNode,
    options.mentionSuggestionRender || options.suggestionRender ? createMentionNode(options.mentionSuggestionRender ?? options.suggestionRender, options.getMentionUsers) : MentionNode,
    createTopicReferenceNode(options.getTopics ?? (() => []), options.suggestionRender),
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
  })

  return [
    StarterKit.configure({ codeBlock: false, heading: false, link: false }),
    topicLink,
    createMentionNode(options.suggestionRender),
    createTopicReferenceNode(options.getTopics ?? (() => []), options.suggestionRender),
  ]
}
