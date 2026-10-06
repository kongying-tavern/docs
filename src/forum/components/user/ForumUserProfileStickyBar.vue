<script setup lang="ts">
import type { FORUM } from '../types'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumProfileTabs from './ForumProfileTabs.vue'

const { username, avatar, login, role, isAuthorizedUser, visible, tabs } = defineProps<{
  username: string
  avatar?: string
  login?: string
  role?: 'official' | null
  isAuthorizedUser: boolean
  /** 折叠条是否吸附显示；隐藏时 inert 屏蔽焦点与读屏 */
  visible: boolean
  tabs: FORUM.ProfileTab[]
}>()

const emit = defineEmits<{ message: [] }>()
const activeTab = defineModel<'all' | 'closed' | 'archived'>('activeTab', { default: 'all' })
const { message } = useLocalized()
</script>

<template>
  <div class="user-sticky-bar" :data-visible="visible" :inert="!visible">
    <div class="user-sticky-bar-inner">
      <div class="flex gap-3 h-12 min-w-0 items-center">
        <Avatar
          :src="avatar"
          :alt="username"
          class="shrink-0 h-8 w-8 max-sm:h-6 max-sm:w-6"
          img-class="size-full rounded-full object-cover"
        />
        <span class="text-sm text-[var(--vp-c-text-1)] font-semibold truncate">
          {{ username || message.forum.labels.unknown }}
        </span>
        <div v-if="role" class="shrink-0 hidden sm:block">
          <ForumRoleBadge :type="role" />
        </div>

        <ForumProfileTabs
          v-model:active-tab="activeTab"
          layout="inline"
          :tabs="tabs"
          v-bind="{ ariaLabel: message.forum.header.navigation.groups.status }"
        />

        <div class="ml-auto gap-2 hidden sm:flex">
          <Button
            v-if="!isAuthorizedUser"
            variant="outline"
            size="icon"
            class="border border-[var(--vp-c-divider)] border-solid"
            :aria-label="message.forum.labels.privateMessage"
            @click="emit('message')"
          >
            <span class="i-lucide-mail text-base" aria-hidden="true" />
          </Button>
          <span v-if="!isAuthorizedUser && login" class="border border-[var(--vp-c-divider)] rounded-md border-solid">
            <slot name="follow" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-sticky-bar {
  position: fixed;
  inset-inline: 0;
  top: calc(var(--vp-nav-height, 64px) + var(--vp-layout-top-height, 0px));
  /* 压在站点导航之下，避免盖住导航自身的弹层 */
  z-index: calc(var(--vp-z-index-nav, 30) - 1);
  border-bottom: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transform: translateY(-110%);
  opacity: 0;
  pointer-events: none;
  transition:
    transform 300ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 200ms cubic-bezier(0.33, 1, 0.68, 1);
}

.user-sticky-bar[data-visible='true'] {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.user-sticky-bar-inner {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 1440px) {
  .user-sticky-bar-inner {
    width: min(var(--forum-container-max-width), 100%);
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .user-sticky-bar {
    transform: none;
    transition: opacity 120ms ease;
  }
}
</style>
