<template>
  <div class="footer-container">
    <footer class="footer py-10">
      <div>
        <span class="footer-title">Services</span>

        <a>Advertisement</a>
      </div>
      <div>
        <span class="footer-title">相关信息</span>
        <a>隐私政策</a>
        <a>免责声明</a>
        <a>用户协议</a>
      </div>
      <div>
        <span class="footer-title">友情链接</span>
        <a
          href="https://www.mona-uranai.com/"
          rel="noopener noreferrer"
          target="_blank"
          >莫娜占卜铺</a
        >
        <a
          href="https://feixiaoqiu.com/"
          rel="noopener noreferrer"
          target="_blank"
          >非小酋</a
        >
        <a href="https://genshin.pub/" rel="noopener noreferrer" target="_blank"
          >可莉特调</a
        >
      </div>
      <div class="justify-self-end footer-qrcode">
        <img :src="qrcode" alt="QR Code" />
        <h4>开发反馈群</h4>
        <p>欢迎QQ扫码联系我们</p>
      </div>
    </footer>
    <footer
      class="footer py-4"
      style="border-top: 1px solid var(--vp-c-divider-light)"
    >
      <div class="items-center grid-flow-col">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill-rule="evenodd"
          clip-rule="evenodd"
          class="fill-current"
        >
          <path
            d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"
          ></path>
        </svg>
        <p>MIT Licensed<br />Made by Kongying Tavern Team</p>
      </div>
      <div class="md:place-self-center md:justify-self-end">
        <div class="grid grid-flow-col gap-4">
          <a
            i-logos-github-icon
            icon-btn
            href="https://github.com/kongying-tavern"
          ></a>
          <a i-custom-gitee icon-btn></a>
          <a i-custom-bilibili icon-btn></a>
          <a i-custom-mys icon-btn></a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useQRCode } from '@vueuse/integrations/useQRCode'

// `qrcode` will be a ref of data URL
const qrcode = useQRCode('https://jq.qq.com/?_wv=1027&k=nbveGrfQ')
</script>
<style lang="scss">
.footer-container {
  z-index: 9;
  position: relative;
  right: 0;
  bottom: 0;
  background-color: var(--vp-c-bg-alt);
}

.is-home .footer-container .footer {
  max-width: 1152px;
}

@media (min-width: 960px) {
  .footer-container .footer {
    max-width: 930px;
  }
}

@media (min-width: 1440px) {
  .footer-container .footer {
    max-width: 945px;
  }

  .VPSidebar ~ .footer-container {
    margin-right: calc(
      (100% - (var(--vp-layout-max-width) - 64px)) / 2 + var(--vp-sidebar-width) -
        32px
    );
  }
}

.footer {
  display: grid;
  width: 100%;
  grid-auto-flow: row;
  place-items: start;
  row-gap: 2.5rem;
  column-gap: 1rem;
  font-size: 0.87rem;
  line-height: 1.25rem;
  margin: 0 auto;
}

.footer > * {
  display: grid;
  place-items: start;
  gap: 0.5rem;
}

.footer-center {
  place-items: center;
  text-align: center;
}

.footer-center > * {
  place-items: center;
}

@media (min-width: 48rem) {
  .footer {
    grid-auto-flow: column;
  }

  .footer-center {
    grid-auto-flow: row dense;
  }
}

.footer-title {
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  opacity: 0.8;
}

.footer-qrcode {
  width: 192px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 9px;
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-button-alt-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  line-height: 22px;
  color: var(--vp-c-text-2);

  h4 {
    margin: 4px 0 0;
    font-size: 16px;
    line-height: 24px;
    font-weight: 700;
    color: var(--vp-c-text-1);
  }
}
</style>
