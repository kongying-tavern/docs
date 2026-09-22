import type { FORUM } from '../../types'
import { SELECT_TRIGGER_CLASSES } from '@/components/ui/select/styles'

/**
 * 单选下拉的统一选项模型：桌面（SelectContent）与移动端（底部抽屉）共用，
 * group 参与分组，不传则归入根组（标题取 select 的 label prop）。
 */
export interface ForumSelectOption<T extends string = string> {
  id: T
  label: string
  hint?: string
  disabled?: boolean
  group?: string
}

/** 把扁平选项按 group 分组，保持原顺序；无 group 的合成根组（label 为空） */
export function groupSelectOptions<T extends string>(
  options: ReadonlyArray<ForumSelectOption<T>>,
): Array<{ label?: string, items: ForumSelectOption<T>[] }> {
  const groups: Array<{ label?: string, items: ForumSelectOption<T>[] }> = []
  let current: (typeof groups)[number] | undefined
  for (const option of options) {
    if (!current || current.label !== option.group) {
      current = { label: option.group, items: [] }
      groups.push(current)
    }
    current.items.push(option)
  }
  return groups
}

export const FORUM_SELECT_TRIGGER_CLASSES = [SELECT_TRIGGER_CLASSES]

/** 菜单模型的排序与 key 生成，桌面（DropdownMenu）与移动端（抽屉）渲染器共用 */
export function sortMenuItems(items: FORUM.TopicDropdownMenu[]): FORUM.TopicDropdownMenu[] {
  const orderedItems = items.filter(item => item.order !== undefined)

  orderedItems.sort((a, b) => {
    if (a.order === 'last')
      return 1
    if (b.order === 'last')
      return -1
    return (a.order as number) - (b.order as number)
  })

  let orderedIndex = 0
  return items.map(item =>
    item.order === undefined ? item : orderedItems[orderedIndex++],
  )
}

export function menuItemKey(item: FORUM.TopicDropdownMenu, index: number): string {
  if (item.type === 'separator')
    return `separator-${index}`
  if (item.type === 'group')
    return `group-${index}`
  if (item.type === 'radio-group')
    return `radio-group-${index}`
  if (item.type === 'radio-item')
    return item.id ?? `radio-item-${index}`
  return item.id ?? `${item.type}-${index}`
}

/** 按当前环境空闲预取对应分支的 chunk，避免首次点击才发起请求 */
export function prefetchForumUiBranch(loader: () => Promise<unknown>): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      void loader().catch(() => undefined)
    }, { timeout: 2000 })
  }
  else {
    setTimeout(() => {
      void loader().catch(() => undefined)
    }, 0)
  }
}
