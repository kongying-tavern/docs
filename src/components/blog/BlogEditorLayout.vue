<script setup lang="ts">
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { renderToMarkdown } from '@tiptap/static-renderer/pm/markdown'
import { useDebounceFn } from '@vueuse/core'
import { useData, withBase } from 'vitepress'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Input } from '@/components/ui/input'

import {
  TiptapContent,
  TiptapProvider,
  TiptapToolbar,
  TiptapTreeStructure,
} from '@/components/ui/tiptap'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { getLangPath } from '@/utils'
import { useMarkdownRenderer } from '~/composables/useMarkdownRenderer'
import BlogPreview from './BlogPreview.vue'
import BlogSelectionDialog from './BlogSelectionDialog.vue'
import { useBlogEditor } from './composables/useBlogEditor'

const { site, localeIndex } = useData()
const userInfoStore = useUserInfoStore()

// 从路由参数获取数据
const draftId = computed(() => {
  if (typeof window === 'undefined')
    return undefined
  const params = new URLSearchParams(window.location.search)
  return params.get('draft') || undefined
})
const blogId = computed(() => {
  if (typeof window === 'undefined')
    return undefined
  const params = new URLSearchParams(window.location.search)
  return params.get('edit') || undefined
})
const isImporting = computed(() => {
  if (typeof window === 'undefined')
    return false
  const params = new URLSearchParams(window.location.search)
  return params.get('import') === 'true'
})

// 博客选择对话框状态
const showSelectionDialog = ref(false)

// 检测是否需要显示选择对话框
const shouldShowSelection = computed(() => {
  return !draftId.value && !blogId.value && !isImporting.value
})

// 处理博客选择
function handleBlogSelection(data: { type: 'draft' | 'api' | 'new', id?: string | number }) {
  const basePath = `${getLangPath(localeIndex.value)}blog/editor`
  let newUrl: string

  switch (data.type) {
    case 'draft':
      newUrl = `${basePath}?draft=${data.id}`
      break
    case 'api':
      newUrl = `${basePath}?edit=${data.id}`
      break
    case 'new':
    default:
      newUrl = basePath
      break
  }

  // 更新URL而不刷新页面
  window.history.replaceState({}, '', withBase(newUrl))

  // 强制重新加载组件
  window.location.reload()
}

const {
  // 编辑器状态
  isReady,
  blogTitle,
  editorContent,
  characterCount,
  characterLimit,
  getCurrentContent,

  // 数据状态
  isLoadingData,
  blogData,
  currentDraftId,
  currentBlogId,

  // 草稿相关
  recentDrafts,
  autoSaveStatus,

  // 操作状态
  canPublish,
  isSaving,
  isPublishing,

  // 预览
  showPreview,

  // 通知
  notification,

  // 方法
  handleTitleChange,
  handleMarkdownChange,
  previewBlog,
  saveDraft,
  publishBlog,
  loadDraft,
  formatDate,
  // 获取编辑器实例（动态切换）
  editor,
} = useBlogEditor({
  draftId: draftId.value,
  blogId: blogId.value,
})

// 简化的Markdown渲染
const debouncedMarkdownRender = useDebounceFn(() => {
  if (!editor.value)
    return

  try {
    const json = editor.value.getJSON()
    const rendered = renderToMarkdown({
      content: json,
      extensions: [StarterKit, Placeholder],
    })
    markdownContent.value = rendered
  }
  catch (error) {
    console.error('Failed to render markdown:', error)
    markdownContent.value = editor.value.getText()
  }
}, 1000) // 1秒防抖

// 使用 useBlogEditor 提供的编辑器实例，避免重复创建

// 初始内容
const initialContent = ref('')
const initialTitle = ref('')

// 处理导入内容
if (isImporting.value) {
  const importContent = sessionStorage.getItem('blog-import-content')
  if (importContent) {
    initialContent.value = importContent
    if (editor.value) {
      editor.value.commands.setContent(importContent)
    }
    sessionStorage.removeItem('blog-import-content')
  }
}

// 侧边栏显示状态
const showSidebar = ref(true)

// 标题在工具栏中的显示状态
const showTitleInToolbar = ref(false)

// 标题元素引用
const headerRef = ref<HTMLElement>()

// 简化但高效的滚动处理
let lastScrollY = 0
const SCROLL_THRESHOLD = 200 // 固定阈值，避免DOM测量

function handleScroll() {
  const currentScrollY = window.scrollY || window.pageYOffset

  // 只在滚动位置有明显变化时更新
  if (Math.abs(currentScrollY - lastScrollY) > 10) {
    showTitleInToolbar.value = currentScrollY > SCROLL_THRESHOLD
    lastScrollY = currentScrollY
  }
}

