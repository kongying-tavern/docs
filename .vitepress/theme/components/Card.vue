<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'

import { isLinkExternal, isRelativeLink } from '../utils'

import '../styles/card.scss'

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
