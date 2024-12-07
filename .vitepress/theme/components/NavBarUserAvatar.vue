<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import VPMenu from 'vitepress/dist/client/theme-default/components/VPMenu.vue'
import { oauth } from '../apis/forum/gitee'
import UserAvatar from './UserAvatar.vue'
import { useUserAuthStore, useUserInfoStore } from '../stores/index'
import LoginAlertDialog from './LoginAlertDialog.vue'
import { useData } from 'vitepress'
import { toast } from 'vue-sonner'

const { theme } = useData()
const open = ref(false)
const el = ref<HTMLElement>()
const userAuthStore = useUserAuthStore()
const userInfoStore = useUserInfoStore()
const notLogedIn = [
  {
    text: theme.value.forum.auth.loginMsg,
    link: '#login',
  },
]
const loggedIn = [
  {
    text: '我的反馈',
    link: '/feedback/user',
  },
  {
    text: theme.value.forum.auth.logoutMsg,
    link: '#logout',
  },
]

const code = ref()
const list = computed(() => [
  ...(userAuthStore.isTokenValid ? loggedIn : notLogedIn),
])

const login = async () => {
  if (code.value) {
    userAuthStore.setAuth(await oauth.getToken(code.value))
    userInfoStore.refreshUserInfo()
    toast.success(theme.value.forum.auth.loginSuccess)
  } else {
    location.hash = 'login-alert'
  }
}

const logout = () => {
  userAuthStore.clearAuth()
  userInfoStore.clearUserInfo()
}

const handleAuth = () => {
  const hash = window.location.hash.slice(1)

  if (!list.value.some((item) => item.link.replace('#', '') === hash)) return

  history.replaceState(null, '', window.location.href.split('#')[0])

  if (hash === 'login' && !userAuthStore.isTokenValid) login()
  if (hash === 'logout' && userAuthStore.isTokenValid) logout()
}

const init = () => {
  if (!userAuthStore.isTokenValid) {
    code.value = location.search.match(/code=[^&]+/)?.[0]?.split('=')?.[1]
    if (code.value) return login()
    return
  }

  userAuthStore.ensureTokenRefreshMission()
}

init()

onMounted(() => {
  handleAuth()
  window.addEventListener('hashchange', handleAuth)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleAuth)
})
</script>

<template>
  <div
    class="VPFlyout"
    ref="el"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <button
      type="button"
      class="button avatar"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UserAvatar
        :src="userInfoStore.info?.avatar"
        :alt="userInfoStore.info?.username"
        size="sm"
      />
    </button>

    <div class="menu">
      <VPMenu :items="list"> </VPMenu>
    </div>

    <Teleport to="body">
      <LoginAlertDialog></LoginAlertDialog>
    </Teleport>
  </div>
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
