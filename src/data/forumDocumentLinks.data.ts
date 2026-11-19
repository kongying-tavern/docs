import type { ForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex.ts'
import { createContentLoader } from 'vitepress'
import { buildForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex.ts'
import { shouldPublishPage } from './pageVisibility.ts'

export type { ForumDocumentLinks } from '../forum/services/forumDocumentLinkIndex.ts'

export declare const data: ForumDocumentLinks

export default createContentLoader('**/*.md', {
  globOptions: { ignore: ['**/public/**'] },
  includeSrc: true,
  transform: pages => buildForumDocumentLinks(pages.filter(page => shouldPublishPage(page.frontmatter))),
})
