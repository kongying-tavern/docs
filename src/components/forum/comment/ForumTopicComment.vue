<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { ref } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumTopicTranslator from '../topic/ForumTopicTranslator.vue'
import ForumImage from '../ui/ForumImage.vue'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumUserAtTag from '../user/ForumUserAtTag.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { useTopicComment } from './composables/useTopicComment'
import { COMMENT_STYLES } from './constants/commentStyles'
import ForumCommentFooter from './ForumCommentFooter.vue'

const props = withDefaults(
  defineProps<{
    repo?: ForumAPI.Repo
    topicId: string
    topicAuthorId: string | number
    commentData: ForumAPI.Comment
    commentPage?: number
    size?: 'small' | 'normal'
    commentClickHandler?: () => void
  }>(),
  {
    size: 'normal',
    repo: 'Feedback',
    commentPage: 1,
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

const translatedText = ref('')
const showingTranslation = ref(false)

function showTranslatedContent(text: string): void {
  translatedText.value = text
  showingTranslation.value = true
}

function handleCommentClick(author: ForumAPI.User): void {
  emit('comment:click', author)
}
</script>

<template>
  <div class="topic-comment-item rounded-md flex" :class="COMMENT_STYLES[props.size].container">
    <div v-if="props.size !== 'small'" class="mr-2 w-[64px]">
      <ForumUserHoverCard :user="props.commentData.author">
        <template #trigger>
          <a class="cursor-pointer" :href="userHref(props.commentData.author.login)" :data-forum-user="props.commentData.author.login">
            <Avatar data-forum-user-avatar :src="props.commentData.author.avatar" :alt="props.commentData.author.username" :size="COMMENT_STYLES[props.size].avatarSize" />
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

        <ForumUserAtTag :user="props.commentData.author" class="ml-2" />
      </div>
      <span v-else class="title font-size-xs flex whitespace-nowrap">
        {{ props.commentData.author.username }}
        <ForumRoleBadge class="important:mb-0" :type="role" />
        :
      </span>

      <ForumTopicTranslator
        :content="content.text"
        @translated="showTranslatedContent"
        @close="showingTranslation = false"
      />

      <article
        v-if="content.kind === 'html' && !showingTranslation"
        class="content"
        :class="COMMENT_STYLES[props.size].content"
        v-html="content.html"
      />

      <article
        v-else
        class="content whitespace-pre-wrap"
        :class="COMMENT_STYLES[props.size].content"
      >
        {{ showingTranslation ? translatedText : content.text }}
      </article>

      <ForumImage
        v-if="props.commentData.content.images && props.size !== 'small'"
        :images="props.commentData.content.images.map(img => ({
          src: img.src,
          width: img.width || 1920,
          height: img.height || 1080,
          alt: img.alt || '',
          thumbHash: img.thumbHash,
        }))"
        layout="row"
        :max-display="3"
        container-class="!max-w-[28rem]"
        :context="{
          kind: 'comment',
          comment: props.commentData,
          repo: props.repo,
          topicAuthorId: props.topicAuthorId,
        }"
        class="mt-4"
      />

      <div v-if="props.size !== 'small'" class="comment-info mt-2">
        <ForumCommentFooter
          :repo="props.repo" :comment-data="props.commentData" :comment-click-handler="props.commentClickHandler"
          :topic-id="props.topicId" :comment-page="props.commentPage"
          @comment:click="handleCommentClick"
        />
      </div>

      <slot />
    </div>
  </div>
</template>

<style scoped>
.topic-comment-item:hover > div > .comment-info > div > .topic-info-list > .topic-btn-more {
  opacity: 1 !important;
  word-break: break-word;
}

.content :deep(img[data-emoji]) {
  display: inline-block;
  width: 20px;
  height: 20px;
  max-width: 20px;
  margin-inline: 1px;
  object-fit: contain;
  vertical-align: text-bottom;
}

.last-comment > .comment-info {
  border: none !important;
}

.topic-comment-item:target {
  animation: comment-highlight 2s ease-out;
}

@keyframes comment-highlight {
  from {
    background: var(--vp-c-brand-soft);
  }
}

@media (prefers-reduced-motion: reduce) {
  .topic-comment-item:target {
    animation: none;
    outline: 2px solid var(--vp-c-brand-1);
  }
}
</style>
