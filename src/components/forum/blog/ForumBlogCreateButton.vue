<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useBlogOperations } from '~/components/blog/composables/useBlogOperations'

// 博客管理功能
const { canManageBlog } = useBlogOperations()

// 新建博客
function newBlog() {
  window.location.href = '/blog/editor'
}
</script>

<template>
  <Button
    v-if="canManageBlog"
    variant="default"
    size="default"
    @click="newBlog"
  >
    <span class="i-lucide-plus h-4 w-4" />
    新建博客
  </Button>
</template>
