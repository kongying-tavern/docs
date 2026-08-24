import Link from '@tiptap/extension-link'

export function createLinkExtension(options: { openOnClick?: boolean } = {}) {
  return Link.configure({
    autolink: true,
    defaultProtocol: 'https',
    linkOnPaste: true,
    openOnClick: options.openOnClick ?? false,
    protocols: ['http', 'https', 'mailto'],
    HTMLAttributes: {
      class: 'vp-link',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  })
}
