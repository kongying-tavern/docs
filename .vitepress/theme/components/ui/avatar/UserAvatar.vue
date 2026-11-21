<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ASSET_ORIGIN } from '@/src/constants/site.ts'
import Avatar from './Avatar.vue'

const {
  src = `${ASSET_ORIGIN}/res_ext/avatar/UI_AvatarIcon_71045_Circle.png`,
  alt,
  size = 'sm',
} = defineProps<{ src?: string, alt?: string, size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>()

const { t } = useI18n({ useScope: 'global' })

const displayAlt = computed(() => alt || t('forum.labels.login'))
</script>

<template>
  <KeepAlive>
    <Avatar :src="src" :alt="displayAlt" :size="size" v-bind="$attrs" />
  </KeepAlive>
</template>
