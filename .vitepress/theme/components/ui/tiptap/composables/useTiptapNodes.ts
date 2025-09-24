import type { Editor } from '@tiptap/vue-3'
import type { ComputedRef } from 'vue'
import type { EditorNode } from '../utils/nodeOperations'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import {
  deleteNodeById,
  duplicateNodeById,
  findNodePositionById,
  getNodeDepth,
  getNodeDisplayInfo,
  getTextContentPreview,
  reorderNodes as reorderNodesUtil,
} from '../utils/nodeOperations'

export function useTiptapNodes(editor: ComputedRef<Editor | undefined>) {
  const editorNodes = ref<EditorNode[]>([])
  const selectedNodeId = ref('')

  // 节点更新防抖处理
  const debouncedUpdateNodes = useDebounceFn(() => {
    updateEditorNodes()
  }, 250, { maxWait: 1000 })

  function updateEditorNodes() {
    if (!editor.value) {
      return
    }

    if (editor.value.isEmpty) {
      editorNodes.value = []
      return
    }

    const nodes: EditorNode[] = []

    editor.value.state.doc.descendants((node, pos) => {
      if (node.isText) {
        return
      }

      const { nodeId, nodeName, nodeIcon } = getNodeDisplayInfo(node, pos)
      let nodeContent = ''
      let depth = 0

      if (node.type.name === 'component') {
        depth = getNodeDepth(editor.value!, pos)
      }
      else {
        switch (node.type.name) {
          case 'paragraph':
          case 'heading':
          case 'listItem':
          case 'blockquote':
            nodeContent = getTextContentPreview(node)
            depth = getNodeDepth(editor.value!, pos)
            if (node.type.name === 'listItem') {
              depth += 1 // Indent list items
            }
            break
          default:
            depth = getNodeDepth(editor.value!, pos)
        }
      }

      if (!node.isInline) {
        nodes.push({
          id: nodeId,
          name: nodeName,
          type: node.type.name,
          icon: nodeIcon,
          content: nodeContent,
          position: pos,
          nodeSize: node.nodeSize,
          selected: nodeId === selectedNodeId.value,
          depth,
        })
      }
    })

    editorNodes.value = nodes
  }

  function selectNode(id: string) {
    if (!editor.value) {
      return
    }

    selectedNodeId.value = id

    const nodePos = findNodePositionById(editor.value, id)
    if (nodePos !== null) {
      const { from } = nodePos
      editor.value.chain().focus().setNodeSelection(from).run()
    }
  }

  function deleteNode(id: string): boolean {
    if (!editor.value) {
      return false
    }

    const success = deleteNodeById(editor.value, id)
    if (success) {
      updateEditorNodes()
      if (selectedNodeId.value === id) {
        selectedNodeId.value = ''
      }
    }
    return success
  }

  function duplicateNode(id: string): boolean {
    if (!editor.value) {
      return false
    }

    const success = duplicateNodeById(editor.value, id)
    if (success) {
      updateEditorNodes()
    }
    return success
  }

  function reorderNodes(params: { sourceId: string, targetId: string, position: 'before' | 'after' }): boolean {
    if (!editor.value) {
      return false
    }

    const success = reorderNodesUtil(editor.value, params)
    if (success) {
      updateEditorNodes()
    }
    return success
  }

  // 监听编辑器变化
  watch(() => editor.value, (newEditor) => {
    if (newEditor) {
      updateEditorNodes()

      // 监听编辑器内容变化
      newEditor.on('update', () => {
        debouncedUpdateNodes()
      })
    }
  }, { immediate: true })

  // 监听编辑器HTML内容变化
  watch(() => editor.value?.getHTML(), () => {
    if (editor.value) {
      updateEditorNodes()
    }
  }, { immediate: true })

  return {
    editorNodes: computed(() => editorNodes.value),
    selectedNodeId,
    updateEditorNodes,
    selectNode,
    deleteNode,
    duplicateNode,
    reorderNodes,
  }
}
