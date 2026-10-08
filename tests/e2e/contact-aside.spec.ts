import { expect, test } from './support/test'

test('home 页 footer 二维码卡片可见且支持夜间模式重生成', async ({ page }) => {
  await page.goto('/feedback/home')
  const card = page.locator('.footer-qrcode')
  await expect(card).toBeVisible()
  // Select the card's only image instead of its localized alt text.
  const qr = card.locator('img')
  await expect(qr).toBeVisible({ timeout: 30_000 })

  // 二维码由 useQRCode 生成（data URL）
  const lightSrc = await qr.getAttribute('src')
  expect(String(lightSrc).startsWith('data:image/png')).toBe(true)

  // 夜间模式适配：主题切换后二维码重新生成（模块颜色翻转）
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect
    .poll(async () => qr.getAttribute('src'), { timeout: 10_000 })
    .not
    .toBe(lightSrc)
  await page.emulateMedia({ colorScheme: 'light' })
})
