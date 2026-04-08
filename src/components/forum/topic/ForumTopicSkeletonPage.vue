<script setup>
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="mb-4">
    <Skeleton class="h-[clamp(1rem,10vw,2rem)] w-200px" />

    <div class="mt-4 flex items-center">
      <Skeleton class="rounded-full h-32px w-32px" />
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
      <Skeleton class="mr-2 rounded-full h-28px w-80px" />
      <Skeleton class="mr-2 rounded-full h-28px w-80px" />
    </div>

    <div class="mt-6 flex space-x-2">
      <Skeleton class="rounded-xl h-[75px] w-[75px]" />
      <Skeleton class="rounded-xl h-[75px] w-[75px]" />
    </div>
  </div>
</template>
