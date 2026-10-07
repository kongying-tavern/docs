import { expect, test } from '@playwright/test'

test('document header enters before the body on initial load and document navigation', async ({ page }) => {
  await page.goto('/frontmatter')
  const header = page.locator('.docs-header')
  const heading = header.locator(':scope > .slide-enter')
  const body = page.locator('.main > .vp-doc > div > *')
  await expect(header).toHaveCSS('animation-name', 'none')
  await expect(heading).toHaveCSS('animation-name', 'slide-enter')
  await expect(heading).toHaveCSS('animation-delay', '0s')
  await expect(heading).toHaveCSS('animation-duration', '0.8s')
  const breadcrumbs = header.locator('[data-slot="breadcrumb-item"]')
  await expect(breadcrumbs).toHaveCount(2)
  await expect(breadcrumbs.nth(0)).toHaveCSS('animation-delay', '0s')
  await expect(breadcrumbs.nth(1)).toHaveCSS('animation-delay', '0.09s')
  await expect(breadcrumbs.nth(1)).toHaveCSS('animation-name', 'slide-enter')
  await expect(body.nth(0)).toHaveCSS('animation-delay', '0.09s')
  await expect(body.nth(4)).toHaveCSS('animation-delay', '0.45s')
  await expect(body.nth(20)).toHaveCSS('animation-delay', '1.8s')

  // Track node identity and actual animation starts, not just persistent CSS values.
  await header.evaluate((element) => {
    element.setAttribute('data-previous-document', 'true')
    document.addEventListener('animationstart', (event) => {
      if (event.target instanceof HTMLElement && event.target.matches('.docs-header > .slide-enter'))
        event.target.parentElement?.setAttribute('data-entry-started', 'true')
    })
    const link = document.createElement('a')
    link.href = '/community'
    link.textContent = 'Entry animation navigation'
    element.append(link)
  })
  await page.getByRole('link', { name: 'Entry animation navigation' }).click()
  await expect(page).toHaveURL(/\/community$/)
  await expect(header).not.toHaveAttribute('data-previous-document', 'true')
  await expect(header).toHaveAttribute('data-entry-started', 'true')
  await expect(heading).toHaveCSS('animation-delay', '0s')
  await expect(body.first()).toHaveCSS('animation-delay', '0.09s')
})

test('reduced motion disables document header and body entry together', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/frontmatter')
  await expect(page.locator('.docs-header')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.docs-header > .slide-enter')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.docs-header [data-slot="breadcrumb-item"]').first()).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.main > .vp-doc > div > *').first()).toHaveCSS('animation-name', 'none')
})

test('blur fade honors its timing and finishes with visible content', async ({ page }) => {
  await page.goto('/support-us#alipay')
  const details = page.locator('.coin-details')
  await expect(details).toHaveAttribute('data-entered', 'true')
  await expect(details).toHaveCSS('animation-duration', '0.2s')
  await expect(details).toHaveCSS('animation-delay', '0.2s')
  await expect(details).toHaveCSS('opacity', '1')
  await expect(details).toHaveCSS('filter', 'blur(0px)')
})

test('reduced motion keeps blur fade content visible without animation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('site-motion-preference', 'reduce'))
  await page.goto('/support-us#alipay')
  const details = page.locator('.coin-details')
  await expect(details).toHaveCSS('animation-name', 'none')
  await expect(details).toHaveCSS('opacity', '1')
  await expect(details).toHaveCSS('filter', 'none')
  await expect(details).toHaveCSS('transform', 'none')
})
