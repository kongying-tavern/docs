// Data manipulation and utility functions

import { shuffle, take } from 'lodash-es'

// Array utilities - using lodash for better performance
export function getRandomElements<T>(arr: T[], count: number): T[] {
  if (count >= arr.length) {
    return [...arr]
  }

  return take(shuffle(arr), count)
}

// Tree/Navigation utilities
export interface DataNode {
  text: string
  link?: string
  items?: DataNode[]
}

export interface FlattenedNode {
  text: string
  link: string
  tag: string
}

export function flattenWithTags(
  nodes: DataNode[],
  topLevelText?: string,
): FlattenedNode[] {
  const result: FlattenedNode[] = []

  nodes.forEach((node) => {
    const currentTopLevelText = topLevelText || node.text

    if (node.link) {
      result.push({
        text: node.text,
        link: node.link,
        tag: currentTopLevelText,
      })
    }
    if (node.items) {
      result.push(...flattenWithTags(node.items, currentTopLevelText))
    }
  })

  return result
}

// Label/Tag transformation utilities
export function transformLabelsToArray(labels: Array<{ name: string }>): string[] {
  return labels.map(label => label.name)
}

export function transformArrayToLabels(tags: string[]): Array<{ name: string }> {
  return tags.map(tag => ({ name: tag }))
}

// Page utilities
export function setPageTitle(newTitle: string, prefix?: string): void {
  if (import.meta.env.SSR)
    return

  const title = document.title.split('|')
  document.title = `${prefix ? `${prefix} -` : ''} ${newTitle} | ${title[1]}`
}

// Form and navigation utilities
export function publishTopic(formHash: string = 'publish-topic'): void {
  const currentHash = location.hash.slice(1)
  let targetHash = formHash

  if (location.hash && ['FEAT', 'BUG', 'ANN'].includes(currentHash)) {
    targetHash = `${targetHash}-${currentHash}`
  }

  location.hash = targetHash
}

// Collection utilities
export function uniqueBy<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const keyValue = item[key]
    if (seen.has(keyValue)) {
      return false
    }
    seen.add(keyValue)
    return true
  })
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyGetter: (item: T) => K,
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyGetter(item)
    const group = groups[key] || []
    group.push(item)
    groups[key] = group
    return groups
  }, {} as Record<K, T[]>)
}

export function sortBy<T, K = unknown>(array: T[], keyGetter: (item: T) => K, reverse = false): T[] {
  const sortedArray = [...array].sort((a, b) => {
    const aVal = keyGetter(a)
    const bVal = keyGetter(b)

    if (aVal < bVal)
      return -1
    if (aVal > bVal)
      return 1
    return 0
  })

  return reverse ? sortedArray.reverse() : sortedArray
}

// String utilities
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${randomStr}`
}
