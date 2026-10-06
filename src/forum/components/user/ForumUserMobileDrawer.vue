<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useRouter } from 'vitepress'
import { computed } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerTitle } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumUserDrawerFollowOrMessage from './ForumUserDrawerFollowOrMessage.vue'

const { user, hideProfileButton } = defineProps<{
  user?: ForumAPI.User | null
  hideProfileButton?: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

const { message } = useLocalized()
const router = useRouter()
const { userHref } = useForumRoute()
const currentUser = useUserInfoStore()

const { isOfficial } = useRuleChecks()
const role = computed(() => (isOfficial(user?.id || 0).value ? 'official' : null))
const isSelf = computed(() => Boolean(
  user?.id
  && String(user.id) === String(currentUser.info?.id),
))
const href = computed(() => userHref(user?.login || ''))

function goToProfilePage() {
  open.value = false
  router.go(href.value)
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent class="max-h-[80dvh] overflow-hidden">
      <div class="p-4 pb-8 overscroll-contain flex flex-1 gap-3 min-h-0 items-start overflow-y-auto">
        <Avatar
          :data-forum-user="user?.login"
          :src="user?.avatar"
          :alt="user?.username"
          class="h-12 w-12"
          img-class="size-full rounded-full object-cover"
        />

        <div class="flex-1 min-w-0">
          <div class="flex gap-2 items-center">
            <DrawerTitle class="text-base text-[var(--vp-c-text-1)] font-bold truncate">
              {{ user?.username || message.forum.labels.unknown }}
            </DrawerTitle>
            <span
              v-if="role"
              class="rounded-full"
            >
              <ForumRoleBadge :type="role" />
            </span>
          </div>

          <DrawerDescription class="text-xs c-[var(--vp-c-text-2)] mt-1 break-words">
            {{ user?.bio || message.forum.labels.lazyPerson }}
          </DrawerDescription>

          <div class="font-size-3.5 c-[--vp-c-text-3] mt-3 flex flex-wrap gap-4">
            <div class="flex gap-2 items-center">
              <i class="i-lucide-calendar-days" />
              <span>{{ user?.createAt?.toLocaleDateString() || message.forum.labels.unknown }}</span>
              <span>{{ message.forum.labels.joinTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <DrawerFooter
        v-if="!isSelf"
        class="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0 shrink-0"
      >
        <div class="flex gap-2">
          <Button
            v-if="!hideProfileButton"
            variant="outline"
            class="border border-[var(--vp-c-divider)] border-solid flex-1"
            :disabled="!user"
            @click="goToProfilePage"
          >
            <span class="i-lucide-user text-sm mr-1" />
            <span>{{ message.forum.labels.goToProfile }}</span>
          </Button>
          <ForumUserDrawerFollowOrMessage
            v-if="user?.login"
            class="flex-1"
            :user="user"
          />
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
