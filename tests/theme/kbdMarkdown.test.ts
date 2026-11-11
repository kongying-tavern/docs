import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { compileTemplate } from 'vue/compiler-sfc'
import { markdownConfig } from '../../.vitepress/config/markdown'

function sequences(html: string): string[][][] {
  return [...html.matchAll(/<KeyboardShortcut :sequence="([^"]*)"/g)].map((match) => {
    const json = match[1].replaceAll('&quot;', '"').replaceAll('&#39;', '\'').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')
    return JSON.parse(json)
  })
}

test('shortcuts distinguish combinations and ordered steps while retaining adjacent legacy keys', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('[[ Esc ]] [[ Ctrl + A , Ctrl + D ]] [[G, I]] [[Meta]][[K]]')
  assert.deepEqual(sequences(html), [[['Esc']], [['Ctrl', 'A'], ['Ctrl', 'D']], [['G'], ['I']], [['Meta']], [['K']]])
  assert.deepEqual(compileTemplate({ source: html, filename: 'shortcuts.vue', id: 'shortcuts' }).errors, [])
})

test('shortcut separators and brackets support explicit names and literal escapes', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync(String.raw`[[Ctrl+Plus]] [[Comma]] [[Ctrl+\+]] [[\,]] [[\\]] [[\[]] [[\]]]`)
  assert.deepEqual(sequences(html), [[['Ctrl', 'Plus']], [['Comma']], [['Ctrl', '+']], [[',']], [['\\']], [['[']], [[']']]])
})

test('platform overrides are whitelisted and other Markdown attrs cannot become Vue bindings', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('[[Mod+K]]{platform=windows} [[Ctrl]]{platform=mac} [[Meta]]{platform=linux}\n\n[[A]]{:sequence="run()" @click="run()"}')
  assert.match(html, /platform="windows"/)
  assert.match(html, /platform="mac"/)
  assert.match(html, /platform="linux"/)
  const compiled = compileTemplate({ source: html, filename: 'attrs.vue', id: 'attrs' })
  assert.deepEqual(compiled.errors, [])
  assert.doesNotMatch(compiled.code, /onClick|_ctx\.run/)
})

test('shortcut contents remain string data across HTML, Markdown and Vue compilation', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const keys = ['<script>alert(1)</script>', '{{ run() }}', '" @click="run()', '**bold**', 'A&B', '\');run();//']
  const html = await markdown.renderAsync(keys.map(key => `[[${key}]]`).join(' '))
  assert.deepEqual(sequences(html), keys.map(key => [[key]]))
  assert.doesNotMatch(html, /<script>|<strong>|<\/script>/)
  const compiled = compileTemplate({ source: html, filename: 'inert.vue', id: 'inert' })
  assert.deepEqual(compiled.errors, [])
  assert.doesNotMatch(compiled.code, /_ctx\.run|onClick|alert\(1\)\s*\(/)
})

test('malformed shortcuts do not consume adjacent text and ordinary links and code keep their behavior', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('before [[Ctrl+]] after [[,A]] / [[A,,B]] / [[ ]] / [[unclosed\nline\n\n[link](https://example.com) and [shortcut [[Ctrl+A]]](https://example.com)\n\n`[[Ctrl+A]]`\n\n```md\n[[Mod+K]]\n```')
  assert.match(html, /before \[\[Ctrl\+\]\] after/)
  assert.match(html, /\[\[,A\]\]/)
  assert.match(html, /<a href="https:\/\/example.com"[^>]*>shortcut <KeyboardShortcut [\s\S]*?<\/KeyboardShortcut><\/a>/)
  assert.match(html, /\[\[unclosed\nline/)
  assert.deepEqual(sequences(html), [[['Ctrl', 'A']]])
})

test('shortcuts remain inside inline and reference links', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  for (const source of [
    '[Press [[Esc]]](./target)',
    '[Press [[Ctrl+A]]](./target)',
    '[Press [[Ctrl+A, Ctrl+D]]][target]\n\n[target]: ./target',
  ]) {
    const html = await markdown.renderAsync(source)
    assert.match(html, /<a href="\.\/target(?:\.html)?"[^>]*>Press <KeyboardShortcut [\s\S]*?<\/KeyboardShortcut><\/a>/)
    assert.deepEqual(compileTemplate({ source: html, filename: 'shortcut-link.vue', id: 'shortcut-link' }).errors, [])
  }
})

