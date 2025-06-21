<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import Time from '@/components/ui/Time/Time.vue'
import User from '@/components/ui/User.vue'
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'

const { title } = defineProps<{
  title: string
  date: string | number
  description?: string
  author: ForumAPI.User
}>()

const { lang } = useData()
</script>

<template>
  <div class="slide-enter w-full flex flex-col pb-2 text-left">
    <VPLink class="mb-4 w-fit flex items-center gap-2 px-0 c-[var(--vp-c-text-3)]" href="./">
      <span class="i-lucide-arrow-left icon-btn" />
      返回博客
    </VPLink>

    <div class="flex-1">
      <Time
        class="c-[var(--vp-c-text-2)] font-[var(--vp-font-family-subtitle)]"
        :datetime="date"
        :locale="lang"
        date-style="medium"
      />

      <div
        class="mb-48px mt-24px max-w-800px flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <h1
          class="font-size-[clamp(28px,4vw,42px)] c-[var(--vp-c-text-1)] font-bold lh-[1.2] tracking-[2px]"
        >
          {{ title }}
        </h1>
      </div>
    </div>

    <template v-if="author">
      <p class="subtitle font-size-3.5 c-[--vp-c-text-2] line-height-snug">
        Posted by
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-6">
        <div class="group/user relative flex items-center gap-2">
          <User size="sm" :avatar="{ src: author.avatar, alt: author.username }" :description="author.login" :name="author.username" />
        </div>
      </div>
    </template>
    <div class="my-20px h-1px w-full bg-[var(--vp-c-bg-alt)]" />
  </div>
</template>
