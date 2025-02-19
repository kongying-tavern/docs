<template>
  <div
    :id="'topic-' + topic.id"
    :class="[
      topic.type,
      'forum-topic-item w-full p-b-2 p-t-6 border-b-1 border-[var(--vp-c-divider)]',
    ]"
    v-motion-slide-top
  >
    <div class="topic-content">
      <a @click="sessionCacheRedirect(topic)" target="_blank">
        <h4
          class="font-size-5 break-words flex justify-between font-[var(--vp-font-family-title)]"
        >
          <p>
            {{ title }}
            <ForumRoleBadge :type="role" />
          </p>
          <p class="mr-2" v-if="topic.type">
            <span
              class="inline-flex items-center px-1 pt-.5 text-nowrap text-center font-size-3 rounded-0.5 align-middle text-xs font-semibold transition-colors color-[#b2b2b2] border-[#bdbdbd] border border-solid"
            >
              {{ topicTypeMap.get(topic.type) }}
            </span>
          </p>
        </h4>
      </a>
      <a @click="sessionCacheRedirect(topic)" target="_blank">
        <article
          ref="text"
          class="font-size-4 mt-3.5 pr-4 opacity-99 overflow-hidden whitespace-pre-wrap transition-all duration-300"
        >
          <div :class="{ 'line-clamp-4': !(isExpanded || isAnn) }">
            {{ isAnn ? renderedText : collapseText }}
          </div>

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

      <div
        class="topic-content-img flex mt-2 cursor-pointer"
        v-if="topic.content?.images"
      >
        <Image
          v-for="img in topic.content.images"
          :key="img.src"
          :image="img.src"
          :alt="img.alt"
          class="max-h-30 max-w-30 object-cover mr-4 rounded-sm"
        />
      </div>
    </div>

    <ForumTagList class="mt-2" :data="topic.tags" />

    <div class="topic-info mt-4">
      <ForumTopicFooter
        :topicData="topic"
        :comment-id="isAnn ? -1 : 1"
        @comment:click="handleToggleCommentInput"
      ></ForumTopicFooter>
    </div>
    <div class="topic-comment" v-if="showComment && topic.relatedComments">
      <ForumTopicComment
        class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
        :class="{ 'rounded-b-none': inReply }"
        repo="Feedback"
        v-for="comment in topic.relatedComments.slice(0, 1)"
        :comment-count="-1"
        :commentData="comment"
        :topic-author-id="topic.user.id"
        :topicId="topic.id"
        size="small"
        @comment:click="handleToggleCommentInput"
      >
      </ForumTopicComment>
    </div>
    <ForumCommentInputBox
      v-if="inReply"
      :id="'reply-' + topic.id"
      repo="Feedback"
      class="bg-[var(--vp-c-bg-soft)] rounded-md pb-4 px-8"
      :class="{
        'rounded-t-none': showComment && topic.relatedComments,
        'pt-4': topic.relatedComments?.length === 0,
      }"
      :topic-id="String(topic.id)"
      :reply-target="replyTarget"
      :collapse="false"
      @comment:submit="handleCommentSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, type Ref } from 'vue'
import { Image } from '@/components/ui/image'
import { Button } from '@/components/ui/button'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { useCached, useToggle } from '@vueuse/core'
import { useLocalized } from '@/hooks/useLocalized'
import { sessionCacheRedirect } from '~/composables/sessionCacheRedirect'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicComments } from '~/composables/useTopicComment'
import { useTextCollapse } from '~/composables/useTextCollapse'
import { scrollTo } from '~/composables/scrollTo'
import ForumRoleBadge from './ForumRoleBadge.vue'
import ForumTagList from './ForumTagList.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumCommentInputBox from './ForumCommentInputBox.vue'

import type ForumAPI from '@/apis/forum/api'
import { isArray } from 'lodash-es'

const { title, author, topic } = defineProps<{
  title: string
  content: ForumAPI.Content
  author: ForumAPI.User
  topic: ForumAPI.Topic
  comment?: ForumAPI.Comment
}>()

const replyTarget = ref('')
const topicTypeMap = getTopicTypeMap()
const renderedText = sanitizeMarkdown(topic.contentRaw)

const { message } = useLocalized()
const { isOfficial } = useRuleChecks()
const { submitComment } = useTopicComments()
const { isExpanded, hasOverflow, collapseText, toggleExpand } =
  useTextCollapse(renderedText)

const [inReply, toggleReply] = useToggle()

const role = computed(() => (isOfficial(author.id).value ? 'official' : null))
const isAnn = computed(() => topic.type === 'ANN')
const showComment = computed(
  () => isArray(topic.relatedComments) && topic.type !== 'ANN',
)
const hash = computed({
  get: () => location.hash.slice(1),
  set: (val) => (location.hash = val),
})
const cachedHash = useCached(hash, (a, b) => !b.includes('reply'))

const handleCommentSubmit = (submittedComment: Ref<ForumAPI.Comment>) =>
  submitComment(submittedComment)

const handleToggleCommentInput = async (user: ForumAPI.User) => {
  if (
    user.username === replyTarget.value ||
    !replyTarget.value ||
    !inReply.value
  ) {
    toggleReply()
  }

  if (inReply.value) {
    replyTarget.value = user.username

    await nextTick(() => {
      hash.value = `reply-${topic.id}`

      scrollTo({
        offset: -300,
      })
    })

    location.hash = cachedHash.value
  }
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
