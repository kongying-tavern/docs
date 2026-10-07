import type { ForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex.ts'
import { createContentLoader } from 'vitepress'
import { buildForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex.ts'

export type { ForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex.ts'

export declare const data: ForumDocumentLinks

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform: buildForumDocumentLinks,
})
