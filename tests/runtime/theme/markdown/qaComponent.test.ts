import { expect, test } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { installI18n } from '../../../../.vitepress/theme/i18n/index.ts'
import Qa from '../../../../.vitepress/theme/markdown-ext/qa/QA.vue'

interface QaProps {
  collapsible?: boolean
  collapsed?: boolean
}

async function render(props: QaProps = {}): Promise<string> {
  const app = createSSRApp({
    render: () => h(Qa, props, {
      question: () => h('p', 'Question line'),
      answer: () => h('p', 'Answer line'),
    }),
  })
  await installI18n(app)
  return renderToString(app)
}

function toggleTag(html: string): string {
  return html.match(/<button[^>]*>/)?.[0] ?? ''
}

test('the toggle is a button wired to the answer it hides', async () => {
  const html = await render()
  const button = toggleTag(html)

  expect(button).toContain('type="button"')
  expect(button).toContain('aria-expanded="true"')

  const controls = button.match(/aria-controls="([^"]+)"/)?.[1]
  expect(controls).toBeTruthy()
  expect(html).toContain(`<div id="${controls}" class="qa-wrapper qa-answer">`)
})

test('the toggle is named after its question plus its visible label', async () => {
  const html = await render()
  const labelledby = toggleTag(html).match(/aria-labelledby="([^"]+)"/)?.[1]?.split(' ') ?? []

  expect(labelledby).toHaveLength(2)
  expect(html).toContain(`<div id="${labelledby[0]}" class="qa-content">`)
  expect(html).toContain(`<span id="${labelledby[1]}" class="text">折叠</span>`)
})

test('the question row carries no click semantics of its own', async () => {
  const row = (await render()).match(/<div class="qa-wrapper qa-question"[^>]*>/)?.[0] ?? ''

  expect(row).not.toBe('')
  expect(row).not.toContain('role=')
  expect(row).not.toContain('tabindex=')
})

test('collapsed starts folded with an expand label', async () => {
  const html = await render({ collapsed: true })

  expect(toggleTag(html)).toContain('aria-expanded="false"')
  expect(html).toMatch(/<div class="qa qa-collapsible">/)
  expect(html).toContain('展开')
})

test('collapsible=false renders no toggle and stays open', async () => {
  const html = await render({ collapsible: false })

  expect(html).not.toContain('<button')
  expect(html).toMatch(/<div class="qa qa-opened">/)
})
