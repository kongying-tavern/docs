<script lang="ts" setup>
import type { FORUM } from './types'
import { Skeleton } from '@/components/ui/skeleton'
import { createReusableTemplate, useWindowSize } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  viewMode: FORUM.TopicViewMode
}>()

const [TopicCardSkeleton, UseTopicCardSkeleton] = createReusableTemplate()
const [TopicCompactViewSkeleton, UseTopicCompactViewSkeleton] = createReusableTemplate()

const { height } = useWindowSize()

const skeletonCount = computed(() => {
  const itemHeight = props.viewMode === 'Card' ? 200 : 120
  return Math.ceil(height.value / itemHeight) + 2
})
</script>

<template>
  <TopicCardSkeleton>
    <div class="forum-topic-item my-1 w-full rounded-xl px-4 py-2">
      <div class="topic-content">
        <!-- 头部用户信息和时间 -->
        <div class="flex justify-between break-words font-size-5">
          <div class="flex items-center gap-2">
            <Skeleton class="h-6 w-6 rounded-full" />
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-4 w-16" />
          </div>
          <Skeleton class="h-8 w-8" />
        </div>

        <!-- 主题内容 -->
        <div class="mt-2">
          <Skeleton class="mb-2 h-4 w-20" />
          <Skeleton class="h-16 w-full" />
        </div>

        <!-- 标签 -->
        <div class="mt-2 flex gap-2">
          <Skeleton class="h-6 w-20 rounded-full" />
          <Skeleton class="h-6 w-20 rounded-full" />
        </div>

        <!-- 底部操作栏 -->
        <div class="mt-4 flex justify-between">
          <Skeleton class="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  </TopicCardSkeleton>

  <TopicCompactViewSkeleton>
    <div class="forum-topic-item my-1 w-full rounded-xl px-4 py-2">
      <div class="topic-content">
        <!-- 头部用户信息和时间 -->
        <div class="flex justify-between break-words font-size-5">
          <div class="flex flex-wrap items-center gap-[0.25rem]">
            <div class="flex items-center gap-1.5">
              <Skeleton class="h-6 w-6 rounded-full" />
              <div class="flex flex-col">
                <Skeleton class="h-4 w-16" />
              </div>
            </div>
            <Skeleton class="h-4 w-20" />
          </div>
          <Skeleton class="h-8 w-8" />
        </div>

        <!-- 主题内容和图片 -->
        <div class="w-full flex items-center justify-between">
          <div class="w-full overflow-hidden">
            <Skeleton class="h-6 w-85%" />
            <Skeleton class="mt-2 h-5 w-70%" />
          </div>
          <div class="relative ml-2 mt-2 h-75px min-w-100px border rounded-sm">
            <Skeleton class="h-full w-full" />
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="mr-2 mt-2 w-full flex items-center justify-between">
          <Skeleton class="h-8 w-24 rounded-full" />
          <Skeleton class="h-4 w-16" />
        </div>
      </div>
    </div>
  </TopicCompactViewSkeleton>

  <TransitionGroup
    tag="div"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <template v-if="viewMode === 'Card'">
      <div v-for="i in skeletonCount" :key="`card-${i}`">
        <UseTopicCardSkeleton />
        <div class="vp-divider" />
      </div>
    </template>
    <template v-else>
      <div v-for="i in skeletonCount" :key="`compact-${i}`">
        <UseTopicCompactViewSkeleton />
        <div class="vp-divider" />
      </div>
    </template>
  </TransitionGroup>
</template>
