<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { computed, defineAsyncComponent, nextTick, provide, shallowRef, useTemplateRef } from 'vue'
import Banner from '@/components/banner/Banner.vue'
import HighlightTargetedHeading from '@/components/HighlightTargetedHeading.vue'
import Notifications from '@/components/ui/Notifications.vue'
import { Sonner } from '@/components/ui/sonner'
import { enableTransitions } from '@/shared'

import '@/styles/main.css'

const { Layout } = DefaultTheme
const DocAside = defineAsyncComponent(() => import('@/components/DocAside.vue'))
const DocHeader = defineAsyncComponent(() => import('@/components/DocHeader.vue'))
const DocReaction = defineAsyncComponent(() => import('@/components/DocReaction.vue'))
const ForumSidebar = defineAsyncComponent(() => import('~/components/forum/sidebar/ForumSidebar.vue'))
const LoginAlertDialog = defineAsyncComponent(() => import('@/components/LoginAlertDialog.vue'))
const MediumZoom = defineAsyncComponent(() => import('@/components/MediumZoom.vue'))
const NavBarUserAvatar = defineAsyncComponent(() => import('@/components/NavBarUserAvatar.vue'))
const OAuthLoginAlertDialog = defineAsyncComponent(() => import('@/components/OAuthLoginAlertDialog.vue'))
const { isDark, frontmatter } = useData()

const target = useTemplateRef<HTMLDivElement>('target')
const targetIsVisible = shallowRef(false)
const showAside = computed(
  () =>
    frontmatter.value.docAside !== false
    && frontmatter.value.aside === true
    && frontmatter.value.outline !== false,
)

useIntersectionObserver(target, ([entry]) => {
  targetIsVisible.value = entry?.isIntersecting || false
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
      <DocAside
        v-if="showAside"
        :show-reaction="!targetIsVisible"
      />
    </template>

    <template #nav-bar-content-after>
      <NavBarUserAvatar />
    </template>

    <template #sidebar-nav-before>
      <ForumSidebar v-if="frontmatter.layout === 'Forum'" />
    </template>

    <template #layout-bottom>
      <HighlightTargetedHeading />
      <Notifications />
      <LoginAlertDialog />
      <OAuthLoginAlertDialog />
    </template>
  </Layout>
  <MediumZoom />
</template>

<style>
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

/* 论坛页二级导航隐藏“回到顶部”，该区域留给移动端创建反馈按钮 */
.Layout.Forum .VPLocalNav .VPLocalNavOutlineDropdown {
  display: none;
}
</style>
