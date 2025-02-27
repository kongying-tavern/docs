<template>
  <ClientOnly>
    <ForumLayout>
      <template #content>
        <div v-if="!loading && data" class="mb-4 slide-enter">
          <div class="flex justify-between items-center w-full">
            <h3
              id="title"
              class="font-size-[clamp(1rem,10vw,2rem)] lh-[1.2] break-words"
            >
              {{ data.title }}
            </h3>

            <ForumTopicDropdownMenu
              side="bottom"
              :topicData="data"
              @topic:close="handleTopicClose"
            >
              <template #trigger>
                <span
                  class="i-lucide:ellipsis icon-btn c-[var(--vp-c-text-2)]"
                />
              </template>
            </ForumTopicDropdownMenu>
          </div>

          <div class="flex items-center mt-4">
            <Avatar :src="data?.user.avatar" :alt="data?.user.username" />

            <p class="mx-2 font-size-3.5 font-[var(--vp-font-family-subtitle)]">
              {{ data?.user.username }}
            </p>

            <ForumRoleBadge :author-id="data.user.id" />

            <span class="color-[--vp-c-text-3]">·</span>

            <ForumDate
              class="color-[--vp-c-text-3] font-size-3"
              :date="data?.createdAt"
            />
          </div>

          <article
            id="content"
            class="font-size-4 line-height-6 mt-3.5 opacity-99 overflow-hidden whitespace-pre-wrap"
            v-html="renderedContent"
          ></article>

          <ForumTagList class="my-2" :data="data?.tags" />

          <div v-if="data.content.images" class="topic-content-img flex mt-6">
            <Image
              v-for="(img, index) in data.content.images"
              :key="index"
              :src="img.src"
              :alt="img.alt"
              class="max-h-24 mr-4 rounded-sm"
            />
          </div>

          <ForumTopicFooter
            prev-page-link="./"
            :text="message.forum.topic.backToFeedbackForum"
          />
        </div>

        <ForumTopicSkeletonPage v-else />

        <div class="vp-divider"></div>

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

<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import Image from '@/components/ui/image/Image.vue'
import markdownit from 'markdown-it'
import { computed, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
import ForumAside from '../ForumAside.vue'
import ForumRoleBadge from '../ForumRoleBadge.vue'
import ForumTagList from '../ForumTagList.vue'
import { getTopicNumber, setPageTitle } from '../utils'
import ForumCommentArea from '../ForumCommentArea.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'
import ForumLayout from '../ForumLayout.vue'
import { getTopicTypeMap } from '~/composables/getTopicTypeMap'
import { useLocalized } from '@/hooks/useLocalized'
import { watchOnce } from '@vueuse/core'
import { useSharedTopicInfo } from '~/composables/sharedTopicInfo'
import ForumTopicFooter from './ForumTopicFooter.vue'
import { sanitizeMarkdown } from '~/composables/sanitizeMarkdown'
import { handleError } from '~/composables/handleError'
import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumDate from '../ForumDate.vue'
import { useRouter } from 'vitepress'

const number = getTopicNumber()
const topicTypeMap = getTopicTypeMap()
const sharedTopicInfo = useSharedTopicInfo()

const { go } = useRouter()
const { message } = useLocalized()

const { data, run, loading, mutate, error } = useRequest(issues.getTopic, {
  defaultParams: [number],
  manual: true,
})

const renderedContent = computed(() =>
  sanitizeMarkdown(
    markdownit().render(sanitizeMarkdown(data.value?.contentRaw)),
  ),
)

if (sharedTopicInfo.value) {
  mutate(sharedTopicInfo.value)
} else if (!import.meta.env.SSR) {
  run(number)
}

const handleTopicClose = () => {
  go('./')
}

watchEffect(() => {
  if (loading.value) return
  setPageTitle(data.value?.title, topicTypeMap.get(data.value?.type || ''))
})

watchOnce(error, () => {
  handleError(error.value, message, {
    errorMessage: message.value.forum.loadError + error?.value?.message,
  })
})
</script>
