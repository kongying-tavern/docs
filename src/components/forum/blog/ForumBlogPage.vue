<script setup lang="ts">
import type { BlogPost } from '~/utils/createBlogLoader'
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import Time from '@/components/ui/time/Time.vue'
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

function buildPostLink(url: string) {
  return `./posts/${url.slice(url.lastIndexOf('/') + 1)}`
}
</script>

<template>
  <div class="divide-y">
    <ul class="c-[var(--vp-c-text-1)]">
      <li
        v-for="post in posts"
        :key="post.url"
        class="py-12 border-b border-b-[var(--vp-c-divider)]"
      >
        <article
          class="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0"
        >
          <Time
            class="text-base c-[var(--vp-c-text-3)] leading-6 font-[var(--vp-font-family-subtitle)] list-none"
            :datetime="post.date"
            :locale="lang"
            date-style="medium"
          />

          <div class="space-y-5 xl:col-span-3">
            <div class="space-y-6">
              <h2 class="text-2xl leading-8 tracking-tight font-bold">
                <a
                  class="c-[var(--vp-c-text-1)] hover:underline"
                  :href="buildPostLink(post.url)"
                >
                  {{ post.title }}
                </a>
              </h2>
              <div
                v-if="post.excerpt"
                class="prose c-[var(--vp-c-text-2)] leading-relaxed max-w-none line-clamp-3"
                v-html="renderMarkdownPreview(post.excerpt)"
              />
            </div>
            <div class="text-base leading-6 font-medium">
              <VPLink class="vp-link" :href="buildPostLink(post.url)">
                {{ message.forum.readMore }} →
              </VPLink>
            </div>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>
