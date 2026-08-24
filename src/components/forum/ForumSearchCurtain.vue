<script setup lang="ts">
import { useData } from 'vitepress'
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumSearchbox from './ForumSearchbox.vue'
import { flattenWithTags } from './utils'

const emit = defineEmits<{ close: [] }>()
const { list, submitSearch } = useForumRoute()
const { message } = useLocalized()
const { theme } = useData()
const searchQuery = ref(list.value?.q ?? '')
const quickLinkList = flattenWithTags(theme.value.sidebar[Object.keys(theme.value.sidebar)[0]].slice(1))

async function handleSearch(query: string) {
  if (query === (list.value?.q ?? '') || await submitSearch(query))
    emit('close')
}

function handleOpenChange(open: boolean) {
  if (!open)
    emit('close')
}
</script>

<template>
  <Dialog :open="true" @update:open="handleOpenChange">
    <DialogContent
      class="search-dialog p-0 border-x-0 border-b-0 rounded-none max-w-none overflow-y-auto"
      :show-close-button="false"
    >
      <DialogTitle class="sr-only">
        {{ message.ui.button.search }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ message.forum.header.search.placeholder }}
      </DialogDescription>

      <div class="wrapper bg-[var(--vp-c-bg)] min-h-full">
        <div class="curtain-content pt-8 container h-auto w-full">
          <ForumSearchbox v-model:query="searchQuery" autofocus @submit="handleSearch" />
          <div class="pb-64px pt-40px flex flex-col h-auto w-full">
            <h2 class="mb-5">
              {{ message.forum.header.search.quickLinks }}
            </h2>
            <ul class="gap-x-6 gap-y-4 grid grid-row-auto grid-flow-col grid-flow-row grid-cols-1 md:grid-cols-4 md:grid-rows-5">
              <li v-for="item in quickLinkList" :key="item.text">
                <VPLink
                  :href="item.link"
                  class="font-size-3.5 color-[--vp-c-text-1] vp-link break-all text-ellipsis overflow-hidden line-clamp-2"
                  @click="emit('close')"
                >
                  {{ item.text?.replace(/【|】|\[|\]/g, ' ').trim() }}
                </VPLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.search-dialog {
  top: calc(var(--vp-nav-height) + 52px);
  left: 50%;
  width: 100%;
  height: calc(100dvh - var(--vp-nav-height) - 52px);
  transform: translateX(-50%);
}

.wrapper {
  padding: 0 8px 0 24px;
}

@media (min-width: 768px) {
  .wrapper {
    padding: 0 32px;
  }
}

.container {
  margin: 0 auto;
  max-width: calc(var(--vp-layout-max-width) - 64px);
}
</style>
