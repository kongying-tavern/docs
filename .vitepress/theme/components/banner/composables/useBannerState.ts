import type { Ref } from 'vue'
import { isFromExternalPage } from '@/composables/isFromExternalPage'
import { useLanguage } from '@/composables/useLanguage'
import { useElementSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { useData } from 'vitepress'
import { computed, onBeforeMount, ref, watch, watchEffect } from 'vue'
import { getLangCode, hash } from '../../../utils'
import { DEFAULT_LOCALE_CODE, LOCALE_CONFIG } from '../configs'
import { BANNER_CONSTANTS, BANNER_SELECTORS } from '../constants'
import { useBannerStorage } from './useBannerStorage'

export function useBannerState(banner: Ref<HTMLElement | undefined>) {
  const { height } = useElementSize(banner)
  const { frontmatter, page, theme, lang, localeIndex } = useData()
  const { matchedLang } = useLanguage(LOCALE_CONFIG.map(val => val.lang!), DEFAULT_LOCALE_CODE)
  const { insertOrUpdateBannerData, isBannerDismissed } = useBannerStorage()

  const suggestLanguage = import.meta.env.SSR
    ? DEFAULT_LOCALE_CODE
    : getLangCode(matchedLang) || DEFAULT_LOCALE_CODE

  const isShowBanner = ref(false)

  // 计算是否显示语言建议栏
  const isShowLanguageSuggestBar = computed(
    () =>
      (frontmatter.value.languageSuggest
        || (isFromExternalPage() && page.value.filePath.includes('index.md')))
      && !lang.value.includes(suggestLanguage),
  )

  // 计算是否可以显示 banner
  const canBannerVisible = computed(
    () =>
      frontmatter.value.wip
      || typeof frontmatter.value.banner === 'string'
      || isShowLanguageSuggestBar.value,
  )

  // 计算过期时间
  const dismissExpiryTime = computed(() => Date.now() + BANNER_CONSTANTS.ONE_DAY_MS)

  // 检查是否过期
  const isExpired = computed(() => {
    const expiryDate = frontmatter.value.bannerExpiryDate
    return expiryDate && dayjs(expiryDate).isValid() && dayjs().isAfter(expiryDate)
  })

  // 计算 banner 文本
  const bannerText = computed(() =>
    frontmatter.value.wip
      ? (theme.value.ui?.banner?.wip ?? '')
      : frontmatter.value.banner,
  )

  // 计算 banner 内容哈希
  const bannerHash = computed(() =>
    bannerText.value ? hash(bannerText.value) : 0,
  )

  // 隐藏 banner
  const hideBanner = () => {
    isShowBanner.value = false
    document.documentElement.style.setProperty(
      BANNER_SELECTORS.LAYOUT_TOP_HEIGHT,
      BANNER_CONSTANTS.MIN_LAYOUT_HEIGHT,
    )
  }

  // 更新布局高度
  watchEffect(() => {
    if (height.value) {
      document.documentElement.style.setProperty(
        BANNER_SELECTORS.LAYOUT_TOP_HEIGHT,
        `${height.value + BANNER_CONSTANTS.HEIGHT_OFFSET}px`,
      )
    }
  })

  // 检查是否应该显示 banner
  const recheckBannerVisibility = () => {
    if (!canBannerVisible.value || isExpired.value) {
      hideBanner()
      return
    }

    if (isBannerDismissed(page.value.relativePath, bannerHash.value)) {
      hideBanner()
      return
    }

    isShowBanner.value = canBannerVisible.value
  }

  // 关闭 banner
  const dismissBanner = () => {
    insertOrUpdateBannerData({
      expiryDate: dismissExpiryTime.value,
      contentHash: bannerHash.value,
      locale: localeIndex.value,
      path: page.value.relativePath,
    })
    hideBanner()
  }

  // 生命周期和监听器
  onBeforeMount(recheckBannerVisibility)
  watch(() => page.value.relativePath, recheckBannerVisibility)

  return {
    isShowBanner,
    isShowLanguageSuggestBar,
    bannerText,
    suggestLanguage,
    dismissBanner,
    hideBanner,
  }
}
