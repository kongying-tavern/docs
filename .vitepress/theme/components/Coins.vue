<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { useData } from 'vitepress'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import BlurFade from './ui/BlurFade.vue'

const { theme } = useData()
const qrcode = ref()

const icon = ref()
const selectedPayment = ref()
const coins = ref(theme.value.payment)

function updatePaymentType() {
  const hash = window.location.hash.slice(1)
  if (hash && coins.value[hash]?.address) {
    selectedPayment.value = hash
    qrcode.value = useQRCode(coins.value[hash].address)
    nextTick(() => {
      icon.value.className = `i-custom-${hash}`
    })
  }
}

onMounted(() => {
  updatePaymentType()
  window.addEventListener('hashchange', updatePaymentType)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', updatePaymentType)
})
</script>

<template>
  <div slide-enter>
    <div class="one-time-donations">
      <div class="links font-[var(--vp-font-family-subtitle)]">
        <a
          v-for="(payment, key) in theme.payment"
          :key="key"
          :href="`#${key}`"
          :title="payment.name"
        >
          <span :class="`i-custom-${key}`" />
          {{ payment.name }}
        </a>
      </div>
    </div>

    <BlurFade
      v-if="selectedPayment && coins[selectedPayment]"
      :duration="200"
      :delay="200"
      class="slide-enter coin-details font-[var(--vp-font-family-subtitle)]"
    >
      <p>
        <span ref="icon" />
        {{ coins[selectedPayment].name }} Address:<br><a
          :href="coins[selectedPayment].address"
          :title="coins[selectedPayment].name"
          target="_blank"
          rel="noopener noreferrer"
        >{{ coins[selectedPayment].address }}</a>
      </p>
      <img :src="qrcode.value" alt="QR Code">
    </BlurFade>
  </div>

  <!-- 在这里显式声明Pay Icon，给Unocss识别导入 -->
  <div v-once hidden>
    <span class="i-custom-qqpay" />
    <span class="i-custom-wechatpay" />
    <span class="i-custom-bilibili" />
    <span class="i-custom-alipay" />
    <span class="i-custom-paypal" />
  </div>
</template>

<style lang="scss" scoped>
.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  flex-direction: row;

  a {
    flex: 1 1 auto;
    padding: 12px 8px;
    text-decoration: none !important;
    user-select: none;
    transition: transform 0.3s;
    display: inline-block;
    font-size: 16px;
    text-align: center;
    font-weight: 600;
    text-indent: 8px;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
    color: var(--vp-c-text-1);

    & > span {
      display: inline-block;
      height: 2em;
      width: 2em;
    }

    @media (any-hover: hover) {
      &:hover,
      &:active {
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
  }
}

@media (max-width: 788px) {
  .coin-details > p {
    display: none !important;
  }
}

.coin-details {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 2rem;

  img {
    box-shadow: var(--vp-shadow-1);
  }

  p {
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    display: inline-block;
    width: 400px;

    a {
      font-weight: normal;
    }

    span {
      display: block;
      height: 5rem;
      width: 5rem;
      margin-left: 1rem;
      margin-bottom: 12px;
      animation: 4s whirling linear;
      animation-direction: alternate;
      animation-iteration-count: infinite;
    }
  }
}

@keyframes whirling {
  from {
    transform: rotate3d(0, 1, 0, -90deg) scale(0.9);
  }

  to {
    transform: rotate3d(0, 1, 0, 90deg) scale(1);
  }
}
</style>
