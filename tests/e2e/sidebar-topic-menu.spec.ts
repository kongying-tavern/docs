import { alice, currentUser, issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 1440, height: 900 }, scenario: { following: false, user: { ...currentUser, id: 2 }, topics: [issue({ user: { ...issue().user, id: 2, login: currentUser.login, name: currentUser.name } })], comments: [] } })

test('sidebar topics expose their actions on right click without an ellipsis button', async ({ page }) => {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('feedback')
  const section = page.locator('.forum-sidebar-section').first()
  const row = section.locator('.forum-sidebar-topic-row').first()
  await expect(row).toBeVisible()
  await expect(section.locator('.topic-btn-more')).toHaveCount(0)
  await row.hover()
  const preview = page.locator('.forum-sidebar-topic-preview')
  await expect(preview).toContainText('正文内容：这是一条用于浏览器冒烟测试的反馈。')
  await expect(preview).toHaveAttribute('data-side', 'right')
  await expect(preview.locator('.quoted-topic-card')).toHaveClass(/quoted-topic-card--embedded/)
  expect(await preview.locator('.quoted-topic-card').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  const rowBox = await row.boundingBox()
  const previewBox = await preview.boundingBox()
  expect(previewBox!.x).toBeGreaterThan(rowBox!.x + rowBox!.width)
  await row.click({ button: 'right' })
  await expect(page.getByRole('menuitem').filter({ hasText: 'Gitee' })).toBeVisible()
  await expect(preview).not.toBeVisible()
  await page.keyboard.press('Escape')
})

test('draft context menu opens the corresponding saved draft', async ({ page }) => {
  await page.addInitScript((auth) => {
    localStorage.setItem('USER-AUTH', auth)
    localStorage.setItem('forum-publish-form-data-feat', JSON.stringify({ type: 'FEAT', title: '侧栏草稿', text: '草稿正文', tags: [], savedAt: Date.now() - 120_000 }))
  }, localAuth())
  await page.goto('feedback')
  const draftRow = page.locator('.forum-sidebar-topic-row').filter({ hasText: '侧栏草稿' })
  await draftRow.hover()
  await expect(page.locator('.forum-sidebar-topic-preview')).toContainText('草稿正文')
  const time = page.locator('.forum-sidebar-topic-preview [data-forum-time]')
  await expect(time).toContainText('分钟前')
  await expect(time).not.toHaveAttribute('role', 'button')
  await page.setViewportSize({ width: 800, height: 900 })
  await expect(page.locator('.forum-sidebar-topic-preview')).toHaveCount(0)
  await page.setViewportSize({ width: 1440, height: 900 })
  await draftRow.click({ button: 'right' })
  await page.getByRole('menuitem', { name: '编辑草稿', exact: true }).click()
  await expect(page.locator('.compact-form #title')).toHaveValue('侧栏草稿')
})

test('empty submitted section uses a plus and opens the publish flow', async ({ page, scenario }) => {
  scenario.topics!.splice(0)
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('feedback')
  const summary = page.locator('.forum-sidebar-section').first().locator('summary')
  await expect(summary.locator('.i-lucide-plus')).toBeVisible()
  await summary.click()
  await expect(page.locator('[data-publish-type-chooser]')).toBeVisible()
})

test('guest empty submitted section uses the same login flow as publishing', async ({ page }) => {
  await page.goto('feedback')
  const summary = page.locator('.forum-sidebar-section').first().locator('summary')
  await expect(summary.locator('.i-lucide-plus')).toBeVisible()
  await summary.click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  const loginPrompt = await dialog.textContent()
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await page.locator('.forum-sidebar-action').click()
  await expect(dialog).toBeVisible()
  expect(await dialog.textContent()).toBe(loginPrompt)
})

test('draft deletion reuses confirmation and removes only the selected draft', async ({ page }) => {
  await page.addInitScript((auth) => {
    localStorage.setItem('USER-AUTH', auth)
    for (const type of ['FEAT', 'BUG'])
      localStorage.setItem(`forum-publish-form-data-${type.toLowerCase()}`, JSON.stringify({ type, title: `${type}待删除草稿`, text: '草稿正文', tags: [] }))
  }, localAuth())
  await page.goto('feedback')
  const row = page.locator('.forum-sidebar-topic-row').filter({ hasText: 'FEAT待删除草稿' })
  await row.click({ button: 'right' })
  const action = page.getByRole('menuitem', { name: '删除草稿', exact: true })
  await expect(action).toHaveAttribute('data-variant', 'destructive')
  await action.click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('删除这份草稿？')
  await expect(page.locator('.compact-form')).not.toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(row).toBeVisible()
  await expect(page.locator('.compact-form')).not.toBeVisible()
  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: '删除草稿', exact: true }).click()
  await dialog.getByRole('button', { name: '删除草稿', exact: true }).click()
  await expect(row).toHaveCount(0)
  await expect(page.locator('.forum-sidebar-topic-row').filter({ hasText: 'BUG待删除草稿' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('forum-publish-form-data-feat'))).toBeNull()
})

