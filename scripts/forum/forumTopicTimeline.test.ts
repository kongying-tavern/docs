/* eslint-disable test/no-import-node-test */
import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { buildTopicOperateLogsRequest } from '../../src/forum/api/gitee/issues'
import { normalizeTopicTimeline } from '../../src/forum/api/gitee/normalize'
import { TOPIC_STATUS_DEFINITIONS } from '../../src/forum/services/forumTopicStatus'
import { TOPIC_STATE_ICON, TOPIC_STATUS_ICON } from '../../src/forum/services/forumTopicStatusIcon'
import { ensureTopicTimelineAnchor, hasTopicTimelineChanges } from '../../src/forum/services/forumTopicTimeline'

// 取自已登录会话对 KYJGYSDT/Feedback 的真实响应
const MEMBER = { id: 8901509, login: 'zengjias', name: '(^_^)', avatar_url: 'https://example.test/a.png', html_url: 'https://gitee.com/zengjias' } as unknown as GITEE.User
const BOT = { id: 14647057, login: 'kongying-demo', name: 'demo', avatar_url: 'https://example.test/b.png', html_url: 'https://gitee.com/kongying-demo' } as unknown as GITEE.User

let nextId = 1

function log(
  action_type: string,
  after_change_value: string,
  created_at: string,
  user: GITEE.User = MEMBER,
): GITEE.OperateLog {
  // Gitee 对标签的增删都不填 before_change_value，标签名只在 after_change_value
  return { id: nextId++, action_type, after_change_value, before_change_value: '', created_at, user }
}

test('operate_logs request uses the owner route with repo as a query param', () => {
  const request = buildTopicOperateLogsRequest('IKERKK')

  // Gitee 只提供 owner 级路径：repos/{owner}/{repo}/issues/{number}/operate_logs 会 404
  assert.equal(request.endpoint, 'repos/KYJGYSDT/issues/IKERKK/operate_logs')
  assert.deepEqual(request.searchParams, { repo: 'Feedback', sort: 'asc' })
})

test('every display status and every Gitee state has a timeline icon', () => {
  for (const definition of TOPIC_STATUS_DEFINITIONS)
    assert.ok(TOPIC_STATUS_ICON[definition.id], `missing timeline icon for ${definition.id}`)

  assert.ok(TOPIC_STATUS_ICON.closed, 'missing timeline icon for closed')
  assert.ok(TOPIC_STATUS_ICON['good-issue'], 'missing timeline icon for good-issue')

  for (const state of ['open', 'progressing', 'closed'] as const)
    assert.ok(TOPIC_STATE_ICON[state], `missing timeline icon for state ${state}`)

  // 已结(progressing)必须区别于已归档(closed)：两者展示状态相同，图标若也一样就退化成同一个语义
  assert.notEqual(TOPIC_STATE_ICON.progressing, TOPIC_STATE_ICON.closed)
})

test('every mapped timeline icon actually exists in the lucide collection', async () => {
  // 图标名写错时 UnoCSS 只在构建期告警、页面静默空白，故按已安装集合逐个校验
  const raw = await readFile(new URL('../../node_modules/@iconify-json/lucide/icons.json', import.meta.url), 'utf8')
  const collection = JSON.parse(raw) as { icons: Record<string, unknown>, aliases?: Record<string, unknown> }
  const available = new Set([...Object.keys(collection.icons), ...Object.keys(collection.aliases ?? {})])

  for (const [key, icon] of Object.entries({ ...TOPIC_STATUS_ICON, ...TOPIC_STATE_ICON })) {
    assert.ok(icon.startsWith('i-lucide-'), `${key}: "${icon}" is not a lucide class`)
    const name = icon.slice('i-lucide-'.length)
    assert.ok(available.has(name), `${key}: lucide has no icon named "${name}"`)
  }
})

