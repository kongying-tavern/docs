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
import { cn } from '@/lib/utils'
import ForumDropdownMenu from './ForumDropdownMenu.vue'

defineOptions({
  inheritAttrs: false,
})

const { side = 'top' } = defineProps<
  {
    topicData: ForumAPI.Topic
    class?: HTMLAttributes['class']
    menu: FORUM.TopicDropdownMenu[]
  } & DropdownMenuContentProps
>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <slot name="trigger">
          <span class="i-custom-ellipsis-vertical icon-btn" />
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent :side="side" class="w-max text-nowrap">
      <slot name="menu" />
      <ForumDropdownMenu :items="menu" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
