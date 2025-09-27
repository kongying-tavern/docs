<script setup lang="ts">
import type { BlogPost } from '~/utils/createBlogLoader'
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import Time from '@/components/ui/Time/Time.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { data as allPosts } from '~/_data/posts.data'
import { useMarkdownRenderer } from '~/composables/useMarkdownRenderer'

const { message } = useLocalized()
const { lang } = useData()
const { renderMarkdownPreview } = useMarkdownRenderer()

const posts = computed(() => {
  const currentLang = lang.value || 'zh'
  const baseLang = currentLang.split('-')[0]
  const result = allPosts.filter((post: BlogPost) => post.lang === baseLang)

  if (result.length === 0)
    return allPosts
  return result
})
</script>

<template>
  <div class="divide-y">
    <ul class="c-[var(--vp-c-text-1)]">
      <li
        v-for="post in posts"
        :key="post.url"
        class="border-b border-b-[var(--vp-c-divider)] py-12"
      >
        <article
          class="xl:grid xl:grid-cols-4 xl:items-baseline space-y-2 xl:space-y-0"
        >
          <Time
            class="list-none text-base c-[var(--vp-c-text-3)] leading-6 font-[var(--vp-font-family-subtitle)]"
            :datetime="post.date"
            :locale="lang"
            date-style="medium"
          />

          <div class="xl:col-span-3 space-y-5">
            <div class="space-y-6">
              <h2 class="text-2xl font-bold leading-8 tracking-tight">
                <a
                  class="c-[var(--vp-c-text-1)] hover:underline"
                  :href="post.url"
                >
                  {{ post.title }}
                </a>
              </h2>
              <div
                v-if="post.excerpt"
                class="line-clamp-3 max-w-none c-[var(--vp-c-text-2)] leading-relaxed prose"
                v-html="renderMarkdownPreview(post.excerpt)"
              />
            </div>
            <div class="text-base font-medium leading-6">
              <VPLink class="vp-link" :href="post.url">
                {{ message.forum.readMore }} →
              </VPLink>
            </div>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>
