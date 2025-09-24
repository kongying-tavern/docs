<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { computed } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'

const { height } = useWindowSize()

// 根据屏幕高度计算需要显示的骨架屏数量
const skeletonCount = computed(() => {
  const itemHeight = 240 // 博客项目大概高度
  return Math.min(Math.ceil(height.value / itemHeight) + 1, 6) // 最多6个
})
</script>

<template>
  <div class="divide-y">
    <div
      v-for="i in skeletonCount"
      :key="i"
      class="border-b border-b-[var(--vp-c-divider)] py-12"
    >
      <article class="xl:grid xl:grid-cols-4 xl:items-baseline space-y-2 xl:space-y-0">
        <!-- 时间列 -->
        <div class="flex items-center justify-between xl:block">
          <Skeleton class="h-5 w-32" />
          <div class="mt-2 flex items-center gap-2">
            <Skeleton class="h-6 w-12 rounded-full" />
          </div>
        </div>

        <!-- 内容列 -->
        <div class="xl:col-span-3 space-y-5">
          <div class="space-y-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- 标题 -->
                <Skeleton class="mb-2 h-8 w-3/4" />

                <!-- 内容预览 -->
                <div class="space-y-2">
                  <Skeleton class="h-4 w-full" />
                  <Skeleton class="h-4 w-full" />
                  <Skeleton class="h-4 w-2/3" />
                </div>
              </div>

              <!-- 管理按钮 -->
              <div class="ml-4 flex items-center gap-2">
                <Skeleton class="h-8 w-8 rounded-md" />
                <Skeleton class="h-8 w-8 rounded-md" />
              </div>
            </div>

            <!-- 阅读更多 -->
            <div class="text-base font-medium leading-6">
              <Skeleton class="h-5 w-24" />
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
