<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { Image } from '@/components/ui/image'
import { computed } from 'vue'
import { useRuleChecks } from '~/composables/useRuleChecks'

import ForumCommentFooter from './ForumCommentFooter.vue'
import ForumRoleBadge from './ForumRoleBadge.vue'

const {
  size = 'normal',
  repo = 'Feedback',
  topicAuthorId,
  commentData,
} = defineProps<{
  repo: string
  topicId: string | number
  topicAuthorId: string | number
  commentData: ForumAPI.Comment
  size?: 'small' | 'normal'
  commentClickHandler?: () => void
}>()

const emit = defineEmits(['comment:click'])

const { isOfficial } = useRuleChecks()

const role = computed(() => {
  if (topicAuthorId === commentData.author.id)
    return 'author'
  if (isOfficial(commentData.author.id).value)
    return 'official'
  return null
})

function handleCommentClick(author: ForumAPI.User) {
  emit('comment:click', author)
}
const style = {
  small: {
    container: 'py-3',
    avatarSize: 'sm',
    leftWidth: 'w-[40px] mr-4',
    header: 'mt-1',
    contentContainer: '',
    content: 'line-clamp-3 overflow-hidden pr-4',
  },
  normal: {
    container: '',
    contentContainer: 'border-b-1 border-[var(--vp-c-divider)] pb-3',
    avatarSize: 'md',
    leftWidth: 'w-[64px] mr-2',
    header: 'mt-2',
    content: 'break-words font-size-3.75 line-height-[24px] break-all',
  },
}
</script>

<template>
  <div
    class="topic-comment-item mt-.5 flex rounded-md"
    :class="style[size].container"
  >
    <div :class="style[size].leftWidth">
      <Avatar
        :src="commentData.author.avatar"
        :alt="commentData.author.username"
        :size="style[size].avatarSize"
      />
    </div>
    <div
      class="w-[calc(100%-40px)] flex flex-col"
      :class="style[size].contentContainer"
    >
      <div class="title flex" :class="style[size].header">
        <p class="font-size-3.5">
          {{ commentData.author.username }}
        </p>

        <ForumRoleBadge :type="role" />
      </div>

      <article
        class="content mt-3 font-size-3.5"
        :class="style[size].content"
        v-html="commentData.content.text"
      />

      <div
        v-if="commentData.content.images"
        class="topic-content-img mt-4 flex"
      >
        <Image
          v-for="img in commentData.content.images"
          :key="img.src"
          :src="img.src"
          :alt="img.alt"
          :thumbhash="img.thumbHash"
          :width="img.width"
          :height="img.height"
          class="mr-4 max-h-24 rounded-sm"
        />
      </div>

      <div class="comment-info mt-2">
        <ForumCommentFooter
          :repo="repo"
          :comment-data="commentData"
          :comment-click-handler="commentClickHandler"
          @comment:click="handleCommentClick"
        />
      </div>

      <slot />
    </div>
  </div>
</template>

<style>
.topic-comment-item:hover
  > div
  > .comment-info
  > div
  > .topic-info-list
  > .topic-btn-more {
  opacity: 1 !important;
  word-break: break-word;
}
</style>
