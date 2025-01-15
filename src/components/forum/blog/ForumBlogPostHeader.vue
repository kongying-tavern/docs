<template>
  <div class="w-full pb-2 flex flex-col items-center text-center">
    <div class="flex-1">
      <ForumDate class="c-[var(--vp-c-text-3)]" :date="date" format="LL" />

      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between max-w-800px mt-2"
      >
        <h1
          class="important:font-size-4xl lh-[1.4] font-bold c-[var(--vp-c-text-1)] tracking-[2px]"
        >
          {{ title }}
        </h1>
      </div>
    </div>

    <div class="pt-3">
      <ForumUser :user="author" />
    </div>

    <div class="my-20px w-148px h-1.5px bg-[var(--vp-c-bg-alt)]"></div>
  </div>
</template>

<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import ForumDate from '../ForumDate.vue'
import ForumUser from '../ForumUser.vue'

const { title } = defineProps<{
  title: string
  date: string | number
  description?: string
  author: ForumAPI.User
}>()
</script>
