<template>
  <KeepAlive>
    <Avatar :src="renderSrc" :alt="alt" :size="size" v-bind="$attrs" />
  </KeepAlive>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { avatarList, avatarBaseURl } from '@/composables/avatarList'
import { sample } from 'lodash-es'
const {
  src = 'https://assets.yuanshen.site/res_ext/avatar/UI_AvatarIcon_71045_Circle.png',
  alt = '登录',
  size = 'sm',
} = defineProps<{ src?: string; alt?: string; size?: string }>()

const renderSrc = computed(() => {
  if (src === 'https://gitee.com/assets/no_portrait.png')
    return avatarBaseURl + sample(avatarList)
  return src
})
</script>
