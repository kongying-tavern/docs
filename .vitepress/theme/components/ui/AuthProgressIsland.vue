<script lang="ts" setup>
import type { ProgressStep } from './ScrollIsland.vue'
import { computed } from 'vue'
import useLogin from '@/hooks/useLogin'
import ScrollIsland from './ScrollIsland.vue'

const { authProgress } = useLogin()

// Convert auth steps to generic progress steps
const progressSteps = computed((): ProgressStep[] => {
  return authProgress.steps.value.map(step => ({
    key: step.key,
    label: step.label,
    status: step.status,
  }))
})
</script>

<template>
  <ScrollIsland
    mode="custom"
    :custom-progress="authProgress.progress.value"
    :title="authProgress.title.value"
    :steps="progressSteps"
    :error-state="authProgress.hasError.value"
    :on-retry="authProgress.hasError.value ? authProgress.retry : undefined"
  />
</template>
