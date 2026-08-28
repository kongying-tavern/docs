<script setup lang="ts">
import type { ForumSort } from '~/services/forum/forumRoute'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

defineProps<{
  open: boolean
  sortOpen: boolean
  hasList: boolean
  currentSort: ForumSort
  privacyHref: string
  agreementHref: string
}>()

defineEmits<{
  'update:open': [open: boolean]
  'update:sortOpen': [open: boolean]
  'selectSort': [sort: ForumSort]
}>()

const { message } = useLocalized()
</script>

<template>
  <div class="forum-sidebar-information">
    <Button
      variant="ghost"
      class="forum-sidebar-information-trigger w-full justify-start"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="$emit('update:open', !open)"
    >
      <span class="i-lucide-menu icon-btn bg-[var(--vp-c-text-2)] size-4" aria-hidden="true" />
      {{ message.forum.sidebar.information }}
    </Button>
    <div
      v-if="open"
      class="forum-information-popover"
      role="dialog"
      :aria-label="message.forum.sidebar.information"
    >
      <div v-if="hasList" class="relative">
        <Button
          variant="ghost"
          class="forum-sidebar-menu-item"
          :aria-expanded="sortOpen"
          @click="$emit('update:sortOpen', !sortOpen)"
        >
          <span class="i-lucide-list-filter forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
          <span class="text-left flex-1">{{ message.forum.sidebar.listSort }}</span>
          <span class="i-lucide-chevron-right forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        </Button>
        <div
          v-if="sortOpen"
          class="forum-sort-popover"
          role="dialog"
          :aria-label="message.forum.sidebar.listSort"
        >
          <Button
            v-for="sort in (['created', 'updated'] as const)"
            :key="sort"
            variant="ghost"
            class="forum-sidebar-menu-item justify-start"
            :aria-pressed="currentSort === sort"
            @click="$emit('selectSort', sort)"
          >
            <span class="text-left flex-1">{{ message.forum.header.sort[sort] }}</span>
            <span
              class="i-lucide-check forum-sidebar-menu-icon icon-btn"
              :class="{ invisible: currentSort !== sort }"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
      <a class="forum-sidebar-menu-item" :href="privacyHref">
        <span class="i-lucide-shield-check forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.forum.sidebar.privacyPolicy }}
      </a>
      <a class="forum-sidebar-menu-item" :href="agreementHref">
        <span class="i-lucide-file-text forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.forum.sidebar.userAgreement }}
      </a>
      <a
        class="forum-sidebar-menu-item"
        href="https://github.com/kongying-tavern/docs"
        target="_blank"
        rel="noopener"
      >
        <span class="i-lucide-github forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.forum.sidebar.opensource }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.forum-sidebar-information {
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin-top: auto;
  padding: 8px 0 12px;
  background: var(--forum-sidebar-sticky-bg);
  box-shadow: 0 -10px 18px -16px var(--forum-sidebar-sticky-shadow);
}

.forum-sidebar-information::before {
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 28px;
  background: linear-gradient(to top, var(--forum-sidebar-sticky-bg), transparent);
  content: '';
  pointer-events: none;
}

.forum-sidebar-information-trigger {
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 20px;
}

.forum-sidebar-information-trigger:hover {
  background: var(--vp-c-default-soft);
}

.forum-information-popover {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 11;
  width: 256px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  overflow: visible;
}

.forum-sort-popover {
  position: absolute;
  z-index: 12;
  top: 0;
  left: calc(100% + 12px);
  width: 208px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}

.forum-sidebar-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 20px;
  text-align: left;
}

.forum-sidebar-menu-item:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.forum-sidebar-menu-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  background-color: currentcolor;
}

@media (max-width: 599px) {
  .forum-sort-popover {
    top: auto;
    right: 0;
    bottom: calc(100% + 8px);
    left: auto;
  }
}
</style>
