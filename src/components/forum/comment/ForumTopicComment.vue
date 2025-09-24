<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { EditorContent } from '@tiptap/vue-3'
import { onBeforeUnmount, onMounted } from 'vue'
import { Image } from '@/components/ui/image'
import { parseContentText } from '~/composables/tiptapJsonToText'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { useTopicComment } from './composables/useTopicComment'
import { COMMENT_STYLES } from './constants/commentStyles'
import ForumCommentFooter from './ForumCommentFooter.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    topicId: string | number
    topicAuthorId: string | number
    commentData: ForumAPI.Comment
    size?: 'small' | 'normal'
    commentClickHandler?: () => void
  }>(),
  {
    size: 'normal',
    repo: 'Feedback',
  },
)

const emit = defineEmits<{
  'comment:click': [author: ForumAPI.User]
}>()

// Use topic comment composable
const {
  editor,
  richTextData,
  role,
  isResolved: _isResolved,
  initializeEditor,
  destroyEditor,
  toggleResolvedTag,
} = useTopicComment({
  commentData: props.commentData,
  topicAuthorId: props.topicAuthorId,
})

// Event handlers
function handleCommentClick(author: ForumAPI.User): void {
  emit('comment:click', author)
}

// Lifecycle hooks
onMounted(() => {
  initializeEditor()
})

onBeforeUnmount(() => {
  destroyEditor()
})
</script>

<template>
  <div class="topic-comment-item flex rounded-md" :class="COMMENT_STYLES[props.size].container">
    <div v-if="props.size !== 'small'" class="mr-2 w-[64px]">
      <ForumUserHoverCard :user="props.commentData.author">
        <template #trigger>
          <a class="cursor-pointer" :href="`../user/${props.commentData.author.login}`">
            <Avatar :src="props.commentData.author.avatar" :alt="props.commentData.author.username" :size="COMMENT_STYLES[props.size].avatarSize" />
          </a>
        </template>
      </ForumUserHoverCard>
    </div>
    <div class="w-[calc(100%-40px)] flex" :class="COMMENT_STYLES[props.size].contentContainer">
      <div v-if="props.size !== 'small'" class="title flex" :class="COMMENT_STYLES[props.size].header">
        <ForumUserHoverCard :user="props.commentData.author">
          <template #trigger>
            <a class="font-size-3.5" :href="`../user/${props.commentData.author.login}`">
              {{ props.commentData.author.username }}
            </a>
          </template>
        </ForumUserHoverCard>

        <ForumRoleBadge class="mb-2" :type="role" />
      </div>
      <span v-else class="title flex whitespace-nowrap font-size-xs">
        {{ props.commentData.author.username }}
        <ForumRoleBadge class="important:mb-0" :type="role" />
        :
      </span>

      <EditorContent
        v-if="richTextData"
        class="content" :class="COMMENT_STYLES[props.size].content"
        :editor="editor"
      />

      <article
        v-else
        class="content whitespace-pre-wrap"
        :class="COMMENT_STYLES[props.size].content"
      >
        {{ parseContentText(props.commentData.content.text) }}
      </article>

      <div v-if="props.commentData.content.images && props.size !== 'small'" class="topic-content-img mt-4 flex flex-wrap gap-2">
        <Image
          v-for="img in props.commentData.content.images" :key="img.src" :image="img.src" :alt="img.alt"
          :thumbhash="img.thumbHash" :width="img.width" :height="img.height"
          class="max-h-24 cursor-zoom-in rounded-sm transition-colors duration-200"
        />
      </div>

      <div v-if="props.size !== 'small'" class="comment-info mt-2">
        <ForumCommentFooter
          :repo="props.repo" :comment-data="props.commentData" :comment-click-handler="props.commentClickHandler"
          :topic-id="props.topicId" :toggle-resolved-tag="toggleResolvedTag"
          @comment:click="handleCommentClick"
        />
      </div>

      <slot />
    </div>
  </div>
</template>

<style scoped>
.topic-comment-item:hover>div>.comment-info>div>.topic-info-list>.topic-btn-more {
  opacity: 1 !important;
  word-break: break-word;
}

/* 评论图片样式优化 */
.topic-content-img {
  max-width: 100%;
}

/* 错误图片样式 */
.topic-content-img :deep(.VPImage) {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.topic-content-img :deep(.VPImage:hover:not(.no-hover)) {
  border-color: var(--vp-c-brand);
}
</style>
