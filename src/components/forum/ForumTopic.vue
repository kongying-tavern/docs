<template>
  <Transition mode="out-in">
    <div
      class="forum-topic-item w-full p-b-4 p-t-6 border-b-1 border-[var(--vp-c-divider)]"
    >
      <div class="topic-content">
        <a
          @click="sessionCacheRedirect()"
          target="_blank"
          class="cursor-pointer"
        >
          <h4 class="font-size-5 break-words flex justify-between">
            <p>
              {{ title }}
              <ForumRuleBadge :type="isTeamMember ? 'official' : null" />
            </p>
            <p v-if="topic.type">
              <span
                class="inline-flex items-center px-1 pt-.5 text-center font-size-3 rounded-0.5 align-middle text-xs font-semibold transition-colors color-[#b2b2b2] border-[#bdbdbd] border border-solid"
                >{{ getTopicTypeText }}</span
              >
            </p>
          </h4>
        </a>
        <a
          @click="sessionCacheRedirect()"
          target="_blank"
          class="cursor-pointer"
        >
          <!-- 非公告类型限制在三行以内 -->
          <article
            class="font-size-4 mt-3.5 pr-4 opacity-99 max-h-30 overflow-hidden"
            :class="isAnn ? '' : 'line-clamp-3'"
          >
            {{ topic.content.text }}
          </article>
        </a>

        <div
          class="topic-content-img flex mt-4 cursor-pointer"
          v-if="topic.content?.images"
        >
          <img
            v-for="(img, index) in topic.content.images"
            :key="index"
            :src="img.src"
            :alt="img.alt"
            class="max-h-24 mr-4 rounded-sm"
          />
        </div>

        <div class="my-2">
          <span
            v-for="tag in topic.tags"
            :key="tag"
            class="px-2.5 font-size-3 inline-flex pointer-events-auto bg-[--vp-c-bg-soft] mr-2 rounded-full color-[--vp-c-text-2]"
            >#{{ tag }}</span
          >
        </div>
      </div>
      <div class="topic-info mt-4">
        <TopicMeta
          :topic-id="topic.id"
          :created-at="topic.createdAt"
          :tags="topic.tags"
          :comment-count="topic.commentCount"
          :author-id="topic.user.id"
        ></TopicMeta>
      </div>
      <div class="topic-comment" v-if="showComment && topic.importantComments">
        <ForumTopicComment
          class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
          v-for="comment in topic.importantComments.slice(0, 1)"
          :comment-count="topic.commentCount"
          :comment-id="comment.id"
          :created-at="comment.createdAt"
          :topic-author-id="topic.user.id"
          :topicId="topic.id"
          :body="comment.content"
          :author="comment.author"
          size="small"
        >
        </ForumTopicComment>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import TopicMeta from './TopicMeta.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import { computed } from 'vue'
import { useUserInfoStore } from '@/stores'
import { useData, withBase } from 'vitepress'
import type ForumAPI from '@/apis/forum/api'
import ForumRuleBadge from './ForumRuleBadge.vue'

const userInfo = useUserInfoStore()
const { theme } = useData()

const props = defineProps<{
  title: string
  content: ForumAPI.Content
  author: ForumAPI.User
  topic: ForumAPI.Topic
  comment?: ForumAPI.Comment
}>()

const isTeamMember = computed(() => userInfo.isTeamMember(props.author.id))
const isAnn = computed(() => props.topic.type === 'ANN')
const showComment = computed(
  () => props.topic.importantComments && props.topic.type !== 'ANN',
)

const getTopicTypeText = computed(() => {
  switch (props.topic.type) {
    case 'ANN':
      return theme.value.forum.topic.type.ann
    case 'BUG':
      return theme.value.forum.topic.type.bug
    case 'FEAT':
      return theme.value.forum.topic.type.feat
    case 'SUG':
      return theme.value.forum.topic.type.suggest
    default:
      return ''
  }
})

const sessionCacheRedirect = (hash?: string) => {
  if (props.topic.type === 'ANN') return
  sessionStorage.setItem('issue-info', JSON.stringify(props.topic))

  window.open(
    withBase(
      `/feedback/topic?number=${props.topic.id}${hash ? `#${hash}` : ''}`,
    ),
  )
}
</script>

<style>
.forum-topic-item:hover
  > .topic-info
  > div
  > .topic-info-list
  > .topic-btn-more {
  opacity: 1 !important;
}

.forum-topic-item:hover > div > a > h4 > p {
  text-decoration: underline;
}
</style>
