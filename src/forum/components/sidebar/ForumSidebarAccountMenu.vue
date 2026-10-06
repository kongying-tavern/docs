<script setup lang="ts">
import type { ForumSidebarMenuItem } from './forumSidebarMenu'
import { useMediaQuery } from '@vueuse/core'
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import User from '@/components/ui/User.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumShortcut } from '~/forum/composables/view/useForumShortcut'
import { useIdlePreload } from '~/forum/composables/view/useIdlePreload'
import useLogin from '~/forum/hooks/useLogin'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { rememberSettingsReturnUrl } from '~/services/settingsNavigation'
import ForumSidebarMenuItems from './ForumSidebarMenuItems.vue'
import ForumSidebarResponsiveMenu from './ForumSidebarResponsiveMenu.vue'

const props = defineProps<{
  privacyHref: string
  agreementHref: string
  profileHref: string
}>()

const loadSettings = () => import('~/components/settings/SettingsPage.vue')
const SettingsPage = defineAsyncComponent(loadSettings)

const { message } = useLocalized()
const userInfo = useUserInfoStore()
const { showLoginAlert, logout } = useLogin()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const mobileSettingsOpen = ref(false)
useIdlePreload(loadSettings, () => isMobile.value)
function prepareSettings(): void {
  if (isMobile.value)
    void loadSettings().catch(() => {})
}

function closeForumSidebar(): void {
  if (isMobile.value)
    document.querySelector<HTMLElement>('.VPBackdrop')?.click()
}

async function openSettings(): Promise<void> {
  if (isMobile.value) {
    closeForumSidebar()
    await nextTick()
    mobileSettingsOpen.value = true
    return
  }

  rememberSettingsReturnUrl()
  location.hash = 'settings'
}
useForumShortcut('settings', openSettings)

function closeSettingsDrawer(close: () => void): void {
  mobileSettingsOpen.value = false
  close()
}

watch(isMobile, (mobile) => {
  if (!mobile)
    mobileSettingsOpen.value = false
})

const accountLabel = computed(() => userInfo.info?.username || message.value.forum.auth.loginMsg)

const accountItems = computed<ForumSidebarMenuItem[]>(() => [
  ...(userInfo.info
    ? [
        {
          label: message.value.forum.user.myFeedback.title,
          icon: 'i-lucide-message-square-text',
          href: props.profileHref,
        },
        {
          label: message.value.forum.user.menu.giteeAccountInfo,
          icon: 'i-lucide-user-round-pen',
          href: 'https://gitee.com/profile/account_information',
          external: true,
        },
      ]
    : [
        {
          label: message.value.forum.auth.loginMsg,
          icon: 'i-lucide-log-in',
          action: showLoginAlert,
        },
      ]),
  {
    label: message.value.settings.title,
    icon: 'i-lucide-settings',
    keepOpen: isMobile.value,
    action: openSettings,
  },
  ...(userInfo.info
    ? [
        {
          label: message.value.forum.auth.logoutMsg,
          icon: 'i-lucide-log-out',
          separatorBefore: true,
          danger: true,
          action: logout,
        },
      ]
    : []),
])

const helpItems = computed<ForumSidebarMenuItem[]>(() => [
  {
    label: message.value.forum.sidebar.privacyPolicy,
    icon: 'i-lucide-shield-check',
    href: props.privacyHref,
  },
  {
    label: message.value.forum.sidebar.userAgreement,
    icon: 'i-lucide-file-text',
    href: props.agreementHref,
  },
  {
    label: message.value.forum.sidebar.opensource,
    icon: 'i-lucide-github',
    href: 'https://github.com/kongying-tavern/docs',
    external: true,
  },
  {
    label: message.value.forum.sidebar.feedbackCommunity,
    icon: message.value.forum.aside.contactUs.qrcodeLink.includes('qq.com')
      ? 'i-simple-icons-qq'
      : 'i-simple-icons-discord',
    href: message.value.forum.aside.contactUs.qrcodeLink,
    external: true,
  },
])
</script>

