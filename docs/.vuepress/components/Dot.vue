<script lang="ts">
import { defineComponent, h } from 'vue'

import type { VNode } from 'vue'

export default defineComponent({
  name: 'Dot',
  setup() {
    return (): VNode => h('dot', { class: 'docs-dot' })
  },
})
</script>

<style lang="scss" scoped>
dot {
  display: inline-block;
  height: 1em;
  line-height: 1;
  text-align: left;
  vertical-align: -0.25ex;
  overflow: hidden;
  &::before {
    display: block;
    content: '...\A..\A.';
    white-space: pre-wrap;
    animation: dot 2s infinite step-start both;
  }
}

@keyframes dot {
  33% {
    transform: translateY(-2em);
  }
  66% {
    transform: translateY(-1em);
  }
}
</style>
