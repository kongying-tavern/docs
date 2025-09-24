<script setup lang="ts">
interface TreeNode {
  name: string
  fullPath: string
  children: TreeNode[]
  isLeaf: boolean
}

interface Props {
  tree: TreeNode[]
  selected?: string
}

interface Emits {
  (e: 'select', path: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleSelect(path: string) {
  emit('select', path)
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="node in tree"
      :key="node.fullPath"
      class="space-y-1"
    >
      <!-- 节点本身 -->
      <div
        class="flex cursor-pointer items-center gap-1 rounded p-1 text-sm hover:bg-muted/50"
        :class="{
          'bg-primary/10 text-primary': selected === node.fullPath,
          'font-medium': node.children.length > 0,
        }"
        @click="handleSelect(node.fullPath)"
      >
        <i
          v-if="node.children.length > 0"
          class="i-lucide-folder h-3 w-3 text-amber-500"
        />
        <i
          v-else
          class="i-lucide-file-text h-3 w-3 text-blue-500"
        />
        <span>{{ node.name }}</span>
        <span
          v-if="node.children.length > 0"
          class="text-xs text-muted-foreground"
        >
          ({{ node.children.length }})
        </span>
      </div>

      <!-- 子节点 -->
      <div
        v-if="node.children.length > 0"
        class="ml-4 border-l border-border pl-2 space-y-1"
      >
        <KeyTreeView
          :tree="node.children"
          :selected="selected"
          @select="handleSelect"
        />
      </div>
    </div>
  </div>
</template>
