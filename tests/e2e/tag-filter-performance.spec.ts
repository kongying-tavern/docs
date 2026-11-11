import { comment, issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const topics = Array.from({ length: 40 }, (_, index) => issue({
  id: 930000 + index,
  number: String(3000 + index),
  comments: index === 0 ? 1 : 0,
  labels: [{ name: 'TYP-FEAT' }, { name: index % 2 ? 'CATA-LOGIN' : 'CATA-DOCS' }],
}))

test.use({ scenario: { topics, comments: [comment({ body: 'Retained comment summary' }, topics[0])] } })

test('tag filtering retains pending rows and animates the result without measuring unchanged rows', async ({ page, scenario }) => {
  let release: () => void = () => {}
  const pending = new Promise<void>(resolve => release = resolve)
  scenario.handle = async (request) => {
    if (request.query.get('labels')?.includes('CATA-DOCS'))
      await pending
    return undefined
  }
  await page.goto('feedback')
  const rows = page.locator('.topic-list > li[data-topic-id]')
  await expect(rows).toHaveCount(20, { timeout: 30_000 })
  const retained = page.locator('.topic-list > li[data-topic-id="3000"]')
  const summary = retained.locator('.topic-comment')
  await expect(summary).toContainText('Retained comment summary')
  await retained.evaluate((element) => {
    element.setAttribute('data-retained-row', '')
    const original = Element.prototype.getBoundingClientRect
    document.documentElement.dataset.rowPositionReads = '0'
    element.parentElement!.addEventListener('transitionrun', (event) => {
      if ((event as TransitionEvent).propertyName === 'transform')
        document.documentElement.dataset.listMoveAnimated = 'true'
    })
    Element.prototype.getBoundingClientRect = function () {
      if (this.matches('.topic-list > li[data-topic-id]')) {
        const root = document.documentElement
        root.dataset.rowPositionReads = String(Number(root.dataset.rowPositionReads) + 1)
      }
      return original.call(this)
    }
  })
  try {
    await page.locator('.aside-tag-filter button').filter({ hasText: '文档问题' }).click()
    await expect(page).toHaveURL(/tags/)
    await expect(page.locator('button.vp-link svg.animate-spin')).toHaveCount(1)
    await expect(rows).toHaveCount(20)
    await expect(retained).toHaveAttribute('data-retained-row', '')
    await expect(summary).toContainText('Retained comment summary')
    await expect(page.locator('html')).toHaveAttribute('data-row-position-reads', '0')
  }
  finally {
    release()
  }
  await expect(rows).toHaveCount(20)
  await expect(page.locator('button.vp-link svg.animate-spin')).toHaveCount(0)
  await expect(retained).toHaveAttribute('data-retained-row', '')
  await expect(rows.locator('.forum-tag-filter').filter({ hasText: '登录问题' })).toHaveCount(0)
  await expect(page.locator('.aside-tag-filter button[aria-pressed="true"]')).toHaveText(/文档问题/)
  await expect(page.locator('html')).toHaveAttribute('data-list-move-animated', 'true')
})

for (const reduced of [false, true]) {
  for (const empty of [false, true]) {
    test(`leaving topics fade in place and retain list height (empty: ${empty}, reduced: ${reduced})`, async ({ page }) => {
      await page.addInitScript(reduce => localStorage.setItem('site-motion-preference', reduce ? 'reduce' : 'no-preference'), reduced)
      await page.goto('feedback')
      const list = page.locator('.topic-list')
      await expect(list.locator(':scope > li[data-topic-id]')).toHaveCount(20, { timeout: 30_000 })
      await expect(list.locator('[data-topic-id="3000"] .topic-comment')).toContainText('Retained comment summary')
      await page.addStyleTag({ content: '.topic-list-leave-active { transition-duration: 400ms !important; }' })
      await list.evaluate((element) => {
        const root = element as HTMLElement
        root.dataset.exitSamples = '[]'
        root.dataset.previousHeight = String(root.offsetHeight)
        for (const row of root.querySelectorAll<HTMLElement>(':scope > li[data-topic-id]')) {
          row.dataset.exitTop = String(row.offsetTop)
          row.dataset.exitLeft = String(row.offsetLeft)
        }
        const sampled = new Set<Element>()
        new MutationObserver((records) => {
          for (const { target } of records) {
            if (!(target instanceof HTMLElement) || sampled.has(target) || !target.classList.contains('topic-list-leave-active'))
              continue
            sampled.add(target)
            const samples = JSON.parse(root.dataset.exitSamples!)
            samples.push({
              dy: target.offsetTop - Number(target.dataset.exitTop),
              dx: target.offsetLeft - Number(target.dataset.exitLeft),
              retainedHeight: root.offsetHeight >= Number(root.dataset.previousHeight),
            })
            root.dataset.exitSamples = JSON.stringify(samples)
          }
        }).observe(root, { subtree: true, attributes: true, attributeFilter: ['class'] })
      })
      await page.locator('.aside-tag-filter button').filter({ hasText: empty ? '错别字' : '文档问题' }).click()
      const samples = () => list.evaluate(element => JSON.parse((element as HTMLElement).dataset.exitSamples!) as { dx: number, dy: number, retainedHeight: boolean }[])
      await expect.poll(async () => (await samples()).length).toBe(empty ? 20 : 10)
      for (const sample of await samples()) {
        expect(Math.abs(sample.dx)).toBeLessThanOrEqual(1)
        expect(Math.abs(sample.dy)).toBeLessThanOrEqual(1)
        expect(sample.retainedHeight).toBe(true)
      }
      await expect(list.locator(':scope > li[data-topic-id]')).toHaveCount(empty ? 0 : 20)
      await expect.poll(() => list.evaluate(element => (element as HTMLElement).style.minHeight)).toBe('')
    })
  }
}

test('reversing a filter during exit clears pinned positions and retained height', async ({ page }) => {
  await page.goto('feedback')
  const list = page.locator('.topic-list')
  const rows = list.locator(':scope > li[data-topic-id]')
  await expect(rows).toHaveCount(20, { timeout: 30_000 })
  await expect(list.locator('[data-topic-id="3000"] .topic-comment')).toContainText('Retained comment summary')
  await page.addStyleTag({ content: '.topic-list-leave-active { transition-duration: 1000ms !important; }' })
  const filter = page.locator('.aside-tag-filter button').filter({ hasText: '文档问题' })
  await filter.click()
  await expect(list.locator('.topic-list-leave-active')).toHaveCount(10)
  await filter.click()
  await expect(filter).toHaveAttribute('aria-pressed', 'false')
  await expect(list.locator('.topic-list-leave-active')).toHaveCount(0)
  await expect(rows).toHaveCount(20)
  await expect.poll(() => list.evaluate(element => (element as HTMLElement).style.minHeight)).toBe('')
  expect(await rows.evaluateAll(elements => elements.every((element) => {
    const { top, left, width } = (element as HTMLElement).style
    return !top && !left && !width
  }))).toBe(true)
})
