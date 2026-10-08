<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import MentionPickerPanel from '@/components/ui/MentionPickerPanel.vue'
import { useLocalized } from '@/hooks/useLocalized'

const props = defineProps<{
  items: readonly ForumAPI.User[]
  selectedIndex: number
  selectedUserIds: readonly string[]
  query: string
  groups: { participants: ForumAPI.User[], recent: ForumAPI.User[], team: ForumAPI.User[] }
  disabled?: boolean
}>()
const emit = defineEmits<{ 'select': [user: ForumAPI.User], 'drawer-open': [open: boolean] }>()
const allOpen = ref(false)
const recommendations = useTemplateRef<HTMLElement>('recommendations')
const scrollable = ref(false)
function measureRecommendations(): void {
  const el = recommendations.value
  scrollable.value = !!el && el.scrollWidth > el.clientWidth + 1
}
useResizeObserver(recommendations, measureRecommendations)
watch(() => props.items, () => nextTick(measureRecommendations), { flush: 'post' })
const { message } = useLocalized()
const groupedItems = computed(() => [
  { heading: message.value.forum.comment.topicParticipants, items: props.groups.participants },
  { heading: message.value.forum.publish.feedbackForm.recentUsed, items: props.groups.recent },
  { heading: message.value.forum.publish.feedbackForm.teamMembers, items: props.groups.team },
])
function select(user: ForumAPI.User): void {
  allOpen.value = false
  emit('select', user)
}
function setAllOpen(value: boolean): void {
  allOpen.value = value
  emit('drawer-open', value)
}
</script>

<template>
  <div ref="recommendations" class="mention-recommendations scroll-fade-4" :class="{ 'scroll-fade-x': scrollable }" role="group" :aria-label="message.forum.publish.feedbackForm.mentionUser">
    <Button v-for="(user, index) in items" :key="user.id" type="button" variant="ghost" class="mention-person" :class="{ 'is-selected': selectedUserIds.includes(String(user.id)) }" :aria-pressed="selectedUserIds.includes(String(user.id))" :disabled="disabled" :aria-label="`${user.username} @${user.login}`" :aria-current="index === selectedIndex ? 'true' : undefined" @pointerdown.prevent @click="select(user)">
      <span class="mention-avatar">
        <Avatar :src="user.avatar" :alt="user.username" size="sm" />
        <span v-if="selectedUserIds.includes(String(user.id))" class="mention-selected-mark" aria-hidden="true"><span class="i-lucide:check size-2.5" /></span>
      </span>
      <span class="truncate">{{ user.username }}</span>
    </Button>
    <span v-if="!items.length" class="text-xs text-muted-foreground self-center">{{ message.forum.publish.tagsInput.noResultsFound }}</span>
    <Button type="button" variant="ghost" class="mention-person" :disabled="disabled" :aria-label="message.forum.comment.viewAllMentions" @pointerdown.prevent @click="setAllOpen(true)">
      <span class="flex size-8 items-center justify-center" aria-hidden="true"><span class="i-lucide:ellipsis size-4" /></span>
      <span>{{ message.forum.comment.viewAllMentions }}</span>
    </Button>
  </div>
  <Drawer :open="allOpen" :should-scale-background="false" @update:open="setAllOpen">
    <DrawerContent class="mention-all-drawer" :aria-describedby="undefined" @close-auto-focus="$event.preventDefault(); emit('drawer-open', false)">
      <DrawerTitle class="sr-only">
        {{ message.forum.publish.feedbackForm.mentionUser }}
      </DrawerTitle>
      <MentionPickerPanel :open="allOpen" compact :groups="groupedItems" :search-term="query" :disabled="disabled" @select="select" />
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.mention-recommendations {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  background: transparent;
  padding-block: 4px;
  @apply scrollbar-none;
}
.mention-person {
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  flex-basis: calc((100% - 16px) / 4.5);
  min-width: 0;
  height: auto;
  padding: 4px;
}
.mention-avatar {
  position: relative;
  display: inline-flex;
}
.mention-person.is-selected {
  color: oklch(var(--primary-button));
}
.mention-selected-mark {
  position: absolute;
  right: -3px;
  bottom: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: oklch(var(--primary-button));
  color: oklch(var(--primary-button-foreground));
  box-shadow: 0 0 0 2px var(--vp-c-bg);
}
.mention-person > span:last-child {
  max-width: 100%;
  font-size: 11px;
}
:global(.mention-all-drawer[data-slot='drawer-content']) {
  font-family: var(--vp-font-family-base);
  height: min(480px, 70dvh);
  padding: 12px 16px max(16px, env(safe-area-inset-bottom));
}
.mention-all-drawer :deep(button),
.mention-all-drawer :deep(input),
.mention-all-drawer :deep([data-slot='command-item']) {
  font-family: inherit;
}
.mention-all-drawer :deep([data-slot='command-list']) {
  max-height: none;
  flex: 1;
}
</style>
