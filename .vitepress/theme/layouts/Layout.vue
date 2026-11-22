<script setup lang="ts">
import { useEventListener, useIntersectionObserver } from '@vueuse/core'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { computed, defineAsyncComponent, onMounted, provide, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_TOAST_DURATION } from '@/src/constants/preferences.ts'
import { closeSettingsDialog } from '@/src/features/settings/settingsNavigation.ts'
import { isSettingsSectionId } from '@/src/features/settings/settingsOptions.ts'
import SettingsPage from '@/src/features/settings/SettingsPage.vue'
import { useSitePreferences } from '@/src/hooks/useSitePreferences.ts'
import { useToastDiagnostics } from '@/src/hooks/useToastDiagnostics.ts'
import { Banner } from '../components/banner/index.ts'
import { ChunkLoadRecovery } from '../components/chunk-load-recovery/index.ts'
import { DocHeader } from '../components/doc-header/index.ts'
import { HighlightTargetedHeading } from '../components/highlight-targeted-heading/index.ts'
import { PageAlertRegion } from '../components/page-alert-region/index.ts'
import { Sonner } from '../components/ui/sonner/index.ts'
import { useThemeTransition } from '../hooks/useThemeTransition.ts'

import '../styles/main.css'
import '../markdown-ext/demo/demo.css'
import '../markdown-ext/timeline/timeline.css'

const { Layout } = DefaultTheme
const DocAside = defineAsyncComponent(() => import('../components/doc-aside/DocAside.vue'))
const DocReaction = defineAsyncComponent(() => import('../components/doc-reaction/DocReaction.vue'))
const ForumSidebar = defineAsyncComponent(() => import('@/src/forum/components/sidebar/ForumSidebar.vue'))
const SettingsSidebarExtras = defineAsyncComponent(() => import('@/src/features/settings/SettingsSidebarExtras.vue'))
const LoginAlertDialog = defineAsyncComponent(() => import('../components/login/LoginAlertDialog.vue'))
const MediumZoom = defineAsyncComponent(() => import('../components/medium-zoom/MediumZoom.vue'))
const OAuthLoginAlertDialog = defineAsyncComponent(() => import('../components/login/OAuthLoginAlertDialog.vue'))
const ToastDiagnosticsDialog = defineAsyncComponent(() => import('@/src/components/telemetry/ToastDiagnosticsDialog.vue'))
const { diagnostics } = useToastDiagnostics()
const diagnosticsActivated = ref(false)
watch(diagnostics, (value) => {
  if (value)
    diagnosticsActivated.value = true
}, { immediate: true })
const { isDark, frontmatter, page } = useData()
const { t } = useI18n({ useScope: 'global' })
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
        :toast-options="{ closeButtonAriaLabel: t('ui.button.close') }"
      />
    </template>

    <template #doc-after>
      <DocReaction ref="target" />
    </template>

    <template #doc-before>
      <PageAlertRegion class="mb-4" />
      <DocHeader :key="page.relativePath" />
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
      <SettingsPage v-if="showSettingsDialog" dialog-only @close="closeSettingsDialog" />
      <ToastDiagnosticsDialog v-if="diagnosticsActivated" />
      <HighlightTargetedHeading />
      <template v-if="showAuthDialogs">
        <LoginAlertDialog />
        <OAuthLoginAlertDialog />
      </template>
    </template>
  </Layout>
  <MediumZoom />
</template>

<style>
.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}

/* VPContent 默认是块级盒子，弹性链缺了这一环：.Forum 与 .forum-entry 的 flex-grow
   取不到整页高度，非全屏的启动遮罩会缩到内容高，logo 停在页顶而非视口中央。 */
.Layout.Forum .VPContent {
  display: flex;
  flex-direction: column;
}

/* 论坛页二级导航隐藏“回到顶部”，该区域留给移动端创建反馈按钮 */
.Layout.Forum .VPLocalNav .VPLocalNavOutlineDropdown {
  display: none;
}
</style>
