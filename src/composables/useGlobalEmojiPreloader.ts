import { readonly, ref } from 'vue'
import EmojiData from '~/_data/emojis.json'

const preloadedUrls = new Set<string>()
const preloadLinks = new Map<string, HTMLLinkElement>()
const isPreloading = ref(false)

export interface EmojiPreloadResult {
  totalRequested: number
  newlyPreloaded: number
  alreadyPreloaded: number
  failed: number
}

export function useGlobalEmojiPreloader() {
  function buildEmojiUrl(emojiPath: string): string {
    return `/imgs/emojis/${emojiPath}`
  }

  function createPreloadLink(url: string): boolean {
    if (preloadedUrls.has(url) || import.meta.env.SSR) {
      return false
    }

    try {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url

      if ('fetchPriority' in link) {
        (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = 'low'
      }

      document.head.appendChild(link)
      preloadedUrls.add(url)
      preloadLinks.set(url, link)

      return true
    }
    catch {
      return false
    }
  }

  function preloadEmojis(emojiPaths: string[]): EmojiPreloadResult {
    const result = { newlyPreloaded: 0, alreadyPreloaded: 0, failed: 0 }

    for (const path of emojiPaths) {
      const url = buildEmojiUrl(path)

      if (preloadedUrls.has(url)) {
        result.alreadyPreloaded++
      }
      else if (createPreloadLink(url)) {
        result.newlyPreloaded++
      }
      else {
        result.failed++
      }
    }

    return { totalRequested: emojiPaths.length, ...result }
  }

  function getPopularEmojiPaths(): string[] {
    const xiaoBulianPreset = EmojiData.find(preset => preset.presets === '小黄脸')
    if (!xiaoBulianPreset?.list)
      return []

    return xiaoBulianPreset.list
      .map(item => Object.values(item)[0])
      .filter((path): path is string => typeof path === 'string' && path.startsWith('1.'))
  }

  function getAllGroupsTopEmojis(topCount = 30): string[] {
    const allPaths: string[] = []

    EmojiData.forEach((preset) => {
      if (preset.list && Array.isArray(preset.list)) {
        const presetPaths = preset.list
          .slice(0, topCount)
          .map(item => Object.values(item)[0])
          .filter((path): path is string => typeof path === 'string')

        allPaths.push(...presetPaths)
      }
    })

    return allPaths
  }

  const emptyResult = { totalRequested: 0, newlyPreloaded: 0, alreadyPreloaded: 0, failed: 0 }

  async function preloadPopularEmojis(): Promise<EmojiPreloadResult> {
    if (isPreloading.value)
      return emptyResult

    isPreloading.value = true
    try {
      return preloadEmojis(getPopularEmojiPaths())
    }
    finally {
      isPreloading.value = false
    }
  }

  async function preloadAllGroupsTop(topCount = 30): Promise<EmojiPreloadResult> {
    if (isPreloading.value)
      return emptyResult

    isPreloading.value = true
    try {
      return preloadEmojis(getAllGroupsTopEmojis(topCount))
    }
    finally {
      isPreloading.value = false
    }
  }

  function getRecentEmojiPaths(): string[] {
    if (import.meta.env.SSR)
      return []

    try {
      const recentEmojis = localStorage.getItem('RECENT_EMOJIS')
      if (!recentEmojis)
        return []

      const parsed = JSON.parse(recentEmojis)
      if (typeof parsed !== 'object' || parsed === null)
        return []

      const allRecent: string[] = []
      Object.values(parsed).forEach((presetEmojis) => {
        if (Array.isArray(presetEmojis)) {
          allRecent.push(...presetEmojis)
        }
      })

      const allEmojiPaths = getAllGroupsTopEmojis(999)
      const recentPaths: string[] = []

      for (const emojiName of allRecent) {
        const matchedPath = allEmojiPaths.find(path => path.includes(emojiName))
        if (matchedPath) {
          recentPaths.push(matchedPath)
        }
      }

      return recentPaths.slice(0, 20)
    }
    catch {
      return []
    }
  }

  async function smartPreload(): Promise<EmojiPreloadResult> {
    const recentPaths = getRecentEmojiPaths()
    const popularPaths = getPopularEmojiPaths()
    const combinedPaths = [...new Set([...recentPaths, ...popularPaths])]
    return preloadEmojis(combinedPaths)
  }

  function cleanup(): void {
    if (import.meta.env.SSR)
      return

    preloadLinks.forEach((link) => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    })

    preloadLinks.clear()
    preloadedUrls.clear()
  }

  return {
    preloadPopularEmojis,
    preloadAllGroupsTop,
    smartPreload,
    cleanup,
    isPreloading: readonly(isPreloading),
    getPreloadedCount: () => preloadedUrls.size,
  }
}

const globalEmojiPreloader = useGlobalEmojiPreloader()

export function useEmojiPreload() {
  return globalEmojiPreloader
}
