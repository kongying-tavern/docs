<script setup lang="ts">
import qqGroups from '~/_data/qq-groups.json'

interface QQGroup {
  id: string
  name: string
  number: string
  link: string
  status: 'suggest' | 'warning' | 'banned' | 'normal'
  tooltip: string
}

const groups: QQGroup[] = qqGroups

function getGroupClass(status: string): string {
  return `qq-group qq-group--${status}`
}
</script>

<template>
  <ul class="qq-groups-list">
    <li
      v-for="group in groups"
      :key="group.id"
      :class="getGroupClass(group.status)"
      :data-status="group.status"
    >
      <a :href="group.link" :title="group.tooltip">
        <strong>{{ group.name }} {{ group.number }}</strong>
      </a>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
@use '../../components/links/Community.scss';
@include Community.main;
</style>
