<script setup>
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="mb-4">
    <Skeleton class="h-[clamp(1rem,10vw,2rem)] w-200px" />

    <div class="mt-4 flex items-center">
      <Skeleton class="h-32px w-32px rounded-full" />
      <Skeleton class="mx-2 h-3.5 w-[60px]" />

      <span class="color-[--vp-c-text-3]">·</span>
      <Skeleton class="mx-2 h-3 w-[100px]" />
    </div>

    <div class="mt-4 space-y-4">
      <Skeleton class="h-4 w-[100%]" />
      <Skeleton class="h-4 w-[90%]" />
      <Skeleton class="h-4 w-[80%]" />
      <Skeleton class="h-4 w-[70%]" />
    </div>

    <div class="my-6 flex space-x-2">
      <Skeleton class="mr-2 h-28px w-80px rounded-full" />
      <Skeleton class="mr-2 h-28px w-80px rounded-full" />
    </div>

    <div class="mt-6 flex space-x-2">
      <Skeleton class="h-[75px] w-[75px] rounded-xl" />
      <Skeleton class="h-[75px] w-[75px] rounded-xl" />
    </div>
  </div>
</template>
