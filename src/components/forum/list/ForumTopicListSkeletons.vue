<script lang="ts" setup>
import { createReusableTemplate, useWindowSize } from '@vueuse/core'
import { computed } from 'vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useForumViewMode } from '~/composables/useForumViewMode'

const [TopicCardSkeleton, UseTopicCardSkeleton] = createReusableTemplate()
const [TopicCompactViewSkeleton, UseTopicCompactViewSkeleton] = createReusableTemplate()

const { height } = useWindowSize()
const { isCardMode } = useForumViewMode()

const skeletonCount = computed(() => {
  const itemHeight = isCardMode.value ? 280 : 160
  return Math.ceil(height.value / itemHeight) + 2
})
</script>

<template>
  <TopicCardSkeleton>
    <div class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full">
      <div class="topic-content">
        <div class="flex gap-2 justify-between">
          <div class="flex flex-wrap gap-[0.25rem] min-w-0 items-center">
            <div class="flex gap-1.5 items-center">
              <Skeleton class="rounded-full size-6" />
              <Skeleton class="h-4 w-12" />
            </div>
            <Skeleton class="h-4 w-14" />
          </div>
          <div class="flex shrink-0 gap-2 items-center">
            <Skeleton class="h-4 w-12" />
            <Skeleton class="rounded-md h-5 w-9" />
          </div>
        </div>

        <div class="mt-1">
          <div class="mt-2 space-y-1.5">
            <Skeleton class="h-6 w-1/2" />
            <Skeleton class="h-6 w-1/4" />
          </div>

          <div class="mt-2 flex gap-1 items-center">
            <Skeleton class="size-3 !rounded-none" />
            <Skeleton class="h-4 w-10" />
          </div>

          <div class="mt-1 pr-4 space-y-2">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-[92%]" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-2/3" />
          </div>
        </div>
      </div>

      <div class="mr-2 mt-4 flex justify-between">
        <div class="flex gap-2 items-center">
          <Skeleton class="rounded-full h-8 w-22 max-mobile:h-11 max-mobile:w-30" />
          <Skeleton class="rounded-full h-8 w-20 max-mobile:h-11 max-mobile:w-24" />
        </div>
      </div>
    </div>
  </TopicCardSkeleton>

  <TopicCompactViewSkeleton>
    <div class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full">
      <div class="topic-content">
        <div class="flex gap-2 justify-between">
          <div class="flex flex-wrap gap-[0.25rem] min-w-0 items-center">
            <div class="flex gap-1.5 items-center">
              <Skeleton class="rounded-full size-6" />
              <Skeleton class="h-4 w-12" />
            </div>
            <Skeleton class="h-4 w-14" />
          </div>
          <div class="flex shrink-0 gap-2 items-center">
            <Skeleton class="h-4 w-12" />
            <Skeleton class="rounded-md h-5 w-9" />
          </div>
        </div>

        <div class="mt-1 flex flex-nowrap w-full items-start justify-between">
          <div class="flex-1 max-w-[calc(100%-100px)] min-w-0 overflow-hidden">
            <div class="space-y-2">
              <Skeleton class="h-4 w-[92%]" />
              <Skeleton class="h-4 w-[55%]" />
            </div>
          </div>
          <div class="ml-2 mt-1 border border-[var(--vp-c-divider)] rounded-sm flex h-75px min-w-100px relative overflow-hidden">
            <Skeleton class="h-full w-full" />
          </div>
        </div>
      </div>

      <div class="mr-2 mt-2 flex w-full items-center justify-between">
        <div class="flex gap-2 items-center">
          <Skeleton class="rounded-full h-8 w-22 max-mobile:h-11 max-mobile:w-30" />
          <Skeleton class="rounded-full h-8 w-20 max-mobile:h-11 max-mobile:w-24" />
        </div>
        <div class="flex gap-1 items-center">
          <Skeleton class="size-3 !rounded-none" />
          <Skeleton class="h-4 w-10" />
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
    <template v-if="isCardMode">
      <div v-for="i in skeletonCount" :key="`card-${i}`">
        <UseTopicCardSkeleton />
        <Separator />
      </div>
    </template>
    <template v-else>
      <div v-for="i in skeletonCount" :key="`compact-${i}`">
        <UseTopicCompactViewSkeleton />
        <Separator />
      </div>
    </template>
  </TransitionGroup>
</template>
