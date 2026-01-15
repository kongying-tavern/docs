<script setup lang="ts">
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'
import Time from '@/components/ui/time/Time.vue'
import User from '@/components/ui/User.vue'
import { fallbackUser } from '~/constants/forum'
import { parseAuthors } from '~/utils/frontmatter'

const { frontmatter, lang, page } = useData()
const authors = parseAuthors(frontmatter.value)
</script>

<template>
  <div class="slide-enter pb-2 text-left flex flex-col w-full">
    <VPLink class="c-[var(--vp-c-text-3)] mb-4 px-0 flex gap-2 w-fit items-center" href="../" :no-icon="true">
      <span class="i-lucide-arrow-left icon-btn" />
      返回博客
    </VPLink>
    <div class="flex-1">
      <Time
        v-if="page.lastUpdated || frontmatter?.createAt"
        class="c-[var(--vp-c-text-2)] font-[var(--vp-font-family-subtitle)]"
        :datetime="page?.lastUpdated || frontmatter?.createAt"
        :locale="lang"
        date-style="medium"
      />

      <div
        class="mb-48px mt-24px flex flex-col max-w-800px lg:flex-row lg:items-center lg:justify-between"
      >
        <h1
          class="font-size-[clamp(28px,4vw,42px)] c-[var(--vp-c-text-1)] lh-[1.2] tracking-[2px] font-bold"
        >
          {{ frontmatter?.title || 'Untitled' }}
        </h1>
      </div>
    </div>
    <template v-if="authors || frontmatter.author">
      <p class="subtitle font-size-3.5 c-[--vp-c-text-2] line-height-snug">
        Posted by {{ authors ? '' : frontmatter?.author }}
      </p>

      <div v-if="authors" class="mt-3 flex flex-wrap gap-6 items-center">
        <div v-for="author in authors" :key="author.id" class="group/user flex gap-2 items-center relative">
          <VPLink :href="`https://gitee.com/${author.login}`">
            <User
              size="sm"
              :avatar="{ src: author.avatar || fallbackUser.avatar, alt: author.username }"
              :description="author.login"
              :name="author.username"
            />
          </VPLink>
        </div>
      </div>
    </template>
    <div class="my-20px bg-[var(--vp-c-bg-alt)] h-1px w-full" />
  </div>
</template>
