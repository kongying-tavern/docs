/** 当前站内可编辑的资料项；设置页和 BIO 就地编辑共用这些控件定义。 */
export const USER_PROFILE_FIELDS = [
  { key: 'username', control: 'input', required: true, autocomplete: 'nickname' },
  { key: 'bio', control: 'textarea', required: false, autocomplete: 'off' },
] as const

export const USER_PROFILE_READONLY_FIELDS = [
  { key: 'avatar', section: 'avatar', control: 'avatar' },
  { key: 'login', section: 'account', control: 'input' },
  { key: 'email', section: 'emails', control: 'input' },
] as const
