<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'

import { isLinkExternal, isRelativeLink } from '../utils'

interface CardProps {
  /** Card title */
  title: string
  /** Card description, default is link when empty */
  desc?: string
  /** Card icon, defaults to project Logo */
  logo?: string
  /** Card link */
  link?: string
  /** Card background color */
  color?: string
  /** Card cover image, Only NormalTheme */
  cover?: string
  /** Enable hover shadow effect, defaults to false */
  hoverShadow?: boolean
  /** Enable card shadow effect, defaults to false */
  shadow?: boolean
  /** Card theme, defaults to normal */
  theme?: 'medium' | 'normal'
}

const props = withDefaults(defineProps<CardProps>(), {
  desc: '',
  logo: '',
  color: '',
  link: '',
  cover: '',
  theme: 'normal',
  hoverShadow: false,
  shadow: false,
})

const iconMap: Record<string, string> = {
  'bilibili.com': 'i-custom-bilibili',
  'txc.qq.com': 'i-custom-txc',
  'support.qq.com': 'i-custom-txc',
  'youtube.com': 'i-logos-youtube-icon',
  'twitter.com': 'i-logos-twitter',
  'discord': 'i-logos-discord-icon',
  'reddit.com': 'i-logos-reddit-icon',
  'baidu.com': 'i-custom-baidu',
  'qq.com': 'i-custom-qq',
  'weixitianli.com': 'i-custom-wxtl',
}

function imgLoadHandler(e: Event) {
  const target = e.target as HTMLImageElement
  target.classList.remove('skeleton-animation')
}

function imgErrorHandler(e: Event) {
  const target = e.target as HTMLImageElement
  target.classList.add('load-error')
  target.src = 'https://assets.yuanshen.site/images/noImage.png'
}

const iconLink = computed(() => {
  let icon = ''
  if (props.logo === '' && props.link) {
    const linkDomain = props.link.match(/(?:https?:\/\/)?(?:www\.)?([^/]+)\//)
    if (linkDomain && linkDomain[1]) {
      const domain = linkDomain[1]
      for (const key in iconMap) {
        if (new RegExp(key).test(domain)) {
          icon = iconMap[key]
          break
        }
      }
    }
  }
  return icon
})

const isExternal = computed(() => isLinkExternal(props.link))

const logoLink = computed(() => {
  if (
    props.logo === 'self'
    || props.logo.includes('yuanshen.site')
    || isRelativeLink(props.link)
  ) {
    return withBase('/imgs/common/logo/logo_128.png')
  }
  if (props.logo === '' && iconLink.value === '')
    return 'no-logo'
  return isRelativeLink(props.logo) ? withBase(props.logo) : props.logo
})

const logoMissing = computed(() => logoLink.value === 'no-logo')

const coverLink = computed(() =>
  isRelativeLink(props.cover) ? withBase(props.cover) : props.cover,
)

const descText = computed(() => {
  if (props.desc) {
    return props.desc
  }
  if (isRelativeLink(props.link)) {
    const prefix: string = props.link.substring(0, 3).replace(/(\.\/|\/)/g, '')
    const suffix: string = props.link.substring(3)
    return location.origin + withBase(`/${prefix}${suffix}`)
  }
  return props.link || ''
})
</script>

<template>
  <a
    :href="isExternal ? link : withBase(link)"
    :target="isExternal ? '_blank' : '_self'"
    :class="`card card-theme-${theme} ${hoverShadow ? 'card-hover' : ''}`"
    :title="title"
    :style="{
      ...(color ? { background: color } : null),
      ...(shadow ? { 'box-shadow': 'var(--vp-shadow-1)' } : null),
    }"
    :is-external-link="isExternal ? 'true' : 'false'"
  >
    <div v-if="cover" class="card-cover-container">
      <img
        class="card-cover-img no-zoomable skeleton-animation"
        :src="coverLink"
        @load="imgLoadHandler"
        @error="imgErrorHandler"
      >
    </div>

    <div :class="`card-footer ${logoMissing && !iconLink ? 'no-logo' : ''}`">
      <template v-if="iconLink">
        <label :class="`card-icon ${iconLink}`" />
      </template>
      <template v-else>
        <template v-if="!logoMissing">
          <img class="no-zoomable card-logo" :src="logoLink">
        </template>
      </template>

      <div class="card-content">
        <div class="card-title">
          {{ title }}
        </div>
        <hr>
        <ClientOnly>
          <div class="card-desc">
            {{ descText }}
          </div>
        </ClientOnly>
      </div>
    </div>
  </a>

  <!-- 提前声明Logo，以便Unocss识别导入 -->
  <div v-once hidden>
    <span class="i-logos-youtube-icon" />
    <span class="i-logos-twitter" />
    <span class="i-logos-discord-icon" />
    <span class="i-logos-reddit-icon" />
    <span class="i-logos-google-drive" />
  </div>
