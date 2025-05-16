<script setup lang="ts">
import Banner from '@/components/banner/Banner.vue'
import DocAside from '@/components/DocAside.vue'
import DocHeader from '@/components/DocHeader.vue'
import DocReaction from '@/components/DocReaction.vue'
import HighlightTargetedHeading from '@/components/HighlightTargetedHeading.vue'
import NavBarUserAvatar from '@/components/NavBarUserAvatar.vue'
import { Notifications } from '@/components/ui'
import { Sonner } from '@/components/ui/sonner'
import { loadFonts } from '@/composables/loadFonts'
import { enableTransitions } from '@/shared'
import { useIntersectionObserver } from '@vueuse/core'
import mediumZoom from 'medium-zoom'
import { useData, useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { computed, nextTick, onMounted, provide, shallowRef, useTemplateRef, watch } from 'vue'

import '@/styles/vars.css'
import '@/styles/main.css'
import '@/styles/ui.css'
import '@/styles/timeline.css'
import '@/styles/kbd.css'
import '@/styles/demo.css'
import '@/styles/animation.css'
import '@/styles/shadcn.css'
import '@/styles/fonts.css'

const { Layout } = DefaultTheme
const { isDark, frontmatter } = useData()

const router = useRouter()
const target = useTemplateRef<HTMLDivElement>('target')
const targetIsVisible = shallowRef(false)
const showAside = computed(
  () =>
    frontmatter.value.docAside !== false
    && frontmatter.value.aside === true
    && frontmatter.value.outline !== false,
)

function setupMediumZoom() {
  if (import.meta.env.SSR)
    return
  mediumZoom('[data-zoomable="true"]', {
    background: 'transparent',
  })
}

loadFonts([
  {
    fontName: 'HYWenHei-85W',
    fontPath: '/fonts/HYWenHei-85W-zh-full.woff2',
  },
  {
    fontName: 'HYWenHei-65W',
    fontPath: '/fonts/HYWenHei-65W.woff2',
  },
  {
    fontName: 'HYWenHei-45W',
    fontPath: '/fonts/HYWenHei-45W.woff2',
  },
])

onMounted(() => {
  setupMediumZoom()
})

watch(showAside, (value) => {
  if (value) {
    useIntersectionObserver(
      target,
      ([entry]) => {
        targetIsVisible.value = entry?.isIntersecting || false
      },
    )
  }
}, {
  immediate: true,
})

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value
    return
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )}px at ${x}px ${y}px)`,
  ]

  await document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  }).ready

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 300,
      easing: 'ease-in',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
    },
  )
})

router.onAfterRouteChange = setupMediumZoom
</script>

<template>
  <Layout :class="{ [frontmatter.layout || '']: true, [frontmatter.class || '']: true }">
    <template #layout-top>
      <Banner />
      <Sonner />
    </template>

    <template #doc-after>
      <DocReaction ref="target" />
    </template>

    <template #doc-before>
      <DocHeader />
    </template>
    <!--
    <template #doc-footer-before>
      <DocInfo />
    </template> -->

    <template #aside-outline-after>
      <DocAside v-if="showAside" :show-reaction="!targetIsVisible" />
    </template>

    <template #nav-bar-content-after>
      <NavBarUserAvatar />
    </template>

    <template #layout-bottom>
      <HighlightTargetedHeading />
      <Notifications />
    </template>
  </Layout>
</template>

<style>
.medium-zoom-overlay {
  backdrop-filter: blur(5rem);
}

.medium-zoom-overlay,
.medium-zoom-image--opened {
  z-index: 999;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}
</style>
