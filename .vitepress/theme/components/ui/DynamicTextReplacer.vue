<template>
  <ClientOnly>
    <component
      :is="tag"
      v-html="formattedString"
      v-bind="$slots"
      :class="class"
    >
    </component>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  data: {
    type: String,
  },
  tag: {
    type: String,
    default: 'p',
  },
  class: {
    type: String,
    default:
      'font-size-3.5 line-height-[24px] color-[--vp-c-text-3] break-keep',
  },
})

const slots = useSlots() as Record<string, () => any>

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
  const result = props.data || ''

  return result.replace(placeholderRegex, (match, slotName) => {
    if (slots[slotName]) {
      const slotContent = slots[slotName]()
      return renderVNodeToHTML(slotContent[0]) // 渲染插槽为字符串
    }
    return match // 如果没有对应插槽，返回原占位符
  })
})
</script>
