<script setup lang="ts">
import type { EnhancedBlogPost } from '~/components/blog/composables/useBlogData'
import { useData, useRouter, withBase } from 'vitepress'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import Time from '@/components/ui/Time/Time.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { useBlogHomeData } from '~/components/blog/composables/useBlogComposers'
import { useMarkdownRenderer } from '~/composables/useMarkdownRenderer'
import BlogPostDropdownMenu from './BlogPostDropdownMenu.vue'
import ForumBlogListSkeleton from './ForumBlogListSkeleton.vue'

const { message } = useLocalized()
const { lang, localeIndex } = useData()
const router = useRouter()

// 使用新的博客数据组合器
const {
  allPosts,
  isLoading,
  canManageBlog,
  getBlogStatus,
} = useBlogHomeData(lang.value)

// Markdown渲染器
const { renderMarkdownPreview } = useMarkdownRenderer()

// 使用新架构的博客数据 - 已经处理了语言过滤和权限控制
const filteredPosts = computed(() => {
  // 新架构已经在组合器中正确处理了语言过滤和权限控制
  // 无需额外过滤，直接使用组合器提供的数据
  return allPosts.value
})

// 获取博客状态badge - 使用新的状态获取函数
function getBadgeInfo(post: EnhancedBlogPost) {
  const status = getBlogStatus(post)

  // 映射新的状态到旧的badge格式
  const variantMap = {
    'published': 'outline' as const,
    'needs-update': 'destructive' as const,
    'draft': 'secondary' as const,
    'pending': 'default' as const,
    'local-draft': 'secondary' as const,
  }

  return {
    text: status.label,
    variant: variantMap[status.status] || 'secondary' as const,
  }
}

// 获取博客链接
function getBlogLink(post: EnhancedBlogPost) {
  // 本地草稿或API中未发布的博客返回空，通过点击事件处理
  if (post.source === 'draft' || (post.source === 'api' && post.tags?.includes('DRAFT'))) {
    return '#'
  }
  // 已发布的博客跳转到对应页面，使用 VitePress 路由
  if (post.source === 'static' || post.source === 'api') {
    return withBase(`${getLangPath(localeIndex.value)}blog/${post.path}`)
  }
  return '#'
}

// 处理博客点击
async function handleBlogClick(post: EnhancedBlogPost, event: Event) {
  // 本地草稿跳转到编辑器
  if (post.source === 'draft') {
    event.preventDefault()
    const editorPath = withBase(`${getLangPath(localeIndex.value)}blog/editor?draft=${post.draftData?.id}`)
    await router.go(editorPath)
    return
  }
  // API中未发布的博客跳转到编辑器
  if (post.source === 'api' && post.tags?.includes('DRAFT')) {
    event.preventDefault()
    const editorPath = withBase(`${getLangPath(localeIndex.value)}blog/editor?edit=${post.id}`)
    await router.go(editorPath)
  }
  // 已发布的博客正常跳转（由href和VitePress路由处理）
}
</script>

<template>
  <div class="blog-page">
    <!-- 骨架屏加载状态 -->
    <ForumBlogListSkeleton v-if="isLoading && canManageBlog" />

    <!-- 博客列表 -->
    <div v-else class="divide-y">
      <ul class="c-[var(--vp-c-text-1)]">
        <li
          v-for="post of filteredPosts"
          :key="post.id"
          v-motion-slide-top
          class="relative border-b border-b-[var(--vp-c-divider)] py-12"
        >
          <article
            class="xl:grid xl:grid-cols-4 xl:items-baseline space-y-2 xl:space-y-0"
          >
            <div class="flex items-center justify-between xl:block">
              <div>
                <Time
                  class="list-none text-base c-[var(--vp-c-text-3)] leading-6 font-[var(--vp-font-family-subtitle)]"
                  :datetime="post.createdAt"
                  :locale="lang"
                  date-style="medium"
                />

                <!-- 上次发布日期（仅过时博客显示） -->
                <div v-if="canManageBlog && post.isOutdated && post.staticVersion" class="mt-1">
                  <span class="text-xs c-[var(--vp-c-text-3)]">
                    上次发布:
                  </span>
                  <Time
                    class="text-xs c-[var(--vp-c-text-3)]"
                    :datetime="post.staticVersion.updatedAt"
                    :locale="lang"
                    date-style="medium"
                  />
                </div>
              </div>

              <!-- 状态badge，仅管理员可见 -->
              <div v-if="canManageBlog && getBadgeInfo(post)" class="mt-2 flex items-center gap-2">
                <Badge
                  :variant="getBadgeInfo(post).variant"
                  class="text-xs"
                >
                  {{ getBadgeInfo(post).text }}
                </Badge>
              </div>
            </div>

            <div class="xl:col-span-3 space-y-5">
              <div class="space-y-6">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h2 class="mb-2 text-2xl font-bold leading-8 tracking-tight">
                      <a
                        class="c-[var(--vp-c-text-1)] hover:underline"
                        :href="getBlogLink(post)"
                        @click="handleBlogClick(post, $event)"
                      >
                        {{ post.title }}
                      </a>
                    </h2>
                  </div>

                  <!-- 博客下拉菜单 -->
                  <div v-if="canManageBlog" class="ml-4 flex items-center">
                    <BlogPostDropdownMenu :blog-post="post" class="h-8 w-8" />
                  </div>
                </div>

                <div
                  v-if="post.contentRaw"
                  class="line-clamp-5 max-w-none c-[var(--vp-c-text-2)] prose prose-sm"
                  v-html="renderMarkdownPreview(post.contentRaw, 300)"
                />
              </div>
              <div class="text-base font-medium leading-6">
                <a
                  class="vp-link"
                  :href="getBlogLink(post)"
                  @click="handleBlogClick(post, $event)"
                >
                  {{ message.forum.readMore }} →
                </a>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && filteredPosts.length === 0" class="py-12 text-center">
      <div class="c-[var(--vp-c-text-3)]">
        <span class="i-lucide-file-text mb-4 block text-6xl" />
        <p class="mb-2 text-lg">
          暂无博客文章
        </p>
        <p class="text-sm">
          <span v-if="canManageBlog">点击上方"新建博客"按钮开始创作吧！</span>
          <span v-else>敬请期待更多精彩内容</span>
        </p>
      </div>
    </div>
  </div>
</template>