// Tabs 状态
const activeTab = ref('edit')

// Markdown 渲染器
const { renderMarkdownFull } = useMarkdownRenderer()

// Markdown 内容
const markdownContent = ref('')

// 简化的预览渲染 - 移除复杂缓存
const previewContent = ref('<p class="text-gray-500">开始编写内容，在此查看预览...</p>')

const debouncedPreviewRender = useDebounceFn((markdown: string) => {
  if (!markdown) {
    previewContent.value = '<p class="text-gray-500">开始编写内容，在此查看预览...</p>'
  }
  else {
    previewContent.value = renderMarkdownFull(markdown)
  }
}, 1500) // 预览渲染可以更慢，给1.5秒

// 监听 markdownContent 变化并更新预览 - 仅在预览需要时触发
watch(markdownContent, debouncedPreviewRender)

// 缓存的用户信息，减少重复计算
const defaultUser = computed(() => userInfoStore.userInfo || {
  id: 'guest',
  login: 'guest-user',
  username: '游客用户',
  avatar: '',
})

// 直接使用 useBlogEditor 提供的 editorContent，避免重复缓存

// 构造当前博客对象用于下拉菜单 - 直接使用 useBlogEditor 的数据
const currentBlogPost = computed(() => {
  const user = defaultUser.value
  const currentTime = new Date().toISOString()
  const content = editorContent.value

  return {
    id: blogId.value || draftId.value || 'new',
    title: blogTitle.value || '无标题',
    source: draftId.value ? 'draft' : blogId.value ? 'api' : 'new',
    contentRaw: content,
    tags: [],
    draftData: draftId.value ? { id: draftId.value } : undefined,
    // 添加必要的 ForumAPI.Post 属性
    author: user,
    path: '', // 必需属性
    content: { text: content }, // 必需属性
    link: '', // 必需属性
    commentCount: 0, // 必需属性
    user, // 必需属性
    state: 'open' as const,
    type: 'POST' as const,
    createdAt: currentTime,
    updatedAt: currentTime,
    // 编辑器特有的操作
    editorActions: {
      previewBlog,
      publishBlog,
      canPublish,
      isPublishing,
    },
  }
})

// 返回按钮
function goBack() {
  const blogPath = withBase(`${getLangPath(localeIndex.value)}blog/`)
  window.location.href = blogPath
}

// 缓存的检查结果，减少trim操作 - 使用 useBlogEditor 的数据
const hasUnsavedChanges = computed(() => {
  const title = blogTitle.value
  const content = editorContent.value

  // 避免重复的trim调用，只在必要时才进行trim检查
  if (!title && !content)
    return false
  return title.trim().length > 0 || content.trim().length > 0
})

function beforeUnloadHandler(event: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) {
    event.preventDefault()
    event.returnValue = '您有未保存的更改，确定要离开吗？'
  }
}

// 监听是否需要显示选择对话框
watch(
  shouldShowSelection,
  (needsSelection) => {
    if (needsSelection) {
      nextTick(() => {
        showSelectionDialog.value = true
      })
    }
  },
  { immediate: true },
)

// 智能的Markdown渲染触发 - 只在editorContent变化时触发
watch(editorContent, () => {
  // 只在预览模式或需要markdown时才渲染
  if (activeTab.value === 'preview' || showPreview.value) {
    debouncedMarkdownRender()
  }
}, { flush: 'post' }) // 使用 post flush 确保DOM更新后执行

// 纯文本模式的自动保存现在由TipTap的onUpdate回调处理

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  // 清理事件监听器
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  window.removeEventListener('scroll', handleScroll)

  // 编辑器销毁由 useBlogEditor 处理
})
</script>

