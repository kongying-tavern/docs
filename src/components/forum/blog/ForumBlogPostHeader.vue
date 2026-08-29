<script setup lang="ts">
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'
import Avatar from '@/components/ui/Avatar.vue'
import Time from '@/components/ui/Time/Time.vue'
import { parseAuthors } from '~/utils/frontmatter'

const { frontmatter, lang, page } = useData()
const authors = parseAuthors(frontmatter.value)
</script>

<template>
  <div class="slide-enter mb-12 pb-2 text-center text-left flex flex-col w-full items-center">
    <!-- 面包屑 -->
    <nav class="text-sm c-[var(--vp-c-text-2)] flex gap-2 items-center">
      <VPLink class="hover:underline" href="../../">
        首页
      </VPLink>
      <span class="c-[var(--vp-c-text-3)]">/</span>
      <VPLink class="hover:underline" href="../">
        团队博客
      </VPLink>
    </nav>

    <h1
      class="font-size-[clamp(28px,4vw,42px)] c-[var(--vp-c-text-1)] lh-[1.2] tracking-[2px] font-bold mt-4"
    >
      {{ frontmatter?.title || 'Untitled' }}
    </h1>

    <!-- meta -->
    <div class="text-sm mt-5 flex gap-3 items-center">
      <template v-if="authors.length === 1">
        <VPLink
          class="c-[var(--vp-c-text-2)] flex gap-1.5 items-center hover:underline"
          :href="`https://gitee.com/${authors[0].login}`"
        >
          <Avatar
            size="xs"
            class="ring-2 ring-[var(--vp-c-bg)]"
            :src="authors[0].avatar || undefined"
            :alt="authors[0].username"
          />
          <span class="leading-none flex h-6 items-center">{{ authors[0].username }}</span>
        </VPLink>
      </template>
      <div
        v-else-if="authors.length"
        class="flex h-6 items-center -space-x-2"
      >
        <VPLink
          v-for="author in authors"
          :key="author.id"
          class="flex"
          :href="`https://gitee.com/${author.login}`"
        >
          <Avatar
            size="xs"
            class="ring-2 ring-[var(--vp-c-bg)]"
            :src="author.avatar || undefined"
            :alt="author.username"
          />
        </VPLink>
      </div>
      <span
        v-if="authors.length && (page.lastUpdated || frontmatter?.createAt)"
        class="c-[var(--vp-c-text-3)]"
      >
        ·
      </span>
      <span
        v-if="page.lastUpdated || frontmatter?.createAt"
        class="flex h-6 items-center"
      >
        <Time
          class="text-sm c-[var(--vp-c-text-2)] leading-none font-[var(--vp-font-family-subtitle)]"
          :datetime="page?.lastUpdated || frontmatter?.createAt"
          :locale="lang"
          date-style="medium"
        />
      </span>
    </div>

    <!-- 分隔线 -->
    <div class="mx-auto my-8 bg-[var(--vp-c-border)] h-1.5px w-24" />

    <!-- 封面 -->
    <img
      v-if="frontmatter.cover"
      class="post-cover rounded-xl aspect-[1200/630] object-cover"
      :src="frontmatter.cover"
      :alt="frontmatter?.title || 'cover'"
      width="1200"
      height="630"
      loading="eager"
      decoding="async"
    >
  </div>
</template>

<style scoped>
/* 封面比正文容器更宽：两侧对称溢出并保持居中 */
.post-cover {
  width: min(820px, 82vw);
  max-width: min(820px, 82vw);
  flex-shrink: 0;
  align-self: center;
}
</style>
