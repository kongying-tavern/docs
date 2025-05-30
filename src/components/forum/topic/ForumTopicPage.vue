<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import { Button } from '@/components/ui/button'
import Image from '@/components/ui/image/Image.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { watchOnce } from '@vueuse/core'
import markdownIt from 'markdown-it'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { handleError } from '~/composables/handleError'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { useForumData } from '~/stores/useForumData'
import ForumAside from '../ForumAside.vue'
import ForumCommentArea from '../ForumCommentArea.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumRoleBadge from '../ForumRoleBadge.vue'
import ForumTagList from '../ForumTagList.vue'

import ForumTime from '../ForumTime.vue'
import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumTopicTranslator from '../ForumTopicTranslator.vue'
import ForumTopicTypeBadge from '../ForumTopicTypeBadge.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { setPageTitle } from '../utils'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'

const topicTypeMap = getTopicTypeMap()

const forumData = useForumData()

const { params, localeIndex } = useData()
const { go } = useRouter()
const { message } = useLocalized()

const { data: topic, run, loading, mutate, error } = useRequest(issues.getTopic, {
  defaultParams: [params.value?.id],
  manual: true,
  onError: (err) => {
    if (err.message.includes('404 Not Found')) {
      return go(withBase(`${getLangPath(localeIndex.value)}404.html`))
    }
  },
})

const targetTopicData = forumData.topics.find(val => val.id === params.value?.id)

const renderedContent = computed(() =>
  sanitizeMarkdown(
    markdownIt().render(sanitizeMarkdown(topic?.value?.content.text)),
  ),
)

if (targetTopicData) {
  mutate(targetTopicData)
}
else if (!import.meta.env.SSR) {
  run(params.value?.id)
}

const gridClass = computed(() => {
  if (!topic.value)
    return ''
  const count = topic.value.content.images?.length || 0
  if (count === 1)
    return 'grid-cols-1'
  if (count === 2)
    return 'grid-cols-2'
  if (count === 3 || count >= 4)
    return 'grid-cols-2'
  return 'grid-cols-1'
})

function imageClass(index: number) {
  if (!topic.value)
    return ''
  const count = topic.value.content.images?.length || 0
  if (count === 3 && index === 2)
    return 'col-span-2 aspect-video'
  return 'aspect-square'
}

function backToPreviousPage() {
  if (window.history.state?.idx === 1) {
    return go(withBase(`${getLangPath(localeIndex.value)}feedback/`))
  }

  window.history.back()
}

watchEffect(() => {
  if (loading.value)
    return
  setPageTitle(topic.value?.type === 'BUG'
    ? `${topic.value
      .content
      .text
      .substring(0, 6)}...`
    : topic.value?.title || '', topicTypeMap.get(topic.value?.type || ''))
})

watchOnce(error, () => {
  handleError(error.value, message, {
    errorMessage: message.value.forum.loadError + error?.value?.message,
  })
})
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #content>
        <div v-if="!loading && topic" class="slide-enter mb-4">
          <div class="w-full flex items-center justify-between">
            <div class="relative min-w-0 flex flex-wrap items-center gap-[0.25rem] text-14">
              <Button variant="ghost" class="mr-1 w-36px flex items-center rounded-full bg-[var(--vp-c-bg-alt)] max-sm:hidden" @click="backToPreviousPage()">
                <span class="i-lucide-arrow-left icon-btn" />
              </Button>
              <ForumUserHoverCard :user="topic.user">
                <template #trigger>
                  <User size="sm" :name="topic.user.username" :to="`../user/${topic.user.login}`" :avatar="{ src: topic.user.avatar, alt: topic.user.login }" />
                </template>
              </ForumUserHoverCard>
              <ForumRoleBadge :author-id="topic.user.id" />
              <span class="my-0 inline-block text-xs color-[--vp-c-text-3]">•</span>
              <ForumTime
                class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
                :date="topic.createdAt"
              />
            </div>

            <ForumTopicDropdownMenu side="bottom" :topic-data="topic" @topic:close="backToPreviousPage" />
          </div>

          <h3 v-if="topic.type !== 'BUG'" id="title" class="m-0 mb-xs mt-2 overflow-hidden break-words text-xl font-semibold md:mb-1 md:text-1.5rem">
            {{ topic.title }}
          </h3>

          <ForumTopicTypeBadge class="mt-3" :type="topic.type" />

          <article
            id="content" class="mt-3.5 overflow-hidden whitespace-pre-wrap font-size-4 line-height-6 opacity-99"
            v-html="renderedContent"
          />

          <ForumTopicTranslator
            class="font-size-4 line-height-6" :content="renderedContent"
            :source-language="topic?.language"
          />

          <ForumTagList class="my-2" :data="topic?.tags" />

          <div v-if="topic?.content.images" class="topic-content-img grid mt-6 w-full gap-1 overflow-hidden rounded-sm" :class="gridClass">
            <Image
              v-for="(img, index) in topic?.content.images" :key="index" :src="img.src" :alt="img.alt"
              :thumb-hash="img?.thumbHash" :width="img?.width" :height="img?.height" class="size-full" :class="imageClass(index)"
            />
          </div>

          <ForumTopicFooter prev-page-link="./" :topic-id="String(topic.id)" :text="message.forum.topic.backToFeedbackForum" />
        </div>

        <ForumTopicSkeletonPage v-else />

        <div class="vp-divider" />

        <ForumCommentArea
          class="mt-8" repo="Feedback" :topic-id="params?.id" :topic-author-id="topic?.user.id || -1"
          :comment-count="topic?.commentCount"
        />
      </template>

      <template #aside>
        <ForumAside :show-button="false" :contact-us="true" />
      </template>
    </ForumLayout>
  </ClientOnly>
</template>
