<template>
  <div v-html="formattedString"></div>
</template>

<script setup lang="ts">
import { computed, useSlots, h } from 'vue'

const props = defineProps<{ data: string }>()
const slots = useSlots()

const placeholderRegex = /%(\w+)/g

const renderVNodeToHTML = (vnode: any): string => {
  if (!vnode) return ''

  if (typeof vnode === 'string') {
    return vnode // 处理纯字符串
  }

  if (Array.isArray(vnode)) {
    return vnode.map(renderVNodeToHTML).join('') // 递归处理子节点
  }

  if (typeof vnode.type === 'string') {
    const { type, props, children } = vnode
    const propsString = props
      ? Object.entries(props)
          .map(([key, value]) => ` ${key}="${String(value)}"`)
          .join('')
      : ''
    return `<${type}${propsString}>${renderVNodeToHTML(children)}</${type}>`
  }

  if (typeof vnode.type === 'object') {
    // 如果是组件，尝试渲染插槽内容
    return renderVNodeToHTML(vnode.children)
  }

  return ''
}

const formattedString = computed(() => {
  let result = props.data

  return result.replace(placeholderRegex, (match, slotName) => {
    if (slots[slotName]) {
      const slotContent = slots[slotName]()
      return renderVNodeToHTML(slotContent[0]) // 渲染插槽为字符串
    }
    return match // 如果没有对应插槽，返回原占位符
  })
})
</script>
