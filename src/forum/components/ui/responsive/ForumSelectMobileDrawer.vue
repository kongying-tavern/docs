<script setup lang="ts">
import type { ForumSelectOption, ForumSelectSlots } from './shared'
import { computed, ref } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { groupSelectOptions } from './shared'

const props = defineProps<{
  options: ReadonlyArray<ForumSelectOption>
  label: string
}>()

defineSlots<ForumSelectSlots>()

const modelValue = defineModel<string>({ required: true })

const open = ref(false)
const groups = computed(() => groupSelectOptions(props.options))

function handleSelect(option: ForumSelectOption) {
  if (option.disabled)
    return
  modelValue.value = option.id
  open.value = false
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerTrigger as-child>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[80dvh] overflow-hidden">
      <DrawerHeader class="text-left shrink-0">
        <DrawerTitle>{{ label }}</DrawerTitle>
        <DrawerDescription class="sr-only">
          {{ label }}
        </DrawerDescription>
      </DrawerHeader>
      <div class="px-4 pb-2 overscroll-contain flex-1 min-h-0 overflow-y-auto" role="listbox" :aria-label="label">
        <template v-for="(group, groupIndex) in groups" :key="groupIndex">
          <div v-if="group.label" class="forum-select-drawer-group">
            {{ group.label }}
          </div>
          <button
            v-for="option in group.items"
            :key="option.id"
            type="button"
            role="option"
            :aria-selected="option.id === modelValue"
            :disabled="option.disabled"
            class="forum-select-drawer-option"
            :class="{ selected: option.id === modelValue }"
            @click="handleSelect(option)"
          >
            <slot name="prefix" :option="option" />
            <span class="text-left flex-1 min-w-0">
              <span class="block truncate">{{ option.label }}</span>
              <span v-if="option.hint" class="text-xs text-[var(--vp-c-text-3)] block">
                {{ option.hint }}
              </span>
            </span>
            <span v-if="option.id === modelValue" class="i-lucide-check text-[var(--vp-c-brand-1)] shrink-0 size-4" aria-hidden="true" />
          </button>
        </template>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.forum-select-drawer-group {
  padding: 6px 10px 5px;
  color: var(--vp-c-text-3);
  @apply text-ui-11;
  font-weight: 600;
}

.forum-select-drawer-option {
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
  @apply text-ui-14;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.forum-select-drawer-option:hover {
  background: var(--vp-c-default-soft);
}

.forum-select-drawer-option.selected {
  color: var(--vp-c-brand-1);
}

.forum-select-drawer-option:disabled {
  opacity: 0.45;
  pointer-events: none;
}
</style>
