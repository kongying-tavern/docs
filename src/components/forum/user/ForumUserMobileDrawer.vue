<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useRouter } from 'vitepress'
import { computed } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
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
    <DrawerContent>
      <div class="p-4 pb-8 flex gap-3 items-start">
        <Avatar
          :data-forum-user="user?.login"
          :src="user?.avatar"
          :alt="user?.username"
          class="h-12 w-12"
          img-class="size-full rounded-full object-cover"
        />

        <div class="flex-1 min-w-0">
          <div class="flex gap-2 items-center">
            <h3 class="text-base text-[var(--vp-c-text-1)] font-bold truncate">
              {{ user?.username || message.forum.labels.unknown }}
            </h3>
            <span
              v-if="role"
              class="rounded-full"
            >
              <ForumRoleBadge :type="role" />
            </span>
          </div>

          <p class="text-xs text-gray-600 mt-1 dark:text-gray-400">
            {{ user?.bio || message.forum.labels.lazyPerson }}
          </p>

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
        class="p-4 pt-0"
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
