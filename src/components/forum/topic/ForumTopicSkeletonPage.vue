<template>
  <div class="mb-4">
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
</template>

<script setup>
import { Skeleton } from '@/components/ui/skeleton'
</script>
