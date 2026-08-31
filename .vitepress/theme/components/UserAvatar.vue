<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { ASSET_ORIGIN } from '~/constants/site'

const {
  src = `${ASSET_ORIGIN}/res_ext/avatar/UI_AvatarIcon_71045_Circle.png`,
  alt,
  size = 'sm',
} = defineProps<{ src?: string, alt?: string, size?: string }>()

const { message } = useLocalized()

const displayAlt = computed(() => alt || message.value.forum.labels.login)
</script>

<template>
  <KeepAlive>
    <Avatar :src="src" :alt="displayAlt" :size="size" v-bind="$attrs" />
  </KeepAlive>
</template>
