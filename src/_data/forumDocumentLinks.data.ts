import type { ForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex'
import { createContentLoader } from 'vitepress'
import { buildForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex'

export type { ForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex'

declare const data: ForumDocumentLinks
export { data }

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform: buildForumDocumentLinks,
})
