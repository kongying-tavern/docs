import { issue } from './fixtures/gitee'
import { expect, test } from './support/test'

async function assertDetail(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-forum-shared-topic="title"]')).toContainText('测试反馈路由可用')
  await expect(page.locator('[data-forum-shared-topic="content"], #content')).toContainText('正文内容')
  await expect(page.locator('#reply-99001')).toContainText('这是一条评论。')
}

test('cached list closes its preview when entering detail and can reopen it after returning', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('feedback')
  const row = page.locator('.forum-topic-item').first()
  await row.click({ position: { x: 4, y: 4 } })
  const preview = page.locator('.topic-preview-dialog')
  await expect(preview).toBeVisible()
  await preview.locator('.topic-title-link').click()
  await expect(page.locator('[data-forum-route-topic="123"]')).toBeVisible()
  await expect(preview).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await page.goBack()
  await expect(row).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await expect(preview).toHaveCount(0)
  await row.click({ position: { x: 4, y: 4 } })
  await expect(preview).toBeVisible()
})

test.describe('cached list filters', () => {
  test.use({ scenario: { topics: [issue(), issue({ id: 900002, number: '124', title: 'BUG:筛选回归', comments: 0, labels: [{ name: 'TYP-BUG' }] })] } })

  test('return retains the source filter and later filter navigation updates rows', async ({ page }) => {
    await page.goto('feedback/feat')
    await expect(page.locator('.forum-topic-item')).toHaveCount(1)
    await page.locator('[data-forum-topic="123"] h4').click()
    await assertDetail(page)
    await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
    await page.goBack()
    await expect(page).toHaveURL(/\/feedback\/feat$/)
    await expect(page.locator('[data-forum-topic="123"]')).toBeVisible()
    await expect(page.locator('[data-forum-topic="124"]')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = new URL('bug', location.href).href
      document.body.append(link)
      link.click()
      link.remove()
    })
    await expect(page.locator('[data-forum-topic="124"]')).toBeVisible()
    await expect(page.locator('[data-forum-topic="123"]')).toHaveCount(0)
  })
})

test('a second navigation cancels the previous transition without leaving stale flags', async ({ page }) => {
  await page.goto('feedback')
  await page.locator('.forum-topic-item h4').first().click()
  await assertDetail(page)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await page.evaluate(async () => {
    const start = document.startViewTransition.bind(document)
    await new Promise<void>((resolve, reject) => {
      document.startViewTransition = (callback) => {
        const transition = start(callback)
        document.startViewTransition = start
        void transition.ready.then(() => {
          for (const animation of document.getAnimations()) {
            if ((animation.effect as KeyframeEffect).pseudoElement?.startsWith('::view-transition'))
              animation.pause()
          }
          resolve()
        }, reject)
        return transition
      }
      history.back()
    })
    history.forward()
  })
  await expect(page.locator('[data-forum-route-topic="123"]')).toBeVisible()
  await assertDetail(page)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-topic-transition')
})

test('reduced motion returns to the cached list without invoking View Transition', async ({ page }) => {
  await page.goto('feedback')
  await page.locator('.forum-topic-item h4').first().click()
  await assertDetail(page)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
  await page.evaluate(() => {
    document.documentElement.dataset.reducedMotion = 'true'
    document.startViewTransition = () => {
      throw new Error('Reduced motion must bypass View Transition')
    }
    history.back()
  })
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
  await expect(page).toHaveURL(/\/feedback$/)
})

test('列表进入详情，评论真实渲染，后退和前进保留可交互页面', async ({ page, forum }) => {
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30_000 })
  await page.locator('.forum-topic-item h4').first().click()
  await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
  await assertDetail(page)
  expect(forum.requests.some(request => request.path.endsWith('/issues/123/comments'))).toBe(true)
  await page.goBack()
  await expect(page).toHaveURL(/\/feedback$/)
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
  await page.goForward()
  await expect(page).toHaveURL(/\/feedback\/topic\/123$/)
  await assertDetail(page)
})

