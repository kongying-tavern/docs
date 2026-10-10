import type { AsyncComponentLoader, Component } from 'vue'
import { defineAsyncComponent, defineComponent, h, shallowRef } from 'vue'
import AsyncContentLoading from './AsyncContentLoading.vue'

const LOAD_TIMEOUT_MS = 15_000

/** Keep the original props/ref forwarding, including close handlers during failure. */
export function defineRecoverableAsyncComponent<T extends Component>(
  loader: AsyncComponentLoader<T>,
  loadingComponent: Component = AsyncContentLoading,
) {
  const error = shallowRef<Error>()
  let retryLoad: (() => void) | undefined
  const fallback = defineComponent({
    inheritAttrs: false,
    setup(_props, { attrs }) {
      return () => h(loadingComponent, {
        ...attrs,
        error: error.value,
        onRetry: () => {
          error.value = undefined
          retryLoad?.()
        },
      })
    },
  })

  return defineAsyncComponent<T>({
    loader: () => {
      error.value = undefined
      let timer: ReturnType<typeof setTimeout> | undefined
      return Promise.race([
        Promise.resolve().then(loader),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(reject, LOAD_TIMEOUT_MS, new Error('Async component load timed out'))
        }),
      ]).finally(() => clearTimeout(timer))
    },
    loadingComponent: fallback,
    delay: 0,
    onError(reason, retry, fail) {
      if (import.meta.env.SSR) {
        fail()
        return
      }
      retryLoad = retry
      error.value = reason
    },
  })
}
