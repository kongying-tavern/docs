<script setup lang="ts">
import type { DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { defineTopicDropdownMenu } from '~/forum/composables/defineTopicDropdownMenu'
import ForumResponsiveMenu from '../ui/responsive/ForumResponsiveMenu.vue'

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
const items = computed(() => [...props.menu, ...dropdownMenu.value])
</script>

<template>
  <ForumResponsiveMenu
    :items="items"
    :side="side"
    align="start"
  >
    <template #trigger>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        :aria-label="message.forum.topic.menu.moreActions"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <span class="i-lucide-ellipsis icon-btn bg-[var(--vp-c-text-3)]" aria-hidden="true" />
      </Button>
    </template>
  </ForumResponsiveMenu>
</template>
