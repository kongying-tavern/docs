import type { Transaction } from '@tiptap/pm/state'
import Link from '@tiptap/extension-link'
import { Plugin } from '@tiptap/pm/state'
import { getUntrustedForumLinkHref, isAllowedForumHref } from '~/forum/services/forumLinkPolicy'

function exposeUntrustedLinks(tr: Transaction): Transaction {
  const replacements: { from: number, to: number, href: string }[] = []
  tr.doc.descendants((node, pos) => {
    if (!node.isText)
      return
    const link = node.marks.find(mark => mark.type.name === 'link')
    const href = typeof link?.attrs.href === 'string' ? getUntrustedForumLinkHref(link.attrs.href) : undefined
    if (!href)
      return
    const previous = replacements.at(-1)
    if (previous?.to === pos && previous.href === href)
      previous.to = pos + node.nodeSize
    else
      replacements.push({ from: pos, to: pos + node.nodeSize, href })
  })
  for (const { from, to, href } of replacements.reverse())
    tr.replaceWith(from, to, tr.doc.type.schema.text(href))
  return tr
}

export function createLinkExtension(options: { openOnClick?: boolean } = {}) {
  return Link.extend({
    onCreate() {
      const tr = exposeUntrustedLinks(this.editor.state.tr)
      if (tr.docChanged)
        this.editor.view.dispatch(tr)
    },
    addProseMirrorPlugins() {
      return [
        ...this.parent?.() ?? [],
        new Plugin({
          appendTransaction(transactions, _oldState, state) {
            if (!transactions.some(tr => tr.docChanged))
              return null
            const tr = exposeUntrustedLinks(state.tr)
            return tr.docChanged ? tr : null
          },
          props: {
            transformPastedHTML(html) {
              const doc = new DOMParser().parseFromString(html, 'text/html')
              for (const anchor of doc.querySelectorAll('a[href]')) {
                const href = getUntrustedForumLinkHref(anchor.getAttribute('href') ?? '')
                if (href)
                  anchor.replaceWith(doc.createTextNode(href))
              }
              return doc.body.innerHTML
            },
          },
        }),
      ]
    },
  }).configure({
    autolink: true,
    defaultProtocol: 'https',
    linkOnPaste: false,
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
