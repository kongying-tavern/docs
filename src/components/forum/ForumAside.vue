<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { flattenWithTags, getPageHeight, getRandomElements } from './utils'

const { contactUs = false } = defineProps<{
  showButton?: boolean
  contactUs?: boolean
}>()

const { message } = useLocalized()
const { theme } = useData()

const qrcode = useQRCode(message.value.forum.aside.contactUs.qrcodeLink)

const randomSuggest = getRandomElements(
  flattenWithTags(
    theme.value.sidebar[Object.keys(theme.value.sidebar)[0]].slice(1),
  ),
  Math.max(Math.ceil(getPageHeight() / 400), 8),
)

const suggestList = computed(() => {
  return [...message.value.forum.aside.suggest.items, ...randomSuggest].sort(
    (a, b) => a.tag.localeCompare(b.tag),
  )
})
</script>

<template>
  <div
    class="aside-content min-h-[calc(100vh-(var(--vp-nav-height)+var(--vp-layout-top-height,0px)+32px))] flex flex-col rounded-lg bg-[--vp-c-bg-soft] px-4 pb-4"
  >
    <div v-if="contactUs" class="selected-articles mb-4">
      <p
        class="mb-6 h-14 vp-border-divider color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)]"
      >
        {{ message.forum.aside.contactUs.title }}
      </p>
      <div
        class="mb-2 flex justify-between border border-color-[var(--vp-c-gutter)] rounded-md border-solid p-1"
      >
        <img class="mr-2 h-23 w-23" :src="qrcode" alt="QR Code">
        <p
          class="mt-2.75 h-[fit-content] overflow-hidden text-ellipsis break-all pr-2.5 text-center font-size-3.5 color-[--vp-c-text-1]"
        >
          {{ message.forum.aside.contactUs.desc }}
        </p>
      </div>
    </div>
    <div>
      <div
        class="mb-4 h-14 flex justify-between vp-border-divider lh-14 font-[var(--vp-font-family-subtitle)]"
      >
        <p class="color-[var(--vp-c-text-1)]">
          {{ message.forum.aside.teamBlog.text }}
        </p>
        <VPLink class="font-size-14px vp-link" href="../blog">
          {{ message.ui.button.all }}
        </VPLink>
      </div>

      <div
        v-for="item in message.forum.aside.teamBlog.items"
        :key="item.text"
        class="mb-2 flex justify-between font-[var(--vp-font-family-subtitle)]"
      >
        <img
          class="mr-2 h-13 w-23"
          :src="withBase(item.cover || '/imgs/common/selectArtilcs.png')"
          :alt="item.text"
        >
        <VPLink
          :href="item.link"
          class="line-clamp-2 h-12 overflow-hidden text-ellipsis break-all font-size-3.5 color-[--vp-c-text-2] lh-6"
        >
          {{ item.text }}
        </VPLink>
      </div>
    </div>
    <div class="selected-articles mb-4">
      <p
        class="mb-4 h-14 vp-border-divider color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)]"
      >
        {{ message.forum.aside.suggest.text }}
      </p>
      <div v-for="item in suggestList" :key="item.text" class="mb-2 flex">
        <div
          v-if="item.tag"
          class="mr-3 break-keep font-size-3.5 color-[--vp-c-text-3] line-height-[24px]"
        >
          [{{ item.tag?.replace(/【|】|\[|\]/g, ' ').trim() }}]
        </div>
        <VPLink
          v-if="item.tag"
          :href="item.link"
          class="line-clamp-1 h-12 overflow-hidden text-ellipsis font-size-3.5 color-[--vp-c-text-2] lh-6"
        >
          {{ item.text?.replace(/【|】|\[|\]/g, ' ').trim() }}
        </VPLink>
      </div>
    </div>
  </div>
  <div class="aside-footer mt-4 px-4">
    <nav class="flex shrink-0 basis-auto flex-wrap" role="navigation">
      <a
        v-for="item in message.forum.aside.info"
        :key="item.text"
        :href="item.link"
        :target="item.text"
        :alt="item?.alt"
        class="mr-3 overflow-unset px-[2px] font-size-[13px] color-[var(--vp-c-text-2)] line-height-4"
      >
        {{ item.text }}
      </a>
    </nav>
  </div>
</template>
