<script setup lang="ts">
import type { ForumSidebarMenuItem } from './forumSidebarMenu'
import { Separator } from '@/components/ui/separator'

defineProps<{
  items: ForumSidebarMenuItem[]
}>()

const emit = defineEmits<{
  select: []
}>()

function handleSelect(item: ForumSidebarMenuItem) {
  item.action?.()
  if (!item.keepOpen)
    emit('select')
}
</script>

<template>
  <div>
    <template v-for="item in items" :key="item.label">
      <Separator v-if="item.separatorBefore" class="forum-sidebar-menu-separator" />
      <a
        v-if="item.href"
        class="forum-sidebar-menu-item"
        :class="{ 'forum-sidebar-menu-item-danger': item.danger }"
        :href="item.href"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noopener noreferrer' : undefined"
        @click="handleSelect(item)"
      >
        <span :class="item.icon" class="forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
      </a>
      <button
        v-else
        type="button"
        class="forum-sidebar-menu-item"
        :class="{ 'forum-sidebar-menu-item-danger': item.danger }"
        @click="handleSelect(item)"
      >
        <span :class="item.icon" class="forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.forum-sidebar-menu-item {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-family: inherit;
  @apply text-ui-14;
  @apply leading-ui-20;
  text-align: left;
  cursor: pointer;
  transition-property: background-color, color;
  transition-duration: 150ms;
}

.forum-sidebar-menu-item:hover,
.forum-sidebar-menu-item:focus-visible {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.forum-sidebar-menu-item-danger {
  color: var(--vp-c-danger-1);
}

.forum-sidebar-menu-item-danger:hover,
.forum-sidebar-menu-item-danger:focus-visible {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.forum-sidebar-menu-separator {
  margin: 6px 4px;
}

.forum-sidebar-menu-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}
</style>
