<template>
  <div
    class="topic-comment-item rounded-md flex mt-.5"
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
      class="flex flex-col w-[calc(100%-40px)]"
      :class="style[size].contentContainer"
    >
      <div class="title flex" :class="style[size].header">
        <p class="font-size-3.5">{{ commentData.author.username }}</p>

        <ForumRoleBadge :type="role" />
      </div>

      <article
        class="content mt-3 font-size-3.5"
        :class="style[size].content"
        v-html="commentData.content.text"
      ></article>

      <div
        class="topic-content-img flex mt-4"
        v-if="commentData.content.images"
      >
        <Image
          v-for="img in commentData.content.images"
          :key="img.src"
          :src="img.src"
          :alt="img.alt"
          class="max-h-24 mr-4 rounded-sm"
        />
      </div>

      <div class="comment-info mt-2">
        <ForumCommentFooter
          :repo="repo"
          :commentData="commentData"
          :comment-click-handler="commentClickHandler"
          @comment:click="handleCommentClick"
        />
      </div>

      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import ForumRoleBadge from './ForumRoleBadge.vue'
import { Image } from '@/components/ui/image'
import ForumCommentFooter from './ForumCommentFooter.vue'
import { useRuleChecks } from '~/composables/useRuleChecks'

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
  commentClickHandler?: Function
}>()

const emit = defineEmits(['comment:click'])

const { isOfficial } = useRuleChecks()

const role = computed(() => {
  if (topicAuthorId === commentData.author.id) return 'author'
  if (isOfficial(commentData.author.id).value) return 'official'
  return null
})

const handleCommentClick = (author: ForumAPI.User) => {
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
