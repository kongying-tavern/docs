import type ForumAPI from '../api/types'

const profileKeys = ['username', 'bio', 'blog', 'weibo'] as const

/** 同步其他入口更新的资料，仅替换未修改的输入，保留尚未保存的本地编辑。 */
export function syncUserProfileDraft(
  draft: Record<string, string>,
  baseline: Record<string, string>,
  user: ForumAPI.User,
  keys: readonly (keyof ForumAPI.UserProfileUpdate)[],
): void {
  for (const key of keys) {
    const value = user[key] ?? ''
    if (draft[key] === baseline[key])
      draft[key] = value
    baseline[key] = value
  }
}

export function applyUserProfilePatch(user: ForumAPI.User, patch: ForumAPI.UserProfileUpdate): ForumAPI.User {
  const updated = { ...user }
  for (const key of profileKeys) {
    if (patch[key] !== undefined)
      updated[key] = patch[key]
  }
  return updated
}

/** 仅结算本次仍然拥有的字段，保留请求期间其他编辑写入的内容。 */
export function settleUserProfilePatch(
  current: ForumAPI.User,
  optimistic: ForumAPI.User,
  settled: ForumAPI.User,
  patch: ForumAPI.UserProfileUpdate,
): ForumAPI.User {
  const updated = { ...current }
  for (const key of profileKeys) {
    if (patch[key] !== undefined && current[key] === optimistic[key]) {
      if (key === 'username')
        updated.username = settled.username
      else
        updated[key] = settled[key]
    }
  }
  return updated
}
