<script setup lang="ts">
import { refAutoReset, useClipboard } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

const { message } = useLocalized()

const { copy, copied, isSupported } = useClipboard()
const isExpand = refAutoReset(false, 1500)

async function copyCurrentURL() {
  await copy(location.href)
  isExpand.value = true
}
</script>

<template>
  <Button
    v-if="isSupported" class="rounded-full bg-[--vp-c-bg-alt] w-fit max-mobile:h-11" :title="message.forum.topic.menu.copyLink.text"
    :data-tooltip="message.forum.topic.menu.copyLink.text" variant="ghost" @click="copyCurrentURL"
  >
    <span class="i-lucide:link max-mobile:size-5" />
    <p v-show="isExpand">
      <span v-if="!copied">{{ message.forum.topic.menu.copyLink.text }}</span>
      <span v-else>{{ message.forum.topic.menu.copyLink.success }}</span>
    </p>
  </Button>
</template>
