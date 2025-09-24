<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUserInfoStore } from '@/stores/useUserInfo'
import ForumBlogPostHeader from '~/components/forum/blog/ForumBlogPostHeader.vue'
import { useMarkdownRenderer } from '~/composables/useMarkdownRenderer'
import '@/styles/post-layout.css'

const props = defineProps<{
  title: string
  content: string
  markdownContent?: string
}>()

const emit = defineEmits<{
  close: []
}>()

// ESC 键关闭功能
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// 点击空白区域关闭功能
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 设备预览模式
const devices = [
  {
    name: '桌面',
    icon: 'i-lucide-monitor',
    style: { width: '100%', height: '100%' },
  },
  {
    name: '平板',
    icon: 'i-lucide-tablet',
    style: { width: '768px', height: '100%' },
  },
  {
    name: '手机',
    icon: 'i-lucide-smartphone',
    style: { width: '375px', height: '100%' },
  },
]

const currentDevice = ref(devices[0])

// 获取当前登录用户信息
const userInfoStore = useUserInfoStore()

// 博客预览数据，使用当前登录用户作为作者
const previewBlogData = computed(() => ({
  title: props.title || '博客预览',
  updatedAt: new Date().toISOString(),
  author: userInfoStore.userInfo || {
    login: 'guest-user',
    name: '游客用户',
    avatar_url: '',
  },
  description: '这是博客预览模式',
}))

// Markdown 渲染器
const { renderMarkdownFull } = useMarkdownRenderer()

// 预览内容 - 优先使用 Markdown 内容，否则使用 HTML 内容
const previewContent = computed(() => {
  if (props.markdownContent) {
    // 使用 markdown-it 渲染 Markdown 内容
    return renderMarkdownFull(props.markdownContent)
  }
  // 降级到 HTML 内容
  return props.content || '<p style="color: var(--vp-c-text-3)">暂无内容...</p>'
})

