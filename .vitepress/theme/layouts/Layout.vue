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
import { useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { onMounted } from 'vue'
import { loadFonts } from '@/composables/loadFonts'

import '@/styles/vars.css'
import '@/styles/main.css'
import '@/styles/ui.css'
import '@/styles/timeline.css'
import '@/styles/kbd.css'
import '@/styles/animation.css'
import '@/styles/shadcn.css'
import '@/styles/fonts.css'

const { Layout } = DefaultTheme
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

    <template #aside-outline-after>
      <DocAside />
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
</style>
