<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed, ref, watch } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumMentionCandidates } from '~/forum/composables/view/useForumMentionCandidates'
import User from './User.vue'

const props = withDefaults(defineProps<{ disabled?: boolean, items?: ForumAPI.User[], groups?: { heading: string, items: ForumAPI.User[] }[], recordCount?: number, showSearch?: boolean, searchTerm?: string, compact?: boolean }>(), { recordCount: 4, showSearch: true, searchTerm: '' })
const emit = defineEmits<{ select: [user: ForumAPI.User] }>()
const isOpen = defineModel<boolean>('open', { default: false })
const { message } = useLocalized()
const search = ref(props.searchTerm)
watch(() => props.searchTerm, value => search.value = value)
const { users, recent, remember } = useForumMentionCandidates(() => props.items ?? [])
const recentMentionFiltered = computed(() => props.items ? [] : recent.value.filter(user => user?.id !== undefined && user?.username).slice(0, props.recordCount))
const OfficialMemberFiltered = computed(() => users.value.filter(user => !recentMentionFiltered.value.some(recent => String(recent.id) === String(user.id))))
const displayGroups = computed(() => (props.groups ?? [
  { heading: message.value.forum.publish.feedbackForm.recentUsed, items: recentMentionFiltered.value },
  { heading: props.items ? message.value.forum.publish.feedbackForm.mentionUser : message.value.forum.publish.feedbackForm.teamMembers, items: OfficialMemberFiltered.value },
]).filter(group => group.items.length > 0))
function selectMention(user: ForumAPI.User): void {
  if (props.disabled)
    return
  remember(user)
  emit('select', user)
  isOpen.value = false
}
</script>

<template>
  <Command :class="{ 'mention-command-compact': compact }">
    <CommandInput v-if="showSearch" v-model="search" :placeholder="message.forum.publish.feedbackForm.searchPeople" />
    <CommandList class="overscroll-contain max-h-64" :class="{ 'mention-panel-compact': compact }">
      <CommandEmpty>{{ message.forum.publish.tagsInput.noResultsFound }}</CommandEmpty>
      <CommandGroup v-for="group in displayGroups" :key="group.heading" :heading="group.heading">
        <CommandItem v-for="item in group.items" :key="item.id" :value="`${item.username} @${item.login}`" @select="selectMention(item)">
          <User size="sm" :name="item.username" :description="`@${item.login}`" :avatar="{ src: item.avatar, icon: 'i-lucide-image' }">
            <template v-if="compact" #avatar>
              <Avatar :src="item.avatar" :alt="item.username" size="sm" />
            </template>
          </User>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</template>

<style scoped>
.mention-command-compact {
  flex: 1;
  min-height: 0;
  height: auto;
  background: transparent;
  border-radius: 0;
}
.mention-command-compact :deep([data-slot='command-input-wrapper']) {
  height: 48px;
  margin: 12px 0 8px;
  padding-inline: 12px;
  gap: 12px;
}
.mention-command-compact :deep([data-slot='command-input']) {
  height: 44px;
  font-size: 16px;
}
.mention-command-compact :deep([data-slot='command-group']) {
  padding: 0;
}
.mention-panel-compact {
  flex: 1;
  min-height: 0;
  max-height: none;
  scrollbar-width: thin;
}
.mention-command-compact :deep([data-slot='command-group'] + [data-slot='command-group']) {
  margin-top: 12px;
}
.mention-command-compact :deep([data-slot='command-group-heading']) {
  padding: 8px 12px;
}
.mention-panel-compact :deep([data-slot='command-item']) {
  min-height: 56px;
  padding: 10px 12px;
  border-radius: 8px;
}
.mention-panel-compact :deep(.group\/user) {
  min-width: 0;
  width: 100%;
  gap: 12px;
}
.mention-panel-compact :deep(.group\/user > div:last-child) {
  min-width: 0;
}
.mention-panel-compact :deep(.group\/user > div:last-child > span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mention-panel-compact :deep([data-forum-user-name]) {
  font-size: 14px;
}
</style>
