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
// 推荐群
.qq-group--suggest > a strong::after {
  display: inline-block;
  margin-left: 6px;
  border-radius: 12px;
  padding: 0 6px;
  line-height: 22px;
  font-size: 12px;
  font-weight: 500;
  border-color: var(--vp-badge-tip-border);
  transform: translateY(-2px);
  color: rgb(235, 235, 235);
  background-color: #60bf90bd;
  content: '推荐';
}

// 已满群
.qq-group--warning > a strong::after {
  display: inline-block;
  margin-left: 6px;
  border-radius: 12px;
  padding: 0 6px;
  line-height: 22px;
  font-size: 12px;
  font-weight: 500;
  border-color: var(--vp-badge-tip-border);
  transform: translateY(-2px);
  color: var(--vp-badge-warning-text);
  background-color: var(--vp-badge-warning-bg);
  content: '已满';
}

// 被封禁的群
.qq-group--banned > a strong::after {
  display: inline-block;
  margin-left: 6px;
  border-radius: 12px;
  padding: 0 6px;
  line-height: 22px;
  font-size: 12px;
  font-weight: 500;
  border-color: var(--vp-badge-tip-border);
  transform: translateY(-2px);
  color: var(--vp-badge-info-text);
  background-color: var(--vp-badge-info-bg);
  content: '被封禁';
}

.qq-group--banned,
.qq-group--banned > a strong,
.qq-group--banned > a {
  cursor: no-drop;
  color: var(--vp-c-text-2);
  box-shadow: none !important;
  transform: none !important;
  border: none !important;
}

ul,
.qq-groups-list {
  display: inherit;
  padding: 0;
  display: flex;
  flex-direction: column;

  li {
    cursor: pointer;
    display: inline-block;
    margin: 10px 0;
    width: 100%;
    height: 52px;
    font-size: 16px;
    border-radius: 8px;
    transition: border 0.1s;
    text-align: right;
    line-height: 24px;
    background-color: var(--vp-c-bg-soft);
    font-family: var(--vp-font-family-subtitle);
    border: 1px transparent solid;

    a {
      display: inline-block;
      position: relative;
      width: 100%;
      height: 100%;
      opacity: 0.95;
      padding: 14px 16px;
      box-sizing: border-box;
      transition: all 0.25s ease;
      text-decoration: none !important;
      color: var(--vp-c-brand-2);
      strong {
        position: absolute;
        left: 25px;
      }
      &:hover {
        opacity: 1;
      }
    }
    &:hover {
      border: 1px var(--vp-c-brand-2) solid;
    }
  }
}
</style>
