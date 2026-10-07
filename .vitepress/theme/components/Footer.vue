<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { useData, withBase } from 'vitepress'
import { ref } from 'vue'
import { useQRCode } from '@/hooks/useQRCode'

import { socialList } from '../composables/socialList'

const { frontmatter, theme } = useData()
const qrcode = useQRCode(theme.value.footer.qrcodeLink)

const isDesktop = useMediaQuery('(min-width: 48rem)')
const openSections = ref(new Set<string>())

function toggleSection(title: string) {
  const next = new Set(openSections.value)
  if (next.has(title))
    next.delete(title)
  else
    next.add(title)
  openSections.value = next
}

function isExpanded(title: string) {
  return isDesktop.value || openSections.value.has(title)
}
</script>

<template>
  <div
    v-if="frontmatter.footer !== false && frontmatter.sidebar !== true"
    class="slide-enter footer-container"
  >
    <footer class="footer">
      <div
        v-for="(item, idx) in theme.footer.navigation"
        :key="item.title"
        class="footer-navigation"
        :class="{ open: isExpanded(item.title) }"
      >
        <h3 class="footer-title">
          <button
            type="button"
            :aria-expanded="isExpanded(item.title)"
            :aria-controls="`footer-navigation-${idx}`"
            @click="toggleSection(item.title)"
          >
            {{ item.title }}
          </button>
        </h3>
        <ul :id="`footer-navigation-${idx}`">
          <li
            v-for="ic in item.items"
            :key="ic.text"
          >
            <VPLink
              :href="ic.link"
              :title="`${ic.text}（${withBase(ic.link)}）`"
            >
              {{ ic.text }}
            </VPLink>
          </li>
        </ul>
      </div>
      <div class="footer-qrcode justify-self-end">
        <img
          :src="qrcode"
          :alt="theme.footer.qrcodeAlt"
        >
        <h4>{{ theme.footer.qrcodeTitle }}</h4>
        <p text-center>
          {{ theme.footer.qrcodeMessage }}
        </p>
      </div>
    </footer>
    <footer class="footer py-4">
      <div class="grid-flow-col items-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill-rule="evenodd"
          clip-rule="evenodd"
          class="fill-current"
          style="color: var(--vp-c-text-2)"
        >
          <path
            d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"
          />
        </svg>
        <p text-left>
          MIT Licensed<br>Made with ❤ by Kongying Tavern
        </p>
      </div>
      <div class="md:justify-self-end md:place-self-center">
        <div class="gap-4 grid grid-flow-col">
          <a
            v-for="item in socialList"
            :key="item.title"
            class="footer-sociallink fill-[var(--vp-c-text-1)]"
            :href="item.link"
            :aria-label="item.title"
            :title="item.title"
            target="_blank"
            rel="noopener noreferrer"
            v-html="item.icon"
          />
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import '@/styles/media.css';
.footer-container {
  z-index: 1;
  position: relative;
  right: 0;
  bottom: 0;
  padding: 0 32px;
  background-color: var(--vp-c-bg-alt);
}

.is-home ~ .footer-container .footer,
.Headline > .footer-container .footer,
.Blog .footer-container .footer {
  max-width: 1152px;
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
  font-size: calc(14px * var(--site-ui-scale));
  font-family: var(--vp-font-family-base);
  line-height: calc(20px * var(--site-ui-scale));
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
  border-top: 1px solid var(--vp-c-divider);
}

.footer-navigation {
  width: 100%;
  line-height: calc(32px * var(--site-ui-scale));
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 500;
  place-items: self-start;
  border-bottom: 1px solid var(--vp-c-divider);
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

  &.open ul {
    height: 100%;
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
  font-weight: 700;
  line-height: 1.33337;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  padding: 1rem 0;
  opacity: 0.8;

  button {
    all: unset;
    display: block;
    width: 100%;
    font: inherit;
    color: inherit;
    cursor: pointer;
    user-select: none;
  }

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

.footer-navigation.open .footer-title::after {
  transform: rotate(45deg) scale(1.08);
}

.footer-qrcode {
  width: 192px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 9px;
  background-color: var(--vp-c-bg-soft-up);
  border: 1px solid var(--vp-c-divider);
  display: none;
  flex-direction: column;
  align-items: center;
  font-size: calc(14px * var(--site-ui-scale));
  line-height: calc(22px * var(--site-ui-scale));
  color: var(--vp-c-text-2);

  img {
    box-shadow: var(--vp-shadow-1);
  }

  h4 {
    margin: 4px 0 0;
    font-size: calc(16px * var(--site-ui-scale));
    line-height: calc(24px * var(--site-ui-scale));
    font-weight: 700;
    color: var(--vp-c-text-1);
  }
}

@media (--site-wide) {
  .footer-container .footer {
    max-width: calc(var(--vp-layout-max-width) - 64px);
    padding-left: 48px;
    padding-right: 48px;
  }
}

@media (--site-desktop) {
  .VPSidebar ~ .footer-container {
    width: calc(100% - var(--vp-sidebar-width));
    left: var(--vp-sidebar-width);
  }
}

@media (--footer-columns) {
  .footer {
    grid-auto-flow: column;
    place-items: self-start;
    row-gap: 2.5rem;
  }

  .footer:last-child {
    border-top: 1px solid var(--vp-c-divider);
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

    button {
      cursor: default;
    }

    &::after {
      display: none;
    }
  }
}

.footer-sociallink {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  color: var(--vp-c-text-2);

  &:hover {
    color: var(--vp-c-text-1);
    transition: all 0.25s;
    background-color: var(--vp-c-bg-elv);
    border-radius: 25%;
  }

  & ~ svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
}
</style>
