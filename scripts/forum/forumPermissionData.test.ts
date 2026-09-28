/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('permission member data flows through colada without ad-hoc timers', async () => {
  const source = await readFile(new URL('../../src/composables/usePermissionData.ts', import.meta.url), 'utf8')

  // 数据获取统一走 colada useQuery（缓存/失效/staleTime 归一）
  assert.match(source, /useQuery\(/)
  assert.match(source, /staleTime: CACHE_DURATION/)
  // 未登录不取数，登录后 enabled 翻转由 colada 自动取数（无手动登录 watcher）
  assert.match(source, /enabled: isLoggedIn/)
  assert.doesNotMatch(source, /watch\(isLoggedIn/)
  // 无令牌/失败降级本地 JSON 的语义保留
  assert.match(source, /parseLocalData\(teamMemberListRaw\)/)
  // 第三条数据通道的遗留物不得回归
  assert.doesNotMatch(source, /setInterval|isWatcherSetup|hasApiData: true/)
})
