<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import Image from '@/components/ui/image/Image.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { watchOnce } from '@vueuse/core'
import markdownIt from 'markdown-it'
import { useRouter } from 'vitepress'
import { computed, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { handleError } from '~/composables/handleError'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { useForumData } from '~/stores/useForumData'
import ForumAside from '../ForumAside.vue'
import ForumCommentArea from '../ForumCommentArea.vue'
import ForumDate from '../ForumDate.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumRoleBadge from '../ForumRoleBadge.vue'
import ForumTagList from '../ForumTagList.vue'

import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumTopicTranslator from '../ForumTopicTranslator.vue'
import ForumTopicTypeBadge from '../ForumTopicTypeBadge.vue'
import { getTopicNumber, setPageTitle } from '../utils'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'

const number = getTopicNumber()
const topicTypeMap = getTopicTypeMap()

const forumData = useForumData()
const targetTopicData = forumData.topics.find(val => val.id === number)

const { go } = useRouter()
const { message } = useLocalized()

const { data: topic, run, loading, mutate, error } = useRequest(issues.getTopic, {
  defaultParams: [number],
  manual: true,
})
const renderedContent = computed(() =>
  sanitizeMarkdown(
    markdownIt().render(sanitizeMarkdown(topic?.value?.content.text)),
  ),
)

if (targetTopicData) {
  mutate(targetTopicData)
}
else if (!import.meta.env.SSR) {
  run(number)
}

function handleTopicClose() {
  go('./')
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
              <User size="sm" :name="topic.user.username" :avatar="{ src: topic.user.avatar, alt: topic.user.login }" />
              <ForumRoleBadge :author-id="topic.user.id" />
              <span class="my-0 inline-block text-xs color-[--vp-c-text-3]">•</span>
              <ForumDate
                class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
                :date="topic.createdAt"
              />
            </div>

            <ForumTopicDropdownMenu side="bottom" :topic-data="topic" @topic:close="handleTopicClose" />
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

          <div v-if="topic?.content.images" class="topic-content-img mt-6 flex">
            <Image
              v-for="(img, index) in topic?.content.images" :key="index" :src="img.src" :alt="img.alt"
              :thumb-hash="img?.thumbHash" :width="img?.width" :height="img?.height" class="mr-4 max-h-24 rounded-sm"
            />
          </div>

          <ForumTopicFooter prev-page-link="./" :topic-id="String(topic.id)" :text="message.forum.topic.backToFeedbackForum" />
        </div>

        <ForumTopicSkeletonPage v-else />

        <div class="vp-divider" />

        <ForumCommentArea
          class="mt-8" repo="Feedback" :topic-id="number" :topic-author-id="topic?.user.id || -1"
          :comment-count="topic?.commentCount"
        />
      </template>

      <template #aside>
        <ForumAside :show-button="false" :contact-us="true" />
      </template>
    </ForumLayout>
  </ClientOnly>
</template>
