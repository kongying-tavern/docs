<script setup lang="ts">
import { refAutoReset, useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const { t } = useI18n({ useScope: 'global' })

const { copy, copied, isSupported } = useClipboard()
const isExpand = refAutoReset(false, 1500)

async function copyCurrentURL() {
  await copy(location.href)
  isExpand.value = true
}
</script>

<template>
  <Button
    v-if="isSupported" class="rounded-full bg-[var(--vp-c-bg-alt)] w-fit max-mobile:h-9" :title="t('forum.topic.menu.copyLink.text')"
    :data-tooltip="t('forum.topic.menu.copyLink.text')" variant="ghost" @click="copyCurrentURL"
  >
    <span class="i-lucide:link max-mobile:size-5" />
    <p v-show="isExpand">
      <span v-if="!copied">{{ t('forum.topic.menu.copyLink.text') }}</span>
      <span v-else>{{ t('forum.topic.menu.copyLink.success') }}</span>
    </p>
  </Button>
</template>
