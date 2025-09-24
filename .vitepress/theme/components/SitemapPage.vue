<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useData } from 'vitepress'
import { VPLink } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import postsData from '../../../src/_data/posts.json'
import { getForumLocaleLabelGetter } from '../../../src/composables/getForumLocaleGetter'

interface SitemapItem {
  type: 'blog' | 'manual' | 'general' | 'api' | 'guide'
  title: string
  path: string
  language: string
  category?: string
  description?: string
}

interface SitemapGroup {
  type: string
  title: string
  items: SitemapItem[]
}

interface NavItem {
  text?: string
  link?: string
  items?: NavItem[]
}

const { localeIndex, theme, site } = useData()

// Get current language using VitePress APIs
const currentLang = computed(() => {
  return localeIndex.value || 'root'
})

// Get available locales from VitePress config
const availableLocales = computed(() => {
  return Object.keys(site.value.locales || {})
})

// Get UI translations from theme config
const sitemapTitles = computed(() => {
  return theme.value.ui?.sitemap || {
    blog: 'Blog Posts',
    manual: 'Manual',
    general: 'General',
    api: 'API',
    guide: 'Guide',
    community: 'Community',
    about: 'About',
  }
})

// Blog posts data - 根据当前语言过滤博客文章
const blogPosts = computed((): ForumAPI.Post[] => {
  const lang = currentLang.value
  const locale = lang === 'root' ? 'zh' : lang
  const localeLabelGetter = getForumLocaleLabelGetter()
  const languageTag = localeLabelGetter.getLabel(locale.toUpperCase())

  // 过滤当前语言的博客文章，取前20篇
  return (postsData as ForumAPI.Post[])
    .filter((post: ForumAPI.Post) => {
      if (!post || !post.title || !post.path)
        return false
      // 检查文章是否包含当前语言的标签
      return post.tags && post.tags.includes(languageTag)
    })
    .slice(0, 20)
})

