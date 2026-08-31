<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { X } from '@lucide/vue'
import { useRouter } from 'vitepress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumTopicPreviewContent from './ForumTopicPreviewContent.vue'

const props = defineProps<{
  topic: ForumAPI.Topic | null
  /** 打开时自动聚焦评论输入框 */
  focusComment?: boolean
}>()

const open = defineModel<boolean>({ default: false })

const { message } = useLocalized()
const router = useRouter()
const { topicHref } = useForumRoute()

/**
 * 预览窗口内点击进入详情页：标题/正文链接（原生 <a>）以及空白区域；
 * 其余控件（展开按钮/图片/评论输入框等）正常放行。
 */
function handlePreviewClick(event: MouseEvent) {
  const topic = props.topic
  if (!topic)
    return
  const target = event.target as HTMLElement
  if (target.closest('a, button, img, input, [data-comment-input]'))
    return
  router.go(topicHref(String(topic.id), null))
}
</script>

<template>
  <Dialog v-if="topic" v-model:open="open">
    <DialogContent
      class="p-0 overflow-hidden sm:max-w-[600px]"
      :show-close-button="false"
    >
      <div class="preview-header px-4 py-3 flex items-center justify-between">
        <p class="font-size-5 font-[var(--vp-font-family-subtitle)] m-0">
          {{ message.forum.topic.previewTitle }}
        </p>
        <DialogClose as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :aria-label="message.ui.button.close"
          >
            <X class="size-4" />
          </Button>
        </DialogClose>
      </div>

      <div
        class="preview-body p-6 pt-2 flex flex-col gap-4 max-h-[calc(85vh-53px)] overflow-y-auto"
        @click="handlePreviewClick"
      >
        <ForumTopicPreviewContent
          :topic="topic"
          :focus-comment="focusComment"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.preview-header {
  border-bottom: 1px solid var(--vp-c-divider);
}

.preview-body::-webkit-scrollbar {
  display: none;
}
</style>
