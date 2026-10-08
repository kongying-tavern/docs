import type { Ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { useData } from 'vitepress'
import { computed, onBeforeMount, ref, watch, watchEffect } from 'vue'
import { isFromExternalPage } from '@/composables/isFromExternalPage'
import { useLanguage } from '@/composables/useLanguage'
import { getLangCode, hash } from '../../../utils'
import { DEFAULT_LOCALE_CODE, useLocaleConfig } from '../configs'
import { BANNER_CONSTANTS, BANNER_SELECTORS } from '../constants'
import { useBannerStorage } from './useBannerStorage'

export function useBannerState(banner: Ref<HTMLElement | undefined>) {
  const { height } = useElementSize(banner)
  const { frontmatter, page, theme, lang, localeIndex } = useData()
  const localeConfig = useLocaleConfig()
  const { matchedLang } = useLanguage(
    localeConfig.value.map(val => val.lang),
    DEFAULT_LOCALE_CODE,
  )
  const { insertOrUpdateBannerData, isBannerDismissed } = useBannerStorage()

  const suggestLanguage = import.meta.env.SSR
    ? DEFAULT_LOCALE_CODE
    : getLangCode(matchedLang) || DEFAULT_LOCALE_CODE

  const isShowBanner = ref(false)

  const isShowLanguageSuggestBar = computed(
    () =>
      (frontmatter.value.languageSuggest
        || (isFromExternalPage() && page.value.filePath.includes('index.md')))
      && !lang.value.includes(suggestLanguage),
  )

  const canBannerVisible = computed(
    () =>
      frontmatter.value.wip
      || typeof frontmatter.value.banner === 'string'
      || isShowLanguageSuggestBar.value,
  )

  const dismissExpiryTime = computed(() => Date.now() + BANNER_CONSTANTS.ONE_DAY_MS)

  const isExpired = computed(() => {
    const expiryDate = frontmatter.value.bannerExpiryDate
    return expiryDate && dayjs(expiryDate).isValid() && dayjs().isAfter(expiryDate)
  })

  const bannerText = computed(() =>
    frontmatter.value.wip
      ? (theme.value.ui?.banner?.wip ?? '')
      : frontmatter.value.banner,
  )

  const bannerHash = computed(() =>
    bannerText.value ? hash(bannerText.value) : 0,
  )

  const hideBanner = () => {
    isShowBanner.value = false
    document.documentElement.style.setProperty(
      BANNER_SELECTORS.LAYOUT_TOP_HEIGHT,
      BANNER_CONSTANTS.MIN_LAYOUT_HEIGHT,
    )
  }

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
