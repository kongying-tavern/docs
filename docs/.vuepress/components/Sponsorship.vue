<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import {
  useElementVisibility,
  usePointerSwipe,
  useCssVar,
  useWindowSize,
} from '@vueuse/core'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'

import type { ThemeLocaleData } from '../shared'

const themeLocaleData = useThemeLocaleData<ThemeLocaleData>()

const sponsorshipChannel = reactive(themeLocaleData.value.sponsorship)

const { width } = useWindowSize()

const bgVar = useCssVar('--c-bg')
const fontVar = useCssVar('--c-text')

const type = ref<string | null>(null)
const target = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)

const targetIsVisible = useElementVisibility(target)
const containerWidth = computed(() => container.value?.offsetWidth)

const left = ref('0')
const opacity = ref(1)

const reset = () => {
  left.value = '0'
  opacity.value = 1
}

const { distanceX, isSwiping } = usePointerSwipe(target, {
  onSwipe() {
    if (containerWidth.value) {
      if (distanceX.value < 0) {
        const distance = Math.abs(distanceX.value)
        left.value = `${distance}px`
        opacity.value = 1 - distance / containerWidth.value
      } else {
        left.value = '0'
        opacity.value = 1
      }
    }
  },
  onSwipeEnd() {
    if (
      distanceX.value < 0 &&
      containerWidth.value &&
      Math.abs(distanceX.value) / containerWidth.value >= 0.5
    ) {
      left.value = '100%'
      opacity.value = 0
    } else {
      left.value = '0'
      opacity.value = 1
    }
  },
})

const updateType = (): void => {
  type.value = window.location.hash.slice(1)
  reset()
}

onMounted(() => {
  updateType()
  window.addEventListener('hashchange', updateType)
})

onBeforeUnmount(() => {
  window.addEventListener('hashchange', updateType)
})
</script>

<template>
  <ClientOnly>
    <div class="onetime-sponsorship">
      <div class="onetime-sponsorship-container">
        <a
          v-for="channel in sponsorshipChannel"
          :key="channel.logo"
          class="onetime-sponsorship-channel"
          role="button"
          :href="'#' + channel.logo"
          :title="channel.title || channel.name"
        >
          <SvgIcon :name="channel.logo" style="font-size: 2em" />
          <span class="onetime-sponsorship-channel-text">
            {{ channel.name }}</span
          >
        </a>
        <div
          ref="container"
          class="onetime-sponsorship-pay"
          v-show="
            opacity !== 0
              ? type && sponsorshipChannel.find((val) => val.logo === type)
              : false
          "
        >
          <div
            ref="target"
            class="onetime-sponsorship-pay-container"
            :class="{ transition: !isSwiping }"
          >
            <p class="onetime-sponsorship-pay-tip">
              {{ themeLocaleData.swipeRightToClose }}
              <i class="el-icon-right"></i>
            </p>
            <QRCode
              class="onetime-sponsorship-qrcode"
              aria-label="Scan QRCode"
              tag="svg"
              :value="sponsorshipChannel.find((val) => val.logo === type)?.link"
              :options="{
                width: 200,
                height: 200,
                color: {
                  dark: fontVar,
                  light: bgVar,
                },
              }"
            >
            </QRCode>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style lang="scss">
@import '../styles/config';
$qrcode-size: 200px;
.onetime-sponsorship {
  .onetime-sponsorship-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    .onetime-sponsorship-channel {
      flex: 1 1 auto;
      padding: 12px 8px;
      text-decoration: none;
      user-select: none;
      transition: transform 0.3s;
      @media (any-hover: hover) {
        &:hover {
          transform: translateY(-3px);
        }
        svg {
          &:hover {
            transform: scale(1);
          }
        }
      }
      svg {
        margin-right: 5px;
      }
      .onetime-sponsorship-channel-text {
        display: inline-block;
        vertical-align: super;
        font-size: 16px;
        text-align: center;
        line-height: 1em;
        font-weight: 600;
        color: var(--c-text);
      }
    }
    .onetime-sponsorship-pay {
      position: relative;
      cursor: grab;
      display: grid;
      place-items: center;
      width: 87%;
      height: 300px;
      margin: auto;
      overflow: hidden;
      @media only screen and (max-width: $mobile) {
        .onetime-sponsorship-pay-tip {
          display: none !important;
        }
      }
      &:active {
        cursor: grabbing;
        .onetime-sponsorship-pay-tip {
          opacity: 1 !important;
        }
      }
      .transition {
        transition: all 0.2s linear;
      }
      .onetime-sponsorship-pay-container {
        position: absolute;
        left: v-bind(left);
        opacity: v-bind(opacity);
        display: grid;
        touch-action: initial;
        place-items: center;
        min-width: 100%;
        .onetime-sponsorship-pay-tip {
          position: absolute;
          display: inline-block;
          opacity: 0;
          left: 30px;
          top: 25%;
          transition: opacity 0.3s linear;
        }
        .onetime-sponsorship-qrcode {
          display: grid;
          place-items: center;
          font-size: 1.2em;
          width: $qrcode-size;
          height: $qrcode-size;
        }
        .onetime-sponsorship-select-name {
          display: inline-flex;
          align-items: center;
          margin: 0 0 20px 0;
          svg {
            margin-right: 5px;
          }
        }
      }
    }
  }
}
</style>
