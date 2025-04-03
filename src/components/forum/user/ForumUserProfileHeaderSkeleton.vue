<script lang="ts" setup>
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="w-full">
    <div class="w-full rounded-lg">
      <div class="mx-auto w-full">
        <div class="w-full rounded-lg p-4 sm:p-6">
          <div class="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
            <!-- 头像骨架 -->
            <div class="w-full flex items-start justify-between sm:w-auto">
              <div class="relative">
                <Skeleton class="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
              </div>
              <div class="flex gap-2 sm:hidden">
                <Skeleton class="h-9 w-20 rounded-full" />
                <Skeleton class="h-9 w-20 rounded-full" />
              </div>
            </div>

            <!-- 用户信息骨架 -->
            <div class="w-full flex-1">
              <div class="flex items-center gap-2">
                <Skeleton class="h-7 w-32 sm:h-8" />
                <Skeleton class="h-5 w-16 rounded-full" />
              </div>

              <Skeleton class="mt-1.5 h-5 max-w-md w-full sm:mt-2" />

              <!-- 统计信息骨架 -->
              <div class="mt-3 flex flex-wrap gap-4 sm:mt-4 sm:gap-6">
                <Skeleton class="h-5 w-20" />
                <Skeleton class="h-5 w-32" />
              </div>
            </div>

            <!-- PC端操作按钮骨架 -->
            <div class="hidden gap-2 sm:flex">
              <Skeleton class="h-9 w-9 rounded-full" />
              <Skeleton class="h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 菜单骨架 -->
    <div class="relative w-full border-b">
      <div class="mx-auto">
        <div class="relative h-12 flex items-center gap-3">
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-6 w-24" />
        </div>
      </div>
    </div>
  </div>
</template>
