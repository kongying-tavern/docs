<script setup lang="ts">
import { useMediaQuery, useTitle, useUrlSearchParams } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed } from 'vue'
import LocalNav from '@/components/LocalNav.vue'
import LoginAlertDialog from '@/components/LoginAlertDialog.vue'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import ForumPublishTopicForm from '~/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue'
import { publishTopic } from './utils'
import { useRuleChecks } from '~/composables/useRuleChecks'

const open = defineModel<boolean>('open-search-curtain', {
  default: false,
})

const { frontmatter } = useData()
const { message } = useLocalized()
const params = useUrlSearchParams()
const pageTitle = useTitle()
const isDesktop = useMediaQuery('(min-width: 768px)')
const userAuth = useUserAuthStore()
const { hasAnyRoles } = useRuleChecks()

const title = computed(() => frontmatter.value.title || pageTitle.value?.split('|')[0])

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
        location.hash = 'PUBLISH-TOPIC-BUG'
      },
    },
    {
      label: message.value.forum.labels.submitSuggestion,
      icon: 'i-lucide-file-text',
      action: () => {
        location.hash = 'PUBLISH-TOPIC-FEAT'
      },
    },
  ]

  // 为管理员添加发公告选项
  if (isAdmin.value) {
    baseItems.push({
      label: message.value.forum.labels.ann,
      icon: 'i-lucide-megaphone',
      action: () => {
        location.hash = 'PUBLISH-TOPIC-ANN'
      },
    })
  }

  return baseItems
})
</script>

<template>
  <LocalNav :class="{ 'important:bg-[var(--vp-c-bg)] important:border-b-none': open }">
    <div class="mr-4 w-fit flex items-center">
      <h2 class="text-nowrap font-size-18px c-[var(--vp-c-text-1)]">
        {{ title }}
      </h2>
    </div>

    <div class="w-fit flex items-center justify-between md:w-full">
      <Button variant="ghost" class="mr-2 bg-transparent py-0 c-[var(--vp-c-text-2)] important:h-24px" @click="open = !open">
        <span v-if="!open" class="vp-icon DocSearch-Search-Icon size-3" :class="{ 'size-4': !isDesktop }" aria-hidden="true" />
        <span v-else class="i-lucide:x icon-btn size-4" :class="{ 'size-5': !isDesktop }" aria-hidden="true" />
        <span v-if="isDesktop" class="font-size-12px">
          {{ open ? message.ui.button.close : params?.q ? params?.q : message.forum.header.search.placeholder }}
        </span>
      </Button>

      <HoverCard v-if="isLoggedIn">
        <HoverCardTrigger as-child>
          <Button v-if="frontmatter.publishTopic ?? true" variant="default" class="vp-btn max-sm:hidden" @click="() => { open = false; handleButtonClick() }">
            {{ buttonText }}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="end" side="bottom" class="w-fit flex p-2">
          <Button v-for="{ label, icon, action } in selectPublishTopicMenu" :key="label" variant="ghost" class="h-fit w-64px flex flex-col" @click="() => { open = false; action() }">
            <span class="icon-btn" :class="icon" />
            {{ label }}
          </Button>
        </HoverCardContent>
      </HoverCard>

      <!-- 未登录用户的简单按钮 -->
      <Button v-if="!isLoggedIn && (frontmatter.publishTopic ?? true)" variant="default" class="vp-btn max-sm:hidden" @click="() => { open = false; handleButtonClick() }">
        {{ buttonText }}
      </Button>
    </div>
  </LocalNav>
  <Teleport to="body">
    <template v-if="frontmatter.publishTopic ?? true">
      <Button
        variant="outline" size="icon"
        class="fixed bottom-4 right-4 size-[3.5rem] flex items-center justify-center rounded-full md:hidden important:vp-button"
        @click="handleButtonClick()"
      >
        <span class="i-lucide-plus z-9999 inline-block size-[1.75rem] shadow-[var(--vp-shadow-1)]" />
      </Button>
      <ForumPublishTopicForm />
      <LoginAlertDialog />
    </template>
  </Teleport>
</template>
