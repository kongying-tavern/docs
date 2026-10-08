<script lang="ts" setup>
import type { ProgressStep } from './ScrollIsland.vue'
import { computed } from 'vue'
import useLogin from '~/forum/hooks/useLogin'
import ScrollIsland from './ScrollIsland.vue'

const { authProgress } = useLogin()

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
    :custom-progress="authProgress.progress.value"
    :title="authProgress.title.value"
    :steps="progressSteps"
    :error-state="authProgress.hasError.value"
    :on-retry="authProgress.hasError.value ? authProgress.retry : undefined"
  />
</template>
