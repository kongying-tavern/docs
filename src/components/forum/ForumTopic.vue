<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import type { FORUM } from './types'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import User from '@/components/ui/User.vue'
import { useLanguage } from '@/composables/useLanguage'

import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { getLangPath } from '@/utils'
import { useCached, useToggle } from '@vueuse/core'
import { isArray } from 'lodash-es'

import { useData, useRouter, withBase } from 'vitepress'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { scrollTo } from '~/composables/scrollTo'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTextCollapse } from '~/composables/useTextCollapse'
import { useTopicComments } from '~/composables/useTopicComment'
import ForumCommentInputBox from './ForumCommentInputBox.vue'
import ForumRoleBadge from './ForumRoleBadge.vue'
import ForumTagList from './ForumTagList.vue'
import ForumTime from './ForumTime.vue'
import ForumTopicComment from './ForumTopicComment.vue'
import ForumTopicDropdownMenu from './ForumTopicDropdownMenu.vue'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicTranslator from './ForumTopicTranslator.vue'
import ForumTopicTypeBadge from './ForumTopicTypeBadge.vue'
import ForumUserHoverCard from './user/ForumUserHoverCard.vue'

const { topic, viewMode } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  comment?: ForumAPI.Comment
  viewMode: FORUM.TopicViewMode
}>()

const replyTarget = ref('')
const userSubmittedComment = ref<ForumAPI.Comment[]>([])
const translator = useTemplateRef('translator')
const renderedText = sanitizeMarkdown(topic.content.text)
const userAuth = useUserAuthStore()
const router = useRouter()

const { localeIndex } = useData()
const { message } = useLocalized()
const { isOfficial } = useRuleChecks()
const { submitComment } = useTopicComments()
const { isNoTranslationRequirement } = useLanguage()
const { isExpanded, hasOverflow, collapseText, toggleExpand }
  = useTextCollapse(renderedText)
const [inReply, toggleReply] = useToggle()

const isPost = topic.type === 'POST'
const role = computed(() => (isOfficial(topic.user.id).value ? 'official' : null))
const isAnn = computed(() => topic.type === 'ANN')
const showComment = computed(() => isArray(topic.relatedComments) && topic.type !== 'ANN')
const hash = computed({
  get: () => location.hash.slice(1),
  set: val => (location.hash = val),
})
const isCardMode = computed(() => viewMode === 'Card')
const isCompactMode = computed(() => viewMode === 'Compact')

const cachedHash = useCached(hash, (_a, b) => !b.includes('reply'))

