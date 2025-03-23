<script setup lang="ts">
import { isFromExternalPage } from '@/composables/isFromExternalPage'
import { useLanguage } from '@/composables/useLanguage'
import { useElementSize, useLocalStorage } from '@vueuse/core'
import dayjs from 'dayjs'
import { useData } from 'vitepress'
import { computed, onBeforeMount, ref, watch, watchEffect } from 'vue'
import { getLangCode, hash } from '../../utils'
import { DEFAULT_LOCALE_CODE, LOCALE_CONFIG, STORE_KEY } from './configs'
import LanguageSuggestBar from './LanguageSuggestBar.vue'

type BannerItem = Partial<{
  expiryDate: number
  contentHash: number
  locale: string
  path: string
}>

const banner = ref<HTMLElement>()
const { height } = useElementSize(banner)
const { frontmatter, page, theme, lang, localeIndex } = useData()
const { matchedLang } = useLanguage(LOCALE_CONFIG.map(val => val.lang!), DEFAULT_LOCALE_CODE)

const suggestLanguage = import.meta.env.SSR
  ? DEFAULT_LOCALE_CODE
  : getLangCode(matchedLang) || DEFAULT_LOCALE_CODE

const bannerData = useLocalStorage<BannerItem[]>(STORE_KEY, [])

// 只有在 `languageSuggest` 存在 或 来自外部页面 或 在首页，且用户当前语言不同才显示
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
const isShowBanner = ref(canBannerVisible.value)

// 计算 1 天后的时间戳
const dismissExpiryTime = computed(() => Date.now() + 8.64e7)

// 计算是否在过期时间内
const inExpiryDate = computed(() => {
  const expiryDate = frontmatter.value.bannerExpiryDate
  return (
    expiryDate && dayjs(expiryDate).isValid() && dayjs().isAfter(expiryDate)
  )
})

const bannerText = computed(() =>
  frontmatter.value.wip
    ? (theme.value.ui?.banner?.wip ?? '')
    : frontmatter.value.banner,
)
const bannerHash = computed(() =>
  bannerText.value ? hash(bannerText.value) : 0,
)

watchEffect(() => {
  if (height.value) {
    document.documentElement.style.setProperty(
      '--vp-layout-top-height',
      `${height.value + 16}px`,
    )
  }
})

function recheck() {
  if (!canBannerVisible.value || inExpiryDate.value) {
    hideBanner()
    return
  }

  if (bannerData.value.length > 0) {
    // 同页面 Banner 内容不变情况下一天仅展示一次
    for (const val of bannerData.value) {
      if (
        page.value.relativePath === val.path
        && bannerHash.value === val.contentHash
        && Date.now() < (val?.expiryDate ?? 0)
      ) {
        hideBanner()
        return
      }
    }
  }

  isShowBanner.value = canBannerVisible.value
}

function dismiss() {
  insertOrUpdateBannerData({
    expiryDate: dismissExpiryTime.value,
    contentHash: bannerHash.value,
    locale: localeIndex.value,
    path: page.value.relativePath,
  })
  hideBanner()
}

function insertOrUpdateBannerData(options: BannerItem) {
  const index = bannerData.value.findIndex(item => item.path === options.path)

  if (index === -1)
    return (bannerData.value = [...bannerData.value, options])

  bannerData.value[index] = options
}

function hideBanner() {
  isShowBanner.value = false
  document.documentElement.style.setProperty('--vp-layout-top-height', '0.1px')
}

onBeforeMount(recheck)

watch(() => page.value.relativePath, recheck)
</script>

<template>
  <ClientOnly>
    <div
      v-show="isShowBanner"
      ref="banner"
      class="banner py-8px pl-24px pr-8px md:px-32px"
    >
      <div
        class="mx-auto max-w-[calc(var(--vp-layout-max-width)-64px)] flex justify-center text-center"
      >
        <template v-if="!isShowLanguageSuggestBar">
          <div
            class="text font-[var(--vp-font-family-subtitle)]"
            v-html="bannerText"
          />

          <button type="button" @click="dismiss">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </template>
        <LanguageSuggestBar
          v-else
          :suggest-lang="suggestLanguage"
          @close="dismiss"
        />
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.banner {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: var(--vp-z-index-layout-top);
  background: var(--banner-bg);
  color: #fff;
  animation: slide-enter-inverse 1s both 1;
  animation-delay: 0.3s;
}

.text {
  flex: 1;
}

.banner-dismissed {
  --vp-layout-top-height: 0px !important;
}

.banner > button {
  opacity: 0.7;
  transition: opacity 0.3s cubic-bezier(0.39, 0.575, 0.565, 1);
}

.banner > button:hover {
  opacity: 1;
}

a {
  text-decoration: underline;
}

svg {
  width: 24px;
  height: 24px;
  margin-left: 8px;
}

@keyframes slide-enter-inverse {
  0% {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0px);
    opacity: 100;
  }
}
</style>
