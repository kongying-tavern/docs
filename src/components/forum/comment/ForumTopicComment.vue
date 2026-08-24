<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { PhotoSwipe } from '@/components/ui/photoswipe'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { useTopicComment } from './composables/useTopicComment'
import { COMMENT_STYLES } from './constants/commentStyles'
import ForumCommentFooter from './ForumCommentFooter.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    topicId: string
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

const { userHref } = useForumRoute()

const {
  content,
  role,
} = useTopicComment({
  commentData: props.commentData,
  topicAuthorId: props.topicAuthorId,
})

// Event handlers
function handleCommentClick(author: ForumAPI.User): void {
  emit('comment:click', author)
}
</script>

<template>
  <div class="topic-comment-item rounded-md flex" :class="COMMENT_STYLES[props.size].container">
    <div v-if="props.size !== 'small'" class="mr-2 w-[64px]">
      <ForumUserHoverCard :user="props.commentData.author">
        <template #trigger>
          <a class="cursor-pointer" :href="userHref(props.commentData.author.login)">
            <Avatar :src="props.commentData.author.avatar" :alt="props.commentData.author.username" :size="COMMENT_STYLES[props.size].avatarSize" />
          </a>
        </template>
      </ForumUserHoverCard>
    </div>
    <div class="comment-info flex w-[calc(100%-40px)]" :class="COMMENT_STYLES[props.size].contentContainer">
      <div v-if="props.size !== 'small'" class="title flex" :class="COMMENT_STYLES[props.size].header">
        <ForumUserHoverCard :user="props.commentData.author">
          <template #trigger>
            <a class="font-size-3.5" :href="userHref(props.commentData.author.login)">
              {{ props.commentData.author.username }}
            </a>
          </template>
        </ForumUserHoverCard>

        <ForumRoleBadge class="mb-2" :type="role" />
      </div>
      <span v-else class="title font-size-xs flex whitespace-nowrap">
        {{ props.commentData.author.username }}
        <ForumRoleBadge class="important:mb-0" :type="role" />
        :
      </span>

      <article
        v-if="content.kind === 'html'"
        class="content"
        :class="COMMENT_STYLES[props.size].content"
        v-html="content.html"
      />

      <article
        v-else
        class="content whitespace-pre-wrap"
        :class="COMMENT_STYLES[props.size].content"
      >
        {{ content.text }}
      </article>

      <PhotoSwipe
        v-if="props.commentData.content.images && props.size !== 'small'"
        :images="props.commentData.content.images.map(img => ({
          src: img.src,
          width: img.width || 1920,
          height: img.height || 1080,
          alt: img.alt || '',
        }))"
        class="topic-content-img mt-4"
      >
        <template #default="{ openAt }">
          <div class="flex flex-row flex-wrap gap-2">
            <img
              v-for="(img, index) in props.commentData.content.images"
              :key="img.src"
              :src="img.src"
              :alt="img.alt || ''"
              :width="img.width"
              :height="img.height"
              class="border border-[var(--vp-c-divider)] rounded-sm flex-shrink-0 max-h-24 cursor-zoom-in transition-colors duration-200 hover:border-[var(--vp-c-brand)]"
              loading="lazy"
              @click="openAt(index)"
            >
          </div>
        </template>
      </PhotoSwipe>

      <div v-if="props.size !== 'small'" class="comment-info mt-2">
        <ForumCommentFooter
          :repo="props.repo" :comment-data="props.commentData" :comment-click-handler="props.commentClickHandler"
          :topic-id="props.topicId"
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

/* 图片样式 */
.topic-content-img img {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s ease;
}

.topic-content-img img:hover {
  border-color: var(--vp-c-brand);
}

.last-comment > .comment-info {
  border: none !important;
}
</style>
