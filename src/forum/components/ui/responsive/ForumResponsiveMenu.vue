<script setup lang="ts">
import type { DropdownMenuContentProps } from 'reka-ui'
import type { FORUM } from '../types'
import { useMediaQuery } from '@vueuse/core'
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { prefetchForumUiBranch } from './shared'

const props = withDefaults(defineProps<{
  items?: FORUM.TopicDropdownMenu[]
  /** 抽屉标题，缺省取「更多操作」 */
  title?: string
  side?: DropdownMenuContentProps['side']
  align?: DropdownMenuContentProps['align']
  /** 空菜单时不渲染整个触发器 */
  disabled?: boolean
}>(), {
  items: () => [],
  side: 'bottom',
  disabled: false,
})
defineSlots<{
  /** 触发按钮（完整按钮元素），桌面与移动端共用同一份标记 */
  trigger: () => unknown
  /** 内容前置行，如调用方自定义的菜单项 */
  menu: () => unknown
}>()
const ForumMenuDesktop = defineAsyncComponent(() => import('./ForumMenuDesktop.vue'))
const ForumMenuMobileDrawer = defineAsyncComponent(() => import('./ForumMenuMobileDrawer.vue'))

const { message } = useLocalized()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)

const hasItems = computed(() => (props.items?.length ?? 0) > 0)
const drawerTitle = computed(() => props.title ?? message.value.forum.topic.menu.moreActions)

onMounted(() => {
  prefetchForumUiBranch(isMobile.value
    ? () => import('./ForumMenuMobileDrawer.vue')
    : () => import('./ForumMenuDesktop.vue'))
})
</script>

<template>
  <ForumMenuDesktop
    v-if="!disabled && hasItems && !isMobile"
    :items="props.items"
    :side="side"
    :align="align"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #menu>
      <slot name="menu" />
    </template>
  </ForumMenuDesktop>

  <ForumMenuMobileDrawer
    v-else-if="!disabled && hasItems"
    :items="props.items"
    :title="drawerTitle"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #menu>
      <slot name="menu" />
    </template>
  </ForumMenuMobileDrawer>
</template>
