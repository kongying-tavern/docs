<script setup lang="ts">
import { useStyleTag } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, onMounted, onUnmounted } from 'vue'
import LocalNav from '@/components/LocalNav.vue'
import { getLangPath } from '@/utils'
import BlogEditorLayout from '~/components/blog/BlogEditorLayout.vue'
import BlogPostDropdownMenu from '~/components/forum/blog/BlogPostDropdownMenu.vue'

const { load, unload } = useStyleTag(`
.VPNav { position: relative !important; }
#VPContent { padding-top: 0 !important; }
`)

const { localeIndex } = useData()
const { go } = useRouter()

// 导航链接配置
const navLinks = computed(() => [
  {
    name: '管理博客',
    icon: 'i-lucide:layout-grid',
    href: withBase(`${getLangPath(localeIndex.value)}blog/`),
    isActive: () => {
      if (typeof window === 'undefined')
        return false
      const path = window.location.pathname
      const blogPath = withBase(`${getLangPath(localeIndex.value)}blog/`)
      return path === blogPath || path.endsWith('/blog/')
    },
  },
  {
    name: '编辑博客',
    icon: 'i-lucide:edit',
    href: withBase(`${getLangPath(localeIndex.value)}blog/editor`),
    isActive: () => {
      if (typeof window === 'undefined')
        return false
      const path = window.location.pathname
      const editorPath = withBase(`${getLangPath(localeIndex.value)}blog/editor`)
      return path === editorPath || path.includes('/blog/editor')
    },
  },
])

onMounted(load)
onUnmounted(unload)
</script>

<template>
  <div class="blog-editor-layout">
    <BlogEditorLayout>
      <template #nav="{ currentBlogPost }">
        <LocalNav class="relative z-40 border-b border-[var(--vp-c-divider)]">
          <div class="h-full w-full flex items-center justify-between">
            <!-- 左侧：导航按钮 -->
            <div class="h-full flex items-center">
              <button
                v-for="link in navLinks"
                :key="link.name"
                class="mx-4 h-full inline-flex items-center py-2 text-sm text-muted-foreground font-semibold transition-all duration-200 first:ml-0 hover:text-foreground"
                :class="{
                  '!border-b-primary !text-foreground': link.isActive(),
                  'opacity-70 hover:border-b-muted': !link.isActive(),
                }"
                @click="go(link.href)"
              >
                <span :class="link.icon" class="mr-2 h-4 w-4" />
                <span class="hidden sm:inline">{{ link.name }}</span>
              </button>
            </div>

            <!-- 右侧：三点下拉菜单 -->
            <div class="flex items-center">
              <BlogPostDropdownMenu :blog-post="currentBlogPost" :is-in-editor="true" />
            </div>
          </div>
        </LocalNav>
      </template>
    </BlogEditorLayout>
  </div>
</template>

<style scoped>
.blog-editor-layout {
  min-height: 100vh;
  background-color: var(--vp-c-bg);
}

/* 隐藏 VitePress 默认的 LocalNav */
.blog-editor-layout > .VPLocalNav {
  display: none;
}

/* 导航按钮样式 - 让下划线与 LocalNav 的下边框重合 */
.blog-editor-layout button {
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  position: relative;
  border-bottom: 1px solid transparent; /* 1px边框厚度 */
  margin-bottom: -1px; /* 让按钮的下边框覆盖 LocalNav 的下边框 */
  z-index: 1; /* 确保按钮边框在 LocalNav 边框之上 */
}

/* Tailwind CSS 变量映射 */
.blog-editor-layout {
  --primary: var(--vp-c-brand-1);
  --foreground: var(--vp-c-text-1);
  --muted-foreground: var(--vp-c-text-2);
  --muted: var(--vp-c-text-3);
}

/* 应用样式类 */
.blog-editor-layout .border-b-primary,
.blog-editor-layout .\!border-b-primary {
  border-bottom-color: var(--primary) !important;
}

.blog-editor-layout .text-foreground,
.blog-editor-layout .\!text-foreground {
  color: var(--foreground) !important;
}

.blog-editor-layout .text-muted-foreground {
  color: var(--muted-foreground);
}

.blog-editor-layout .hover\:border-b-muted:hover {
  border-bottom-color: var(--muted);
}

.blog-editor-layout .hover\:text-foreground:hover {
  color: var(--foreground);
}

.blog-editor-layout .border-b-transparent {
  border-bottom-color: transparent;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .blog-editor-layout button {
    margin-left: 0.75rem;
    margin-right: 0.75rem;
  }
}
</style>
