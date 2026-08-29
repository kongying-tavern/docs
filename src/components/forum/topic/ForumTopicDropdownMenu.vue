<script setup lang="ts">
import type { DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { defineTopicDropdownMenu } from '~/composables/defineTopicDropdownMenu'
import ForumDropdownMenu from '../ui/ForumDropdownMenu.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<
  {
    topicData: ForumAPI.Topic
    class?: HTMLAttributes['class']
    menu?: FORUM.TopicDropdownMenu[]
  } & DropdownMenuContentProps
>(), {
  side: 'bottom',
  menu: () => [],
})

const { message } = useLocalized()
const providerMenu = defineTopicDropdownMenu(() => props.topicData, message)
const dropdownMenu = computed(() => providerMenu.value)
</script>

<template>
  <DropdownMenu v-if="[...menu, ...dropdownMenu].length > 0">
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        :aria-label="message.forum.topic.menu.moreActions"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <slot name="trigger">
          <span class="i-lucide-ellipsis icon-btn bg-[var(--vp-c-text-3)]" aria-hidden="true" />
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" :side="side" class="w-max text-nowrap">
      <slot name="menu" />
      <ForumDropdownMenu :items="[...menu, ...dropdownMenu]" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
