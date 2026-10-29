<script setup lang="ts">
import type { DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { defineTopicDropdownMenu } from '~/forum/composables/util/defineTopicDropdownMenu'
import ForumResponsiveMenu from '../ui/responsive/ForumResponsiveMenu.vue'

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

const { t } = useI18n({ useScope: 'global' })
const providerMenu = defineTopicDropdownMenu(() => topicData, t)
const dropdownMenu = computed(() => providerMenu.value)
const items = computed(() => [...menu, ...dropdownMenu.value])
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
        :aria-label="t('forum.topic.menu.moreActions')"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <span class="i-lucide-ellipsis icon-btn bg-[var(--vp-c-text-3)]" aria-hidden="true" />
      </Button>
    </template>
  </ForumResponsiveMenu>
</template>
