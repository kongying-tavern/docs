<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { BlogPost } from '~/_data/posts.data'
import { useData } from 'vitepress'
import { computed, onMounted, onUnmounted } from 'vue'
import { data as allPosts } from '~/_data/posts.data'
import { useBfcacheOptimization } from '~/composables/useBfcacheOptimization'
import { useMarkdownRenderer } from '~/composables/useMarkdownRenderer'
import { fallbackUser } from '~/constants/forum'
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'

import BaseForumPage from './base/BaseForumPage.vue'
import ForumCarouselBento from './ForumCarouselBento.vue'
import ForumTopicSearchInfo from './ForumTopicSearchInfo.vue'

// 扩展 BlogPost 为 Topic 兼容类型
interface BlogPostAsTopic extends Omit<BlogPost, 'id' | 'content'> {
  id: string
  state: ForumAPI.TopicState
  type: ForumAPI.TopicType
  updatedAt: string
  path: string
  user: ForumAPI.User
  content: {
    text: string
    images: never[]
  }
  // 补充 ForumAPI.Topic 需要的属性
  contentRaw: string
  link: string
  commentCount: number
  createdAt: string
  tags: ForumAPI.TopicTags
  title: string
  relatedComments?: ForumAPI.Comment[] | null
}

// 组件元数据配置
defineOptions({
  meta: {
    locales: {
      root: {
        title: '社区反馈',
      },
      ja: {
        title: 'フィードバック',
      },
      en: {
        title: 'Feedback',
      },
    },
    routeOptions: {
      type: ['feat', 'closed', 'bug'],
    },
    data: {
      frontmatter: {
        layout: 'Forum',
      },
    },
    i18n: true,
  },
})

const { lang } = useData()

// 根据当前语言过滤博客数据
const _postsData = computed<BlogPost[]>(() => {
  const currentLang = lang.value || 'zh'
  const baseLang = currentLang.split('-')[0]
  return allPosts.filter((post: BlogPost): post is BlogPost => {
    return Boolean(post?.lang === baseLang)
  })
})

const forumHomeStore = useForumHomeStore()
const { renderMarkdownPreview } = useMarkdownRenderer()

const {
  loadForumData,
  resetState,
  setupEventListeners,
  cleanup,
} = forumHomeStore

// Setup bfcache optimization
const bfcacheOptimization = useBfcacheOptimization()

// 辅助函数：安全地转换博客文章为 Topic 格式
function _transformBlogPostToTopic(post: BlogPost): BlogPostAsTopic {
  const primaryAuthor = post.authors?.[0]

  return {
    ...post,
    id: post.url,
    state: 'open' as const,
    type: 'POST' as const,
    updatedAt: post.gitInfo?.lastModified?.date || post.date,
    path: post.url.slice(post.url.lastIndexOf('/') + 1),
    user: {
      id: primaryAuthor?.id || fallbackUser.id,
      login: primaryAuthor?.login || fallbackUser.login,
      username: primaryAuthor?.username || fallbackUser.username,
      avatar: primaryAuthor?.avatar || fallbackUser.avatar,
    },
    content: {
      text: renderMarkdownPreview(post.excerpt || ''),
      images: [],
    },
  }
}

// 辅助函数：安全地过滤有效的 Topic
function filterValidTopics(topics: (ForumAPI.Topic | null | undefined)[]): ForumAPI.Topic[] {
  return topics.filter((topic): topic is ForumAPI.Topic => {
    return Boolean(topic?.id)
  })
}

const renderData = computed<(ForumAPI.Topic | BlogPostAsTopic)[]>(() => {
  const _isSearching = forumHomeStore.isSearching.value
  const _currentFilter = forumHomeStore.filter.value
  const _shouldShowBlogPosts = !_currentFilter || _currentFilter === 'all'

  // 获取最新的博客文章（仅在非搜索且显示所有内容时）
  // 暂时禁用博客数据加载
  const recentBlogPosts: BlogPostAsTopic[] = []
  // const recentBlogPosts: BlogPostAsTopic[] = shouldShowBlogPosts && !isSearching
  //   ? postsData.value
  //       .slice(0, 5) // 只取最新的5篇博客文章
  //       .map(transformBlogPostToTopic)
  //   : []

  // 获取所有已处理的topics（store.data就是displayTopics，已包含搜索、合并、过滤、排序逻辑）
  const allTopics = filterValidTopics(forumHomeStore.data || [])

  return [
    ...recentBlogPosts,
    ...allTopics,
  ]
})

onMounted(async () => {
  // Check if we should skip initialization (restored from bfcache)
  if (bfcacheOptimization.shouldSkipInitialization()) {
    return
  }

  setupEventListeners()
  await loadForumData()

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('q')) {
    const query = searchParams.get('q')
    if (query) {
      await forumHomeStore.searchTopics(query)
    }
  }
})

onUnmounted(() => {
  if (bfcacheOptimization.shouldPerformCleanup()) {
    cleanup()
    resetState()
  }
  else {
    cleanup()
    resetState({ preserveForBfcache: true })
  }
})
</script>

<template>
  <BaseForumPage :store="forumHomeStore" :render-data="renderData">
    <template #header>
      <ForumCarouselBento class="forum-header" :list="forumHomeStore.pinnedTopicsData || []" />
    </template>

    <template #content-before>
      <ForumTopicSearchInfo />
    </template>
  </BaseForumPage>
</template>
