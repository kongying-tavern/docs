import type ForumAPI from '../types'

/** 只提交 API 支持的字段；空字符串保留为显式清除，undefined 表示不修改。 */
export function buildUserProfileForm(profile: ForumAPI.UserProfileUpdate): FormData {
  const body = new FormData()
  const fields = { username: 'name', blog: 'blog', weibo: 'weibo', bio: 'bio' } as const
  for (const [key, field] of Object.entries(fields)) {
    const value = profile[key as keyof typeof fields]
    if (value !== undefined)
      body.set(field, value)
  }
  return body
}