test('a real payload collapses to created + state + label-status nodes only', () => {
  const events = normalizeTopicTimeline([
    log('create', '任务', '2026-09-10T16:11:14+08:00'),
    log('add_label', 'DEV-TEST', '2026-09-10T16:11:14+08:00'),
    log('add_label', 'LC-ZH', '2026-09-10T16:11:14+08:00'),
    log('add_label', 'CATA-CLIENT-PLATFORM', '2026-09-10T16:11:14+08:00'),
    // 机器人整组重放 labels：同一批标签反复增删，不应产生节点
    log('remove_label', 'DEV-TEST', '2026-09-10T16:11:15+08:00', BOT),
    log('remove_label', 'LC-ZH', '2026-09-10T16:11:15+08:00', BOT),
    log('remove_label', 'CATA-CLIENT-PLATFORM', '2026-09-10T16:11:15+08:00', BOT),
    log('add_label', 'DEV-TEST', '2026-09-10T16:11:15+08:00', BOT),
    log('add_label', 'LC-ZH', '2026-09-10T16:11:15+08:00', BOT),
    log('add_label', 'GOOD-ISSUE', '2026-09-10T16:11:15+08:00', BOT),
    log('remove_label', 'GOOD-ISSUE', '2026-09-10T16:34:00+08:00'),
    log('add_label', 'ST-BLOCKED', '2026-09-10T16:34:00+08:00'),
    log('change_issue_state', '已完成', '2026-09-10T16:52:00+08:00'),
    // 与状态流转重复（正文内嵌 {"state":"closed"} 元数据），不成节点
    log('change_description', '<!-- {"state":"closed"} -->testsss', '2026-09-10T16:52:00+08:00'),
    log('remove_label', 'ST-BLOCKED', '2026-09-10T16:52:00+08:00'),
    log('add_label', 'ST-INVALID', '2026-09-10T16:52:00+08:00'),
  ])

  assert.deepEqual(events.map(event => event.kind), ['created', 'status', 'state', 'status'])

  assert.equal(events[0]?.actor?.login, 'zengjias')

  assert.equal(events[1]?.to, 'blocked')
  assert.equal(events[1]?.from, undefined)

  assert.equal(events[2]?.state, 'closed')

  // 一次整组 labels 提交先删旧再加新，合并为单次迁移而非「清除 + 设置」
  assert.equal(events[3]?.from, 'blocked')
  assert.equal(events[3]?.to, 'invalid')
})

test('a topic with neither state nor status history collapses to the created anchor', () => {
  const events = normalizeTopicTimeline([
    log('create', '任务', '2026-09-16T17:18:00+08:00'),
    log('add_label', 'WEB-FEEDBACK', '2026-09-16T17:18:00+08:00', BOT),
    log('add_label', 'LC-ZH', '2026-09-16T17:18:00+08:00', BOT),
    log('add_label', 'CATA-ALL-PLATFORM', '2026-09-16T17:18:00+08:00', BOT),
  ])

  assert.deepEqual(events.map(event => event.kind), ['created'])
  assert.equal(hasTopicTimelineChanges(events), false)
})

test('state transitions stay chronological and repeat same-state entries collapse', () => {
  const events = normalizeTopicTimeline([
    log('create', '任务', '2026-03-31T12:59:00+08:00'),
    log('change_issue_state', '已完成', '2026-03-31T22:09:00+08:00'),
    log('change_issue_state', '已完成', '2026-03-31T22:09:00+08:00'),
    log('change_issue_state', '进行中', '2026-04-01T12:25:00+08:00'),
    log('change_issue_state', '已完成', '2026-04-01T12:26:00+08:00'),
  ])

  assert.deepEqual(events.map(event => event.state), [undefined, 'closed', 'progressing', 'closed'])
  assert.equal(hasTopicTimelineChanges(events), true)
})

test('a lone status removal reads as cleared rather than a transition', () => {
  const events = normalizeTopicTimeline([
    log('create', '任务', '2026-01-01T00:00:00+08:00'),
    log('add_label', 'ST-CONFIRMED', '2026-01-02T00:00:00+08:00'),
    log('remove_label', 'ST-CONFIRMED', '2026-01-03T00:00:00+08:00'),
  ])

  assert.equal(events.length, 3)
  assert.equal(events[1]?.to, 'confirmed')
  assert.equal(events[2]?.from, 'confirmed')
  assert.equal(events[2]?.to, undefined)
})

