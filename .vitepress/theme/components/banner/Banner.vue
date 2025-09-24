<script setup lang="ts">
import CloseButton from '@/components/ui/CloseButton.vue'
import { ref } from 'vue'
import { useBannerState } from './composables/useBannerState'
import LanguageSuggestBar from './LanguageSuggestBar.vue'

const banner = ref<HTMLElement>()

const {
  isShowBanner,
  isShowLanguageSuggestBar,
  bannerText,
  suggestLanguage,
  dismissBanner,
} = useBannerState(banner)
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

          <CloseButton
            class="ml-8px"
            @click="dismissBanner"
          />
        </template>
        <LanguageSuggestBar
          v-else
          :suggest-lang="suggestLanguage"
          @close="dismissBanner"
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

a {
  text-decoration: underline;
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
