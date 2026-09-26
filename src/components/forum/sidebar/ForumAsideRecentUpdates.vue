<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { data as allBlogPosts } from '~/_data/posts.data'
import { useRecentBlogUpdates } from '~/composables/forum/useRecentBlogUpdates'
import { describeBlogUpdate } from '~/services/forum/blogUpdateFeed'
import ForumTime from '../ui/ForumTime.vue'

const { localeIndex } = useData()
const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.recentUpdates)

const items = useRecentBlogUpdates(allBlogPosts)

// 站点默认语言挂在根路径下，博客路由需按当前 locale 前缀拼；base 交给 VPLink 处理
function postHref(slug: string): string {
  return `${getLangPath(localeIndex.value)}blog/posts/${slug}`
}
</script>

<template>
  <section
    v-if="items.length > 0"
    class="aside-recent-updates mb-4"
    aria-labelledby="aside-recent-updates-title"
  >
    <div class="lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14">
      <h2 id="aside-recent-updates-title" class="aside-recent-updates-title color-[var(--vp-c-text-1)]">
        {{ copy.title }}
      </h2>
    </div>

    <ol class="aside-recent-updates-list">
      <li
        v-for="item in items"
        :key="item.slug"
        class="aside-recent-updates-entry"
      >
        <span class="aside-recent-updates-dot" aria-hidden="true" />
        <VPLink class="aside-recent-updates-item" :href="postHref(item.slug)">
          <ForumTime class="aside-recent-updates-time" :date="item.updatedAt" :toggleable="false" />
          <span class="aside-recent-updates-text">{{ describeBlogUpdate(item, copy) }}</span>
        </VPLink>
      </li>
    </ol>
  </section>
</template>

<style scoped>
/* 小节标题跟随同卡片的其它小节；此处需比 .forum-context-aside :deep(h2) 更具体 */
.aside-recent-updates .aside-recent-updates-title {
  font-size: calc(16px * var(--site-ui-scale));
  line-height: inherit;
}

.aside-recent-updates-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.aside-recent-updates-entry {
  position: relative;
  margin-bottom: 4px;
}

.aside-recent-updates-entry:last-child {
  margin-bottom: 0;
}

/* 轴与圆点对齐小节标题的左缘（卡片内容左缘），不再往卡片留白里挤 */
.aside-recent-updates-entry:not(:last-child)::before {
  position: absolute;
  left: 5px;
  top: 20.5px;
  bottom: -13.5px;
  width: 1px;
  content: '';
  background-color: var(--vp-c-divider);
}

/* 与首行（时间，18px 行高）垂直居中：6px 上内边距 + (18px - 11px) / 2 */
.aside-recent-updates-dot {
  position: absolute;
  left: 0;
  top: 9.5px;
  box-sizing: border-box;
  width: 11px;
  height: 11px;
  border: 2px solid var(--vp-c-border);
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
}

/* 左内边距按圆点 + 间隙取最小值，让文字尽量靠近同卡片的其它列表行 */
.aside-recent-updates-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-radius: 6px;
  padding: 6px 8px 6px 17px;
}

.aside-recent-updates-time {
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

/* 留 3 行，直接引用原文时不必在句中截断 */
.aside-recent-updates-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--vp-c-text-1);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(19px * var(--site-ui-scale));
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

/* hover 只作链接色提示，不做卡片底色 */
.aside-recent-updates-item:hover .aside-recent-updates-text {
  color: var(--vp-c-brand-1);
}
</style>
