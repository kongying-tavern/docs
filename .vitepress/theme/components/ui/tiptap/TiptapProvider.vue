<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted } from 'vue'
import { provideTiptapContext } from '.'
import { useTiptapMetadata } from './composables/useTiptapMetadata'
import { useTiptapNodes } from './composables/useTiptapNodes'

const props = defineProps<{
  editor: Editor | undefined
}>()

// State management for the Tiptap context
const sidebarVisible = defineModel('sidebarVisible', { default: true })

// Editor computed ref for composables
const editor = computed(() => props.editor)

// Use composables for separated concerns
const {
  editorNodes,
  selectedNodeId,
  updateEditorNodes,
  selectNode,
  deleteNode,
  duplicateNode,
  reorderNodes,
} = useTiptapNodes(editor)

const {
  metadata,
  updateMetadata,
} = useTiptapMetadata(editor)

// History management
const canUndo = computed(() => props.editor?.can().undo() ?? false)
const canRedo = computed(() => props.editor?.can().redo() ?? false)

// Toggle sidebar visibility
function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

// Provide context to child components
provideTiptapContext({
  editor,
  editorNodes,
  sidebarVisible,
  selectedNodeId,
  toggleSidebar,
  selectNode,
  deleteNode,
  duplicateNode,
  reorderNodes,
  updateEditorNodes,
  canUndo,
  canRedo,
  metadata,
  updateMetadata,
})

// Initialize when component mounts
onMounted(() => {
  if (props.editor) {
    updateEditorNodes()
    updateMetadata()
  }
})
</script>

<template>
  <div data-slot="tiptap-provider">
    <slot />
  </div>
</template>
