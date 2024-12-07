<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { VPLink } from 'vitepress/theme'
import { computed } from 'vue'

const { theme, page, frontmatter } = useData()

const editLink =
  'https://github.com/kongying-tavern/docs/edit/main/src/:path'.replace(
    /:path/g,
    page.value.filePath,
  )

const isOpen = computed(
  () =>
    frontmatter.value.docAside !== false &&
    frontmatter.value.aside === true &&
    frontmatter.value.outline !== false,
)
</script>

<template>
  <div
    v-if="isOpen"
    class="!mt-5 pt-5 hidden lg:block space-y-6 border-color-[var(--vp-c-divider)] border-t-solid border"
  >
    <div class="space-y-3">
      <div
        class="lg:space-y-1.5 space-y-3 text-color-[var(--vp-c-text-2)] transition-10"
      >
        <VPLink
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200 text-sm/5 underline-offset-4 hover:underline [&:not(:first-child)]:pt-1 after:absolute after:right-0"
          href="https://github.com/kongying-tavern/docs/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="flex-shrink-0 i-lucide:star w-4 h-4"></span>
          <span class="font-medium relative text-sm/6">
            {{ theme.asideLinks.starOnGitHub }}
          </span>
        </VPLink>
        <VPLink
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200 text-sm/5 underline-offset-4 hover:underline [&:not(:first-child)]:pt-1 after:absolute after:right-0"
          :href="editLink"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="edit-link-icon vpi-square-pen w-4 h-4"></span>
          <span class="font-medium relative">
            {{ theme.asideLinks.editLink }}
          </span>
        </VPLink>
        <VPLink
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200 text-sm/5 underline-offset-4 hover:underline [&:not(:first-child)]:pt-1 after:absolute after:right-0"
          :href="withBase('_translations')"
          rel="noopener noreferrer"
          target="_self"
        >
          <span class="flex-shrink-0 vpi-languages option-icon w-4 h-4"></span>
          <span class="font-medium relative">
            {{ theme.asideLinks.translateThisPage }}
          </span>
        </VPLink>
      </div>
    </div>
  </div>
</template>