test.describe('scrolled detail transitions', () => {
  test.use({ scenario: { topics: [issue({ body: `正文内容\n\n${Array.from({ length: 30 }).fill('长正文用于验证退出前不自动跳回顶部。').join('\n\n')}` })] } })

  test('history back snapshots the current reading position before restoring the list', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('feedback')
    await page.locator('.forum-topic-item h4').first().click()
    await assertDetail(page)
    await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')
    await page.evaluate(() => window.scrollTo(0, 650))
    const position = await page.evaluate(async () => {
      const sourceTop = document.querySelector('.forum-content')!.getBoundingClientRect().top
      const start = document.startViewTransition.bind(document)
      return new Promise<{ sourceTop: number, snapshotTop: number }>((resolve, reject) => {
        document.startViewTransition = (callback) => {
          const transition = start(callback)
          document.startViewTransition = start
          void transition.ready.then(() => {
            const group = getComputedStyle(document.documentElement, '::view-transition-group(forum-detail-body)')
            resolve({ sourceTop, snapshotTop: new DOMMatrix(group.transform).m42 })
          }, reject)
          return transition
        }
        history.back()
      })
    })
    expect(position.sourceTop).toBeLessThan(-400)
    expect(position.snapshotTop).toBeCloseTo(position.sourceTop, 0)
    await expect(page.locator('html')).not.toHaveAttribute('data-forum-topic-transition')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})

test('详情深链加载正确的评论数组与作者', async ({ page }) => {
  const response = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/issues/123/comments'))
  await page.goto('feedback/topic/123')
  expect(Array.isArray(await (await response).json())).toBe(true)
  await assertDetail(page)
  await expect(page.locator('[data-forum-shared-topic="author"]')).toContainText('Alice')
})

test('desktop detail exit captures body and aside and finishes without staggered article morphing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('feedback')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1, { timeout: 30_000 })
  await page.locator('.forum-topic-item h4').first().click()
  await assertDetail(page)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-transition')

  const snapshot = await page.evaluate(async () => {
    const original = document.startViewTransition.bind(document)
    return new Promise<{ body: string, aside: string, duration: string, enterDuration: string, delay: string, article: string, destination: string, shared: number, sidebar: string, sourceTop: number, snapshotTop: number, enterOpacity: number, exitOpacity: number, enterX: number }>((resolve, reject) => {
      document.startViewTransition = (callback) => {
        const body = getComputedStyle(document.querySelector('.forum-content')!).viewTransitionName
        const aside = getComputedStyle(document.querySelector('.forum-aside')!).viewTransitionName
        const article = (document.querySelector('[data-forum-shared-topic="content"]') as HTMLElement).style.viewTransitionName
        const sourceTop = document.querySelector('.forum-content')!.getBoundingClientRect().top
        const transition = original(callback)
        document.startViewTransition = original
        void transition.ready.then(() => {
          const exit = getComputedStyle(document.documentElement, '::view-transition-old(forum-detail-aside)')
          const destination = getComputedStyle(document.querySelector('.forum-content')!).viewTransitionName
          const enter = getComputedStyle(document.documentElement, '::view-transition-new(forum-destination-body)')
          const shared = document.querySelectorAll('[data-forum-shared-topic][style*="view-transition-name"]').length
          const sidebar = getComputedStyle(document.querySelector('.VPSidebar')!).animationName
          const group = getComputedStyle(document.documentElement, '::view-transition-group(forum-detail-body)')
          const snapshotTop = new DOMMatrix(group.transform).m42
          const animations = document.getAnimations().filter(animation => (animation.effect as KeyframeEffect).pseudoElement?.startsWith('::view-transition'))
          for (const animation of animations) {
            animation.pause()
            animation.currentTime = 50
          }
          const enterOpacity = Number(enter.opacity)
          const exitOpacity = Number(exit.opacity)
          const enterX = new DOMMatrix(enter.transform).m41
          for (const animation of animations)
            animation.play()
          resolve({ body, aside, article, destination, shared, sidebar, sourceTop, snapshotTop, enterOpacity, exitOpacity, enterX, duration: exit.animationDuration, enterDuration: enter.animationDuration, delay: enter.animationDelay })
        }, reject)
        return transition
      }
      window.history.back()
    })
  })
  expect(snapshot).toMatchObject({ body: 'forum-detail-body', aside: 'forum-detail-aside', article: '', destination: 'forum-destination-body', shared: 0, sidebar: 'none', duration: '0.18s', enterDuration: '0.28s', delay: '0s' })
  expect(snapshot.snapshotTop).toBeCloseTo(snapshot.sourceTop, 0)
  expect(snapshot.enterOpacity).toBeGreaterThan(0.2)
  expect(snapshot.exitOpacity).toBeGreaterThan(0)
  expect(snapshot.enterX).toBeLessThan(-1)
  await expect(page.locator('html')).not.toHaveAttribute('data-forum-topic-transition')
  await expect(page.locator('.forum-topic-item')).toHaveCount(1)
})
