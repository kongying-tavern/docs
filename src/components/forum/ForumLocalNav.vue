<script setup lang="ts">
import LocalNav from '@/components/LocalNav.vue'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useLocalized } from '@/hooks/useLocalized'
import { useMediaQuery, useTitle, useUrlSearchParams } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed } from 'vue'
import ForumPublishTopicForm from '~/components/forum/publish-topic-form/ForumPublishTopicForm.vue'
import { publishTopic } from './utils'

const open = defineModel<boolean>('open-search-curtain', {
  default: false,
})

const { frontmatter } = useData()
const { message } = useLocalized()
const params = useUrlSearchParams()
const pageTitle = useTitle()
const isDesktop = useMediaQuery('(min-width: 768px)')

const title = computed(() => frontmatter.value.title || pageTitle.value?.split('|')[0])

// @unocss-includes
const selectPublishTopicMenu = computed(() => {
  return [
    {
      label: '提 BUG',
      icon: 'i-lucide-bug',
      action: () => {
        location.hash = 'PUBLISH-TOPIC-BUG'
      },
    },
    {
      label: '提建议',
      icon: 'i-lucide-file-text',
      action: () => {
        location.hash = 'PUBLISH-TOPIC-FEAT'
      },
    },
  ]
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

      <HoverCard>
        <HoverCardTrigger as-child>
          <Button v-if="frontmatter.publishTopic ?? true" variant="default" class="vp-btn max-sm:hidden" @click="() => { open = false; publishTopic() }">
            {{ message.forum.publish.title }}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="end" side="bottom" class="w-fit flex p-2">
          <Button v-for="{ label, icon, action } in selectPublishTopicMenu" :key="label" variant="ghost" class="h-fit w-64px flex flex-col" @click="() => { open = false; action() }">
            <span class="icon-btn" :class="icon" />
            {{ label }}
          </Button>
        </HoverCardContent>
      </HoverCard>
    </div>
  </LocalNav>
  <Teleport to="body">
    <template v-if="frontmatter.publishTopic ?? true">
      <Button
        variant="outline" size="icon"
        class="fixed bottom-4 right-4 size-[3.5rem] flex items-center justify-center rounded-full md:hidden important:vp-button"
        @click="publishTopic()"
      >
        <span class="i-lucide-plus z-9999 inline-block size-[1.75rem] shadow-[var(--vp-shadow-1)]" />
      </Button>
      <ForumPublishTopicForm />
    </template>
  </Teleport>
</template>
