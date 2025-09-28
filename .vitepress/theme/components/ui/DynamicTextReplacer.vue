<script setup lang="ts">
import type { HTMLAttributes, VNode, VNodeNormalizedChildren } from 'vue'
import { computed, Text, toRaw, useSlots } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const { tag = 'p', data } = defineProps<{
  data: string
  tag?: string
  class?: HTMLAttributes['class']
}>()

const slots = useSlots()

const placeholderRegex = /%(\w+)/g

function renderVNodeToHTML(vnode: VNode | VNode[] | string | number | boolean | null | undefined): string {
  if (!vnode || typeof vnode === 'boolean') {
    return ''
  }

  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return String(vnode)
  }

  if (Array.isArray(vnode)) {
    return vnode.map(renderVNodeToHTML).join('')
  }

  // Handle VNode objects
  if (typeof vnode === 'object' && vnode !== null) {
    const rawVNode = toRaw(vnode)

    // Handle text nodes - check for reactive text content
    if (rawVNode.type === Text) {
      return String(rawVNode.children || '')
    }

    // Handle HTML elements
    if (typeof rawVNode.type === 'string') {
      const { type, props, children } = rawVNode
      const safeProps = props
        ? Object.fromEntries(
            Object.entries(props)
              .filter(([key, value]) => value != null && key !== 'innerHTML' && key !== 'textContent')
              .map(([key, value]) => [key, String(value).replace(/["&<>]/g, (char) => {
                const entities: Record<string, string> = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }
                return entities[char] || char
              })]),
          )
        : {}

      const propsString = Object.entries(safeProps)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('')

      const childrenContent = renderVNodeChildren(children)
      return `<${type}${propsString}>${childrenContent}</${type}>`
    }

    // Handle component VNodes or fragments
    if (typeof rawVNode.type === 'object' || typeof rawVNode.type === 'function' || rawVNode.type === Symbol.for('v-fgt')) {
      return renderVNodeChildren(rawVNode.children)
    }
  }

  return ''
}

function renderVNodeChildren(children: VNodeNormalizedChildren): string {
  if (!children) {
    return ''
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children
      .map((child) => {
        // Handle nested arrays recursively
        if (Array.isArray(child)) {
          return renderVNodeChildren(child)
        }
        // Filter out falsy values that shouldn't be rendered
        if (child === null || child === undefined || child === false || child === true) {
          return ''
        }
        return renderVNodeToHTML(child)
      })
      .filter(Boolean)
      .join('')
  }

  // Handle slot children (object case)
  if (typeof children === 'object') {
    // For slot objects, try to render the default slot
    if ('default' in children && typeof children.default === 'function') {
      const defaultSlot = children.default()
      return Array.isArray(defaultSlot) ? defaultSlot.map(renderVNodeToHTML).join('') : ''
    }

    // Handle the case where children is a single VNode object
    return renderVNodeToHTML(children as VNode)
  }

  return ''
}

const formattedString = computed(() => {
  const result = data || ''

  return result.replace(placeholderRegex, (match, slotName) => {
    try {
      const slotFunction = slots[slotName]
      if (slotFunction && typeof slotFunction === 'function') {
        const slotContent = slotFunction()
        if (slotContent && slotContent.length > 0) {
          const rendered = renderVNodeToHTML(slotContent[0])
          return rendered
        }
      }
    }
    catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to render slot "${slotName}":`, error)
      }
    }
    return match
  })
})
</script>

<template>
  <ClientOnly>
    <!-- eslint-disable vue/no-v-text-v-html-on-component -->
    <component
      :is="tag"
      :class="cn('font-size-3.5 line-height-[24px] color-[--vp-c-text-3] break-keep', $props.class)"
      v-html="formattedString"
    />
  </ClientOnly>
</template>
