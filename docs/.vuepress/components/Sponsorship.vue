<template>
  <div class="onetime-sponsorship">
    <a
      v-for="item in items"
      :key="item.cover"
      :href="'#' + item.title"
      :title="item.title"
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
        title: 'Alipay',
        name: 'WeChatPay',
        cover: '/20210614/alipay-pay.png',
        qrCode: '/20210617/a8-alipay.png',
      },
      {
        title: 'Paypal',
        cover: '/20210614/paypal.png',
        qrCode: '/20210617/a8-paypal.png',
      },
      {
        title: 'QQ Pay',
        cover: '/20210614/qq-pay.png',
        qrCode: '/20210617/a8-qqpay.jpg',
      },
      {
        title: 'ETH',
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
