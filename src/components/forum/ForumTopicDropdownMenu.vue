<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { DropdownMenuContentProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from './types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { computed } from 'vue'
import { defineTopicDropdownMenu } from '~/composables/defineTopicDropdownMenu'
import ForumDropdownMenu from './ForumDropdownMenu.vue'

defineOptions({
  inheritAttrs: false,
})

const { side = 'bottom', menu = [], topicData } = defineProps<
  {
    topicData: ForumAPI.Topic
    class?: HTMLAttributes['class']
    menu?: FORUM.TopicDropdownMenu[]
  } & DropdownMenuContentProps
>()

const { message } = useLocalized()

const dropdownMenu = computed(() => {
  if (topicData)
    return defineTopicDropdownMenu(topicData, message).value
  return []
})
</script>

<template>
  <DropdownMenu v-if="[...menu, ...dropdownMenu].length > 0">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <slot name="trigger">
          <span class="i-lucide-ellipsis icon-btn bg-[var(--vp-c-text-3)]" />
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" :side="side" class="w-max text-nowrap">
      <slot name="menu" />
      <ForumDropdownMenu :items="[...menu, ...dropdownMenu]" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
