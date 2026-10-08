import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { useRuleChecks } from '../../src/forum/composables/auth/useRuleChecks'

const mocks = vi.hoisted(() => ({
  userId: undefined as number | undefined,
  team: new Set<number>(),
  feedback: new Set<number>(),
  blog: new Set<number>(),
}))

vi.mock('~/forum/stores/auth/useUserInfo', () => ({
  useUserInfoStore: () => ({ info: mocks.userId === undefined ? undefined : { id: mocks.userId } }),
}))
vi.mock('~/forum/composables/auth/usePermissionData', async () => {
  const { computed } = await import('vue')
  return {
    usePermissionData: () => ({
      getTeamMemberIds: computed(() => mocks.team),
      getFeedbackMemberIds: computed(() => mocks.feedback),
      getBlogMemberIds: computed(() => mocks.blog),
    }),
  }
})

function setup(options: { userId?: number, team?: number[], feedback?: number[], blog?: number[] } = {}) {
  mocks.userId = options.userId
  mocks.team = new Set(options.team ?? [])
  mocks.feedback = new Set(options.feedback ?? [])
  mocks.blog = new Set(options.blog ?? [])
}

test('team membership grants every management permission', () => {
  setup({ userId: 7, team: [7] })
  const checks = useRuleChecks()
  assert.equal(checks.hasAnyPermissions('manage_blog').value, true)
  assert.equal(checks.hasAllPermissions('write_blog', 'manage_feedback').value, true)
  assert.equal(checks.hasAnyRoles('teamMember').value, true)
  assert.equal(checks.hasAllRoles('teamMember', 'author').value, false)
})

test('non-members hold no roles or permissions', () => {
  setup({ userId: 9, team: [7], feedback: [7], blog: [7] })
  const checks = useRuleChecks()
  assert.equal(checks.hasAnyPermissions('edit_feedback').value, false)
  assert.equal(checks.hasAnyRoles('teamMember', 'feedbackMember', 'blogMember').value, false)
  assert.equal(checks.hasAllPermissions('edit_feedback').value, false)
})

test('each member group maps to its own permission set', () => {
  setup({ userId: 7, feedback: [7] })
  const feedbackChecks = useRuleChecks()
  assert.equal(feedbackChecks.hasAllPermissions('manage_feedback', 'edit_feedback').value, true)
  assert.equal(feedbackChecks.hasAnyPermissions('write_blog').value, false)

  setup({ userId: 7, blog: [7] })
  const blogChecks = useRuleChecks()
  assert.equal(blogChecks.hasAllPermissions('write_blog', 'manage_feedback').value, true)
  assert.equal(blogChecks.hasAnyPermissions('edit_feedback').value, false)
})

test('the author role is only granted for the current profile id', () => {
  setup({ userId: 7 })

  const own = useRuleChecks(7)
  assert.equal(own.hasAnyRoles('author').value, true)

  const other = useRuleChecks(8)
  assert.equal(other.hasAnyRoles('author').value, false)

  // 未指定目标时不应把作者身份授予任何人
  const unset = useRuleChecks()
  assert.equal(unset.hasAnyRoles('author').value, false)

  // 远端 id 是数字、路由参数是字符串，比较必须按字符串归一
  const stringId = useRuleChecks('7')
  assert.equal(stringId.hasAnyRoles('author').value, true)
})

test('official membership covers team and feedback members', () => {
  setup({ userId: 1, team: [5], feedback: [6] })
  const checks = useRuleChecks()
  assert.equal(checks.isOfficial(5).value, true)
  assert.equal(checks.isOfficial('6').value, true)
  assert.equal(checks.isOfficial(7).value, false)

  // 调用方在作者未知时传 0，未登录也不应判定为官方
  setup({ team: [5] })
  assert.equal(useRuleChecks().isOfficial(5).value, true)
  assert.equal(useRuleChecks().isOfficial(0).value, false)
})