<template>
  <div class="forum-sidebar-account">
    <ForumSidebarResponsiveMenu
      :title="mobileSettingsOpen ? message.settings.title : accountLabel"
      :immersive="mobileSettingsOpen"
      hide-header
      align="start"
      @closed="mobileSettingsOpen = false"
    >
      <template #trigger>
        <button
          type="button"
          class="forum-sidebar-account-trigger"
          :data-feedback-account="userInfo.info ? 'logged-in' : 'logged-out'"
          :data-forum-user="userInfo.info?.login"
          @pointerenter="prepareSettings"
          @focus="prepareSettings"
          @pointerdown="prepareSettings"
          @click="closeForumSidebar"
        >
          <UserAvatar
            :data-forum-user-avatar="userInfo.info?.login || undefined"
            :src="userInfo.info?.avatar"
            :alt="userInfo.info?.username"
            size="xs"
          />
          <span
            :data-forum-user-name="userInfo.info?.login || undefined"
            class="text-left flex-1 min-w-0 truncate"
          >
            {{ accountLabel }}
          </span>
        </button>
      </template>

      <template #default="{ close }">
        <SettingsPage
          v-if="mobileSettingsOpen"
          embedded-mobile
          @leave="mobileSettingsOpen = false"
          @close="closeSettingsDrawer(close)"
        />
        <template v-else>
          <a
            v-if="userInfo.info"
            class="forum-sidebar-profile"
            :href="profileHref"
            :data-forum-user="userInfo.info.login"
            @click="close"
          >
            <User
              class="min-w-0"
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
          <Separator v-if="userInfo.info" class="forum-sidebar-menu-separator" />
          <ForumSidebarMenuItems :items="accountItems" @select="close" />
        </template>
      </template>
    </ForumSidebarResponsiveMenu>

    <ForumSidebarResponsiveMenu :title="message.forum.sidebar.information" align="end">
      <template #trigger>
        <Button
          variant="ghost"
          size="icon"
          class="forum-sidebar-help-trigger"
          :aria-label="message.forum.sidebar.information"
          @click="closeForumSidebar"
        >
          <span class="i-lucide-circle-help icon-btn" data-icon="inline-start" aria-hidden="true" />
        </Button>
      </template>

      <template #default="{ close }">
        <ForumSidebarMenuItems :items="helpItems" @select="close" />
      </template>
    </ForumSidebarResponsiveMenu>
  </div>
</template>

<style scoped>
.forum-sidebar-account {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding: 8px 0 12px;
  background: var(--forum-sidebar-sticky-bg);
  box-shadow: 0 -10px 18px -16px var(--forum-sidebar-sticky-shadow);
}

.forum-sidebar-account::before {
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 28px;
  background: linear-gradient(to top, var(--forum-sidebar-sticky-bg), transparent);
  content: '';
  pointer-events: none;
}

.forum-sidebar-account-trigger {
  display: flex;
  flex: 1;
  min-width: 0;
  height: 40px;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  padding: 4px 8px;
  background: transparent;
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: calc(14px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
  cursor: pointer;
  transition-property: background-color, color;
  transition-duration: 150ms;
}

.forum-sidebar-account-trigger:hover,
.forum-sidebar-account-trigger:focus-visible,
.forum-sidebar-account-trigger[data-state='open'],
.forum-sidebar-help-trigger:hover,
.forum-sidebar-help-trigger:focus-visible,
.forum-sidebar-help-trigger[data-state='open'] {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.forum-sidebar-account-trigger:focus-visible,
.forum-sidebar-help-trigger:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
}

.forum-sidebar-account-trigger:active,
.forum-sidebar-help-trigger:active {
  scale: 0.96;
}

.forum-sidebar-help-trigger {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  transition-property: background-color, color;
  transition-duration: 150ms;
}

.forum-sidebar-help-trigger .icon-btn {
  width: 16px;
  height: 16px;
}

.forum-sidebar-profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--vp-c-text-1);
}

.forum-sidebar-profile:hover,
.forum-sidebar-profile:focus-visible {
  background: var(--vp-c-default-soft);
}

.forum-sidebar-menu-separator {
  margin: 6px 4px;
}
</style>
