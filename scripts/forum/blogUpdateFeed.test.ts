/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  describeBlogUpdate,
  getPostUpdatedAt,
  parseLatestUpdateEntry,
  RECENT_UPDATE_LIMIT,
  selectRecentBlogUpdates,
  toTimestamp,
} from '../../src/forum/services/blogUpdateFeed'

const COPY = {
  quoted: '{title}：{summary}',
  released: '{title}：已更新到 {version}',
  updated: '{title}：已更新',
}

/** 容器自身带日期 + 块内 `###` 分类标题（zh/changelog-web.md 的写法） */
const CONTAINER_DATE_POST = [
  '---',
  'title: "【网页版】更新日志"',
  '---',
  '',
  '::: timeline 2026-08-28',
  '',
  '### {%= T_BUG %}',
  '',
  '- 修改存档有差异时，本地和远程时间解析显示失败导致出现「未知时间」的问题。',
  '- 另一条不该被取到的更新。',
  '',
  ':::',
  '',
  '::: timeline 2026-08-26',
  '',
  '- 更早的更新，不应被取到。',
  '',
  ':::',
].join('\n')

/** 容器只有版本号、日期在块内 `##` 子标题上（zh/hotupdatelog-client.md 的写法） */
const HEADING_DATE_POST = [
  '::: timeline Rc1.1.0：',
  '',
  '## 2026-08-26-1413',
  '',
  '- 修复了一个{%= L_NORMAL %} bug，该 bug 曾导致某些语言的搜索栏有异常字体溢出。',
  '',
  '## 2026-08-26-1155',
  '',
  '- 存档时间改为时间戳存储，并兼容旧格式存档数据。',
  '',
  ':::',
].join('\n')

/** 容器带版本号与发布日、子标题日期为非补零写法（zh/hotupdatelog-autotrack.md 的写法） */
const VERSION_AND_HEADING_DATE_POST = [
  '::: timeline Beta 6.7.3：2026-07-19',
  '',
  '## 2026-8-16 06:49',
  '',
  '* 修正至冬 1 追踪的缩放问题',
  '',
  '## 2026-8-14 06:21',
  '',
  '* 适配原神 7.0 **至冬 1** 的追踪',
  '',
  ':::',
].join('\n')

test('parses git commit timestamps with their timezone offset', () => {
  assert.equal(toTimestamp('2026-08-31 14:34:33 +0800'), Date.UTC(2026, 7, 31, 6, 34, 33))
  assert.equal(toTimestamp('2026-08-31T14:34:33Z'), Date.UTC(2026, 7, 31, 14, 34, 33))
  assert.ok(Number.isNaN(toTimestamp('')))
  assert.ok(Number.isNaN(toTimestamp(undefined)))
})

test('prefers the git last-modified date and falls back to the creation date', () => {
  assert.equal(
    getPostUpdatedAt({ date: '2025-01-14 17:47:49 +0800', gitInfo: { lastModified: { date: '2026-08-31 14:34:33 +0800' } } }),
    Date.UTC(2026, 7, 31, 6, 34, 33),
  )
  assert.equal(
    getPostUpdatedAt({ date: '2025-01-14 17:47:49 +0800' }),
    Date.UTC(2025, 0, 14, 9, 47, 49),
  )
})

test('takes the container version and first bullet when the block carries the date', () => {
  assert.deepEqual(parseLatestUpdateEntry(CONTAINER_DATE_POST), {
    label: '',
    itemCount: 2,
    summary: '修改存档有差异时，本地和远程时间解析显示失败导致出现「未知时间」的问题。',
  })
})

test('reads the section under the newest dated subheading when the container has no date', () => {
  assert.deepEqual(parseLatestUpdateEntry(HEADING_DATE_POST), {
    label: 'Rc1.1.0',
    itemCount: 1,
    summary: '修复了一个 bug，该 bug 曾导致某些语言的搜索栏有异常字体溢出。',
  })
})

test('prefers the subheading section over the container release date', () => {
  assert.deepEqual(parseLatestUpdateEntry(VERSION_AND_HEADING_DATE_POST), {
    label: 'Beta 6.7.3',
    itemCount: 1,
    summary: '修正至冬 1 追踪的缩放问题',
  })
})

test('parses the halfwidth-colon version form used by the English posts', () => {
  assert.deepEqual(parseLatestUpdateEntry('::: timeline Rc1.0.1: 2025-01-15\n\n- Fixed the updater.\n\n:::'), {
    label: 'Rc1.0.1',
    itemCount: 1,
    summary: 'Fixed the updater.',
  })
})

test('counts only top-level bullets, leaving indented details with their parent', () => {
  const entry = parseLatestUpdateEntry([
    '::: timeline Beta 6.7.3：2026-07-19',
    '',
    '## 2026-8-16 06:49',
    '',
    '* 使用新的高效率索引算法 HNSW(分层导航小世界)',
    '  * 缓存大小：57.8MB--> 221MB',
    '  * 内存占用：455MB --> 357MB',
    '',
    ':::',
  ].join('\n'))

  assert.equal(entry?.itemCount, 1)
  assert.equal(entry?.summary, '使用新的高效率索引算法 HNSW(分层导航小世界)')
})

test('strips inline markdown and template macros from the summary', () => {
  const entry = parseLatestUpdateEntry([
    '::: timeline 2026-08-28',
    '',
    '- 适配原神 7.0 **[至冬 1](https://example.com)** 的追踪 `v2`',
    '',
    ':::',
  ].join('\n'))

  assert.equal(entry?.summary, '适配原神 7.0 至冬 1 的追踪 v2')
})

