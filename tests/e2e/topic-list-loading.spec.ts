import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

const topics = Array.from({ length: 45 }, (_, index) => issue({
  id: 910000 + index,
  number: String(1000 + index),
  comments: 0,
}))
test.use({ scenario: { topics, comments: [] } })

test('pending prefetch does not schedule another request after unmount @source', async ({ page }) => {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
  const probeUrl = `/@fs/${fileURLToPath(new URL('./support/list-prefetch-probe.ts', import.meta.url)).replaceAll('\\', '/')}`
  await page.evaluate(async (probeUrl) => {
    const { mountListPrefetchProbe } = await import(/* @vite-ignore */ probeUrl)
    const probe = await mountListPrefetchProbe()
    Object.assign(window, { prefetchProbe: probe })
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    probe.start()
  }, probeUrl)
  const calls = () => page.evaluate(() => (window as unknown as { prefetchProbe: { calls: () => number } }).prefetchProbe.calls())
  await expect.poll(calls).toBe(1)
  await page.evaluate(() => {
    const { prefetchProbe } = window as unknown as { prefetchProbe: { dispose: () => void, release: () => void } }
    prefetchProbe.dispose()
    prefetchProbe.release()
  })
  await page.waitForTimeout(300)
  expect(await calls()).toBe(1)
})

test('authenticated scrolling prefetches one page before reaching the bottom', async ({ page, forum, scenario }) => {
  scenario.following = false
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  scenario.handle = async (request) => {
    if (request.path.endsWith('/Feedback/issues') && request.query.get('page') === '2')
      await pending
    return undefined
  }
  await page.evaluate(async () => {
    const root = document.documentElement
    window.scrollTo({ top: root.scrollHeight - root.clientHeight * 2.5, behavior: 'instant' })
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    window.scrollBy({ top: 1, behavior: 'instant' })
  })
  const nextRequests = () => forum.requests.filter(request => request.path.endsWith('/Feedback/issues') && request.query.get('page') === '2')
  try {
    await expect.poll(() => nextRequests().length).toBe(1)
    await expect(page.locator('button.vp-link svg.animate-spin')).not.toBeInViewport()
    expect(await page.evaluate(() => {
      const root = document.documentElement
      return root.scrollHeight - root.scrollTop - root.clientHeight
    })).toBeGreaterThan(64)
    await page.evaluate(() => {
      for (let index = 0; index < 10; index++)
        window.dispatchEvent(new Event('scroll'))
    })
    expect(nextRequests()).toHaveLength(1)
  }
  finally {
    release()
  }
  await expect(page.locator('.forum-topic-item')).toHaveCount(40)
  await expect(page.locator('button.vp-link svg.animate-spin')).toHaveCount(0)
  expect(nextRequests()).toHaveLength(1)
})

for (const reduced of [false, true]) {
  test(`anonymous pagination restores staggered right entry (reduced motion: ${reduced})`, async ({ page, forum }) => {
    await page.addInitScript((reduce) => {
      localStorage.setItem('site-motion-preference', reduce ? 'reduce' : 'no-preference')
    }, reduced)
    await page.goto('feedback')
    await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    expect(forum.requests.filter(request => request.path.endsWith('/Feedback/issues') && request.query.get('page') === '2')).toHaveLength(0)
    await page.evaluate(() => {
      const list = document.querySelector('.topic-list')!
      list.setAttribute('data-enter-samples', '[]')
      list.addEventListener('animationstart', (event) => {
        const target = event.target as HTMLElement
        const index = Number(target.closest<HTMLElement>('li[data-index]')?.dataset.index)
        if (index < 20 || !target.classList.contains('topic-entry-active'))
          return
        const samples = JSON.parse(list.getAttribute('data-enter-samples')!)
        const style = getComputedStyle(target)
        const animation = target.getAnimations()[0]
        const effect = animation?.effect as KeyframeEffect | undefined
        const transform = String(effect?.getKeyframes()[0].transform ?? 'none')
        samples.push({ index, delay: style.animationDelay, offsetX: new DOMMatrix(transform).m41, filter: style.filter, width: document.documentElement.scrollWidth })
        list.setAttribute('data-enter-samples', JSON.stringify(samples))
      })
      const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('加载更多'))!
      button.click()
    })
    await expect(page.locator('.forum-topic-item')).toHaveCount(40)
    await expect.poll(async () => page.locator('.topic-list').evaluate(element => JSON.parse(element.getAttribute('data-enter-samples')!).length)).toBe(20)
    const samples = await page.locator('.topic-list').evaluate(element => JSON.parse(element.getAttribute('data-enter-samples')!))
    expect([20, 21, 22].map(index => samples.find((sample: { index: number }) => sample.index === index).delay)).toEqual(reduced ? ['0s', '0s', '0s'] : ['0s', '0.08s', '0.16s'])
    expect(samples[0].offsetX).toBe(reduced ? 0 : 148)
    expect(samples[0].filter).toBe('none')
    expect(samples[0].width).toBeLessThanOrEqual((await page.viewportSize())!.width)
    await expect(page.locator('.topic-list > li').nth(20).locator('.topic-entry-active')).toHaveCount(0)
    await page.locator('.topic-list > li').nth(20).scrollIntoViewIfNeeded()
    await expect(page.locator('.topic-list > li').nth(20).locator('.topic-entry-active')).toHaveCount(0)
  })
}

