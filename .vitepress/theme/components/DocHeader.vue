<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

import DocsBreadCrumb from './DocsBreadCrumb.vue'

const { frontmatter, page } = useData()

const title = computed(
  () =>
    frontmatter.value.title
    || page.value.title
    || page.value.relativePath.replace('.md', ''),
)
</script>

<template>
  <div
    v-if="frontmatter.docHeader !== false && frontmatter.layout === 'doc'"
    class="slide-enter docs-header relative border-b border-b-color-[var(--vp-c-divider)] border-b-solid pb-6"
  >
    <DocsBreadCrumb
      class="mb-3 flex items-center gap-1.5 text-sm/6 text-primary font-semibold"
    />
    <div class="flex flex-col items-start gap-6 lg:flex-row">
      <div class="flex-1">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        >
          <h1
            class="text-3xl text-gray-900 font-bold tracking-tight sm:text-4xl dark:text-white"
          >
            {{ title }}
          </h1>
        </div>
        <p
          v-if="frontmatter.description"
          class="mt-4 text-lg text-gray-500 dark:text-gray-400"
          v-html="frontmatter.description"
        />
      </div>
    </div>
  </div>
</template>
