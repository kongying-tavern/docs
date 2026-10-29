<script setup lang="ts">
import type { StaffListItem } from './types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import staffCommunity from './staff-community.json'
import staffPin from './staff-pin.json'
import staffTranslate from './staff-translate.json'
import StaffList from './StaffList.vue'

const { t } = useI18n({ useScope: 'global' })
const staffList = computed<StaffListItem[]>(() => [
  {
    id: 'translate',
    label: t('staff.translateStaff.title'),
    members: staffTranslate,
  },
  {
    id: 'community',
    label: t('staff.communityStaff.title'),
    members: staffCommunity,
  },
  {
    id: 'pin',
    label: t('staff.pinStaff.title'),
    members: staffPin,
  },
])
</script>

<template>
  <div class="StaffPage">
    <StaffList :list="staffList" :title="t('staff.title')" :desc="t('staff.desc')" />
  </div>
</template>

<style scoped>
.StaffPage {
  position: relative;
  padding-bottom: 16px;
}

@media (min-width: 768px) {
  .StaffPage {
    padding-bottom: 96px;
  }
}

.StaffList + .StaffList {
  padding-top: 64px;
}
</style>
