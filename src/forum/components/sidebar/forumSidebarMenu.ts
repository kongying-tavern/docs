export interface ForumSidebarMenuItem {
  label: string
  testId?: string
  icon: string
  href?: string
  external?: boolean
  separatorBefore?: boolean
  danger?: boolean
  keepOpen?: boolean
  action?: () => void
}
