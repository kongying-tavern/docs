<template>
  <div class="footer-container" v-if="frontmatter.footer !== false">
    <footer class="footer">
      <div class="footer-navigation" v-for="item in theme.footer.navigation">
        <h3 class="footer-title">{{ item.title }}</h3>
        <ul>
          <li v-for="ic in item.items">
            <a
              :href="withBase(ic.link)"
              :title="ic.text"
              :target="ic.text"
              rel="noopener noreferrer"
            >
              {{ ic.text }}
            </a>
          </li>
        </ul>
      </div>
      <div class="justify-self-end footer-qrcode">
        <img :src="qrcode" alt="QR Code" />
        <h4>{{ theme.footer.qrcodeTitle }}</h4>
        <p>{{ theme.footer.qrcodeMessage }}</p>
      </div>
    </footer>
    <footer
      class="footer py-4"
      style="border-top: 1px solid var(--vp-c-gutter)"
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
        <p text-left>MIT Licensed<br />Made by Kongying Tavern Team</p>
      </div>
      <div class="md:place-self-center md:justify-self-end">
        <div class="grid grid-flow-col gap-4">
          <a
            i-custom-github
            icon-btn
            mr-4
            href="https://github.com/kongying-tavern"
            target="_blank"
            title="GitHub"
            rel="noopener noreferrer"
          ></a>
          <a
            i-custom-gitee
            icon-btn
            mr-4
            href="https://gitee.com/KYJGYSDT"
            target="_blank"
            title="Gitee"
            rel="noopener noreferrer"
          ></a>
          <a
            i-logos-twitter
            icon-btn
            mr-4
            href="https://twitter.com/KongyingTavern"
            target="_blank"
            rel="noopener noreferrer"
          ></a>
          <a
            i-custom-bilibili
            icon-btn
            mr-4
            href="https://space.bilibili.com/518076785"
            target="_blank"
            title="Bilibili"
            rel="noopener noreferrer"
          ></a>
          <a
            i-logos-youtube-icon
            icon-btn
            mr-4
            href="https://www.youtube.com/@KongyingTavernOfficial"
            target="_blank"
            title="Youtube"
            rel="noopener noreferrer"
          ></a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { useData, withBase } from 'vitepress'

const { theme } = useData()
const { frontmatter } = useData()
const qrcode = useQRCode(theme.value.footer.qrcodeLink)
</script>

<style lang="scss">
.footer-container {
  z-index: var(--vp-z-index-footer);
  position: relative;
  right: 0;
  bottom: 0;
  padding: 0 32px;
  background-color: var(--vp-c-bg-alt);
}

.is-home ~ .footer-container .footer {
  max-width: 1152px;
}

// 有侧边栏时隐藏 Footer
.VPSidebar ~ .footer-container {
  display: none;
}

.footer:first-child {
  padding-top: 2.5rem;
}

.footer:last-child {
  row-gap: 1rem;
}

.footer {
  display: grid;
  width: 100%;
  grid-auto-flow: row;
  place-items: start;
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

.footer {
  place-items: center;
}

.footer-navigation:first-child {
  border-top: 1px solid var(--vp-c-gutter);
}

.footer-navigation {
  width: 100%;
  line-height: 32px;
  font-size: 14px;
  font-weight: 500;
  place-items: self-start;
  border-bottom: 1px solid var(--vp-c-gutter);
  gap: 0;
  overflow: hidden;

  ul {
    width: 100%;
    height: 0;
    overflow: hidden;
    transition: 300ms ease;

    li:last-child {
      margin-bottom: 16px;
    }
  }

  ul > li > a {
    display: inline-block;
    transition: color 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
    color: var(--vp-c-text-1);
    padding: 6px 14px;
    width: 100%;

    &:hover {
      color: var(--vp-c-brand);
    }
  }
}

.footer-title {
  cursor: pointer;
  width: 100%;
  user-select: all;
  font-weight: 700;
  line-height: 1.33337;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  padding: 1rem 0;
  opacity: 0.8;

  &::after {
    content: '+';
    filter: invert(50%);
    float: right;
    width: 14px;
    height: 14px;
    text-align: center;
    margin-right: 8px;
    transition: transform 0.3s ease;
  }
}

.footer-title:hover {
  &::after {
    transform: rotate(45deg) scale(1.08);
  }
}

// 这里逻辑还有点问题
.footer-title:hover ~ ul,
.footer-title ~ ul:hover {
  height: 100%;
}

.footer-qrcode {
  width: 192px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 9px;
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-gutter);
  display: none;
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

@media (min-width: 1440px) {
  .footer-container .footer {
    max-width: 945px;
  }
}

@media (min-width: 48rem) {
  .footer {
    grid-auto-flow: column;
    place-items: self-start;
    row-gap: 2.5rem;
  }

  .footer-navigation:first-child {
    border-top: none;
  }

  .footer-navigation {
    place-items: self-start;
    border: none;

    ul {
      height: 100%;
    }

    ul > li > a {
      padding: 0;
    }
  }

  .footer-center {
    grid-auto-flow: row dense;
  }

  .footer-qrcode {
    display: flex;
  }

  .footer:first-child {
    padding-bottom: 2.5rem;
  }

  .footer-title {
    cursor: default;

    &::after {
      display: none;
    }
  }
}
</style>
