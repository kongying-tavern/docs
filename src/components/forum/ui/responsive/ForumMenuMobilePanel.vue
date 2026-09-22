<script setup lang="ts">
import type { FORUM } from '../types'
import ForumTopicStatusBadge from '../ForumTopicStatusBadge.vue'
import { menuItemKey, sortMenuItems } from './shared'

defineProps<{
  items: FORUM.TopicDropdownMenu[]
}>()

const emit = defineEmits<{
  /** 进入子菜单：切换为面板钻取 */
  navigate: [panel: { title: string, items: FORUM.TopicDropdownMenu[] }]
  /** 执行了动作，请求关闭抽屉 */
  close: []
}>()

function handleItemClick(item: FORUM.MenuItemBase) {
  item.action?.()
  emit('close')
}

function handleSubmenuClick(item: FORUM.MenuSubmenu) {
  emit('navigate', { title: item.label, items: item.items })
}

function handleRadioClick(item: FORUM.MenuRadioItem) {
  item.onChange?.(item.value)
  emit('close')
}
</script>

<template>
  <div class="forum-menu-mobile-panel" role="menu">
    <template v-for="(item, index) in sortMenuItems(items)" :key="menuItemKey(item, index)">
      <div v-if="item.type === 'separator'" class="mx-2 my-1 bg-[var(--vp-c-divider)] h-px" />

      <div v-else-if="item.type === 'label'" class="forum-menu-mobile-label" :class="[item.class]">
        <span v-if="item.icon" class="mr-2 icon-btn" :class="item.icon" />
        <span>{{ item.label }}</span>
        <span v-if="item.hint" class="text-xs text-[var(--vp-c-text-3)] font-normal">
          {{ item.hint }}
        </span>
      </div>

      <div v-else-if="item.type === 'info'" class="forum-menu-mobile-info" :class="[item.class]">
        {{ item.label }}
      </div>

      <template v-else-if="item.type === 'radio-group'">
        <div v-if="item.label" class="forum-menu-mobile-label">
          {{ item.label }}
        </div>
        <button
          v-for="radio in item.items"
          :key="radio.id ?? radio.value"
          type="button"
          role="menuitemradio"
          :aria-checked="radio.checked"
          :disabled="radio.disabled"
          class="forum-menu-mobile-option" :class="[radio.class]"
          @click="handleRadioClick(radio)"
        >
          <span v-if="radio.icon" class="icon-btn shrink-0" :class="radio.icon" />
          <span class="text-left flex-1 min-w-0 truncate">{{ radio.label }}</span>
          <span v-if="radio.hint" class="text-xs text-[var(--vp-c-text-3)]">{{ radio.hint }}</span>
          <span v-if="radio.checked" class="i-lucide-check text-[var(--vp-c-brand-1)] shrink-0 size-4" aria-hidden="true" />
        </button>
      </template>

      <ForumMenuMobilePanel
        v-else-if="item.type === 'group'"
        :items="item.items"
        @navigate="emit('navigate', $event)"
        @close="emit('close')"
      />

      <button
        v-else-if="item.type === 'submenu'"
        type="button"
        class="forum-menu-mobile-option" :class="[item.class]"
        @click="handleSubmenuClick(item)"
      >
        <span v-if="item.icon" class="icon-btn shrink-0" :class="item.icon" />
        <span class="text-left flex-1 min-w-0 truncate">{{ item.label }}</span>
        <span class="i-lucide-chevron-right text-[var(--vp-c-text-3)] shrink-0 size-4" aria-hidden="true" />
      </button>

      <button
        v-else
        type="button"
        role="menuitem"
        :disabled="item.disabled"
        class="forum-menu-mobile-option" :class="[item.class]"
        @click="handleItemClick(item)"
      >
        <ForumTopicStatusBadge v-if="item.status !== undefined" :status="item.status ?? undefined" />
        <span v-else-if="item.icon" class="icon-btn shrink-0" :class="item.icon" />
        <span class="text-left flex-1 min-w-0 truncate">{{ item.label }}</span>
        <span v-if="item.shortcut" class="text-xs text-[var(--vp-c-text-3)]">{{ item.shortcut }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.forum-menu-mobile-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 5px;
  color: var(--vp-c-text-3);
  font-size: 11px;
  font-weight: 600;
}

.forum-menu-mobile-info {
  padding: 6px 10px 5px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 1.4;
}

.forum-menu-mobile-option {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.forum-menu-mobile-option:hover {
  background: var(--vp-c-default-soft);
}

.forum-menu-mobile-option:disabled {
  opacity: 0.45;
  pointer-events: none;
}
</style>
