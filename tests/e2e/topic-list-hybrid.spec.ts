import type { Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

interface Probe {
  setCount: (count: number) => void
  cloneRows: () => void
  reset: (key: string, count?: number) => void
  dispose: () => void
}

async function openProbe(page: Page): Promise<void> {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item').first()).toBeVisible({ timeout: 30_000 })
  const probeUrl = `/@fs/${fileURLToPath(new URL('./support/topic-window-probe.ts', import.meta.url)).replaceAll('\\', '/')}`
  await page.evaluate(async (probeUrl) => {
    const { mountTopicWindowProbe } = await import(/* @vite-ignore */ probeUrl)
    Object.assign(window, { windowProbe: await mountTopicWindowProbe() })
  }, probeUrl)
}

test('rich-card threshold preserves images, expansion, focus and append-only animation', async ({ page, scenario }) => {
  const topics = Array.from({ length: 120 }, (_, index) => issue({
    id: 991000 + index,
    number: `IH${index}`,
    title: `FEAT: Hybrid topic ${index}`,
    body: `${'异高列表正文。'.repeat(20 + index % 45)}\n![image](https://example.com/hybrid.svg){thumbhash:"1fsrB38I9wiIh4hwj3CI+AiIgIAICIgA",width:"640",height:"360"}`,
    comments: 0,
  }))
  scenario.topics = topics
  // The API fixture captured its initial array; explicitly serve this scenario's data.
  scenario.handle = (request) => {
    if (request.path === '/api/v5/search/issues') {
      return { data: [topics[61]], headers: { 'Total_count': '1', 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
    }
    return request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20'
      ? {
          data: topics.slice((Number(request.query.get('page')) - 1) * 20, Number(request.query.get('page')) * 20),
          headers: { 'Total_count': '120', 'Total_page': '6', 'Access-Control-Expose-Headers': 'Total_count, Total_page' },
        }
      : undefined
  }
  await page.route(/https:\/\/[^/]*clarity\.ms\//, route => route.abort())
  await page.route('https://example.com/hybrid.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"/>' }))
  await page.goto('feedback')
  const list = page.locator('.topic-list')
  await expect(list).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
  for (const count of [40, 60, 80]) {
    await page.getByRole('button', { name: '加载更多', exact: true }).evaluate(button => (button as HTMLButtonElement).click())
    await expect(list).toHaveAttribute('data-total-items', String(count))
  }
  await expect(list).toHaveAttribute('data-windowed', 'false')
  await expect(list.locator('li[data-topic-id]')).toHaveCount(80)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await page.waitForTimeout(1000)
  const row = page.locator('[data-forum-topic="IH61"]')
  await row.getByRole('button', { name: '显示更多', exact: true }).click()
  await row.evaluate((element) => {
    window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' })
    ;(element as HTMLElement).focus({ preventScroll: true })
    Object.assign(window, { hybridCardNode: element })
  })
  await expect(row.locator('.forum-image-source')).toHaveCSS('visibility', 'visible')
  const top = await row.evaluate(element => element.getBoundingClientRect().top)
  await list.evaluate((element) => {
    Object.assign(window, { hybridOldAnimations: [] })
    element.addEventListener('animationstart', (event) => {
      const target = event.target as HTMLElement
      const index = Number(target.closest('li[data-index]')?.getAttribute('data-index'))
      if (target.classList.contains('topic-entry-active') && index < 80)
        (window as unknown as { hybridOldAnimations: number[] }).hybridOldAnimations.push(index)
    })
  })
  await page.getByRole('button', { name: '加载更多', exact: true }).evaluate(button => (button as HTMLButtonElement).click())
  await expect(list).toHaveAttribute('data-total-items', '100')
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await expect(row).toBeFocused()
  await expect.poll(async () => Math.abs(await row.evaluate(element => element.getBoundingClientRect().top) - top)).toBeLessThan(12)
  expect(await row.evaluate(element => element === (window as unknown as { hybridCardNode: HTMLElement }).hybridCardNode)).toBe(true)
  await expect(row.locator('.forum-topic-summary')).not.toHaveClass(/line-clamp-4/)
  await expect(row.locator('.forum-image-source')).toHaveCSS('visibility', 'visible')
  expect(await page.evaluate(() => (window as unknown as { hybridOldAnimations: number[] }).hybridOldAnimations)).toEqual([])
  await page.locator('.search-field-trigger').click()
  await page.keyboard.type('Hybrid topic 61')
  await page.keyboard.press('Enter')
  await expect(list).toHaveAttribute('data-total-items', '1')
  await expect(list).toHaveAttribute('data-windowed', 'false')
})

test('profile type changes reevaluate a cached small query after a large list', async ({ page, scenario, forum }) => {
  const topics = Array.from({ length: 100 }, (_, index) => issue({
    id: 993000 + index,
    number: `IP${index}`,
    title: `${index < 20 ? 'BUG' : 'FEAT'}: Profile hybrid topic ${index}`,
    labels: [{ name: index < 20 ? 'TYP-BUG' : 'TYP-FEAT' }],
    comments: 0,
  }))
  scenario.handle = (request) => {
    if (!request.path.endsWith('/Feedback/issues') || request.query.get('per_page') !== '20')
      return undefined
    const data = request.query.get('labels')?.includes('TYP-BUG') ? topics.slice(0, 20) : topics
    return { data, headers: { 'Total_count': String(data.length), 'Total_page': '1', 'Access-Control-Expose-Headers': 'Total_count, Total_page' } }
  }
  await page.goto('feedback/@alice/bug')
  const list = page.locator('.topic-list')
  await expect(list).toHaveAttribute('data-total-items', '20', { timeout: 30_000 })
  await expect(list).toHaveAttribute('data-windowed', 'false')
  const bugReads = () => forum.requests.filter(request => request.path.endsWith('/Feedback/issues') && request.query.get('per_page') === '20' && request.query.get('labels')?.includes('TYP-BUG')).length
  const before = bugReads()
  expect(before).toBeGreaterThan(0)
  await page.getByRole('button', { name: '全部类型', exact: true }).click()
  await expect(list).toHaveAttribute('data-total-items', '100')
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await page.getByRole('button', { name: '问题反馈', exact: true }).click()
  await expect(list).toHaveAttribute('data-total-items', '20')
  await expect(list).toHaveAttribute('data-windowed', 'false')
  expect(bugReads()).toBe(before)
})

test('hybrid threshold retains the reading anchor and focused node, and avoids mode oscillation @source', async ({ page }) => {
  await openProbe(page)
  const list = page.locator('[data-probe-list]')
  await expect(list).toHaveAttribute('data-windowed', 'false')
  await expect(list.locator('li')).toHaveCount(80)
  const anchor = list.locator('[data-topic-id="probe-61"]')
  await anchor.evaluate((row) => {
    window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' })
    row.focus({ preventScroll: true })
    Object.assign(window, { hybridAnchorNode: row })
  })
  const top = await anchor.evaluate(row => row.getBoundingClientRect().top)
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.setCount(100))
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await expect(anchor).toBeFocused()
  await expect.poll(async () => Math.abs(await anchor.evaluate(row => row.getBoundingClientRect().top) - top)).toBeLessThan(2)
  expect(await anchor.evaluate(row => row === (window as unknown as { hybridAnchorNode: HTMLElement }).hybridAnchorNode)).toBe(true)
  for (const count of [81, 80, 79, 81]) {
    await page.evaluate(count => (window as unknown as { windowProbe: Probe }).windowProbe.setCount(count), count)
    await expect(list).toHaveAttribute('data-windowed', 'true')
    await expect(anchor).toBeFocused()
    await expect.poll(async () => Math.abs(await anchor.evaluate(row => row.getBoundingClientRect().top) - top)).toBeLessThan(2)
  }
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    ;(window as unknown as { windowProbe: Probe }).windowProbe.reset('second', 20)
  })
  await expect(list).toHaveAttribute('data-windowed', 'false')
  await expect(list.locator('li')).toHaveCount(20)
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.setCount(100))
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.reset('pending-third'))
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.cloneRows())
  await expect(list).toHaveAttribute('data-windowed', 'true')
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.setCount(20))
  await expect(list).toHaveAttribute('data-windowed', 'false')
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.dispose())
})

