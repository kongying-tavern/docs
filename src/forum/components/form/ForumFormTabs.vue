<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import type { TopicFormData } from '~/forum/services/form/validation'
import { useMediaQuery } from '@vueuse/core'
import { computed, unref } from 'vue'
import { DialogHeader } from '@/components/ui/dialog'
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocalized } from '@/hooks/useLocalized'

interface Props {
  modelValue: TopicFormData['type']
  tabs: TabsConfig[]
  hasPermission: boolean
  username: string
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: TopicFormData['type']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')

const activeTab = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const visibleTabs = computed(() => props.tabs.filter(tab => unref(tab.condition)))

function formatDate(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
</script>

<template>
  <Tabs
    v-model="activeTab"
    class="form-content w-full md:px-4"
  >
    <DialogHeader v-if="isDesktop" class="desktop-paper-header font-title pt-6">
      <div class="text-base c-[var(--vp-c-text-2)] leading-none flex w-full justify-between">
        <p>@{{ username }}</p>
        <time class="c-[var(--vp-c-text-1)]">{{ formatDate() }}</time>
      </div>
      <div class="desktop-letter-rule" aria-hidden="true" />
      <h2 class="desktop-form-title leading-tight tracking-[-0.025em] mt-8 text-left text-ui-42">
        {{ message.forum.publish.title }} - {{ visibleTabs.find(tab => tab.value === modelValue)?.label }}
      </h2>
      <div class="desktop-title-divider mb-10 w-18" aria-hidden="true" />
    </DialogHeader>

    <DrawerHeader v-else class="px-5 pb-5 pt-3 shrink-0">
      <DrawerTitle>
        {{ message.forum.publish.title }}
      </DrawerTitle>
      <TabsList
        class="mt-4 grid h-10 w-full"
        :class="hasPermission ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <TabsTrigger
          v-for="tab in visibleTabs"
          :key="tab.value"
          :value="tab.value"
          :disabled="loading"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
    </DrawerHeader>
    <Separator v-if="!isDesktop" />

    <slot />
  </Tabs>
</template>

<style scoped>
.desktop-paper-header {
  gap: 0;
  padding-bottom: 0.25rem;
}

.desktop-letter-rule {
  height: 4px;
  margin-top: 4px;
  border-block: 1px solid var(--vp-c-text-1);
}

.desktop-form-title,
.desktop-title-divider {
  margin-left: 1rem;
}

.desktop-form-title {
  font-family: var(--vp-font-family-title);
}

.desktop-title-divider {
  margin-top: 1.5rem;
  border-top: 2px solid color-mix(in srgb, var(--vp-c-text-1) 72%, transparent);
}
</style>
