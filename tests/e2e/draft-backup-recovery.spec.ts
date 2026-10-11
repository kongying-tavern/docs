import { readFile } from 'node:fs/promises'
import { currentUser, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 1440, height: 900 }, scenario: { user: { ...currentUser, id: 2 }, following: false } })

for (const mode of ['restore', 'corrupt', 'storage-failure'] as const) {
  test(`draft backup recovery: ${mode}`, async ({ page }, testInfo) => {
    const previous = mode === 'corrupt' ? '{damaged raw draft' : JSON.stringify({ type: 'FEAT', title: '上一份草稿', text: '上一份正文', tags: [] })
    const current = JSON.stringify({ type: 'FEAT', title: '当前草稿', text: '当前正文', tags: [] })
    await page.addInitScript(({ auth, previous, current, mode }) => {
      localStorage.setItem('USER-AUTH', auth)
      const sourceKey = 'forum-publish-form-data-feat'
      localStorage.setItem(sourceKey, current)
      localStorage.setItem(`${sourceKey}-backup`, JSON.stringify({ version: 1, sourceKey, raw: previous, savedAt: Date.now() }))
      if (mode === 'storage-failure') {
        const originalSet = Storage.prototype.setItem
        Storage.prototype.setItem = function (key: string, value: string) {
          if (key === `${sourceKey}-backup`)
            throw new DOMException('Storage full', 'QuotaExceededError')
          originalSet.call(this, key, value)
        }
      }
    }, { auth: localAuth(), previous, current, mode })
    const pageErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto('feedback')
    await page.locator('.forum-sidebar-topic-row').filter({ hasText: '当前草稿' }).locator('a').click()
    const editor = page.locator('.compact-form #title')
    await expect(editor).toHaveValue('当前草稿')
    const panel = page.locator('[data-draft-recovery]')
    await panel.locator('summary').click()
    await expect(panel.getByRole('button', { name: '下载上一份备份', exact: true })).toBeVisible()
    const downloading = page.waitForEvent('download')
    await panel.getByRole('button', { name: '下载上一份备份', exact: true }).click()
    const download = await downloading
    expect(await readFile((await download.path())!, 'utf8')).toBe(previous)
    if (mode === 'corrupt') {
      await expect(panel.getByRole('button', { name: '恢复上一份草稿', exact: true })).toHaveCount(0)
      await expect(editor).toHaveValue('当前草稿')
    }
    else {
      await editor.fill('尚未保存的修改')
      await panel.getByRole('button', { name: '恢复上一份草稿', exact: true }).click()
      await expect(panel).toContainText('未保存的修改会丢弃')
      await panel.getByRole('button', { name: '取消', exact: true }).click()
      await expect(editor).toHaveValue('尚未保存的修改')
      await panel.getByRole('button', { name: '恢复上一份草稿', exact: true }).click()
      await panel.getByRole('button', { name: '确认恢复草稿', exact: true }).click()
      if (mode === 'storage-failure') {
        await expect(panel).toContainText('恢复失败')
        await expect(editor).toHaveValue('尚未保存的修改')
        expect(await page.evaluate(() => localStorage.getItem('forum-publish-form-data-feat'))).toBe(current)
      }
      else {
        await expect(panel).toContainText('草稿已恢复到编辑器')
        await expect(editor).toHaveValue('上一份草稿')
        const saved = await page.evaluate(() => ({
          state: JSON.parse(localStorage.getItem('forum-publish-form-data-feat')!),
          backup: JSON.parse(localStorage.getItem('forum-publish-form-data-feat-backup')!),
        }))
        expect(saved.state.text).toBe('上一份正文')
        expect(saved.backup.raw).toBe(current)
        await page.screenshot({ path: testInfo.outputPath('draft-recovered.png') })
      }
    }
    expect(pageErrors).toEqual([])
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  })
}
