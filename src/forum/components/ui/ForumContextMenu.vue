<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { defineTopicDropdownMenu } from '~/forum/composables/util/defineTopicDropdownMenu'
import ForumMenuContext from './ForumMenuContext.vue'

const { menu = [], topicData, class: className } = defineProps<{
  topicData: ForumAPI.Topic
  class?: HTMLAttributes['class']
  menu?: FORUM.TopicDropdownMenu[]
}>()

const { t } = useI18n({ useScope: 'global' })
// 与「更多操作」三点菜单同源：菜单项直接复用 defineTopicDropdownMenu，
// 避免在 bento 上重复实现一套话题操作
const providerMenu = defineTopicDropdownMenu(() => topicData, t)
const items = computed(() => [...menu, ...providerMenu.value])
</script>

<template>
  <ForumMenuContext :menu="items" :class="className">
    <slot />
    <template #menu>
      <slot name="menu" />
    </template>
  </ForumMenuContext>
</template>
