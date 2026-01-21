<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'
import { DialogHeader } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserInfoStore } from '@/stores/useUserInfo'

interface Props {
  modelValue: string
  tabs: TabsConfig[]
  hasPermission: boolean
  inTransition: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const userInfoStore = useUserInfoStore()
const isDesktop = useMediaQuery('(min-width: 768px)')

const activeTab = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const visibleTabs = computed(() => props.tabs.filter(tab => tab?.condition))

const _currentTab = computed(() =>
  props.tabs.find(tab => tab.value === props.modelValue),
)

function formatDateEN(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short', // short | long
    day: 'numeric',
  }).format(date)
}
</script>

<template>
  <Tabs
    v-model="activeTab"
    class="form-content px-4 w-full md:rotate--1.4deg md:hover:rotate-0"
    :class="{ 'animate-switching': inTransition }"
  >
    <DialogHeader>
      <!-- Desktop: Show title for current tab -->
      <template v-if="isDesktop">
        <div
          v-for="tab in visibleTabs"
          v-show="modelValue === tab.value"
          :key="tab.value"
          class="important:font-serif md:mt-4"
        >
          <div class="mb-1 w-full hidden justify-between md:flex">
            <time>
              {{ formatDateEN() }}
            </time>
            <p>Reported by {{ userInfoStore.info?.login || "Guest" }}</p>
          </div>
          <div
            class="mb-6 vp-divider md:border-width-2px md:border-color-[var(--vp-v-text-1)] md:border-style-solid"
          />
          <h2 class="font-size-28px font-extrabold mb-6 mt-8 text-center">
            原神地图工具反馈表单 - {{ tab.label }}
          </h2>
        </div>
      </template>

      <!-- Mobile: Show tab switcher -->
      <TabsList
        v-else
        class="mb-3 border-solid grid w-full"
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
    <slot />
  </Tabs>
</template>

<style scoped>
.animate-switching {
  animation: form-switch 0.3s ease-in-out;
}

@keyframes form-switch {
  0%,
  100% {
    opacity: 1;
    transform: translateX(0);
  }
  50% {
    opacity: 0.8;
    transform: translateX(10px);
  }
}
</style>
