import type { ComputedRef, Ref } from 'vue'
import { computed, shallowRef, watch } from 'vue'

export function useOptimistic<TState, TOptimisticValue>(
  state: Ref<TState>,
  updateFn: (current: TState, value: TOptimisticValue) => TState,
): [
  optimisticState: ComputedRef<TState>,
  addOptimistic: (value: TOptimisticValue) => { rollback: () => void },
  ] {
  const pendingQueue = shallowRef<
    Array<{
      value: TOptimisticValue
      version: number
    }>
  >([])

  let stateVersion = 0

  watch(state, () => {
    stateVersion++
    pendingQueue.value = []
  })

  const optimisticState = computed(() => {
    return pendingQueue.value.reduce(
      (acc, { value }) => updateFn(acc, value),
      state.value,
    )
  })

  const addOptimistic = (value: TOptimisticValue) => {
    const currentVersion = stateVersion
    const newEntry = { value, version: currentVersion }

    pendingQueue.value = [...pendingQueue.value, newEntry]

    return {
      rollback: () => {
        if (currentVersion === stateVersion) {
          pendingQueue.value = pendingQueue.value.filter(
            entry => entry !== newEntry,
          )
        }
      },
    }
  }

  return [optimisticState, addOptimistic]
}
