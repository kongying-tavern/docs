<script setup lang="ts">
import { useData, withBase } from 'vitepress'

const { theme, page, localeIndex, frontmatter } = useData()

const editLink =
  'https://github.com/kongying-tavern/docs/edit/main/src/:path'.replace(
    /:path/g,
    page.value.filePath,
  )
</script>

<template>
  <div
    v-if="frontmatter.docAside !== false"
    class="!mt-6 hidden lg:block pl-4 space-y-6"
  >
    <div class="space-y-3">
      <p class="flex font-semibold gap-1.5 items-center text-sm/6">
        {{ theme.asideLinks.title }}
      </p>
      <div
        class="lg:space-y-1.5 space-y-3 text-color-[var(--vp-c-text-2)] transition-10"
      >
        <a
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200"
          :href="editLink"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="edit-link-icon vpi-square-pen"></span>
          <span class="font-medium relative text-sm/6">{{
            theme.asideLinks.editLink
          }}</span></a
        >
        <a
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200"
          href="https://github.com/kongying-tavern/docs/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span class="flex-shrink-0 h-5 i-ph-shooting-star-duotone w-5"></span
          ><span class="font-medium relative text-sm/6"
            >{{ theme.asideLinks.starOnGitHub }}
          </span></a
        ><a
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200"
          :href="theme.asideLinks.contactUsLink"
          rel="noopener noreferrer"
          target="_blank"
          ><span
            class="flex-shrink-0 h-5 i-ph-chat-centered-text-duotone w-5"
          ></span
          ><span class="font-medium relative text-sm/6">{{
            theme.asideLinks.contactUsText
          }}</span></a
        ><a
          class="flex gap-1.5 hover:color-[var(--vp-c-text-1)] items-center transition-200"
          :href="
            withBase(
              `${localeIndex === 'root' ? '' : `/${localeIndex}`}/support-us`,
            )
          "
          rel="noopener noreferrer"
          target="_self"
          ><span class="flex-shrink-0 h-5 i-ph-hand-heart-duotone w-5"></span
          ><span class="font-medium relative text-sm/6"
            >{{ theme.asideLinks.sponsor }}
          </span></a
        >
      </div>
    </div>
  </div>
</template>
