/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { resolveExtensions } from '@tiptap/core'
import { decodeCommentBody, decodeForumText, decodeTopicBody, updateTopicMetadata } from '../services/forumContentCodec'
import {
  renderForumComment,
  renderForumTopic,
  renderForumTopicSummary,
  renderTiptapToHtml,
} from '../services/forumContentRenderer'
import { buildForumDocumentLinks } from '../services/forumDocumentLinkIndex'
import { forumTextToEditorDoc } from '../services/forumLegacyContent'
import { isAllowedForumHref } from '../services/forumLinkPolicy'
import { createForumContentExtensions, createForumTopicEditorExtensions } from '../services/forumTiptapExtensions'
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
  assert.match(html, /https:\/\/example\.com\/path\?q=1/)
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

test('non-allowlisted rich links shorten their real URL and expose the full destination on hover', () => {
  const href = `https://outside.example/path/${'long/'.repeat(16)}?q=1&next=2`
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'text', text: 'https://yuanshen.site 安全入口', marks: [{ type: 'link', attrs: { href } }] },
  ] }] }
  const decoded = decodeForumText(JSON.stringify(doc))
  const comment = renderForumComment(decoded)
  assert.equal(comment.kind, 'html')
  const surfaces = [renderTiptapToHtml(doc), renderForumTopic(decoded), renderForumTopicSummary(decoded)]
  if (comment.kind === 'html')
    surfaces.push(comment.html)
  for (const html of surfaces) {
    assert.match(html, /<span class="forum-external-link" title="https:\/\/outside\.example\/path\//)
    assert.equal(html.includes(href.replaceAll('&', '&amp;')), true)
    assert.match(html, />outside\.example\/path\/.*…<\/span>/)
    assert.equal(html.includes('安全入口'), false)
    assert.equal(html.includes('<a'), false)
  }
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

test('Legacy Topic conversion disables raw HTML, allowlists links, and preserves JSON-looking text', () => {
  const rendered = renderForumTopic('123\nhttps://gitee.com/KYJGYSDT\nhttps://example.com\n<script>alert(1)</script>')

  assert.match(rendered, /^<p>123<br>/)
  assert.match(rendered, /href="https:\/\/gitee\.com\/KYJGYSDT"/)
  assert.equal(rendered.includes('href="https://example.com"'), false)
  assert.match(rendered, /https:\/\/example\.com/)
  assert.equal(rendered.includes('<script>'), false)
  assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})

test('Topic paragraph breaks keep inline Markdown nesting valid', () => {
  assert.equal(
    renderForumTopic('**first\nsecond**'),
    '<p><strong>first<br>\nsecond</strong></p>',
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

test('pasted site Topic URLs render as internal Topic references', () => {
  const href = 'https://yuanshen.site/docs/feedback/topic/ID4TLH'
  const localizedHref = 'https://yuanshen.site/docs/zh/feedback/topic/ICROD8/'
  const options = { topicHref: (id: string) => `/feedback/topic/${id}` }

  for (const rendered of [
    renderForumTopic(`关联 ${href} 和 ${localizedHref}`, options),
    renderForumTopicSummary(href, options),
  ]) {
    assert.match(rendered, /class="vp-link forum-topic-reference"/)
    assert.match(rendered, /href="\/feedback\/topic\/ID4TLH"[^>]*>#ID4TLH<\/a>/)
    if (rendered.includes('ICROD8'))
      assert.match(rendered, /href="\/feedback\/topic\/ICROD8"[^>]*>#ICROD8<\/a>/)
    assert.equal(rendered.includes('forum-external-link'), false)
  }

  const plain = renderForumComment(decodeForumText(href), options)
  assert.equal(plain.kind, 'html')
  if (plain.kind === 'html')
    assert.match(plain.html, /href="\/feedback\/topic\/ID4TLH">#ID4TLH<\/a>/)

  const rich = renderForumComment(decodeForumText(JSON.stringify({
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }],
    }],
  })), options)
  assert.equal(rich.kind, 'html')
  if (rich.kind === 'html')
    assert.match(rich.html, /href="\/feedback\/topic\/ID4TLH">#ID4TLH<\/a>/)

  const customLabel = renderTiptapToHtml({
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: '保留文案', marks: [{ type: 'link', attrs: { href } }] }],
    }],
  }, options)
  assert.match(customLabel, />保留文案<\/a>/)
  assert.equal(customLabel.includes('#ID4TLH'), false)

  const authored = renderForumTopic(`[保留文案](${href})`, options)
  assert.match(authored, /\[保留文案\]\(https:\/\/yuanshen\.site/)
  assert.equal(authored.includes('forum-topic-reference'), false)
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

test('Topic JSON preserves formatting, references and attachments across decode and render', () => {
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
    { type: 'topicReference', attrs: { id: 'ICROD8', label: 'topic' } },
    { type: 'mention', attrs: { id: '1', label: 'alice' } },
  ] }] }
  const decoded = decodeTopicBody(`<!-- {"state":"open"} -->${JSON.stringify(doc)}\n![attachment](https://assets.example/a.webp)`)
  assert.equal(decoded.content.kind, 'tiptap')
  assert.match(decoded.content.text, /bold#ICROD8@alice/)
  assert.equal(decoded.metadata.state, 'open')
  assert.equal(decoded.attachments?.length, 1)
  assert.deepEqual(forumTextToEditorDoc(JSON.stringify(doc)), doc)
  for (const html of [renderForumTopic(decoded.content, { topicHref: id => `/feedback/topic/${id}` }), renderForumTopicSummary(decoded.content)]) {
    assert.match(html, /<strong>bold<\/strong>/)
    assert.match(html, /#ICROD8/)
    assert.match(html, /@alice/)
    assert.equal(html.includes('"type"'), false)
  }
  const names = resolveExtensions(createForumTopicEditorExtensions()).map(extension => extension.name)
  assert.equal(names.includes('markdown'), false)
})

test('legacy Topic conversion keeps code blocks literal and preserves supported inline marks', () => {
  const source = '**bold**\n\n```js\nalert(1)\n```'
  const doc = forumTextToEditorDoc(source)
  const rendered = renderForumTopic(source)
  assert.equal(JSON.stringify(doc).includes('codeBlock'), false)
  assert.match(rendered, /<strong>bold<\/strong>/)
  assert.match(rendered, /```js/)
  assert.equal(rendered.includes('<pre'), false)
})

test('rich body text survives legacy attachment and metadata syntax verbatim', () => {
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '![literal](https://gitee.com/image.png) <!-- {"state":"closed"} --> "quoted"' }] }] }
  const json = JSON.stringify(doc)
  const body = `<!-- {"state":"open"} -->${json}\n![attachment](https://assets.example/a.webp)`
  for (const decode of [decodeTopicBody, decodeCommentBody]) {
    const decoded = decode(body)
    assert.equal(decoded.content.kind, 'tiptap')
    if (decoded.content.kind === 'tiptap')
      assert.deepEqual(decoded.content.doc, doc)
    assert.equal(decoded.attachments?.length, 1)
  }
  const updated = decodeTopicBody(updateTopicMetadata(body, { state: 'closed' }))
  assert.equal(updated.metadata.state, 'closed')
  assert.equal(updated.content.kind, 'tiptap')
  if (updated.content.kind === 'tiptap')
    assert.deepEqual(updated.content.doc, doc)
})

test('rich code blocks keep URLs and Topic references literal', () => {
  const source = 'https://gitee.com/alice #ICROD8 @alice'
  const html = renderTiptapToHtml({ type: 'doc', content: [{ type: 'codeBlock', content: [{ type: 'text', text: source }] }] }, { topicHref: id => `/feedback/topic/${id}` })
  assert.equal(html, `<pre><code>${source}</code></pre>`)
})
