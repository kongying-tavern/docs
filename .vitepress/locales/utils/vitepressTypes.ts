import type { HeadConfig } from 'vitepress'

// 精确转换 JSON 中的 head 数据为 VitePress HeadConfig 类型
export function convertHeadConfig(head: unknown[][]): HeadConfig[] {
  return head.map((item) => {
    if (Array.isArray(item) && item.length >= 2) {
      const [tag, attrs, content] = item
      if (typeof tag === 'string') {
        if (content !== undefined) {
          return [tag, attrs as Record<string, string>, content as string] as HeadConfig
        }
        else {
          return [tag, attrs as Record<string, string>] as HeadConfig
        }
      }
    }
    return item as HeadConfig
  })
}

// 从转换后的数据中提取正确的配置结构
export function extractLocaleConfig<T extends Record<string, unknown>>(data: T) {
  const { head, ...rest } = data
  return {
    ...rest,
    head: Array.isArray(head) ? convertHeadConfig(head as unknown[][]) : [],
  }
}
