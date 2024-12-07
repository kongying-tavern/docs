<template>
  <ClientOnly>
    <div class="Forum slide-enter">
      <div class="forum-container">
        <div
          class="forum-content w-[clamp(calc(100%-240px),700px,55vw)] float-left"
        >
          <DocsBreadcrumb class="mb-4" />
          <div v-if="!loading && data" class="mb-4 slide-enter">
            <h3
              id="title"
              class="font-size-[clamp(1rem,10vw,2rem)] break-words"
            >
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
              v-html="markdownit().render(data.content.text)"
            ></article>

            <div v-if="data?.tags" class="my-2">
              <span
                v-for="tag in data?.tags"
                :key="tag"
                class="px-2.5 font-size-3 inline-flex pointer-events-auto bg-[--vp-c-bg-soft] mr-2 rounded-full color-[--vp-c-text-2]"
                >#{{ tag }}</span
              >
            </div>

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
          <div v-else class="mb-4">
            <Skeleton class="w-200px h-[clamp(1rem,10vw,2rem)]"></Skeleton>

            <div class="flex items-center mt-4">
              <Skeleton class="h-32px w-32px rounded-full" />
              <Skeleton class="mx-2 h-3.5 w-[60px]" />

              <span class="color-[--vp-c-text-3]">·</span>
              <Skeleton class="mx-2 h-3 w-[100px]" />
            </div>

            <div class="space-y-4 mt-4">
              <Skeleton class="h-4 w-[100%]" />
              <Skeleton class="h-4 w-[90%]" />
              <Skeleton class="h-4 w-[80%]" />
              <Skeleton class="h-4 w-[70%]" />
            </div>

            <div class="flex my-6 space-x-2">
              <Skeleton class="mr-2 rounded-full w-80px h-28px"></Skeleton>
              <Skeleton class="mr-2 rounded-full w-80px h-28px"></Skeleton>
            </div>

            <div class="flex space-x-2 mt-6">
              <Skeleton class="h-[75px] w-[75px] rounded-xl" />
              <Skeleton class="h-[75px] w-[75px] rounded-xl" />
            </div>
          </div>
          <div class="vp-divider"></div>
          <div class="mt-8">
            <ForumTopicPageCommentArea
              :topic-id="number"
              :topic-author-id="data?.user.id!"
            />
          </div>
        </div>
        <ForumAside :show-button="false" :show-qrcode="true" />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import ForumAside from '../ForumAside.vue'
import DocsBreadcrumb from '@/components/DocsBreadcrumb.vue'
import ForumTopicPageCommentArea from './ForumTopicPageCommentArea.vue'
import { Skeleton } from '@/components/ui/skeleton'
import dayjs from 'dayjs'
import markdownit from 'markdown-it'
import { toast } from 'vue-sonner'
import { computed, watchEffect } from 'vue'
import { issues } from '@/apis/forum/gitee'
import {
  getIssueInfoFromSession,
  getIssueNumberFromUrlSearchParamsWithData,
  setPageTitle,
} from '../utils'
import { useUserInfoStore } from '@/stores'
import { useRequest } from 'vue-request'
import { useData } from 'vitepress'
import ForumRuleBadge from '../ForumRuleBadge.vue'

const { theme } = useData()

const userInfo = useUserInfoStore()
const number = getIssueNumberFromUrlSearchParamsWithData()
const sessionData = getIssueInfoFromSession()

const { data, run, loading, mutate, error } = useRequest(issues.getTopic, {
  defaultParams: [number],
  manual: true,
})

const topicTypeMap = new Map([
  ['FEAT', theme.value.forum.publish.type.feat],
  ['ANN', theme.value.forum.publish.type.ann],
  ['BUG', theme.value.forum.publish.type.bug],
  ['SUG', theme.value.forum.publish.type.sug],
])

const isTeamMember = computed(() => userInfo.isTeamMember(data.value?.user.id))

if (sessionData) {
  mutate(sessionData)
  setPageTitle(data.value?.title, topicTypeMap.get(data.value?.type || ''))
} else {
  run(number)
}

watchEffect(() => {
  if (loading.value) return
  if (error.value) {
    toast.error(theme.value.forum.loadError + error.value.message)
  }
  setPageTitle(data.value?.title, topicTypeMap.get(data.value?.type || ''))
})
</script>

<style lang="scss" scoped>
$ForumAsideWidth: 248px;

.Forum {
  flex-grow: 1;
  flex-shrink: 0;
  margin: calc(var(--vp-layout-top-height, 0px) + 48px) auto 0;
  width: 100%;
  margin-bottom: 32px;
  align-items: center;
}

.forum-container {
  margin: 0 auto;
  padding: 0 32px;
}

@media (min-width: 1440px) {
  .forum-container {
    max-width: 945px;
    padding: 0;
  }
}

@media (min-width: 768px) {
  .Forum {
    padding-bottom: 96px;
  }

  .forum-mobile-publish-btn {
    display: none;
  }
}

@media (max-width: (768 + $ForumAsideWidth)) {
  .Forum {
    margin: 36px auto 0;
  }

  .forum-content {
    width: calc(100% - $ForumAsideWidth);
    margin-right: 1.5rem;
  }
}

@media (max-width: 768px) {
  .forum-content {
    width: calc(100%);
    margin-right: 1.5rem;
  }
}

@media (max-width: 468px) {
  .forum-header {
    display: none;
  }

  .forum-content {
    width: 85vw;
    margin-right: 1.5rem;
  }
}
</style>
