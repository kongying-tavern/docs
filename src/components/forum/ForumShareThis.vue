<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { shareToSNS } from '@/composables/shareToSNS'
import { useLocalized } from '@/hooks/useLocalized'
import { refAutoReset, useClipboard } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed } from 'vue'

const { message } = useLocalized()
const { localeIndex } = useData()

const { copy, copied, isSupported } = useClipboard()
const isExpand = refAutoReset(false, 1500)

const SNSList = computed(() => {
  const { qq, qzone, ...rest } = shareToSNS
  if (localeIndex.value === 'root')
    return [qq, qzone, shareToSNS.wechat, shareToSNS.rss]
  return Object.values(rest)
})

function redirectShare(url: string) {
  window.open(
    url
      .replace('%url', encodeURIComponent(location.href))
      .replace('%title', encodeURIComponent(document.title)),
    '_blank',
  )
}

async function copyCurrentURL() {
  await copy(location.href)
  isExpand.value = true
}
</script>

<template>
  <div class="flex items-center justify-end gap-1.5">
    <Button
      v-if="isSupported"
      class="w-fit"
      :title="message.forum.topic.menu.copyLink.text"
      :data-tooltip="message.forum.topic.menu.copyLink.text"
      variant="ghost"
      @click="copyCurrentURL"
    >
      <span class="i-lucide:link" />
      <p v-show="isExpand">
        <span v-if="!copied">{{ message.forum.topic.menu.copyLink.text }}</span>
        <span v-else>{{ message.forum.topic.menu.copyLink.success }}</span>
      </p>
    </Button>
    <!-- eslint-disable vue/no-v-text-v-html-on-component -->
    <Button
      v-for="item in SNSList"
      :key="item.title"
      class="fill-[var(--vp-c-text-1)]"
      variant="ghost"
      size="icon"
      :title="item.title"
      :data-tooltip="item.title"
      @click="redirectShare(item.link)"
      v-html="item.icon"
    />
  </div>
</template>
