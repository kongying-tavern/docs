<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '~/forum/api/forum'
import { computed } from 'vue'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { defineTopicDropdownMenu } from '~/forum/composables/defineTopicDropdownMenu'
import ForumDropdownMenu from './ForumDropdownMenu.vue'

const props = withDefaults(defineProps<{
  topicData: ForumAPI.Topic
  class?: HTMLAttributes['class']
  menu?: FORUM.TopicDropdownMenu[]
}>(), {
  menu: () => [],
})

const { message } = useLocalized()
// 与「更多操作」三点菜单同源：菜单项直接复用 defineTopicDropdownMenu，
// 避免在 bento 上重复实现一套话题操作
const providerMenu = defineTopicDropdownMenu(() => props.topicData, message)
const items = computed(() => [...props.menu, ...providerMenu.value])
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent
      fluid
      :class="cn('w-max text-nowrap', props.class)"
    >
      <slot name="menu" />
      <ForumDropdownMenu :items="items" />
    </ContextMenuContent>
  </ContextMenu>
</template>
