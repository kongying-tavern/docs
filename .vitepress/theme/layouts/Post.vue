<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { useLayout } from 'vitepress/theme-without-fonts'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import ForumBlogPostHeader from '~/forum/components/blog/ForumBlogPostHeader.vue'

/** Matches dots and slashes in route paths */
const DOT_SLASH_REGEX = /[./]+/g

/** Matches .html extension suffix */
const HTML_SUFFIX_REGEX = /_html$/

const { params, theme, frontmatter } = useData()
const { hasSidebar, hasAside, leftAside } = useLayout()
const route = useRoute()

// 右侧大纲由 frontmatter 配置启用（outline: true / 'deep' 等），默认关闭
const showOutline = computed(() => {
  const outline = frontmatter.value.outline
  // hasAside 是 computed，脚本里必须取 .value（模板会自动解包，不能照抄模板写法）
  return hasAside.value && outline != null && outline !== false
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
  let currentId: string | null = null
  const scrollY = window.scrollY
  for (const heading of outlineHeadingElements) {
    const offset = Number.parseFloat(getComputedStyle(heading).scrollMarginTop) || 0
    if (heading.getBoundingClientRect().top + scrollY <= scrollY + offset + 1)
      currentId = heading.id
    else
      break
  }
  outlineLinks.forEach((link) => {
    const active = currentId != null && link.getAttribute('href') === `#${currentId}`
    link.classList.toggle('active', active)
  })
  if (currentId && location.hash !== `#${currentId}`) {
    history.replaceState(history.state, '', `#${currentId}`)
    route.hash = `#${currentId}`
  }
}

onMounted(() => {
  const root = document.querySelector('.post-content')
  if (!root)
    return
  outlineItems.value = [...root.querySelectorAll<HTMLElement>(':where(h2, h3, h4)')]
    .filter(isOutlineHeading)
    .map(heading => ({
      id: heading.id,
      title: headingTitle(heading),
      level: Number(heading.tagName[1]),
    }))
    .filter(item => item.title)
  outlineLinks = [...document.querySelectorAll<HTMLAnchorElement>('.post-aside .outline a')]
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
              {{ theme.outline?.label || '本页目录' }}
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
.post-aside .outline-title {
  font-family: var(--vp-font-family-base);
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-1);
}

.post-aside .outline ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-aside .outline li {
  margin: 0;
}

.post-aside .outline a {
  display: block;
  padding: 6px 0 6px 12px;
  border-left: 2px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-base);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  overflow-wrap: anywhere;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.post-aside .outline a:hover,
.post-aside .outline a:focus-visible {
  color: var(--vp-c-text-1);
}

.post-aside .outline a.active {
  border-left-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  font-weight: 600;
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
  max-width: 800px;
}

.post-layout.has-aside .post-content-container,
.post-layout .post-container:has(.post-aside) .post-content-container {
  max-width: 688px;
}

.main :deep(.vp-doc) {
  font-family: var(--vp-font-family-base);
  font-size: 16px;
  line-height: 1.8;
  overflow-wrap: break-word;
}

.main :deep(.timeline-dot) {
  --post-timeline-dot-center: calc(28px + 24px * 0.7);
  padding-top: 28px;
  padding-bottom: 32px;
  color: var(--vp-c-text-1);
}

.main :deep(.timeline-dot::before) {
  top: calc(var(--post-timeline-dot-center) - 8px);
}

.main :deep(.timeline-dot:not(.timeline-dot + .timeline-dot)::after) {
  top: var(--post-timeline-dot-center);
  height: calc(100% - var(--post-timeline-dot-center));
}

.main :deep(.timeline-dot:not(.timeline-dot + .timeline-dot):not(:has(.timeline-dot-icon))::before) {
  top: calc(var(--post-timeline-dot-center) - 6px);
  width: 12px;
  height: 12px;
  margin-left: 2px;
  border-width: 6px;
  box-shadow:
    0 0 0 2px var(--vp-c-bg),
    0 0 0 4px color-mix(in srgb, var(--vp-c-brand) 12%, transparent);
}

.main :deep(.timeline-dot:has(.timeline-dot-icon)::before) {
  top: calc(var(--post-timeline-dot-center) - 12px);
}

.main :deep(.timeline-dot:has(.timeline-dot-icon) .timeline-dot-icon) {
  top: calc(var(--post-timeline-dot-center) - 6.5px);
}

.main :deep(.timeline-dot-title) {
  font-synthesis: none;
  font-family: var(--vp-font-family-subtitle);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  border: 0;
  text-wrap: balance;
  scroll-margin-top: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 24px);
}

.main :deep(.timeline-dot-date) {
  font-synthesis: none;
  font-family: var(--vp-font-family-base);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

.main :deep(.timeline-dot-date-year) {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.main :deep(.timeline-dot > h2:not(.timeline-dot-title)),
.main :deep(.timeline-dot > h3) {
  font-family: var(--vp-font-family-base) !important;
  font-size: 18px !important;
  font-weight: 600;
  line-height: 1.5;
  margin: 24px 0 12px;
  padding: 0;
  border: 0;
}

.main :deep(.timeline-dot > h3) {
  font-size: 16px !important;
}

.main :deep(.timeline-dot > ul) {
  margin: 14px 0 0;
  padding-left: 20px;
}

.main :deep(.timeline-dot li + li) {
  margin-top: 8px;
}

.main :deep(.timeline-dot li::marker) {
  color: var(--vp-c-text-3);
}

.main :deep(.timeline-dot strong) {
  font-weight: 600;
}

@media (max-width: 959px) {
  .main :deep(.timeline-dot-title) {
    scroll-margin-top: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 72px);
  }
}

@media (min-width: 641px) {
  .main :deep(.timeline-dot:not(.timeline-dot-concise)) {
    padding-left: 152px;
  }

  .main :deep(.timeline-dot:not(.timeline-dot-concise)::before) {
    left: 120px;
  }

  .main :deep(.timeline-dot:not(.timeline-dot-concise)::after) {
    left: 127px;
  }

  .main :deep(.timeline-dot:not(.timeline-dot-concise):has(.timeline-dot-icon)::before) {
    left: 116px;
  }

  .main :deep(.timeline-dot:not(.timeline-dot-concise):has(.timeline-dot-icon) .timeline-dot-icon) {
    left: 121.5px;
  }

  .main :deep(.timeline-dot-date) {
    top: 35px;
    width: 104px;
  }

  .main :deep(.timeline-dot-date-md) {
    justify-content: flex-end;
    gap: 0;
    align-items: baseline;
  }

  .main :deep(.timeline-dot-date-md) {
    font-size: 14px;
    letter-spacing: 0.015em;
    white-space: pre;
  }

  .main :deep(.timeline-dot-date-month) {
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
    color: var(--vp-c-text-1);
  }

  .main :deep(.timeline-dot-date-day) {
    font-size: 14px;
    font-weight: 600;
  }

  .main :deep(.timeline-dot-date-literal) {
    margin: 0 2px;
    font-size: 11px;
    font-weight: 400;
    color: var(--vp-c-text-3);
  }

  .main :deep(.timeline-dot-date-char) {
    flex: none;
  }

  .main :deep(.timeline-dot .timeline-dot-date-year) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .main :deep(.timeline-dot-year-start) {
    isolation: isolate;
    min-height: 232px;
  }

  .main :deep(.timeline-dot-year-start) {
    --post-timeline-dot-center: calc(92px + 24px * 0.7);
    padding-top: 92px;
  }

  .main :deep(.timeline-dot-year-start .timeline-dot-date) {
    top: 99px;
  }

  .main :deep(.timeline-dot-year-backdrop) {
    position: absolute;
    display: block;
    top: calc(var(--post-timeline-dot-center) - 144px * 0.4);
    right: 0;
    z-index: -1;
    font-family: var(--vp-font-family-title);
    font-size: 144px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.045em;
    color: transparent;
    -webkit-text-stroke: 1.2px color-mix(in srgb, var(--vp-c-text-1) 18%, transparent);
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: normal;
    pointer-events: none;
    user-select: none;
  }
}

@media (max-width: 640px) {
  .main :deep(.timeline-dot-year-start) {
    isolation: isolate;
    min-height: 200px;
  }

  .main :deep(.timeline-dot.timeline-dot-year-start:has(.timeline-dot-date)) {
    --post-timeline-dot-center: calc(64px + 13px * 1.5 + 4px + 22px * 0.7);
    padding-top: 64px;
  }

  .main :deep(.timeline-dot-year-backdrop) {
    position: absolute;
    display: block;
    top: calc(var(--post-timeline-dot-center) - 88px * 0.4);
    right: 0;
    z-index: -1;
    font-family: var(--vp-font-family-title);
    font-size: 88px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.045em;
    color: transparent;
    -webkit-text-stroke: 1px color-mix(in srgb, var(--vp-c-text-1) 16%, transparent);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }

  .main :deep(.timeline-dot) {
    --post-timeline-dot-center: calc(24px + 22px * 0.7);
    padding: 24px 0 28px 32px;
  }

  .main :deep(.timeline-dot:has(.timeline-dot-date)) {
    --post-timeline-dot-center: calc(24px + 13px * 1.5 + 4px + 22px * 0.7);
  }

  .main :deep(.timeline-dot:has(.timeline-dot-sr)) {
    --post-timeline-dot-center: calc(24px + 13px * 0.75);
  }

  .main :deep(.timeline-dot::before) {
    left: 0;
  }

  .main :deep(.timeline-dot::after) {
    left: 7px;
  }

  .main :deep(.timeline-dot-date) {
    position: static;
    display: flex;
    gap: 6px;
    width: auto;
    margin-bottom: 4px;
  }

  .main :deep(.timeline-dot-date-full) {
    display: block;
  }

  .main :deep(.timeline-dot-date-year),
  .main :deep(.timeline-dot-date-md) {
    display: none;
  }

  .main :deep(.timeline-dot-date-char) {
    flex: none;
  }

  .main :deep(.timeline-dot-title) {
    font-size: 22px;
  }

  .main :deep(.timeline-dot:has(.timeline-dot-icon)::before) {
    left: -4px;
  }

  .main :deep(.timeline-dot:has(.timeline-dot-icon) .timeline-dot-icon) {
    left: 1.5px;
  }
}
</style>
