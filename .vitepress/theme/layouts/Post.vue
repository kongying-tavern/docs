<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { useSidebar } from 'vitepress/theme-without-fonts'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import ForumBlogPostHeader from '~/components/forum/blog/ForumBlogPostHeader.vue'

/** Matches dots and slashes in route paths */
const DOT_SLASH_REGEX = /[./]+/g

/** Matches .html extension suffix */
const HTML_SUFFIX_REGEX = /_html$/

const { params, theme, frontmatter } = useData()
const { hasSidebar, hasAside, leftAside } = useSidebar()
const route = useRoute()

// 右侧大纲由 frontmatter 配置启用（outline: true / 'deep' 等），默认关闭
const showOutline = computed(() => {
  const outline = frontmatter.value.outline
  return hasAside && outline != null && outline !== false
})

interface OutlineItem {
  id: string
  title: string
  level: number
}

const outlineItems = ref<OutlineItem[]>([])

// 元素在挂载后不变，滚动时只读布局而不重复查询 DOM
let outlineLinks: HTMLAnchorElement[] = []
let outlineHeadingElements: HTMLElement[] = []

/** 大纲只收集正文标题与 timeline 的 dot 标题，timeline 内容标题剔除 */
function isOutlineHeading(heading: HTMLElement) {
  return !heading.closest('.timeline-dot') || heading.classList.contains('timeline-dot-title')
}

/** 标题文本：dot 标题为空时（纯日期条目）回退取左侧日期 */
function headingTitle(heading: HTMLElement) {
  return (heading.textContent || '').trim()
    || heading.closest('.timeline-dot')?.querySelector('.timeline-dot-date')?.textContent?.trim()
    || ''
}

// 滚动时同步高亮与 URL hash（参考 VitePress useActiveAnchor，额外写入 hash）
function syncActiveHeading() {
  const offset = 80
  let currentId: string | null = null
  const scrollY = window.scrollY
  for (const heading of outlineHeadingElements) {
    if (heading.getBoundingClientRect().top + scrollY <= scrollY + offset)
      currentId = heading.id
    else
      break
  }
  outlineLinks.forEach((link) => {
    const active = currentId != null && link.getAttribute('href') === `#${currentId}`
    link.classList.toggle('active', active)
  })
  if (currentId && location.hash !== `#${currentId}`)
    history.replaceState(history.state, '', `#${currentId}`)
}

onMounted(() => {
  const root = document.querySelector('.post-content')
  if (!root)
    return
  outlineItems.value = [...root.querySelectorAll(':where(h2, h3, h4)')]
    .filter(isOutlineHeading)
    .map(heading => ({
      id: heading.id,
      title: headingTitle(heading),
      level: Number(heading.tagName[1]),
    }))
    .filter(item => item.title)
  outlineLinks = [...document.querySelectorAll('.post-aside .outline a')]
  outlineHeadingElements = outlineItems.value
    .map(item => document.getElementById(item.id))
    .filter((element): element is HTMLElement => Boolean(element))

  window.addEventListener('scroll', syncActiveHeading, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncActiveHeading)
})

const pageName = computed(() =>
  route.path.replace(DOT_SLASH_REGEX, '_').replace(HTML_SUFFIX_REGEX, ''),
)

if (params?.value?.title && !import.meta.env.SSR) {
  location.replace(`./posts/${params?.value.path}`)
}

if (params?.value) {
  replaceTitle(params?.value.title)
}
</script>

<template>
  <div
    class="post-layout"
    :class="{ 'has-sidebar': hasSidebar, 'has-aside': hasAside }"
  >
    <slot name="doc-top" />
    <div class="post-container">
      <div v-if="showOutline" class="post-aside" :class="{ 'left-aside': leftAside }">
        <div class="aside-curtain" />
        <div class="aside-container">
          <div class="aside-content">
            <p class="outline-title">
              {{ theme.outline?.label || theme.outlineTitle || '本页目录' }}
            </p>
            <nav
              v-if="outlineItems.length"
              class="outline"
            >
              <ul>
                <li
                  v-for="item in outlineItems"
                  :key="item.id"
                  :style="{ paddingLeft: `${(item.level - 2) * 12}px` }"
                >
                  <a :href="`#${item.id}`">
                    {{ item.title }}
                  </a>
                </li>
              </ul>
            </nav>
            <slot name="aside-bottom" />
          </div>
        </div>
      </div>

      <div class="post-content">
        <div class="post-content-container">
          <slot name="doc-before" />

          <ForumBlogPostHeader />

          <main class="main">
            <Content
              class="vp-doc VPDoc"
              :class="[
                pageName,
                theme.externalLinkIcon && 'external-link-icon-enabled',
              ]"
            />
          </main>
        </div>
      </div>
    </div>
    <slot name="doc-bottom" />
  </div>
</template>

<style scoped>
.post-aside .outline a.active {
  color: var(--vp-c-brand-1);
}

.post-layout {
  padding: 32px 24px 96px;
  width: 100%;
}

@media (min-width: 768px) {
  .post-layout {
    padding: 48px 32px 128px;
  }
}

@media (min-width: 960px) {
  .post-layout {
    padding: 48px 32px 0;
  }

  .post-layout:not(.has-sidebar) .post-container {
    display: flex;
    justify-content: center;
    max-width: 992px;
  }

  .post-layout:not(.has-sidebar) .post-content {
    max-width: 752px;
  }
}

@media (min-width: 1280px) {
  .post-layout .post-container {
    display: flex;
    justify-content: center;
  }

  .post-layout .post-aside {
    display: block;
  }
}

@media (min-width: 1440px) {
  .post-layout:not(.has-sidebar) .post-content {
    max-width: 992px;
  }

  .post-layout:not(.has-sidebar) .post-container {
    max-width: 1104px;
  }
}

.post-container {
  margin: 0 auto;
  width: 100%;
}

.post-aside {
  position: relative;
  display: none;
  order: 2;
  flex-grow: 1;
  padding-left: 32px;
  width: 100%;
  max-width: 256px;
}

.post-aside.left-aside {
  order: 1;
  padding-left: unset;
  padding-right: 32px;
}

.post-aside .aside-container {
  position: fixed;
  top: 0;
  padding-top: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + var(--vp-doc-top-height, 0px) + 48px);
  width: 224px;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

.post-aside .aside-container::-webkit-scrollbar {
  display: none;
}

.post-aside .aside-curtain {
  position: fixed;
  bottom: 0;
  z-index: 10;
  width: 224px;
  height: 32px;
  background: linear-gradient(transparent, var(--vp-c-bg) 70%);
  pointer-events: none;
}

.post-aside .aside-content {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - (var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 48px));
  padding-bottom: 32px;
}

.post-content {
  position: relative;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 960px) {
  .post-content {
    padding: 0 32px 128px;
  }
}

@media (min-width: 1280px) {
  .post-content {
    order: 1;
    margin: 0;
    min-width: 640px;
  }
}

.post-content-container {
  margin: 0 auto;
}

.post-layout.has-aside .post-content-container,
.post-layout .post-container:has(.post-aside) .post-content-container {
  max-width: 688px;
}
</style>
