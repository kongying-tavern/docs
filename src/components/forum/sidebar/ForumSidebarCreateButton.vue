<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

defineProps<{
  isLoggedIn: boolean
}>()

defineEmits<{
  create: []
}>()

const { message } = useLocalized()
</script>

<template>
  <Button class="mb-4 w-full justify-start max-[959px]:hidden" @click="$emit('create')">
    <span :class="isLoggedIn ? 'i-lucide-square-pen' : 'i-lucide-log-in'" aria-hidden="true" />
    {{ isLoggedIn ? message.forum.sidebar.createFeedback : message.forum.sidebar.loginToCreate }}
  </Button>
</template>
