<script setup lang="ts">
import Banner from '@/components/Banner.vue'
import DocAside from '@/components/DocAside.vue'
import DocFeedback from '@/components/DocFeedback.vue'
import DocHeader from '@/components/DocHeader.vue'
import DocInfo from '@/components/DocInfo.vue'
import { Notifications } from '@/components/ui'
import HighlightTargetedHeading from '@/components/HighlightTargetedHeading.vue'
import NavBarUserAvatar from '@/components/NavBarUserAvatar.vue'
import { Sonner } from '@/components/ui/sonner'
import mediumZoom from 'medium-zoom'
import { useRouter, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { onMounted } from 'vue'
import { loadFont } from '@/utils'

import '@/styles/vars.css'
import '@/styles/main.css'
import '@/styles/ui.css'
import '@/styles/timeline.css'
import '@/styles/kbd.css'
import '@/styles/animation.css'
import '@/styles/shadcn.css'

const { Layout } = DefaultTheme
const router = useRouter()

const setupMediumZoom = () => {
  mediumZoom('[data-zoomable]', {
    background: 'transparent',
  })
}

onMounted(() => {
  loadFont('zh-cn-full', withBase('/fonts/HYWenHei-85W-zh-full.woff2'))
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
