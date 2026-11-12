<script setup lang="ts">
import { useMediaQuery, useMounted } from '@vueuse/core'

import { useData, withBase } from 'vitepress'
import { useLayout } from 'vitepress/theme-without-fonts'
import { computed, ref } from 'vue'
import { useQRCode } from '@/hooks/useQRCode'

import { socialList } from '../composables/socialList'

const { frontmatter, theme } = useData()
const { hasSidebar } = useLayout()
const qrcode = useQRCode(computed(() => theme.value.footer.qrcodeLink))

const isDesktop = useMediaQuery('(min-width: 48rem)')
const mounted = useMounted()
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
  return (mounted.value && isDesktop.value) || openSections.value.has(title)
}
</script>

<template>
  <footer
    v-if="frontmatter.footer !== false && frontmatter.sidebar !== true"
    class="slide-enter footer-container"
    :class="{ 'has-sidebar': hasSidebar }"
    :data-layout="frontmatter.layout || 'doc'"
  >
    <div class="footer-inner">
      <div class="footer-main">
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
        <div class="footer-qrcode">
          <img
            :src="qrcode"
            :alt="theme.footer.qrcodeAlt"
          >
          <h4>{{ theme.footer.qrcodeTitle }}</h4>
          <p>
            {{ theme.footer.qrcodeMessage }}
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copyright">
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
          <p>
            MIT Licensed<br>Made with ❤ by Kongying Tavern
          </p>
        </div>
        <div class="footer-socials">
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
    </div>
  </footer>
</template>

<style scoped>
@import '@/styles/media.css';

.footer-container {
  --footer-gutter: 24px;
  --footer-max-width: 1152px;
  position: relative;
  z-index: 1;
  padding-inline: var(--footer-gutter);
  background-color: var(--vp-c-bg-alt);
  font-family: var(--vp-font-family-base);
  font-size: var(--text-ui-14-fontSize);
  line-height: var(--leading-ui-20);
}

.footer-inner {
  container: footer / inline-size;
  width: 100%;
  max-width: var(--footer-max-width);
  margin-inline: auto;
}

:global(.Layout:has(.TeamPage) .footer-container) {
  --footer-max-width: 960px;
}

:global(.Layout:has(.StaffPage) .footer-container) {
  --footer-gutter: 16px;
  --footer-max-width: 1280px;
}

.footer-container[data-layout='Blog'],
.footer-container[data-layout='Headline'] {
  --footer-max-width: 1104px;
}

.footer-container[data-layout='Blog'] {
  --footer-gutter: 8px;
}

.footer-main {
  display: grid;
  padding-block: 32px 24px;
}

.footer-navigation {
  min-width: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.footer-navigation:first-child {
  border-top: 1px solid var(--vp-c-divider);
}

.footer-title {
  font-weight: 700;
  line-height: var(--leading-ui-20);
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.footer-title button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-block: 16px;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;
}

.footer-title button::after {
  content: '+';
  flex: none;
  width: 16px;
  text-align: center;
  transition: transform 0.3s ease;
}

.footer-navigation.open .footer-title button::after {
  transform: rotate(45deg);
}

.footer-navigation ul {
  display: none;
  padding-block-end: 16px;
}

.footer-navigation.open ul {
  display: block;
}

.footer-navigation a {
  display: block;
  padding-block: 6px;
  line-height: var(--leading-ui-22);
  color: var(--vp-c-text-1);
  overflow-wrap: anywhere;
  transition: color 0.25s;
}

.footer-navigation a:hover {
  color: var(--vp-c-brand);
}

.footer-qrcode {
  display: none;
  width: 192px;
  padding: 24px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  background-color: var(--vp-c-bg-soft-up);
  line-height: var(--leading-ui-22);
  color: var(--vp-c-text-2);
  text-align: center;
}

.footer-qrcode img {
  width: 100%;
  aspect-ratio: 1;
  box-shadow: var(--vp-shadow-1);
}

.footer-qrcode h4 {
  font-size: var(--text-ui-16-fontSize);
  line-height: var(--leading-ui-24);
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.footer-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-block: 0 24px;
}

.footer-copyright {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.footer-copyright > svg {
  flex: none;
}

.footer-copyright p {
  overflow-wrap: anywhere;
}

.footer-socials {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.footer-sociallink {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  justify-content: center;
  align-items: center;
  color: var(--vp-c-text-2);
  border-radius: 25%;
  transition:
    color 0.25s,
    background-color 0.25s;
}

.footer-sociallink:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-elv);
}

.footer-sociallink :deep(svg) {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.footer-title button:focus-visible,
.footer-navigation a:focus-visible,
.footer-sociallink:focus-visible {
  outline: 2px solid var(--vp-c-brand);
  outline-offset: 4px;
}

@media (--site-sm) {
  .footer-container[data-layout='home'] {
    --footer-gutter: 48px;
  }
}

@media (--footer-columns) {
  .footer-container {
    --footer-gutter: 32px;
  }

  .footer-container[data-layout='Blog'],
  .footer-container[data-layout='Headline'] {
    --footer-gutter: 24px;
  }

  :global(.Layout:has(.StaffPage) .footer-container) {
    --footer-gutter: 40px;
  }

  .footer-main {
    grid-template-columns: repeat(2, minmax(0, 1fr)) 192px;
    gap: 32px;
    align-items: start;
    padding-block: 40px;
  }

  .footer-bottom {
    padding-block: 24px;
    border-top: 1px solid var(--vp-c-divider);
  }

  .footer-navigation,
  .footer-navigation:first-child {
    border: none;
  }

  .footer-title button {
    padding-block: 0 16px;
    cursor: default;
  }

  .footer-title button::after {
    display: none;
  }

  .footer-navigation ul {
    display: block;
    padding: 0;
  }

  .footer-qrcode {
    display: flex;
    grid-column: 3;
    grid-row: 1 / span 2;
    justify-self: end;
  }
}

@media (--site-desktop) {
  .footer-container[data-layout='home'] {
    --footer-gutter: 64px;
  }

  .footer-container[data-layout='doc'],
  .footer-container[data-layout='Post'] {
    --footer-max-width: 992px;
  }

  /* Match VPContent's sidebar offset before applying the content gutter. */
  .footer-container.has-sidebar {
    --footer-max-width: none;
    padding-inline-start: calc(var(--vp-sidebar-width) + var(--footer-gutter));
  }
}

@media (--site-wide) {
  .footer-container[data-layout='doc'],
  .footer-container[data-layout='Post'] {
    --footer-max-width: 1104px;
  }

  .footer-container.has-sidebar {
    --footer-max-width: none;
    padding-inline-start: calc(
      (100% - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width) + var(--footer-gutter)
    );
    padding-inline-end: calc((100% - var(--vp-layout-max-width)) / 2 + var(--footer-gutter));
  }
}

/* Keep the QR card beside the navigation only when the content column fits it. */
@container footer (min-width: 896px) {
  .footer-main {
    grid-template-columns: repeat(4, minmax(0, 1fr)) 192px;
  }

  .footer-qrcode {
    grid-column: auto;
    grid-row: auto;
  }
}
</style>
