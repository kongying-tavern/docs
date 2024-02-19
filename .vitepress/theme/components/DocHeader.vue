<template>
  <div
    v-if="frontmatter.title"
    class="docs-header slide-enter relative border-b-solid border-b-color-[var(--vp-c-divider)] pb-8 mb-4"
  >
    <div
      v-if="match"
      class="mb-3 text-sm/6 font-semibold text-primary flex items-center gap-1.5"
    >
      {{ match }}
    </div>
    <div class="flex flex-col lg:flex-row items-start gap-6">
      <!---->
      <div class="flex-1">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        >
          <h1
            class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
          >
            {{ frontmatter.title }}
          </h1>
          <!---->
        </div>
        <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">
          {{ frontmatter.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'
import { ref, watchEffect } from 'vue'

const { frontmatter } = useData()

let match = ref<string | boolean>(false)

watchEffect(() => {
  if (!frontmatter.value.titleTemplate) return (match.value = false)
  const str = frontmatter.value.titleTemplate.match(/-(.*?)\|/)
  if (str && str.length >= 1) {
    match.value = str[1].trim()
  } else {
    match.value = false
  }
})
</script>
