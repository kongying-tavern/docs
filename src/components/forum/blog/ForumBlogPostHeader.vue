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

<template>
  <div class="w-full flex flex-col items-center pb-2 text-center">
    <div class="flex-1">
      <ForumDate
        class="c-[var(--vp-c-text-3)] font-[var(--vp-font-family-subtitle)]"
        :date="date"
        format="LL"
      />

      <div
        class="mt-2 max-w-800px flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <h1
          class="c-[var(--vp-c-text-1)] font-bold lh-[1.4] tracking-[2px] important:font-size-4xl"
        >
          {{ title }}
        </h1>
      </div>
    </div>

    <div class="pt-3">
      <ForumUser :user="author" />
    </div>

    <div class="my-20px h-1.5px w-148px bg-[var(--vp-c-bg-alt)]" />
  </div>
</template>
