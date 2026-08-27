import Link from '@tiptap/extension-link'
import { isAllowedForumHref } from '~/services/forum/forumLinkPolicy'

export function createLinkExtension(options: { openOnClick?: boolean } = {}) {
  return Link.configure({
    autolink: true,
    defaultProtocol: 'https',
    linkOnPaste: true,
    openOnClick: options.openOnClick ?? false,
    protocols: ['http', 'https'],
    isAllowedUri: (url, context) => context.defaultValidate(url) && isAllowedForumHref(url),
    shouldAutoLink: isAllowedForumHref,
    HTMLAttributes: {
      class: 'vp-link',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  })
}
