<script setup lang="ts">
import type { PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { reactiveOmit, useLocalStorage } from '@vueuse/core'
import { shuffle } from 'lodash-es'
import { computed, watchEffect } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'

import feedbackRepoMember from '~/_data/feedbackMemberList.json'
import TeamMember from '~/_data/teamMemberList.json'
import User from './User.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'], searchTerm?: string, showSearch?: boolean, disabled?: boolean, items?: ForumAPI.User[], recordCount?: number }>(),
  {
    align: 'start',
    side: 'bottom',
    sideOffset: 8,
    collisionPadding: 12,
    recordCount: 4,
    searchTerm: '',
    showSearch: true,
  },
)

const emit = defineEmits<{
  (e: 'select', user: ForumAPI.User): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const { message } = useLocalized()
const contentProps = reactiveOmit(props, 'class', 'searchTerm', 'showSearch', 'disabled', 'items', 'recordCount')

const officialMember = shuffle(props.items ? props.items : [...feedbackRepoMember.data, ...TeamMember.data])

const recentMention = useLocalStorage<ForumAPI.User[]>('RECENT_MENTION', [])

// 立即修复无效的初始值
if (!import.meta.env.SSR && !Array.isArray(recentMention.value)) {
  recentMention.value = []
}

// 验证并自动重置数组类型
watchEffect(() => {
  if (!Array.isArray(recentMention.value)) {
    recentMention.value = []
  }
})
const OfficialMemberFiltered = computed(() => officialMember.filter((val): val is ForumAPI.User => {
  const valAsUser = val as ForumAPI.User
  return valAsUser.id !== undefined && !recentMention.value.map(val => val.id).includes(valAsUser.id)
}))

const recentMentionFiltered = computed(() => {
  return recentMention.value
    .filter(item => item && item.id && item.username)
    .slice(0, props.recordCount)
})

function selectMention(member: ForumAPI.User) {
  if (props.disabled || !member || !member.id || !member.username)
    return

  emit('select', member)
  isOpen.value = false

  // 更新最近提及列表
  const newRecentMention = recentMention.value.filter(item => item && item.id !== member.id)
  newRecentMention.unshift(member)
  recentMention.value = newRecentMention.slice(0, 4)
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :disabled="disabled"
          :aria-label="message.forum.publish.feedbackForm.mentionUser"
          :class="cn(props.class)"
        >
          <span class="i-custom:mention c-[var(--vp-c-text-2)] icon-btn size-4" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent v-bind="{ ...$attrs, ...contentProps }" class="p-0 w-72">
      <Command>
        <CommandInput v-if="showSearch" :placeholder="message.forum.publish.feedbackForm.searchPeople" />
        <CommandList class="overscroll-contain max-h-64">
          <CommandEmpty>{{ message.forum.publish.tagsInput.noResultsFound }}</CommandEmpty>
          <CommandGroup v-if="recentMentionFiltered.length > 0" :heading="message.forum.publish.feedbackForm.recentUsed">
            <CommandItem v-for="item in recentMentionFiltered" :key="item.id" :value="`${item.username} @${item.login}`" @select="selectMention(item)">
              <User size="sm" :name="item.username" :description="`@${item.login}`" :avatar="{ src: item.avatar, icon: 'i-lucide-image' }" />
            </CommandItem>
          </CommandGroup>
          <CommandSeparator v-if="recentMentionFiltered.length && OfficialMemberFiltered.length" />
          <CommandGroup v-if="OfficialMemberFiltered.length > 0" :heading="message.forum.publish.feedbackForm.teamMembers">
            <CommandItem v-for="item in OfficialMemberFiltered" :key="item.id" :value="`${item.username} @${item.login}`" @select="selectMention(item)">
              <User size="sm" :name="item.username" :description="`@${item.login}`" :avatar="{ src: item.avatar, icon: 'i-lucide-image' }" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
