<script lang="ts" setup>
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="w-full">
    <div class="rounded-lg w-full">
      <div class="mx-auto w-full">
        <div class="p-4 rounded-lg w-full sm:p-6">
          <div class="flex flex-col gap-4 items-start sm:flex-row sm:gap-6">
            <!-- 头像骨架 -->
            <div class="flex w-full items-start justify-between sm:w-auto">
              <div class="relative">
                <Skeleton class="rounded-full h-20 w-20 sm:h-24 sm:w-24" />
              </div>
              <div class="flex gap-2 sm:hidden">
                <Skeleton class="rounded-full h-9 w-20" />
                <Skeleton class="rounded-full h-9 w-20" />
              </div>
            </div>

            <!-- 用户信息骨架 -->
            <div class="flex-1 w-full">
              <div class="flex gap-2 items-center">
                <Skeleton class="h-7 w-32 sm:h-8" />
                <Skeleton class="rounded-full h-5 w-16" />
              </div>

              <Skeleton class="mt-1.5 h-5 max-w-md w-full sm:mt-2" />

              <!-- 统计信息骨架 -->
              <div class="mt-3 flex flex-wrap gap-4 sm:mt-4 sm:gap-6">
                <Skeleton class="h-5 w-20" />
                <Skeleton class="h-5 w-32" />
              </div>
            </div>

            <!-- PC端操作按钮骨架 -->
            <div class="gap-2 hidden sm:flex">
              <Skeleton class="rounded-full h-9 w-9" />
              <Skeleton class="rounded-full h-9 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 菜单骨架 -->
    <div class="border-b w-full relative">
      <div class="mx-auto">
        <div class="flex gap-3 h-12 items-center relative">
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-6 w-24" />
        </div>
      </div>
    </div>
  </div>
</template>