test('unrecognized state titles fall back to the provider label instead of being dropped', () => {
  const events = normalizeTopicTimeline([
    log('create', '任务', '2026-01-01T00:00:00+08:00'),
    log('change_issue_state', '已拒绝', '2026-01-02T00:00:00+08:00'),
  ])

  assert.equal(events[1]?.kind, 'state')
  assert.equal(events[1]?.state, undefined)
  assert.equal(events[1]?.stateLabel, '已拒绝')
})

test('events are ordered by timestamp even when the payload is not', () => {
  const events = normalizeTopicTimeline([
    log('change_issue_state', '已完成', '2026-01-05T00:00:00+08:00'),
    log('create', '任务', '2026-01-01T00:00:00+08:00'),
    log('add_label', 'ST-FIXED', '2026-01-03T00:00:00+08:00'),
  ])

  assert.deepEqual(events.map(event => event.kind), ['created', 'status', 'state'])
})

test('missing provider fields and empty payloads degrade without throwing', () => {
  assert.deepEqual(normalizeTopicTimeline([]), [])

  // 老版本部署缺少 before/after 与 user 字段
  const events = normalizeTopicTimeline([
    { id: 1, created_at: '2026-01-01T00:00:00+08:00', action_type: 'create' },
    { id: 2, created_at: '2026-01-02T00:00:00+08:00', action_type: 'add_label' },
    { id: 3, created_at: '2026-01-03T00:00:00+08:00' },
  ])

  assert.deepEqual(events.map(event => event.kind), ['created'])
  assert.equal(events[0]?.actor, undefined)
})

test('label events without before/after values fall back to the content text', () => {
  // 老 SDK 模型只给 content（实测形如「添加了 &nbsp; DEV-TEST 标签」），仍要能认出状态标签
  const events = normalizeTopicTimeline([
    { id: 1, created_at: '2026-01-01T00:00:00+08:00', action_type: 'create', after_change_value: '任务' },
    { id: 2, created_at: '2026-01-02T00:00:00+08:00', action_type: 'add_label', content: '添加了      \n        &nbsp;\n        ST-BLOCKED\n      \n标签' },
    { id: 3, created_at: '2026-01-03T00:00:00+08:00', action_type: 'remove_label', content: '移除了 ST-BLOCKED 标签' },
  ])

  assert.deepEqual(events.map(event => event.kind), ['created', 'status', 'status'])
  assert.equal(events[1]?.to, 'blocked')
  assert.equal(events[2]?.from, 'blocked')
})

test('the created anchor is filled in from the topic when the log lacks a create entry', () => {
  const topic = { id: 'IKERKK', createdAt: '2026-01-01T00:00:00+08:00', user: { id: 1, login: 'alice', username: 'Alice' } as ForumAPI.User }
  const events = normalizeTopicTimeline([
    log('add_label', 'ST-FIXED', '2026-01-02T00:00:00+08:00'),
  ])

  const anchored = ensureTopicTimelineAnchor(events, topic)
  assert.deepEqual(anchored.map(event => event.kind), ['created', 'status'])
  assert.equal(anchored[0]?.at, '2026-01-01T00:00:00+08:00')
  assert.equal(anchored[0]?.actor?.login, 'alice')

  // 日志自带 create 条目时不得重复补锚点
  const withCreate = normalizeTopicTimeline([
    log('create', '任务', '2026-01-01T00:00:00+08:00'),
    log('add_label', 'ST-FIXED', '2026-01-02T00:00:00+08:00'),
  ])
  assert.deepEqual(ensureTopicTimelineAnchor(withCreate, topic), withCreate)
  assert.equal(hasTopicTimelineChanges(ensureTopicTimelineAnchor([], topic)), false)
})
