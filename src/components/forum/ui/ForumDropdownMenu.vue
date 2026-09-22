<script setup lang="ts">
import type { FORUM } from '../types'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import ForumHintIcon from './ForumHintIcon.vue'
import ForumTopicStatusBadge from './ForumTopicStatusBadge.vue'
import { menuItemKey, sortMenuItems } from './responsive/shared'

defineProps<{
  items: FORUM.TopicDropdownMenu[]
}>()

function getRadioCheckedValue(group: FORUM.MenuRadioGroup): string {
  return group.items.find(item => item.checked)?.value ?? ''
}

function handleRadioSelect(group: FORUM.MenuRadioGroup, value: string) {
  group.items.find(item => item.value === value)?.onChange?.(value)
}
</script>

<template>
  <template v-for="(item, index) in sortMenuItems(items)" :key="menuItemKey(item, index)">
    <DropdownMenuSeparator v-if="item.type === 'separator'" :id="menuItemKey(item, index)" />

    <DropdownMenuLabel v-else-if="item.type === 'label'" :id="item.id" :class="item.class">
      <!-- 图标与提示图标都是块级元素，同处一行才与文字对齐 -->
      <span class="inline-flex gap-1 items-center">
        <span v-if="item.icon" class="mr-2 icon-btn" :class="item.icon" />
        {{ item.label }}
        <ForumHintIcon v-if="item.hint" :label="item.hint" />
      </span>
    </DropdownMenuLabel>

    <div v-else-if="item.type === 'info'" :id="item.id" class="text-xs text-muted-foreground leading-snug px-2 py-1" :class="[item.class]">
      {{ item.label }}
    </div>

    <DropdownMenuGroup v-else-if="item.type === 'group'" :id="menuItemKey(item, index)">
      <ForumDropdownMenu :items="item.items" />
    </DropdownMenuGroup>

    <DropdownMenuRadioGroup
      v-else-if="item.type === 'radio-group'"
      :id="menuItemKey(item, index)"
      :model-value="getRadioCheckedValue(item)"
      @update:model-value="handleRadioSelect(item, $event)"
    >
      <DropdownMenuLabel v-if="item.label">
        {{ item.label }}
      </DropdownMenuLabel>
      <DropdownMenuRadioItem
        v-for="radio in item.items"
        :key="radio.id ?? radio.value"
        :value="radio.value"
        :disabled="radio.disabled"
        :class="radio.class"
      >
        <span v-if="radio.icon" class="mr-2 icon-btn bg-[--vp-c-text-2] size-4" :class="radio.icon" />
        {{ radio.label }}
        <ForumHintIcon v-if="radio.hint" :label="radio.hint" />
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>

    <DropdownMenuItem v-else-if="item.type === 'item'" :id="item.id" :disabled="item.disabled" :class="item.class" @click="item.action">
      <ForumTopicStatusBadge v-if="item.status !== undefined" :status="item.status ?? undefined" />
      <span v-else-if="item.icon" class="mr-2 icon-btn" :class="item.icon" />
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
