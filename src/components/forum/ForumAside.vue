<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { shuffle, take } from 'lodash-es'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { flattenWithTags, getPageHeight } from './utils'

const { contactUs = false } = defineProps<{
  showButton?: boolean
  contactUs?: boolean
}>()

const { message } = useLocalized()
const { theme } = useData()

const qrcode = useQRCode(message.value.forum.aside.contactUs.qrcodeLink)

const randomSuggest = take(shuffle(
  flattenWithTags(
    theme.value.sidebar[Object.keys(theme.value.sidebar)[0]].slice(1),
  ),
), Math.max(Math.ceil(getPageHeight() / 400), 8))

const suggestList = computed(() => {
  return [...message.value.forum.aside.suggest.items, ...randomSuggest].sort(
    (a, b) => a.tag.localeCompare(b.tag),
  )
})
</script>

<template>
  <div
    class="aside-content px-4 pb-4 rounded-lg bg-[--vp-c-bg-soft] flex flex-col min-h-[calc(100vh-(var(--vp-nav-height)+var(--vp-layout-top-height,0px)+32px))]"
  >
    <div v-if="contactUs" class="selected-articles mb-4">
      <p
        class="color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)] mb-6 vp-border-divider h-14"
      >
        {{ message.forum.aside.contactUs.title }}
      </p>
      <div
        class="mb-2 p-1 border border-color-[var(--vp-c-gutter)] rounded-md border-solid flex justify-between"
      >
        <img class="mr-2 h-23 w-23" :src="qrcode" alt="QR Code">
        <p
          class="font-size-3.5 color-[--vp-c-text-1] mt-2.75 pr-2.5 text-center h-[fit-content] break-all text-ellipsis overflow-hidden"
        >
          {{ message.forum.aside.contactUs.desc }}
        </p>
      </div>
    </div>
    <div>
      <div
        class="lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider flex h-14 justify-between"
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
        class="font-[var(--vp-font-family-subtitle)] mb-2 flex justify-between"
      >
        <img
          class="mr-2 h-13 w-23"
          :src="withBase(item.cover || '/imgs/common/selectArtilcs.png')"
          :alt="item.text"
        >
        <VPLink
          :href="item.link"
          class="font-size-3.5 color-[--vp-c-text-2] lh-6 h-12 break-all text-ellipsis overflow-hidden line-clamp-2"
        >
          {{ item.text }}
        </VPLink>
      </div>
    </div>
    <div class="selected-articles mb-4">
      <p
        class="color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14"
      >
        {{ message.forum.aside.suggest.text }}
      </p>
      <div v-for="item in suggestList" :key="item.text" class="mb-2 flex">
        <div
          v-if="item.tag"
          class="font-size-3.5 color-[--vp-c-text-3] line-height-[24px] mr-3 break-keep"
        >
          [{{ item.tag?.replace(/【|】|\[|\]/g, ' ').trim() }}]
        </div>
        <VPLink
          v-if="item.tag"
          :href="item.link"
          class="font-size-3.5 color-[--vp-c-text-2] lh-6 h-12 text-ellipsis overflow-hidden line-clamp-1"
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
        class="font-size-[13px] color-[var(--vp-c-text-2)] line-height-4 mr-3 px-[2px] overflow-unset"
      >
        {{ item.text }}
      </a>
    </nav>
  </div>
</template>
