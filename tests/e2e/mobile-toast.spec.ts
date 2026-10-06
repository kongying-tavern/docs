import { expect, test } from './support/test'

async function swipeToast(page: import('@playwright/test').Page, notification: import('@playwright/test').Locator) {
  const box = await notification.boundingBox()
  const session = await page.context().newCDPSession(page)
  const startX = box!.x + box!.width / 2
  const y = box!.y + 20
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] })
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + 130 * step / 8, y }] })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  finally {
    await session.detach()
  }
}

test('mobile burst gives each notification its full display duration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.info('第一条', { report: false })
    setTimeout(() => toast.warning('第二条', { report: false }), 350)
    setTimeout(() => toast.success('第三条'), 700)
  })()`)
  const front = page.locator('[data-sonner-toast][data-visible=true]')
  await expect(front).toContainText('第一条')
  await page.waitForTimeout(1200)
  await expect(front).toContainText('第一条')
  await expect(front).toContainText('第二条', { timeout: 6000 })
  await page.waitForTimeout(1200)
  await expect(front).toContainText('第二条')
  await expect(front).toContainText('第三条', { timeout: 6000 })
  await page.waitForTimeout(1200)
  await expect(front).toContainText('第三条')
  await expect(front).toHaveCount(0, { timeout: 6000 })
})

test('mobile queue advances through actions and touch dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.success('已移除', { action: { label: '撤销', onClick: () => {} } })
    const id = toast.loading('排队加载')
    toast.success('加载完成', { id, duration: Infinity })
    toast.info('最后一条', { report: false, duration: Infinity })
  })()`)
  const front = page.locator('[data-sonner-toast][data-visible=true]')
  await expect(front).toContainText('已移除')
  await front.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(front).toContainText('加载完成')
  await expect(front).toHaveAttribute('data-mounted', 'true')
  await page.waitForTimeout(450)
  await swipeToast(page, front)
  await expect(front).toContainText('最后一条')
})

