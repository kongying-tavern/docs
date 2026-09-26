<script setup lang="ts">
import type { PopoverContentProps } from 'reka-ui'
import { useMediaQuery } from '@vueuse/core'
import { ref, watch } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'

withDefaults(defineProps<{
  title: string
  align?: PopoverContentProps['align']
  immersive?: boolean
  hideHeader?: boolean
}>(), {
  align: 'start',
  immersive: false,
  hideHeader: false,
})

const emit = defineEmits<{
  closed: []
}>()

defineSlots<{
  trigger: () => unknown
  default: (props: { close: () => void }) => unknown
}>()

const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const open = ref(false)

function close() {
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen)
    emit('closed')
})
watch(isMobile, () => {
  open.value = false
})
</script>

<template>
  <Drawer v-if="isMobile" v-model:open="open">
    <DrawerTrigger as-child>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerContent
      class="forum-sidebar-responsive-drawer"
      :class="{ 'is-immersive': immersive }"
    >
      <DrawerHeader v-if="!immersive && !hideHeader" class="text-left">
        <DrawerTitle>{{ title }}</DrawerTitle>
        <DrawerDescription class="sr-only">
          {{ title }}
        </DrawerDescription>
      </DrawerHeader>
      <template v-else-if="!immersive">
        <DrawerTitle class="sr-only">
          {{ title }}
        </DrawerTitle>
        <DrawerDescription class="sr-only">
          {{ title }}
        </DrawerDescription>
      </template>
      <div class="forum-sidebar-responsive-content" :class="{ 'is-immersive': immersive }">
        <slot :close="close" />
      </div>
    </DrawerContent>
  </Drawer>

  <Popover v-else v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverContent
      side="top"
      :align="align"
      :side-offset="8"
      class="p-2 rounded-xl w-64"
    >
      <slot :close="close" />
    </PopoverContent>
  </Popover>
</template>

<style scoped>
:global(.forum-sidebar-responsive-drawer) {
  max-height: 80dvh;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  overflow: hidden;
}

:global(.forum-sidebar-responsive-drawer.is-immersive) {
  width: min(100%, 760px);
  max-height: calc(100dvh - 24px);
  margin-inline: auto;
  padding-bottom: 0;
  overflow: hidden;
}

.forum-sidebar-responsive-content {
  min-height: 0;
  flex: 0 1 auto;
  overflow-y: auto;
  padding: 0 16px 8px;
  overscroll-behavior: contain;
}

.forum-sidebar-responsive-content.is-immersive {
  flex: 1;
  padding: 0;
  overflow: hidden;
}
</style>
