<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import Image from '@/components/ui/image/Image.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { watchOnce } from '@vueuse/core'
import markdownit from 'markdown-it'
import { useRouter } from 'vitepress'
import { computed, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
import { defineTopicDropdownMenu } from '~/composables/defineTopicDropdownMenu'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { handleError } from '~/composables/handleError'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { useSharedTopicInfo } from '~/composables/sharedTopicInfo'
import ForumAside from '../ForumAside.vue'
import ForumCommentArea from '../ForumCommentArea.vue'
import ForumDate from '../ForumDate.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumRoleBadge from '../ForumRoleBadge.vue'
import ForumTagList from '../ForumTagList.vue'
import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumTopicTranslator from '../ForumTopicTranslator.vue'
import { getTopicNumber, setPageTitle } from '../utils'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'

const number = getTopicNumber()
const topicTypeMap = getTopicTypeMap()
const sharedTopicInfo = useSharedTopicInfo()

const { go } = useRouter()
const { message } = useLocalized()

const { data, run, loading, mutate, error } = useRequest(issues.getTopic, {
  defaultParams: [number],
  manual: true,
})

const menu = computed(() => defineTopicDropdownMenu(data.value).value)

const renderedContent = computed(() =>
  sanitizeMarkdown(
    markdownit().render(sanitizeMarkdown(data.value?.content.text)),
  ),
)

if (sharedTopicInfo.value) {
  mutate(sharedTopicInfo.value)
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
  setPageTitle(data.value?.title || '', topicTypeMap.get(data.value?.type || ''))
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
        <div v-if="!loading && data" class="slide-enter mb-4">
          <div class="w-full flex items-center justify-between">
            <h3
              id="title"
              class="break-words font-size-[clamp(1rem,10vw,2rem)] lh-[1.2]"
            >
              {{ data.title }}
            </h3>

            <ForumTopicDropdownMenu
              side="bottom"
              :topic-data="data"
              :menu="menu"
              @topic:close="handleTopicClose"
            >
              <template #trigger>
                <span
                  class="i-lucide:ellipsis icon-btn c-[var(--vp-c-text-2)]"
                />
              </template>
            </ForumTopicDropdownMenu>
          </div>

          <div class="mt-4 flex items-center">
            <Avatar :src="data?.user.avatar" :alt="data?.user.username" />

            <p class="mx-2 font-size-3.5 font-[var(--vp-font-family-subtitle)]">
              {{ data?.user.username }}
            </p>

            <ForumRoleBadge :author-id="data.user.id" />

            <span class="color-[--vp-c-text-3]">·</span>

            <ForumDate
              class="font-size-3 color-[--vp-c-text-3]"
              :date="data?.createdAt"
            />
          </div>

          <article
            id="content"
            class="mt-3.5 overflow-hidden whitespace-pre-wrap font-size-4 line-height-6 opacity-99"
            v-html="renderedContent"
          />

          <ForumTopicTranslator
            class="font-size-4 line-height-6"
            :content="renderedContent"
            :source-language="data?.language"
          />

          <ForumTagList class="my-2" :data="data?.tags" />

          <div v-if="data.content.images" class="topic-content-img mt-6 flex">
            <Image
              v-for="(img, index) in data.content.images"
              :key="index"
              :src="img.src"
              :alt="img.alt"
              :thumb-hash="img?.thumbHash"
              :width="img?.width"
              :height="img?.height"
              class="mr-4 max-h-24 rounded-sm"
            />
          </div>

          <ForumTopicFooter
            prev-page-link="./"
            :text="message.forum.topic.backToFeedbackForum"
          />
        </div>

        <ForumTopicSkeletonPage v-else />

        <div class="vp-divider" />

        <ForumCommentArea
          class="mt-8"
          repo="Feedback"
          :topic-id="number"
          :topic-author-id="data?.user.id || -1"
          :comment-count="data?.commentCount"
        />
      </template>

      <template #aside>
        <ForumAside :show-button="false" :contact-us="true" />
      </template>
    </ForumLayout>
  </ClientOnly>
</template>
