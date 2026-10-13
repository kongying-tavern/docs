import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

const keyword = 'needle '.repeat(20).trim()
const topics = Array.from({ length: 45 }, (_, index) => issue({
  id: 920000 + index,
  number: String(2000 + index),
  title: `FEAT:${keyword} ${index}`,
  comments: 0,
}))

test.use({ scenario: { topics, comments: [] } })

test('pagination preserves the search summary and updates its total without character measurements', async ({ page, scenario }) => {
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  scenario.handle = async (request) => {
    if (request.path !== '/api/v5/search/issues')
      return undefined
    const number = Number(request.query.get('page') ?? 1)
    if (number === 2)
      await pending
    return {
      data: topics.slice((number - 1) * 20, number * 20),
      headers: {
        'Total_count': String(topics.length + (number === 2 ? 1 : 0)),
        'Total_page': '3',
        'Access-Control-Expose-Headers': 'Total_count, Total_page',
      },
    }
  }
  await page.goto(`feedback/search/feat?q=${encodeURIComponent(keyword)}`)
  await expect(page.locator('.forum-topic-item')).toHaveCount(20, { timeout: 30_000 })
  const content = page.locator('blockquote', { hasText: '条相关反馈' })
  await expect(content).toBeVisible()
  await expect(content).toContainText('找到 45 条相关反馈')
  await content.evaluate((element) => {
    element.setAttribute('data-summary-instance', 'retained')
    element.querySelector('p > span')!.setAttribute('data-summary-text-instance', 'retained')
    const original = Element.prototype.getBoundingClientRect
    let reads = 0
    element.setAttribute('data-summary-layout-reads', '0')
    Element.prototype.getBoundingClientRect = function () {
      if (element.contains(this))
        element.setAttribute('data-summary-layout-reads', String(++reads))
      return original.call(this)
    }
  })
  await page.evaluate(() => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('加载更多'))!
    button.click()
  })
  try {
    await expect(page.locator('button.vp-link svg.animate-spin')).toHaveCount(1)
    await expect(content).toHaveAttribute('data-summary-instance', 'retained')
    await expect(content).toHaveAttribute('aria-busy', 'true')
  }
  finally {
    release()
  }
  await expect(page.locator('.forum-topic-item')).toHaveCount(40)
  await expect(content).toHaveAttribute('data-summary-instance', 'retained')
  await expect(content.locator('[data-summary-text-instance]')).toHaveCount(1)
  await expect(content).toHaveAttribute('data-summary-layout-reads', '0')
  await expect(content).toHaveAttribute('aria-busy', 'false')
  await expect(content).toContainText('找到 46 条相关反馈')
})
