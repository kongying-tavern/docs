<template>
  <div class="onetime-sponsorship">
    <div class="onetime-sponsorship-qrcodepay" v-show="!isSafari">
      <a
        v-for="item in items"
        :key="item.title"
        :href="'#' + item.title"
        :title="item.title"
      >
        <el-image
          class="pay-img"
          :lazy="true"
          :alt="'[' + item.title + ']' + item.link"
          :preview-src-list="[$withBase(item.qrCode)]"
          :src="$withBase(item.cover)"
          :hide-on-click-modal="true"
          :append-to-body="true"
        >
          <template #error>
            <div class="image-slot">
              <a :href="item.link" target="_blank" rel="noopener noreferrer">
                <i class="el-icon-picture-outline"></i>
                {{ '[' + item.title + ']' + item.link }}
              </a>
            </div>
          </template>
        </el-image>
      </a>
    </div>
    <div class="onetime-sponsorship-linkpay" v-show="isSafari">
      <a
        v-for="item in items"
        :key="item.title"
        :href="item.link"
        :title="item.title"
      >
        {{ '[' + item.title + ']：' + item.link }}
        <br />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { isSafari } from '../utils/isSafari'
export default defineComponent({
  name: 'Sponsorship',
  setup() {
    const items = ref([
      {
        title: 'WeChat Pay',
        cover: '/20210614/wechat-pay.png',
        qrCode: '/20210617/a8-wechatpay.jpg',
        link: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
      },
      {
        title: 'Alipay',
        cover: '/20210614/alipay-pay.png',
        qrCode: '/20210617/a8-alipay.png',
        link: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
      },
      {
        title: 'Paypal',
        cover: '/20210614/paypal.png',
        qrCode: '/20210617/a8-paypal.png',
        link: 'https://www.paypal.me/yuanshenditu',
      },
      {
        title: 'QQ Pay',
        cover: '/20210614/qq-pay.png',
        qrCode: '/20210617/a8-qqpay.jpg',
        link: 'https://reurl.cc/R0Lakx',
      },
      {
        title: 'Ethereum',
        cover: '/20210614/ETH.png',
        qrCode: '/20210617/A8-ethpay.png',
        link: 'ethereum:0xDe1f8528E6De36697b748CEA7cFF33D0b0f50bde',
      },
    ])
    return {
      items,
      isSafari: isSafari(),
    }
  },
})
</script>

<style lang="scss" scoped>
.onetime-sponsorship {
  width: 100%;
  height: 100%;
}
.onetime-sponsorship-qrcodepay {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: stretch;
  a,
  .pay-img,
  img {
    margin: auto;
    width: 120px;
  }
  @media only screen and (max-width: 780px) {
    a,
    .pay-img,
    img {
      display: grid;
      place-items: center;
      margin: auto 20px auto 0;
      width: 100px;
    }
  }
}
</style>
