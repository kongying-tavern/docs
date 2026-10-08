import { currentUser, localAuth } from './fixtures/gitee'
import { TELEMETRY_TOAST_MODULE, warmModules } from './support/modules'
import { expect, test } from './support/test'

test('mobile notifications stay at the top center and desktop preferences survive resizing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem('site-toast-position', 'bottom-left')
    localStorage.setItem('site-toast-duration', 'persistent')
  })
  await page.goto('/feedback')
  await page.reload()
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(() => {
    location.hash = 'settings/notifications'
  })
  await expect(page.getByRole('combobox', { name: '显示位置', exact: true })).toBeVisible()
  await warmModules(page, TELEMETRY_TOAST_MODULE)
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.info('通知位置回归', { report: false })
  })()`)
  const toaster = page.locator('[data-sonner-toaster]')
  const notification = page.locator('[data-sonner-toast]').filter({ hasText: '通知位置回归' })
  await expect(toaster).toHaveAttribute('data-x-position', 'left')
  await expect(toaster).toHaveAttribute('data-y-position', 'bottom')
  await expect(notification.locator('[data-close-button]')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('combobox', { name: '显示位置', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '通知', exact: true })).toHaveCount(0)

  await expect(notification.locator('[data-close-button]')).toHaveCount(0)
  await expect.poll(async () => {
    const box = await notification.boundingBox()
    return box && box.y >= 15 && box.y < 80 ? Math.abs(box.x + box.width / 2 - 195) : 100
  }).toBeLessThan(1)

  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(toaster).toHaveAttribute('data-x-position', 'left')
  await expect(toaster).toHaveAttribute('data-y-position', 'bottom')

  await expect(notification.locator('[data-close-button]')).toBeVisible()
  expect(await page.evaluate(() => [localStorage.getItem('site-toast-position'), localStorage.getItem('site-toast-duration')]))
    .toEqual(['bottom-left', 'persistent'])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.mouse.move(380, 800)
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.dismiss()
    toast.info('移动端默认时长', { report: false })
  })()`)
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: '移动端默认时长' })).toBeVisible()
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: '移动端默认时长' })).toHaveCount(0, { timeout: 7000 })
})

