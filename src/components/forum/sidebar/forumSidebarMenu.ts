export interface ForumSidebarMenuItem {
  label: string
  icon: string
  href?: string
  external?: boolean
  separatorBefore?: boolean
  danger?: boolean
  keepOpen?: boolean
  action?: () => void
}