test('shortcut text participates in heading anchors, permalink names and the table of contents', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const env: Record<string, unknown> = {}
  const html = await markdown.renderAsync('[[toc]]\n\n## [[Esc]]\n\n## Open [[Ctrl+A]]\n\n## Open [[Ctrl+B]]', env)
  assert.match(html, /<h2 id="esc"/)
  assert.match(html, /<h2 id="open-ctrl-a"/)
  assert.match(html, /<h2 id="open-ctrl-b"/)
  assert.match(html, /href="#esc" aria-label="Permalink to “Esc”"/)
  assert.match(html, /href="#open-ctrl-a" aria-label="Permalink to “Open Ctrl\+A”"/)
  assert.match(html, /href="#esc">Esc<\/a>/)
  assert.match(html, /href="#open-ctrl-b">Open Ctrl\+B<\/a>/)
})

test('image alternative text retains shortcut names without injecting shortcut HTML', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('![Press [[Ctrl+A]], then [[Ctrl+D]]](./a.png)')
  assert.match(html, /<img[^>]*alt="Press Ctrl\+A, then Ctrl\+D"/)
  assert.doesNotMatch(html, /alt="[^"]*KeyboardShortcut/)
})

test('shortcut headings remain literal in the table of contents without changing their anchors', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  for (const key of ['{{ run() }}', '{{ invalid syntax }}', '{{ $frontmatter.title }}']) {
    const html = await markdown.renderAsync(`---\ntitle: Replaced\n---\n\n[[toc]]\n\n## [[${key}]]\n\n## Normal {{ ordinary }}`)
    const anchor = /<h2 id="([^"]+)"/.exec(html)?.[1]
    assert.ok(anchor)
    const literal = key.replaceAll('{', '&#123;').replaceAll('}', '&#125;')
    assert.ok(html.includes(`href="#${anchor}">${literal}</a>`), html)
    assert.deepEqual(sequences(html), [[[key]]])
    const compiled = compileTemplate({ source: html, filename: 'shortcut-toc.vue', id: 'shortcut-toc' })
    assert.deepEqual(compiled.errors, [])
    assert.doesNotMatch(compiled.code, /_ctx\.run|_ctx\.\$frontmatter/)
    assert.match(compiled.code, /_ctx\.ordinary/)
  }
})

test('shortcut text stays literal through core replacements and frontmatter interpolation', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const html = await markdown.renderAsync('---\ntitle: Replaced\n---\n\nBefore [[{{ $frontmatter.title }}]] [[:smile:]] [[https://example.com]] after')
  assert.deepEqual(sequences(html), [[['{{ $frontmatter.title }}']], [[':smile:']], [['https://example.com']]])
  assert.match(html, /Before <KeyboardShortcut /)
  assert.match(html, /<\/KeyboardShortcut> after/)
  assert.doesNotMatch(html, /<a |😄/)
  const compiled = compileTemplate({ source: html, filename: 'shortcut-literal.vue', id: 'shortcut-literal' })
  assert.deepEqual(compiled.errors, [])
  assert.doesNotMatch(compiled.code, /_ctx\.\$frontmatter/)
})

test('all existing game-key sequences still render every single key independently', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  for (const locale of ['zh', 'en', 'ja']) {
    const source = readFileSync(resolve(`src/${locale}/manual/client/easter-egg.md`), 'utf8')
    const html = await markdown.renderAsync(source)
    assert.equal(sequences(html).length, 24)
    assert.deepEqual(sequences(html)[0], [['arrUp']])
  }
})
