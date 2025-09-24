<script setup lang="ts">
import type { FormTabConfig } from './publish-topic-form/types'
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'
import { DialogHeader } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  modelValue: string
  tabs: FormTabConfig[]
  hasPermission: boolean
  inTransition: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDesktop = useMediaQuery('(min-width: 768px)')

const activeTab = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const visibleTabs = computed(() =>
  props.tabs.filter(tab => tab?.condition),
)

const _currentTab = computed(() =>
  props.tabs.find(tab => tab.value === props.modelValue),
)
</script>

<template>
  <Tabs
    v-model="activeTab"
    class="form-content w-full px-4 md:rotate--1.4deg"
    :class="{ 'animate-switching': inTransition }"
  >
    <DialogHeader>
      <!-- Desktop: Show title for current tab -->
      <template v-if="isDesktop">
        <div
          v-for="tab in visibleTabs"
          v-show="modelValue === tab.value"
          :key="tab.value"
        >
          <h2 class="mb-3 mt-18px font-size-28px">
            {{ tab.label }}
          </h2>
        </div>
      </template>

      <!-- Mobile: Show tab switcher -->
      <TabsList
        v-else
        class="grid mb-3 w-full"
        :class="hasPermission ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <TabsTrigger
          v-for="tab in visibleTabs"
          :key="tab.value"
          :value="tab.value"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
    </DialogHeader>

    <div class="mb-6 vp-divider md:border-width-2px md:border-style-dashed" />

    <slot />
  </Tabs>
</template>

<style scoped>
.animate-switching {
  animation: form-switch 0.3s ease-in-out;
}

@keyframes form-switch {
  0%, 100% { opacity: 1; transform: translateX(0); }
  50% { opacity: 0.8; transform: translateX(10px); }
}
</style>
