<script setup lang="ts">
import type { FORUM } from '~/components/forum/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import ForumDropdownMenu from './ForumDropdownMenu.vue'

defineProps<{
  menus: FORUM.TopicDropdownMenu[]
}>()

const { message } = useLocalized()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        :aria-label="message.forum.topic.menu.moreActions"
        class="topic-btn-more align-mid h-auto important:clear-bg"
      >
        <span class="i-custom-ellipsis-vertical icon-btn" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="top" class="text-nowrap">
      <ForumDropdownMenu :items="menus" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
