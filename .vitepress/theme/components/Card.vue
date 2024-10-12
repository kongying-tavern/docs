<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed, defineProps, withDefaults } from 'vue'
import { isLinkExternal, isRelativeLink } from '../utils'

import '../styles/card.scss'

interface CardProps {
  /**
   * Card title
   *
   * 卡片标题，必填项
   *
   */
  title: string

  /**
   * Card description
   *
   * 卡片描述，为空时默认显示为 link
   */
  desc?: string

  /**
   * Card icon
   *
   * 卡片图标，默认为项目 Logo
   */
  logo?: string

  /**
   * Card link
   *
   * 卡片链接
   */
  link?: string

  /**
   * Card color
   *
   * 卡片链颜色
   */
  color?: string

  /**
   * Card cover
   *
   * 卡片封面，Only NormalTheme
   */
  cover?: string

  /**
   * Card hover shadow
   *
   * 是否启用卡片 hover 时阴影效果，默认启用
   */
  hoverShadow?: boolean

  /**
   * Card shadow
   *
   * 是否启用卡片阴影效果，默认启用
   */
  shadow?: boolean

  /**
   * Card theme
   *
   * 卡片主题，默认 normal
   */
  theme?: 'medium' | 'normal'
}

const props = withDefaults(defineProps<CardProps>(), {
  desc: '',
  logo: '',
  color: '',
  link: '',
  cover: '',
  theme: 'normal',
  hoverShadow: true,
  shadow: false,
})

const iconMap = {
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

const imgLoadHandler = (e) => {
  e.target!.classList.remove('skeleton-animation')
}

const imgErrorHandler = (e) => {
  e.target!.classList.add('load-error')
  e.target!.src = 'https://assets.yuanshen.site/images/noImage.png'
}

const iconLink = computed(() => {
  let icon = ''

  if (props.logo === '' && props.link !== '') {
    const linkDomain = props.link.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)\//)
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
    props.logo === 'self' ||
    props.logo.includes('yuanshen.site') ||
    isRelativeLink(props.link)
  )
    return withBase('/imgs/common/logo/logo_128.png')
  if (props.logo === '' && iconLink.value === '') return 'no-logo'
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
    console.log(location.href)
    return location.origin + withBase(`/${prefix}${suffix}`)
  }
  return props.link
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
    <div v-if="cover" class="card-cover-contanier">
      <img
        class="card-cover-img no-zoomable skeleton-animation"
        :src="coverLink"
        @load="imgLoadHandler"
        @error="imgErrorHandler"
      />
    </div>

    <div :class="`card-footer ${logoMissing && !icon ? 'no-logo' : ''}`">
      <template v-if="iconLink">
        <label :class="`card-icon ${iconLink}`"></label>
      </template>
      <template v-else>
        <template v-if="!logoMissing">
          <img class="card-logo no-zoomable" :src="logoLink" />
        </template>
      </template>

      <div class="card-content">
        <div class="card-title">
          {{ title }}
        </div>
        <hr />
        <ClientOnly>
          <div class="card-desc">
            {{ descText }}
          </div>
        </ClientOnly>
      </div>
    </div>
  </a>

  <!-- 在这里显式声明Logo，给Unocss识别导入 -->
  <div v-once hidden>
    <span class="i-logos-youtube-icon"></span>
    <span class="i-logos-twitter"></span>
    <span class="i-logos-discord-icon"></span>
    <span class="i-logos-reddit-icon"></span>
    <span class="i-logos-google-drive"></span>
  </div>
</template>
