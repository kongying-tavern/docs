<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import type { TopicFormData } from '~/services/forum/form/validation'
import { useMediaQuery } from '@vueuse/core'
import { computed, unref } from 'vue'
import { DialogHeader } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserInfoStore } from '@/stores/useUserInfo'

interface Props {
  modelValue: TopicFormData['type']
  tabs: TabsConfig[]
  hasPermission: boolean
  inTransition: boolean
}

interface Emits {
  (e: 'update:modelValue', value: TopicFormData['type']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { message } = useLocalized()
const userInfoStore = useUserInfoStore()
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
    :class="{ 'animate-switching': inTransition }"
  >
    <DialogHeader v-if="isDesktop" class="desktop-paper-header font-serif pt-6">
      <div class="text-base c-[var(--vp-c-text-2)] leading-none flex w-full justify-between">
        <p>@{{ userInfoStore.info?.login || 'Guest' }}</p>
        <time class="c-[var(--vp-c-text-1)]">{{ formatDate() }}</time>
      </div>
      <div class="desktop-letter-rule mb-6" aria-hidden="true" />
      <h2 class="desktop-form-title text-42px leading-tight tracking-[-0.025em] mb-6 mt-8 text-left">
        {{ message.forum.publish.title }} · {{ visibleTabs.find(tab => tab.value === modelValue)?.label }}
      </h2>
      <div class="desktop-title-divider mb-10 w-18" aria-hidden="true" />
    </DialogHeader>

    <DialogHeader v-else class="form-header px-5 pb-4 pt-5 text-left sm:px-6">
      <h2 class="text-xl text-[var(--vp-c-text-1)] tracking-[-0.02em] font-semibold">
        {{ message.forum.publish.title }}
      </h2>
      <TabsList
        class="mt-3 border-solid grid h-10 w-fit"
        :class="hasPermission ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <TabsTrigger
          v-for="tab in visibleTabs"
          :key="tab.value"
          :value="tab.value"
          class="text-sm"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
    </DialogHeader>

    <slot />
  </Tabs>
</template>

<style scoped>
.form-content {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

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
  border-top: 2px solid color-mix(in srgb, var(--vp-c-text-1) 72%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .form-content {
    transition: none;
  }

}
</style>
