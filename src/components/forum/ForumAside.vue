<template>
  <div class="aside-content">
    <Button
      v-if="showButton"
      class="vp-button h-11.5 rounded-full mb-6"
      @click="publishTopic"
    >
      <span class="i-lucide:square-pen icon-btn"></span
      >{{ theme.forum.publish.title }}
    </Button>
    <div class="selected-articles mb-4">
      <p
        v-if="showQrcode"
        class="h-14 lh-14 mb-6 vp-border-divider color-[var(--vp-c-text-1)]"
      >
        {{ theme.forum.aside.contactUs.title }}
      </p>
      <div
        v-if="showQrcode"
        class="flex justify-between mb-2 p-1 border border-solid rounded-md border-color-[var(--vp-c-gutter)]"
      >
        <img class="mr-2 w-23 h-23" :src="qrcode" alt="QR Code" />
        <p
          class="h-[fit-content] pr-2.5 mt-2.75 font-size-3.5 text-center text-ellipsis overflow-hidden break-all color-[--vp-c-text-1]"
        >
          {{ theme.forum.aside.contactUs.desc }}
        </p>
      </div>
      <p class="h-14 lh-14 mb-6 vp-border-divider color-[var(--vp-c-text-1)]">
        {{ theme.forum.aside.teamBlog.title }}
      </p>
      <div
        class="flex justify-between mb-2"
        v-for="item in theme.forum.aside.teamBlog.items"
        :key="item.title"
      >
        <img
          class="mr-2 w-23 h-13"
          :src="withBase(item.cover || '/imgs/common/selectArtilcs.png')"
          :alt="item.title"
        />
        <VPLink
          :href="item.link"
          class="h-12 font-size-3.5 lh-6 line-clamp-2 text-ellipsis overflow-hidden break-all color-[--vp-c-text-2]"
        >
          {{ item.title }}
        </VPLink>
      </div>
    </div>
    <div class="selected-articles mb-4 vp-border-divider border-b">
      <p class="h-14 lh-14 mb-4 vp-border-divider color-[var(--vp-c-text-1)]">
        {{ theme.forum.aside.suggest.title }}
      </p>
      <div
        class="flex mb-2"
        v-for="item in [theme.forum.aside.suggest.items, ...roadomSuggest]"
        :key="item.text"
      >
        <div
          v-if="item.tag"
          class="mr-3 font-size-3.5 line-height-[24px] color-[--vp-c-text-3] break-keep"
        >
          [{{ item.tag?.replace(/【|】|\[|\]/g, ' ').trim() }}]
        </div>
        <VPLink
          v-if="item.tag"
          :href="item.link"
          class="h-12 font-size-3.5 lh-6 line-clamp-2 text-ellipsis overflow-hidden break-all color-[--vp-c-text-2]"
        >
          {{ item.text?.replace(/【|】|\[|\]/g, ' ').trim() }}
        </VPLink>
      </div>
    </div>
    <div class="aside-footer">
      <nav class="flex basis-auto flex-wrap shrink-0" role="navigation">
        <a
          v-for="item in theme.forum.aside.info"
          :href="item.link"
          :target="item.text"
          :alt="item?.alt"
          class="color-[var(--vp-c-text-2)] overflow-unset font-size-[13px] mr-3 px-[2px] line-height-4"
        >
          {{ item.text }}
        </a>
      </nav>
    </div>
  </div>

  <Teleport to="body">
    <ForumPublishTopicDialog></ForumPublishTopicDialog>
    <Button
      v-if="showButton"
      variant="outline"
      size="icon"
      @click="publishTopic()"
      class="important:vp-button rounded-full fixed bottom-4 right-4 size-[3.5rem] md:hidden"
    >
      <span
        class="i-lucide-plus size-[1.75rem] shadow-[var(--vp-shadow-1)] z-9999"
      ></span>
    </Button>
  </Teleport>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { useData, withBase } from 'vitepress'
import ForumPublishTopicDialog from './ForumPublishTopicDialog.vue'
import { flattenWithTags, getPageHeight, getRandomElements } from './utils'

const { showButton = true, showQrcode = false } = defineProps<{
  showButton?: boolean
  showQrcode?: boolean
}>()

const { theme } = useData()
const qrcode = useQRCode(theme.value.forum.aside.contactUs.qrcodeLink)
const roadomSuggest = getRandomElements(
  flattenWithTags(
    theme.value.sidebar[Object.keys(theme.value.sidebar)[0]].slice(1),
  ),
  Math.max(Math.ceil(getPageHeight() / 400), 5),
)

const publishTopic = () => {
  location.hash = 'publish-topic'
}
</script>

<style lang="scss" scoped>
.aside-content {
  display: flex;
  flex-direction: column;
  min-height: calc(
    100vh - (var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 32px)
  );
  padding-bottom: 32px;
}
</style>