const menu = computed<FORUM.TopicDropdownMenu[]>(() => {
  if (
    topic.type === 'ANN'
    || !userAuth.isTokenValid
    || topic.language === 'zh-CN'
    || isNoTranslationRequirement.value
  ) {
    return []
  }

  return [
    {
      type: 'item',
      id: 'translator',
      label: '翻译贴子',
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

async function toPostDetailPage(hash?: string) {
  const path = isPost ? `blog/${(topic as ForumAPI.Post).path}` : `feedback/topic/${topic.id}`
  return await router.go(withBase(`${getLangPath(localeIndex.value)}${path}${hash ? `#${hash}` : ''}`))
}

async function handleToggleCommentInput(user: ForumAPI.User) {
  if (isCompactMode.value) {
    return toPostDetailPage('reply')
  }

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
    class="forum-topic-item my-1 w-full rounded-xl px-4 py-2 hover:bg-[var(--vp-c-bg-soft)]" :class="[topic.type]"
  >
    <div class="topic-content">
      <div class="flex justify-between break-words font-size-5 font-[var(--vp-font-family-title)]">
        <div class="relative min-w-0 flex flex-wrap items-center gap-[0.25rem] text-12">
          <ForumUserHoverCard :user="topic.user">
            <template #trigger>
              <User class="cursor-pointer" size="xs" :name="topic.user.username" :to="`./user/${topic.user.login}`" :avatar="{ src: topic.user.avatar, alt: topic.user.login }" />
            </template>
          </ForumUserHoverCard>
          <ForumRoleBadge :type="role" />
          <span class="my-0 inline-block text-xs color-[--vp-c-text-3]">•</span>
          <ForumTime
            class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
            :date="topic.createdAt"
          />
        </div>

        <ForumTopicDropdownMenu :topic-data="topic" :menu="[...(menu ?? [])]" />
      </div>

      <div :class="{ 'flex w-full justify-between': isCompactMode }">
        <div
          class="cursor-pointer" :class="{ 'max-w-[calc(100%-100px)] overflow-hidden': isCompactMode }"
          @click="toPostDetailPage()"
        >
          <h4
            class="line-clamp-2 mt-2 flex break-words"
            :class="{ 'font-size-4.5 font-[--vp-font-family-title]': isCardMode, 'font-size-3.5 font-[--vp-font-family-subtitle]': isCompactMode }"
          >
            <p v-if="topic.type !== 'BUG'" class="line-clamp-2">
              {{ isCompactMode ? topic.title.length < 10 ? renderedText : topic.title : topic.title }}
            </p>
            <p v-else-if="isCompactMode" class="line-clamp-2">
              {{ renderedText }}
            </p>
          </h4>

          <ForumTopicTypeBadge v-if="isCardMode" :type="topic.type" />

          <article
            v-if="isCardMode"
            class="mt-1 overflow-hidden whitespace-pre-wrap pr-4 font-size-3.5 opacity-99 transition-all duration-300"
          >
            <div :class="{ 'line-clamp-4': !(isExpanded || isAnn) }">
              {{ isAnn ? renderedText : collapseText }}
            </div>

            <Button v-if="isPost" class="px-0 font-size-4" variant="link" @click.stop="toPostDetailPage()">
              {{ message.forum.readMore }}
            </Button>

            <Button
              v-else-if="!isAnn && hasOverflow && !isExpanded" class="px-0 font-size-4" variant="link"
              @click.stop="toggleExpand()"
            >
              {{ message.forum.topic.showMore }}
            </Button>
          </article>
        </div>

        <div
          v-if="isCompactMode"
          class="relative ml-2 mt-1 h-75px min-w-100px flex items-center overflow-hidden border border-[var(--vp-c-divider)] rounded-sm transition"
        >
          <Image
            v-if="topic.content?.images" :src="topic.content.images[0].src" :alt="topic.content.images[0].alt"
            :thumb-hash="topic.content.images[0].thumbHash" :width="topic.content.images[0].width"
            :height="topic.content.images[0].height" class="h-75px w-100px object-cover"
          />
          <div v-else class="size-full flex items-center justify-center bg-[--vp-c-bg-soft]">
            <span class="i-lucide-square-menu" />
          </div>
          <span
            v-if="topic.content?.images && topic.content?.images?.length > 1"
            class="absolute bottom-1 right-1 h-18px flex items-center justify-center rounded-2px bg-[rgba(0,0,0,.5)] p-1 font-size-xs c-white"
          >
            <span class="i-lucide-image size-3 bg-white" />
            {{ topic.content?.images?.length }}
          </span>
        </div>
      </div>

      <ForumTopicTranslator
        v-if="isCardMode" ref="translator" :content="renderedText"
        :source-language="topic.language"
      />
      <div v-if="topic.content?.images && viewMode !== 'Compact'" class="topic-content-img mt-2 flex cursor-pointer">
        <Image
          v-for="img in topic.content.images" :key="img.src" :src="img.src" :alt="img.alt"
          :thumb-hash="img.thumbHash" :width="img.width" :height="img.height" :preload="true"
          class="mr-4 max-h-30 max-w-30 min-h-22 min-w-22 rounded-sm object-cover"
        />
      </div>
    </div>

    <ForumTagList v-if="isCardMode" class="mt-2" :data="topic.tags" />

    <ForumTopicFooter
      v-if="topic.type !== 'POST'"
      :class="{ 'mt-4': isCardMode, 'mt-2': isCompactMode }" :topic-data="topic"
      :comment-id="isAnn ? -1 : 1" :view-mode="viewMode" @comment:click="handleToggleCommentInput"
    />

    <div v-if="showComment && topic.relatedComments && viewMode !== 'Compact'" class="topic-comment">
      <ForumTopicComment
        v-for="(commentItem, index) in [
          ...topic.relatedComments,
          ...userSubmittedComment,
        ]" :key="commentItem.id" v-motion-slide-top class="bg-[var(--vp-c-bg-soft)] px-4 first:mt-4"
        :class="{ 'rounded-b-none': inReply && index > 0, 'rounded-t-none': index > 0 }" repo="Feedback" size="small"
        :comment-count="-1" :comment-data="commentItem" :topic-author-id="topic.user.id" :topic-id="topic.id"
        @comment:click="handleToggleCommentInput"
      />
    </div>
    <ForumCommentInputBox
      v-if="inReply && viewMode !== 'Compact'" :id="`reply-${topic.id}`" repo="Feedback"
      class="rounded-md bg-[var(--vp-c-bg-soft)] px-8 pb-4" :class="{
        'rounded-t-none': showComment && topic.relatedComments,
        'important:py-4': !topic.relatedComments,
      }" :topic-id="String(topic.id)" :reply-target="replyTarget" :collapse="false"
      @comment:submit="handleCommentSubmit"
    />
  </div>
</template>

<style>
.forum-topic-item:not(.ANN):hover>div>a>h4>p {
  text-decoration: underline;
}

.forum-topic-item:not(.ANN):hover>div>a {
  cursor: pointer;
}

.forum-topic-item:has(.ANN):hover>div>a {
  cursor: default;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes fade-out {
  to {
    opacity: 0;
  }
}
</style>
