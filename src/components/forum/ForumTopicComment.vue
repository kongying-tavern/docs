<template>
  <div
    class="topic-comment-item rounded-md flex mt-2"
    :class="style[size].container"
  >
    <div :class="style[size].leftWidth">
      <Avatar
        :src="author.avatar"
        :alt="author.username"
        :size="style[size].avatarSize"
      />
    </div>
    <div
      class="flex flex-col w-[calc(100%-40px)]"
      :class="style[size].contentContainer"
    >
      <div class="title flex" :class="style[size].header">
        <p class="font-size-3.5">{{ author.username }}</p>

        <ForumRuleBadge :type="userRule" />
      </div>

      <article
        class="content mt-3 font-size-3.5"
        :class="style[size].content"
        v-html="body.text"
      ></article>

      <div class="topic-content-img flex mt-4" v-if="body?.images">
        <img
          v-for="(img, ind) in body.images"
          :key="ind"
          :src="img.src"
          :alt="img.alt"
          class="max-h-24 mr-4 rounded-sm"
        />
      </div>

      <div class="comment-info mt-2">
        <TopicMeta
          :topic-id="topicId"
          :created-at="createdAt"
          :tags="tags"
          :comment-id="commentId"
          :author-id="author.id"
          :comments="commentCount"
          :comment-click-handler="commentClickHandler"
        >
        </TopicMeta>
      </div>

      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import TopicMeta from './TopicMeta.vue'
import { useUserInfoStore } from '@/stores'
import { useData } from 'vitepress'
import type ForumAPI from '@/apis/forum/api'
import ForumRuleBadge from './ForumRuleBadge.vue'
import { computed } from 'vue'

const { theme } = useData()

const { size = 'normal', ...props } = defineProps<{
  body: ForumAPI.Content
  topicId: string | number
  topicAuthorId: string | number
  createdAt: string
  commentId: string | number
  commentCount?: number
  author: ForumAPI.User
  commentClickHandler?: () => void
  tags?: ForumAPI.TopicTags
  size?: 'small' | 'normal'
}>()

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

const userInfo = useUserInfoStore()

const userRule = computed(() => {
  if (props.author.id === props.topicAuthorId) return 'author'
  if (userInfo.isTeamMember(props.author.id)) return 'official'
  return null
})
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
