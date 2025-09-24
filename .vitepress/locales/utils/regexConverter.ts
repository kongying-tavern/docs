import type { SerializedRegex } from '../json-types'

// 类型守卫：检查是否为序列化的正则表达式
function isSerializedRegex(obj: unknown): obj is SerializedRegex {
  return (
    typeof obj === 'object'
    && obj !== null
    && '__regex__' in obj
    && '__flags__' in obj
    && typeof (obj as SerializedRegex).__regex__ === 'string'
    && typeof (obj as SerializedRegex).__flags__ === 'string'
  )
}

// 类型：将序列化的正则表达式类型转换为真正的 RegExp 类型
export type ConvertSerializedRegex<T> = T extends SerializedRegex
  ? RegExp
  : T extends (infer U)[]
    ? ConvertSerializedRegex<U>[]
    : T extends object
      ? { [K in keyof T]: ConvertSerializedRegex<T[K]> }
      : T

// 转换函数：将序列化的正则表达式转换回 RegExp 对象
export function convertRegexObjects<T>(obj: T): ConvertSerializedRegex<T> {
  if (isSerializedRegex(obj)) {
    return new RegExp(obj.__regex__, obj.__flags__ || '') as ConvertSerializedRegex<T>
  }

  if (Array.isArray(obj)) {
    return obj.map(convertRegexObjects) as ConvertSerializedRegex<T>
  }

  if (obj && typeof obj === 'object') {
    const converted = {} as Record<string, unknown>
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertRegexObjects(value)
    }
    return converted as ConvertSerializedRegex<T>
  }

  return obj as ConvertSerializedRegex<T>
}
