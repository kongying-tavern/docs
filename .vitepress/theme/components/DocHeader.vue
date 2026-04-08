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
    class="slide-enter docs-header pb-6 border-b border-b-color-[var(--vp-c-divider)] border-b-solid relative"
  >
    <DocsBreadCrumb
      class="text-sm/6 text-primary font-semibold mb-3 flex gap-1.5 items-center"
    />
    <div class="flex flex-col gap-6 items-start lg:flex-row">
      <div class="flex-1">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        >
          <h1
            class="text-3xl text-gray-900 tracking-tight font-bold sm:text-4xl dark:text-white"
          >
            {{ title }}
          </h1>
        </div>
        <p
          v-if="frontmatter.description"
          class="text-lg text-gray-500 mt-4 dark:text-gray-400"
          v-html="frontmatter.description"
        />
      </div>
    </div>
  </div>
</template>
