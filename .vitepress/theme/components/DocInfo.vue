<template>
  <div class="doc-gitlog pb-6" v-if="gitlogIsVisible">
    <h3 pt-6 mt-12 font-size-6>{{ theme.gitlog.title }}</h3>
    <Contributors />
    <Changelog />
  </div>
  <div class="doc-info" v-else>
    <div class="doc-info-left">
      {{ theme.lastUpdatedText }}
      {{ dayjs(page.lastUpdated).format('YYYY-MM-DD') }}
    </div>
    <ClientOnly>
      <div class="doc-info-right" text-right flex justify-end>
        <i i-custom-thumb></i>
        <div v-if="loading" class="loader mr-4"></div>
        <span v-else>
          {{ thumbText }}
        </span>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { getPageInfo } from '../apis/getPageInfo'
import { usePageInfoStore } from '../stores/pageinfo'

const router = useRoute()
const { page, theme, frontmatter } = useData()
const pageinfo = usePageInfoStore()
const loading = ref(false)
const gitlogIsVisible = computed(() => {
  if (frontmatter.value.gitlog === true) return true
  // 默认仅在用户手册中展示
  return (
    frontmatter.value.gitlog !== false &&
    frontmatter.value.layout == 'doc' &&
    page.value.filePath.includes('manual')
  )
})
const thumbText = computed(() => {
  return pageinfo.currentPageinfo.good
    ? Number(pageinfo.currentPageinfo.good)
    : '-'
})

const updateData = async () => {
  // @ts-ignore
  if (import.meta.env.SSR) return null
  const info = await getPageInfo(page)
  pageinfo.setNewPageinfo(info.data!)
}

watch(
  () => router.path,
  async () => {
    loading.value = true
    updateData()
    loading.value = false
  },
)

updateData()
</script>

<style lang="scss" scoped>
.doc-gitlog {
  display: grid;
  grid-row-gap: 26px;
}

.doc-info {
  display: flex;
  justify-content: space-between;
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-column-gap: 16px;
  }

  .doc-info-right {
    justify-content: flex-end;
  }
}
</style>
