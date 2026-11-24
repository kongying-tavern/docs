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

async function render(props: PlaceholderProps): Promise<string> {
  const app = createSSRApp({
    render: () => h(Placeholder, props),
  })
  return renderToString(app)
}

test('a block placeholder shows its hint as the only content', async () => {
  const html = await render({ hint: '【图片】待补启动界面截图' })

  expect(html).toContain('class="doc-placeholder doc-placeholder-block"')
  expect(html).toContain('<p class="doc-placeholder-hint">【图片】待补启动界面截图</p>')
})

test('an inline placeholder shows its hint without a tooltip', async () => {
  const html = await render({ inline: true, hint: '【图标】加号图标（Btn_Slider_Plus.png）' })

  expect(html).toContain('class="doc-placeholder doc-placeholder-inline"')
  expect(html).toContain('【图标】加号图标（Btn_Slider_Plus.png）')
  expect(html).not.toContain('title=')
  expect(html).not.toContain('doc-placeholder-block')
})

test('a hint is escaped rather than rendered as markup', async () => {
  const html = await render({ hint: '<img src=x onerror=alert(1)>' })

  expect(html).not.toContain('<img')
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
})

test('a block container and an inline tag both reach the component', async () => {
  const markdown = await createMarkdownRenderer(resolve('pages'), markdownConfig)

  const block = await markdown.renderAsync(':::Placeholder{hint="【图片】待补截图"}\n\n:::')
  expect(block).toContain('<placeholder hint="【图片】待补截图">')

  const inline = await markdown.renderAsync('段落中的 :Placeholder{inline hint="【图标】待补"} 保持行内。')
  expect(inline).toContain('<Placeholder :inline="true" hint="【图标】待补"></Placeholder>')
})
