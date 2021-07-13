<script lang="ts">
import { defineComponent, h } from 'vue'

import type { VNode } from 'vue'

export default defineComponent({
  name: 'Spinner',
  setup() {
    return (): VNode => h('div', { class: 'docs-spinner' })
  },
})
</script>

<style lang="scss" scoped>
$n: 32;
$degPerSeg: 360 / $n;
$gradient: '';

@for $i from 1 through $n {
  @if $i != 1 {
    $gradient: $gradient + ', ';
  }

  $gradient: $gradient +
    'hsl(' +
    (360 * ($i - 1) / ($n - 1)) +
    ', 80%, 55%) ' +
    (($i - 1) * $degPerSeg) +
    'deg ' +
    ($i * $degPerSeg) +
    'deg';
}

.docs-spinner {
  width: 400px;
  height: 400px;
  border-radius: 999px;

  // Fallback
  background: green;
  // Apply the gradient
  background-image: conic-gradient(unquote($gradient));
}
</style>
