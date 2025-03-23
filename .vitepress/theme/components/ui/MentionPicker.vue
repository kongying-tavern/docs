<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { PopoverContentProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
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
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@vueuse/core'
import { shuffle } from 'lodash-es'
import { computed, ref } from 'vue'

import feedbackRepoMember from '~/_data/feedbackMemberList.json'
import TeamMember from '~/_data/teamMemberList.json'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'], searchTerm?: string, showSearch?: boolean, open?: boolean, items?: ForumAPI.User[], recordCount?: number }>(),
  {
    align: 'start',
    side: 'bottom',
    disableUpdateOnLayoutShift: true,
    open: false,
    recordCount: 4,
    searchTerm: '12',
    showSearch: true,
  },
)

const emit = defineEmits<{
  (e: 'select', user: ForumAPI.User): void
}>()

const isOpen = ref(props.open)

const officialMember = shuffle(props.items ? props.items : [...feedbackRepoMember, ...TeamMember])

const recentMention = useLocalStorage<ForumAPI.User[]>('RECENT_MENTION', [])
const OfficialMemberFiltered = computed(() => officialMember.filter(val => !recentMention.value.map(val => val.id).includes(val.id)))

const recentMentionFiltered = computed(() => {
  return recentMention.value
    .filter(item => item && item.id && item.username)
    .slice(0, props.recordCount)
})

function selectMention(member: ForumAPI.User) {
  if (!member || !member.id || !member.username)
    return

  emit('select', member)

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
          variant="ghost"
          :class="cn('h-8 w-6 border border-[var(--vp-c-gutter)] border-solid bg-transparent', $props.class)"
        >
          <span class="i-custom:mention icon-btn size-4 c-[var(--vp-c-text-2)]" />
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent v-bind="{ ...$props }" class="size-fit p-0">
      <Command class="max-w-[250px] border rounded-lg shadow-md">
        <CommandInput v-if="showSearch" :auto-focus="false" placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup v-if="recentMentionFiltered.length > 0" heading="Recent">
            <CommandItem v-for="item in recentMentionFiltered" :key="item.id" :value="item.username" @select="selectMention(item)">
              <User size="sm" :name="item.username" :description="`@${item.login}`" :avatar="{ src: item.avatar, icon: 'i-lucide-image' }" />
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup v-if="OfficialMemberFiltered.length > 0" heading="Official">
            <CommandItem v-for="item in OfficialMemberFiltered" :key="item.id" :value="item.username" @select="selectMention(item)">
              <User size="sm" :name="item.username" :description="`@${item.login}`" :avatar="{ src: item.avatar, icon: 'i-lucide-image' }" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
::-webkit-scrollbar {
  display: none;
}
</style>