// Extract pages from VitePress navigation and sidebar config
function extractPagesFromConfig(): Array<{ path: string, title: string, type: 'general' | 'manual' | 'blog' | 'api' | 'guide' }> {
  const pages: Array<{ path: string, title: string, type: 'general' | 'manual' | 'blog' | 'api' | 'guide' }> = []
  const seenPaths = new Set<string>()

  // Helper to determine page type based on path
  function getPageType(path: string): 'general' | 'manual' | 'blog' | 'api' | 'guide' {
    if (path.includes('/manual/') || path.includes('/faq/'))
      return 'manual'
    if (path.includes('/blog/'))
      return 'blog'
    if (path.includes('/api/'))
      return 'api'
    if (path.includes('/guide/'))
      return 'guide'
    return 'general'
  }

  // Add page if not duplicate
  function addPage(path: string, title: string) {
    const cleanPath = path.replace(/^\.?\//, '/').replace(/\/$/, '') || '/'
    if (!seenPaths.has(cleanPath)) {
      seenPaths.add(cleanPath)
      pages.push({
        path: cleanPath,
        title,
        type: getPageType(cleanPath),
      })
    }
  }

  // Extract from navigation
  const nav = theme.value.nav || []
  const extractFromNavItems = (items: NavItem[]): void => {
    items.forEach((item: NavItem) => {
      if (item.link && item.text) {
        addPage(item.link, item.text)
      }
      if (item.items) {
        extractFromNavItems(item.items)
      }
    })
  }
  extractFromNavItems(nav)

  // Extract from sidebar
  const sidebar = theme.value.sidebar || {}
  const extractFromSidebarItems = (items: NavItem[]): void => {
    items.forEach((item: NavItem) => {
      if (item.link && item.text) {
        addPage(item.link, item.text)
      }
      if (item.items) {
        extractFromSidebarItems(item.items)
      }
    })
  }

  Object.values(sidebar).forEach((sidebarItems: NavItem[] | NavItem) => {
    if (Array.isArray(sidebarItems)) {
      extractFromSidebarItems(sidebarItems)
    }
  })

  return pages
}

// Helper function to normalize path for current language
function normalizePath(originalPath: string, targetLang: string): string {
  // Remove any existing locale prefix from the path
  const locales = availableLocales.value.filter(locale => locale !== 'root')
  const localePattern = new RegExp(`^/(${locales.join('|')})(?=/|$)`)
  const pathWithoutLocale = originalPath.replace(localePattern, '') || '/'

  // Generate new path based on target language
  if (targetLang === 'root') {
    return pathWithoutLocale
  }
  else {
    return `/${targetLang}${pathWithoutLocale}`
  }
}

// Create sitemap data based on dynamically extracted pages
const sitemapData = computed((): SitemapGroup[] => {
  const lang = currentLang.value
  const t = sitemapTitles.value

  // Get page definitions from VitePress navigation and sidebar config
  const pageDefinitions = extractPagesFromConfig()

  // Filter pages that exist for current language and create sitemap items
  const items: SitemapItem[] = pageDefinitions.map(def => ({
    ...def,
    path: normalizePath(def.path, lang),
    language: lang,
  }))

  // Add blog posts dynamically
  if (blogPosts.value.length > 0) {
    const blogItems: SitemapItem[] = blogPosts.value.map((post: ForumAPI.Post) => ({
      type: 'blog' as const,
      title: post.title || 'Untitled',
      path: normalizePath(`/blog/${post.path}`, lang),
      language: lang,
    }))
    items.push(...blogItems)
  }

  // Group items by type
  const groups: SitemapGroup[] = []
  const groupMap = new Map<string, SitemapItem[]>()

  items.forEach((item) => {
    if (!groupMap.has(item.type)) {
      groupMap.set(item.type, [])
    }
    groupMap.get(item.type)!.push(item)
  })

  // Create groups in desired order
  const typeOrder = ['general', 'manual', 'blog', 'api', 'guide']
  typeOrder.forEach((type) => {
    if (groupMap.has(type)) {
      groups.push({
        type,
        title: t[type as keyof typeof t] || type,
        items: groupMap.get(type)!,
      })
    }
  })

  return groups
})

const currentGroup = computed(() => sitemapData.value)
</script>

<template>
  <div class="VPSitemapPage" style="user-select: none;">
    <!-- Render groups dynamically -->
    <div v-for="group in currentGroup" :key="group.type">
      <h2>{{ group.title }}</h2>
      <div v-for="item in group.items" :key="item.path" class="item">
        <VPLink :href="item.path" class="item-link" :no-icon="true">
          <div class="item-content">
            <div class="badge" :class="[group.type]">
              {{ group.type.charAt(0).toUpperCase() }}
            </div>
            <span class="item-title">{{ item.title }}</span>
          </div>
        </VPLink>
      </div>
      <br>
    </div>
  </div>
</template>

<style scoped>
.VPSitemapPage .item {
  margin: 4px 0;
  width: 100%;
}

.VPSitemapPage .item-link {
  display: block;
  text-decoration: none !important;
  color: inherit;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.VPSitemapPage .item-link:hover {
  background-color: var(--vp-c-bg-soft);
  transform: translateX(4px);
}

.VPSitemapPage .item-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
}

.VPSitemapPage .badge {
  border: 2px solid;
  border-radius: 5px;
  width: 20px;
  height: 20px;
  text-align: center;
  margin: 0;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.VPSitemapPage .item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Badge colors */
.VPSitemapPage .badge.general {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.VPSitemapPage .badge.manual {
  border-color: #059669;
  color: #059669;
}

.VPSitemapPage .badge.blog {
  border-color: #dc2626;
  color: #dc2626;
}

.VPSitemapPage .badge.api {
  border-color: #2563eb;
  color: #2563eb;
}

.VPSitemapPage .badge.guide {
  border-color: #ea580c;
  color: #ea580c;
}

/* Dark mode colors */
.dark .VPSitemapPage .badge.general {
  border-color: #a78bfa;
  color: #a78bfa;
}

.dark .VPSitemapPage .badge.manual {
  border-color: #10b981;
  color: #10b981;
}

.dark .VPSitemapPage .badge.blog {
  border-color: #ef4444;
  color: #ef4444;
}

.dark .VPSitemapPage .badge.api {
  border-color: #3b82f6;
  color: #3b82f6;
}

.dark .VPSitemapPage .badge.guide {
  border-color: #f97316;
  color: #f97316;
}

/* Section headers */
.VPSitemapPage h2 {
  margin: 24px 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 8px;
}

.VPSitemapPage h2:first-child {
  margin-top: 0;
}

@media (max-width: 768px) {
  .VPSitemapPage .item-content {
    padding: 6px 8px;
    gap: 8px;
  }

  .VPSitemapPage .badge {
    width: 18px;
    height: 18px;
    font-size: 11px;
    line-height: 14px;
  }

  .VPSitemapPage h2 {
    font-size: 18px;
    margin: 20px 0 10px 0;
  }
}
</style>