test('mobile diagnostics remain readable after the originating toast is dismissed', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.error('评论发送失败', {
      id: 'diagnostic-error', report: false,
      description: '请检查网络连接后重试。',
      error: new Error('POST /comments failed: ' + 'long-diagnostic-identifier-'.repeat(8)),
      action: { label: '重试', onClick: () => { document.body.dataset.toastRetried = 'true' } },
    })
  })()`)
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: '评论发送失败' })
  await expect(toast).toBeVisible()
  await expect(toast).toHaveAttribute('data-mounted', 'true')
  await page.waitForTimeout(450)
  await expect(toast.locator('.telemetry-detail')).toHaveCount(0)
  await expect(toast.getByRole('button', { name: '关闭', exact: true })).toHaveCount(0)
  const geometry = await toast.evaluate((element) => {
    const card = element.getBoundingClientRect()
    const action = element.querySelector('[data-action]')!.getBoundingClientRect()
    const content = element.querySelector('.telemetry-body')!.getBoundingClientRect()
    const details = element.querySelector('.telemetry-details-button')!.getBoundingClientRect()
    return {
      overflow: element.scrollWidth - element.clientWidth,
      actionHeight: action.height,
      actionHitHeight: action.height + 8,
      belowText: action.top >= content.bottom,
      rightAligned: Math.abs(action.right - content.right) < 1,
      sameRow: Math.abs(action.y + action.height / 2 - details.y - details.height / 2) < 1,
      separated: details.right <= action.left,
      centered: Math.abs(card.x + card.width / 2 - innerWidth / 2),
      font: getComputedStyle(element).fontSize,
      paddingLeft: getComputedStyle(element).paddingLeft,
      paddingRight: getComputedStyle(element).paddingRight,
      buttonsInside: [...element.querySelectorAll('button')].filter(button => button.getClientRects().length > 0).every((button) => {
        const box = button.getBoundingClientRect()
        const hitHeight = box.height + (button.hasAttribute('data-button') ? 8 : 0)
        return box.left >= card.left - 1 && box.right <= card.right + 1 && hitHeight >= 43.9
      }),
    }
  })
  expect(geometry).toMatchObject({ font: '14px', paddingLeft: '16px', paddingRight: '16px', belowText: true, rightAligned: true, sameRow: true, separated: true, buttonsInside: true })
  expect(geometry.overflow).toBeLessThanOrEqual(1)
  expect(geometry.actionHeight).toBeGreaterThanOrEqual(36)
  expect(geometry.actionHitHeight).toBeGreaterThanOrEqual(44)
  expect(geometry.centered).toBeLessThan(1)
  await expect.poll(() => toast.evaluate(element => Number(getComputedStyle(element).opacity))).toBe(1)
  await page.waitForTimeout(450)
  await page.screenshot({ path: test.info().outputPath('mobile-toast-320.png') })
  for (const width of [360, 390, 430, 820]) {
    await page.setViewportSize({ width, height: 844 })
    await expect.poll(() => toast.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return Math.abs(box.x + box.width / 2 - innerWidth / 2)
    })).toBeLessThan(1)
    expect(await toast.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  }
  await page.setViewportSize({ width: 320, height: 700 })
  await toast.getByRole('button', { name: '查看错误详情', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '评论发送失败', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('pre')).toContainText('POST /comments failed')
  const diagnosticText = await dialog.locator('pre').textContent()
  await dialog.getByRole('button', { name: '复制错误信息', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '已复制', exact: true })).toBeVisible()
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(diagnosticText)
  await page.setViewportSize({ width: 320, height: 240 })
  await expect.poll(() => dialog.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return box.top >= 15 && box.bottom <= innerHeight - 15
  })).toBe(true)
  await dialog.getByRole('button', { name: '复制错误信息', exact: true }).scrollIntoViewIfNeeded()
  await expect(dialog.getByRole('button', { name: '复制错误信息', exact: true })).toBeInViewport()
  await page.screenshot({ path: test.info().outputPath('mobile-diagnostics-landscape.png') })
  await page.setViewportSize({ width: 320, height: 700 })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(toast.getByRole('button', { name: '查看错误详情', exact: true })).toBeFocused()
  await toast.getByRole('button', { name: '查看错误详情', exact: true }).click()
  await expect(dialog).toBeVisible()
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.dismiss('diagnostic-error')
  })()`)
  await expect(toast).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '复制错误信息', exact: true })).toBeVisible()
  expect(await dialog.locator('pre').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('mobile errors persist and explicit expiry still wins', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.error('需要处理的错误', { report: false, id: 'persistent-error' })
  })()`)
  const persistent = page.locator('[data-sonner-toast]').filter({ hasText: '需要处理的错误' })
  await expect(persistent).toBeVisible()
  await page.mouse.move(380, 800)
  await page.waitForTimeout(4500)
  await expect(persistent).toBeVisible()
  await swipeToast(page, persistent)
  await expect(persistent).toHaveCount(0)
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.error('显式短暂提示', { report: false, duration: 1000 })
  })()`)
  const temporary = page.locator('[data-sonner-toast]').filter({ hasText: '显式短暂提示' })
  await expect(temporary).toBeVisible()
  await expect(temporary).toHaveCount(0, { timeout: 4000 })
})

test('desktop error layout and configured timing stay unchanged after mobile use', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    localStorage.setItem('site-toast-position', 'bottom-left')
    localStorage.setItem('site-toast-duration', '4000')
  })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.error('桌面错误回归', {
      report: false, error: new Error('Concrete desktop error'),
      action: { label: '重试', onClick: () => {} },
    })
  })()`)
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: '桌面错误回归' })
  await expect(toast).toBeVisible()
  await expect(toast.locator('.telemetry-detail')).toHaveText('Concrete desktop error')
  await expect(toast.getByRole('button', { name: '查看错误详情', exact: true })).toHaveCount(0)
  await expect(toast.locator('[data-close-button]')).toHaveCount(0)
  await expect(page.locator('[data-sonner-toaster]')).toHaveAttribute('data-x-position', 'left')
  await expect(page.locator('[data-sonner-toaster]')).toHaveAttribute('data-y-position', 'bottom')
  expect(await toast.evaluate(element => getComputedStyle(element).display)).toBe('flex')
  expect(await toast.evaluate(element => getComputedStyle(element).fontSize)).toBe('13px')
  expect(await toast.evaluate(element => getComputedStyle(element).backdropFilter)).toBe('none')
  await page.waitForTimeout(450)
  await page.screenshot({ path: test.info().outputPath('desktop-toast.png') })
  await page.mouse.move(1200, 100)
  await expect(toast).toHaveCount(0, { timeout: 7000 })
})

test('same-id updates do not duplicate notifications and mobile exposes one at a time', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.error('待处理错误', { id: 'first-error', report: false })
    toast.info('操作处理中', { id: 'operation', report: false, duration: 60000 })
    toast.success('操作已完成', { id: 'operation', duration: 60000 })
  })()`)
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1)
  const front = page.locator('[data-sonner-toast][data-visible=true]')
  await expect(front).toHaveCount(1)
  await expect(front).toContainText('待处理错误')
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: '操作已完成' })).toHaveCount(0)
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.dismiss('first-error')
  })()`)
  await expect(front).toContainText('操作已完成')
  await expect(front).toBeVisible()
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.dismiss()
    toast.error('只有详情的错误', { report: false, error: new Error('Diagnostic details') })
  })()`)
  const detailsOnly = page.locator('[data-sonner-toast]').filter({ hasText: '只有详情的错误' })
  await expect(detailsOnly.getByRole('button', { name: '查看错误详情', exact: true })).toBeVisible()
  await expect.poll(() => detailsOnly.evaluate((element) => {
    const card = element.getBoundingClientRect()
    const button = element.querySelector('.telemetry-details-button')!.getBoundingClientRect()
    const style = getComputedStyle(element)
    const inset = Number.parseFloat(style.paddingRight) + Number.parseFloat(style.borderRightWidth) - 8
    return Math.abs(card.right - button.right - inset)
  })).toBeLessThan(1)
})

