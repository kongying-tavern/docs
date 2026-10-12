import { currentUser, issue, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

interface RemovalState { captured: boolean, sameList: boolean, leave: boolean, leaveDuringRouteTransition: boolean }
type RemovalWindow = Window & { originalList: Element | null, removal: RemovalState }

for (const [state, count] of [['progressing', 2], ['closed', 2], ['progressing', 1], ['closed', 1]] as const) {
  test.describe(`return after ${state} from ${count} rows`, () => {
    const topics = [issue({ labels: [{ name: 'TYP-FEAT' }, { name: 'ST-ROADMAP' }] }), issue({ id: 900002, number: '124', title: 'FEAT:保留的反馈', comments: 0 })].slice(0, count)
    test.use({ scenario: {
      topics,
      user: currentUser,
      handle(request) {
        if (request.method === 'GET' && (request.path.endsWith('/members') || request.path.endsWith('/collaborators')))
          return { data: [currentUser] }
        if (request.method === 'PATCH' && request.path.endsWith('/issues/123')) {
          const patch = JSON.parse(String(request.body))
          const updated = issue({ ...topics[0], state: patch.state, labels: String(patch.labels ?? 'TYP-FEAT,ST-ROADMAP').split(',').map(name => ({ name })) })
          topics.splice(0, 1, updated)
          return { data: updated }
        }
      },
    } })

    test('retains the original row through return, then plays its removal', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
      await page.goto('feedback')
      await expect(page.locator('.forum-topic-item')).toHaveCount(count)
      await page.evaluate(() => (window as unknown as RemovalWindow).originalList = document.querySelector('.topic-list'))
      await page.locator('[data-forum-topic="123"] h4').click()
      await expect(page.locator('[data-forum-route-topic="123"]')).toBeVisible()
      await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
      await page.evaluate(() => {
        const testWindow = window as unknown as RemovalWindow
        const start = document.startViewTransition.bind(document)
        testWindow.removal = { captured: false, sameList: false, leave: false, leaveDuringRouteTransition: false }
        document.startViewTransition = (callback) => {
          const transition = start(callback)
          document.startViewTransition = start
          void transition.ready.then(() => {
            const result = testWindow.removal
            result.captured = Boolean(document.querySelector('.topic-list [data-forum-topic="123"]'))
            result.sameList = document.querySelector('.topic-list') === testWindow.originalList
          })
          return transition
        }
        new MutationObserver((records) => {
          for (const { target, oldValue } of records) {
            if (target instanceof Element && (target.classList.contains('topic-list-leave-active') || oldValue?.includes('topic-list-leave-active'))) {
              testWindow.removal.leave = true
              testWindow.removal.leaveDuringRouteTransition = document.documentElement.hasAttribute('data-forum-transition')
            }
          }
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true })
      })
      await page.locator('[data-forum-route-topic] .topic-btn-more').click()
      await page.getByRole('menuitem', { name: state === 'closed' ? '归档反馈' : '隐藏反馈', exact: true }).click()
      if (state === 'closed')
        await page.getByRole('button', { name: '确认归档', exact: true }).click()
      await expect(page).toHaveURL(/\/feedback$/)
      await expect(page.locator('.forum-topic-item')).toHaveCount(count - 1)
      await expect.poll(() => page.evaluate(() => (window as unknown as RemovalWindow).removal)).toEqual({ captured: true, sameList: true, leave: true, leaveDuringRouteTransition: false })
      if (count === 2)
        await expect(page.locator('[data-forum-topic="124"]')).toBeVisible()
      else
        await expect(page.locator('.forum-content [data-slot="empty"]')).toBeVisible()
    })

    if (state === 'progressing' && count === 2) {
      test('a failed hide preserves the row when returning to the cached list', async ({ page, scenario }) => {
        const handle = scenario.handle
        scenario.handle = request => request.method === 'PATCH'
          ? { status: 500, data: { message: 'Synthetic write failure' } }
          : handle?.(request)
        await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
        await page.goto('feedback')
        await expect(page.locator('.forum-topic-item')).toHaveCount(2)
        await page.locator('[data-forum-topic="123"] h4').click()
        await expect(page.locator('[data-forum-route-topic="123"]')).toBeVisible()
        await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
        await page.locator('[data-forum-route-topic] .topic-btn-more').click()
        const response = page.waitForResponse(response => response.request().method() === 'PATCH')
        await page.getByRole('menuitem', { name: '隐藏反馈', exact: true }).click()
        expect((await response).status()).toBe(500)
        await expect(page.locator('[data-sonner-toast]').filter({ hasText: '失败' }).first()).toBeVisible()
        await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
        await page.goBack()
        await expect(page.locator('.forum-topic-item')).toHaveCount(2)
        await expect(page.locator('[data-forum-topic="123"]')).toBeVisible()
      })
    }
  })
}
