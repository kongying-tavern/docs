<script setup lang="ts">
import Banner from '@/components/banner/Banner.vue'
import DocAside from '@/components/DocAside.vue'
import DocFeedback from '@/components/DocFeedback.vue'
import DocHeader from '@/components/DocHeader.vue'
import DocInfo from '@/components/DocInfo.vue'
import { Notifications } from '@/components/ui'
import HighlightTargetedHeading from '@/components/HighlightTargetedHeading.vue'
import NavBarUserAvatar from '@/components/NavBarUserAvatar.vue'
import { Sonner } from '@/components/ui/sonner'
import mediumZoom from 'medium-zoom'
import { useRouter, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { nextTick, onMounted, provide } from 'vue'
import { loadFonts } from '@/composables/loadFonts'

import '@/styles/vars.css'
import '@/styles/main.css'
import '@/styles/ui.css'
import '@/styles/timeline.css'
import '@/styles/kbd.css'
import '@/styles/animation.css'
import '@/styles/shadcn.css'
import '@/styles/fonts.css'
import { enableTransitions } from '@/shared'

const { Layout } = DefaultTheme
const { isDark } = useData()

const router = useRouter()

const setupMediumZoom = () => {
  mediumZoom('[data-zoomable]', {
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

router.onAfterRouteChanged = setupMediumZoom
</script>

<template>
  <Layout>
    <template #layout-top>
      <Banner />
      <Sonner />
    </template>

    <template #doc-after>
      <DocFeedback />
    </template>

    <template #doc-before>
      <DocHeader />
    </template>

    <template #doc-footer-before>
      <DocInfo />
    </template>

    <!-- <template #aside-outline-after>
      <DocAside />
    </template> -->

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
