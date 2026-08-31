import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * 论坛真实浏览器冒烟场景。
 *
 * 伪数据使用 Gitee API 原始形状（normalizeIssue/normalizeComment 的前置形态）。
 * 注意：
 * - playwright 按“后注册优先”匹配路由，通用端点必须先注册；
 * - `/issues/comments` 是独立全局端点，评论必须携带 target.issue.id；
 * - 类型从标题前缀解析（`FEAT:`），卡片模式会隐藏 BUG 类型的话题标题；
 * - 论坛 canonical URL 使用数字 id（`/feedback/topic/123`），根语言无语言前缀。
 */

const GITEE_ISSUE = {
  id: 900001,
  number: 123,
  html_url: 'https://gitee.com/KYJGYSDT/Feedback/issues/I123',
  title: 'FEAT:测试反馈路由可用',
  state: 'open',
  user: {
    id: 7,
    login: 'alice',
    name: 'Alice',
    avatar_url: '',
  },
  assignee: null,
  labels: [{ id: 1, name: 'FEAT', color: '#2bbc6e' }],
  comments: 2,
  created_at: '2026-08-01T10:00:00+08:00',
  updated_at: '2026-08-02T10:00:00+08:00',
  body: '正文内容：这是一条用于浏览器冒烟测试的反馈。',
}

const GITEE_COMMENT = {
  id: 99001,
  body: '这是一条评论。',
  user: { id: 8, login: 'moderator', name: 'Moderator', avatar_url: '' },
  comments: 0,
  created_at: '2026-08-01T12:00:00+08:00',
  updated_at: '2026-08-01T12:00:00+08:00',
  target: { issue: { id: 900001 } },
}

function mockGiteeRoutes(page: Page): void {
  // 列表（含 state/PINNED/过滤/排序查询串）——先注册，后注册的具体端点优先
  page.route('**/api/v5/repos/KYJGYSDT/Feedback/issues**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify([GITEE_ISSUE]) })
  })

  // 全局评论端点
  page.route('**/api/v5/repos/KYJGYSDT/Feedback/issues/comments**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify([GITEE_COMMENT]) })
  })

  // 单条评论
  page.route('**/api/v5/repos/KYJGYSDT/Feedback/issues/123/comments**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify([GITEE_COMMENT]) })
  })

  // 详情
  page.route('**/api/v5/repos/KYJGYSDT/Feedback/issues/123**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(GITEE_ISSUE) })
  })

  // reaction（未初始化话题返回 data.reaction: null）
  page.route('https://hub.interknot.site/api/reactions**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ state: true, message: '', data: { reaction: null } }),
    })
  })
}

test.beforeEach(async ({ page }) => {
  mockGiteeRoutes(page)
})

test('论坛列表渲染话题，点击标题进入详情并可返回列表', async ({ page }) => {
  await page.goto('/feedback')

  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
  await expect(page.locator('.forum-topic-item').first()).toContainText('测试反馈路由可用')

  await page.locator('.forum-topic-item h4').first().click()
  await page.waitForURL('**/feedback/topic/123')

  await expect(page.locator('h3#title, [data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')
  await expect(page.locator('[data-forum-shared-topic="content"], #content')).toContainText('正文内容')

  await page.goBack()
  await page.waitForURL('**/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
})

test('详情页深链直达并渲染标题与正文', async ({ page }) => {
  await page.goto('/feedback/topic/123')

  await expect(page.locator('h3#title, [data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')
  await expect(page.locator('[data-forum-shared-topic="content"], #content')).toContainText('正文内容')
  await expect(page.locator('[data-forum-shared-topic="author"]')).toContainText('Alice')
})

test('详情与列表之间前进/后退保持可交互', async ({ page }) => {
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)

  await page.locator('.forum-topic-item h4').first().click()
  await page.waitForURL('**/feedback/topic/123')
  await expect(page.locator('[data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')

  await page.goBack()
  await page.waitForURL('**/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)

  await page.goForward()
  await page.waitForURL('**/feedback/topic/123')
  await expect(page.locator('[data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')
})
