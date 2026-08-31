/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Editor, resolveExtensions } from '@tiptap/core'
import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'
import { decodeCommentBody, decodeForumText, decodeTopicBody } from '../../src/services/forum/forumContentCodec'
import {
  renderForumComment,
  renderForumTopic,
  renderForumTopicSummary,
  renderTiptapToHtml,
} from '../../src/services/forum/forumContentRenderer'
import { buildForumDocumentLinks } from '../../src/services/forum/forumDocumentLinkIndex'
import { isAllowedForumHref } from '../../src/services/forum/forumLinkPolicy'
import { createForumContentExtensions, createForumTopicEditorExtensions } from '../../src/services/forum/forumTiptapExtensions'
import {
  RICH_TIPTAP_DOC,
  RICH_TIPTAP_WITH_ATTACHMENT,
  UNSAFE_LINK_TIPTAP_DOC,
  VALID_JSON_PLAIN_TEXTS,
} from './fixtures/content'

test('valid JSON-looking Topic and legacy Comment bodies stay exact plain text', () => {
  for (const raw of VALID_JSON_PLAIN_TEXTS) {
    assert.deepEqual(decodeTopicBody(raw).content, { kind: 'plain', text: raw })
    assert.deepEqual(decodeCommentBody(raw).content, { kind: 'plain', text: raw })
  }
})

test('rich Comment codec derives text once and keeps its ordered attachment separate', () => {
  const decoded = decodeCommentBody(RICH_TIPTAP_WITH_ATTACHMENT)

  assert.equal(decoded.content.kind, 'tiptap')
  assert.match(decoded.content.text, /hello @alice/)
  assert.match(decoded.content.text, /@alice/)
  assert.match(decoded.content.text, /emoji\/happy\.webp/)
  assert.match(decoded.content.text, /Bullet/)
  assert.deepEqual(decoded.attachments, [{
    src: 'https://assets.example/attachment.webp',
    alt: 'attachment',
    thumbHash: 'rich',
    width: 800,
    height: 600,
  }])
})

test('static rich Comment rendering covers the writer schema without an Editor', () => {
  const html = renderTiptapToHtml(RICH_TIPTAP_DOC)

  assert.match(html, /<strong>hello <a class="mention vp-link"[^>]+>@alice<\/a><\/strong>/)
  assert.match(html, /<br/)
  assert.match(html, /href="https:\/\/gitee\.com\/alice"/)
  assert.match(html, />@alice<\/a>/)
  assert.match(html, /data-emoji="emoji\/happy\.webp"/)
  assert.match(html, /<em>italic<\/em>/)
  assert.match(html, /<s> strike<\/s>/)
  assert.match(html, /<code> code<\/code>/)
  assert.match(html, /<u> underline<\/u>/)
  assert.equal(html.includes('href="https://example.com/path?q=1"'), false)
  assert.match(html, / link/)
  assert.match(html, /<h2>Heading<\/h2>/)
  assert.match(html, /<blockquote>/)
  assert.match(html, /<ul>/)
  assert.match(html, /<ol start=2/)
  assert.match(html, /<pre><code/)
  assert.match(html, /<hr/)
})

test('writer and static renderer share duplicate-free extension names', () => {
  const names = resolveExtensions(createForumContentExtensions()).map(extension => extension.name)
  assert.deepEqual(names.filter((name, index) => names.indexOf(name) !== index), [])
  assert.equal(names.filter(name => name === 'link').length, 1)
})

test('unsafe link protocols and user HTML never reach rendered Comment HTML', () => {
  const unsafeLinkHtml = renderTiptapToHtml(UNSAFE_LINK_TIPTAP_DOC)
  const userHtml = renderTiptapToHtml({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] }],
  })

  assert.equal(unsafeLinkHtml.includes('javascript:'), false)
  assert.equal(unsafeLinkHtml.includes('<a'), false)
  assert.match(unsafeLinkHtml, /unsafe link/)
  assert.equal(userHtml.includes('<img'), false)
  assert.match(userHtml, /&lt;img src=x onerror=alert\(1\)&gt;/)
})

