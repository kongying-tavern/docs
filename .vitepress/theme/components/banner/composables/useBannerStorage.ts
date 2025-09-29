import type { Ref } from 'vue'
import type { PartialBannerItem } from '../types'
import { useLocalStorage } from '@vueuse/core'
import { watchEffect } from 'vue'
import { STORE_KEY } from '../configs'

export function useBannerStorage() {
  const bannerData = useLocalStorage<PartialBannerItem[]>(STORE_KEY, [])

  // 立即修复无效的初始值
  if (!import.meta.env.SSR && !Array.isArray(bannerData.value)) {
    bannerData.value = []
  }

  // 验证并自动重置数组类型
  watchEffect(() => {
    if (!Array.isArray(bannerData.value)) {
      bannerData.value = []
    }
  })

  const insertOrUpdateBannerData = (options: PartialBannerItem) => {
    const index = bannerData.value.findIndex(item => item.path === options.path)

    if (index === -1) {
      bannerData.value = [...bannerData.value, options]
    }
    else {
      bannerData.value[index] = options
    }
  }

  const isBannerDismissed = (
    path: string,
    contentHash: number,
  ): boolean => {
    if (bannerData.value.length === 0)
      return false

    return bannerData.value.some(item =>
      item.path === path
      && item.contentHash === contentHash
      && Date.now() < (item.expiryDate ?? 0),
    )
  }

  return {
    bannerData: bannerData as Ref<PartialBannerItem[]>,
    insertOrUpdateBannerData,
    isBannerDismissed,
  }
}
