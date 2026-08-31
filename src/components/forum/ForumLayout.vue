<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

// 论坛页内容动态插入（评论/回复区展开）会触发浏览器滚动锚定自动调整滚动位置，
// 导致页面无意义跳动；论坛页挂载期间禁用，离开时恢复
onMounted(() => {
  document.documentElement.style.overflowAnchor = 'none'
})

onBeforeUnmount(() => {
  document.documentElement.style.overflowAnchor = ''
})
</script>

<template>
  <div class="forum-container relative">
    <slot name="header" />
    <div class="forum-columns mt-4">
      <main class="forum-content min-h-[calc(100vh-64px)]">
        <slot name="content" />

        <slot />
      </main>

      <aside class="forum-aside">
        <slot name="aside" />
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.forum-container {
  margin: 0 auto;
  padding: 0 16px;
}

.forum-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: 24px;
}

.forum-content {
  min-width: 0;
}

/* align-self: end 提供列内上移余量，sticky bottom 才有吸附行程 */
.forum-aside {
  position: sticky;
  bottom: 20dvh;
  align-self: end;
  overflow-x: hidden;
}

@media (min-width: 1440px) {
  .forum-container {
    width: min(1013px, 100%);
    margin: 0 auto;
    padding: 0;
  }
}

@media (min-width: 1280px) and (max-width: 1439px) {
  .forum-columns {
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 16px;
  }
}

@media (max-width: 1279px) {
  .forum-columns {
    display: block;
  }

  .forum-content {
    width: 100%;
  }

  .forum-aside {
    display: none;
  }
}
</style>
