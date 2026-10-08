<script setup lang="ts">
defineProps<{
  items: Array<{
    label: string
    icon: string
    href?: string
    active?: boolean
    /** 无 href 的条目渲染为按钮，点击时触发 create */
    action?: boolean
  }>
}>()

defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="pb-3 flex flex-col gap-1">
    <template v-for="item in items" :key="item.label">
      <a
        v-if="item.href"
        data-fluid-hover-item
        :href="item.href"
        class="forum-sidebar-link"
        :class="{ active: item.active }"
        :aria-current="item.active ? 'page' : undefined"
      >
        <span :class="item.icon" aria-hidden="true" />
        <span class="min-w-0 truncate">{{ item.label }}</span>
      </a>
      <button
        v-else
        data-fluid-hover-item
        type="button"
        class="forum-sidebar-link forum-sidebar-action"
        @click="$emit('create')"
      >
        <span :class="item.icon" aria-hidden="true" />
        <span class="min-w-0 truncate">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.forum-sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  border-radius: 8px;
  padding: 9px 10px;
  color: var(--vp-c-text-1);
  @apply text-ui-14;
  @apply leading-ui-20;
}

.forum-sidebar-link.active {
  font-weight: 600;
}

.forum-sidebar-action {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

/* 移动端的创建入口在 VPLocalNav */
@media (max-width: 959px) {
  .forum-sidebar-action {
    display: none;
  }
}
</style>
