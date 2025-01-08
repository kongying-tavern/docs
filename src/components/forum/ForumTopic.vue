<template>
  <Transition mode="out-in">
    <div
      :id="'topic-' + topic.id"
      :class="[
        topic.type,
        'forum-topic-item w-full p-b-2 p-t-6 border-b-1 border-[var(--vp-c-divider)]',
      ]"
    >
      <div class="topic-content">
        <a @click="sessionCacheRedirect(topic)" target="_blank">
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
        <a @click="sessionCacheRedirect(topic)" target="_blank">
          <article
            ref="text"
            class="font-size-4 mt-3.5 pr-4 opacity-99 overflow-hidden whitespace-pre-wrap transition-all duration-300"
            :class="{
              // 'line-clamp-4': !(isExpanded || isAnn),
            }"
          >
            {{ renderText }}
            <Button
              v-if="!isAnn && hasOverflow && !isExpanded"
              class="px-0 font-size-4"
              variant="link"
              @click.stop="toggleExpand()"
            >
              {{ message.forum.topic.showMore }}
            </Button>
          </article>
        </a>

        <ForumTagList class="mb-4" :data="topic.tags" />

        <div
          class="topic-content-img flex mt-2 cursor-pointer"
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
      </div>
      <div class="topic-info mt-4">
        <ForumTopicMeta
          :topic-id="topic.id"
          :created-at="topic.createdAt"
          :comment-count="topic.commentCount"
          :comment-id="isAnn ? -1 : 1"
          :author-id="topic.user.id"
          :commentClickHandler="() => sessionCacheRedirect(topic, 'reply')"
        ></ForumTopicMeta>
      </div>
      <div class="topic-comment" v-if="showComment && topic.relatedComments">
        <ForumTopicComment
          class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
          v-for="comment in topic.relatedComments.slice(0, 1)"
          :comment-count="-1"
          :comment-id="comment.id"
          :created-at="comment.createdAt"
          :topic-author-id="topic.user.id"
          :topicId="topic.id"
          :body="comment.content"
          :author="comment.author"
          size="small"
          :commentClickHandler="
            () => sessionCacheRedirect(topic, 'reply-' + comment.id)
          "
        >
        </ForumTopicComment>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'
import ForumRuleBadge from './ForumRuleBadge.vue'
import ForumTagList from './ForumTagList.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import ForumTopicMeta from './ForumTopicMeta.vue'
import { Image } from '@/components/ui/image'
import { Button } from '@/components/ui/button'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { useToggle } from '@vueuse/core'
import { useLocalized } from '@/hooks/useLocalized'
import { sessionCacheRedirect } from '~/composables/sessionCacheRedirect'

const userInfo = useUserInfoStore()
const topicTypeMap = getTopicTypeMap()
const { message } = useLocalized()

const { title, author, topic } = defineProps<{
  title: string
  content: ForumAPI.Content
  author: ForumAPI.User
  topic: ForumAPI.Topic
  comment?: ForumAPI.Comment
}>()

const [isExpanded, toggleExpand] = useToggle()

const renderText = computed(() => {
  if (isAnn.value) return topic.contentRaw.replace(/!\[.*?\]\(.*?\)/g, '')
  return topic.contentRaw
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .slice(0, isExpanded.value ? undefined : 180)
})

const hasOverflow = computed(
  () => topic.contentRaw.replace(/!\[.*?\]\(.*?\)/g, '').length > 180,
)
const isTeamMember = computed(() => userInfo.isTeamMember(author.id).value)
const isAnn = computed(() => topic.type === 'ANN')
const showComment = computed(
  () => topic.relatedComments && topic.type !== 'ANN',
)
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
