<script setup lang="ts">
import type { FORUM } from '@/src/forum/components/types.d.ts'
import { Button } from '@theme/components/ui/button/index.ts'
import { useI18n } from 'vue-i18n'
import ForumResponsiveMenu from '../ui/responsive/ForumResponsiveMenu.vue'

defineProps<{
  menus: FORUM.TopicDropdownMenu[]
}>()

const { t } = useI18n({ useScope: 'global' })
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
        :aria-label="t('forum.topic.menu.moreActions')"
        class="text-xs text-[var(--vp-c-text-2)] leading-none rounded-full h-7 w-7"
      >
        <span class="i-lucide-ellipsis h-4 w-4 block" aria-hidden="true" />
      </Button>
    </template>
  </ForumResponsiveMenu>
</template>
