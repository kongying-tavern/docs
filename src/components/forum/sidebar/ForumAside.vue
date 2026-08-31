<script setup lang="ts">
import type { DataNode } from '../utils/forumUi'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { shuffle, take } from 'lodash-es'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import { flattenWithTags } from '../utils/forumUi'

const { contactUs = false, excludeTopicIds = [] } = defineProps<{
  contactUs?: boolean
  excludeTopicIds?: Array<string | number>
}>()

const { message } = useLocalized()
const { theme } = useData()
const { topicHref } = useForumRoute()

const qrcode = useQRCode(message.value.forum.aside.contactUs.qrcodeLink)

/** 团队博客 3 篇固定文章，cover/title/link 参考真实博客文章的 frontmatter 配置 */
const teamBlogPosts = [
  {
    title: '【客户端】热更新日志',
    cover: 'https://genshin.og.interknot.site/apis/v1/og?cover=3&title=%E5%9C%B0%E5%9B%BE%E5%AE%A2%E6%88%B7%E7%AB%AF/n%E7%83%AD%E6%9B%B4%E6%96%B0%E6%97%A5%E5%BF%97',
    link: '/blog/posts/hotupdatelog-client/',
  },
  {
    title: '【网页版】更新日志',
    cover: 'https://genshin.og.interknot.site/apis/v1/og?cover=3&title=网页版%0A更新日志',
    link: '/blog/posts/changelog-web/',
  },
  {
    title: '【位置追踪】更新日志',
    cover: 'https://genshin.og.interknot.site/apis/v1/og?cover=1&title=位置追踪更新日志',
    link: '/blog/posts/changelog-autotrack/',
  },
]

const sidebarItems = Object.values(theme.value.sidebar ?? {}).flat() as DataNode[]
const randomSuggest = take(shuffle(flattenWithTags(sidebarItems.filter(item => item.text))), 6)

const suggestList = computed(() => {
  return [...message.value.forum.aside.suggest.items, ...randomSuggest].sort(
    (a, b) => a.tag.localeCompare(b.tag),
  )
})

const closedTopics = useForumTopicsQuery({
  filter: 'closed',
  sort: 'updated',
  q: '',
  creator: null,
  pageSize: 50,
})
const excludedTopics = computed(() => new Set(excludeTopicIds.map(String)))
const closedSuggestions = computed(() => closedTopics.rows.value
  .filter(topic => topic.commentCount > 0 && !excludedTopics.value.has(String(topic.id)))
  .toSorted((a, b) => b.commentCount - a.commentCount || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  .slice(0, 5))
</script>

<template>
  <div
    class="aside-content px-4 pb-4 rounded-lg bg-[--vp-c-bg-soft] flex flex-col min-h-[calc(100vh-(var(--vp-nav-height)+var(--vp-layout-top-height,0px)+32px))]"
  >
    <div v-if="contactUs" class="selected-articles mb-4">
      <p
        class="color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)] mb-6 vp-border-divider h-14"
      >
        {{ message.forum.aside.contactUs.title }}
      </p>
      <div
        class="mb-2 p-1 border border-color-[var(--vp-c-gutter)] rounded-md border-solid flex justify-between"
      >
        <img class="mr-2 h-23 w-23" :src="qrcode" alt="QR Code">
        <p
          class="font-size-3.5 color-[--vp-c-text-1] mt-2.75 pr-2.5 text-center h-[fit-content] break-all text-ellipsis overflow-hidden"
        >
          {{ message.forum.aside.contactUs.desc }}
        </p>
      </div>
    </div>
    <div>
      <div
        class="lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider flex h-14 justify-between"
      >
        <p class="color-[var(--vp-c-text-1)]">
          {{ message.forum.aside.teamBlog.text }}
        </p>
        <VPLink class="font-size-14px vp-link" href="../blog">
          {{ message.ui.button.all }}
        </VPLink>
      </div>

      <VPLink
        v-for="post in teamBlogPosts"
        :key="post.link"
        :href="withBase(post.link)"
        class="forum-aside-list-item font-[var(--vp-font-family-subtitle)]"
      >
        <img
          class="rounded shrink-0 h-13 w-23 object-cover"
          :src="post.cover || withBase('/imgs/common/selectArtilcs.png')"
          :alt="post.title"
        >
        <span
          class="forum-aside-blog-title font-size-3.5 color-[--vp-c-text-2] lh-6 min-w-0 overflow-hidden line-clamp-2"
        >
          {{ post.title }}
        </span>
      </VPLink>
    </div>
    <div class="selected-articles mb-4">
      <p
        class="color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14"
      >
        {{ message.forum.aside.suggest.text }}
      </p>
      <VPLink
        v-for="item in suggestList"
        :key="`${item.tag}-${item.link}`"
        :href="item.link"
        class="forum-aside-list-item forum-aside-document-item"
      >
        <span
          v-if="item.tag"
          class="font-size-3.5 color-[--vp-c-text-3] line-height-[24px] mr-3 break-keep"
        >
          [{{ item.tag?.replace(/【|】|\[|\]/g, ' ').trim() }}]
        </span>
        <span
          class="font-size-3.5 color-[--vp-c-text-2] lh-6 min-w-0 overflow-hidden line-clamp-2"
        >
          {{ item.text?.replace(/【|】|\[|\]/g, ' ').trim() }}
        </span>
      </VPLink>
    </div>
    <div class="selected-articles mb-4">
      <p
        class="color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14"
      >
        {{ message.forum.aside.recentTopics.text }}
      </p>
      <div v-if="closedTopics.isLoading.value" class="space-y-3" aria-hidden="true">
        <div v-for="index in 3" :key="index" class="rounded bg-[var(--vp-c-default-soft)] h-8" />
      </div>
      <p
        v-else-if="closedSuggestions.length === 0"
        class="text-sm color-[var(--vp-c-text-3)]"
      >
        {{ message.forum.aside.recentTopics.empty }}
      </p>
      <template v-else>
        <VPLink
          v-for="topic in closedSuggestions"
          :key="topic.id"
          :href="topicHref(String(topic.id), null)"
          class="forum-aside-list-item forum-aside-topic-item flex-col"
        >
          <span class="forum-aside-topic-title text-sm color-[var(--vp-c-text-2)] truncate">
            {{ topic.title }}
          </span>
          <ForumTopicTypeBadge class="color-[var(--vp-c-text-3)] mt-1" :type="topic.type" />
        </VPLink>
      </template>
    </div>
  </div>
  <div class="aside-footer mt-4 px-4">
    <nav class="flex shrink-0 basis-auto flex-wrap" role="navigation">
      <a
        v-for="item in message.forum.aside.info"
        :key="item.text"
        :href="item.link"
        :target="item.text"
        class="font-size-[13px] color-[var(--vp-c-text-2)] line-height-4 mr-3 px-[2px] overflow-unset"
      >
        {{ item.text }}
      </a>
    </nav>
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

.forum-aside-list-item:hover {
  background: var(--vp-c-default-soft);
}

.forum-aside-blog-title {
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.forum-aside-document-item,
.forum-aside-topic-item {
  align-items: flex-start;
  text-align: left;
}

.forum-aside-topic-title {
  width: 100%;
  text-align: left;
}
</style>