test('narrow error notifications keep trace copying and retry within the card', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await warmModules(page, TELEMETRY_TOAST_MODULE, '/components/telemetry/TelemetryToastDescription.vue')
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    const { default: Description } = await import('/components/telemetry/TelemetryToastDescription.vue')
    toast.error('无法保存反馈', {
      report: false,
      description: Description,
      componentProps: { content: '网络请求未完成，请稍后重试。', traceId: 'synthetic-session-ui-01234567' },
      duration: 60000,
      action: { label: '重试', onClick: () => { document.body.dataset.toastRetried = 'true' } },
    })
  })()`)
  const notification = page.locator('[data-sonner-toast]').filter({ hasText: '无法保存反馈' })
  await expect(notification.getByRole('button', { name: '重试', exact: true })).toBeVisible()
  const geometry = await notification.evaluate((element) => {
    const card = element.getBoundingClientRect()
    return {
      overflow: element.scrollWidth - element.clientWidth,
      buttonsInside: [...element.querySelectorAll('button')].every((button) => {
        const box = button.getBoundingClientRect()
        return box.left >= card.left && box.right <= card.right
      }),
    }
  })
  expect(geometry.overflow).toBeLessThanOrEqual(1)
  expect(geometry.buttonsInside).toBe(true)
  await notification.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page.locator('body')).toHaveAttribute('data-toast-retried', 'true')
})

test('language settings adapt to the panel width and tag actions keep their hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 700 })
  await page.goto('/feedback#settings/language')
  const row = page.locator('.language-tags-row')
  await expect(row).toBeVisible()
  expect(await row.evaluate(element => getComputedStyle(element).flexDirection)).toBe('column')
  const copyWidth = await row.locator('.settings-row-copy').evaluate(element => element.getBoundingClientRect().width)
  expect(copyWidth).toBeGreaterThan(400)
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect.poll(() => row.evaluate(element => getComputedStyle(element).flexDirection)).toBe('row')
  await page.goto('/feedback')
  await page.evaluate(`(async () => {
    const { useTopicTagsEditor } = await import('/forum/composables/state/useTopicTagsEditor.ts')
    useTopicTagsEditor().openTopicTagsEditorDialog({ id: '123', type: 'FEAT', tags: [] })
  })()`)
  const dialog = page.getByRole('dialog', { name: '编辑反馈标签（#123）' })
  await expect(dialog).toBeVisible()
  await expect.poll(() => dialog.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(425)
  await page.setViewportSize({ width: 390, height: 700 })
  expect(await dialog.locator('input').evaluate(element => getComputedStyle(element).fontSize)).toBe('16px')
  const submit = await dialog.getByRole('button', { name: '提交', exact: true }).boundingBox()
  const cancel = await dialog.getByRole('button', { name: '取消', exact: true }).boundingBox()
  expect(submit!.y).toBeLessThan(cancel!.y)
})

test.describe('compact form typography and confirmation bounds', () => {
  test.use({ scenario: { user: { ...currentUser, id: 2 }, following: false, comments: [] } })
  test('large UI text scales together and login confirmation remains scrollable at low height', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.addInitScript((auth) => {
      localStorage.setItem('USER-AUTH', auth)
      localStorage.setItem('site-ui-font-size', '18')
    }, localAuth())
    await page.goto('/feedback')
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    await page.locator('[data-publish-type-chooser]').getByRole('button').filter({ hasText: '我想要' }).click()
    const form = page.locator('.compact-form')
    await expect(form).toBeVisible()
    const fonts = await form.evaluate(element => Object.fromEntries(['#title', '.compact-heading-title', '.compact-toggle']
      .map(selector => [selector, Number.parseFloat(getComputedStyle(element.querySelector(selector)!).fontSize)])))
    expect(fonts['#title']).toBeCloseTo(22 * 18 / 14, 2)
    expect(fonts['.compact-heading-title']).toBeCloseTo(13 * 18 / 14, 2)
    expect(fonts['.compact-toggle']).toBeCloseTo(12 * 18 / 14, 2)
    await page.locator('.compact-close').click()
    await expect(form).toHaveCount(0)
    await page.evaluate(`(async () => {
      const { useUserAuthStore } = await import('/forum/stores/auth/useUserAuth.ts')
      useUserAuthStore().logout()
      location.hash = 'oauth-login-alert'
    })()`)
    const confirmation = page.locator('[data-slot=alert-dialog-content]')
    await expect(confirmation).toBeVisible()
    await expect.poll(() => confirmation.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(512)
    await page.setViewportSize({ width: 320, height: 200 })
    await expect.poll(() => confirmation.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return box.top >= 15 && box.bottom <= innerHeight - 15
    })).toBe(true)
    await confirmation.getByRole('button').last().scrollIntoViewIfNeeded()
    await expect(confirmation.getByRole('button').last()).toBeInViewport()
  })
})

test.describe('compact draft confirmation', () => {
  test.use({ scenario: { user: { ...currentUser, id: 2 }, following: false, comments: [] } })
  test('edited content offers draft saving and closing opens a reachable confirmation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
    await page.goto('/feedback')
    await page.getByRole('button', { name: '新建反馈', exact: true }).click()
    await page.locator('[data-publish-type-chooser]').getByRole('button').filter({ hasText: '我想要' }).click()
    const form = page.locator('.compact-form')
    await expect(page.locator('[data-publish-type-form]')).not.toHaveAttribute('inert', '')
    await form.locator('#title').fill('草稿确认回归')
    await expect(form.locator('#title')).toHaveValue('草稿确认回归')
    await form.locator('[contenteditable="true"]').fill('关闭之前保留的草稿内容')
    await expect(form.getByRole('button', { name: '保存草稿', exact: true })).toBeVisible()
    await page.locator('.compact-close').click()
    const confirmation = page.locator('[data-slot=alert-dialog-content]')
    await expect(confirmation).toBeVisible()
    await expect.poll(() => confirmation.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(512)
    const save = confirmation.getByRole('button', { name: '保存', exact: true })
    await expect.poll(() => save.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
    })).toBe(true)
    await page.setViewportSize({ width: 320, height: 200 })
    await expect.poll(() => confirmation.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return box.top >= 15 && box.bottom <= innerHeight - 15
    })).toBe(true)
    await confirmation.getByRole('button').last().scrollIntoViewIfNeeded()
    await expect(confirmation.getByRole('button').last()).toBeInViewport()
    const screenshotPath = test.info().outputPath('draft-confirmation-mobile.png')
    await page.screenshot({ path: screenshotPath })
    await test.info().attach('draft-confirmation-mobile', { path: screenshotPath, contentType: 'image/png' })
    await confirmation.getByRole('button', { name: '保存', exact: true }).click()
    await expect(confirmation).toHaveCount(0)
    const saved = await page.evaluate(async () => {
      const draftModule = '/forum/services/form/topicDraft.ts'
      const { readTopicDraft } = await import(draftModule)
      return readTopicDraft('FEAT')
    })
    expect(saved.title).toBe('草稿确认回归')
  })
})
