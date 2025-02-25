<script setup lang="ts">
const {
  src = 'https://assets.yuanshen.site/res_ext/avatar/UI_AvatarIcon_71045_Circle.png',
  alt = '登录',
  size = 'sm',
} = defineProps<{ src?: string, alt?: string, size?: string }>()
</script>

<template>
  <KeepAlive>
    <Avatar :src="src" :alt="alt" :size="size" v-bind="$attrs" />
  </KeepAlive>
</template>
