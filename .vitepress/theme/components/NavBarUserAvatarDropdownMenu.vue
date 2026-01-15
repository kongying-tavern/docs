<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import useLogin from '@/hooks/useLogin'
import { useUserInfoStore } from '@/stores/useUserInfo'
import ForumRoleBadge from '~/components/forum/ui/ForumRoleBadge.vue'
import { useRuleChecks } from '~/composables/useRuleChecks'
import UserAvatar from './UserAvatar.vue'

defineProps<{
  list: { title: string, href: string, icon: string }[]
}>()

const userInfo = useUserInfoStore()

const { hasAnyRoles } = useRuleChecks(userInfo.info?.id)
const { theme } = useData()
const { showOAuthLoginAlert, logout } = useLogin()

const isOfficial = computed(() => hasAnyRoles('blogMember', 'teamMember', 'feedbackMember').value)
</script>

<template>
  <NavigationMenu
    class="bg-[var(--vp-c-bg-elv)]"
    :viewport="false"
  >
    <NavigationMenuList
      v-if="userInfo.info"
      class="c-[var(--vp-c-text-2)] font---vp-font-family-subtitle p-3 border border-(--vp-c-divider rd-12px) opacity-100 grid shadow---vp-shadow-3 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)] lg:min-w-[450px] md:min-w-[128px]"
    >
      <NavigationMenuItem class="pr-0 row-span-4 lg:border-r-2px lg:border-[var(--vp-c-divider)] lg:border-r-solid">
        <NavigationMenuLink
          as-child
          class="pr-0 flex items-center justify-center important:shadow-none"
        >
          <a
            class="p-3 outline-none rounded-md no-underline flex h-full w-full select-none from-muted/50 to-muted lg:flex-col focus:shadow-md lg:items-center lg:justify-evenly"
            href="/"
          >
            <UserAvatar
              size="xl"
              :src="userInfo.info.avatar"
            />
            <div class="ml-4 lg:ml-0 lg:text-align-center">
              <div class="text-xl color-[var(--vp-c-text-1)] font-medium mt-1">
                {{ userInfo.info?.username || 'Unknown' }}
                <ForumRoleBadge
                  v-if="isOfficial"
                  type="official"
                />
              </div>
              <p class="text-sm color-[var(--vp-c-text-3)] leading-tight font---vp-font-family-content">
                @{{ userInfo.info?.login || '00000' }}
              </p>
            </div>
          </a>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem
        v-for="item in list"
        :key="item.title"
        class="lg:ml-2"
      >
        <NavigationMenuLink as-child>
          <a
            :href="withBase(item.href)"
            class="leading-none p-3 outline-none rounded-md no-underline flex select-none transition-colors space-y-1 focus:text-accent-foreground hover:text-accent-foreground focus:bg-accent hover:bg-accent"
          >
            <div class="text-sm leading-none font-medium">
              <span
                class="mr-2 icon-btn vertical-mid"
                :class="item.icon"
              />
              {{ item.title }}
            </div>
          </a>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <Separator class="my-2 h-1.5px lg:hidden" />

      <NavigationMenuItem class="lg:ml-2">
        <NavigationMenuLink as-child>
          <button
            class="leading-none p-3 text-align-left outline-none rounded-md no-underline w-full inline-block select-none transition-colors space-y-1 focus:text-accent-foreground hover:text-accent-foreground focus:bg-accent hover:bg-accent"
            @click="logout()"
          >
            <div class="text-sm leading-none font-medium">
              <span class="i-lucide-log-out mr-2 icon-btn vertical-mid" />
              {{ theme.forum.auth.logoutMsg }}
            </div>
          </button>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
    <NavigationMenuList
      v-else
      class="bg---vp-c-bg-elv c-[var(--vp-c-text-2)] p-3 border border-(--vp-c-divider rd-12px) opacity-100 grid w-[300px] shadow-(--vp-shadow-3) md:min-w-[128px]"
    >
      <NavigationMenuItem>
        <NavigationMenuLink
          class="vp-button mt-2 text-center w-full cursor-pointer"
          @click="showOAuthLoginAlert"
        >
          {{ theme.forum.auth.loginMsg }}
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <p class="font-size-3 c-[var(--vp-v-text-3)] mt-3 text-center">
          <DynamicTextReplacer :data="theme.forum.auth.notGiteeAccountMsg">
            <template #signup>
              <a
                href="https://gitee.com/signup"
                class="vp-link font---vp-font-family-content"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ theme.forum.auth.clickToGiteeSignup }}
              </a>
            </template>
          </DynamicTextReplacer>
        </p>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
