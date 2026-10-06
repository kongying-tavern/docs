<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { ref } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
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
  <div class="topic-comment-item rounded-md flex" :class="[COMMENT_STYLES[props.size].container, { 'comment-normal': props.size === 'normal' }]">
    <div v-if="props.size !== 'small'" class="comment-avatar mr-2 w-[64px]">
      <ForumUserHoverCard :user="props.commentData.author">
        <template #trigger>
          <a class="cursor-pointer" :href="userHref(props.commentData.author.login)" :data-forum-user="props.commentData.author.login">
            <Avatar data-forum-user-avatar :src="props.commentData.author.avatar" :alt="props.commentData.author.username" :size="COMMENT_STYLES[props.size].avatarSize" />
          </a>
        </template>
      </ForumUserHoverCard>
    </div>
    <div class="comment-main comment-info flex w-[calc(100%-40px)]" :class="COMMENT_STYLES[props.size].contentContainer">
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
      <span v-else class="title font-size-xs flex whitespace-nowrap items-baseline">
        {{ props.commentData.author.username }}
        <!-- 视觉居中：pill 上移使其相对用户名正文对称，同时让 pill 内的文字自身居中（pt+pb 之和不变，pill 高度不变） -->
        <ForumRoleBadge class="translate-y-[-0.75px] important:mb-0 [&>span]:pb-[1.2px] [&>span]:pt-[3.8px]" :type="role" />
        :
      </span>

      <ForumTopicTranslator
        v-if="props.size !== 'small'"
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
          width: img.width,
          height: img.height,
          alt: img.alt || '',
          thumbHash: img.thumbHash,
        }))"
        layout="row"
        adaptive-row
        :row-max-height="160"
        :max-display="3"
        :context="{
          kind: 'comment',
          comment: props.commentData,
          repo: props.repo,
          topicAuthorId: props.topicAuthorId,
        }"
        class="mt-4 max-w-[28rem]"
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

    <!-- small 的正文与用户名同行，译文状态行放到该行之外，避免整行宽度被它占满 -->
    <ForumTopicTranslator
      v-if="props.size === 'small'"
      :content="content.text"
      @translated="showTranslatedContent"
      @close="showingTranslation = false"
    />
  </div>
</template>

<style scoped>
.content :deep(img[data-emoji]) {
  display: inline-block;
  width: 20px;
  height: 20px;
  max-width: 20px;
  margin-inline: 1px;
  object-fit: contain;
}

.last-comment > .comment-info {
  border: none !important;
}
@media (max-width: 959px) {
  .comment-normal .comment-avatar {
    flex-shrink: 0;
    width: 40px;
  }
  .comment-normal .comment-main {
    flex: 1;
    min-width: 0;
  }
  .comment-normal .title {
    flex-wrap: wrap;
  }
  .comment-normal .content :deep(pre) {
    overflow-x: auto;
    max-width: 100%;
  }
}

.topic-comment-item:target {
  animation: comment-highlight 2s ease-out;
  outline: 2px solid oklch(var(--ring));
  outline-offset: 4px;
}

@keyframes comment-highlight {
  from {
    background: var(--vp-c-brand-soft);
  }
}

@media (prefers-reduced-motion: reduce) {
  .topic-comment-item:target {
    animation: none;
  }
}
</style>
