<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AsyncContentLoading from '~/components/AsyncContentLoading.vue'
import { useSettingsNavigation } from '~/composables/useSettingsNavigation'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { isBrowserTranslationSupported } from '~/forum/services/browserTranslation'

defineOptions({ inheritAttrs: false })
defineProps<{ embeddedMobile?: boolean, error?: Error }>()
const emit = defineEmits<{ close: [], retry: [] }>()
const { t } = useI18n({ useScope: 'global' })
const { desktopUi } = useSitePreferences()
const [MenuSkeleton, UseMenuSkeleton] = createReusableTemplate()
const { hasAnyPermissions } = useRuleChecks()
const { sections } = useSettingsNavigation(ref(typeof window !== 'undefined' && isBrowserTranslationSupported()), {
  labelManagementEnabled: hasAnyPermissions('manage_feedback'),
  updateHash: false,
})
const menuGroups = computed(() => ['website', 'application'].map(group => sections.value.filter(section => section.group === group)).filter(group => group.length))
</script>

<template>
  <MenuSkeleton>
    <div class="flex flex-col gap-5 max-mobile:gap-4" aria-hidden="true">
      <div class="p-2 flex gap-2.5 h-13 items-center">
        <Skeleton class="rounded-full shrink-0 size-8" />
        <Skeleton class="h-4 w-24" />
      </div>
      <div v-for="(group, index) in menuGroups" :key="index" class="settings-skeleton-menu-group pt-4 border-t border-[var(--vp-c-divider)] flex flex-col gap-1.5">
        <Skeleton class="ml-3 h-4.5 w-16" />
        <div class="flex flex-col gap-1">
          <div v-for="item in group" :key="item.id" class="px-3 flex gap-2.75 h-11 items-center max-mobile:h-12">
            <Skeleton class="rounded-sm shrink-0 size-4.5" />
            <Skeleton class="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  </MenuSkeleton>
  <template v-if="desktopUi && !embeddedMobile">
    <aside class="settings-dialog-sidebar settings-skeleton-sidebar" aria-hidden="true">
      <UseMenuSkeleton />
    </aside>
    <section class="settings-dialog-main">
      <header class="settings-dialog-panel-header">
        <h2 class="settings-dialog-title">
          {{ t('settings.title') }}
        </h2>
      </header>
      <div class="settings-dialog-content">
        <AsyncContentLoading :error="error" :padded="false" @retry="emit('retry')" />
      </div>
    </section>
  </template>
  <div v-else class="settings-mobile-skeleton">
    <header class="settings-skeleton-header">
      <div class="flex gap-1 min-h-11 items-center">
        <Button variant="ghost" size="icon" class="rounded-lg shrink-0 size-11" :aria-label="t('settings.close')" @click="emit('close')">
          <span class="i-lucide-x icon-btn" aria-hidden="true" />
        </Button>
        <h2 class="text-xl text-[var(--vp-c-text-1)] tracking-tight font-[var(--vp-font-family-title)] flex-1 min-w-0">
          {{ t('settings.title') }}
        </h2>
        <span class="shrink-0 size-11" aria-hidden="true" />
      </div>
    </header>
    <div class="settings-skeleton-body" data-async-loading aria-busy="true">
      <span class="sr-only" role="status">{{ t('ui.button.loading') }}</span>
      <AsyncContentLoading v-if="error" :error="error" :padded="false" @retry="emit('retry')" />
      <UseMenuSkeleton v-else />
    </div>
  </div>
</template>

<style scoped>
.settings-skeleton-menu-group + .settings-skeleton-menu-group {
  margin-block-start: -4px;
}

.settings-mobile-skeleton {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
}

.settings-skeleton-header {
  flex: 0 0 auto;
  border-block-end: 1px solid var(--vp-c-divider);
  padding: 12px 16px;
}

.settings-skeleton-body {
  min-height: 0;
  overflow-y: auto;
  padding: 16px 16px max(24px, env(safe-area-inset-bottom));
}

@media (max-width: 479px) {
  .settings-skeleton-header,
  .settings-skeleton-body {
    padding-inline: 12px;
  }
}
</style>
