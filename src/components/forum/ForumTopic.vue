<template>
  <Transition mode="out-in">
    <div
      :class="[
        topic.type,
        'forum-topic-item w-full p-b-4 p-t-6 border-b-1 border-[var(--vp-c-divider)]',
      ]"
    >
      <div class="topic-content">
        <a @click="sessionCacheRedirect()" target="_blank">
          <h4 class="font-size-5 break-words flex justify-between">
            <p>
              {{ title }}
              <ForumRuleBadge :type="isTeamMember ? 'official' : null" />
            </p>
            <p v-if="topic.type">
              <span
                class="inline-flex items-center px-1 pt-.5 text-center font-size-3 rounded-0.5 align-middle text-xs font-semibold transition-colors color-[#b2b2b2] border-[#bdbdbd] border border-solid"
                >{{ topicTypeMap.get(topic.type) }}</span
              >
            </p>
          </h4>
        </a>
        <a @click="sessionCacheRedirect()" target="_blank">
          <!-- 非公告类型限制在三行以内 -->
          <article
            class="font-size-4 mt-3.5 pr-4 opacity-99 overflow-hidden"
            :class="isAnn ? 'whitespace-pre-wrap' : 'line-clamp-3 max-h-30'"
            v-text="topic.contentRaw.replace(/!\[.*?\]\(.*?\)/g, '')"
          ></article>
        </a>

        <div
          class="topic-content-img flex mt-4 cursor-pointer"
          v-if="topic.content?.images"
        >
          <Image
            v-for="(img, index) in topic.content.images"
            :key="index"
            :src="img.src"
            :alt="img.alt"
            class="max-h-24 mr-4 rounded-sm"
          />
        </div>

        <ForumTagList class="my-2" :data="topic.tags" />
      </div>
      <div class="topic-info mt-4">
        <ForumTopicMeta
          type="topic"
          :topic-id="topic.id"
          :created-at="topic.createdAt"
          :comment-count="topic.commentCount"
          :comment-id="isAnn ? -1 : 1"
          :author-id="topic.user.id"
        ></ForumTopicMeta>
      </div>
      <div class="topic-comment" v-if="showComment && topic.importantComments">
        <ForumTopicComment
          class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
          v-for="comment in topic.importantComments.slice(0, 1)"
          :comment-count="-1"
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
import type ForumAPI from '@/apis/forum/api'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { withBase } from 'vitepress'
import { computed } from 'vue'
import ForumRuleBadge from './ForumRuleBadge.vue'
import ForumTagList from './ForumTagList.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import ForumTopicMeta from './ForumTopicMeta.vue'
import { Image } from '@/components/ui/image'
import { getTopicTypeMap } from '../../composables/getTopicTypeMap'

const userInfo = useUserInfoStore()
const topicTypeMap = getTopicTypeMap()

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

const sessionCacheRedirect = (hash?: string) => {
  if (props.topic.type === 'ANN') return
  sessionStorage.setItem('issue-info', JSON.stringify(props.topic))

  window.open(
    withBase(`./topic?number=${props.topic.id}${hash ? `#${hash}` : ''}`),
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

.forum-topic-item:not(.ANN):hover > div > a > h4 > p {
  text-decoration: underline;
}

.forum-topic-item:not(.ANN):hover > div > a {
  cursor: pointer;
}

.forum-topic-item:has(.ANN):hover > div > a {
  cursor: default;
}
</style>
