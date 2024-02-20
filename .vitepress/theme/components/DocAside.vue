<template>
  <div
    v-if="frontmatter.docAside !== false"
    class="hidden lg:block space-y-6 !mt-6 pl-4"
  >
    <div class="space-y-3">
      <p class="text-sm/6 font-semibold flex items-center gap-1.5">
        {{ theme.asideLinks.title }}
      </p>
      <div
        class="space-y-3 lg:space-y-1.5 text-color-[var(--vp-c-text-2)] transition-10"
      >
        <a
          class="flex items-center gap-1.5 hover:color-[var(--vp-c-text-1)] transition-200"
          :href="editLink"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="vpi-square-pen edit-link-icon"></span>
          <span class="text-sm/6 font-medium relative">{{
            theme.asideLinks.editLink
          }}</span></a
        >
        <a
          class="flex items-center gap-1.5 hover:color-[var(--vp-c-text-1)] transition-200"
          href="https://github.com/kongying-tavern/docs/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="i-ph-shooting-star-duotone w-5 h-5 flex-shrink-0"></span
          ><span class="text-sm/6 font-medium relative"
            >{{ theme.asideLinks.starOnGitHub }}
          </span></a
        ><a
          class="flex items-center gap-1.5 hover:color-[var(--vp-c-text-1)] transition-200"
          :href="theme.asideLinks.contactUsLink"
          rel="noopener noreferrer"
          target="_blank"
          ><span
            class="i-ph-chat-centered-text-duotone w-5 h-5 flex-shrink-0"
          ></span
          ><span class="text-sm/6 font-medium relative">{{
            theme.asideLinks.contactUsText
          }}</span></a
        ><a
          class="flex items-center gap-1.5 hover:color-[var(--vp-c-text-1)] transition-200"
          :href="
            withBase(
              (localeIndex === 'root' ? '' : '/' + localeIndex) + '/support-us',
            )
          "
          rel="noopener noreferrer"
          target="_self"
          ><span class="i-ph-hand-heart-duotone w-5 h-5 flex-shrink-0"></span
          ><span class="text-sm/6 font-medium relative"
            >{{ theme.asideLinks.sponsor }}
          </span></a
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useData, withBase } from 'vitepress'

const { theme, page, localeIndex, frontmatter } = useData()

const editLink =
  'https://github.com/kongying-tavern/docs/edit/main/src/:path'.replace(
    /:path/g,
    page.value.filePath,
  )
</script>
