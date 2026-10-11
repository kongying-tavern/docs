import type { GiteeGist } from '../../src/forum/api/gitee/gists'
import { readFile } from 'node:fs/promises'
import { FORUM_STATE_BACKUP_DESCRIPTION, FORUM_STATE_BACKUP_FILE, FORUM_STATE_GIST_DESCRIPTION, FORUM_STATE_GIST_FILE } from '../../src/forum/api/gitee/gists'
import { currentUser, localAuth } from './fixtures/gitee'
import { expect, test } from './support/test'

test.use({ viewport: { width: 1440, height: 900 }, scenario: { user: currentUser, following: false } })

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(auth => localStorage.setItem('USER-AUTH', auth), localAuth())
}

const validTopic = { topicId: '123', title: '恢复的关注记录', type: 'FEAT', authorLogin: 'alice', recordedAt: '2026-10-12T00:00:00.000Z' }

for (const mode of ['repair', 'reset', 'backup-failure', 'future', 'read-failure'] as const) {
  test(`personal state recovery: ${mode}`, async ({ page, scenario, forum }, testInfo) => {
    const original = mode === 'future'
      ? JSON.stringify({ version: 2, followedTopics: [], recentParticipated: [] })
      : JSON.stringify({ version: 1, followedTopics: [validTopic, { invalid: true }], recentParticipated: [] })
    let source: GiteeGist = { id: 'source', description: FORUM_STATE_GIST_DESCRIPTION, public: false, files: { [FORUM_STATE_GIST_FILE]: { content: original } } }
    let backup: GiteeGist | undefined
    let readFailure = mode === 'read-failure'
    const writes: string[] = []
    scenario.handle = (request) => {
      if (request.method === 'GET' && request.path === '/api/v5/gists')
        return readFailure ? { status: 403, data: { message: 'Forbidden' } } : { data: [source] }
      if (request.method === 'GET' && request.path === '/api/v5/gists/source')
        return { data: source }
      if (request.method === 'POST' && request.path === '/api/v5/gists') {
        writes.push('backup')
        if (mode === 'backup-failure')
          return { status: 403, data: { message: 'Backup failed' } }
        const payload = JSON.parse(String(request.body)) as Omit<GiteeGist, 'id'>
        backup = { id: 'backup', ...payload }
        return { status: 201, data: backup }
      }
      if (request.method === 'PATCH' && request.path === '/api/v5/gists/source') {
        writes.push('update')
        source = { id: 'source', ...JSON.parse(String(request.body)) }
        return { data: source }
      }
    }
    const pageErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await signIn(page)
    await page.goto('feedback')
    await expect(page.locator('.forum-topic-item')).toHaveCount(1)
    const panel = page.locator('[data-personal-state-recovery]')
    await expect(panel).toBeVisible()
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    if (mode === 'future' || mode === 'read-failure') {
      await expect(panel).toContainText(mode === 'future' ? '当前版本不支持' : '读取失败')
      await expect(panel.getByRole('button', { name: '重置记录', exact: true })).toHaveCount(0)
      await expect(panel.getByRole('button', { name: '恢复有效记录', exact: true })).toHaveCount(0)
      expect(writes).toEqual([])
      if (mode === 'read-failure') {
        readFailure = false
        source.files[FORUM_STATE_GIST_FILE].content = JSON.stringify({ version: 1, followedTopics: [], recentParticipated: [] })
        await panel.getByRole('button', { name: '重新读取', exact: true }).click()
        await expect(panel).toHaveCount(0)
        expect(writes).toEqual([])
      }
    }
    else {
      await expect(panel).toContainText('原始内容仍保留')
      const downloadEvent = page.waitForEvent('download')
      await panel.getByRole('button', { name: '下载原始数据', exact: true }).click()
      const download = await downloadEvent
      expect(download.suggestedFilename()).toBe('forum-personal-state-original.json')
      expect(await readFile((await download.path())!, 'utf8')).toBe(original)
      await panel.getByRole('button', { name: mode === 'repair' ? '恢复有效记录' : '重置记录', exact: true }).click()
      await expect(panel).toContainText(mode === 'repair' ? '保留 1 条有效记录' : '清空关注和参与记录')
      expect(writes).toEqual([])
      if (mode === 'repair')
        await page.screenshot({ path: testInfo.outputPath('recovery-confirm.png') })
      await panel.getByRole('button', { name: '取消', exact: true }).click()
      await expect(panel.getByRole('button', { name: '确认操作', exact: true })).toHaveCount(0)
      expect(writes).toEqual([])
      await panel.getByRole('button', { name: mode === 'repair' ? '恢复有效记录' : '重置记录', exact: true }).click()
      await panel.getByRole('button', { name: '确认操作', exact: true }).click()
      if (mode === 'backup-failure') {
        await expect(panel).toContainText('操作失败')
        expect(source.files[FORUM_STATE_GIST_FILE].content).toBe(original)
        expect(writes).toEqual(['backup'])
      }
      else {
        await expect(panel).toContainText('记录已恢复')
        expect(writes).toEqual(['backup', 'update'])
        expect(backup?.description).toBe(FORUM_STATE_BACKUP_DESCRIPTION)
        expect(backup?.public).toBe(false)
        expect(JSON.parse(backup!.files[FORUM_STATE_BACKUP_FILE].content!).files[FORUM_STATE_GIST_FILE].content).toBe(original)
        const recovered = JSON.parse(source.files[FORUM_STATE_GIST_FILE].content!)
        expect(recovered.followedTopics).toHaveLength(mode === 'repair' ? 1 : 0)
        if (mode === 'repair')
          await expect(page.locator('.forum-sidebar-section').last().locator('.forum-sidebar-topic-row')).toHaveCount(1)
        if (mode === 'repair')
          await page.screenshot({ path: testInfo.outputPath('recovery-success.png') })
      }
    }
    expect(pageErrors).toEqual([])
    expect(forum.unexpected).toEqual([])
  })
}
