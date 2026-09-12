<script setup lang="ts">
defineProps<{
  items: Array<{
    label: string
    icon: string
    href: string
    active: boolean
    username?: string
  }>
}>()
</script>

<template>
  <div class="pb-3 space-y-1">
    <a
      v-for="item in items"
      :key="item.label"
      :href="item.href"
      class="forum-sidebar-link"
      :class="{ active: item.active }"
      :aria-current="item.active ? 'page' : undefined"
      :data-forum-user="item.username"
    >
      <span :class="item.icon" :data-forum-user-avatar="item.username || undefined" aria-hidden="true" />
      <span :data-forum-user-name="item.username || undefined" class="min-w-0 truncate">{{ item.label }}</span>
    </a>
  </div>
</template>

<style scoped>
.forum-sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  padding: 9px 10px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 20px;
}

.forum-sidebar-link:hover,
.forum-sidebar-link.active {
  background: var(--vp-c-default-soft);
}

.forum-sidebar-link.active {
  font-weight: 600;
}
</style>
