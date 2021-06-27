<template>
  <div class="onetime-sponsorship">
    <a
      v-for="item in items"
      :key="item.cover"
      href="javascript:void(0)"
      :title="'通过' + item.title + '支持我们'"
    >
      <el-image
        class="pay-img"
        :alt="item.title"
        :preview-src-list="[$withBase(item.qrCode)]"
        :src="$withBase(item.cover)"
        :hide-on-click-modal="true"
        :append-to-body="true"
      >
      </el-image>
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'Sponsorship',
  setup() {
    const items = ref([
      {
        title: 'WeChat Pay',
        cover: '/20210614/wechat-pay.png',
        qrCode: '/20210617/a8-wechatpay.jpg',
      },
      {
        title: 'Alipay Pay',
        name: 'WeChatPay',
        cover: '/20210614/alipay-pay.png',
        qrCode: '/20210617/a8-alipay.png',
      },
      {
        title: 'Paypal Pay',
        cover: '/20210614/paypal.png',
        qrCode: '/20210617/a8-paypal.png',
      },
      {
        title: 'QQ Pay',
        cover: '/20210614/qq-pay.png',
        qrCode: '/20210617/a8-qqpay.jpg',
      },
      {
        title: 'ETH Pay',
        cover: '/20210614/ETH.png',
        qrCode: '/20210617/A8-ethpay.png',
      },
    ])
    return {
      items,
    }
  },
})
</script>

<style lang="scss" scoped>
.onetime-sponsorship {
  display: flex;
  align-items: stretch;
  .pay-img {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    transform: scale(0.6);
  }
  @media only screen and (max-width: 980px) {
    .pay-img {
      transform: scale(0.8);
    }
  }
}
</style>
