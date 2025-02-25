<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'

const { theme, page, frontmatter } = useData()

const editLink
  = 'https://github.com/kongying-tavern/docs/edit/main/src/:path'.replace(
    /:path/g,
    page.value.filePath,
  )

const isOpen = computed(
  () =>
    frontmatter.value.docAside !== false
    && frontmatter.value.aside === true
    && frontmatter.value.outline !== false,
)
</script>

<template>
  <div
    v-if="isOpen"
    class="hidden border-color-[var(--vp-c-divider)] border-none pt-5 font-[var(--vp-font-family-subtitle)] !mt-5 lg:block space-y-6"
  >
    <div class="space-y-3">
      <div
        class="text-color-[var(--vp-c-text-2)] transition-10 space-y-3 lg:space-y-1.5"
      >
        <VPLink
          class="flex items-center gap-1.5 text-sm/5 underline-offset-4 transition-200 after:absolute after:right-0 [&:not(:first-child)]:pt-1 hover:color-[var(--vp-c-text-1)] hover:underline"
          href="https://github.com/kongying-tavern/docs/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="i-lucide:star h-4 w-4 flex-shrink-0" />
          <span class="relative text-sm/6 font-medium">
            {{ theme.asideLinks.starOnGitHub }}
          </span>
        </VPLink>
        <VPLink
          class="flex items-center gap-1.5 text-sm/5 underline-offset-4 transition-200 after:absolute after:right-0 [&:not(:first-child)]:pt-1 hover:color-[var(--vp-c-text-1)] hover:underline"
          :href="editLink"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="edit-link-icon vpi-square-pen h-4 w-4" />
          <span class="relative font-medium">
            {{ theme.asideLinks.editLink }}
          </span>
        </VPLink>
        <VPLink
          class="flex items-center gap-1.5 text-sm/5 underline-offset-4 transition-200 after:absolute after:right-0 [&:not(:first-child)]:pt-1 hover:color-[var(--vp-c-text-1)] hover:underline"
          :href="withBase('_translations')"
          rel="noopener noreferrer"
          target="_self"
        >
          <span class="vpi-languages option-icon h-4 w-4 flex-shrink-0" />
          <span class="relative font-medium">
            {{ theme.asideLinks.translateThisPage }}
          </span>
        </VPLink>
      </div>
    </div>
  </div>
</template>
