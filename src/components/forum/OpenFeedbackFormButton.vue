<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { publishTopic } from './utils'

const open = defineModel<boolean>('open-search-curtain', {
  default: false,
})

const { frontmatter } = useData()
const { message } = useLocalized()
const userAuth = useUserAuthStore()
const { hasAnyRoles } = useRuleChecks()

const isLoggedIn = computed(() => userAuth.isTokenValid)
const isAdmin = hasAnyRoles('teamMember', 'feedbackMember')

const buttonText = computed(() => {
  return isLoggedIn.value ? message.value.forum.publish.title : '登录反馈'
})

// 按钮点击处理
function handleButtonClick() {
  if (isLoggedIn.value) {
    publishTopic()
  }
  else {
    location.hash = 'login-alert'
  }
}

// @unocss-includes
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

  // 为管理员添加发公告选项
  if (isAdmin.value) {
    baseItems.push({
      label: '发公告',
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
  <HoverCard v-if="isLoggedIn">
    <HoverCardTrigger as-child>
      <Button
        v-if="frontmatter.publishTopic ?? true"
        variant="default"
        class="vp-btn max-sm:hidden"
        @click="() => { open = false; handleButtonClick() }"
      >
        {{ buttonText }}
      </Button>
    </HoverCardTrigger>
    <HoverCardContent
      align="end"
      side="bottom"
      class="p-2 flex w-fit"
    >
      <Button
        v-for="{ label, icon, action } in selectPublishTopicMenu"
        :key="label"
        variant="ghost"
        class="flex flex-col h-fit w-64px"
        @click="() => { open = false; action() }"
      >
        <span
          class="icon-btn"
          :class="icon"
        />
        {{ label }}
      </Button>
    </HoverCardContent>
  </HoverCard>

  <Button
    v-if="!isLoggedIn && (frontmatter.publishTopic ?? true)"
    variant="default"
    class="vp-btn max-sm:hidden"
    @click="() => { open = false; handleButtonClick() }"
  >
    {{ buttonText }}
  </Button>
</template>
