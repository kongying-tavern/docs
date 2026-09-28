import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'

export namespace FORUM {
  type MenuOrder = number | 'last'

  type TopicViewMode = 'CARD' | 'COMPACT'

  interface MenuItemBase {
    type: 'item'
    label: string
    icon?: string
    shortcut?: string
    disabled?: boolean
    class?: HTMLAttributes['class']
    action?: () => unknown
    id?: string
    order?: MenuOrder
    /** 行首状态色块；null 渲染空槽位（与其它行对齐），不声明则完全不占位 */
    status?: ForumAPI.TopicDisplayStatus | 'good-issue' | null
  }

  interface MenuLabel {
    type: 'label'
    icon?: string
    label: string
    /** 标题右侧的 info 图标说明，悬停可见 */
    hint?: string
    class?: HTMLAttributes['class']
    id?: string
    order?: MenuOrder
  }

  interface MenuInfo {
    type: 'info'
    label: string
    class?: HTMLAttributes['class']
    id?: string
    order?: MenuOrder
  }

  interface MenuSeparator {
    type: 'separator'
    order?: MenuOrder
  }

  interface MenuGroup {
    type: 'group'
    items: MenuElement[]
    order?: MenuOrder
  }

  interface MenuSubmenu extends Omit<MenuItemBase, 'type' | 'action' | 'shortcut'> {
    type: 'submenu'
    items: MenuElement[]
    order?: MenuOrder
  }

  interface MenuRadioItem {
    type: 'radio-item'
    id?: string
    order?: MenuOrder
    value: string
    label: string
    icon?: string
    /** 标题右侧的说明文字，移动端抽屉里直接展示为浅色小字 */
    hint?: string
    disabled?: boolean
    /** 当前是否选中。菜单每次打开都会重建 items，直接传布尔即可 */
    checked: boolean
    onChange?: (value: string) => unknown
    class?: HTMLAttributes['class']
  }

  interface MenuRadioGroup {
    type: 'radio-group'
    id?: string
    order?: MenuOrder
    label?: string
    items: MenuRadioItem[]
  }

  type MenuElement = MenuItemBase | MenuLabel | MenuInfo | MenuSeparator | MenuGroup | MenuSubmenu | MenuRadioItem | MenuRadioGroup

  export type TopicDropdownMenu = MenuElement
}
