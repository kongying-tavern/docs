<script setup lang="ts">
import { computed } from 'vue'
import posts from '~/_data/posts.json'
import { useLocalized } from '@/hooks/useLocalized'
import ForumDate from '../ForumDate.vue'
import { VPLink } from 'vitepress/theme'
import { extractPlainText } from '../utils'
import { getForumLocaleLabelGetter } from '~/composables/getForumLocaleGetter'
import { useData } from 'vitepress'

const localeLabelGetter = getForumLocaleLabelGetter()

const { message } = useLocalized()
const { lang } = useData()

const filteredPosts = computed(() =>
  posts.filter(
    (post) =>
      post.tags &&
      post.tags.some(
        (label) =>
          label ===
          localeLabelGetter.getLabel(lang.value.substring(0, 2).toUpperCase()),
      ),
  ),
)
</script>

<template>
  <div class="divide-y">
    <ul class="c-[var(--vp-c-text-1)]">
      <li
        class="py-12 border-b border-b-[var(--vp-c-divider)]"
        v-for="{ title, createdAt, contentRaw, id } of filteredPosts"
      >
        <article
          class="space-y-2 xl:grid xl:grid-cols-4 xl:space-y-0 xl:items-baseline"
        >
          <ForumDate
            class="list-none c-[var(--vp-c-text-3)] text-base leading-6"
            :date="createdAt"
            format="LL"
          />

          <div class="space-y-5 xl:col-span-3">
            <div class="space-y-6">
              <h2 class="text-2xl leading-8 font-bold tracking-tight">
                <a
                  class="c-[var(--vp-c-text-1)] hover:underline"
                  :href="'./' + id"
                >
                  {{ title }}
                </a>
              </h2>
              <div
                v-if="contentRaw"
                class="prose max-w-none c-[var(--vp-c-text-2)] whitespace-pre-wrap line-clamp-5"
                v-html="extractPlainText(contentRaw)"
              ></div>
            </div>
            <div class="text-base leading-6 font-medium">
              <VPLink class="vp-link" :href="'./' + id">
                {{ message.forum.readMore }} →
              </VPLink>
            </div>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>
