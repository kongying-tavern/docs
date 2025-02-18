<template>
  <div class="flex justify-end items-center gap-1.5">
    <Button
      class="w-fit"
      v-if="isSupported"
      :title="message.forum.topic.menu.copyLink.text"
      :data-tooltip="message.forum.topic.menu.copyLink.text"
      variant="ghost"
      @click="copyCurrentURL"
    >
      <span class="i-lucide:link"></span>
      <p v-show="isExpand">
        <span v-if="!copied">{{ message.forum.topic.menu.copyLink.text }}</span>
        <span v-else>{{ message.forum.topic.menu.copyLink.success }}</span>
      </p>
    </Button>
    <Button
      class="fill-[var(--vp-c-text-1)]"
      variant="ghost"
      size="icon"
      v-for="item in SNSList"
      :key="item.title"
      :title="item.title"
      :data-tooltip="item.title"
      v-html="item.icon"
      @click="redirectShare(item.link)"
    >
    </Button>
  </div>
</template>

<script setup lang="ts">
import { shareToSNS } from '@/composables/shareToSNS'
import { Button } from '@/components/ui/button'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { refAutoReset, useClipboard } from '@vueuse/core'

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

const redirectShare = (url: string) => {
  window.open(
    url
      .replace('%url', encodeURIComponent(location.href))
      .replace('%title', encodeURIComponent(document.title)),
    '_blank',
  )
}

const copyCurrentURL = async () => {
  await copy(location.href)
  isExpand.value = true
}
</script>
