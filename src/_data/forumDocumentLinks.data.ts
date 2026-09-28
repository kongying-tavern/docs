import type { ForumDocumentLinks } from '../forum/services/documentLinkIndex'
import { createContentLoader } from 'vitepress'
import { buildForumDocumentLinks } from '../forum/services/documentLinkIndex'

export type { ForumDocumentLinks } from '../forum/services/documentLinkIndex'

declare const data: ForumDocumentLinks
export { data }

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform: buildForumDocumentLinks,
})
