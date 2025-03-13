<script setup lang="ts">
import type { FORUM } from '~/components/forum/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ForumDropdownMenu from './ForumDropdownMenu.vue'

defineProps<{
  menus: FORUM.TopicDropdownMenu[]
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="topic-btn-more h-auto align-mid opacity-0 important:clear-bg"
      >
        <span class="i-custom-ellipsis-vertical icon-btn" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="top" class="text-nowrap">
      <ForumDropdownMenu :items="menus" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
