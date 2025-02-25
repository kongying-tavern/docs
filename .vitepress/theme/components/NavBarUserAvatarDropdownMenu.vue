<script setup lang="ts">
import { Button } from '@/components/ui/button'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { NavigationMenuLink } from '@/components/ui/navigation-menu'
import useLogin from '@/hooks/useLogin'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useData, withBase } from 'vitepress'
import UserAvatar from './UserAvatar.vue'

defineProps<{
  list: { title: string, href: string, icon: string }[]
}>()

const userInfo = useUserInfoStore()

const { theme } = useData()
const { login, logout } = useLogin()
</script>

<template>
  <ul
    v-if="userInfo.info"
    class="grid border border-[var(--vp-c-divider)] border-rd-12px bg-[var(--vp-c-bg-elv)] p-3 c-[var(--vp-c-text-2)] font-[var(--vp-font-family-subtitle)] opacity-100 shadow-[var(--vp-shadow-3)] lg:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)] lg:min-w-[450px] md:min-w-[128px]"
  >
    <li class="row-span-4 pr-3 lg:border-r-2px lg:border-[var(--vp-c-divider)]">
      <NavigationMenuLink as-child class="important:shadow-none">
        <a
          class="h-full w-full flex select-none rounded-md from-muted/50 to-muted p-3 no-underline outline-none lg:flex-col lg:items-center lg:justify-evenly focus:shadow-md"
          href="/"
        >
          <UserAvatar size="xl" :src="userInfo.info.avatar" />
          <div class="ml-4 lg:ml-0 lg:text-align-center">
            <div class="mt-1 text-xl color-[var(--vp-c-text-1)] font-medium">
              {{ userInfo.info?.username || 'Unknown' }}
            </div>
            <p
              class="text-sm color-[var(--vp-c-text-3)] leading-tight font-[var(--vp-font-family-content)]"
            >
              @{{ userInfo.info?.login || '00000' }}
            </p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>

    <li v-for="item in list" :key="item.title" class="lg:ml-2">
      <NavigationMenuLink as-child>
        <a
          :href="withBase(item.href)"
          class="flex select-none rounded-md p-3 leading-none no-underline outline-none transition-colors space-y-1 focus:bg-accent hover:bg-accent focus:text-accent-foreground hover:text-accent-foreground"
        >
          <div class="text-sm font-medium leading-none">
            <span class="mr-2 icon-btn vertical-mid" :class="item.icon" />
            {{ item.title }}
          </div>
        </a>
      </NavigationMenuLink>
    </li>

    <div class="my-2 vp-divider h-1.5px lg:hidden" />

    <li class="lg:ml-2">
      <NavigationMenuLink as-child>
        <button
          class="inline-block w-full select-none rounded-md p-3 text-align-left leading-none no-underline outline-none transition-colors space-y-1 focus:bg-accent hover:bg-accent focus:text-accent-foreground hover:text-accent-foreground"
          @click="logout()"
        >
          <div class="text-sm font-medium leading-none">
            <span class="i-lucide-log-out mr-2 icon-btn vertical-mid" />
            {{ theme.forum.auth.logoutMsg }}
          </div>
        </button>
      </NavigationMenuLink>
    </li>
  </ul>
  <ul
    v-else
    class="grid w-[300px] border border-[var(--vp-c-divider)] border-rd-12px bg-[var(--vp-c-bg-elv)] p-3 c-[var(--vp-c-text-2)] opacity-100 shadow-[var(--vp-shadow-3)] md:min-w-[128px]"
  >
    <li>
      <Button class="mt-2 w-full vp-button" @click="login({ method: 'Oauth' })">
        {{ theme.forum.auth.loginMsg }}
      </Button>
    </li>
    <li>
      <p class="mt-3 text-align-center font-size-3 c-[var(--vp-v-text-3)]">
        <DynamicTextReplacer :data="theme.forum.auth.notGiteeAccountMsg">
          <template #signup>
            <a
              href="https://gitee.com/signup"
              class="font-[var(--vp-font-family-content)] vp-link"
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
