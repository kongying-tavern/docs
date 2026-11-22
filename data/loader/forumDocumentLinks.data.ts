import type { ForumDocumentLinks } from '../../src/forum/services/forumDocumentLinkIndex.ts'
import { createContentLoader } from 'vitepress'
import { buildForumDocumentLinks } from '../../src/forum/services/forumDocumentLinkIndex.ts'
import { shouldPublishPage } from '../../src/utils/pageVisibility.ts'

export type { ForumDocumentLinks } from '../../src/forum/services/forumDocumentLinkIndex.ts'

export declare const data: ForumDocumentLinks

export default createContentLoader('**/*.md', {
  globOptions: { ignore: ['**/public/**'] },
  includeSrc: true,
  transform: pages => buildForumDocumentLinks(pages.filter(page => shouldPublishPage(page.frontmatter))),
})
