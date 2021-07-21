<template>
  <div class="onetime-sponsorship">
    <div class="onetime-sponsorship-container">
      <a
        v-for="item in items"
        v-once
        :key="item.name"
        class="onetime-sponsorship-item"
        role="button"
        :href="'#' + item.name"
        :title="item.name"
      >
        <SvgIcon :icon="item.logo" style="font-size: 2em" />
        <span class="onetime-sponsorship-item-text"> {{ item.name }}</span>
      </a>
      <div
        v-if="type && items.find((val) => val.name === type)"
        class="onetime-sponsorship-pay"
      >
        <QRCode
          class="onetime-sponsorship-qrcode"
          aria-label="Scan QRCode"
          :value="items.find((val) => val.name === type)?.link"
          tag="svg"
          :options="{
            width: 200,
            height: 200,
          }"
        >
        </QRCode>
        <h4 style="margin: 0 0 20px 0">
          {{ items.find((val) => val.name === type)?.name }}
        </h4>
        <ElLink
          icon="el-icon-share"
          class="onetime-sponsorship-link"
          rel="noopener noreferrer"
          aria-label="Sponsored links"
          target="_blank"
          style="word-break: break-all"
          :href="items.find((val) => val.name === type)?.link"
        >
          {{ items.find((val) => val.name === type)?.link }}
        </ElLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'

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
        name: 'Ethereum',
        logo: 'eth',
        link: 'ethereum:0xDe1f8528E6De36697b748CEA7cFF33D0b0f50bde',
      },
    ])
    const type = ref('')
    const updateType = (): void => {
      type.value = window.location.hash.slice(1)
    }
    onMounted(() => {
      updateType()
      window.addEventListener('hashchange', updateType)
      console.table(items.value)
    })
    onBeforeUnmount(() => {
      window.addEventListener('hashchange', updateType)
    })

    return {
      items,
      updateType,
      type,
    }
  },
})
</script>

<style lang="scss" scoped>
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
      padding: 12px 0;
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
      display: grid;
      place-items: center;
      min-width: 100%;
      .onetime-sponsorship-qrcode {
        display: grid;
        place-items: center;
        font-size: 1.2em;
        width: $qrcode-size;
        height: $qrcode-size;
        margin: 2em 0;
        &:hover {
          transform: rotate3d(5, 0, 0, 5deg);
          box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
          transition: all 0.3s;
        }
      }
      .onetime-sponsorship-link {
        text-align: center;
      }
    }
  }
}
</style>
