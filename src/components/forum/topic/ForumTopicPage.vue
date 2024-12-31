<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <DocsBreadcrumb class="mb-4" />
      </template>

      <template #content>
        <div v-if="!loading && data" class="mb-4 slide-enter">
          <h3 id="title" class="font-size-[clamp(1rem,10vw,2rem)] break-words">
            {{ data.title }}
          </h3>

          <div class="flex items-center mt-4">
            <Avatar :src="data?.user.avatar" :alt="data?.user.username" />
            <p class="mx-2 font-size-3.5">{{ data?.user.username }}</p>
            <ForumRuleBadge :type="isTeamMember ? 'official' : null" />

            <span class="color-[--vp-c-text-3]">·</span>

            <time
              class="color-[--vp-c-text-3] font-size-3"
              :datetime="data?.createdAt"
            >
              {{ dayjs(data?.createdAt).format('YYYY/MM/DD HH:mm') }}
            </time>
          </div>

          <article
            id="content"
            class="font-size-4 mt-3.5 opacity-99 overflow-hidden"
            v-html="sanitizeHtml(markdownit().render(data.content.text))"
          ></article>

          <ForumTagList class="my-2" :data="data?.tags" />
          <div v-if="data.content.images" class="topic-content-img flex mt-4">
            <img
              v-for="(img, index) in data.content.images"
              :key="index"
              :src="img.src"
              :alt="img.alt"
              class="max-h-24 mr-4 rounded-sm"
            />
          </div>
        </div>

        <ForumTopicSkeletonPage v-else />

        <div class="vp-divider"></div>

        <ForumTopicPageCommentArea
          class="mt-8"
          :topic-id="number"
          :topic-author-id="data?.user.id!"
        />
      </template>

      <template #aside>
        <ForumAside :show-button="false" :show-qrcode="true" />
      </template>
    </ForumLayout>
  </ClientOnly>
</template>

<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import DocsBreadcrumb from '@/components/DocsBreadcrumb.vue'
import { useUserInfoStore } from '@/stores/useUserInfo'
import dayjs from 'dayjs'
import markdownit from 'markdown-it'
import { useData } from 'vitepress'
import { computed, watchEffect } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import ForumAside from '../ForumAside.vue'
import ForumRuleBadge from '../ForumRuleBadge.vue'
import {
  getIssueInfoFromSession,
  getIssueNumberFromUrlSearchParamsWithData,
  setPageTitle,
} from '../utils'
import ForumTopicPageCommentArea from './ForumTopicPageCommentArea.vue'
import { sanitizeHtml } from '../../../composables/sanitizeHtml'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'
import ForumLayout from '../ForumLayout.vue'
import { watch } from 'vue'
import { getTopicTypeMap } from '../../../composables/getTopicTypeMap'

const { theme } = useData()

const userInfo = useUserInfoStore()
const number = getIssueNumberFromUrlSearchParamsWithData()
const sessionData = getIssueInfoFromSession()
const topicTypeMap = getTopicTypeMap()

const { data, run, loading, mutate, error } = useRequest(issues.getTopic, {
  defaultParams: [number],
  manual: true,
})

const isTeamMember = computed(() => userInfo.isTeamMember(data.value?.user.id))

if (sessionData) {
  mutate(sessionData)
  setPageTitle(data.value?.title, topicTypeMap.get(data.value?.type || ''))
} else {
  run(number)
}

watchEffect(() => {
  if (loading.value) return
  setPageTitle(data.value?.title, topicTypeMap.get(data.value?.type || ''))
})

watch(error, () => {
  if (!error.value) return
  toast.error(theme.value.forum.loadError + error.value.message)
})
</script>
