<script lang="ts" setup>
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useData } from 'vitepress'
import { computed, ref } from 'vue'
import LoginAlertDialog from './LoginAlertDialog.vue'
import NavBarUserAvatarDropdownMenu from './NavBarUserAvatarDropdownMenu.vue'
import UserAvatar from './UserAvatar.vue'

const { theme } = useData()

const userInfo = useUserInfoStore()
const open = ref(false)
const el = ref<HTMLElement>()

const list = computed<{ title: string, href: string, icon: string }[]>(() => [
  {
    title: theme.value.forum.user.myFeedback.title,
    href: `/feedback/user/${userInfo.info?.login}`,
    icon: 'i-lucide-message-square-text',
  },
  {
    title: theme.value.forum.user.menu.giteeAccountInfo,
    href: 'https://gitee.com/profile/account_information',
    icon: 'i-lucide-user-round-pen',
  },
])
</script>

<template>
  <ClientOnly>
    <div
      ref="el"
      class="VPFlyout"
      @mouseenter="open = true"
      @focusin="open = true"
      @focusout="open = false"
    >
      <button
        type="button"
        class="button avatar ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-ring"
        aria-haspopup="true"
        :aria-expanded="open"
        @click="open = !open"
      >
        <UserAvatar
          :src="userInfo.info?.avatar"
          :alt="userInfo.info?.username"
          size="sm"
        />
      </button>

      <div class="menu" @mouseout="open = false">
        <NavBarUserAvatarDropdownMenu :list="list" />
      </div>

      <Teleport to="body">
        <LoginAlertDialog />
      </Teleport>
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped>
$avatar: 32px;

.VPFlyout {
  display: flex;
  align-items: center;
  position: relative;
  margin-right: -8px;
}

@media (min-width: 768px) {
  .VPFlyout::before {
    margin: 0 16px;
    width: 1px;
    height: 24px;
    background-color: var(--vp-c-divider);
    content: '';
  }
}

.VPFlyout:hover {
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

.VPFlyout:hover .text {
  color: var(--vp-c-text-2);
}

.VPFlyout:hover .icon {
  fill: var(--vp-c-text-2);
}

.VPFlyout.active .text {
  color: var(--vp-c-brand-1);
}

.VPFlyout.active:hover .text {
  color: var(--vp-c-brand-2);
}

.button[aria-expanded='false'] + .menu {
  opacity: 0;
  visibility: hidden;
  transform: translateY(0);
}

.VPFlyout:hover .menu,
.button[aria-expanded='true'] + .menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.button {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: var(--vp-nav-height);
  color: var(--vp-c-text-1);
  transition: color 0.5s;
}

.avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: fit-content;
  border-radius: 50%;
  background-color: var(--vp-c-gray-soft);
  font-size: 16px;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  padding: 0;
}

.menu {
  position: absolute;
  top: calc(var(--vp-nav-height) / 2 + 20px);
  right: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.25s,
    visibility 0.25s,
    transform 0.25s;
}
</style>
