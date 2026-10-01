<script setup lang="ts">
import type { SettingsNavigationItem, SettingsSectionId } from '~/composables/useSettingsNavigation'
import { useTemplateRef } from 'vue'
import { FluidHoverList } from '@/components/ui/fluid-hover'
import User from '@/components/ui/User.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import useLogin from '~/forum/hooks/useLogin'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import SettingsNavigation from './SettingsNavigation.vue'

withDefaults(defineProps<{
  websiteSections: SettingsNavigationItem[]
  applicationSections: SettingsNavigationItem[]
  activeSection: SettingsSectionId
  hashPrefix?: string
  drilldown?: boolean
  /** 滚动联动区段与滚动容器（见 FluidHoverList） */
  sectionIds?: string[]
  scroller?: string
}>(), {
  drilldown: false,
})

const emit = defineEmits<{
  'select': [section: SettingsSectionId]
  'update:active': [section: string]
}>()

const { message } = useLocalized()
const userInfo = useUserInfoStore()
const { showLoginAlert } = useLogin()
const { userHref } = useForumRoute()
const fluidList = useTemplateRef<InstanceType<typeof FluidHoverList> | null>('fluidList')

defineExpose({
  scrollTo: (section: string, behavior?: ScrollBehavior) => fluidList.value?.scrollTo(section, behavior),
})
</script>

<template>
  <FluidHoverList
    ref="fluidList"
    class="settings-menu"
    :class="{ 'is-drilldown': drilldown }"
    indicator-class="bg-muted"
    active=".settings-navigation-item.active"
    active-indicator-class="bg-muted"
    :section-ids="sectionIds"
    :scroller="scroller"
    @update:active="emit('update:active', $event)"
  >
    <a
      v-if="userInfo.info"
      data-fluid-hover-item
      class="settings-user"
      :href="userHref(userInfo.info.login)"
    >
      <User
        size="sm"
        :name="userInfo.info.username"
        :description="`@${userInfo.info.login}`"
        :avatar="{ src: userInfo.info.avatar, alt: userInfo.info.username }"
        :ui="{
          root: 'min-w-0',
          wrapper: 'min-w-0',
          name: 'block truncate',
          description: 'block truncate',
        }"
      />
    </a>
    <button
      v-else
      data-fluid-hover-item
      type="button"
      class="settings-user settings-user-login"
      @click="showLoginAlert"
    >
      <span class="settings-user-placeholder i-lucide-user-round icon-btn" aria-hidden="true" />
      <span>{{ message.forum.auth.loginMsg }}</span>
    </button>

    <div class="settings-navigation-group">
      <p class="settings-navigation-group-label">
        {{ message.settings.groups.website }}
      </p>
      <SettingsNavigation
        :items="websiteSections"
        :active-section="activeSection"
        :hash-prefix="hashPrefix"
        :drilldown="drilldown"
        :aria-label="message.settings.groups.website"
        @select="emit('select', $event)"
      />
    </div>

    <div v-if="applicationSections.length > 0" class="settings-navigation-group">
      <p class="settings-navigation-group-label">
        {{ message.settings.groups.application }}
      </p>
      <SettingsNavigation
        :items="applicationSections"
        :active-section="activeSection"
        :hash-prefix="hashPrefix"
        :drilldown="drilldown"
        :aria-label="message.settings.groups.application"
        @select="emit('select', $event)"
      />
    </div>

    <slot />
  </FluidHoverList>
</template>

<style scoped>
.settings-menu {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 20px;
}

.settings-user {
  display: flex;
  min-width: 0;
  min-height: 52px;
  align-items: center;
  gap: 10px;
  position: relative;
  border-radius: 9px;
  padding: 8px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.settings-user:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.settings-user-login {
  width: 100%;
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 600;
  text-align: start;
}

.settings-user-placeholder {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 50%;
  padding: 7px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.settings-navigation-group {
  display: grid;
  gap: 6px;
}

.settings-user + .settings-navigation-group,
.settings-navigation-group + .settings-navigation-group {
  padding-block-start: 16px;
  border-block-start: 1px solid var(--vp-c-divider);
}

.settings-navigation-group + .settings-navigation-group {
  margin-block-start: -4px;
}

.settings-navigation-group-label {
  padding-inline: 12px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  font-weight: 600;
  line-height: calc(18px * var(--site-ui-scale));
}

.settings-menu.is-drilldown {
  gap: 16px;
}
</style>