for (const [sectionIndex, followed] of [[1, false], [2, true]] as const) {
  test(`sidebar ${followed ? 'followed' : 'participated'} fallback menu and preview load on demand and recover from failure`, async ({ page, scenario, forum }) => {
    const topics = Array.from({ length: 6 }, (_, index) => issue({ number: `I${index + 100}`, title: `FEAT:个人列表话题 ${index}` }))
    scenario.topics!.splice(0, scenario.topics!.length, ...topics)
    const references = topics.map(topic => ({
      topicId: topic.number,
      title: topic.title.slice(5),
      type: 'FEAT',
      authorLogin: alice.login,
      recordedAt: topic.created_at,
      state: 'open',
    }))
    let state = { version: 1, followedTopics: references, recentParticipated: references }
    const gist = () => ({ id: 'sidebar-state', description: 'Kongying Forum State', public: false, files: { 'kongying-forum-state.json': { content: JSON.stringify(state) } } })
    let failDetail = true
    const detailPath = '/api/v5/repos/KYJGYSDT/Feedback/issues/I105'
    scenario.handle = (request) => {
      if (request.path === '/api/v5/gists')
        return { data: [gist()] }
      if (request.path === '/api/v5/gists/sidebar-state') {
        if (request.method === 'PATCH') {
          const update = JSON.parse(request.body as string)
          state = JSON.parse(update.files['kongying-forum-state.json'].content)
        }
        return { data: gist() }
      }
      if (request.path === detailPath && failDetail)
        return { status: 404, data: { message: 'Synthetic unavailable topic' } }
    }
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('feedback')
    const section = page.locator('.forum-sidebar-section').nth(sectionIndex)
    const row = section.locator('.forum-sidebar-topic-row').filter({ hasText: '个人列表话题 5' })
    await expect(row).toBeVisible()
    expect(forum.requests.filter(request => request.path === detailPath)).toHaveLength(0)
    await row.click({ button: 'right' })
    await expect(page.getByRole('menuitem').filter({ hasText: 'Gitee' })).toBeVisible()
    if (followed)
      await expect(page.getByRole('menuitem', { name: '取消关注', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.locator('.forum-sidebar-summary').first().hover()
    await row.hover()
    const preview = page.locator('.forum-sidebar-topic-preview')
    const retry = preview.getByRole('button', { name: '重试', exact: true })
    await expect(retry).toBeVisible()
    failDetail = false
    await retry.click()
    await expect(preview).toContainText('个人列表话题 5')
    await expect(preview).toContainText('正文内容')
    if (followed) {
      await row.click({ button: 'right' })
      await page.getByRole('menuitem', { name: '取消关注', exact: true }).click()
      await expect(row).toHaveCount(0)
      expect(state.followedTopics.map(topic => topic.topicId)).not.toContain('I105')
    }
  })
}

test('mobile sidebar draft deletion shows only confirmation and preserves the draft on cancel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript((auth) => {
    localStorage.setItem('USER-AUTH', auth)
    localStorage.setItem('forum-publish-form-data-feat', JSON.stringify({ type: 'FEAT', title: '移动删除草稿', text: '正文', tags: [] }))
  }, localAuth())
  await page.goto('feedback')
  await page.locator('.VPLocalNav').getByRole('button', { name: /Menu|菜单/ }).click()
  await page.locator('.forum-sidebar-topic-row').filter({ hasText: '移动删除草稿' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: '删除草稿', exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('删除这份草稿？')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.compact-form')).not.toBeVisible()
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('forum-publish-form-data-feat')!).title)).toBe('移动删除草稿')
  await page.locator('.VPLocalNav').getByRole('button', { name: /Menu|菜单/ }).click()
  await page.locator('.forum-sidebar-topic-row').filter({ hasText: '测试反馈路由可用' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: '设置状态', exact: true }).hover()
  const submenu = page.locator('[data-slot="dropdown-menu-sub-content"]')
  await expect(submenu).toBeVisible()
  const submenuItem = submenu.getByRole('menuitem').first()
  expect(await submenuItem.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
  })).toBe(true)
})
