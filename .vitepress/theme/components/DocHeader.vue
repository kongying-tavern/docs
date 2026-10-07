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

const showTitle = computed(() => frontmatter.value.docHeaderTitle !== false)
</script>

<template>
  <div
    v-if="frontmatter.docHeader !== false && (!frontmatter.layout || frontmatter.layout === 'doc')"
    class="docs-header pb-6 border-b border-b-color-[var(--vp-c-divider)] border-b-solid relative"
  >
    <DocsBreadCrumb
      class="text-sm/6 text-primary font-semibold mb-3 flex gap-1.5 items-center"
    />
    <!-- 页头容器本身不参与入场动画：标题块作为唯一直接子元素承接首帧，随后是面包屑与正文分级（tests/e2e/entry-animation.spec.ts） -->
    <div v-if="showTitle" class="slide-enter">
      <h1
        class="text-3xl text-gray-900 tracking-tight font-bold sm:text-4xl dark:text-white"
      >
        {{ title }}
      </h1>
      <p
        v-if="frontmatter.description"
        class="text-lg text-gray-500 mt-4 dark:text-gray-400"
        v-html="frontmatter.description"
      />
    </div>
  </div>
</template>
