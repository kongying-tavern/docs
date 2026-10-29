<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { X } from '@lucide/vue'
import { useRouter } from 'vitepress'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import ForumTopicPreviewContent from './ForumTopicPreviewContent.vue'

const props = defineProps<{
  topic: ForumAPI.Topic | null
  /** 打开时自动聚焦评论输入框 */
  focusComment?: boolean
}>()

const open = defineModel<boolean>({ default: false })

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { topicHref } = useForumRoute()

function goToTopicDetail(): void {
  const topic = props.topic
  if (!topic)
    return
  router.go(topicHref(String(topic.id), null))
}
</script>

<template>
  <Dialog v-if="topic" v-model:open="open">
    <DialogContent
      class="topic-preview-dialog p-0 flex flex-col gap-0 overflow-hidden sm:max-w-[600px]"
      style="top: clamp(16px, 8dvh, 80px); max-width: min(600px, calc(100vw - 32px)); max-height: calc(100dvh - clamp(16px, 8dvh, 80px) - 16px); translate: -50% 0;"
      :aria-describedby="undefined"
      :show-close-button="false"
    >
      <div class="preview-header px-4 py-3 flex shrink-0 items-center justify-between sm:px-5">
        <DialogTitle class="font-size-5 font-[var(--vp-font-family-subtitle)] m-0">
          {{ t('forum.topic.previewTitle') }}
        </DialogTitle>
        <DialogClose as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :aria-label="t('ui.button.close')"
          >
            <X class="size-4" />
          </Button>
        </DialogClose>
      </div>

      <div
        class="preview-body p-4 overscroll-contain min-h-0 overflow-y-auto sm:p-5"
      >
        <ForumTopicPreviewContent
          :topic="topic"
          :focus-comment="focusComment"
          @detail-click="goToTopicDetail"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>

<style>
html[data-reduced-motion='true'] .topic-preview-dialog[data-state] {
  animation: none !important;
}

.topic-preview-dialog .preview-header {
  border-bottom: 1px solid var(--vp-c-divider);
}
</style>
