import type { HTMLAttributes } from 'vue'

export namespace FORUM {
  type MenuOrder = number | 'last'

  type TopicViewMode = 'Card' | 'Compact'

  interface MenuItemBase {
    type: 'item'
    label: string
    icon?: string
    shortcut?: string
    disabled?: boolean
    class?: HTMLAttributes['class']
    action?: (() => void | Promise<any>) | (() => any)
    id?: string
    order?: MenuOrder
  }

  interface MenuLabel {
    type: 'label'
    icon?: string
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

  type MenuElement = MenuItemBase | MenuLabel | MenuSeparator | MenuGroup | MenuSubmenu

  export type TopicDropdownMenu = MenuElement
}
