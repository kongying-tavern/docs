<script setup lang="ts">
import { useData } from 'vitepress'
import StaffHero from './StaffHero.vue'
import StaffList from './StaffList.vue'
import staffTranslate from './staff-translate.json'
import staffPin from './staff-pin.json'
// import staffClient from './staff-client.json'
// import staffWeb from './staff-web.json'
import staffCommunity from './staff-community.json'
import type { Member } from './Member'
const { theme } = useData()
</script>

<template>
  <div class="StaffPage">
    <StaffHero>
      <template #title>{{ theme.staff.title }}</template>
      <template #lead>
        <span class="nowrap">{{ theme.staff.desc }}</span>
      </template>
    </StaffHero>

    <StaffList :members="staffTranslate as Member[]">
      <template #title>{{ theme.staff.translateStaff.title }}</template>
    </StaffList>
    <StaffList :members="staffCommunity as Member[]">
      <template #title>{{ theme.staff.communityStaff.title }} </template>
    </StaffList>
    <StaffList :members="staffPin as Member[]">
      <template #title>{{ theme.staff.pinStaff.title }}</template>
    </StaffList>
    <!--<StaffList :members="staffClient as Member[]">
      <template #title>{{ theme.staff.clientStaff.title }}</template>
    </StaffList>
    <StaffList :members="staffWeb as Member[]">
      <template #title>{{ theme.staff.webStaff.title }}</template>
    </StaffList> -->
  </div>
</template>

<style scoped>
.StaffPage {
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
