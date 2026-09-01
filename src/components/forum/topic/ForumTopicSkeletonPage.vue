<script setup>
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="mb-4">
    <div class="flex w-full items-center justify-between">
      <div class="flex flex-wrap gap-[0.25rem] min-w-0 items-center">
        <Skeleton class="mr-1 rounded-full h-9 w-36px max-sm:hidden" />
        <div class="flex gap-2 items-center">
          <Skeleton class="rounded-full size-8" />
          <Skeleton class="h-4 w-12" />
        </div>
        <Skeleton class="h-4 w-14" />
      </div>

      <div class="flex shrink-0 gap-2 items-center">
        <Skeleton class="h-4 w-12" />
        <Skeleton class="rounded-md h-5 w-9" />
      </div>
    </div>

    <Skeleton class="mt-2 h-9 w-3/5 md:h-10 md:w-2/5" />

    <div class="mt-3 flex gap-1 items-center">
      <Skeleton class="size-3 !rounded-none" />
      <Skeleton class="h-4 w-10" />
    </div>

    <div class="mt-3.5 space-y-2">
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-[92%]" />
      <Skeleton class="h-4 w-[70%]" />
    </div>

    <div class="mt-12 flex items-center justify-between">
      <div class="flex gap-1.5 items-center">
        <Skeleton class="rounded-full h-8 w-22 max-mobile:h-11 max-mobile:w-30" />
        <Skeleton class="rounded-full h-8 w-18 max-mobile:h-11 max-mobile:w-20" />
      </div>
      <Skeleton class="h-4 w-24" />
    </div>
  </div>
</template>
