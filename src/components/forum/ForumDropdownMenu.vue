<script setup lang="ts">
import type { FORUM } from './types'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'

defineProps<{
  items: FORUM.TopicDropdownMenu[]
}>()

function getKey(item: FORUM.TopicDropdownMenu, index: number) {
  if (item.type === 'separator')
    return `separator-${index}`
  if (item.type === 'group')
    return `group-${index}`
  return item.id
}

function sortByOrder(items: FORUM.TopicDropdownMenu[]): FORUM.TopicDropdownMenu[] {
  const orderedItems = items.filter(item => item.order !== undefined)

  // 排序有 order 的部分
  orderedItems.sort((a, b) => {
    if (a.order === 'last')
      return 1
    if (b.order === 'last')
      return -1
    return (a.order as number) - (b.order as number)
  })

  // 合并：按照原数组 items 顺序插入
  let orderedIndex = 0
  return items.map(item =>
    item.order === undefined ? item : orderedItems[orderedIndex++],
  )
}
</script>

<template>
  <template v-for="(item, index) in sortByOrder(items)" :key="getKey(item, index)">
    <DropdownMenuSeparator v-if="item.type === 'separator'" :id="getKey(item, index)" />

    <DropdownMenuLabel v-else-if="item.type === 'label'" :id="item.id" :class="item.class">
      <span v-if="item.icon" class="mr-2 icon-btn" :class="item.icon" />
      {{ item.label }}
    </DropdownMenuLabel>

    <DropdownMenuGroup v-else-if="item.type === 'group'" :id="getKey(item, index)">
      <ForumDropdownMenu :items="item.items" />
    </DropdownMenuGroup>

    <DropdownMenuItem v-else-if="item.type === 'item'" :id="item.id" :disabled="item.disabled" :class="item.class" @click="item.action">
      <span v-if="item.icon" class="mr-2 icon-btn" :class="item.icon" />
      <span>{{ item.label }}</span>
      <DropdownMenuShortcut v-if="item.shortcut">
        {{ item.shortcut }}
      </DropdownMenuShortcut>
    </DropdownMenuItem>

    <DropdownMenuSub v-else-if="item.type === 'submenu'">
      <DropdownMenuSubTrigger :id="item.id" :class="item.class">
        <span v-if="item.icon" class="mr-2 icon-btn" :class="item.icon" />
        <span>{{ item.label }}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <ForumDropdownMenu :items="item.items" />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  </template>
</template>
