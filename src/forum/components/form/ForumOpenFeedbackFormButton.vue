<script setup lang="ts">
import type { ButtonVariants } from '@/components/ui/button'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumShortcut } from '~/forum/composables/view/useForumShortcut'
import { rememberLoginIntent } from '~/forum/services/loginIntent'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { preloadForumPublishForm, publishTopic } from '../utils/submitFormUi'
import { FORM_HASH } from './publish-topic-form/form-config'

const { variant = 'default', hideOnMobile = true, label } = defineProps<{
  label?: string
  variant?: ButtonVariants['variant']
  /** 侧栏等紧凑场景默认在移动端隐藏；空态等整页场景需关闭 */
  hideOnMobile?: boolean
}>()

const { frontmatter } = useData()
const { message } = useLocalized()
const userAuth = useUserAuthStore()
const { hasAnyRoles } = useRuleChecks()

const isLoggedIn = computed(() => userAuth.isTokenValid)
const isAdmin = hasAnyRoles('teamMember', 'feedbackMember')

const buttonText = computed(() => {
  if (!isLoggedIn.value)
    return message.value.forum.sidebar.loginToCreate
  return label ?? message.value.forum.publish.title
})

function handleButtonClick() {
  if (isLoggedIn.value) {
    publishTopic()
  }
  else {
    rememberLoginIntent(FORM_HASH)
    location.hash = 'login-alert'
  }
}
useForumShortcut('publish', handleButtonClick, { enabled: () => frontmatter.value.publishTopic ?? true })

// @unocss-include
const selectPublishTopicMenu = computed(() => {
  const baseItems = [
    {
      label: message.value.forum.labels.submitBug,
      icon: 'i-lucide-bug',
      action: () => {
        location.hash = 'BUG'
        publishTopic()
      },
    },
    {
      label: message.value.forum.labels.submitSuggestion,
      icon: 'i-lucide-file-text',
      action: () => {
        location.hash = 'FEAT'
        publishTopic()
      },
    },
  ]

  if (isAdmin.value) {
    baseItems.push({
      label: message.value.forum.publish.type.ann,
      icon: 'i-lucide-megaphone',
      action: () => {
        location.hash = 'ANN'
        publishTopic()
      },
    })
  }

  return baseItems
})
</script>

<template>
  <!-- 用 DropdownMenu 而非 HoverCard：菜单项必须键盘可达（HoverCard 失焦即关，内容永远拿不到焦点） -->
  <DropdownMenu v-if="isLoggedIn && (frontmatter.publishTopic ?? true)">
    <DropdownMenuTrigger as-child>
      <Button
        :variant="variant"
        class="vp-btn" :class="[{ 'max-sm:hidden': hideOnMobile }]"
        @mouseenter="preloadForumPublishForm"
        @focus="preloadForumPublishForm"
      >
        {{ buttonText }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      :side-offset="8"
      class="p-1 flex w-fit"
    >
      <DropdownMenuItem
        v-for="{ label: menuLabel, icon, action } in selectPublishTopicMenu"
        :key="menuLabel"
        class="px-0 py-2 flex-col gap-1 h-fit w-64px justify-center"
        @select="action"
      >
        <span
          class="icon-btn"
          :class="icon"
        />
        {{ menuLabel }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <Button
    v-if="!isLoggedIn && (frontmatter.publishTopic ?? true)"
    :variant="variant"
    class="vp-btn" :class="[{ 'max-sm:hidden': hideOnMobile }]"
    @click="handleButtonClick"
  >
    {{ buttonText }}
  </Button>
</template>
