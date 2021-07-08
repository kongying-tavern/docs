<template>
  <div class="onetime-sponsorship">
    <div class="onetime-sponsorship-container">
      <a
        v-for="item in items"
        v-once
        :key="item.name"
        class="onetime-sponsorship-item"
        :href="'#' + item.name"
        :title="item.name"
      >
        <Icon :icon="item.logo" style="font-size: 2em" />
        <span class="onetime-sponsorship-item-text"> {{ item.name }}</span>
      </a>
      <div
        v-if="type && items.find((val) => val.name === type)"
        class="onetime-sponsorship-pay"
      >
        <el-skeleton
          style="width: 240px"
          :loading="loading"
          :throttle="300"
          animated
        >
          <template #template>
            <el-skeleton-item
              variant="image"
              style="width: 200px; height: 200px"
            />
            <div style="padding: 14px">
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-items: space-between;
                  margin-top: 16px;
                  height: 16px;
                "
              >
                <el-skeleton-item variant="text" style="width: 70%" />
              </div>
            </div>
          </template>
          <template #default>
            <el-image
              class="onetime-sponsorship-qrcode"
              fit="cover"
              :alt="$withBase(items.find((val) => val.name === type)?.name)"
              :src="$withBase(items.find((val) => val.name === type)?.qrCode)"
              :hide-on-click-modal="true"
              :append-to-body="true"
              :preview-src-list="[
                $withBase(items.find((val) => val.name === type)?.qrCode),
              ]"
            >
              <template #error>
                <div class="image-slot">
                  <Icon icon="qrcode" />
                  <span>&nbsp;Load failed</span>
                </div>
              </template>
            </el-image>
            <h4 style="margin: 0 0 20px 0">
              {{ items.find((val) => val.name === type)?.name }}
            </h4>
            <el-link
              icon="el-icon-share"
              class="onetime-sponsorship-link"
              rel="noopener noreferrer"
              target="_blank"
              :href="items.find((val) => val.name === type)?.link"
            >
              {{ items.find((val) => val.name === type)?.link }}
            </el-link>
          </template>
        </el-skeleton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'Sponsorship',
  setup() {
    const items = ref([
      {
        name: 'WeChatPay',
        logo: 'wechat-pay',
        qrCode: '/20210617/wechatpay.png',
        link: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
      },
      {
        name: 'AliPay',
        logo: 'alipay',
        qrCode: '/20210617/alipay.png',
        link: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
      },
      {
        name: 'PayPal',
        logo: 'paypal',
        qrCode: '/20210617/paypal.png',
        link: 'https://www.paypal.me/yuanshenditu',
      },
      {
        name: 'QQPay',
        logo: 'qq-pay',
        qrCode: '/20210617/qqpay.png',
        link: 'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet',
      },
      {
        name: 'ETH',
        logo: 'eth',
        qrCode: '/20210617/ethpay.png',
        link: 'ethereum:0xDe1f8528E6De36697b748CEA7cFF33D0b0f50bde',
      },
    ])
    const type = ref('')
    const loading = ref(true)
    const updateType = () => {
      type.value = window.location.hash.slice(1)
    }
    onMounted(() => {
      updateType()
      window.addEventListener('hashchange', updateType)
      window.addEventListener('load', () => (loading.value = false))
    })
    onBeforeUnmount(() => {
      window.addEventListener('hashchange', updateType)
    })

    return {
      items,
      updateType,
      type,
      loading,
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
      &:hover {
        transform: scale(1.15);
        transform-origin: center;
        transition: all 0.3s ease-in-out;
      }
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
