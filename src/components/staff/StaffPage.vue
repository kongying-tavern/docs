<script setup lang="ts">
import type { StaffListItem } from './types'
import { useLocalized } from '@/hooks/useLocalized'
import staffCommunity from './staff-community.json'
import staffPin from './staff-pin.json'
import staffTranslate from './staff-translate.json'
import StaffList from './StaffList.vue'

const { message } = useLocalized()
const staffList: StaffListItem[] = [
  {
    id: 'translate',
    label: message.value.staff.translateStaff.title,
    members: staffTranslate,
  },
  {
    id: 'community',
    label: message.value.staff.communityStaff.title,
    members: staffCommunity,
  },
  {
    id: 'pin',
    label: message.value.staff.pinStaff.title,
    members: staffPin,
  },
]
</script>

<template>
  <div class="StaffPage">
    <StaffList :list="staffList" :title="message.staff.title" :desc="message.staff.desc" />
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