<template>
  <div class="blog-editor-page px-2">
    <!-- Header slot for LocalNav -->
    <slot
      name="nav"
      :blog-title="blogTitle"
      :current-blog-post="currentBlogPost"
      :editor="editor"
      :go-back="goBack"
    />

    <!-- 加载状态 -->
    <div v-if="isLoadingData" class="flex items-center justify-center py-8">
      <div class="flex items-center gap-3 text-[var(--vp-c-text-2)]">
        <div class="h-4 w-4 animate-spin border-2 border-[var(--vp-c-brand)] border-r-transparent rounded-full" />
        <span>正在加载内容...</span>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div v-else>
      <!-- 标题输入区域 -->
      <div ref="headerRef" class="blog-editor-header">
        <div class="mb-2 flex items-center gap-3">
          <Input
            v-model="blogTitle"
            placeholder="请输入博客标题..."
            class="h-auto border-none bg-transparent px-0 py-2 text-2xl text-[var(--vp-c-text-1)] font-bold shadow-none placeholder:text-[var(--vp-c-text-3)] focus-visible:ring-0"
            @input="handleTitleChange"
          />
          <!-- 状态指示器 -->
          <div v-if="blogData" class="flex items-center gap-2">
            <div
              class="h-2 w-2 rounded-full"
              :class="{
                'bg-green-500': blogData.isPublished,
                'bg-yellow-500': blogData.source === 'draft',
                'bg-blue-500': blogData.source === 'new',
              }"
            />
            <span class="w-max text-sm text-[var(--vp-c-text-2)]">
              {{
                blogData.isPublished ? '已发布'
                : blogData.source === 'draft' ? '草稿'
                  : '新建'
              }}
            </span>
          </div>
        </div>
        <!-- 时间信息 -->
        <div v-if="blogData?.updatedAt" class="mb-2 pr-8 text-xs text-[var(--vp-c-text-3)]">
          最后更新：{{ formatDate(new Date(blogData.updatedAt)) }}
        </div>
      </div>

      <!-- 使用单一的 TiptapProvider 包装所有编辑器相关组件 -->
      <TiptapProvider :editor="editor">
        <!-- 粘性工具栏 -->
        <div class="blog-editor-toolbar">
          <div class="toolbar-content">
            <!-- 标题显示（滚动时显示） - 移除transition以优化性能 -->
            <span v-if="showTitleInToolbar" class="toolbar-title truncate text-base text-[var(--vp-c-text-1)] font-semibold">
              {{ blogTitle || '无标题' }}
            </span>

            <!-- 右侧内容区域 -->
            <div class="toolbar-right ml-8">
              <!-- 工具栏按钮 -->
              <TiptapToolbar class="justify-start" />
            </div>
          </div>
        </div>

        <!-- 主编辑区域 -->
        <div class="blog-editor-container">
          <!-- 编辑器内容区域 -->
          <div class="blog-editor-main">
            <!-- 富文本编辑器 -->
            <TiptapContent
              class="vp-doc h-full max-w-none min-h-[400px] focus:outline-none markdown-editor"
              placeholder="开始编写你的博客内容..."
            />
          </div>

          <!-- 侧边栏 - 大纲 -->
          <aside
            v-if="showSidebar"
            class="blog-editor-aside"
          >
            <div class="mb-6">
              <h3 class="text-sm text-[var(--vp-c-text-1)] font-semibold tracking-wide uppercase">
                大纲
              </h3>
            </div>

            <TiptapTreeStructure
              class="outline-nav text-sm"
              style="--tree-indent: 16px;"
            />
          </aside>
        </div>
      </TiptapProvider>
    </div>

    <!-- 预览模态框 -->
    <BlogPreview
      v-if="showPreview"
      :title="blogTitle"
      :content="editorContent"
      :markdown-content="markdownContent"
      @close="showPreview = false"
    />

    <!-- 博客选择对话框 -->
    <BlogSelectionDialog
      v-model:open="showSelectionDialog"
      @select="handleBlogSelection"
    />
  </div>
</template>

<style scoped>
.blog-editor-page {
  background-color: var(--vp-c-bg);
}

/* 标题区域 */
.blog-editor-header {
  max-width: calc(var(--vp-layout-max-width) - 64px);
  margin: 0 auto;
  width: 100%;
  padding: 2rem 0 1rem 0rem;
}

/* 粘性工具栏 */
.blog-editor-toolbar {
  position: sticky;
  top: var(--locale-nav-height);
  z-index: var(--vp-z-index-local-nav);
  background-color: var(--vp-local-nav-bg-color);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 12px 8px 12px 24px;
  width: 100%;
}

@media (min-width: 768px) {
  .blog-editor-toolbar {
    padding: 12px 32px;
  }
}

.blog-editor-toolbar .toolbar-content {
  max-width: calc(var(--vp-layout-max-width) - 64px);
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
}

.blog-editor-toolbar .toolbar-title {
  flex-shrink: 0;
}

.blog-editor-toolbar .toolbar-right {
  flex: 1;
  min-width: 0;
}

/* TiptapToolbar 占满剩余宽度 */
.blog-editor-toolbar .tiptap-toolbar {
  width: 100%;
}