// 在新窗口打开预览
function openInNewWindow() {
  const previewWindow = window.open('', '_blank', 'width=1200,height=800')
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${props.title || '博客预览'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #333;
            background-color: #fff;
            margin: 0;
            padding: 2rem;
          }
          .blog-article {
            max-width: 800px;
            margin: 0 auto;
          }
          .blog-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 1rem;
          }
          .blog-meta {
            display: flex;
            gap: 1rem;
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 2rem;
          }
          .blog-content {
            font-size: 1.1rem;
            line-height: 1.8;
          }
          .blog-content h1, .blog-content h2, .blog-content h3 {
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          .blog-content p {
            margin-bottom: 1rem;
          }
          .blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
          }
          .blog-content blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1rem;
            margin: 1.5rem 0;
            color: #666;
          }
          .blog-footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
          }
          @media (max-width: 768px) {
            body { padding: 1rem; }
            .blog-header h1 { font-size: 2rem; }
            .blog-meta { flex-wrap: wrap; }
          }
        </style>
      </head>
      <body>
        <article class="blog-article">
          <header class="blog-header">
            <h1>${props.title || '无标题博客'}</h1>
            <div class="blog-meta">
              <span>📅 ${formatDate(new Date())}</span>
              <span>⏱ ${readingTime.value}</span>
              <span>📝 ${wordCount.value} 字</span>
            </div>
          </header>
          <div class="blog-content">
            ${previewContent.value || '<p style="color: #666;">暂无内容...</p>'}
          </div>
          <footer class="blog-footer">
            <p>这是一个预览页面，实际发布后的样式可能会略有不同。</p>
          </footer>
        </article>
      </body>
      </html>
    `)
    previewWindow.document.close()
  }
}
</script>

<template>
  <div class="blog-preview-modal fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="handleBackdropClick">
    <div class="blog-preview-container h-[90vh] w-[90vw] flex flex-col rounded-lg bg-[var(--vp-c-bg)] shadow-xl">
      <!-- 预览头部 -->
      <div class="preview-header flex items-center justify-between border-b border-[var(--vp-c-divider)] p-4">
        <div class="flex items-center gap-4">
          <h2 class="text-lg c-[var(--vp-c-text-1)] font-semibold">
            博客预览
          </h2>
          <div class="flex items-center gap-2">
            <!-- 设备预览切换 -->
            <button
              v-for="device in devices"
              :key="device.name"
              class="border rounded-md px-3 py-1 text-sm transition-colors" :class="[
                currentDevice.name === device.name
                  ? 'bg-[var(--vp-c-brand)] text-white border-[var(--vp-c-brand)]'
                  : 'bg-[var(--vp-c-bg-alt)] border-[var(--vp-c-divider)] c-[var(--vp-c-text-2)] hover:bg-[var(--vp-c-bg-soft)]',
              ]"
              @click="currentDevice = device"
            >
              <span :class="device.icon" class="mr-1" />
              {{ device.name }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- 在新窗口打开 -->
          <button
            class="border border-[var(--vp-c-divider)] rounded-md px-3 py-2 c-[var(--vp-c-text-1)] transition-colors hover:bg-[var(--vp-c-bg-soft)]"
            title="在新窗口打开"
            @click="openInNewWindow"
          >
            <span class="i-lucide-external-link" />
          </button>

          <!-- 关闭按钮 -->
          <button
            class="border border-[var(--vp-c-divider)] rounded-md px-3 py-2 c-[var(--vp-c-text-1)] transition-colors hover:bg-[var(--vp-c-bg-soft)]"
            @click="$emit('close')"
          >
            <span class="i-lucide-x" />
          </button>
        </div>
      </div>

      <!-- 预览主体 -->
      <div class="preview-body flex-1 overflow-hidden bg-[var(--vp-c-bg-alt)] p-4">
        <div
          class="preview-viewport mx-auto overflow-hidden rounded-lg bg-[var(--vp-c-bg)] shadow-lg transition-all duration-300"
          :style="currentDevice.style"
        >
          <div class="preview-content h-full overflow-y-auto">
            <!-- 使用共享的 Post 布局结构 -->
            <div class="post-layout" :class="{ 'has-sidebar': false, 'has-aside': false }">
              <div class="post-container">
                <div class="post-content">
                  <div class="post-content-container">
                    <!-- 使用真实的博客头部组件 -->
                    <ForumBlogPostHeader
                      :title="previewBlogData.title"
                      :date="previewBlogData.updatedAt"
                      :author="previewBlogData.author"
                      :description="previewBlogData.description"
                    />

                    <!-- 博客主内容 -->
                    <main class="main">
                      <div
                        class="vp-doc max-w-none prose prose-lg dark:prose-invert"
                        v-html="previewContent"
                      />
                    </main>

                    <!-- 预览标识 -->
                    <div class="mt-8 border border-[var(--vp-c-divider)] rounded-lg bg-[var(--vp-c-bg-soft)] p-4">
                      <div class="flex items-center justify-center gap-2 text-sm c-[var(--vp-c-text-3)]">
                        <span class="i-lucide-eye h-4 w-4" />
                        <span>博客预览模式 - 实际发布后的样式可能会略有不同</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-preview-modal {
  backdrop-filter: blur(4px);
}

.preview-content {
  scrollbar-width: thin;
  scrollbar-color: var(--vp-c-divider) transparent;
}

.preview-content::-webkit-scrollbar {
  width: 6px;
}

.preview-content::-webkit-scrollbar-track {
  background: transparent;
}

.preview-content::-webkit-scrollbar-thumb {
  background-color: var(--vp-c-divider);
  border-radius: 3px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--vp-c-text-3);
}

/* 博客内容样式 */
.blog-article {
  font-family: var(--vp-font-family-base);
}

.blog-content :deep(h1),
.blog-content :deep(h2),
.blog-content :deep(h3),
.blog-content :deep(h4),
.blog-content :deep(h5),
.blog-content :deep(h6) {
  color: var(--vp-c-text-1);
  font-weight: 600;
  line-height: 1.25;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.blog-content :deep(p) {
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
}

.blog-content :deep(blockquote) {
  border-left: 4px solid var(--vp-c-brand);
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.blog-content :deep(code) {
  background-color: var(--vp-c-bg-soft);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.blog-content :deep(pre) {
  background-color: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
}

.blog-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.blog-content :deep(li) {
  margin: 0.5rem 0;
}

/* Post layout styles now imported from shared CSS file */
</style>
