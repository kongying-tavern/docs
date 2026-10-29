<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Avatar from '@/components/ui/Avatar.vue'
import { ASSET_ORIGIN } from '~/constants/site'

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
