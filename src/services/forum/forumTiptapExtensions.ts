import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { EmojiNode } from '~/composables/tiptap/emojiNode'
import { createLinkExtension } from '~/composables/tiptap/linkConfig'
import { MentionNode } from '~/composables/tiptap/mentionNode'

export function createForumContentExtensions(options: { openLinks?: boolean } = {}): Extensions {
  return [
    StarterKit.configure({ link: false }),
    EmojiNode,
    MentionNode,
    createLinkExtension({ openOnClick: options.openLinks }),
  ]
}