/* 纯文本编辑器样式 */
.plain-text-content .ProseMirror {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap !important;
  word-wrap: break-word;
  overflow-wrap: break-word;

  /* 防止重影：确保没有重复的文本渲染 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.plain-text-content .ProseMirror p {
  margin: 0 !important;
  padding: 0 !important;
  white-space: pre-wrap !important;

  /* 移除所有可能导致重影的样式 */
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

/* 确保纯文本模式下没有prose样式干扰 */
.plain-text-content.vp-doc {
  /* 重置prose样式以避免冲突 */
  max-width: none !important;
}

.plain-text-content .ProseMirror * {
  /* 移除所有子元素的格式化样式 */
  font-weight: inherit !important;
  font-style: inherit !important;
  text-decoration: none !important;
  color: inherit !important;
}

.blog-editor-container {
  display: flex;
  min-height: calc(100vh - var(--vp-nav-height, 60px) - 60px);
}

.blog-editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: calc(var(--vp-layout-max-width) - 64px);
  margin: 0 auto;
  width: 100%;
  padding: 0 8px 0 24px;
}

@media (min-width: 768px) {
  .blog-editor-main {
    padding: 0 32px;
  }
}

.blog-editor-aside {
  width: 16rem;
  padding: 1.5rem 1rem;
  position: sticky;
  top: calc(var(--locale-nav-height) + 60px);
  height: fit-content;
  max-height: calc(100vh - var(--locale-nav-height) - 60px);
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .blog-editor-aside {
    display: none;
  }
}

/* 编辑器样式 - 让 prose 类完全控制排版 */
.blog-editor-page .ProseMirror {
  outline: none;
  border: none;
  min-height: 400px;
  padding: 0 !important; /* 完全移除所有padding */
}

/* Markdown 编辑器专用样式 - 显示原始 Markdown 代码 */
.markdown-editor .ProseMirror {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap !important;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown-editor .ProseMirror p {
  margin: 0 !important;
  padding: 0 !important;
  white-space: pre-wrap !important;
}

.markdown-editor .ProseMirror br {
  display: block !important;
  margin: 0 !important;
  content: '';
}

/* 确保硬换行正常显示 */
.markdown-editor .ProseMirror .hard-break,
.markdown-editor .ProseMirror br.hard-break {
  display: block;
  content: '';
  margin: 0;
  padding: 0;
}

.markdown-editor .ProseMirror .hard-break::after,
.markdown-editor .ProseMirror br.hard-break::after {
  content: '\A';
  white-space: pre;
}

/* 编辑器容器样式重置 */
.blog-editor-page .tiptap-editor-wrapper {
  padding: 0 !important;
  margin: 0 !important;
}

.blog-editor-page .tiptap-editor-wrapper > div {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* 移除开头多余的 margin 和 padding */
.blog-editor-page .ProseMirror > *:first-child {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* 更强制性地移除第一个段落的间距 */
.blog-editor-page .ProseMirror > p:first-child,
.blog-editor-page .ProseMirror > h1:first-child,
.blog-editor-page .ProseMirror > h2:first-child,
.blog-editor-page .ProseMirror > h3:first-child,
.blog-editor-page .ProseMirror > h4:first-child,
.blog-editor-page .ProseMirror > h5:first-child,
.blog-editor-page .ProseMirror > h6:first-child,
.blog-editor-page .ProseMirror > div:first-child,
.blog-editor-page .ProseMirror > blockquote:first-child {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.blog-editor-page .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--vp-c-text-3);
  pointer-events: none;
  height: 0;
}

/* 标题输入框样式 */
.blog-editor-page input {
  font-weight: 700;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .blog-editor-page input {
    font-size: 1.5rem !important;
  }
}

/* 大纲样式优化 */
.blog-editor-aside {
  scrollbar-width: thin;
  scrollbar-color: var(--vp-c-divider) transparent;
}

.blog-editor-aside::-webkit-scrollbar {
  width: 6px;
}

.blog-editor-aside::-webkit-scrollbar-track {
  background: transparent;
}

.blog-editor-aside::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 3px;
}

.blog-editor-aside::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

/* VitePress风格的大纲导航 */
.outline-nav :deep(.tree-item) {
  margin-bottom: 4px;
}

.outline-nav :deep(.tree-item-content) {
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
  cursor: pointer;
  line-height: 1.5;
}

.outline-nav :deep(.tree-item-content:hover) {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-default-soft);
}

.outline-nav :deep(.tree-item-content.active) {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.outline-nav :deep(.tree-item-icon) {
  color: var(--vp-c-text-3);
  width: 16px;
  height: 16px;
}

.outline-nav :deep(.tree-item-text) {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 编辑器滚动条样式 */
.blog-editor-page .ProseMirror::-webkit-scrollbar {
  width: 6px;
}

.blog-editor-page .ProseMirror::-webkit-scrollbar-track {
  background: var(--vp-c-bg-alt);
}

.blog-editor-page .ProseMirror::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 3px;
}

.blog-editor-page .ProseMirror::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}
</style>
