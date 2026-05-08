import type { Ref } from 'vue'
import { useData, useRouter } from 'vitepress'
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
  const { localeIndex, site } = useData()

  const { defaultValue, validValues, history = 'push' } = options

  const internalState = ref<T>(defaultValue) as Ref<T>

  let isSyncingFromUrl = false
  let isSyncingToUrl = false
  const validSet = new Set(validValues)

  function buildPath(newValue: T): string {
    const base = site.value.base
    const isRoot = localeIndex.value === 'root'

    // Split path and remove site base + lang prefix
    const segments = route.path.replace(base, '').split('/').filter(Boolean)
    const contentSegments = isRoot ? segments : segments.slice(1)

    // If last segment is a current parameter value, remove it
    if (validSet.has(contentSegments.at(-1) as T))
      contentSegments.pop()

    const contentPath = contentSegments.join('/')
    const prefix = isRoot ? base : `${base}${localeIndex.value}/`

    if (newValue === defaultValue)
      return `${prefix}${contentPath}`

    return `${prefix}${contentPath ? `${contentPath}/` : ''}${newValue}`
  }

  // Sync URL → State
  watch(
    () => route.data.params?.[paramName],
    (param) => {
      if (isSyncingToUrl)
        return

      isSyncingFromUrl = true
      const value = typeof param === 'string' && validValues.includes(param as T)
        ? (param as T)
        : defaultValue

      if (value !== internalState.value)
        internalState.value = value

      nextTick(() => {
        isSyncingFromUrl = false
      })
    },
    { immediate: true },
  )

  // Sync State → URL
  watch(internalState, (newValue, oldValue) => {
    if (isSyncingFromUrl || newValue === oldValue)
      return

    isSyncingToUrl = true

    const newPath = buildPath(newValue)
    if (newPath !== route.path) {
      if (history === 'replace')
        window.history.replaceState({}, '', newPath)
      else
        router.go(newPath)
    }

    nextTick(() => {
      isSyncingToUrl = false
    })
  })

  return internalState
}
