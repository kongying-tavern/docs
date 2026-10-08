<script setup lang="ts">
import { useEventListener, useIntersectionObserver } from '@vueuse/core'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { computed, defineAsyncComponent, onMounted, provide, ref, shallowRef, useTemplateRef } from 'vue'
import Banner from '@/components/banner/Banner.vue'
import ChunkLoadRecovery from '@/components/ChunkLoadRecovery.vue'
import HighlightTargetedHeading from '@/components/HighlightTargetedHeading.vue'
import PageAlertRegion from '@/components/PageAlertRegion.vue'
import { Sonner } from '@/components/ui/sonner'
import { useLocalized } from '@/hooks/useLocalized'
import { useThemeTransition } from '@/hooks/useThemeTransition'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { DEFAULT_TOAST_DURATION, isSettingsSectionId } from '~/config/settingsOptions'

import '@/styles/main.css'

const { Layout } = DefaultTheme
const PiniaColadaDevtools = import.meta.env.DEV && import.meta.env.VITE_COLADA_DEVTOOLS !== 'false'
  ? defineAsyncComponent(() => import('@pinia/colada-devtools').then(module => module.PiniaColadaDevtools))
  : null
const DocAside = defineAsyncComponent(() => import('@/components/DocAside.vue'))
const DocHeader = defineAsyncComponent(() => import('@/components/DocHeader.vue'))
const DocReaction = defineAsyncComponent(() => import('@/components/DocReaction.vue'))
const ForumSidebar = defineAsyncComponent(() => import('~/forum/components/sidebar/ForumSidebar.vue'))
const SettingsSidebarExtras = defineAsyncComponent(() => import('~/components/settings/SettingsSidebarExtras.vue'))
const SettingsPage = defineAsyncComponent(() => import('~/components/settings/SettingsPage.vue'))
const LoginAlertDialog = defineAsyncComponent(() => import('@/components/LoginAlertDialog.vue'))
const MediumZoom = defineAsyncComponent(() => import('@/components/MediumZoom.vue'))
const OAuthLoginAlertDialog = defineAsyncComponent(() => import('@/components/OAuthLoginAlertDialog.vue'))
const ToastDiagnosticsDialog = defineAsyncComponent(() => import('~/components/telemetry/ToastDiagnosticsDialog.vue'))
const { isDark, frontmatter } = useData()
const { message } = useLocalized()
const { desktopUi, toastDuration, toastPosition } = useSitePreferences()
// Keep the Sonner position key stable; responsive placement is handled by CSS.
const displayedToastDuration = computed(() => desktopUi.value ? toastDuration.value : DEFAULT_TOAST_DURATION)
const { toggleTheme } = useThemeTransition()
const currentHash = ref('')
const showSettingsHash = computed(() => {
  if (currentHash.value === '#settings')
    return true
  const prefix = '#settings/'
  return currentHash.value.startsWith(prefix)
    && isSettingsSectionId(currentHash.value.slice(prefix.length))
})
// 设置弹窗仅论坛页可打开：唯一入口是论坛侧栏账号菜单，其余布局不再响应 #settings hash
const showSettingsDialog = computed(() =>
  frontmatter.value.layout === 'Forum'
  && showSettingsHash.value,
)
// 登录弹窗由 hash 触发，触发点只存在于论坛页与设置页（设置菜单的登录入口），其余布局不挂载
const showAuthDialogs = computed(() =>
  frontmatter.value.layout === 'Forum'
  || frontmatter.value.layout === 'Settings',
)

function syncHash(): void {
  currentHash.value = location.hash
}

onMounted(syncHash)
useEventListener('hashchange', syncHash)

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

provide('toggle-appearance', toggleTheme)
</script>

<template>
  <Layout :class="{ [frontmatter.layout || '']: true, [frontmatter.class || '']: true }">
    <template #layout-top>
      <Banner />
      <ChunkLoadRecovery />
      <Sonner
        :theme="isDark ? 'dark' : 'light'"
        :position="toastPosition"
        :duration="displayedToastDuration"
        :visible-toasts="desktopUi ? 3 : 1"
        :close-button="displayedToastDuration === Number.POSITIVE_INFINITY"
        :toast-options="{ closeButtonAriaLabel: message.ui.button.close }"
      />
    </template>

    <template #doc-after>
      <DocReaction ref="target" />
    </template>

    <template #doc-before>
      <PageAlertRegion class="mb-4" />
      <DocHeader />
    </template>

    <template #aside-outline-after>
      <DocAside
        v-if="showAside"
        :show-reaction="!targetIsVisible"
      />
    </template>

    <template #sidebar-nav-before>
      <ForumSidebar v-if="frontmatter.layout === 'Forum'" />
      <SettingsSidebarExtras v-if="frontmatter.layout === 'Settings'" />
    </template>

    <template #layout-bottom>
      <SettingsPage v-if="showSettingsDialog" dialog-only />
      <ToastDiagnosticsDialog />
      <HighlightTargetedHeading />
      <template v-if="showAuthDialogs">
        <LoginAlertDialog />
        <OAuthLoginAlertDialog />
      </template>
    </template>
  </Layout>
  <MediumZoom />
  <ClientOnly>
    <PiniaColadaDevtools v-if="PiniaColadaDevtools" />
  </ClientOnly>
</template>

<style>
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
