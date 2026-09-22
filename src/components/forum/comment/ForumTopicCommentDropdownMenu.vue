<script setup lang="ts">
import type { FORUM } from '~/components/forum/types'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import ForumResponsiveMenu from '../ui/responsive/ForumResponsiveMenu.vue'

defineProps<{
  menus: FORUM.TopicDropdownMenu[]
}>()

const { message } = useLocalized()
</script>

<template>
  <ForumResponsiveMenu
    :items="menus"
    side="top"
    align="end"
  >
    <template #trigger>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        :aria-label="message.forum.topic.menu.moreActions"
        class="text-xs text-[var(--vp-c-text-2)] leading-none rounded-full h-7 w-7"
      >
        <span class="i-lucide-ellipsis h-4 w-4 block" aria-hidden="true" />
      </Button>
    </template>
  </ForumResponsiveMenu>
</template>
