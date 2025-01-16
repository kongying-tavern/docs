<template>
  <ul
    v-if="userInfo.info"
    class="grid p-3 md:min-w-[128px] lg:min-w-[450px] lg:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)] c-[var(--vp-c-text-2)] bg-[var(--vp-c-bg-elv)] border border-[var(--vp-c-divider)] shadow-[var(--vp-shadow-3)] opacity-100 border-rd-12px"
  >
    <li class="row-span-4 lg:border-r-2px pr-3 lg:border-[var(--vp-c-divider)]">
      <NavigationMenuLink as-child class="important:shadow-none">
        <a
          class="flex h-full w-full select-none rounded-md from-muted/50 to-muted p-3 no-underline outline-none focus:shadow-md lg:justify-evenly lg:flex-col lg:items-center"
          href="/"
        >
          <UserAvatar size="xl" :src="userInfo.info.avatar" />
          <div class="ml-4 lg:text-align-center lg:ml-0">
            <div class="mt-1 text-xl font-medium color-[var(--vp-c-text-1)]">
              {{ userInfo.info?.username || 'Unknown' }}
            </div>
            <p class="text-sm leading-tight color-[var(--vp-c-text-3)]">
              @{{ userInfo.info?.login || '00000' }}
            </p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>

    <li class="lg:ml-2" v-for="item in list" :key="item.title">
      <NavigationMenuLink as-child>
        <a
          :href="withBase(item.href)"
          class="flex select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div class="text-sm font-medium leading-none">
            <span class="icon-btn mr-2 vertical-mid" :class="item.icon"></span>
            {{ item.title }}
          </div>
        </a>
      </NavigationMenuLink>
    </li>

    <div class="lg:hidden vp-divider h-1.5px my-2"></div>

    <li class="lg:ml-2">
      <NavigationMenuLink as-child>
        <button
          class="inline-block w-full text-align-left select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          @click="logout()"
        >
          <div class="text-sm font-medium leading-none">
            <span class="icon-btn mr-2 vertical-mid i-lucide-log-out"></span>
            {{ theme.forum.auth.logoutMsg }}
          </div>
        </button>
      </NavigationMenuLink>
    </li>
  </ul>
  <ul
    v-else
    class="grid p-3 md:min-w-[128px] w-[300px] c-[var(--vp-c-text-2)] bg-[var(--vp-c-bg-elv)] border border-[var(--vp-c-divider)] shadow-[var(--vp-shadow-3)] opacity-100 border-rd-12px"
  >
    <li>
      <Button class="vp-button w-full mt-2" @click="login({ method: 'Oauth' })">
        {{ theme.forum.auth.loginMsg }}
      </Button>
    </li>
    <li>
      <p class="font-size-3 c-[var(--vp-v-text-3)] text-align-center mt-3">
        <DynamicTextReplacer :data="theme.forum.auth.notGiteeAccountMsg">
          <template #signup>
            <a
              href="https://gitee.com/signup"
              class="vp-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ theme.forum.auth.clickToGiteeSignup }}
            </a>
          </template>
        </DynamicTextReplacer>
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { Button } from '@/components/ui/button'
import { NavigationMenuLink } from '@/components/ui/navigation-menu'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useData, withBase } from 'vitepress'
import UserAvatar from './UserAvatar.vue'
import useLogin from '@/hooks/useLogin'

defineProps<{
  list: { title: string; href: string; icon: string }[]
}>()

const userInfo = useUserInfoStore()

const { theme } = useData()
const { login, logout } = useLogin()
</script>