test('an ongoing pointer gesture skips threshold anchor restoration @source', async ({ page }) => {
  await openProbe(page)
  const offsets = await page.evaluate(async () => {
    const row = document.querySelector<HTMLElement>('[data-probe-list] [data-topic-id="probe-61"]')!
    window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' })
    window.dispatchEvent(new PointerEvent('pointerdown'))
    ;(window as unknown as { windowProbe: Probe }).windowProbe.setCount(100)
    await Promise.resolve()
    window.scrollBy({ top: 500, behavior: 'instant' })
    const requested = scrollY
    for (let frame = 0; frame < 5; frame++)
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    window.dispatchEvent(new PointerEvent('pointerup'))
    return { requested, actual: scrollY }
  })
  expect(Math.abs(offsets.actual - offsets.requested)).toBeLessThan(2)
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.dispose())
})

test('threshold migration yields to new user scrolling @source', async ({ page }) => {
  await openProbe(page)
  const finalOffset = await page.evaluate(async () => {
    const row = document.querySelector<HTMLElement>('[data-probe-list] [data-topic-id="probe-61"]')!
    window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' })
    ;(window as unknown as { windowProbe: Probe }).windowProbe.setCount(100)
    await Promise.resolve()
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 500 }))
    window.scrollBy({ top: 500, behavior: 'instant' })
    const requested = scrollY
    for (let frame = 0; frame < 5; frame++)
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    return { requested, actual: scrollY }
  })
  expect(Math.abs(finalOffset.actual - finalOffset.requested)).toBeLessThan(2)
  await page.evaluate(() => (window as unknown as { windowProbe: Probe }).windowProbe.dispose())
})