test('malformed or unsupported rich roots fall back to exact interpolated plain text', () => {
  const invalidDocuments = [
    { type: 'doc', content: [{ type: 'unknown', content: [] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention' }] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'emoji', attrs: {} }] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: {} }] }] }] },
  ]

  for (const value of invalidDocuments) {
    const raw = JSON.stringify(value)
    const decoded = decodeForumText(raw)
    assert.deepEqual(decoded, { kind: 'plain', text: raw })
    assert.deepEqual(renderForumComment(decoded), { kind: 'plain', text: raw })
  }
})

test('Topic Markdown disables raw HTML, allowlists links, and preserves JSON-looking text', () => {
  const rendered = renderForumTopic('123\nhttps://gitee.com/KYJGYSDT\nhttps://example.com\n<script>alert(1)</script>')

  assert.match(rendered, /^<p>123<br class="forum-topic-paragraph-break">/)
  assert.match(rendered, /href="https:\/\/gitee\.com\/KYJGYSDT"/)
  assert.equal(rendered.includes('href="https://example.com"'), false)
  assert.match(rendered, /https:\/\/example\.com/)
  assert.equal(rendered.includes('<script>'), false)
  assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})

test('Topic paragraph breaks keep inline Markdown nesting valid', () => {
  assert.equal(
    renderForumTopic('**first\nsecond**'),
    '<p><strong>first<br class="forum-topic-paragraph-break">second</strong></p>\n',
  )
})

test('link allowlist validates normalized origins before accepting relative URLs', () => {
  assert.equal(isAllowedForumHref('/docs/manual/client'), true)
  assert.equal(isAllowedForumHref('https://gitee.com/KYJGYSDT'), true)
  assert.equal(isAllowedForumHref('/\\evil.example/path'), false)
  assert.equal(isAllowedForumHref('javascript:alert(1)'), false)
})

test('Topic bodies and summaries share safe topic references and shortened auto-links', () => {
  const longUrl = 'https://gitee.com/KYJGYSDT/a/very/long/path/that/keeps/going?query=full-value'
  const source = `关联 #ICROD8、@lain718、普通 #BUG、邮箱 test@example.com、代码 \`#IABC12\`，参见 ${longUrl}`
  const options = { topicHref: (id: string) => `/feedback/topic/${id}` }

  for (const rendered of [renderForumTopic(source, options), renderForumTopicSummary(source, options)]) {
    assert.match(rendered, /class="vp-link forum-topic-reference" href="\/feedback\/topic\/ICROD8">#ICROD8<\/a>/)
    assert.match(rendered, /普通 #BUG/)
    assert.match(rendered, /class="mention vp-link" href="https:\/\/gitee\.com\/lain718"/)
    assert.equal(rendered.includes('href="https://gitee.com/example"'), false)
    assert.match(rendered, /<code>#IABC12<\/code>/)
    assert.match(rendered, /class="vp-link forum-external-link"/)
    assert.match(rendered, /target="_blank"/)
    assert.match(rendered, /rel="noopener noreferrer"/)
    assert.match(rendered, /gitee\.com\/KYJGYSDT\/a\/very\/long\/path\/that\/keeps\/?…/)
    assert.match(rendered, new RegExp(`href="${longUrl.replace(/[\\?]/g, '\\$&')}"`))
  }
})

test('scheme-less links do not rewrite code or authored Markdown link syntax', () => {
  const rendered = renderForumTopic('`gitee.com/KYJGYSDT` [仓库](gitee.com/KYJGYSDT) gitee.com/KYJGYSDT')

  assert.match(rendered, /<code>gitee\.com\/KYJGYSDT<\/code>/)
  assert.match(rendered, /\[仓库\]\(gitee\.com\/KYJGYSDT\)/)
  assert.match(rendered, /href="https:\/\/gitee\.com\/KYJGYSDT"/)
})

test('Topic bodies and summaries replace pasted site docs with their VitePress titles', () => {
  const href = 'https://yuanshen.site/docs/manual/client/fullscreen-windowed'
  const documentLinks = { '/manual/client/fullscreen-windowed': '窗口全屏/无边框窗口模式' }

  for (const rendered of [
    renderForumTopic(`${href}\n[${href}](${href})\n[保留文案](${href})`, { documentLinks }),
    renderForumTopicSummary(href, { documentLinks }),
  ]) {
    assert.match(rendered, /class="forum-document-link-icon\b/)
    assert.match(rendered, />窗口全屏\/无边框窗口模式<\/a>/)
    assert.equal(rendered.includes('forum-external-link'), false)
  }

  const authored = renderForumTopic(`[保留文案](${href})`, { documentLinks })
  assert.match(authored, /\[保留文案\]\(https:\/\/yuanshen\.site/)
  assert.equal(authored.includes('<a'), false)
  assert.equal(authored.includes('forum-document-link'), false)
})

test('document title index includes the rewritten Chinese public route', () => {
  const links = buildForumDocumentLinks([{
    url: '/zh/manual/faq/cloudsave/verificationissueforoverseasuser.html',
    src: '# 海外用戶雲存檔驗證問題說明\n',
    frontmatter: {},
  }])

  assert.equal(
    links['/manual/faq/cloudsave/verificationissueforoverseasuser'],
    '海外用戶雲存檔驗證問題說明',
  )
})

test('plain and rich Comments share Topic references, shortened URLs, and document titles', () => {
  const documentHref = 'https://yuanshen.site/docs/manual/client/fullscreen-windowed'
  const longHref = 'https://gitee.com/KYJGYSDT/a/very/long/path/that/keeps/going?query=full-value'
  const options = {
    topicHref: (id: string) => `/feedback/topic/${id}`,
    documentLinks: { '/manual/client/fullscreen-windowed': '窗口全屏/无边框窗口模式' },
  }

  const plain = renderForumComment(decodeForumText(`关联 #ICROD8 ${documentHref} ${longHref}`), options)
  assert.equal(plain.kind, 'html')
  if (plain.kind === 'html') {
    assert.match(plain.html, /forum-topic-reference/)
    assert.match(plain.html, /forum-document-link-icon/)
    assert.match(plain.html, />窗口全屏\/无边框窗口模式<\/a>/)
    assert.match(plain.html, /forum-external-link/)
    assert.match(plain.html, /gitee\.com\/KYJGYSDT\/a\/very\/long\/path\/that\/keeps\/…/)
  }

  const rich = renderForumComment(decodeForumText(JSON.stringify({
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [
        { type: 'text', text: '关联 #ICROD8；代码 ' },
        { type: 'text', text: '#IABCDE', marks: [{ type: 'code' }] },
        { type: 'text', text: documentHref, marks: [{ type: 'link', attrs: { href: documentHref } }] },
        { type: 'text', text: longHref, marks: [{ type: 'link', attrs: { href: longHref } }] },
      ],
    }],
  })), options)
  assert.equal(rich.kind, 'html')
  if (rich.kind === 'html') {
    assert.match(rich.html, /forum-topic-reference/)
    assert.match(rich.html, /<code>#IABCDE<\/code>/)
    assert.match(rich.html, /forum-document-link-icon/)
    assert.match(rich.html, />窗口全屏\/无边框窗口模式<\/a>/)
    assert.match(rich.html, /forum-external-link/)
  }
})

test('Topic special text leaves authored links, headings, and unsafe destinations alone', () => {
  const rendered = renderForumTopic([
    '# Heading',
    '![image](https://example.com/image.png)',
    '[custom label](https://example.com/a/very/long/path/that/must/not/change)',
    '#IABCDE',
  ].join('\n'), { topicHref: () => 'javascript:alert(1)' })

  assert.match(rendered, /# Heading/)
  assert.match(rendered, /!\[image\]\(https:\/\/example\.com\/image\.png\)/)
  assert.match(rendered, /\[custom label\]\(https:\/\/example\.com/)
  assert.equal(rendered.includes('<h1>'), false)
  assert.equal(rendered.includes('<img'), false)
  assert.equal(rendered.includes('<a'), false)
  assert.match(rendered, /#IABCDE/)
  assert.equal(rendered.includes('javascript:'), false)
})

test('plain Comments do not interpret Markdown syntax', () => {
  const rendered = renderForumComment(decodeForumText([
    '**bold**',
    '# Heading',
    '![image](https://example.com/image.png)',
    '[custom](https://gitee.com/KYJGYSDT)',
    '@lain718',
  ].join('\n')))

  assert.equal(rendered.kind, 'html')
  if (rendered.kind === 'html') {
    assert.match(rendered.html, /\*\*bold\*\*/)
    assert.match(rendered.html, /# Heading/)
    assert.match(rendered.html, /!\[image\]\(https:\/\/example\.com\/image\.png\)/)
    assert.match(rendered.html, /\[custom\]\(https:\/\/gitee\.com\/KYJGYSDT\)/)
    assert.match(rendered.html, /class="mention vp-link"/)
    assert.equal(/<(?:strong|h1|img)\b/u.test(rendered.html), false)
    assert.equal(rendered.html.includes('href="https://gitee.com/KYJGYSDT"'), false)
  }
})

test('Topic editor previews supported Markdown but keeps authored links and headings literal', () => {
  const allowedHref = 'https://gitee.com/KYJGYSDT'
  const documentHref = 'https://yuanshen.site/docs/manual/client/fullscreen-windowed'
  const longHref = 'https://gitee.com/KYJGYSDT/a/very/long/path/that/keeps/going?query=full-value'
  const extensions = createForumTopicEditorExtensions({
    documentLinks: {
      '/manual/client/fullscreen-windowed': '窗口全屏/无边框窗口模式',
    },
  })
  const editor = new Editor({
    extensions,
    content: `**bold** ${allowedHref} ${documentHref} ${longHref} [custom](${allowedHref}) # Heading`,
    contentType: 'markdown',
  })

  const doc = editor.getJSON()
  assert.equal(doc.content?.[0]?.content?.[0]?.marks?.[0]?.type, 'bold')
  assert.equal(doc.content?.[0]?.content?.[2]?.marks?.[0]?.type, 'link')
  const html = renderToHTMLString({ content: doc, extensions })
  assert.match(html, /data-link-display="窗口全屏\/无边框窗口模式"/)
  assert.match(html, /data-link-display="gitee\.com\/KYJGYSDT\/a\/very\/long\/path\/that\/keeps\/…"/)
  assert.equal(editor.getMarkdown(), `**bold** ${allowedHref} ${documentHref} ${longHref} [custom](${allowedHref}) # Heading`)
  editor.commands.setContent({
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [
        { type: 'mention', attrs: { id: '1', label: 'lain718' } },
        { type: 'text', text: ' ' },
        { type: 'topicReference', attrs: { id: 'ICROD8', label: '画板/路线功能' } },
      ],
    }],
  })
  assert.equal(editor.getMarkdown(), '@lain718 #ICROD8')
  editor.destroy()
})

test('Topic bodies keep code blocks as literal text instead of editor or rendered nodes', () => {
  const markdown = 'Before\n\n```js\nalert(1)\n```\n\nAfter'
  const extensions = createForumTopicEditorExtensions()
  const editor = new Editor({ extensions, content: markdown, contentType: 'markdown' })
  const extensionNames = resolveExtensions(extensions).map(extension => extension.name)
  const rendered = renderForumTopic(markdown)

  assert.equal(extensionNames.includes('codeBlock'), false)
  assert.equal(JSON.stringify(editor.getJSON()).includes('codeBlock'), false)
  assert.equal(rendered.includes('<pre'), false)
  assert.equal(rendered.includes('<code'), false)
  assert.match(rendered, /```js/)
  editor.destroy()
})

test('Topic detail and summary are the only forum surfaces that render body HTML', () => {
  const readSource = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
  const topicContent = readSource('src/components/forum/topic/ForumTopicContent.vue')
  const topicPageState = readSource('src/components/forum/topic/composables/useTopicPageState.ts')
  const topicPage = readSource('src/components/forum/topic/ForumTopicPage.vue')
  const translator = readSource('src/components/forum/topic/ForumTopicTranslator.vue')
  const forumHome = readSource('src/components/forum/home/ForumHome.vue')

  assert.match(topicContent, /renderForumTopicSummary\(contentOverride \?\? displayContent\.value/)
  assert.match(topicPageState, /renderForumTopic\(topic\.value\.content\.text/)
  assert.match(topicPage, /<ForumTopicTranslator\s+ref="translator"/)
  assert.match(topicPage, /:content="topic\.content\.text"/)
  assert.match(topicPage, /\{\{ translatedContent \}\}/)
  assert.equal(translator.includes('v-html'), false)
  assert.equal(forumHome.includes('v-html'), false)
  assert.equal(forumHome.includes('BlogPostAsTopic'), false)
  assert.equal(forumHome.includes('renderMarkdownPreview'), false)
})