test('large text and long actions remain reachable in a short mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 240 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(() => document.documentElement.style.setProperty('--site-ui-scale', '2'))
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.error('网络连接中断，请稍后再试', {
      report: false,
      description: 'Your comment could not be sent. Check your connection before trying again.',
      action: { label: '检查网络连接并重新发送', onClick: () => { document.body.dataset.toastRetried = 'true' } },
    })
  })()`)
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toBeVisible()
  expect(await toast.evaluate(element => getComputedStyle(element).fontSize)).toBe('28px')
  expect(await toast.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  expect(await toast.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return box.top >= 64 && box.bottom <= innerHeight - 15
  })).toBe(true)
  const action = toast.getByRole('button', { name: '检查网络连接并重新发送', exact: true })
  await action.scrollIntoViewIfNeeded()
  await expect(action).toBeInViewport()
  await action.click()
  await expect(page.locator('body')).toHaveAttribute('data-toast-retried', 'true')
})

test('mobile actions reuse Button colors and exit without scrollbars', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30000 })
  await page.evaluate(`(async () => {
    const { toast } = await import('/services/telemetry/toast.ts')
    toast.success('已移除', { action: { label: '撤销', onClick: () => {} } })
  })()`)
  const notification = page.locator('[data-sonner-toast]')
  await expect(notification).toBeVisible()
  const action = notification.getByRole('button', { name: '撤销', exact: true })
  expect(await notification.evaluate(element => getComputedStyle(element).backdropFilter)).toBe('blur(16px)')
  const appearance = await action.evaluate((element) => {
    const style = getComputedStyle(element)
    const palette = {
      background: `oklch(${style.getPropertyValue('--primary')})`,
      color: `oklch(${style.getPropertyValue('--primary-foreground')})`,
    }
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!
    const pixel = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data]
    }
    return { background: pixel(style.backgroundColor), color: pixel(style.color), referenceBackground: pixel(palette.background), referenceColor: pixel(palette.color), radius: style.borderRadius, font: style.fontSize, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }
  })
  expect(appearance.background).toEqual(appearance.referenceBackground)
  expect(appearance.color).toEqual(appearance.referenceColor)
  expect(appearance.radius).toBe('6px')
  expect(appearance.font).toBe('13px')
  expect(appearance.width).toBeLessThanOrEqual(52)
  expect(appearance.height).toBe(36)
  await swipeToast(page, notification)
  const samples = await notification.evaluate(async (element) => {
    const samples: Array<{ overflow: string, before: string, after: string }> = []
    for (let i = 0; i < 6; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      samples.push({ overflow: getComputedStyle(element).overflowY, before: getComputedStyle(element, '::before').display, after: getComputedStyle(element, '::after').display })
    }
    return samples
  })
  expect(samples.every(sample => sample.overflow === 'hidden' && sample.before === 'none' && sample.after === 'none')).toBe(true)
  await expect(notification).toHaveCount(0)
})
