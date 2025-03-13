<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import type { FORUM } from './types'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { useLanguage } from '@/composables/useLanguage'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'

import { useCached, useToggle } from '@vueuse/core'
import { isArray } from 'lodash-es'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { scrollTo } from '~/composables/scrollTo'
import { sessionCacheRedirect } from '~/composables/sessionCacheRedirect'

import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTextCollapse } from '~/composables/useTextCollapse'
import { useTopicComments } from '~/composables/useTopicComment'
import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumRoleBadge from './ForumRoleBadge.vue'
import ForumTagList from './ForumTagList.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicTranslator from './ForumTopicTranslator.vue'

const { title, author, topic } = defineProps<{
  title: string
  content: ForumAPI.Content
  author: ForumAPI.User
  topic: ForumAPI.Topic
  comment?: ForumAPI.Comment
}>()

const replyTarget = ref('')
const translator = useTemplateRef('translator')
const topicTypeMap = getTopicTypeMap()

const renderedText = sanitizeMarkdown(topic.contentRaw)
const userSubmittedComment = ref<ForumAPI.Comment[]>([])

const { message } = useLocalized()
const { isOfficial } = useRuleChecks()
const { submitComment } = useTopicComments()
const userAuth = useUserAuthStore()
const { isExpanded, hasOverflow, collapseText, toggleExpand }
  = useTextCollapse(renderedText)

const [inReply, toggleReply] = useToggle()

const role = computed(() => (isOfficial(author.id).value ? 'official' : null))
const isAnn = computed(() => topic.type === 'ANN')
const showComment = computed(
  () => isArray(topic.relatedComments) && topic.type !== 'ANN',
)
const hash = computed({
  get: () => location.hash.slice(1),
  set: val => (location.hash = val),
})
const cachedHash = useCached(hash, (a, b) => !b.includes('reply'))
const { noTranslationRequirement } = useLanguage()

const menu = computed<FORUM.TopicDropdownMenu[]>(() => {
  if (topic.type === 'ANN' || !userAuth.isTokenValid || topic.language === 'zh-CN' || noTranslationRequirement.value)
    return []

  return [
    {
      type: 'item',
      id: 'translator',
      label: '翻译',
      icon: 'vpi-languages option-icon',
      order: 2,
      action: () => {
        translator.value?.startTranslate()
      },
    },
  ]
})

function handleCommentSubmit(submittedComment: Ref<ForumAPI.Comment>) {
  submitComment(submittedComment)
  userSubmittedComment.value.push(submittedComment.value)
}

async function handleToggleCommentInput(user: ForumAPI.User) {
  if (
    user.username === replyTarget.value
    || !replyTarget.value
    || !inReply.value
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

<template>
  <div
    :id="`topic-${topic.id}`"
    class="forum-topic-item w-full border-b-1 border-[var(--vp-c-divider)] p-b-2 p-t-6"
    :class="[topic.type]"
  >
    <div class="topic-content">
      <a target="_blank" @click="sessionCacheRedirect(topic)">
        <h4
          class="flex justify-between break-words font-size-5 font-[var(--vp-font-family-title)]"
        >
          <p>
            {{ title }}
            <ForumRoleBadge :type="role" />
          </p>
          <p v-if="topic.type" class="mr-2">
            <span
              class="inline-flex items-center border border-[#bdbdbd] rounded-0.5 border-solid px-1 pt-.5 text-center text-nowrap align-middle text-xs font-size-3 color-[#b2b2b2] font-semibold transition-colors"
            >
              {{ topicTypeMap.get(topic.type) }}
            </span>
          </p>
        </h4>
      </a>
      <a target="_blank" @click="sessionCacheRedirect(topic)">
        <article
          class="mt-3.5 overflow-hidden whitespace-pre-wrap pr-4 font-size-4 opacity-99 transition-all duration-300"
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

      <ForumTopicTranslator ref="translator" :content="renderedText" :source-language="topic.language" />

      <div
        v-if="topic.content?.images"
        class="topic-content-img mt-2 flex cursor-pointer"
      >
        <Image
          v-for="img in topic.content.images"
          :key="img.src"
          :image="img.src"
          :alt="img.alt"
          :thumbhash="img.thumbHash"
          :width="img.width"
          :height="img.height"
          class="mr-4 max-h-30 max-w-30 min-h-22 min-w-22 rounded-sm object-cover"
        />
      </div>
    </div>

    <ForumTagList class="mt-2" :data="topic.tags" />

    <div class="topic-info mt-4">
      <ForumTopicFooter
        :topic-data="topic"
        :comment-id="isAnn ? -1 : 1"
        :menu="menu"
        @comment:click="handleToggleCommentInput"
      />
    </div>
    <div v-if="showComment && topic.relatedComments" class="topic-comment">
      <ForumTopicComment
        v-for="comment in [
          ...topic.relatedComments.slice(0, 1),
          ...userSubmittedComment,
        ]"
        :key="comment.id"
        v-motion-slide-top
        class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
        :class="{ 'rounded-b-none': inReply }"
        repo="Feedback"
        size="small"
        :comment-count="-1"
        :comment-data="comment"
        :topic-author-id="topic.user.id"
        :topic-id="topic.id"
        @comment:click="handleToggleCommentInput"
      />
    </div>
    <ForumCommentInputBox
      v-if="inReply"
      :id="`reply-${topic.id}`"
      repo="Feedback"
      class="rounded-md bg-[var(--vp-c-bg-soft)] px-8 pb-4"
      :class="{
        'rounded-t-none': showComment && topic.relatedComments,
        'important:py-4': !topic.relatedComments,
      }"
      :topic-id="String(topic.id)"
      :reply-target="replyTarget"
      :collapse="false"
      @comment:submit="handleCommentSubmit"
    />
  </div>
</template>

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
