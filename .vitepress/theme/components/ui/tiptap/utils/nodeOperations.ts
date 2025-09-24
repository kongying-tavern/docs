import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/vue-3'

export interface EditorNode {
  id: string
  name: string
  type: string
  icon: string
  content: string
  position: number
  nodeSize: number
  selected: boolean
  depth: number
}

// 节点类型配置映射
export const NODE_TYPE_CONFIG = {
  paragraph: { name: 'Paragraph', icon: 'i-mdi:format-paragraph' },
  heading: { name: 'Heading', icon: 'mdi:format-header' },
  bulletList: { name: 'Bullet List', icon: 'i-mdi:format-list-bulleted' },
  orderedList: { name: 'Numbered List', icon: 'i-mdi:format-list-numbered' },
  listItem: { name: 'List Item', icon: 'i-mdi:minus-circle-outline' },
  blockquote: { name: 'Quote', icon: 'i-mdi:format-quote-close' },
  horizontalRule: { name: 'Divider', icon: 'i-mdi:minus' },
  image: { name: 'Image', icon: 'i-mdi:image' },
  codeBlock: { name: 'Code Block', icon: 'i-mdi:code-tags' },
  component: { name: 'Component', icon: 'i-mdi:puzzle-outline' },
} as const

export function getNodeDisplayInfo(node: ProseMirrorNode, pos: number) {
  let nodeId: string
  let nodeName: string
  let nodeIcon: string

  if (node.type.name === 'component') {
    nodeId = node.attrs.id || `component-${pos}`
    nodeName = node.attrs.componentName
    nodeIcon = NODE_TYPE_CONFIG.component.icon
  }
  else if (node.type.name === 'heading') {
    const level = node.attrs.level
    nodeId = `${node.type.name}-${pos}`
    nodeName = `Heading ${level}`
    nodeIcon = `i-mdi:format-header-${level}`
  }
  else {
    const config = NODE_TYPE_CONFIG[node.type.name as keyof typeof NODE_TYPE_CONFIG]
    nodeId = `${node.type.name}-${pos}`
    nodeName = config?.name || node.type.name
    nodeIcon = config?.icon || 'i-mdi:code-braces'
  }

  return { nodeId, nodeName, nodeIcon }
}

export function getTextContentPreview(node: ProseMirrorNode): string {
  let text = ''

  if ('descendants' in node && typeof node.descendants === 'function') {
    node.descendants((child: ProseMirrorNode) => {
      if (child.isText) {
        text += child.text
      }
    })
  }

  if (text.length > 25) {
    text = `${text.substring(0, 25)}...`
  }

  return text || 'Empty'
}

export function getNodeDepth(editor: Editor, pos: number): number {
  let depth = 0
  const node = editor.state.doc.resolve(pos)

  for (let i = 1; i <= node.depth; i++) {
    const parent = node.node(i)
    if (!parent.isText && !parent.isInline) {
      depth++
    }
  }

  return depth
}

export function findNodePositionById(editor: Editor, id: string): { from: number, to: number } | null {
  let result: { from: number, to: number } | null = null

  editor.state.doc.descendants((node, pos) => {
    if (node.attrs.id === id || `${node.type.name}-${pos}` === id) {
      result = { from: pos, to: pos + node.nodeSize }
      return false // Stop traversal
    }
  })

  return result
}

export function deleteNodeById(editor: Editor, id: string): boolean {
  const nodePos = findNodePositionById(editor, id)
  if (nodePos === null) {
    return false
  }

  try {
    const tr = editor.state.tr
    const { from, to } = nodePos
    tr.delete(from, to)
    editor.view.dispatch(tr)
    return true
  }
  catch (error) {
    console.error('Error deleting node:', error)
    return false
  }
}

export function duplicateNodeById(editor: Editor, id: string): boolean {
  const nodePos = findNodePositionById(editor, id)
  if (nodePos === null) {
    return false
  }

  try {
    const { from, to } = nodePos
    const slice = editor.state.doc.slice(from, to)
    const tr = editor.state.tr
    tr.insert(to, slice.content)
    editor.view.dispatch(tr)
    return true
  }
  catch (error) {
    console.error('Error duplicating node:', error)
    return false
  }
}

export function reorderNodes(
  editor: Editor,
  { sourceId, targetId, position }: { sourceId: string, targetId: string, position: 'before' | 'after' },
): boolean {
  const sourcePos = findNodePositionById(editor, sourceId)
  const targetPos = findNodePositionById(editor, targetId)

  if (!sourcePos || !targetPos) {
    console.error('Could not find source or target node')
    return false
  }

  try {
    const sourceNode = editor.state.doc.slice(sourcePos.from, sourcePos.to)
    let tr = editor.state.tr.delete(sourcePos.from, sourcePos.to)

    let insertPos = position === 'before' ? targetPos.from : targetPos.to
    if (sourcePos.from < targetPos.from) {
      insertPos -= (sourcePos.to - sourcePos.from)
    }

    tr = tr.insert(insertPos, sourceNode.content)
    editor.view.dispatch(tr)
    return true
  }
  catch (error) {
    console.error('Error reordering nodes:', error)
    return false
  }
}
