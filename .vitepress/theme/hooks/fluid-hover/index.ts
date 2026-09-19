/**
 * Fluid hover: hover that never blinks and always follows the cursor to the nearest item.
 *
 * One shared highlight per container, picked by a pure nearest-center rule so gaps, padding and
 * the space past the last row have no dead zone. Behavior reference: Fluid Functionalism's fluid
 * hover; architecture (framework-agnostic core + thin composable): guillemservera/details.
 *
 * Usage — the container is `position: relative`, the indicator absolute at its padding corner:
 *
 * ```vue
 * <script setup lang="ts">
 * import { useFluidHover, useFluidHoverIndicator } from '@/hooks/fluid-hover'
 *
 * const container = ref<HTMLElement | null>(null)
 * const indicator = ref<HTMLElement | null>(null)
 * useFluidHover(container, { axis: 'y' })
 * useFluidHoverIndicator(container, indicator, { motion: 'fast' })
 * </script>
 *
 * <template>
 *   <div ref="container" class="relative">
 *     <div
 *       ref="indicator"
 *       class="pointer-events-none absolute left-0 top-0 rounded bg-black/5"
 *     />
 *     <button v-for="item in items" :key="item.id" data-fluid-hover-item>
 *       {{ item.label }}
 *     </button>
 *   </div>
 * </template>
 * ```
 */
export { ACTIVE_ATTR, CONTAINER_ATTR, ITEM_ATTR } from './constants'
export type { FluidHoverAxis, ItemRect } from './geometry'
export { useFluidHover, type UseFluidHoverReturn } from './useFluidHover'
export {
  useFluidHoverIndicator,
  type UseFluidHoverIndicatorReturn,
} from './useFluidHoverIndicator'
