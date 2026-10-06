import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { createMarkdownRenderer, mergeMarkdownLocales } from 'vitepress'
import { compileTemplate } from 'vue/compiler-sfc'
import { createLocalesConfig } from '../../.vitepress/config/locales'
import { markdownConfig } from '../../.vitepress/config/markdown'

test('code copy buttons use the page locale during Markdown rendering', async () => {
  const locales = await createLocalesConfig()
  const markdown = await createMarkdownRenderer(resolve('src'), mergeMarkdownLocales(markdownConfig, locales))
  for (const [localeIndex, title, copied] of [
    ['root', '复制代码', '已复制'],
    ['en', 'Copy code', 'Copied'],
    ['ja', 'コードをコピー', 'コピーしました'],
  ]) {
    const html = await markdown.renderAsync('```js\n1\n```', { localeIndex })
    assert.ok(html.includes(`title="${title}"`), html)
    assert.ok(html.includes(`data-copied="${copied}"`), html)
  }
})

test('VitePress built-ins render once alongside Comark', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(`
## Heading {#stable-heading}

- [ ] one
- [x] two

note[^1]

[^1]: footnote

*attrs*{.vp-link}

:span{width=300 class="mt-4"}
`)

  assert.equal(html.match(/id="stable-heading"/g)?.length, 1)
  assert.equal(html.match(/type="checkbox"/g)?.length, 2)
  assert.equal(html.match(/<section class="footnotes"/g)?.length, 1)
  assert.match(html, /<em class="vp-link">attrs<\/em>/)
  assert.match(html, /<span[^>]*width="300"[^>]*class="mt-4"/)
})

test('reserved containers yield to VitePress and site plugins instead of Comark', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(`
::: tip
handled tip
:::

::::raw

raw content

::::

::: timeline 2026-1-1

timeline entry

:::

::: my-widget
mdc block content
:::
`)

  assert.match(html, /<div class="tip custom-block">/)
  assert.match(html, /<div class="vp-raw">/)
  assert.match(html, /timeline-dot/)
  assert.match(html, /<my-widget>/)
})

test('reserved lowercase containers do not swallow the MDC Card component', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('::Card\n---\ntitle: Hello\nlink: /test\n---\n::')
  assert.match(html, /<card\b/i)
  assert.match(html, /title="Hello"/)
  assert.doesNotMatch(html, /<p>::Card/)
})

test('the enhancement guide emits Vue named slots and valid MDC props', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const source = readFileSync(resolve('src/zh/md-enhance-guide.md'), 'utf8')
  const html = await markdown.renderAsync(source)
  assert.match(html, /<template #default="">/)
  assert.match(html, /<template #details="">/)
  assert.match(html, /<scratch-to-reveal[^>]*>刮开这里查看隐藏内容<\/scratch-to-reveal>/)
  assert.match(html, /link="https:\/\/yuanshen.site\/"/)
  assert.doesNotMatch(html, /link="&lt;https:/)
  assert.match(html, /<scratch-to-reveal :width="300"/)
  const compiled = compileTemplate({ source: html, filename: 'guide.vue', id: 'guide' })
  assert.deepEqual(compiled.errors, [])
})

test('spoiler attributes stay independent and render typed widths and alignment', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('!!first!!{width=200} !!second!!{w=300} !!third!!{width=250,align=center} !!fourth!!{a=right} !!plain!!')
  assert.match(html, /<ScratchToReveal class="inline-spoiler" :width="200">first<\/ScratchToReveal>/)
  assert.match(html, /<ScratchToReveal class="inline-spoiler" :width="300">second<\/ScratchToReveal>/)
  assert.match(html, /:width="250" style="text-align: center;">third/)
  assert.match(html, /class="inline-spoiler" style="text-align: right;">fourth/)
  assert.match(html, /class="inline-spoiler">plain/)
  assert.doesNotMatch(html, / spoiler[ =]/)
})

test('site inline extensions render without swallowing adjacent text', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(`
{define:VALUE}**reused**{/define}
{%= VALUE %}

{color:red}**colored**{/color} ==marked== H~2~O x^2^

*{中国:zhōng|guó}

*[HTML]: Hyper Text Markup Language

HTML [[Meta]]

:prefix text :1.小黄脸/呲牙.png: :smile:
`)
  assert.match(html, /<strong>reused<\/strong>/)
  assert.match(html, /color: red;.*<strong>colored<\/strong>/)
  assert.match(html, /<mark>marked<\/mark>/)
  assert.match(html, /<sub>2<\/sub>/)
  assert.match(html, /<sup>2<\/sup>/)
  assert.match(html, /<ruby>/)
  assert.match(html, /<abbr title="Hyper Text Markup Language">HTML<\/abbr>/)
  assert.match(html, /<kbd>/)
  assert.match(html, /:prefix text <Emoji emoji="1.小黄脸\/呲牙.png"/)
  assert.equal(html.match(/<Emoji /g)?.length, 1)
  assert.ok(html.includes('😄'), html)
})

test('image dimensions preserve lazy loading, zoom attributes and figure captions', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  for (const syntax of ['![caption =200x100](/sample.png)', '![caption|200x100](/sample.png)']) {
    const html = await markdown.renderAsync(syntax)
    assert.match(html, /width="200"/)
    assert.match(html, /height="100"/)
    assert.match(html, /loading="lazy"/)
    assert.match(html, /data-zoomable="true"/)
    assert.match(html, /<figure[^>]*>/)
    assert.match(html, /<figcaption>caption<\/figcaption>/)
  }
})

test('native alerts, nested containers and code groups survive Comark and Vue compilation', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(`
> [!WARNING]
> GFM alert

:::: tip outer
::: warning inner
nested content
:::
::::

::: code-group
\`\`\`ts [first.ts]
const value: number = 1
\`\`\`

\`\`\`js [second.js]
const value = 2
\`\`\`
:::
`)
  assert.match(html, /warning custom-block/)
  assert.match(html, /tip custom-block/)
  assert.match(html, /vp-code-group/)
  assert.match(html, /first.ts/)
  assert.match(html, /second.js/)
  const compiled = compileTemplate({ source: html, filename: 'extensions.vue', id: 'extensions' })
  assert.deepEqual(compiled.errors, [])
})
