import { currentUser, issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ scenario: { following: false, topics: [issue()], comments: [] } })

test('real topic form retains rejected input and clears it only after a confirmed retry', async ({ page, scenario, forum }) => {
  let posts = 0
  scenario.handle = (request) => {
    if (request.method !== 'POST' || request.path !== '/api/v5/repos/KYJGYSDT/issues')
      return
    posts++
    if (posts === 1)
      return { data: { errors: ['Synthetic publication rejected'] } }
    const created = issue({ id: 900010, number: '777', title: 'FEAT:浏览器发布回归', body: '真实编辑器发布内容', comments: 0 })
    scenario.topics!.push(created)
    return { data: created }
  }
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  await page.goto('/feedback')
  await page.getByRole('button', { name: '新建反馈', exact: true }).click()
  const form = page.locator('.form-container')
  await expect(form).toBeVisible()
  await expect(page.locator('[data-publish-type-chooser]')).toHaveCount(0)
  await form.getByRole('button', { name: '我想要', exact: true }).click()
  await form.locator('#title').fill('浏览器发布回归')
  await form.locator('[contenteditable="true"]').fill('真实编辑器发布内容')
  await form.getByRole('button', { name: '提交反馈', exact: true }).click({ clickCount: 2 })
  await expect(form).toContainText('Synthetic publication rejected')
  await expect(form.locator('#title')).toHaveValue('浏览器发布回归')
  await expect(form.locator('[contenteditable="true"]')).toContainText('真实编辑器发布内容')
  expect(posts).toBe(1)
  await form.getByRole('button', { name: '提交反馈', exact: true }).click()
  await expect(form).toHaveCount(0)
  await expect(page.locator('.forum-topic-item').filter({ hasText: '浏览器发布回归' })).toHaveCount(1)
  expect(posts).toBe(2)
  expect(forum.requests.filter(request => request.method === 'POST' && request.path === '/api/v5/repos/KYJGYSDT/issues')).toHaveLength(2)
  await page.getByRole('button', { name: '新建反馈', exact: true }).click()
  await expect(page.locator('[data-publish-type-chooser]')).toHaveCount(0)
  await expect(form.locator('#title')).toHaveValue('')
  await expect(form.locator('[contenteditable="true"]')).toHaveText('')
})

test.describe('compact publish options', () => {
  test.use({ scenario: { following: false, user: { ...currentUser, id: 2 }, topics: [issue()], comments: [] } })
  test('reference search supports keyboard selection without filtering remote results twice', async ({ page, scenario }) => {
    scenario.topics!.splice(0, scenario.topics!.length, issue({ number: 'IABC123', comments: 0 }))
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('/feedback')
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    await page.locator('[data-publish-type-chooser]').getByRole('button').filter({ hasText: '我想要' }).click()
    const form = page.locator('.compact-form')
    await form.getByRole('button').filter({ hasText: '引用反馈' }).click()
    const input = page.getByPlaceholder('搜索反馈标题或 ID…')
    await input.fill('测试反馈')
    const option = page.getByRole('option').filter({ hasText: '测试反馈路由可用' })
    await expect(option).toBeVisible()
    await input.press('ArrowDown')
    await expect(input).toHaveAttribute('aria-activedescendant', /.+/)
    await input.press('Enter')
    await expect(input).toHaveCount(0)
    await expect(form).toContainText('测试反馈路由可用')
  })
  for (const width of [1280, 390]) {
    test(`privacy is sent to Gitee and create more appears on the next opening at width ${width}`, async ({ page, scenario }) => {
      await page.setViewportSize({ width, height: 900 })
      let posts = 0
      const privacy: boolean[] = []
      scenario.handle = (request) => {
        if (request.method !== 'POST' || request.path !== '/api/v5/repos/KYJGYSDT/issues')
          return
        posts++
        const privateFlag = /name="security_hole"\r\n\r\ntrue/.test(String(request.body))
        privacy.push(privateFlag)
        const created = issue({ id: 900010 + posts, number: String(777 + posts), title: 'FEAT:选项回归', comments: 0, security_hole: privateFlag })
        scenario.topics!.push(created)
        return { data: created }
      }
      await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
      await page.goto('/feedback')
      const open = async () => {
        await page.getByRole('button', { name: '新建反馈', exact: true }).click()
        await page.locator('[data-publish-type-chooser]').getByRole('button').filter({ hasText: '我想要' }).click()
      }
      await open()
      const form = page.locator('.compact-form')
      await expect(form.getByRole('switch', { name: '继续创建', exact: true })).toHaveCount(0)
      const privateSwitch = form.getByRole('switch', { name: '私密反馈', exact: true })
      await expect(privateSwitch).toHaveAttribute('aria-checked', 'false')
      await expect(form.locator('label[for="compact-private-feedback"]')).toHaveAttribute('title', '仅管理员可见')
      await expect(form.getByRole('button', { name: '仅管理员可见', exact: true })).toHaveCount(0)
      await privateSwitch.click()
      await expect(privateSwitch).toHaveAttribute('aria-checked', 'true')
      await form.locator('#title').fill('私密选项回归')
      await form.locator('[contenteditable="true"]').fill('这是一条私密反馈测试内容')
      await form.getByRole('button', { name: '提交反馈', exact: true }).click()
      await expect(form).toHaveCount(0)
      expect(privacy).toEqual([true])
      await open()
      const more = form.getByRole('switch', { name: '继续创建', exact: true })
      await expect(more).toBeVisible()
      await expect(privateSwitch).toHaveAttribute('aria-checked', 'false')
      const order = await form.locator('.compact-footer-actions').textContent() ?? ''
      expect(order.indexOf('继续创建')).toBeLessThan(order.indexOf('私密反馈'))
      expect(order.indexOf('私密反馈')).toBeLessThan(order.indexOf('提交反馈'))
      await more.click()
      await form.locator('#title').fill('公开选项回归')
      await form.locator('[contenteditable="true"]').fill('这是一条公开反馈测试内容')
      await form.getByRole('button', { name: '提交反馈', exact: true }).click()
      await expect(form.locator('#title')).toHaveValue('')
      await expect(form.locator('[contenteditable="true"]')).toHaveText('')
      expect(privacy).toEqual([true, false])
    })
  }
})
