<script setup lang="ts">
import { useMediaQuery, useTitle, useUrlSearchParams } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed } from 'vue'
import LocalNav from '@/components/LocalNav.vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import ForumPublishTopicForm from '~/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue'
import OpenFeedbackFormButton from './OpenFeedbackFormButton.vue'
import { publishTopic } from './utils'

const open = defineModel<boolean>('open-search-curtain', {
  default: false,
})

const { frontmatter } = useData()
const { message } = useLocalized()
const params = useUrlSearchParams()
const pageTitle = useTitle()
const isDesktop = useMediaQuery('(min-width: 768px)')
const userAuth = useUserAuthStore()

const title = computed(() => frontmatter.value.title || pageTitle.value?.split('|')[0])

const isLoggedIn = computed(() => userAuth.isTokenValid)

function handleButtonClick() {
  if (isLoggedIn.value) {
    publishTopic()
  }
  else {
    location.hash = 'login-alert'
  }
}
</script>

<template>
  <LocalNav :class="{ 'important:bg-[var(--vp-c-bg)] important:border-b-none': open }">
    <div class="mr-4 flex w-fit items-center">
      <h2 class="font-size-18px c-[var(--vp-c-text-1)] text-nowrap">
        {{ title }}
      </h2>
    </div>

    <div class="flex w-fit items-center justify-between md:w-full">
      <Button
        variant="ghost"
        class="c-[var(--vp-c-text-2)] mr-2 py-0 bg-transparent important:h-24px"
        @click="open = !open"
      >
        <span
          v-if="!open"
          class="vp-icon DocSearch-Search-Icon size-3"
          :class="{ 'size-4': !isDesktop }"
          aria-hidden="true"
        />
        <span
          v-else
          class="i-lucide:x icon-btn size-4"
          :class="{ 'size-5': !isDesktop }"
          aria-hidden="true"
        />
        <span
          v-if="isDesktop"
          class="font-size-12px"
        >
          {{ open ? message.ui.button.close : params?.q ? params?.q : message.forum.header.search.placeholder }}
        </span>
      </Button>

      <OpenFeedbackFormButton />
    </div>
  </LocalNav>
  <Teleport to="body">
    <template v-if="frontmatter.publishTopic ?? true">
      <Button
        variant="outline"
        size="icon"
        class="rounded-full flex size-[3.5rem] items-center bottom-4 right-4 justify-center fixed important:vp-button md:hidden"
        @click="handleButtonClick()"
      >
        <span class="i-lucide-plus size-[1.75rem] inline-block shadow-[var(--vp-shadow-1)] z-9999" />
      </Button>
      <ForumPublishTopicForm />
    </template>
  </Teleport>
</template>