test('strips tag-like markup from the version label', () => {
  const entry = parseLatestUpdateEntry('::: timeline <del>Beta-7.0.1</del>\n\n- 问题版本，已移除\n\n:::')

  assert.equal(entry?.label, 'Beta-7.0.1')
  assert.equal(entry?.summary, '问题版本，已移除')
})

test('keeps comparison operators in summaries intact', () => {
  const entry = parseLatestUpdateEntry('::: timeline Beta-7.0.2\n\n* 下载速度极慢(<1KB/s)超过10秒将自动终止\n\n:::')

  assert.equal(entry?.summary, '下载速度极慢(<1KB/s)超过10秒将自动终止')
})

test('returns null when the post has no timeline container', () => {
  assert.equal(parseLatestUpdateEntry('普通文章，没有时间线。'), null)
  assert.equal(parseLatestUpdateEntry(undefined), null)
})

test('leads each line with its source, then quotes the change or names the version', () => {
  const base = { title: '【客户端】热更新日志', slug: 'hotupdatelog-client', updatedAt: 0 }

  assert.equal(
    describeBlogUpdate({ ...base, label: 'Rc1.1.0', itemCount: 1, summary: '修复了搜索栏字体溢出。' }, COPY),
    '客户端热更新日志：修复了搜索栏字体溢出。',
  )
  assert.equal(
    describeBlogUpdate({ ...base, label: 'Rc1.1.0', itemCount: 3, summary: '修复了搜索栏字体溢出。' }, COPY),
    '客户端热更新日志：已更新到 Rc1.1.0',
  )
  assert.equal(
    describeBlogUpdate({ ...base, label: '', itemCount: 2, summary: '更新了地区图标。' }, COPY),
    '客户端热更新日志：已更新',
  )
  assert.equal(
    describeBlogUpdate({ ...base, label: '', itemCount: 0, summary: '' }, COPY),
    '客户端热更新日志：已更新',
  )
})

test('selects only posts updated inside the window, newest first', () => {
  const now = Date.UTC(2026, 8, 16, 0, 0, 0)
  const posts = [
    { title: 'A', url: '/zh/blog/posts/a', content: CONTAINER_DATE_POST, date: '', lang: 'zh', gitInfo: { lastModified: { date: '2026-09-15 10:00:00 +0800' } } },
    { title: 'B', url: '/zh/blog/posts/b', content: HEADING_DATE_POST, date: '', lang: 'zh', gitInfo: { lastModified: { date: '2026-09-14 10:00:00 +0800' } } },
    { title: 'C', url: '/zh/blog/posts/c', date: '', lang: 'zh', gitInfo: { lastModified: { date: '2026-09-01 10:00:00 +0800' } } },
    { title: 'D', url: '/en/blog/posts/d', content: CONTAINER_DATE_POST, date: '', lang: 'en', gitInfo: { lastModified: { date: '2026-09-15 10:00:00 +0800' } } },
  ]

  const items = selectRecentBlogUpdates(posts, { lang: 'zh', now })

  assert.deepEqual(items.map(item => item.title), ['A', 'B', 'C'])
  assert.deepEqual(items.map(item => item.slug), ['a', 'b', 'c'])
  assert.deepEqual(items.map(item => item.itemCount), [2, 1, 0])
  assert.equal(items[1].label, 'Rc1.1.0')
})

test('excludes future-dated commits and caps the list length', () => {
  const now = Date.UTC(2026, 8, 16, 0, 0, 0)
  const posts = [
    { title: 'Future', url: '/zh/blog/posts/future', date: '', lang: 'zh', gitInfo: { lastModified: { date: '2026-09-20 10:00:00 +0800' } } },
    ...Array.from({ length: RECENT_UPDATE_LIMIT + 2 }, (_, index) => ({
      title: `P${index}`,
      url: `/zh/blog/posts/p${index}`,
      date: '',
      lang: 'zh',
      gitInfo: { lastModified: { date: `2026-09-${String(15 - index).padStart(2, '0')} 10:00:00 +0800` } },
    })),
  ]

  const items = selectRecentBlogUpdates(posts, { lang: 'zh', now, windowDays: 30 })

  assert.equal(items.length, RECENT_UPDATE_LIMIT)
  assert.ok(items.every(item => item.title !== 'Future'))
})

test('returns nothing when no post was updated inside the window', () => {
  const now = Date.UTC(2026, 8, 16, 0, 0, 0)
  const posts = [
    { title: 'A', url: '/zh/blog/posts/a', date: '', lang: 'zh', gitInfo: { lastModified: { date: '2026-04-30 10:00:00 +0800' } } },
  ]

  assert.deepEqual(selectRecentBlogUpdates(posts, { lang: 'zh', now }), [])
})

test('keeps posts without a timeline so new articles still surface', () => {
  const now = Date.UTC(2026, 8, 16, 0, 0, 0)
  const posts = [
    { title: '新品发布', url: '/zh/blog/posts/launch', date: '', lang: 'zh', gitInfo: { lastModified: { date: '2026-09-15 10:00:00 +0800' } } },
  ]

  const [item] = selectRecentBlogUpdates(posts, { lang: 'zh', now })

  assert.equal(item.slug, 'launch')
  assert.equal(item.itemCount, 0)
  assert.equal(item.summary, '')
  assert.equal(item.label, '')
})
