<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, ref, watchEffect } from 'vue'

const { frontmatter, page } = useData()

const match = ref<boolean | string>(false)
const title = computed(
  () =>
    frontmatter.value.title ||
    page.value.title ||
    page.value.relativePath.replace('.md', ''),
)
</script>

<template>
  <div
    v-if="frontmatter.docHeader !== false && frontmatter.layout == 'doc'"
    class="border-b-color-[var(--vp-c-divider)] border-b-solid docs-header mb-4 relative slide-enter"
  >
    <div class="flex flex-col gap-6 items-start lg:flex-row">
      <!---->
      <div class="flex-1">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        >
          <h1
            class="dark:text-white font-bold sm:text-4xl text-3xl text-gray-900 tracking-tight"
          >
            {{ title }}
          </h1>
        </div>
        <p
          v-if="frontmatter.description"
          class="dark:text-gray-400 mt-4 text-gray-500 text-lg"
          v-html="frontmatter.description"
        ></p>
      </div>
    </div>
  </div>
</template>
