<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useElementVisibility, usePointerSwipe } from '@vueuse/core'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'

import type { ThemeLocaleData } from '../shared'

export default defineComponent({
  name: 'Sponsorship',
  setup() {
    const items = ref([
      {
        name: 'WeChatPay',
        logo: 'wechat-pay',
        link: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
      },
      {
        name: 'AliPay',
        logo: 'alipay',
        link: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
      },
      {
        name: 'PayPal',
        logo: 'paypal',
        link: 'https://www.paypal.me/yuanshenditu',
      },
      {
        name: 'QQPay',
        logo: 'qq-pay',
        link: 'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet',
      },
      {
        name: 'ETH',
        logo: 'eth',
        link: 'ethereum:0xDe1f8528E6De36697b748CEA7cFF33D0b0f50bde',
      },
      {
        name: 'BiliBili',
        title: '一键三连~😁',
        logo: 'bilibili',
        link: 'https://space.bilibili.com/518076785',
      },
    ])

    const themeLocaleData = useThemeLocaleData<ThemeLocaleData>()

    const type = ref<string | null>(null)
    const isDark = ref<boolean | null>(null)
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
      isDark.value = document.documentElement.className.includes('dark')
      reset()
    }
    onMounted(() => {
      updateType()
      window.addEventListener('hashchange', updateType)
    })
    onBeforeUnmount(() => {
      window.addEventListener('hashchange', updateType)
    })

    return {
      items,
      updateType,
      type,
      target,
      targetIsVisible,
      container,
      isSwiping,
      left,
      opacity,
      isDark,
      swipeRightToClose: themeLocaleData.value.swipeRightToClose,
    }
  },
})
</script>

<template>
  <ClientOnly>
    <div class="onetime-sponsorship">
      <div class="onetime-sponsorship-container">
        <a
          v-for="item in items"
          :key="item.name"
          class="onetime-sponsorship-item"
          role="button"
          :href="'#' + item.name"
          :title="item.title || item.name"
        >
          <SvgIcon :name="item.logo" style="font-size: 2em" />
          <span class="onetime-sponsorship-item-text"> {{ item.name }}</span>
        </a>
        <div
          ref="container"
          class="onetime-sponsorship-pay"
          v-show="
            opacity !== 0
              ? type && items.find((val) => val.name === type)
              : false
          "
        >
          <div
            ref="target"
            class="onetime-sponsorship-pay-container"
            :title="items.find((val) => val.name === type)?.name"
            :class="{ transition: !isSwiping }"
            :style="{ left, opacity }"
          >
            <p class="onetime-sponsorship-pay-tip">
              {{ swipeRightToClose }}
              <i class="el-icon-right"></i>
            </p>
            <QRCode
              class="onetime-sponsorship-qrcode"
              aria-label="Scan QRCode"
              tag="svg"
              :value="items.find((val) => val.name === type)?.link"
              :options="{
                width: 200,
                height: 200,
                color: {
                  dark: isDark ? '#adbac7' : '#000',
                  light: isDark ? '#22272e' : '#fff',
                },
              }"
            >
            </QRCode>
            <h4 class="onetime-sponsorship-select-name">
              {{ items.find((val) => val.name === type)?.name }}
            </h4>
            <ElLink
              icon="el-icon-share"
              class="onetime-sponsorship-select-link"
              rel="noopener noreferrer"
              aria-label="Sponsored links"
              target="_blank"
              :href="items.find((val) => val.name === type)?.link"
            >
              {{ items.find((val) => val.name === type)?.link }}
            </ElLink>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped>
@import '../styles/config';
$qrcode-size: 200px;
.onetime-sponsorship {
  .onetime-sponsorship-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    .onetime-sponsorship-item {
      flex: 1 1 auto;
      padding: 12px 8px;
      text-decoration: none;
      user-select: none;
      svg {
        margin-right: 5px;
        &:hover {
          transform: scale(1);
        }
      }
      .onetime-sponsorship-item-text {
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
      height: 330px;
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
        left: 0;
        opacity: 1;
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
        .onetime-sponsorship-select-link {
          text-align: center;
          word-break: break-all;
        }
      }
    }
  }
}
</style>
