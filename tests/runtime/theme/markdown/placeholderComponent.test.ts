import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { expect, test } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { markdownConfig } from '../../../../.vitepress/config/markdown.ts'
import Placeholder from '../../../../.vitepress/theme/markdown-ext/placeholder/Placeholder.vue'

interface PlaceholderProps {
  inline?: boolean
  hint?: string
}

async function render(props: PlaceholderProps, slot?: () => string): Promise<string> {
  const app = createSSRApp({
    render: () => h(Placeholder, props, slot && { default: slot }),
  })
  return renderToString(app)
}

/** SSR frames slot content with fragment comments; drop them before matching. */
function plain(html: string): string {
  return html.replace(/<!--[[\]]-->/g, '')
}

test('a block placeholder falls back to its hint', async () => {
  const html = await render({ hint: '块级提示' })

  expect(html).toContain('class="doc-placeholder doc-placeholder-block"')
  expect(plain(html)).toContain('<div class="doc-placeholder-hint">块级提示</div>')
})

test('a default slot is shown instead of the hint', async () => {
  const html = await render({ hint: '块级提示' }, () => '块级槽内容')

  expect(html).toContain('块级槽内容')
  expect(html).not.toContain('块级提示')
})

test('an inline placeholder shows its hint without a tooltip', async () => {
  const html = await render({ inline: true, hint: '行内提示' })

  expect(html).toContain('class="doc-placeholder doc-placeholder-inline"')
  expect(html).toContain('行内提示')
  expect(html).not.toContain('title=')
  expect(html).not.toContain('doc-placeholder-block')
})

test('an inline default slot keeps the chip styling', async () => {
  const html = await render({ inline: true, hint: '行内提示' }, () => '行内槽内容')

  expect(plain(html)).toContain('<span class="doc-placeholder doc-placeholder-inline">行内槽内容</span>')
})

test('a hint is escaped rather than rendered as markup', async () => {
  const html = await render({ hint: '<img src=x onerror=alert(1)>' })

  expect(html).not.toContain('<img')
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
})

test('block and inline tags reach the component with and without slots', async () => {
  const markdown = await createMarkdownRenderer(resolve('pages'), markdownConfig)

  const block = await markdown.renderAsync(':::Placeholder{hint="块级提示"}\n\n:::')
  expect(block).toContain('<placeholder hint="块级提示">')

  const blockSlot = await markdown.renderAsync(':::Placeholder\n块级槽内容。\n:::\n')
  expect(blockSlot).toContain('<placeholder>块级槽内容。</placeholder>')

  const inline = await markdown.renderAsync('段落中的 :Placeholder{inline hint="行内提示"} 保持行内。')
  expect(inline).toContain('<Placeholder :inline="true" hint="行内提示"></Placeholder>')

  const inlineSlot = await markdown.renderAsync('段落中的 :Placeholder[行内槽内容]{inline} 保持行内。')
  expect(inlineSlot).toContain('<Placeholder :inline="true">行内槽内容</Placeholder>')
})
