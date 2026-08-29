import type { ForumDocumentLinks } from '../services/forum/forumDocumentLinkIndex'
import { createContentLoader } from 'vitepress'
import { buildForumDocumentLinks } from '../services/forum/forumDocumentLinkIndex'

export type { ForumDocumentLinks } from '../services/forum/forumDocumentLinkIndex'

declare const data: ForumDocumentLinks
export { data }

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform: buildForumDocumentLinks,
})
