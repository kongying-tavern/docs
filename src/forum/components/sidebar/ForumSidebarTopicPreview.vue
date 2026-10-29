<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import type { SavedTopicDraft } from '~/forum/services/form/topicDraft'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useForumTopicQuery } from '~/forum/composables/data/useForumQueries'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { decodeForumText } from '~/forum/services/forumContentCodec'
import ForumQuotedTopicCard from '../topic/ForumQuotedTopicCard.vue'
import ForumTime from '../ui/ForumTime.vue'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  topicId: string
  title: string
  topic?: ForumAPI.Topic
  draft?: SavedTopicDraft
}>()
const { t } = useI18n({ useScope: 'global' })
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
const requestedOpen = ref(false)
const contextMenuActive = ref(false)
const open = computed({
  get: () => requestedOpen.value && !isMobile.value && canHover.value && !contextMenuActive.value,
  set: value => requestedOpen.value = value,
})
const query = useForumTopicQuery(() => open.value && !props.topic && !props.draft ? props.topicId : '')
const topic = computed(() => props.topic ?? query.data.value)
const draftText = computed(() => props.draft ? decodeForumText(props.draft.text).text : '')
function closeForContextMenu(): void {
  requestedOpen.value = false
  contextMenuActive.value = true
}
</script>

<template>
  <HoverCard v-model:open="open" :open-delay="400" :close-delay="150">
    <HoverCardTrigger
      as-child
      v-bind="$attrs"
      @contextmenu.capture="closeForContextMenu"
      @pointerleave="contextMenuActive = false"
      @click="requestedOpen = false"
    >
      <slot />
    </HoverCardTrigger>
    <HoverCardContent
      v-if="!isMobile && canHover"
      side="right"
      align="start"
      :side-offset="12"
      :collision-padding="16"
      class="forum-sidebar-topic-preview p-0 overscroll-contain max-h-[min(480px,calc(100dvh-32px))] max-w-[calc(100vw-32px)] w-96 overflow-y-auto"
      :aria-label="t('forum.topic.previewTitle')"
    >
      <div v-if="draft" class="p-3 flex flex-col gap-2">
        <div class="text-xs text-muted-foreground flex gap-2 items-center justify-between">
          <span>{{ t('forum.publish.feedbackForm.draftBadge') }}</span>
          <ForumTime v-if="draft.savedAt" :date="draft.savedAt" :toggleable="false" class="shrink-0 whitespace-nowrap" />
        </div>
        <strong class="text-sm break-words">{{ title }}</strong>
        <p class="text-sm whitespace-pre-wrap break-words line-clamp-6">
          {{ draftText }}
        </p>
      </div>
      <ForumQuotedTopicCard
        v-else
        :reference="{ id: topicId }"
        :topic="topic"
        :loading="query.isLoading.value"
        :unavailable="Boolean(query.error.value)"
        :interactive="false"
        compact
        embedded
        @retry="query.refetch()"
      />
    </HoverCardContent>
  </HoverCard>
</template>
