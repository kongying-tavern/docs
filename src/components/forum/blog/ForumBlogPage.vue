<script setup lang="ts">
import Time from '@/components/ui/Time/Time.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import posts from '~/_data/posts.json'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { extractPlainText } from '../utils'

const localeLabelGetter = getForumLocaleLabelGetter()

const { message } = useLocalized()
const { lang } = useData()

const filteredPosts = computed(() =>
  posts.filter(
    post =>
      post.tags
      // eslint-disable-next-line unicorn/prefer-includes
      && post.tags.some(
        label =>
          label
          === localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
      ),
  ),
)
</script>

<template>
  <div class="divide-y">
    <ul class="c-[var(--vp-c-text-1)]">
      <li
        v-for="{ title, createdAt, contentRaw, id, path } of filteredPosts"
        :key="id"
        class="border-b border-b-[var(--vp-c-divider)] py-12"
      >
        <article
          class="xl:grid xl:grid-cols-4 xl:items-baseline space-y-2 xl:space-y-0"
        >
          <Time class="list-none text-base c-[var(--vp-c-text-3)] leading-6 font-[var(--vp-font-family-subtitle)]" :datetime="createdAt" :locale="lang" date-style="medium" />

          <div class="xl:col-span-3 space-y-5">
            <div class="space-y-6">
              <h2 class="text-2xl font-bold leading-8 tracking-tight">
                <a
                  class="c-[var(--vp-c-text-1)] hover:underline"
                  :href="`./${path}`"
                >
                  {{ title }}
                </a>
              </h2>
              <div
                v-if="contentRaw"
                class="line-clamp-5 max-w-none whitespace-pre-wrap c-[var(--vp-c-text-2)] prose"
                v-html="extractPlainText(contentRaw)"
              />
            </div>
            <div class="text-base font-medium leading-6">
              <VPLink class="vp-link" :href="`./${path}`">
                {{ message.forum.readMore }} →
              </VPLink>
            </div>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>