</template>

<style lang="scss">
.card {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: center;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background-color: var(--vp-c-bg-alt);
  color: inherit;

  transition:
    all 0.5s,
    box-shadow 0.25s ease,
    border-color 0.25s ease !important;

  text-decoration: none !important;

  &:hover {
    border: 1px var(--vp-c-brand-2) solid;
  }
}

.card-hover:hover {
  transform: translate3d(0, -4px, 0);
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
}

[card-grid] {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  [card-grid] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.card-theme-normal {
  max-width: 360px;
  margin: 1rem 0.5rem;

  .card-cover-contanier {
    position: relative;
    overflow: hidden;
    width: auto;
    margin: 0;
    height: 160px;
    border-radius: 0.75rem 0.75rem 0 0;
  }

  .card-footer {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: auto;
    padding: 1.25rem 1rem;
    margin: 0;
  }

  hr {
    margin: 0.25em 0;
  }
}

@media (max-width: 419px) {
  .card-theme-normal {
    max-width: 95%;
  }
}

.card-icon {
  width: 2em !important;
  height: 2em !important;
  background-color: var(--vp-c-bg-soft);
  margin-right: 1em;
  padding: 1em;
}

.card-logo {
  width: 3em;
  height: 3em;
  margin-right: 1em;
  border-radius: 50%;
}

.card-content,
.card-footer {
  flex: 1;
  width: calc(100% - 6em);
}

.card-title {
  font-weight: 500;
  font-size: 1.1em;
  width: 95%;
  font-family: var(--vp-font-family-subtitle);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.card-desc {
  color: #888;
  font-size: 0.9em;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.card-container {
  display: flex;
  flex-wrap: wrap;
  align-content: stretch;
  align-items: stretch;
  justify-content: center;

  .card {
    flex-basis: calc(50% - 3rem);
    max-width: unset;
    margin: 0.5rem;

    @media (max-width: 959px) {
      flex-basis: 100%;
    }

    @media (max-width: 719px) {
      font-size: 0.95rem;
    }

    @media (max-width: 419px) {
      font-size: 0.9rem;
    }
  }
}

.card-theme-medium {
  width: auto;
  margin: 1rem 0.5rem;
  padding: 0.38rem;

  .card-footer {
    display: flex;
    align-items: center;
  }

  .no-logo {
    padding-left: 1rem;
  }

  .card-logo {
    width: 2.5rem;
    height: 2.5rem;
    margin-left: 0.4rem;
  }

  .card-icon {
    margin-left: 0.5rem;
  }

  .card-title {
    font-size: 1rem;
  }

  .card-desc {
    width: 95%;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &::after {
    content: '';
    --card-icon: url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1.2em' height='1.2em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='M6 7c0 .55.45 1 1 1h7.59l-8.88 8.88a.996.996 0 1 0 1.41 1.41L16 9.41V17c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1z'/%3E%3C/svg%3E");
    mask: var(--card-icon) no-repeat !important;
    -webkit-mask: var(--card-icon) no-repeat !important;
    mask-position: center;
    -webkit-mask-position: center;
    mask-size: 100% 100%;
    background-color: currentColor;
    width: 18px !important;
    height: 18px !important;
    margin-top: -26px !important;
    color: #ccc !important;
    transform: scale(0.85);
  }

  &[is-external-link='false']::after {
    display: none;
  }

  hr {
    display: none;
  }
}
</style>
