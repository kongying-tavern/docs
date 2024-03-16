<template>
  <div class="doc-info">
    <div class="doc-info-left">
      {{ theme.lastUpdatedText }}
      {{ dayjs(page.lastUpdated).format('YYYY-MM-DD') }}
    </div>
    <ClientOnly>
      <div class="doc-info-right" text-right flex justify-end>
        <i i-custom-eye></i>
        {{
          pageinfo.currentPageinfo.pageview
            ? Number(pageinfo.currentPageinfo.pageview) + 1
            : '-'
        }}
        <i i-custom-star ml-6></i>
        {{
          pageinfo.currentPageinfo.good
            ? Number(pageinfo.currentPageinfo.good)
            : '-'
        }}
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useData, useRoute } from 'vitepress'
import { watch } from 'vue'
import dayjs from 'dayjs'
import { getPageInfo } from '../apis/getPageInfo'
import { pageview as PV } from '../apis/pageview'
import { usePageInfoStore } from '../stores/pageinfo'

const router = useRoute()
const { page, theme } = useData()
const pageinfo = usePageInfoStore()

const updateData = async () => {
  const info = await getPageInfo(page)
  pageinfo.setNewPageinfo(info.data)
  await PV(info.data.record_id)
}

watch(
  () => router.path,
  () => updateData(),
)
updateData()
</script>

<style scoped>
.doc-info {
  display: grid;
  grid-row-gap: 4px;

  i {
    display: inline-block;
    width: 24px;
    height: 24px;
    padding-left: 2em;
    fill: currentColor;
  }
}
.doc-info-right {
  justify-content: flex-start;
}

@media (min-width: 640px) {
  .doc-info {
    grid-template-columns: repeat(2, 1fr);
    grid-column-gap: 16px;
  }

  .doc-info-right {
    justify-content: flex-end;
  }
}
</style>
../../apis/getPageInfo../../apis/pageview./apis/getPageInfo./apis/pageview
