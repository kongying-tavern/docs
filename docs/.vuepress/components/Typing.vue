<script lang="ts">
import { defineComponent, h } from 'vue'

import type { VNode } from 'vue'

export default defineComponent({
  name: 'Typing',
  setup() {
    return (): VNode =>
      h(
        'p',
        { class: 'docs-typing-wrapper' },
        h('span', { class: 'docs-typing' }, 'Hello world')
      )
  },
})
</script>

<style lang="scss" scoped>
.docs-typing-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  .docs-typing {
    width: 100%;
    animation: typing 2s steps(22), blink 0.5s step-end infinite alternate;
    white-space: nowrap;
    overflow: hidden;
    border-right: 3px solid;
    font-family: monospace;
    font-size: 2em;
  }
}
@keyframes typing {
  from {
    width: 0;
  }
}

@keyframes blink {
  50% {
    border-color: transparent;
  }
}
</style>
