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

const _props = defineProps<Props>()
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
        class="text-sm p-1 rounded flex gap-1 cursor-pointer items-center hover:bg-muted/50"
        :class="{
          'bg-primary/10 text-primary': selected === node.fullPath,
          'font-medium': node.children.length > 0,
        }"
        @click="handleSelect(node.fullPath)"
      >
        <i
          v-if="node.children.length > 0"
          class="i-lucide-folder text-amber-500 h-3 w-3"
        />
        <i
          v-else
          class="i-lucide-file-text text-blue-500 h-3 w-3"
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
        class="ml-4 pl-2 border-l border-border space-y-1"
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
