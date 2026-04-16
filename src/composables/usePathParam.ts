import type { Ref } from 'vue'
import { useRouter } from 'vitepress'
import { nextTick, ref, watch } from 'vue'

export interface UsePathParamOptions<T> {
  /** 默认值，URL 中没有此参数时使用 */
  defaultValue: T
  /** 有效值列表，用于验证和 URL 构建 */
  validValues: T[]
  /** 历史记录策略 */
  history?: 'push' | 'replace'
}

/**
 * 将 ref 与 URL 路径参数双向绑定
 *
 * @example
 * ```ts
 * const filter = usePathParam<ForumAPI.FilterBy>('type', {
 *   defaultValue: 'all',
 *   validValues: ['all', 'bug', 'feat', 'closed'],
 *   history: 'push',
 * })
 *
 * // 直接赋值会自动更新 URL
 * filter.value = 'bug'
 *
 * // URL 变化时自动同步
 * ```
 */
export function usePathParam<T extends string>(
  paramName: string,
  options: UsePathParamOptions<T>,
): Ref<T> {
  const router = useRouter()
  const { route } = router

  const { defaultValue, validValues, history = 'push' } = options

  // 内部状态
  const internalState = ref<T>(defaultValue) as Ref<T>

  // 防循环标志
  let isSyncingFromUrl = false
  let isSyncingToUrl = false

  // 构建 URL 路径
  function buildPath(newValue: T): string {
    const currentPath = route.path
    const segments = currentPath.split('/').filter(Boolean)

    // 检测语言前缀
    const isLangPrefixed = segments[0] === 'en' || segments[0] === 'ja'
    const langPrefix = isLangPrefixed ? segments[0] : null

    // 找到 param 在路径中的位置
    const validSet = new Set(validValues)
    let basePathSegments: string[]

    if (validSet.has(segments.at(-1) as T)) {
      // 最后一个 segment 是有效值，移除它
      basePathSegments = isLangPrefixed ? segments.slice(1, -1) : segments.slice(0, -1)
    }
    else {
      basePathSegments = isLangPrefixed ? segments.slice(1) : segments
    }

    // 构建新路径
    if (newValue === defaultValue) {
      // 默认值不添加到 URL
      return langPrefix ? `/${langPrefix}/${basePathSegments.join('/')}` : `/${basePathSegments.join('/')}`
    }
    else {
      return langPrefix
        ? `/${langPrefix}/${basePathSegments.join('/')}/${newValue}`
        : `/${basePathSegments.join('/')}/${newValue}`
    }
  }

  // 同步 URL → State
  watch(
    () => route.data.params?.[paramName],
    (param) => {
      if (isSyncingToUrl)
        return

      isSyncingFromUrl = true
      const value = typeof param === 'string' && validValues.includes(param as T)
        ? (param as T)
        : defaultValue

      if (value !== internalState.value) {
        internalState.value = value
      }

      nextTick(() => {
        isSyncingFromUrl = false
      })
    },
    { immediate: true },
  )

  // 同步 State → URL
  watch(internalState, (newValue, oldValue) => {
    if (isSyncingFromUrl || newValue === oldValue)
      return

    isSyncingToUrl = true

    const newPath = buildPath(newValue)
    if (newPath !== route.path) {
      // VitePress router.go 使用 push 行为
      // 如果需要 replace，需要手动操作 history
      if (history === 'replace') {
        window.history.replaceState({}, '', newPath)
      }
      router.go(newPath)
    }

    nextTick(() => {
      isSyncingToUrl = false
    })
  })

  return internalState
}
