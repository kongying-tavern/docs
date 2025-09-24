<script setup lang="ts">
import type { DropdownMenuContentProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import type { FORUM } from '../types'
import type { EnhancedBlogPost } from '~/components/blog/composables/useBlogData'
import { computed } from 'vue'
import { useData } from 'vitepress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import ForumDropdownMenu from '../ForumDropdownMenu.vue'
import { useBlogDropdownMenu } from './composables/useBlogDropdownMenu'

defineOptions({
  inheritAttrs: false,
})

const { side = 'bottom', menu = [], blogPost, isInEditor = false } = defineProps<
  {
    blogPost: EnhancedBlogPost
    class?: HTMLAttributes['class']
    menu?: FORUM.TopicDropdownMenu[]
    isInEditor?: boolean
  } & DropdownMenuContentProps
>()

const { theme } = useData()

const blogMenuData = useBlogDropdownMenu(blogPost, { isInEditor })

const {
  dropdownMenu,
  showDeleteDialog,
  confirmDelete,
  cancelDelete,
} = blogMenuData
</script>

<template>
  <DropdownMenu v-if="[...menu, ...dropdownMenu].length > 0">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="cn('blog-btn-more align-mid h-auto', $props.class)"
      >
        <slot name="trigger">
          <span class="i-lucide-ellipsis icon-btn bg-[var(--vp-c-text-3)]" />
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" :side="side" class="w-max text-nowrap">
      <slot name="menu" />
      <ForumDropdownMenu :items="[...menu, ...dropdownMenu]" />
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- Delete Confirmation Alert Dialog -->
  <Teleport to="body">
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent class="max-w-[clamp(30vw,400px,90vw)] rounded-md">
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除《{{ blogPost.title }}》吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            class="border-color-[var(--vp-c-divider)] important:border-width-1 important:border-style-solid"
            @click="cancelDelete"
          >
            {{ theme.ui.button.cancel }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700"
            @click="confirmDelete"
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Teleport>
</template>
