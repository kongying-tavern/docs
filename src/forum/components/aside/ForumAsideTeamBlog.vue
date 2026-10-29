<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLangPath } from '@/utils'
import { data as allBlogPosts } from '~/_data/forumBlogPosts.data'
import { DEFAULT_LOCALE } from '~/constants/site'
import ForumTime from '../ui/ForumTime.vue'

const { lang, localeIndex, theme } = useData()
const { t } = useI18n({ useScope: 'global' })

// 站点默认语言挂在根路径下，博客路由需按当前 locale 前缀拼；base 交给 VPLink 处理
const blogHref = computed(() => `${getLangPath(localeIndex.value)}blog`)

const teamBlogItems = computed(() => {
  const currentLang = (lang.value || DEFAULT_LOCALE).split('-')[0]

  return Object.entries(theme.value.forum.aside.teamBlog.items as Record<string, { link: string }>).map(([key, item]) => {
    const slug = item.link.split('/').filter(Boolean).at(-1)
    const post = allBlogPosts.find((candidate: { lang: string, url: string }) =>
      candidate.lang === currentLang && candidate.url.endsWith(`/posts/${slug}`),
    )

    return {
      ...item,
      text: t(`forum.aside.teamBlog.items.${key}`),
      authors: post?.authors.map((author: { username: string, login: string }) => author.username || author.login).join('、') ?? '',
      updatedAt: post?.gitInfo?.lastModified.date ?? post?.date,
    }
  })
})
</script>

<template>
  <div>
    <div class="lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider flex h-14 justify-between">
      <p class="color-[var(--vp-c-text-1)]">
        {{ t('forum.aside.teamBlog.text') }}
      </p>
      <VPLink class="forum-aside-all-link" :href="blogHref">
        {{ t('ui.button.all') }}
      </VPLink>
    </div>

    <VPLink
      v-for="post in teamBlogItems"
      :key="post.link"
      :href="post.link"
      class="forum-aside-list-item forum-aside-blog-item font-[var(--vp-font-family-subtitle)]"
    >
      <span
        data-forum-shared-blog="title"
        class="forum-aside-blog-title"
      >
        {{ post.text }}
      </span>
      <span v-if="post.authors && post.updatedAt" class="forum-aside-blog-meta">
        <span>{{ post.authors }}</span>
        <span aria-hidden="true">·</span>
        <ForumTime :date="post.updatedAt" :toggleable="false" />
      </span>
    </VPLink>
  </div>
</template>

<style scoped>
.forum-aside-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  padding: 6px 8px;
}

.forum-aside-list-item:hover .forum-aside-blog-title {
  color: var(--vp-c-brand-1);
}

.forum-aside-all-link {
  color: var(--vp-c-text-3);
  @apply text-ui-12;
  line-height: inherit;
}

.forum-aside-all-link:hover {
  color: var(--vp-c-text-2);
}

.forum-aside-blog-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--vp-c-text-1);
  @apply text-ui-14;
  font-weight: 500;
  @apply leading-ui-21;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.forum-aside-blog-item {
  align-items: flex-start;
  flex-direction: column;
  gap: 3px;
  padding-block: 7px;
}

.forum-aside-blog-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-3);
  @apply text-ui-12;
  @apply leading-ui-18;
}

.forum-aside-blog-meta > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
