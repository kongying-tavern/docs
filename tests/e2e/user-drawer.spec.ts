import type { Page } from '@playwright/test'
import { alice, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { following: false } })

async function openTopicDetail(page: Page): Promise<void> {
  await page.goto('/feedback/topic/123')
  await expect(page.locator('[data-forum-shared-topic="author"]').first()).toBeVisible()
}

async function clickTopicAuthor(page: Page): Promise<void> {
  await page.locator('[data-forum-shared-topic="author"]').first().click()
}

async function assertDrawerActions(page: Page, secondLabel: string): Promise<void> {
  const content = page.locator('[data-slot="drawer-content"]')
  await expect(content).toBeVisible()
  await expect(content.locator('[data-slot="drawer-footer"] button')).toHaveCount(2)
  await expect(content.getByText('前往个人资料页')).toBeVisible()
  await expect(content.locator('[data-slot="drawer-footer"]').getByText(secondLabel)).toBeVisible()
}

test.describe('移动端用户 Drawer', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('未登录：点击用户打开 Drawer，按钮为 资料页 + 私信', async ({ page }) => {
    await openTopicDetail(page)

    await clickTopicAuthor(page)
    await assertDrawerActions(page, '私信')
    expect(page.url()).toContain('/feedback/topic/123')
  })

  test('已登录未关注：Drawer 第二按钮为 关注，点击后变为 私信', async ({ page }) => {
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())

    await openTopicDetail(page)
    await clickTopicAuthor(page)
    await assertDrawerActions(page, '关注')

    await page.locator('[data-slot="drawer-footer"]').getByText('关注').click()
    await assertDrawerActions(page, '私信')
  })

  test.describe('已关注', () => {
    test.use({ scenario: { following: true } })
    test('已登录已关注：Drawer 第二按钮为 私信', async ({ page }) => {
      await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())

      await openTopicDetail(page)
      await clickTopicAuthor(page)
      await assertDrawerActions(page, '私信')
    })
  })

  test.describe('本人', () => {
    test.use({ scenario: { user: alice, following: false } })
    test('本人查看自己的卡片：Drawer 不显示任何按钮', async ({ page }) => {
      await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())

      await openTopicDetail(page)
      await clickTopicAuthor(page)
      await expect(page.locator('[data-slot="drawer-content"]')).toBeVisible()
      await expect(page.locator('[data-slot="drawer-footer"]')).toHaveCount(0)
    })
  })

  test('前往个人资料页按钮跳转用户主页并关闭 Drawer', async ({ page }) => {
    await openTopicDetail(page)

    await clickTopicAuthor(page)
    await page.locator('[data-slot="drawer-footer"]').getByText('前往个人资料页').click()

    await expect(page).toHaveURL(/\/feedback\/user\/alice/)
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(0)
  })
})

test.describe('桌面端保持直跳', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('点击用户直接跳转，不出现 Drawer', async ({ page }) => {
    await openTopicDetail(page)

    await clickTopicAuthor(page)
    await expect(page).toHaveURL(/\/feedback\/user\/alice/)
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(0)
  })
})

test('桌面 hover 用户卡片显示作者信息', async ({ page }) => {
  await openTopicDetail(page)
  await page.locator('[data-forum-shared-topic="author"]').first().hover()
  const card = page.locator('[data-slot="hover-card-content"]')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Alice')
})