test('loading ends with the list response without waiting for entry animation', async ({ page, scenario }) => {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  scenario.handle = async (request) => {
    if (request.path.endsWith('/Feedback/issues') && request.query.get('page') === '2')
      await pending
    return undefined
  }
  const profiler = await page.context().newCDPSession(page)
  await profiler.send('Profiler.enable')
  await profiler.send('Profiler.start')
  await page.evaluate(() => {
    const list = document.querySelector('.topic-list')!
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('加载更多'))!
    const timings: Record<string, number> = {}
    const record = (name: string) => {
      timings[name] ??= performance.now()
      list.setAttribute('data-loading-timings', JSON.stringify(timings))
    }
    const fetch = window.fetch
    window.fetch = async (...args) => {
      const input = args[0]
      const url = new URL(input instanceof Request ? input.url : String(input), location.href)
      const tracked = url.pathname.endsWith('/Feedback/issues') && url.searchParams.get('page') === '2'
      if (tracked)
        record('fetchStart')
      const response = await fetch(...args)
      if (tracked) {
        record('responseHeaders')
        const json = response.json.bind(response)
        response.json = async () => {
          const data = await json()
          record('bodyParsed')
          return data
        }
      }
      return response
    }
    new MutationObserver(() => {
      if (button.disabled) {
        record('loadingStart')
      }
      else if (timings.loadingStart && !timings.loadingEnd) {
        record('loadingEnd')
        list.setAttribute('data-loading-entry-active', String(Boolean(list.querySelector('.topic-entry-active'))))
      }
      if (list.querySelectorAll(':scope > li').length === 40)
        record('rowsAppended')
    }).observe(list.parentElement!.parentElement!.parentElement!, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] })
    record('click')
    button.click()
  })
  const timings = () => page.locator('.topic-list').evaluate(element => JSON.parse(element.getAttribute('data-loading-timings')!) as Record<string, number>)
  try {
    await expect.poll(async () => (await timings()).loadingStart).toBeTruthy()
    expect((await timings()).loadingEnd).toBeUndefined()
    const spinner = page.locator('button.vp-link svg.animate-spin')
    await expect(spinner).toHaveCSS('animation-timing-function', 'linear')
    await expect(spinner).toHaveCSS('animation-duration', '1s')
    await expect(spinner).toHaveCSS('will-change', 'transform')
  }
  finally {
    release()
  }
  await expect(page.locator('.forum-topic-item')).toHaveCount(40)
  await expect.poll(async () => (await timings()).loadingEnd).toBeTruthy()
  const result = await timings()
  const { profile } = await profiler.send('Profiler.stop')
  await profiler.detach()
  expect(result.loadingEnd).toBeGreaterThanOrEqual(result.responseHeaders)
  await expect(page.locator('.topic-list')).toHaveAttribute('data-loading-entry-active', 'true')
  const elapsed = Object.fromEntries(Object.entries(result).map(([key, value]) => [key, Math.round(value - result.click)]))
  const profilePath = test.info().outputPath('list-loading-profile.json')
  await writeFile(profilePath, JSON.stringify({ elapsed, profile }))
  await test.info().attach('list-loading-profile', { path: profilePath, contentType: 'application/json' })
  await expect(page.locator('.topic-list > li').nth(20)).toHaveCSS('opacity', '1')
})

test('inactive list highlight skips layout reads and still follows hover after pagination', async ({ page }) => {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    const list = document.querySelector('.topic-list')!
    const container = list.parentElement!
    const original = Element.prototype.getBoundingClientRect
    let reads = 0
    list.setAttribute('data-container-layout-reads', '0')
    Element.prototype.getBoundingClientRect = function () {
      if (this === container)
        list.setAttribute('data-container-layout-reads', String(++reads))
      return original.call(this)
    }
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('加载更多'))!
    button.click()
  })
  await expect(page.locator('.forum-topic-item')).toHaveCount(40)
  await expect(page.locator('.topic-list')).toHaveAttribute('data-container-layout-reads', '0')
  const row = page.locator('.forum-topic-item').first()
  await row.hover()
  await expect(row).toHaveAttribute('data-fluid-hover-active', '')
  const indicator = page.locator('.topic-list').locator('..').locator(':scope > [aria-hidden="true"]').first()
  await expect(indicator).toHaveCSS('opacity', '1')
  await page.mouse.move(0, 0)
  await expect(indicator).toHaveCSS('opacity', '0')
})

test('bottom spacing leaves the first appended topic visible during entry', async ({ page, scenario }) => {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  scenario.handle = async (request) => {
    if (request.path.endsWith('/Feedback/issues') && request.query.get('page') === '2')
      await pending
    return undefined
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  try {
    await expect(page.locator('button.vp-link svg.animate-spin')).toBeVisible()
    const reserve = await page.locator('button.vp-link:disabled').evaluate(button => window.innerHeight - button.getBoundingClientRect().bottom)
    expect(reserve).toBeGreaterThanOrEqual(128)
    await page.evaluate(() => {
      const list = document.querySelector('.topic-list')!
      new MutationObserver(() => {
        const row = list.children[20]
        if (!row)
          return
        const rect = row.getBoundingClientRect()
        list.setAttribute('data-first-appended-visible', String(rect.top < window.innerHeight && rect.bottom > 0))
      }).observe(list, { childList: true })
    })
  }
  finally {
    release()
  }
  await expect(page.locator('.forum-topic-item')).toHaveCount(40)
  await expect(page.locator('.topic-list')).toHaveAttribute('data-first-appended-visible', 'true')
})
