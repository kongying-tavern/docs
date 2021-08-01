<template>
  <!-- 如果 name 是带协议的图标链接 则通过 style 属性方式渲染 -->
  <figure
    class="svg-icon svg-external-icon"
    v-if="isExt"
    :style="styleExternalIcon"
    v-bind="$attrs"
  ></figure>

  <svg
    v-else
    :class="svgClass"
    aria-hidden="true"
    v-bind="$attrs"
    @click="(e) => $emit('click', e)"
  >
    <use :xlink:href="iconName" />
  </svg>
</template>

<script lang="ts">
import { isExternal } from '../utils'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'SvgIcon',
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      require: true,
    },
    className: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const isExt = computed(() => isExternal(props.name || ''))
    const iconName = computed(() => `#docs-${props.name}`)
    const svgClass = computed(() =>
      props.className ? `svg-icon ${props.className}` : 'svg-icon'
    )

    // 如果name是带协议的图标链接 则通过style css属性方式渲染
    const styleExternalIcon = computed(() => ({
      'mask': `url(${props.name}) no-repeat 50% 50%`,
      '-webkit-mask': `url(${props.name}) no-repeat 50% 50%`,
    }))

    return {
      isExt,
      iconName,
      svgClass,
      styleExternalIcon,
    }
  },
})
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  transition: fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  flex-shrink: 0;
  user-select: none;
  overflow: hidden;
  &:hover {
    transform: scale(1.15);
    transition: transform 0.3s;
  }
}
.svg-external-icon {
  background-color: currentColor;
  mask-size: cover;
  display: inline-block;
  color: inherit;
  font-size: inherit;
  box-sizing: border-box;
  outline: none;
}
</style>
